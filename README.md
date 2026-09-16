# dsh-plugins

Two small plugins for the DeepSeek Harness (DSH) Web GUI.

| Plugin | What it does |
|---|---|
| [`session-notify`](packages/session-notify) | Plays a sound when your **main** session finishes a turn or needs your input. Subagent sessions stay silent. |
| [`rate-badge`](packages/rate-badge) | Shows a **peak / off-peak** badge in the session header, so you can see when DeepSeek's API is at half price. |

Both are on/off toggles in **Settings**. Neither needs a build step, and neither
has runtime dependencies.

## Install

Requires a DSH Web GUI that already runs. Install both plugins (`web` is the
profile the Web GUI uses):

```sh
dsh plugin --profile web add "github:jengkhaw95/dsh-plugins#path:packages/session-notify"
dsh plugin --profile web add "github:jengkhaw95/dsh-plugins#path:packages/rate-badge"
```

If the shell answers `dsh: command not found`, the launcher just is not on your
`PATH`. Use the row that matches how DSH is installed:

| How DSH is installed | Use instead |
|---|---|
| npm package | `npx @deepseek-ai/dsh plugin --profile web add …` |
| source checkout | `pnpm dsh plugin --profile web add …` (from the checkout root) |
| source checkout, built launcher | `node apps/cli/lib/bin.js plugin --profile web add …` |

It is safe to run these while DSH is open: the command installs the package and
updates your profile's plugin list, then stops.

### Then restart DSH, then reload the page

Both steps, in that order — either one alone is not enough.

- **Restart DSH.** The plugin list is read once at startup, so a new plugin is
  live from the next start. `pnpm dsh web` (from the harness checkout) is a
  restart.
- **Reload the browser tab.** A plugin's browser half is added to the page while
  the page loads, so an already-open tab cannot see it.

## Check that it worked

- **session-notify** — finish a turn in your main session and you hear a chime.
  Cue, volume, and a background-tab option are in **Settings → Notifications**.
- **rate-badge** — a **Peak** or **Off-peak** pill sits next to the session
  title; click it for the countdown and the schedule. Toggles are in
  **Settings → Rate period**.

If nothing appears, see [Troubleshooting](#troubleshooting).

## Update or remove

```sh
dsh plugin --profile web update dsh-session-notify dsh-rate-badge   # newest commit
dsh plugin --profile web remove dsh-session-notify dsh-rate-badge
```

Restart DSH and reload the page after either one.

## Work on the plugins

Install from a local clone instead of from git, so edits are picked up directly:

```sh
git clone https://github.com/jengkhaw95/dsh-plugins
cd dsh-plugins
dsh plugin --profile web add ./packages/session-notify ./packages/rate-badge
```

Each package is standalone — no workspace root, no shared install:

```sh
cd packages/session-notify
npm install
npm test                 # node --test
npm run build:client     # only needed after editing client/
```

`lib/client.js` is committed, which is why installing a plugin never needs a
build. Restart DSH (`pnpm dsh web`) to pick up your edits.

## Troubleshooting

**Installed, restarted, and still nothing — with no error anywhere.** A plugin
that throws while loading is switched off *in your profile* and never retried, so
fixing the code is not enough. Check for a leftover disable:

```sh
cat ~/.dsh/profiles/web/cordis.patch.yml
```

Delete any `disabled: true` entry for `session-notify` or `rate-badge`, then
restart DSH.

**Edited the code and nothing changed.** DSH keeps loading the commit it pinned
at install time if you installed from `github:`. Reinstall with the directory
path (`dsh plugin --profile web add ./packages/session-notify`) to iterate on a
local clone. Details in [docs/plugin-internals.md](docs/plugin-internals.md).

## More detail

- [`packages/session-notify/README.md`](packages/session-notify/README.md) and
  [`packages/rate-badge/README.md`](packages/rate-badge/README.md) — behaviour,
  settings files, known limitations.
- [`docs/plugin-internals.md`](docs/plugin-internals.md) — bundle layout,
  install and update mechanics, and the harness gotchas worth knowing before you
  write a plugin of your own.

## License

MIT — see [LICENSE](LICENSE).
