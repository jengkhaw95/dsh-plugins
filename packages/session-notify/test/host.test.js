// The host half: the RPC contract the settings page actually depends on.
//
// `apply()` is driven with a fake context, so these tests cover the parts that
// only exist at runtime — the channel name, the loopback authority, the error
// taxonomy, and whether a change really reaches disk. A fake context is enough
// because the half touches exactly two Cordis surfaces: `connection.rpc.handle`
// and `effect`.

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
  let disposed = false;
  const ctx = {
    logger: () => ({ warn() {}, error() {} }),
    connection: {
      rpc: {
        handle(channel, handler, options) {
          registered.push({ channel, handler, options });
          return () => { disposed = true; };
        },
      },
    },
    effect(callback) {
      const cleanup = callback();
      return () => { void cleanup; };
    },
  };
  apply(ctx);
  assert.equal(registered.length, 1, 'apply registers exactly one RPC channel');
  return {
    channel: registered[0].channel,
    options: registered[0].options,
    call: (endpoint, payload, signal) => registered[0].handler(endpoint, payload, signal),
    isDisposed: () => disposed,
  };
}

/**
 * Point $DSH_HOME at a scratch directory for the duration of one test.
 *
 * Awaits `run`: without that, a synchronous `finally` would delete the scratch
 * directory as soon as the callback suspended, and the test would fail on a
 * missing file that its own cleanup had removed.
 */
async function withTempHome(run) {
  const dir = mkdtempSync(join(tmpdir(), 'dsn-host-'));
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
    assert.equal(rpc.channel, '/dsh-session-notify');
    assert.equal(rpc.options.authority, 'loopback');
  });
});

test('prefs.get returns the shipped defaults on a fresh install', async () => {
  await withTempHome(async () => {
    const rpc = mount();
    const result = await rpc.call('prefs.get', {});
    assert.equal(result.ok, true);
    assert.deepEqual(result.value.prefs, {
      enabled: true,
      soundDone: 'chime',
      soundNeedsInput: 'sparkle',
      volume: 0.7,
      onlyWhenHidden: false,
    });
    assert.ok(Array.isArray(result.value.cueNames));
    assert.ok(result.value.cueNames.includes('chime'));
    assert.ok(result.value.cueNames.includes('sparkle'));
    assert.equal(result.value.cueNames.length, 17, 'all bundled cues are offered');
  });
});

test('prefs.set persists a patch and echoes the normalized result', async () => {
  await withTempHome(async (dir) => {
    const rpc = mount();
    const result = await rpc.call('prefs.set', { soundDone: 'pulse', volume: 0.25 });
    assert.equal(result.ok, true);
    assert.equal(result.value.persisted, true);
    assert.equal(result.value.prefs.soundDone, 'pulse');
    assert.equal(result.value.prefs.volume, 0.25);
    assert.equal(result.value.prefs.soundNeedsInput, 'sparkle', 'unpatched fields survive');

    // The whole point of the host half: the change reached disk, and the next
    // process reads it back.
    const written = JSON.parse(
      readFileSync(join(dir, 'dsh-session-notify', 'prefs.json'), 'utf8'),
    );
    assert.equal(written.soundDone, 'pulse');
    assert.equal(written.volume, 0.25);
  });
});

test('a later prefs.get sees the change made through prefs.set', async () => {
  await withTempHome(async () => {
    const rpc = mount();
    await rpc.call('prefs.set', { enabled: false });
    const after = await rpc.call('prefs.get', {});
    assert.equal(after.value.prefs.enabled, false);
  });
});

test('an unknown cue name is rejected by falling back, not by failing the call', async () => {
  await withTempHome(async () => {
    const rpc = mount();
    const result = await rpc.call('prefs.set', { soundDone: 'not-a-real-cue' });
    assert.equal(result.ok, true, 'the call itself still succeeds');
    assert.equal(result.value.prefs.soundDone, 'chime', 'the bad value never lands');
  });
});

