// The settings page: one section under the shell's Settings navigation.
//
// Registered through the `settings.section` slot, so it gets a full content
// area beside General / Models / Plugins rather than a cramped inline row. The
// controller arrives through the slot's `inject` option rather than a module
// global, which keeps this component free of any assumption about where the
// plugin was mounted.
//
// Styling uses the shell's `--dsw-alias-*` theme tokens with translucent
// neutral fallbacks. The fallbacks matter: a hard-coded light background would
// be unreadable in the dark theme the shell ships with by default.

import { useEffect, useState } from 'react';

import { previewCue } from './cues.js';
import { LoadStatus } from './prefs-store.js';
import { getUiLocale, strings, subscribeUiLocale } from './i18n.js';

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
    <div className="dsn-row">
      <div className="dsn-rowText">
        <div className="dsn-rowLabel">{label}</div>
        {hint === undefined ? null : <div className="dsn-rowHint">{hint}</div>}
      </div>
      <button
        type="button"
        className="dsn-switch"
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

/** A cue picker plus a Preview button. */
function CueRow({ L, label, hint, value, cueNames, disabled, onPick }) {
  return (
    <div className="dsn-row">
      <div className="dsn-rowText">
        <div className="dsn-rowLabel">{label}</div>
        <div className="dsn-rowHint">{hint}</div>
      </div>
      <div className="dsn-cueControls">
        <select
          className="dsn-select"
          value={value}
          disabled={disabled === true}
          aria-label={label}
          onChange={event => onPick(event.target.value)}
        >
          {cueNames.map(name => <option key={name} value={name}>{name}</option>)}
        </select>
        <button
          type="button"
          className="dsn-btn"
          disabled={disabled === true}
          aria-label={`${L.previewAria}: ${label}`}
          onClick={() => onPick(value, true)}
        >
          {L.preview}
        </button>
      </div>
    </div>
  );
}

/** The whole section. */
export function NotificationsSection({ controller }) {
  const locale = useUiLocale();
  const L = strings(locale);
  const prefs = usePrefs(controller);
  const status = controller.getStatus();
  const cueNames = controller.getCueNames();
  const ready = status === LoadStatus.ready;

  const set = (patch) => { void controller.patch(patch); };

  // `preview` distinguishes "audition this cue" from "commit this cue".
  const pick = (field) => (value, preview) => {
    if (preview === true) previewCue(value, controller.getPrefs());
    else set({ [field]: value });
  };

  return (
    <div className="dsn-card">
      <div className="dsn-title">{L.cardTitle}</div>
      <p className="dsn-sub">{L.cardSub}</p>

      {status === LoadStatus.loading ? <div className="dsn-muted">{L.readingPrefs}</div> : null}
      {status === LoadStatus.unreachable ? <div className="dsn-warn">{L.unreachable}</div> : null}
      {controller.didWriteFail() ? <div className="dsn-warn">{L.saveFailed}</div> : null}

      <SwitchRow
        label={L.masterLabel}
        hint={prefs.enabled ? L.masterHintOn : L.masterHintOff}
        on={prefs.enabled === true}
        disabled={!ready}
        onToggle={() => set({ enabled: prefs.enabled !== true })}
      />

      <CueRow
        L={L}
        label={L.doneLabel}
        hint={L.doneHint}
        value={prefs.soundDone}
        cueNames={cueNames}
        disabled={!ready}
        onPick={pick('soundDone')}
      />

      <CueRow
        L={L}
        label={L.needsInputLabel}
        hint={L.needsInputHint}
        value={prefs.soundNeedsInput}
        cueNames={cueNames}
        disabled={!ready}
        onPick={pick('soundNeedsInput')}
      />

      <div className="dsn-row">
        <div className="dsn-rowText">
          <div className="dsn-rowLabel">{L.volumeLabel}</div>
        </div>
        <div className="dsn-volume">
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={Math.round((prefs.volume ?? 0.7) * 100)}
            disabled={!ready}
            aria-label={L.volumeLabel}
            // Live-drag only updates the audible volume; the value is committed
            // on release so dragging does not write the file on every pixel.
            onChange={event => controller.setVolumeLocal(Number(event.target.value) / 100)}
            onMouseUp={event => set({ volume: Number(event.target.value) / 100 })}
            onKeyUp={event => set({ volume: Number(event.target.value) / 100 })}
            onTouchEnd={event => set({ volume: Number(event.target.value) / 100 })}
          />
          <span className="dsn-volumeValue">{Math.round((prefs.volume ?? 0.7) * 100)}</span>
        </div>
      </div>

      <SwitchRow
        label={L.hiddenLabel}
        hint={L.hiddenHint}
        on={prefs.onlyWhenHidden === true}
        disabled={!ready}
        onToggle={() => set({ onlyWhenHidden: prefs.onlyWhenHidden !== true })}
      />
    </div>
  );
}
