// The badge's host half: channel, loopback authority, error taxonomy, and
// whether the on/off preference really reaches disk. `apply()` is driven with a
// fake context, since the half touches only `connection.rpc.handle` and `effect`.

import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { RPC_CHANNEL } from '../client/api.js';
import { apply } from '../lib/index.js';

/** Run `apply` against a captured RPC registration. */
function mount() {
  const registered = [];
  const ctx = {
    logger: () => ({ warn() {}, error() {} }),
    connection: {
      rpc: {
        handle(channel, handler, options) {
          registered.push({ channel, handler, options });
          return () => {};
        },
      },
    },
    effect(callback) {
      callback();
      return () => {};
    },
  };
  apply(ctx);
  assert.equal(registered.length, 1, 'apply registers exactly one RPC channel');
  return {
    channel: registered[0].channel,
    options: registered[0].options,
    call: (endpoint, payload, signal) => registered[0].handler(endpoint, payload, signal),
  };
}

/** Point $DSH_HOME at a scratch directory; awaited so cleanup cannot race the body. */
async function withTempHome(run) {
  const dir = mkdtempSync(join(tmpdir(), 'drb-host-'));
  const previous = process.env.DSH_HOME;
  process.env.DSH_HOME = dir;
  try {
    return await run(dir);
  } finally {
    if (previous === undefined) delete process.env.DSH_HOME;
    else process.env.DSH_HOME = previous;
    rmSync(dir, { recursive: true, force: true });
  }
}

test('apply registers the documented channel with loopback authority', async () => {
  await withTempHome(() => {
    const rpc = mount();
    assert.equal(rpc.channel, RPC_CHANNEL);
    assert.equal(rpc.channel, 'dsh-rate-badge');
    assert.equal(rpc.options.authority, 'loopback');
  });
});

test('prefs.get returns the badge defaults on a fresh install', async () => {
  await withTempHome(async () => {
    const result = await mount().call('prefs.get', {});
    assert.equal(result.ok, true);
    assert.deepEqual(result.value.prefs, { enabled: true, showCountdown: true });
  });
});

test('the on/off toggle persists to disk and comes back', async () => {
  await withTempHome(async (dir) => {
    const rpc = mount();
    const off = await rpc.call('prefs.set', { enabled: false });
    assert.equal(off.ok, true);
    assert.equal(off.value.persisted, true);
    assert.equal(off.value.prefs.enabled, false);
    assert.equal(off.value.prefs.showCountdown, true, 'the other key is untouched');

    const written = JSON.parse(readFileSync(join(dir, 'dsh-rate-badge', 'prefs.json'), 'utf8'));
    assert.deepEqual(written, { enabled: false, showCountdown: true });

    const after = await rpc.call('prefs.get', {});
    assert.equal(after.value.prefs.enabled, false, 'a later read sees the change');
  });
});

test('a bad payload or endpoint is a bad-request', async () => {
  await withTempHome(async () => {
    const rpc = mount();
    for (const payload of [null, 5, 'x']) {
      const result = await rpc.call('prefs.set', payload);
      assert.equal(result.ok, false);
      assert.equal(result.error.code, 'bad-request');
      assert.ok(Array.isArray(result.error.details.issues));
    }
    const unknown = await rpc.call('prefs.other', {});
    assert.equal(unknown.error.code, 'bad-request');
    assert.match(unknown.error.details.issues[0].message, /prefs\.other/);
  });
});

test('an aborted request answers cancelled', async () => {
  await withTempHome(async () => {
    const controller = new AbortController();
    controller.abort();
    const result = await mount().call('prefs.get', {}, controller.signal);
    assert.equal(result.ok, false);
    assert.equal(result.error.code, 'cancelled');
  });
});

test('the effect disposes the RPC channel', async () => {
  await withTempHome(() => {
    let disposed = false;
    const ctx = {
      logger: () => ({ warn() {}, error() {} }),
      connection: {
        rpc: { handle: () => () => { disposed = true; } },
      },
      effect: (callback) => { callback()(); return () => {}; },
    };
    apply(ctx);
    assert.equal(disposed, true, 'the channel is released with the fiber');
  });
});
