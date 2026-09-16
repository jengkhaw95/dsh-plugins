// The cue layer: everything that touches cuelume lives here, so the rest of the
// plugin only ever says "play the finished cue" and never has to know about
// AudioContexts or the library's global volume.
//
// cuelume is bundled into lib/client.js rather than left external, so there is
// no download at runtime: every cue is synthesized from a recipe when it plays.
// Two behaviours of the library shape this module:
//
//   * `play()` already resumes a suspended context and is a silent no-op when
//     Web Audio is missing or the page has never been interacted with. We must
//     not "fix" that by forcing playback — a blocked cue is not an error.
//   * `play()` is gated by the library's own `enabled` flag and global volume.
//     The Preview button deliberately bypasses the flag, because previewing a
//     sound you have switched off is the whole point of the button.

import { play, setEnabled, setVolume, sounds } from 'cuelume';

/** Every cue the bundled cuelume version ships, in the library's order. */
export const CUE_NAMES = Object.freeze(Array.isArray(sounds) ? [...sounds] : []);

/** Whether the library has a real cue with this name. */
export function isCue(name) {
  return typeof name === 'string' && CUE_NAMES.includes(name);
}

/** True when this browser can synthesize audio at all. */
export function audioAvailable() {
  if (typeof window === 'undefined') return false;
  return Boolean(window.AudioContext ?? window.webkitAudioContext);
}

/**
 * Push the user's on/off and volume choices into the library.
 * Called on every preference change and immediately before each cue, so the two
 * can never drift apart.
 */
export function syncAudio(prefs) {
  setEnabled(prefs?.enabled !== false);
  if (typeof prefs?.volume === 'number' && Number.isFinite(prefs.volume)) {
    setVolume(prefs.volume);
  }
}

/**
 * Play a notification cue, honouring the master switch.
 * @returns true when the cue was actually handed to the library.
 */
export function playCue(name, prefs) {
  if (!isCue(name)) return false;
  syncAudio(prefs);
  play(name);
  return true;
}

/**
 * Play a cue for the Preview buttons, ignoring the master switch so the user
 * can audition cues before committing to them.
 */
export function previewCue(name, prefs) {
  if (!isCue(name)) return false;
  const volume = typeof prefs?.volume === 'number' ? prefs.volume : 0.7;
  // Library-level `enabled` is a plain flag, not refcounted, so restoring the
  // user's value after the preview is enough — nothing else reads it in between.
  setEnabled(true);
  setVolume(volume);
  play(name);
  setEnabled(prefs?.enabled !== false);
  return true;
}
