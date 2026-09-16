// The session watcher: the part that decides *when* to make a sound.
//
// It runs from `apply()`, not from a React component. That is deliberate — the
// cue must fire whether the user is looking at the conversation, the settings
// page, or a different session entirely, so it cannot depend on any slot being
// mounted.
//
// ── Where the signals come from ─────────────────────────────────────────────
//
// `ctx.sessions.list` is an `ObservableSnapshot<SessionListState>`
// (`{ ids, byId, current, … }`, packages/api/session-controller/src/client/
// sessions/service.ts). Each `byId[id]` is a `SessionSummary`
// (packages/api/session-controller/src/types.ts):
//
//     { sessionId, updatedAt, running, blank, parentSessionId?, origin?: 'subagent', cwd? }
//
// `running` is the agent-actively-working bit, and `origin === 'subagent'` is
// the durable subagent marker — the same test the sidebar's lineage index uses
// (packages/client/ui-workspace/src/client/subagent-lineage.ts), so "main" here
// means exactly what it means there.
//
// `ctx.uiSession.pendingInteractions` is an `ObservableSnapshot` of
// `ReadonlyMap<SessionId, { key, kind, sessionId }>`
// (packages/client/ui-session/src/client/index.ts) — one entry per approval,
// question, or plan review waiting on the human. Its presence *is* "needs your
// input"; we never need to look at `kind`.
//
// ── Why the first observation is silent ────────────────────────────────────
//
// The Session Controller arms its own "done" reminder on a running→idle edge and
// explicitly records the first observation without arming
// (manager.ts,syncCompletedNotifications): a page that loads while sessions sit
// idle must not replay old completions. A notification sound has the same
// requirement, only more so — a reload that chimed for every idle session would
// be unusable. So the first sighting of a session, and the first sighting of a
// pending interaction, only record state. Cues fire on genuine edges after that.

import { playCue } from './cues.js';

/** How a session id classifies for notification purposes. */
const MAIN = 'main';
const SUBAGENT = 'subagent';
const UNKNOWN = 'unknown';

/**
 * Watch every main session and invoke `onCue` on the two edges that matter.
 *
 * @param ctx - client root context.
 * @param store - the preferences store.
 * @param onCue - called with the reason ('done' | 'needs-input').
 * @returns a disposer removing every subscription.
 */
export function installSessionWatch(ctx, store, onCue) {
  const disposers = [];
  /** Last observed `running` bit per main session id. */
  const prevRunning = new Map();
  /** Latest `SessionSummary` per id, used to classify a pending interaction. */
  const summaries = new Map();
  /** Keys (`sessionId::interactionKey`) seen in the pending map. */
  const seenPending = new Set();
  /** False until the first pending scan has run; see {@link scanPending}. */
  let armed = false;

  const sessions = ctx.get('sessions');
  const uiSession = ctx.get('uiSession');

  /** Classify a session id. Anything we cannot positively call main is skipped. */
  function classify(sessionId) {
    const summary = summaries.get(sessionId);
    if (summary !== undefined) return summary.origin === 'subagent' ? SUBAGENT : MAIN;
    // Not in the list snapshot. The controller can still answer authoritatively
    // for an addressed subagent, which keeps a subagent's own approval silent
    // even when it is not a list row.
    if (sessions?.subagentAddress?.(sessionId) !== undefined) return SUBAGENT;
    return UNKNOWN;
  }

  /** Should a cue sound right now, given the invisible-tab preference? */
  function audible() {
    const prefs = store.getPrefs();
    if (prefs.enabled !== true) return false;
    if (prefs.onlyWhenHidden === true) {
      const state = typeof document === 'undefined' ? 'visible' : document.visibilityState;
      if (state === 'visible') return false;
    }
    return true;
  }

  function fire(reason) {
    if (!audible()) return;
    const prefs = store.getPrefs();
    onCue(reason, prefs);
  }

  /* ── running → idle, per main session ──────────────────────────────────── */

  function scanRunning(state) {
    const ids = Array.isArray(state?.ids) ? state.ids : [];
    const byId = state?.byId;
    const seen = new Set();
    for (const id of ids) {
      const summary = byId === undefined || byId === null ? undefined : byId[id];
      if (summary === undefined || summary === null) continue;
      seen.add(id);
      summaries.set(id, summary);
      // Subagents are ignored outright: not watched, and never able to fire.
      if (summary.origin === 'subagent') continue;
      const running = summary.running === true;
      const previous = prevRunning.get(id);
      if (previous === undefined) {
        prevRunning.set(id, running); // first sighting: record, never cue
        continue;
      }
      if (previous && !running) fire('done');
      prevRunning.set(id, running);
    }
    // Forget sessions that left the list, so a later return is a fresh sighting
    // rather than a spurious "finished" edge.
    for (const id of [...prevRunning.keys()]) {
      if (!seen.has(id)) {
        prevRunning.delete(id);
        summaries.delete(id);
      }
    }
  }

  /* ── a new pending interaction on a main session ───────────────────────── */

  function scanPending(map) {
    if (map === undefined || map === null || typeof map.forEach !== 'function') return;
    const next = new Set();
    map.forEach((interaction, sessionId) => {
      const key = `${String(sessionId)}::${String(interaction?.key ?? interaction?.kind ?? '')}`;
      next.add(key);
      // `armed` is set once the first scan has run, whatever it contained.
      // Testing "was the previous map empty" instead would silence the first
      // real interaction on any page that loaded with nothing pending — which
      // is the common case, not the exceptional one.
      if (!seenPending.has(key) && armed && classify(sessionId) === MAIN) fire('needs-input');
    });
    seenPending.clear();
    for (const key of next) seenPending.add(key);
    armed = true;
  }

  /* ── wiring ────────────────────────────────────────────────────────────── */

  const list = sessions?.list;
  if (list !== undefined && typeof list.subscribe === 'function') {
    // Seed before subscribing so classification is available to the pending
    // scan even if it is driven by a different observable.
    try {
      scanRunning(list.getSnapshot());
    } catch {
      // A snapshot read must never take the plugin down.
    }
    disposers.push(list.subscribe(() => {
      try {
        scanRunning(list.getSnapshot());
      } catch {
        // Ignore a transient snapshot shape during reconnect.
      }
    }));
  }

  const pending = uiSession?.pendingInteractions;
  if (pending !== undefined && typeof pending.subscribe === 'function') {
    try {
      scanPending(pending.getSnapshot());
    } catch {
      // Same posture as above.
    }
    disposers.push(pending.subscribe(() => {
      try {
        scanPending(pending.getSnapshot());
      } catch {
        // Same posture as above.
      }
    }));
  }

  return () => {
    for (const dispose of disposers) {
      try {
        dispose();
      } catch {
        // A disposer that throws must not stop the others.
      }
    }
    disposers.length = 0;
  };
}

/**
 * Play the cue for one notification reason.
 * Kept next to the watcher so the reason→cue mapping is in one place.
 */
export function playReason(reason, prefs) {
  const sound = reason === 'needs-input' ? prefs.soundNeedsInput : prefs.soundDone;
  playCue(sound, prefs);
}
