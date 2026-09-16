// The one place the badge preferences live in the browser.
//
// The session header badge and the settings page both read this store, so
// flipping the toggle hides the badge immediately — no reload, no second source
// of truth. Load status lives here too, so the settings page can say honestly
// whether it is still loading or cannot reach the host half.

import { RPC_ENDPOINTS } from './api.js';

/**
 * Values used before the host half answers, and if it never does. They must
 * match the host's DEFAULT_PREFS.
 */
export const FALLBACK_PREFS = Object.freeze({
  enabled: true,
  showCountdown: true,
});

/** Coarse load state, for the settings page. */
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
  const listeners = new Set();

  function publish() {
    for (const listener of [...listeners]) listener();
  }

  function adopt(value) {
    if (value === null || typeof value !== 'object') return false;
    if (value.prefs === null || typeof value.prefs !== 'object') return false;
    prefs = { ...FALLBACK_PREFS, ...value.prefs };
    status = LoadStatus.ready;
    if (value.persisted === false) writeFailed = true;
    else if (value.persisted === true) writeFailed = false;
    publish();
    return true;
  }

  return {
    getPrefs: () => prefs,
    getStatus: () => status,
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
        // Falls through to the unreachable branch.
      }
      status = LoadStatus.unreachable;
      // The badge still honours the fallback defaults; they just cannot be
      // changed persistently until the host half answers.
      publish();
    },

    /**
     * Persist a partial patch and adopt the host's normalized result.
     * @returns true when the change reached disk.
     */
    async patch(patch) {
      const result = await rpcCall(RPC_ENDPOINTS.setPrefs, patch);
      if (result?.ok !== true) {
        prefs = { ...prefs, ...patch };
        publish();
        return false;
      }
      adopt(result.value);
      return writeFailed === false;
    },
  };
}
