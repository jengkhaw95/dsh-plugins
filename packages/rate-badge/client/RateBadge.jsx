// The session-header badge and its popover.
//
// Registered in `conversation.session.header.actions`, the same additive seat
// the harness's own rate-period pill uses, so it sits beside the session title
// without shadowing any shipped UI.
//
// ── Why the timer has two shapes ────────────────────────────────────────────
//
// A closed badge only changes when the period changes, so it sleeps on a single
// timeout aimed at the next boundary instead of waking 86,400 times a day. Once
// the popover is open with a countdown visible, it ticks once a second. Both
// timers belong to a React effect, so unmounting the badge clears them.

import { useEffect, useRef, useState } from 'react';

import { getUiLocale, strings, subscribeUiLocale } from './i18n.js';
import {
  currentPeriod,
  formatCountdown,
  formatUtcClock,
  nextChangeAt,
  rateFactor,
} from './rate-period.js';

/** Follow the interface language. */
function useUiLocale() {
  const [locale, setLocale] = useState(getUiLocale);
  useEffect(() => subscribeUiLocale(() => setLocale(getUiLocale())), []);
  return locale;
}

/** A small status dot, coloured by the active period. */
function PeriodDot({ period }) {
  return <span className={`drb-dot drb-dot-${period}`} aria-hidden="true" />;
}

export function RateBadge({ controller }) {
  const locale = useUiLocale();
  const L = strings(locale);
  const [prefs, setPrefs] = useState(() => ({ ...controller.getPrefs() }));
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const rootRef = useRef(null);

  useEffect(
    () => controller.subscribe(() => setPrefs({ ...controller.getPrefs() })),
    [controller],
  );

  const showCountdown = prefs.showCountdown !== false;

  // Boundary timer: always armed, so the pill is already correct when the
  // period flips even if the popover never opens.
  useEffect(() => {
    const remaining = Math.max(250, nextChangeAt(Date.now()) - Date.now() + 50);
    const id = setTimeout(() => setNow(Date.now()), remaining);
    return () => clearTimeout(id);
  }, [now]);

  // Live seconds, only while they are actually on screen.
  useEffect(() => {
    if (!open || !showCountdown) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(id);
  }, [open, showCountdown]);

  // Dismiss on outside click or Escape while open.
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (rootRef.current !== null && !rootRef.current.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  // Hidden entirely when switched off. The preference is read from the shared
  // store, so the settings toggle takes effect on the next render.
  if (prefs.enabled !== true) return null;

  const period = currentPeriod(now);
  const isPeak = period === 'peak';
  const label = isPeak ? L.peak : L.offPeak;
  const factor = rateFactor(period);
  const boundary = nextChangeAt(now);

  return (
    <div className="drb-root" ref={rootRef}>
      <button
        type="button"
        className="drb-pill"
        data-period={period}
        aria-expanded={open}
        aria-label={`${L.badgeAria}: ${label}`}
        title={`${L.badgeAria}: ${label}`}
        onClick={() => setOpen(value => !value)}
      >
        <PeriodDot period={period} />
        <span className="drb-pillLabel">{label}</span>
      </button>

      {open ? (
        <div className="drb-popover" role="dialog" aria-label={L.badgeAria}>
          <div className="drb-popHead">
            <PeriodDot period={period} />
            <span className="drb-popPeriod">{label}</span>
            <button
              type="button"
              className="drb-popClose"
              aria-label={L.closePopover}
              onClick={() => setOpen(false)}
            >
              ×
            </button>
          </div>

          <dl className="drb-rows">
            <div className="drb-row">
              <dt>{L.rateLabel}</dt>
              <dd>
                {isPeak ? L.ratePeakValue : L.rateOffPeakValue}
                <span className="drb-mono drb-factor">{factor}×</span>
              </dd>
            </div>
            <div className="drb-row">
              <dt>{L.utcClockLabel}</dt>
              <dd className="drb-mono">{formatUtcClock(now, showCountdown)}</dd>
            </div>
            {showCountdown ? (
              <div className="drb-row">
                <dt>{L.nextChangeLabel}</dt>
                <dd className="drb-mono">{formatCountdown(boundary - now)}</dd>
              </div>
            ) : null}
            <div className="drb-row">
              <dt>{L.scheduleLabel}</dt>
              <dd>
                {L.scheduleValue}
                <div className="drb-note">{L.allOtherOffPeak}</div>
              </dd>
            </div>
          </dl>
        </div>
      ) : null}
    </div>
  );
}
