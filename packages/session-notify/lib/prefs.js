// dsh-session-notify user preferences: the durable half of the settings page.
//
// Why the host owns this at all: a cue only ever plays in the browser, but the
// choice must survive a page reload and a DSH restart, so the browser half asks
// the host to persist it. Nothing here is machine-identifying — the file holds
// five scalars and no paths, hostnames, or tokens.
//
// Posture, inherited from the reference plugin in this profile (dsh-remote-
// tailscale/lib/prefs.js): an unreadable or corrupt file silently falls back to
// the defaults. A preferences file is a convenience, never a gate — refusing to
// start because a JSON file has a stray comma would be worse than the default.

import fs from 'node:fs';
import path from 'node:path';
import { homedir } from 'node:os';

/** Directory under $DSH_HOME that owns this plugin's state file. */
export const STATE_DIRNAME = 'dsh-session-notify';
/** Preference file name inside {@link STATE_DIRNAME}. */
export const PREFS_FILENAME = 'prefs.json';

/**
 * Every cue name cuelume 0.2.2 can synthesize. Duplicated deliberately: the
 * host half validates what it writes to disk and must not import a browser-only
 * package to do it. Kept in the same order the library reports them.
 */
export const CUE_NAMES = Object.freeze([
  'chime',
  'sparkle',
  'droplet',
  'bloom',
  'whisper',
  'tick',
  'press',
  'release',
  'toggle',
  'success',
  'error',
  'page',
  'loading',
  'ready',
  'pulse',
  'scan',
  'arrival',
]);

/**
 * Shipped defaults. `enabled: true` because the user installed this plugin to
 * hear it; the two cues are the pair the request named — a soft ascending bell
 * for "finished", a brighter twinkle for "your turn".
 */
export const DEFAULT_PREFS = Object.freeze({
  enabled: true,
  soundDone: 'chime',
  soundNeedsInput: 'sparkle',
  volume: 0.7,
  onlyWhenHidden: false,
});

/** Resolve $DSH_HOME the same way every other DSH surface does. */
export function resolveDshHome(env = process.env) {
  return env.DSH_HOME || path.join(homedir(), '.dsh');
}

/** Absolute path of the preference file. */
export function prefsFilePath(home = resolveDshHome()) {
  return path.join(home, STATE_DIRNAME, PREFS_FILENAME);
}

function isCue(value) {
  return typeof value === 'string' && CUE_NAMES.includes(value);
}

function clamp01(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.min(1, Math.max(0, value));
}

/**
 * Fold arbitrary input onto a known-good preference object, field by field.
 * Anything unrecognized is dropped rather than passed through, so a hand-edited
 * or future-version file can never smuggle an unknown shape into the browser.
 *
 * `base` supplies the values a partially-valid patch keeps. Normalizing a patch
 * against the current preferences (rather than against the shipped defaults) is
 * what makes a one-key `setPrefs` call from the settings page work.
 *
 * @param raw - candidate values, already parsed from JSON or off the wire.
 * @param base - values to keep for fields `raw` does not carry.
 * @returns a complete, validated preference object.
 */
export function normalizePrefs(raw, base = DEFAULT_PREFS) {
  const source = raw === null || typeof raw !== 'object' ? {} : raw;
  const volume = clamp01(source.volume);
  return {
    enabled: typeof source.enabled === 'boolean' ? source.enabled : base.enabled,
    soundDone: isCue(source.soundDone) ? source.soundDone : base.soundDone,
    soundNeedsInput: isCue(source.soundNeedsInput) ? source.soundNeedsInput : base.soundNeedsInput,
    volume: volume === null ? base.volume : volume,
    onlyWhenHidden:
      typeof source.onlyWhenHidden === 'boolean' ? source.onlyWhenHidden : base.onlyWhenHidden,
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

/**
 * Best-effort write. Returns false instead of throwing so a read-only or
 * full disk degrades to "the toggle did not stick" rather than a failed RPC in
 * the middle of a settings interaction.
 */
export function writePrefs(file, prefs) {
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, `${JSON.stringify(normalizePrefs(prefs), null, 2)}\n`, 'utf8');
    return true;
  } catch {
    return false;
  }
}
