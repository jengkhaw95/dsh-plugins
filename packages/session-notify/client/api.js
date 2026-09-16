// The wire contract between this plugin's two halves.
//
// Imported by the host half (lib/index.js) AND the browser half
// (client/index.jsx, bundled into lib/client.js). Keeping one file as the single
// source means a channel or endpoint rename cannot leave the two sides
// disagreeing — the failure mode that is hardest to see, because both halves
// still build.

/** Loopback RPC channel owned by this plugin. Namespaced to avoid collisions. */
export const RPC_CHANNEL = 'dsh-session-notify';

/** The two endpoints the settings page calls. */
export const RPC_ENDPOINTS = Object.freeze({
  /** Read the stored preferences (and the host's cue allowlist). */
  getPrefs: 'prefs.get',
  /** Persist a partial preference patch; resolves to the full new preferences. */
  setPrefs: 'prefs.set',
});