test('a non-object payload is a bad-request', async () => {
  await withTempHome(async () => {
    const rpc = mount();
    for (const payload of [null, 42, 'text']) {
      const result = await rpc.call('prefs.set', payload);
      assert.equal(result.ok, false);
      assert.equal(result.error.code, 'bad-request');
      assert.ok(Array.isArray(result.error.details.issues), 'details.issues is required');
    }
  });
});

test('an unknown endpoint is a bad-request naming the endpoint', async () => {
  await withTempHome(async () => {
    const rpc = mount();
    const result = await rpc.call('prefs.nope', {});
    assert.equal(result.ok, false);
    assert.equal(result.error.code, 'bad-request');
    assert.match(result.error.details.issues[0].message, /prefs\.nope/);
  });
});

test('an aborted request answers cancelled', async () => {
  await withTempHome(async () => {
    const rpc = mount();
    const controller = new AbortController();
    controller.abort();
    const result = await rpc.call('prefs.get', {}, controller.signal);
    assert.equal(result.ok, false);
    assert.equal(result.error.code, 'cancelled');
  });
});

test('the effect disposes the RPC channel', async () => {
  await withTempHome(async () => {
    const registered = [];
    let disposed = false;
    const ctx = {
      logger: () => ({ warn() {}, error() {} }),
      connection: {
        rpc: { handle: (channel, handler, options) => {
          registered.push({ channel, handler, options });
          return () => { disposed = true; };
        } },
      },
      // Invoke the disposer the plugin hands back, the way Cordis would.
      effect: (callback) => { callback()(); return () => {}; },
    };
    apply(ctx);
    assert.equal(disposed, true, 'the channel is released with the fiber');
  });
});

// ── regressions from the first published version ────────────────────────────

test('the RPC channel satisfies the host channel pattern', () => {
  // Asserted against the HOST'S rule, not against our own constant. The earlier
  // test compared `rpc.channel` with `RPC_CHANNEL`, which is tautological: a
  // channel of `dsh-session-notify` passed here while being rejected by the real
  // host check, and `assertChannel` throws from inside apply() — so the shipped
  // plugin failed its loader entry and the entire DSH boot along with it.
  //
  // Rule: packages/client/connection/src/rpc-host.ts, `assertChannel` —
  // a leading slash, exactly one path segment, and `/api` reserved.
  const HOST_CHANNEL_PATTERN = /^\/[A-Za-z0-9._~-]+$/;
  assert.match(RPC_CHANNEL, HOST_CHANNEL_PATTERN, 'a leading slash is required');
  assert.notEqual(RPC_CHANNEL, '/api', '/api is reserved by the host');
  assert.equal(RPC_CHANNEL.split('/').length - 1, 1, 'exactly one path segment');
});

test('a rejected channel registration degrades instead of failing the boot', async () => {
  // The real incident, reproduced: the host refuses the channel. A plugin must
  // not be able to stop DSH from starting, so apply() must swallow it and let
  // the settings page report itself unreachable.
  await withTempHome(async () => {
    let logged = '';
    const ctx = {
      logger: () => ({ warn() {}, error: (message) => { logged = String(message); } }),
      connection: {
        rpc: { handle: () => { throw new Error('connection: invalid or reserved RPC channel'); } },
      },
      effect: () => () => {},
    };
    assert.doesNotThrow(() => apply(ctx), 'a bad channel must not escape apply()');
    assert.match(logged, /could not register/, 'and the failure must be reported');
  });
});

test('the fiber still owns a disposer when registration fails', async () => {
  await withTempHome(async () => {
    let effectLabel = '';
    const ctx = {
      logger: () => ({ warn() {}, error() {} }),
      connection: { rpc: { handle: () => { throw new Error('nope'); } } },
      effect: (callback, label) => { callback(); effectLabel = label; return () => {}; },
    };
    apply(ctx);
    assert.match(effectLabel, /dispose prefs rpc/, 'the fiber still owns a disposer');
  });
});
