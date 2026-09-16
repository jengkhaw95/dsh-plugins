// Integration test over the built artifact: loads `lib/client.js` — the exact
// file the shell serves — through a stubbed `window.__ModuleLoader__` and runs
// `apply()` against a fake client context.
//
// This catches the failures that unit tests cannot see: a bundle in the wrong
// wrapper format, exports the module table cannot find, a slot registration the
// shell rejects, or a throw during `apply()` that would leave the plugin
// silently inert until someone reloaded the page and noticed.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const packageDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const bundlePath = join(packageDir, 'lib/client.js');

// ── browser stubs (module scope: `apply()` reads these after evaluation) ────

/** The definition the bundle passed to `window.__ModuleLoader__.load`. */
let captured = null;
/** `<style>` tags `injectCss` appended. */
const injectedStyles = [];

globalThis.window = {
  // Exact global name, trailing underscores included.
  __ModuleLoader__: { load: (definition) => { captured = definition; } },
};
globalThis.document = {
  documentElement: { lang: 'en' },
  querySelectorAll: () => [],
  createElement: () => ({ dataset: {}, textContent: '' }),
  head: { appendChild: (tag) => injectedStyles.push(tag) },
};

/** Load the bundle the way the page does and return its package exports. */
function loadBundle() {
  captured = null;
  injectedStyles.length = 0;
  // eslint-disable-next-line no-new-func -- the bundle is a script by design.
  new Function(readFileSync(bundlePath, 'utf8'))();

  assert.notEqual(captured, null, 'the bundle must call window.__ModuleLoader__.load');
  const required = [];
  const moduleExports = captured.factory((specifier) => {
    required.push(specifier);
    // Empty stubs: apply() registers components without invoking them, so no
    // React or JSX runtime is exercised here.
    return {};
  });
  return { definition: captured, moduleExports, required, styles: injectedStyles };
}

/** A fake client context recording what the plugin registers. */
function fakeClientContext() {
  const registrations = [];
  const injections = [];
  const rpcCalls = [];
  const ctx = {
    get: () => undefined,
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
          return { ok: true, value: { prefs: {}, persisted: true } };
        },
      },
    },
    effect: (callback) => { callback(); return () => {}; },
  };
  return { ctx, registrations, injections, rpcCalls };
}

test('the bundle loads through the module loader under its package name', () => {
  const { definition, moduleExports } = loadBundle();
  assert.equal(definition.id, 'dsh-rate-badge');
  assert.equal(moduleExports.name, 'dsh-rate-badge');
});

test('the bundle exports exactly what the shell needs, with no stray externals', () => {
  const { moduleExports, required } = loadBundle();
  assert.equal(typeof moduleExports.apply, 'function');
  assert.deepEqual([...moduleExports.inject], ['slots', 'connection']);
  for (const specifier of required) {
    assert.ok(
      specifier === 'react' || specifier === 'react/jsx-runtime',
      `unexpected external dependency: ${specifier}`,
    );
  }
});

test('apply injects its stylesheet and registers both seats', () => {
  const { moduleExports, styles } = loadBundle();
  const { ctx, registrations, injections } = fakeClientContext();

  moduleExports.apply(ctx);

  assert.equal(styles.length, 1, 'the stylesheet is injected once');
  assert.equal(styles[0].dataset.plugin, 'dsh-rate-badge');
  assert.ok(styles[0].textContent.includes('.drb-pill'), 'the stylesheet is populated');

  assert.deepEqual(injections, [
    'conversation.session.header.actions',
    'settings.section',
  ]);
  assert.equal(registrations.length, 2);

  const badge = registrations[0].options;
  assert.equal(badge.name, 'conversation.session.header.actions');
  assert.equal(badge.id, 'rate-badge', 'a fresh id, so no shipped action is replaced');
  assert.equal(badge.order, 30, 'the position reserved for pricing chrome');
  assert.ok(badge.inject().controller !== undefined, 'the component gets its controller');

  const section = registrations[1].options;
  assert.equal(section.name, 'settings.section');
  assert.equal(section.id, 'rate-badge', 'a fresh id, so no shipped section is replaced');
  assert.equal(typeof section.label, 'function', 'the nav label follows the locale');
  assert.ok(section.inject().controller !== undefined);
});

test('apply loads preferences over the documented channel', async () => {
  const { moduleExports } = loadBundle();
  const { ctx, rpcCalls } = fakeClientContext();

  moduleExports.apply(ctx);
  await new Promise((resolve) => { setImmediate(resolve); });

  assert.equal(rpcCalls.length, 1);
  assert.equal(rpcCalls[0].channel, '/dsh-rate-badge');
  assert.equal(rpcCalls[0].endpoint, 'prefs.get');
});

test('the same controller instance backs the badge and the settings page', () => {
  const { moduleExports } = loadBundle();
  const { ctx, registrations } = fakeClientContext();

  moduleExports.apply(ctx);

  // One shared store is what makes the settings toggle hide the badge without a
  // reload; two instances would leave the badge stale.
  assert.equal(
    registrations[0].options.inject().controller,
    registrations[1].options.inject().controller,
  );
});
