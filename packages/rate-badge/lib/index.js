/**
 * dsh-rate-badge — host half.
 *
 * The badge itself is pure browser arithmetic against the shipped pricing
 * schedule, so this half carries no rate logic at all. It exists to own
 * `$DSH_HOME/dsh-rate-badge/prefs.json` and the loopback RPC the settings page
 * uses to read and write the on/off preference.
 *
 * @module dsh-rate-badge
 */

import { RPC_CHANNEL, RPC_ENDPOINTS } from '../client/api.js';
import { normalizePrefs, prefsFilePath, readPrefs, writePrefs } from './prefs.js';

export const name = 'dsh-rate-badge';

/** `connection` is required: without it a preference could never be persisted. */
export const inject = ['connection'];

/** A successful RPC value. */
function ok(value) {
  return { ok: true, value };
}

/** A failed RPC value in the shape `ctx.connection.rpc` requires. */
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
  let prefs = readPrefs(file);

  const dispose = ctx.connection.rpc.handle(
    RPC_CHANNEL,
    async (endpoint, payload = {}, signal) => {
      if (signal?.aborted) return fail('cancelled', 'The request was cancelled.');
      try {
        if (endpoint === RPC_ENDPOINTS.getPrefs) return ok({ prefs });
        if (endpoint === RPC_ENDPOINTS.setPrefs) {
          if (payload === null || typeof payload !== 'object') {
            return fail('bad-request', 'payload must be an object of preference fields.');
          }
          const next = normalizePrefs(payload, prefs);
          const persisted = writePrefs(file, next);
          // Adopt in memory even when the write failed: the running page should
          // honour the toggle now, and the failure is reported alongside.
          prefs = next;
          if (!persisted) {
            logger.warn?.(
              'dsh-rate-badge: could not write %s — preference applies to this session only',
              file,
            );
          }
          return ok({ prefs, persisted });
        }
        return fail('bad-request', `Unknown endpoint: ${endpoint}`);
      } catch (error) {
        logger.error?.('dsh-rate-badge: rpc %s failed: %s', endpoint, error?.message ?? error);
        return fail('bad-request', error?.message ?? String(error));
      }
    },
    { authority: 'loopback' },
  );

  ctx.effect(() => () => dispose(), 'dsh-rate-badge: dispose prefs rpc');
}
