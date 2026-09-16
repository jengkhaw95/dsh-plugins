// dsh-session-notify — browser half (entry point).
//
// Two responsibilities, wired in `apply()`:
//
//   1. The session watcher. Installed as a plain subscription with no React
//      involved, so a cue fires regardless of what the page is showing. Its
//      disposal belongs to this plugin's fiber via `ctx.effect`.
//   2. The settings page, registered once in `settings.section`.
//
// The preferences store is created here and handed to both, so the watcher's
// decision and the page's controls can never disagree.

import { useEffect, useState } from 'react';

import { RPC_CHANNEL } from './api.js';
import { audioAvailable } from './cues.js';
import { getUiLocale, strings, subscribeUiLocale } from './i18n.js';
import { createPrefsStore } from './prefs-store.js';
import { NotificationsSection } from './SettingsSection.jsx';
import { CSS } from './styles.js';
import { installSessionWatch, playReason } from './watch.js';

export const name = 'dsh-session-notify';

/**
 * `sessions` is a hard dependency — without the session list there is nothing to
 * watch, so the plugin should wait rather than mount inert. `uiSession` supplies
 * the pending-interaction feed but is read optionally, because losing it only
 * costs the "needs your input" cue while "finished" keeps working.
 */
export const inject = ['slots', 'connection', 'sessions'];

/** Attach the stylesheet, replacing any tag a previous version left behind. */
function injectCss() {
  if (typeof document === 'undefined') return;
  for (const stale of document.querySelectorAll('style[data-plugin="dsh-session-notify"]')) {
    stale.remove();
  }
  const tag = document.createElement('style');
  tag.dataset.plugin = 'dsh-session-notify';
  tag.textContent = CSS;
  document.head.appendChild(tag);
}

/** Follow the interface language, for the settings label. */
function useUiLocale() {
  const [locale, setLocale] = useState(getUiLocale);
  useEffect(() => subscribeUiLocale(() => setLocale(getUiLocale())), []);
  return locale;
}

/**
 * Mount both halves of the browser plugin.
 * @param ctx - client root context.
 */
export function apply(ctx) {
  injectCss();

  const rpcCall = (endpoint, payload, signal) =>
    ctx.connection.rpc.call(RPC_CHANNEL, endpoint, payload, signal);

  const store = createPrefsStore(rpcCall);

  // Load once at activation so the watcher has real preferences before the user
  // ever opens the settings page.
  void store.load();

  if (!audioAvailable()) {
    // Fail soft and visibly: the plugin still mounts so the settings page can
    // say why nothing is audible, instead of the section silently missing.
    console.warn('[dsh-session-notify] Web Audio unavailable — cues will not play');
  }

  ctx.effect(
    () => installSessionWatch(ctx, store, (reason, prefs) => playReason(reason, prefs)),
    'dsh-session-notify: session watcher',
  );

  // The navigation label is a function, not a string: the shell re-reads it on
  // render, so switching the interface language relabels this entry live.
  ctx.slots.inject('settings.section', () => ctx.slots.register(
    {
      name: 'settings.section',
      id: 'session-notify',
      // A preference about how the shell behaves, so it sits with the other
      // behaviour sections rather than above them.
      order: 20,
      label: () => strings(getUiLocale()).settingsLabel,
      inject: () => ({ controller: store }),
    },
    NotificationsSection,
  ));
}
