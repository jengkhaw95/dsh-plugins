// Integration test over the built artifact.
//
// Everything else in this suite tests source modules directly. This file loads
// `lib/client.js` — the exact file the shell serves — through a stubbed
// `window.__ModuleLoader__` and runs `apply()` against a fake client context.
//
// It exists because the failure modes that matter most here are invisible to
// unit tests: a bundle in the wrong wrapper format, an export name the module
// table does not find, a slot registration whose options the shell rejects, or a
// throw during `apply()` that would leave the plugin silently inert. A page
// reload is not a fast feedback loop; this is.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const packageDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const bundlePath = join(packageDir, 'lib/client.js');

// ── browser stubs ───────────────────────────────────────────────────────────
//
// Installed once at module scope rather than around each evaluation, because
// `apply()` reads `document` and `window` well after the bundle itself has been
// evaluated. Nothing is restored: `node --test` runs each file in its own
// process, so these globals cannot leak into another test file.

/** The definition the bundle passed to `window.__ModuleLoader__.load`. */
let captured = null;
/** `<style>` tags `injectCss` appended, newest last. */
const injectedStyles = [];

globalThis.window = {
  // The exact global the shell defines, trailing underscores included — the
  // bundle calls `window.__ModuleLoader__.load(...)`.
  __ModuleLoader__: { load: (definition) => { captured = definition; } },
  // Present so the plugin's Web Audio probe reports a capable browser.
  AudioContext: function AudioContextStub() {},
};

globalThis.document = {
  documentElement: { lang: 'en' },
  // No pre-existing styles to clear.
  querySelectorAll: () => [],
  createElement: () => ({ dataset: {}, textContent: '' }),
  head: { appendChild: (tag) => injectedStyles.push(tag) },
};

/** A stand-in for the shell's ObservableSnapshot. */
function observable(initial) {
  const listeners = new Set();
  let value = initial;
  return {
    getSnapshot: () => value,
    subscribe: (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
    emit(next) { value = next; for (const l of [...listeners]) l(); },
    get listenerCount() { return listeners.size; },
  };
}

/**
 * Load the bundle the way the page does and hand back its package exports.
 *
 * The bundle is a plain script that calls `window.__ModuleLoader__.load`, so it
 * is evaluated with the stubbed globals above and the captured factory is then
 * invoked with a stubbed `require`. React is never rendered: `apply()` only
 * *registers* components, it does not run them, so empty stubs are sufficient
 * and this test needs no DOM implementation.
 */
function loadBundle() {
  captured = null;
  injectedStyles.length = 0;
  const code = readFileSync(bundlePath, 'utf8');

  // eslint-disable-next-line no-new-func -- the bundle is a script by design.
  new Function(code)();

  assert.notEqual(captured, null, 'the bundle must call window.__ModuleLoader__.load');
  const required = [];
  const moduleExports = captured.factory((specifier) => {
    required.push(specifier);
    // Empty stubs: apply() registers components without invoking them.
    return {};
  });
  return { definition: captured, moduleExports, required, styles: injectedStyles };
}

/** A fake client context recording what the plugin registers. */
function fakeClientContext() {
  const list = observable({ ids: [], byId: {}, current: undefined });
  const pending = observable(new Map());
  const registrations = [];
  const injections = [];
  const effects = [];
  const rpcCalls = [];

  const ctx = {
    get(name) {
      if (name === 'sessions') return { list };
      if (name === 'uiSession') return { pendingInteractions: pending };
      return undefined;
    },
    slots: {
      inject(key, callback) { injections.push(key); callback(); return () => {}; },
      register(options, component) {
        registrations.push({ options, component });
        return () => {};
      },
    },
    connection: {
      rpc: {
        async call(channel, endpoint, payload) {
          rpcCalls.push({ channel, endpoint, payload });
          return { ok: true, value: { prefs: {}, cueNames: [], persisted: true } };
        },
      },
    },
    effect(callback, label) { const dispose = callback(); effects.push({ label, dispose }); return () => {}; },
  };

  return { ctx, list, pending, registrations, injections, effects, rpcCalls };
}

test('the bundle loads through the module loader under its package name', () => {
  const { definition, moduleExports } = loadBundle();
  assert.equal(definition.id, 'dsh-session-notify');
  assert.equal(moduleExports.name, 'dsh-session-notify');
});

test('the bundle exports exactly what the shell needs', () => {
  const { moduleExports, required } = loadBundle();
  assert.equal(typeof moduleExports.apply, 'function');
  assert.deepEqual([...moduleExports.inject], ['slots', 'connection', 'sessions']);
  // Only platform modules may be external; anything else would 404 at runtime.
  for (const specifier of required) {
    assert.ok(
      specifier === 'react' || specifier === 'react/jsx-runtime',
      `unexpected external dependency: ${specifier}`,
    );
  }
});

test('apply runs, injects its stylesheet, and registers the settings section', () => {
  const { moduleExports, styles } = loadBundle();
  const { ctx, registrations, injections, effects } = fakeClientContext();

  moduleExports.apply(ctx);

  assert.equal(styles.length, 1, 'the stylesheet is injected once');
  assert.equal(styles[0].dataset.plugin, 'dsh-session-notify');
  assert.ok(styles[0].textContent.includes('.dsn-card'), 'the stylesheet is actually populated');

  assert.deepEqual(injections, ['settings.section']);
  assert.equal(registrations.length, 1);
  const { options } = registrations[0];
  assert.equal(options.name, 'settings.section');
  assert.equal(options.id, 'session-notify', 'a fresh id, so no shipped section is replaced');
  assert.equal(typeof options.order, 'number');
  assert.equal(typeof options.label, 'function', 'the nav label follows the locale');
  assert.equal(typeof options.inject, 'function');
  // The injected face the component destructures must be present.
  assert.ok(options.inject().controller !== undefined);

  // Exactly one fiber-owned effect: the session watcher.
  assert.equal(effects.length, 1);
  assert.match(effects[0].label, /session watcher/);
});

test('apply subscribes to the session list and the pending-interaction feed', () => {
  const { moduleExports } = loadBundle();
  const { ctx, list, pending } = fakeClientContext();

  moduleExports.apply(ctx);

  assert.equal(list.listenerCount, 1, 'the session list is watched');
  assert.equal(pending.listenerCount, 1, 'pending interactions are watched');
});

test('the watcher is disposed by the effect it was registered in', () => {
  const { moduleExports } = loadBundle();
  const { ctx, list, pending, effects } = fakeClientContext();

  moduleExports.apply(ctx);
  assert.equal(list.listenerCount, 1);

  effects[0].dispose();
  assert.equal(list.listenerCount, 0, 'disposal releases the session list');
  assert.equal(pending.listenerCount, 0, 'disposal releases the pending feed');
});

test('apply loads preferences over the documented channel', async () => {
  const { moduleExports } = loadBundle();
  const { ctx, rpcCalls } = fakeClientContext();

  moduleExports.apply(ctx);
  // `store.load()` is fire-and-forget; let its microtask run.
  await new Promise((resolve) => { setImmediate(resolve); });

  assert.equal(rpcCalls.length, 1);
  assert.equal(rpcCalls[0].channel, '/dsh-session-notify');
  assert.equal(rpcCalls[0].endpoint, 'prefs.get');
});
