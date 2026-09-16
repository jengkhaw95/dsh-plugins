// The one place preferences live in the browser.
//
// Both the session watcher (which decides whether a cue should play) and the
// settings page (which edits the values) read this store, so a change made in
// the UI takes effect on the very next turn end with no reload and no second
// source of truth. Recovery state lives here too, so the settings page can say
// honestly whether it is still loading, cannot reach the host half, or failed
// to persist a change.

import { CUE_NAMES as LIBRARY_CUES, syncAudio } from './cues.js';
import { RPC_ENDPOINTS } from './api.js';

/**
 * Values used before the host half answers, and if it never does. They must
 * match the host's DEFAULT_PREFS: a fresh install that cannot reach the host
 * should still behave like a fresh install that can.
 */
export const FALLBACK_PREFS = Object.freeze({
  enabled: true,
  soundDone: 'chime',
  soundNeedsInput: 'sparkle',
  volume: 0.7,
  onlyWhenHidden: false,
});

/** Coarse load state of the preferences, for the settings page. */
export const LoadStatus = Object.freeze({
  loading: 'loading',
  ready: 'ready',
  unreachable: 'unreachable',
});

/**
 * Build the preferences store for one plugin activation.
 * @param rpcCall - `(endpoint, payload, signal) => Promise<rpcResult>`.
 */
export function createPrefsStore(rpcCall) {
  let prefs = { ...FALLBACK_PREFS };
  let status = LoadStatus.loading;
  let writeFailed = false;
  // The host's allowlist, once known. Until then the picker falls back to the
  // cue names the bundled library exposes.
  let hostCues = null;
  const listeners = new Set();

  function publish() {
    // Push the new values into the audio library before notifying, so any
    // listener that immediately plays a cue already hears the new volume.
    syncAudio(prefs);
    for (const listener of [...listeners]) listener();
  }

  /** Cue names the settings page may offer: the host's list when known. */
  function cueNames() {
    return hostCues ?? LIBRARY_CUES;
  }

  /** Adopt a host payload ({prefs, cueNames, persisted}). */
  function adopt(value) {
    if (value === null || typeof value !== 'object') return false;
    if (value.prefs === null || typeof value.prefs !== 'object') return false;
    prefs = { ...FALLBACK_PREFS, ...value.prefs };
    if (Array.isArray(value.cueNames) && value.cueNames.length > 0) hostCues = value.cueNames;
    status = LoadStatus.ready;
    // `persisted === false` means the host applied the change in memory but
    // could not write the file; surface it rather than pretending it saved.
    if (value.persisted === false) writeFailed = true;
    else if (value.persisted === true) writeFailed = false;
    publish();
    return true;
  }

  return {
    getPrefs: () => prefs,
    getStatus: () => status,
    getCueNames: cueNames,
    didWriteFail: () => writeFailed,
    subscribe(listener) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },

    /** Read the stored preferences once at activation. */
    async load() {
      try {
        const result = await rpcCall(RPC_ENDPOINTS.getPrefs, {});
        if (result?.ok === true && adopt(result.value)) return;
      } catch {
        // Falls through to the unreachable branch below.
      }
      status = LoadStatus.unreachable;
      // The watcher still runs on the fallback values, so cues work even if the
      // settings page cannot reach the host — they just cannot be persisted.
      publish();
    },

    /**
     * Apply a volume change locally and audibly without persisting it.
     *
     * A range input fires on every pixel of a drag; writing the preference file
     * that often would be absurd. The component calls this while dragging and
     * `patch` once on release.
     */
    setVolumeLocal(value) {
      const volume = Math.min(1, Math.max(0, Number(value)));
      if (!Number.isFinite(volume)) return;
      prefs = { ...prefs, volume };
      publish();
    },

    /**
     * Persist a partial patch and adopt the host's normalized result.
     * @returns true when the change reached disk.
     */
    async patch(patch) {
      const result = await rpcCall(RPC_ENDPOINTS.setPrefs, patch);
      if (result?.ok !== true) {
        // Optimistic local application keeps the UI responsive; the next load()
        // or reload is what would correct a rejected value.
        prefs = { ...prefs, ...patch };
        publish();
        return false;
      }
      adopt(result.value);
      return writeFailed === false;
    },
  };
}
