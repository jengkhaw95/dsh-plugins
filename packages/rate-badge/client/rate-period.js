// Peak/off-peak pricing math — pure functions over the UTC wall clock.
//
// The schedule is the published DeepSeek pricing spec
// (https://api-docs.deepseek.com/quick_start/pricing/): peak hours are
// 01:00–04:00 and 06:00–10:00 UTC, Monday through Friday, and every other hour
// is off-peak at half the peak price.
//
// Window ends are exclusive, so 04:00 and 10:00 UTC are the first off-peak
// instants of their windows. Everything here is derived from `getUTC*` accessors
// on purpose: the answer must not depend on the viewer's local time zone, and a
// local-clock implementation would be wrong for every user east or west of UTC.

/** Milliseconds in one minute. */
export const MINUTE_MS = 60_000;
/** Milliseconds in one UTC day. */
export const DAY_MS = 86_400_000;

/**
 * The shipped schedule. One object, so a future pricing change is a one-line
 * edit rather than a hunt through comparison logic.
 */
export const RATE_SCHEDULE = Object.freeze({
  /** `getUTCDay()` numbers on which peak windows apply (0 = Sunday). */
  peakWeekdays: Object.freeze([1, 2, 3, 4, 5]),
  /** Peak windows as minutes after UTC midnight, ascending and non-overlapping. */
  windows: Object.freeze([
    Object.freeze({ startMinutes: 60, endMinutes: 240 }), // 01:00–04:00 UTC
    Object.freeze({ startMinutes: 360, endMinutes: 600 }), // 06:00–10:00 UTC
  ]),
  /** Off-peak price as a factor of the peak price. */
  offPeakRate: 0.5,
});

function minuteOfDayUtc(date) {
  return date.getUTCHours() * 60 + date.getUTCMinutes();
}

function isPeakWeekday(day) {
  return RATE_SCHEDULE.peakWeekdays.includes(day);
}

function inPeakWindow(minute) {
  return RATE_SCHEDULE.windows.some(
    (window) => minute >= window.startMinutes && minute < window.endMinutes,
  );
}

/**
 * Classify an instant as peak or off-peak.
 * @param nowMs - epoch milliseconds.
 * @returns 'peak' or 'off-peak'.
 */
export function currentPeriod(nowMs) {
  const date = new Date(nowMs);
  return isPeakWeekday(date.getUTCDay()) && inPeakWindow(minuteOfDayUtc(date))
    ? 'peak'
    : 'off-peak';
}

/**
 * The first instant after `nowMs` at which the active period changes.
 *
 * Searching eight days always finds a boundary: the longest off-peak gap runs
 * from Friday 10:00 UTC to Monday 01:00 UTC, and eight days certainly spans it.
 *
 * @param nowMs - epoch milliseconds.
 * @returns epoch milliseconds of the next boundary.
 */
export function nextChangeAt(nowMs) {
  const probe = new Date(nowMs);
  const startOfDay = Date.UTC(probe.getUTCFullYear(), probe.getUTCMonth(), probe.getUTCDate());
  const current = currentPeriod(nowMs);
  for (let day = 0; day < 8; day += 1) {
    const dayStart = startOfDay + day * DAY_MS;
    if (!isPeakWeekday(new Date(dayStart).getUTCDay())) continue;
    for (const window of RATE_SCHEDULE.windows) {
      const startAt = dayStart + window.startMinutes * MINUTE_MS;
      if (startAt > nowMs && currentPeriod(startAt) !== current) return startAt;
      const endAt = dayStart + window.endMinutes * MINUTE_MS;
      if (endAt > nowMs && currentPeriod(endAt) !== current) return endAt;
    }
  }
  // Unreachable for the shipped schedule; returning the far future is a safer
  // degradation than throwing inside a render.
  return nowMs + 8 * DAY_MS;
}

function pad2(value) {
  return value < 10 ? `0${value}` : `${value}`;
}

/** Format minutes after UTC midnight as 'HH:MM'. */
export function formatWindowTime(minutes) {
  return `${pad2(Math.floor(minutes / 60))}:${pad2(minutes % 60)}`;
}

/**
 * Format an instant as a UTC wall clock.
 * @param nowMs - epoch milliseconds.
 * @param withSeconds - include seconds when true.
 */
export function formatUtcClock(nowMs, withSeconds = false) {
  const date = new Date(nowMs);
  const clock = `${pad2(date.getUTCHours())}:${pad2(date.getUTCMinutes())}`;
  return withSeconds ? `${clock}:${pad2(date.getUTCSeconds())}` : clock;
}

/**
 * Compact countdown to a boundary: '2d 3h' from a day out, '3h 04m' from an
 * hour, and 'MM:SS' inside the final hour.
 * @param ms - remaining milliseconds, clamped at zero.
 */
export function formatCountdown(ms) {
  const total = Math.max(0, Math.floor(ms / 1_000));
  const days = Math.floor(total / 86_400);
  const hours = Math.floor(total / 3_600) % 24;
  const minutes = Math.floor(total / 60) % 60;
  const seconds = total % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${pad2(minutes)}m`;
  // Both fields padded: an unpadded `4:05` reads as a clock time, not a timer.
  return `${pad2(minutes)}:${pad2(seconds)}`;
}

/** The pricing multiplier in force for a period, for display. */
export function rateFactor(period) {
  return period === 'peak' ? 1 : RATE_SCHEDULE.offPeakRate;
}
