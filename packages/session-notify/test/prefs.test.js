// Preference normalization and persistence.
//
// These tests exist because `normalizePrefs` is the only thing standing between
// a hand-edited or future-version prefs.json and the browser half: it is the
// gate that keeps an unknown cue name or a volume of 40 out of the audio path.

import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import {
  CUE_NAMES,
  DEFAULT_PREFS,
  normalizePrefs,
  prefsFilePath,
  readPrefs,
  writePrefs,
} from '../lib/prefs.js';

test('defaults are the documented pair and are complete', () => {
  assert.equal(DEFAULT_PREFS.enabled, true);
  assert.equal(DEFAULT_PREFS.soundDone, 'chime');
  assert.equal(DEFAULT_PREFS.soundNeedsInput, 'sparkle');
  assert.equal(DEFAULT_PREFS.volume, 0.7);
  assert.ok(CUE_NAMES.includes('chime'));
  assert.ok(CUE_NAMES.includes('sparkle'));
  // Every default cue must survive its own validator.
  for (const key of ['soundDone', 'soundNeedsInput']) {
    assert.ok(CUE_NAMES.includes(DEFAULT_PREFS[key]), `${key} default is not a known cue`);
  }
});

test('normalize drops unknown fields and rejects bad values', () => {
  const result = normalizePrefs({
    enabled: 'yes',
    soundDone: 'not-a-cue',
    soundNeedsInput: 'success',
    volume: 'loud',
    onlyWhenHidden: 1,
    evil: 'payload',
  });
  assert.equal(result.enabled, DEFAULT_PREFS.enabled, 'non-boolean enabled falls back');
  assert.equal(result.soundDone, DEFAULT_PREFS.soundDone, 'unknown cue falls back');
  assert.equal(result.soundNeedsInput, 'success', 'valid cue is accepted');
  assert.equal(result.volume, DEFAULT_PREFS.volume, 'non-numeric volume falls back');
  assert.equal(result.onlyWhenHidden, DEFAULT_PREFS.onlyWhenHidden);
  assert.equal('evil' in result, false, 'unknown keys never survive normalization');
});

test('volume is clamped, not rejected, inside the range', () => {
  assert.equal(normalizePrefs({ volume: 0 }).volume, 0);
  assert.equal(normalizePrefs({ volume: 1 }).volume, 1);
  assert.equal(normalizePrefs({ volume: 0.35 }).volume, 0.35);
  // Clamping matches cuelume's own normalizeVolume, so a stored outlier is
  // corrected on the way in rather than silently reverting to the default.
  assert.equal(normalizePrefs({ volume: -3 }).volume, 0);
  assert.equal(normalizePrefs({ volume: 99 }).volume, 1);
  assert.equal(normalizePrefs({ volume: Number.NaN }).volume, DEFAULT_PREFS.volume);
  assert.equal(normalizePrefs({ volume: Infinity }).volume, DEFAULT_PREFS.volume);
});

test('a patch keeps unmentioned fields from the base', () => {
  const base = { ...DEFAULT_PREFS, enabled: false, soundDone: 'bloom', volume: 0.2 };
  const patched = normalizePrefs({ soundNeedsInput: 'error' }, base);
  assert.equal(patched.enabled, false, 'untouched field keeps the current value');
  assert.equal(patched.soundDone, 'bloom');
  assert.equal(patched.volume, 0.2);
  assert.equal(patched.soundNeedsInput, 'error', 'patched field wins');
});

test('garbage input yields defaults rather than throwing', () => {
  for (const input of [null, undefined, 42, 'text', [], true]) {
    assert.deepEqual(normalizePrefs(input), { ...DEFAULT_PREFS });
  }
});

test('read and write round-trip through a real file', () => {
  const dir = mkdtempSync(join(tmpdir(), 'dsn-'));
  try {
    const file = join(dir, 'nested', 'prefs.json');
    assert.deepEqual(readPrefs(file), { ...DEFAULT_PREFS }, 'missing file yields defaults');
    assert.equal(writePrefs(file, { ...DEFAULT_PREFS, soundDone: 'pulse', volume: 0.15 }), true);
    const back = readPrefs(file);
    assert.equal(back.soundDone, 'pulse');
    assert.equal(back.volume, 0.15);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a corrupt file yields defaults instead of throwing', () => {
  const dir = mkdtempSync(join(tmpdir(), 'dsn-'));
  try {
    const file = join(dir, 'prefs.json');
    writeFileSync(file, '{ this is not json');
    assert.deepEqual(readPrefs(file), { ...DEFAULT_PREFS });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('prefsFilePath honours DSH_HOME', () => {
  assert.equal(
    prefsFilePath('/custom/home'),
    '/custom/home/dsh-session-notify/prefs.json',
  );
});
