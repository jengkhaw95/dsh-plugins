# dsh-session-notify

A DSH Web GUI plugin that plays a [cuelume](https://cuelume.dev/) cue when the
**main** session finishes a turn or needs your input.

Subagent sessions never make a sound. When you have several top-level sessions
open, all of them are watched — the distinction is main versus subagent, not
current versus background.

## Behaviour

| Event | Default cue |
|---|---|
| The main session finishes a turn | `chime` — a soft two-note ascending bell |
| The main session is waiting on you (approval, question, or plan review) | `sparkle` — a quick four-note twinkle |

Both cues and the volume are configurable in **Settings → Notifications**. All 17
bundled cuelume cues are offered, each with a **Preview** button so you can
audition one before committing to it. You can also mute cues unless the tab is in
the background, which is worth turning on if DSH lives on a second monitor.

Every cue is synthesized live with the Web Audio API — there are no audio files
and nothing to download. cuelume is inlined into `lib/client.js`, so the installed
plugin has **no runtime dependencies**.

## Settings

Stored in `$DSH_HOME/dsh-session-notify/prefs.json`:

```json
{
  "enabled": true,
  "soundDone": "chime",
  "soundNeedsInput": "sparkle",
  "volume": 0.7,
  "onlyWhenHidden": false
}
```

An unreadable or corrupt file falls back to exactly these values. An unknown cue
name is rejected by falling back rather than by failing the call, so a
hand-edited file can never put an unplayable cue into the audio path.

## When a cue fires, precisely

Two edges are watched, and only two:

- **finished** — a main session's `running` flag goes `true → false`.
- **needs input** — an entry appears in the pending-interaction map for a main
  session.

The first observation of a session, and the first observation of a pending
interaction, only record state. A page that loads while sessions sit idle is
therefore silent; a page that loads with an approval already open does not chime
for it. Cues fire on genuine edges after that.

A session that leaves the session list and later returns counts as a fresh
sighting, so it will not produce a spurious "finished" cue.

Subagents are excluded before any edge is considered, using the harness's own
durable marker (`origin === 'subagent'`). A subagent finishing alongside its
parent is silent; a pending interaction raised inside a subagent session is
silent too.

## Install

```sh
dsh plugin --profile web add "github:jengkhaw95/dsh-plugins#path:packages/session-notify"
```

**Restart DSH, then reload the page.** Adding a bundle to `dsh.profile.bundles` takes effect
on the next boot (only the `cordis.patch.yml` layers are re-read live), and the browser half
is injected into the page at load time.

No build step and no `allowBuilds` approval is needed: `lib/client.js` is committed and the
package declares no `prepare` script, so pnpm has nothing to build. To work on a local
checkout instead, pass the directory (`dsh plugin --profile web add ./packages/session-notify`) — a
profile-patch install is the one form that applies without a restart.

## Build and test

```sh
npm install
npm run build:client   # writes lib/client.js
npm test               # 38 tests
```

`lib/client.js` is committed, so installing does not require a build.

## Implementation

| File | Role |
|---|---|
| `lib/index.js` | Host half: loopback RPC (`prefs.get` / `prefs.set`) over the preference file. No audio, no session access. |
| `lib/prefs.js` | The schema, its validation, and the cue allowlist. |
| `client/index.jsx` | `apply()`: injects CSS, loads preferences, installs the watcher, registers the settings section. |
| `client/watch.js` | The edge logic — the only place that decides whether a cue should play. |
| `client/cues.js` | Everything that touches cuelume. |
| `client/SettingsSection.jsx` | The settings page. |
| `client/api.js` | The wire contract, imported by both halves so a rename cannot desynchronize them. |

The watcher is installed as a plain subscription from `apply()` rather than from
a React component, so a cue fires whatever the page is showing — the
conversation, the settings page, or a different session.

## Known limitations

- A cue is skipped if the browser has never seen a user gesture on the page
  (`navigator.userActivation`), which is cuelume's own autoplay guard. In practice
  the first cue follows a turn you started, so this only affects a page that has
  been open and untouched.
- The cue allowlist in `lib/prefs.js` is a hand-maintained copy of cuelume's cue
  names, so it must be updated alongside a cuelume upgrade. A cue missing from the
  list is not offered and will not persist; the plugin itself still bundles and
  plays the library's full set.
- Preferences are per machine, not per browser profile: two browsers on the same
  host share one file.
