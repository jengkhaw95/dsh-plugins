// The settings page for the badge: one section under the shell's Settings
// navigation, holding the on/off toggle the request asked for plus the popover
// countdown preference.

import { useEffect, useState } from 'react';

import { getUiLocale, strings, subscribeUiLocale } from './i18n.js';
import { LoadStatus } from './prefs-store.js';

/** Follow the interface language. */
function useUiLocale() {
  const [locale, setLocale] = useState(getUiLocale);
  useEffect(() => subscribeUiLocale(() => setLocale(getUiLocale())), []);
  return locale;
}

/** Follow the shared preferences store. */
function usePrefs(controller) {
  const [prefs, setPrefs] = useState(() => ({ ...controller.getPrefs() }));
  useEffect(
    () => controller.subscribe(() => setPrefs({ ...controller.getPrefs() })),
    [controller],
  );
  return prefs;
}

/** A labelled switch row. */
function SwitchRow({ label, hint, on, disabled, onToggle }) {
  return (
    <div className="drb-row-card">
      <div className="drb-rowText">
        <div className="drb-rowLabel">{label}</div>
        {hint === undefined ? null : <div className="drb-rowHint">{hint}</div>}
      </div>
      <button
        type="button"
        className="drb-switch"
        role="switch"
        aria-checked={String(on)}
        aria-label={label}
        data-on={on || undefined}
        disabled={disabled === true}
        onClick={onToggle}
      />
    </div>
  );
}

export function RateBadgeSection({ controller }) {
  const locale = useUiLocale();
  const L = strings(locale);
  const prefs = usePrefs(controller);
  const status = controller.getStatus();
  const ready = status === LoadStatus.ready;

  const set = (patch) => { void controller.patch(patch); };

  return (
    <div className="drb-card">
      <div className="drb-title">{L.cardTitle}</div>
      <p className="drb-sub">{L.cardSub}</p>

      {status === LoadStatus.loading ? <div className="drb-muted">{L.readingPrefs}</div> : null}
      {status === LoadStatus.unreachable ? <div className="drb-warn">{L.unreachable}</div> : null}
      {controller.didWriteFail() ? <div className="drb-warn">{L.saveFailed}</div> : null}

      <SwitchRow
        label={L.badgeToggleLabel}
        hint={prefs.enabled ? L.badgeToggleHintOn : L.badgeToggleHintOff}
        on={prefs.enabled === true}
        disabled={!ready}
        onToggle={() => set({ enabled: prefs.enabled !== true })}
      />

      <SwitchRow
        label={L.countdownLabel}
        hint={L.countdownHint}
        on={prefs.showCountdown === true}
        disabled={!ready || prefs.enabled !== true}
        onToggle={() => set({ showCountdown: prefs.showCountdown !== true })}
      />
    </div>
  );
}
