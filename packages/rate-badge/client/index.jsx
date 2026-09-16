// dsh-rate-badge — browser half (entry point).
//
// Two contributions: the session-header badge and the settings page. Both read
// the same preferences store, so the settings toggle hides the badge on the very
// next render without a reload.

import { useEffect, useState } from 'react';

import { RPC_CHANNEL } from './api.js';
import { getUiLocale, strings, subscribeUiLocale } from './i18n.js';
import { createPrefsStore } from './prefs-store.js';
import { RateBadge } from './RateBadge.jsx';
import { RateBadgeSection } from './SettingsSection.jsx';
import { CSS } from './styles.js';

export const name = 'dsh-rate-badge';

/** `slots` provides the two registration seats; `connection` carries the RPC. */
export const inject = ['slots', 'connection'];

/** Attach the stylesheet, replacing any tag a previous version left behind. */
function injectCss() {
  if (typeof document === 'undefined') return;
  for (const stale of document.querySelectorAll('style[data-plugin="dsh-rate-badge"]')) {
    stale.remove();
  }
  const tag = document.createElement('style');
  tag.dataset.plugin = 'dsh-rate-badge';
  tag.textContent = CSS;
  document.head.appendChild(tag);
}

/** Follow the interface language, for the two navigation labels. */
function useUiLocale() {
  const [locale, setLocale] = useState(getUiLocale);
  useEffect(() => subscribeUiLocale(() => setLocale(getUiLocale())), []);
  return locale;
}

/**
 * The slot content: the badge itself, plus a re-render on language change.
 * The badge owns all of its own state; this wrapper exists only so the pill's
 * accessible label follows the shell language.
 */
function BadgeSlot(props) {
  useUiLocale();
  return <RateBadge {...props} />;
}

/** The settings slot content, same wrapper rationale. */
function SectionSlot(props) {
  useUiLocale();
  return <RateBadgeSection {...props} />;
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
  // Load once at activation: the badge needs real preferences before the user
  // ever opens the settings page.
  void store.load();

  // The badge: a title-adjacent action, additive in a `list` slot.
  ctx.slots.inject('conversation.session.header.actions', () => ctx.slots.register(
    {
      name: 'conversation.session.header.actions',
      id: 'rate-badge',
      // Matches the position the harness reserves for pricing chrome.
      order: 30,
      label: () => strings(getUiLocale()).badgeAria,
      inject: () => ({ controller: store }),
    },
    BadgeSlot,
  ));

  // The settings page: its own section, so the toggles are not cramped into the
  // General list alongside unrelated preferences.
  ctx.slots.inject('settings.section', () => ctx.slots.register(
    {
      name: 'settings.section',
      id: 'rate-badge',
      order: 21,
      label: () => strings(getUiLocale()).settingsLabel,
      inject: () => ({ controller: store }),
    },
    SectionSlot,
  ));
}
