// The session watcher's edge logic.
//
// This is the highest-risk code in the plugin: it decides when a sound plays, and
// every hard requirement lives here — main sessions only, subagents silent, and
// no chime on page load. A fake observable and a fake ctx keep the test
// independent of React, the shell, and the real Session Controller.

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { installSessionWatch } from '../client/watch.js';

/** A minimal stand-in for the shell's ObservableSnapshot. */
function observable(initial) {
  let value = initial;
  const listeners = new Set();
  return {
    getSnapshot: () => value,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    emit(next) {
      value = next;
      for (const listener of [...listeners]) listener();
    },
    get listenerCount() {
      return listeners.size;
    },
  };
}

/** A session list snapshot in the shape `ctx.sessions.list` publishes. */
function listState(entries) {
  const byId = {};
  const ids = [];
  for (const entry of entries) {
    ids.push(entry.sessionId);
    byId[entry.sessionId] = entry;
  }
  return { ids, byId, current: ids[0] };
}

function summary(sessionId, running, extra = {}) {
  return { sessionId, updatedAt: 1, running, blank: false, ...extra };
}

/** Build a watcher over fake services, collecting the cues it fires. */
function harness({ prefs = { enabled: true, soundDone: 'chime', soundNeedsInput: 'sparkle', onlyWhenHidden: false }, list, pending } = {}) {
  const services = {};
  if (list !== undefined) services.sessions = { list };
  if (pending !== undefined) services.uiSession = { pendingInteractions: pending };
  const ctx = { get: (name) => services[name] };
  const fired = [];
  const store = { getPrefs: () => prefs };
  const dispose = installSessionWatch(ctx, store, (reason) => fired.push(reason));
  return { fired, dispose, prefs, list, pending };
}

const PENDING = (key) => new Map([['s1', { key, kind: 'question', sessionId: 's1' }]]);

test('a running to idle edge on a main session fires exactly once', () => {
  const list = observable(listState([summary('s1', true)]));
  const h = harness({ list });

  assert.deepEqual(h.fired, [], 'first sighting is silent');

  list.emit(listState([summary('s1', false)]));
  assert.deepEqual(h.fired, ['done']);

  // Re-publishing the same idle state must not repeat the cue: the edge is
  // running -> idle, not "is idle".
  list.emit(listState([summary('s1', false)]));
  assert.deepEqual(h.fired, ['done']);
});

test('a session already idle at load never fires', () => {
  const list = observable(listState([summary('s1', false)]));
  const h = harness({ list });
  list.emit(listState([summary('s1', false)]));
  list.emit(listState([summary('s1', false)]));
  assert.deepEqual(h.fired, []);
});

test('a second turn fires a second cue', () => {
  const list = observable(listState([summary('s1', true)]));
  const h = harness({ list });
  list.emit(listState([summary('s1', false)]));
  list.emit(listState([summary('s1', true)]));
  list.emit(listState([summary('s1', false)]));
  assert.deepEqual(h.fired, ['done', 'done']);
});

test('subagent sessions are ignored entirely', () => {
  const list = observable(listState([summary('sub', true, { origin: 'subagent' })]));
  const h = harness({ list });
  list.emit(listState([summary('sub', false, { origin: 'subagent' })]));
  assert.deepEqual(h.fired, [], 'a finishing subagent must stay silent');
});

test('a main session still fires while a subagent is running alongside it', () => {
  const main = summary('main', true);
  const sub = summary('sub', true, { origin: 'subagent', parentSessionId: 'main' });
  const list = observable(listState([main, sub]));
  const h = harness({ list });

  // The subagent finishing alone must not cue.
  list.emit(listState([summary('main', true), summary('sub', false, { origin: 'subagent', parentSessionId: 'main' })]));
  assert.deepEqual(h.fired, []);

  // The main session finishing must.
  list.emit(listState([summary('main', false), summary('sub', false, { origin: 'subagent', parentSessionId: 'main' })]));
  assert.deepEqual(h.fired, ['done']);
});

