// dsh-rate-badge user preferences.
//
// Only two values, and neither is machine-identifying: whether the badge shows
// at all, and whether its popover counts down to the next boundary. Unreadable
// or corrupt files fall back to the shipped defaults, the same posture as the
// rest of this profile's plugins — a preferences file is a convenience, never a
// gate on starting.

import fs from 'node:fs';
import path from 'node:path';
import { homedir } from 'node:os';

/** Directory under $DSH_HOME that owns this plugin's state file. */
export const STATE_DIRNAME = 'dsh-rate-badge';
/** Preference file name inside {@link STATE_DIRNAME}. */
export const PREFS_FILENAME = 'prefs.json';

/** Defaults: the badge is the point of the plugin, so it starts visible. */
export const DEFAULT_PREFS = Object.freeze({
  enabled: true,
  showCountdown: true,
});

/** Resolve $DSH_HOME the same way every other DSH surface does. */
export function resolveDshHome(env = process.env) {
  return env.DSH_HOME || path.join(homedir(), '.dsh');
}

/** Absolute path of the preference file. */
export function prefsFilePath(home = resolveDshHome()) {
  return path.join(home, STATE_DIRNAME, PREFS_FILENAME);
}

/**
 * Fold arbitrary input onto a known-good preference object.
 *
 * `base` supplies the values a partial patch keeps, which is what lets the
 * settings page send a single changed key.
 *
 * @param raw - candidate values from JSON or off the wire.
 * @param base - values to keep for fields `raw` does not carry.
 * @returns a complete, validated preference object.
 */
export function normalizePrefs(raw, base = DEFAULT_PREFS) {
  const source = raw === null || typeof raw !== 'object' ? {} : raw;
  return {
    enabled: typeof source.enabled === 'boolean' ? source.enabled : base.enabled,
    showCountdown:
      typeof source.showCountdown === 'boolean' ? source.showCountdown : base.showCountdown,
  };
}

/** Read the preference file; missing, unreadable, or corrupt yields defaults. */
export function readPrefs(file) {
  try {
    return normalizePrefs(JSON.parse(fs.readFileSync(file, 'utf8')));
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

/** Best-effort write; false means "the toggle did not stick", not a crash. */
export function writePrefs(file, prefs) {
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, `${JSON.stringify(normalizePrefs(prefs), null, 2)}\n`, 'utf8');
    return true;
  } catch {
    return false;
  }
}
