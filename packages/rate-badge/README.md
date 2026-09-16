# dsh-rate-badge

A DSH Web GUI plugin that shows whether DeepSeek's **peak or off-peak** API
pricing window is active, as a badge in the session header.

Peak hours are **01:00–04:00 and 06:00–10:00 UTC, Monday to Friday**; every other
hour is off-peak at half the peak price
([pricing docs](https://api-docs.deepseek.com/quick_start/pricing/)). Window ends
are exclusive, so 04:00 and 10:00 UTC start off-peak hours, and weekends are
off-peak all day.

## What you see

A small pill beside the session title:

- **Peak** — amber dot, full price in force.
- **Off-peak** — green dot, 50% of the peak price.

Clicking it opens a popover with the current rate factor, the UTC clock, a live
countdown to the next change, and the full schedule. Escape or a click outside
closes it.

Everything derives from the browser clock and the shipped schedule. The plugin
issues no host call to answer "which period is it", and the answer never depends
on your local time zone — a local-clock implementation would be wrong for anyone
east or west of UTC.

## Settings

**Settings → Rate period** has two toggles, stored in
`$DSH_HOME/dsh-rate-badge/prefs.json`:

```json
{
  "enabled": true,
  "showCountdown": true
}
```

Setting `enabled` to `false` hides the badge entirely; `showCountdown` controls
the live timer in the popover. Hiding the badge does not change anything about
billing — it is a display preference only.

## Install

```sh
dsh plugin --profile web add "github:jengkhaw95/dsh-plugins#path:packages/rate-badge"
```

**Restart DSH, then reload the page.** Adding a bundle to `dsh.profile.bundles` takes effect
on the next boot (only the `cordis.patch.yml` layers are re-read live), and the browser half
is injected into the page at load time.

No build step and no `allowBuilds` approval is needed: `lib/client.js` is committed and the
package declares no `prepare` script, so pnpm has nothing to build. To work on a local
checkout instead, pass the directory (`dsh plugin --profile web add ./packages/rate-badge`) — a
profile-patch install is the one form that applies without a restart.

## Build and test

```sh
npm install
npm run build:client   # writes lib/client.js
npm test               # 31 tests
```

`lib/client.js` is committed, so installing does not require a build, and the
plugin has no runtime dependencies.

## Implementation

| File | Role |
|---|---|
| `lib/index.js` | Host half: loopback RPC (`prefs.get` / `prefs.set`) over the preference file. |
| `client/rate-period.js` | The pricing-window math, as pure functions over the UTC clock. |
| `client/RateBadge.jsx` | The header pill and its popover. |
| `client/SettingsSection.jsx` | The settings page. |
| `client/api.js` | The wire contract, imported by both halves. |

The badge is registered in `conversation.session.header.actions`, the same
additive seat the harness's own rate-period pill uses, so it sits beside the
session title without shadowing shipped UI.

**The timer has two shapes on purpose.** A closed badge arms a single timeout
aimed at the next period boundary — it does not tick once a second for the ~86,400
seconds of an off-peak day. Only an open popover with a visible countdown runs an
interval. Both live in React effects, so unmounting clears them.

## Relationship to `@deepseek-ai/dsh-client-ui-rate-period`

The harness ships a first-party peak/off-peak pill with a schedule popover. It is
built but **not mounted** by any bundle in this profile.

This plugin is a separate implementation rather than a mount of that package,
because the requested on/off setting cannot govern a statically mounted plugin
row — owning the component is what makes the toggle work.

If you would rather use the shipped pill, add its row to the profile patch and
disable this plugin instead. The two display the same schedule.

## Known limitations

- The schedule is a constant in `client/rate-period.js`. A pricing change is a
  one-line edit plus a `npm run build:client`, not a live configuration.
- The badge appears only when a session is open, since it lives in the
  conversation header rather than in a frame-wide overlay.
- The countdown formats from days down to seconds; there is no absolute
  "next change at HH:MM" line, only the remaining time.