test('a new pending interaction on a main session fires needs-input', () => {
  const list = observable(listState([summary('s1', true)]));
  const pending = observable(new Map());
  const h = harness({ list, pending });

  pending.emit(PENDING('approval-1'));
  assert.deepEqual(h.fired, ['needs-input']);

  pending.emit(PENDING('approval-1'));
  assert.deepEqual(h.fired, ['needs-input'], 'the same interaction never repeats');
});

test('a pending interaction already open at load is silent', () => {
  const list = observable(listState([summary('s1', true)]));
  const pending = observable(PENDING('already-open'));
  const h = harness({ list, pending });
  pending.emit(PENDING('already-open'));
  assert.deepEqual(h.fired, []);
});

test('the first real interaction after an empty load still fires', () => {
  // Regression guard: an "was the previous map empty" test would silence this,
  // which is the ordinary case — a page loads with nothing pending, then the
  // agent asks a question.
  const list = observable(listState([summary('s1', true)]));
  const pending = observable(new Map());
  const h = harness({ list, pending });
  assert.deepEqual(h.fired, []);
  pending.emit(PENDING('first-real-one'));
  assert.deepEqual(h.fired, ['needs-input']);
});

test('a pending interaction for a subagent session is silent', () => {
  const list = observable(listState([summary('sub', true, { origin: 'subagent' })]));
  const pending = observable(new Map());
  const h = harness({ list, pending });
  pending.emit(new Map([['sub', { key: 'approval-1', kind: 'approval', sessionId: 'sub' }]]));
  assert.deepEqual(h.fired, []);
});

test('a pending interaction for a session unknown to the list is silent', () => {
  const list = observable(listState([summary('s1', true)]));
  const pending = observable(new Map());
  const h = harness({ list, pending });
  pending.emit(new Map([['nobody', { key: 'k', kind: 'question', sessionId: 'nobody' }]]));
  assert.deepEqual(h.fired, [], 'unclassifiable sessions are never cued for');
});

test('the master switch silences both cues', () => {
  const list = observable(listState([summary('s1', true)]));
  const pending = observable(new Map());
  const h = harness({ list, pending, prefs: { enabled: false, soundDone: 'chime', soundNeedsInput: 'sparkle', onlyWhenHidden: false } });

  list.emit(listState([summary('s1', false)]));
  pending.emit(PENDING('k'));
  assert.deepEqual(h.fired, []);
});

test('onlyWhenHidden stays quiet while the page is visible', () => {
  // node has no `document`, which the watcher reads as "visible".
  const list = observable(listState([summary('s1', true)]));
  const h = harness({ list, prefs: { enabled: true, soundDone: 'chime', soundNeedsInput: 'sparkle', onlyWhenHidden: true } });
  list.emit(listState([summary('s1', false)]));
  assert.deepEqual(h.fired, []);
});

test('a session that leaves the list and returns is treated as fresh', () => {
  const list = observable(listState([summary('s1', true)]));
  const h = harness({ list });
  list.emit(listState([summary('s1', false)]));
  assert.deepEqual(h.fired, ['done']);
  list.emit(listState([]));                       // removed
  list.emit(listState([summary('s1', false)]));   // returns already idle
  assert.deepEqual(h.fired, ['done'], 'no spurious cue for a returning idle session');
});

test('dispose removes every subscription', () => {
  const list = observable(listState([summary('s1', true)]));
  const pending = observable(new Map());
  const h = harness({ list, pending });
  assert.equal(list.listenerCount, 1);
  assert.equal(pending.listenerCount, 1);

  h.dispose();
  assert.equal(list.listenerCount, 0);
  assert.equal(pending.listenerCount, 0);

  list.emit(listState([summary('s1', false)]));
  assert.deepEqual(h.fired, [], 'a disposed watcher is inert');
});

test('a missing uiSession still watches sessions', () => {
  const list = observable(listState([summary('s1', true)]));
  const h = harness({ list }); // no uiSession service at all
  list.emit(listState([summary('s1', false)]));
  assert.deepEqual(h.fired, ['done']);
});
