// The badge preference file. Same shape as the plugin's other half: tolerant of
// bad input, honest about what it could not save.

import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import {
  DEFAULT_PREFS,
  normalizePrefs,
  prefsFilePath,
  readPrefs,
  writePrefs,
} from '../lib/prefs.js';

test('the badge starts visible with its countdown on', () => {
  assert.equal(DEFAULT_PREFS.enabled, true);
  assert.equal(DEFAULT_PREFS.showCountdown, true);
});

test('normalize rejects non-booleans and drops unknown keys', () => {
  const result = normalizePrefs({ enabled: 'yes', showCountdown: 0, extra: 'nope' });
  assert.equal(result.enabled, DEFAULT_PREFS.enabled);
  assert.equal(result.showCountdown, DEFAULT_PREFS.showCountdown);
  assert.equal('extra' in result, false);
});

test('false is respected, not treated as absent', () => {
  // The bug this guards: `source.enabled || base.enabled` would turn an explicit
  // off back into on.
  const result = normalizePrefs({ enabled: false, showCountdown: false });
  assert.equal(result.enabled, false);
  assert.equal(result.showCountdown, false);
});

test('a partial patch keeps the base values', () => {
  const base = { enabled: false, showCountdown: true };
  assert.deepEqual(normalizePrefs({ showCountdown: false }, base), {
    enabled: false,
    showCountdown: false,
  });
});

test('garbage yields defaults rather than throwing', () => {
  for (const input of [null, undefined, 7, 'text', []]) {
    assert.deepEqual(normalizePrefs(input), { ...DEFAULT_PREFS });
  }
});

test('file round-trip and corrupt-file tolerance', () => {
  const dir = mkdtempSync(join(tmpdir(), 'drb-'));
  try {
    const file = join(dir, 'state', 'prefs.json');
    assert.deepEqual(readPrefs(file), { ...DEFAULT_PREFS }, 'missing file -> defaults');
    assert.equal(writePrefs(file, { enabled: false, showCountdown: false }), true);
    assert.deepEqual(readPrefs(file), { enabled: false, showCountdown: false });
    writeFileSync(file, 'not json at all');
    assert.deepEqual(readPrefs(file), { ...DEFAULT_PREFS }, 'corrupt file -> defaults');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('prefsFilePath honours DSH_HOME', () => {
  assert.equal(prefsFilePath('/custom/home'), '/custom/home/dsh-rate-badge/prefs.json');
});
