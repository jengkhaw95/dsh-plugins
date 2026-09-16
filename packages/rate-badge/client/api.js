// The wire contract between this plugin's two halves. Imported by both, so a
// rename cannot leave the two sides disagreeing while both still build.

/**
 * Loopback RPC channel owned by this plugin.
 *
 * The leading slash is REQUIRED: `assertChannel` in
 * packages/client/connection/src/rpc-host.ts validates against
 * `/^\/[A-Za-z0-9._~-]+$/`, and a bare `dsh-rate-badge` fails with "invalid or
 * reserved RPC channel". That check throws from inside `apply()`, so a wrong
 * channel fails the loader entry and the entire DSH boot — see the guard in
 * lib/index.js, which turns this class of mistake into a degraded settings page
 * rather than a dead harness. One segment only; `/api` is reserved.
 */
export const RPC_CHANNEL = '/dsh-rate-badge';

/** The two endpoints the settings page calls. */
export const RPC_ENDPOINTS = Object.freeze({
  /** Read the stored preferences. */
  getPrefs: 'prefs.get',
  /** Persist a partial preference patch; resolves to the full new preferences. */
  setPrefs: 'prefs.set',
});
