// The wire contract between this plugin's two halves. Imported by both, so a
// rename cannot leave the two sides disagreeing while both still build.

/** Loopback RPC channel owned by this plugin. */
export const RPC_CHANNEL = 'dsh-rate-badge';

/** The two endpoints the settings page calls. */
export const RPC_ENDPOINTS = Object.freeze({
  /** Read the stored preferences. */
  getPrefs: 'prefs.get',
  /** Persist a partial preference patch; resolves to the full new preferences. */
  setPrefs: 'prefs.set',
});
