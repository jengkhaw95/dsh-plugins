/**
 * dsh-session-notify — host half.
 *
 * The plugin is a browser feature with a durable preference file: the cue is
 * synthesized in the page, but the choice of cue, volume, and on/off state has
 * to outlive a reload. The host half is therefore deliberately small — it owns
 * `$DSH_HOME/dsh-session-notify/prefs.json` and the loopback RPC the settings
 * page uses to read and write it. It never touches audio, and it never sees a
 * session.
 *
 * @module dsh-session-notify
 */

import { RPC_CHANNEL, RPC_ENDPOINTS } from '../client/api.js';
import {
  CUE_NAMES,
  normalizePrefs,
  prefsFilePath,
  readPrefs,
  writePrefs,
} from './prefs.js';

export const name = 'dsh-session-notify';

/**
 * `connection` is a hard dependency: without `ctx.connection.rpc` there is no
 * way to persist a preference, and the settings page would come up dead. Letting
 * Cordis hold the plugin in `waiting` until the service appears is more honest
 * than mounting a half that silently cannot save.
 */
export const inject = ['connection'];

/** A successful RPC value. */
function ok(value) {
  return { ok: true, value };
}

/**
 * A failed RPC value in the shape `ctx.connection.rpc` requires. The error
 * taxonomy is the DSH one: `bad-request` carries `details.issues`, `cancelled`
 * carries empty details.
 */
function fail(code, message) {
  if (code === 'cancelled') {
    return { ok: false, error: { code: 'cancelled', message, details: {} } };
  }
  return { ok: false, error: { code: 'bad-request', message, details: { issues: [{ message }] } } };
}

/**
 * Mount the plugin: load preferences once, then serve them over loopback RPC.
 * @param ctx - the plugin's Cordis context.
 */
export function apply(ctx) {
  const logger = ctx.logger?.(name) ?? console;
  const file = prefsFilePath();

  // Read once at mount; every later read is served from memory, so a settings
  // page render never touches the disk. The file is the source of truth only at
  // process start — which is exactly the lifetime the user expects of a setting
  // they changed in the UI.
  let prefs = readPrefs(file);

  // Registration is guarded on purpose. `handle()` validates the channel and
  // throws on a bad one, and a throw out of `apply()` fails the loader entry —
  // which fails the ENTIRE DSH boot ("plugin tree failed to load"). A plugin
  // must not be able to stop the harness from starting, so a registration
  // failure degrades to "the settings page cannot save" instead: `prefs.get`
  // never answers, the client store reports itself unreachable, and the page
  // says so. The cue watcher keeps working throughout.
  let dispose = () => {};
  try {
    dispose = ctx.connection.rpc.handle(
      RPC_CHANNEL,
      async (endpoint, payload = {}, signal) => {
        if (signal?.aborted) return fail('cancelled', 'The request was cancelled.');
        try {
          if (endpoint === RPC_ENDPOINTS.getPrefs) {
            // `cueNames` travels with the preferences so the settings page can
            // offer exactly the set this host will accept back — the picker can
            // never show an option that silently fails to persist.
            return ok({ prefs, cueNames: [...CUE_NAMES] });
          }
          if (endpoint === RPC_ENDPOINTS.setPrefs) {
            if (payload === null || typeof payload !== 'object') {
              return fail('bad-request', 'payload must be an object of preference fields.');
            }
            const next = normalizePrefs(payload, prefs);
            const persisted = writePrefs(file, next);
            // Adopt the new values in memory even when the write failed: the
            // running page should honour what the user just asked for, and the
            // failure is reported alongside rather than swallowed.
            prefs = next;
            if (!persisted) {
              logger.warn?.(
                'dsh-session-notify: could not write %s — preferences apply to this session only',
                file,
              );
              return ok({ prefs, cueNames: [...CUE_NAMES], persisted: false });
            }
            return ok({ prefs, cueNames: [...CUE_NAMES], persisted: true });
          }
          return fail('bad-request', `Unknown endpoint: ${endpoint}`);
        } catch (error) {
          logger.error?.(
            'dsh-session-notify: rpc %s failed: %s',
            endpoint,
            error?.message ?? error,
          );
          return fail('bad-request', error?.message ?? String(error));
        }
      },
      { authority: 'loopback' },
    );
  } catch (error) {
    logger.error?.(
      'dsh-session-notify: could not register the %s RPC channel — settings will not persist: %s',
      RPC_CHANNEL,
      error?.message ?? error,
    );
  }

  // The RPC registration belongs to this plugin's fiber: stop, update, or
  // removal must take the channel down with it.
  ctx.effect(() => () => dispose(), 'dsh-session-notify: dispose prefs rpc');
}
