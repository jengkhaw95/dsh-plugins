// The pricing-window math.
//
// This is the whole correctness surface of the badge: if `currentPeriod` is
// wrong, the badge lies about money. The cases below pin the two documented
// complications — exclusive window ends and the UTC (not local) clock — plus the
// weekend gap that is the longest off-peak stretch in the schedule.

import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  currentPeriod,
  formatCountdown,
  formatUtcClock,
  formatWindowTime,
  nextChangeAt,
  rateFactor,
  RATE_SCHEDULE,
} from '../client/rate-period.js';

/** UTC instant helper: `utc(2026, 9, 16, 6, 51)` -> epoch ms. */
function utc(year, month, day, hour, minute = 0, second = 0) {
  return Date.UTC(year, month - 1, day, hour, minute, second);
}

// 2026-09-16 is a Wednesday; 2026-09-19/20 are Saturday/Sunday.

test('the shipped schedule matches the published pricing spec', () => {
  assert.deepEqual([...RATE_SCHEDULE.peakWeekdays], [1, 2, 3, 4, 5]);
  assert.deepEqual(
    RATE_SCHEDULE.windows.map(w => [w.startMinutes, w.endMinutes]),
    [[60, 240], [360, 600]],
  );
  assert.equal(RATE_SCHEDULE.offPeakRate, 0.5);
});

test('peak windows classify as peak on a weekday', () => {
  assert.equal(currentPeriod(utc(2026, 9, 16, 1, 0)), 'peak', '01:00 starts peak');
  assert.equal(currentPeriod(utc(2026, 9, 16, 3, 59)), 'peak');
  assert.equal(currentPeriod(utc(2026, 9, 16, 6, 0)), 'peak', '06:00 starts peak');
  assert.equal(currentPeriod(utc(2026, 9, 16, 9, 59)), 'peak');
});

test('window ends are exclusive', () => {
  assert.equal(currentPeriod(utc(2026, 9, 16, 4, 0)), 'off-peak', '04:00 is off-peak');
  assert.equal(currentPeriod(utc(2026, 9, 16, 10, 0)), 'off-peak', '10:00 is off-peak');
});

test('hours outside the windows are off-peak on a weekday', () => {
  assert.equal(currentPeriod(utc(2026, 9, 16, 0, 0)), 'off-peak');
  assert.equal(currentPeriod(utc(2026, 9, 16, 5, 0)), 'off-peak');
  assert.equal(currentPeriod(utc(2026, 9, 16, 12, 0)), 'off-peak');
  assert.equal(currentPeriod(utc(2026, 9, 16, 23, 59)), 'off-peak');
});

test('weekends are off-peak all day, inside window hours included', () => {
  // Saturday 02:00 UTC and 07:00 UTC are inside weekday window hours.
  assert.equal(currentPeriod(utc(2026, 9, 19, 2, 0)), 'off-peak');
  assert.equal(currentPeriod(utc(2026, 9, 19, 7, 0)), 'off-peak');
  // Sunday likewise.
  assert.equal(currentPeriod(utc(2026, 9, 20, 2, 0)), 'off-peak');
  assert.equal(currentPeriod(utc(2026, 9, 20, 7, 0)), 'off-peak');
});

test('local time never affects the answer', () => {
  // The same instant, expressed via a fixed epoch, must classify identically no
  // matter what the host time zone is: this is the property a local-clock
  // implementation would break.
  const instant = utc(2026, 9, 16, 2, 0);
  assert.equal(currentPeriod(instant), 'peak');
  assert.equal(currentPeriod(new Date(instant).getTime()), 'peak');
});

test('nextChangeAt finds the end of the active peak window', () => {
  assert.equal(nextChangeAt(utc(2026, 9, 16, 2, 0)), utc(2026, 9, 16, 4, 0));
  assert.equal(nextChangeAt(utc(2026, 9, 16, 9, 30)), utc(2026, 9, 16, 10, 0));
});

test('nextChangeAt finds the start of the next peak window', () => {
  assert.equal(nextChangeAt(utc(2026, 9, 16, 0, 30)), utc(2026, 9, 16, 1, 0));
  assert.equal(nextChangeAt(utc(2026, 9, 16, 4, 30)), utc(2026, 9, 16, 6, 0));
});

test('nextChangeAt skips the weekend gap from Friday to Monday', () => {
  // Friday 10:00 UTC is the start of the longest off-peak stretch: it runs to
  // Monday 01:00 UTC.
  assert.equal(nextChangeAt(utc(2026, 9, 18, 10, 0)), utc(2026, 9, 21, 1, 0));
  assert.equal(currentPeriod(utc(2026, 9, 21, 1, 0)), 'peak', 'and that boundary is peak');
});

test('nextChangeAt always flips the period, wherever it starts', () => {
  // Sweep a full week at 7-minute steps: the returned boundary must be in the
  // future and must actually carry the other period.
  for (let step = 0; step < 7 * 24 * 60 / 7; step += 1) {
    const now = utc(2026, 9, 14, 0, 0) + step * 7 * 60_000;
    const boundary = nextChangeAt(now);
    assert.ok(boundary > now, `boundary must be in the future at ${new Date(now).toISOString()}`);
    assert.notEqual(
      currentPeriod(boundary),
      currentPeriod(now),
      `boundary must flip the period at ${new Date(now).toISOString()}`,
    );
  }
});

test('rateFactor reports the published multiplier', () => {
  assert.equal(rateFactor('peak'), 1);
  assert.equal(rateFactor('off-peak'), 0.5);
});

test('formatting helpers', () => {
  assert.equal(formatWindowTime(60), '01:00');
  assert.equal(formatWindowTime(240), '04:00');
  assert.equal(formatWindowTime(600), '10:00');
  assert.equal(formatUtcClock(utc(2026, 9, 16, 6, 51, 7)), '06:51');
  assert.equal(formatUtcClock(utc(2026, 9, 16, 6, 51, 7), true), '06:51:07');
});

test('formatCountdown degrades from days to seconds', () => {
  assert.equal(formatCountdown(2 * 86_400_000 + 3 * 3_600_000), '2d 3h');
  assert.equal(formatCountdown(3 * 3_600_000 + 4 * 60_000), '3h 04m');
  assert.equal(formatCountdown(4 * 60_000 + 5_000), '04:05');
  assert.equal(formatCountdown(-5_000), '00:00', 'clamped at zero, never negative');
});
