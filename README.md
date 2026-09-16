# dsh-plugins

Two local plugins for the DeepSeek Harness Web GUI, each a self-contained
installable bundle.

| Package | What it does |
|---|---|
| [`packages/session-notify`](packages/session-notify) | Plays a [cuelume](https://cuelume.dev/) cue when the **main** session finishes a turn or needs your input. Subagent sessions stay silent. |
| [`packages/rate-badge`](packages/rate-badge) | A session-header badge showing whether DeepSeek's **peak or off-peak** API pricing window is active, with an on/off setting. |

Both follow the bundle convention described in the harness's own
[publish guide](../../deepseek-harness/docs/user/develop/basic/publish.md): a
`package.json` declaring `dsh.bundle` and `dsh.client`, a `cordis.patch.yml`
layer, a Node host half, and a browser half bundled by esbuild into
`lib/client.js`.

## Layout

```
packages/session-notify/
├── package.json          # dsh.bundle (patch) + dsh.client (platform: web)
├── cordis.patch.yml      # the loader row this bundle inserts
├── lib/
│   ├── index.js          # host half: loopback RPC over the preference file
│   ├── prefs.js          # the preference schema + validation
│   └── client.js         # BUILD OUTPUT — the served browser bundle
├── client/               # browser-half source (bundled into lib/client.js)
│   ├── index.jsx         # apply(): slots + the session watcher
│   ├── watch.js          # when to make a sound
│   ├── cues.js           # everything that touches cuelume
│   ├── SettingsSection.jsx
│   ├── prefs-store.js
│   ├── i18n.js
│   ├── styles.js
│   └── api.js            # the wire contract, imported by BOTH halves
├── scripts/build-client.mjs
└── test/                 # node:test — 32 tests
```

`packages/rate-badge` has the same shape, minus the audio layer and plus
`client/rate-period.js` (the pricing-window math).

## Install

Each plugin installs straight from this repository. pnpm supports a git
subdirectory spec (`#path:`), so one repository can hold both bundles:

```sh
dsh plugin --profile web add "github:jengkhaw95/dsh-plugins#path:packages/session-notify"
dsh plugin --profile web add "github:jengkhaw95/dsh-plugins#path:packages/rate-badge"
```

`dsh plugin` forwards to pnpm in the profile directory and then adds each
installed package to `dsh.profile.bundles`, so the bundle's own
`cordis.patch.yml` becomes the layer that mounts it.

**`dsh` is the launcher, and it is not always on your `PATH`.** Use whichever
form matches how DSH is installed on the machine:

| How DSH is installed | Install a plugin with |
|---|---|
| npm package | `npx @deepseek-ai/dsh plugin --profile web add …` |
| source checkout | `pnpm dsh plugin --profile web add …` (run from the checkout root) |
| source checkout, built launcher | `node apps/cli/lib/bin.js plugin --profile web add …` |

All three are the same command; only the way the launcher is reached differs.
The plugin subcommand never boots the harness — it only runs pnpm and rewrites
the profile manifest — so it is safe to run while DSH is up.

**No build step and no `allowBuilds` prompt.** Git installs normally run the
package's `prepare` script, which pnpm ≥10 blocks until you allowlist it. These
packages deliberately declare no `prepare` script: `lib/client.js` is committed,
so the artifact pnpm needs is already in the tree. That also means the
`devDependencies` — esbuild and cuelume — are never installed, because pnpm only
installs devDependencies of a git dependency when it has a script to run.
Regenerating the bundle is a local concern:

```sh
cd packages/session-notify && npm install && npm run build:client
```

**Two gates before you see anything: restart DSH, then reload the page.**

- **Restart DSH.** `dsh.profile.bundles` is composed once at boot
  (`composeLive()` in `apps/cli/src/profile-boot.ts` re-reads only the two
  `cordis.patch.yml` files), so a bundle added to that list mounts on the next
  start, not immediately. `patchReload: live` covers patch-file edits only.
- **Reload the browser page.** The client entry graph is injected into the HTML
  at page load, so an already-open tab cannot see a newly mounted browser half
  even once the host half is up.

### Do not also insert the rows by hand

A tempting shortcut is to add `- insert: [id: session-notify, …]` to the
profile's own `cordis.patch.yml` so the plugin appears without a restart.
**Don't** — `insert` *appends* and never replaces by id
(`vendor/include/src/index.ts`: `data.push(...insert)`), so the row would exist
twice and the plugin would mount twice, registering its RPC channel and its
settings section a second time. Overriding a row by id requires a non-insert
patch (`- id: session-notify, disabled: true`), not a second insert.

### Updating: git install vs local link

Weight this before choosing, because it decides what `git reset --hard` does.

| | `dsh plugin … add github:…` | `dsh plugin … add ./packages/…` |
|---|---|---|
| On disk | tarball extracted into the profile | `link:` → a symlink to this repo |
| Commit | **pinned** in the profile's `pnpm-lock.yaml` | whatever the working tree is |
| After `git reset --hard` | **nothing changes** — DSH still loads the pinned commit | DSH loads the new code on the next start |
| To update | `dsh plugin --profile web update dsh-session-notify` | `pnpm dsh web` |
| Good for | shipping, other machines, a known-good version | iterating on these plugins here |

Both were verified end to end: in each case both plugins activate, appear in the
client entry graph with their inject edges, and their combo script is served with
the expected loader ids.

So the development loop is only these three commands if you install the **local
link**:

```sh
git fetch && git reset --hard
pnpm dsh web          # from the deepseek-harness checkout
```

With the git install in place you are one command short — `git reset --hard`
updates this repo, but the profile keeps loading the pinned tarball, so a change
looks like it did nothing. Switch to the local link with:

```sh
dsh plugin --profile web remove dsh-session-notify dsh-rate-badge
dsh plugin --profile web add ./packages/session-notify ./packages/rate-badge
```

and back to a pinned install with:

```sh
dsh plugin --profile web remove dsh-session-notify dsh-rate-badge
dsh plugin --profile web add "github:jengkhaw95/dsh-plugins#path:packages/session-notify" \
                            "github:jengkhaw95/dsh-plugins#path:packages/rate-badge"
```

Either way a **restart** is required, not just a page reload: `dsh.profile.bundles`
is composed at boot. `pnpm dsh web` is that restart.

## Build and test

Each package is standalone — no workspace root, no shared dependency install:

```sh
cd packages/<name>
npm install              # esbuild (+ cuelume, for session-notify)
npm run build:client     # writes lib/client.js
npm test                 # node --test test/*.test.js
```

`lib/client.js` is committed, so installing a package never requires a build
step — the same trade the reference plugin in this profile makes.

## Troubleshooting

Two failure modes cost real time while building these. Both are worth knowing
before you write a DSH plugin of your own.

### 1. A throwing plugin gets permanently disabled — fixing the code is not enough

The loader treats a fiber it had to dispose as a broken row and **writes the
disable back into your profile's patch file**
(`vendor/loader/src/index.ts`, the disposal interceptor: `fiber.entry.options.disabled = true`
followed by `fiber.entry.parent.tree.write()`).

So after any plugin throws during `apply()`, your profile ends up looking like
this, and it stays that way across restarts:

```yaml
# ~/.dsh/profiles/web/cordis.patch.yml
- id: session-notify
  disabled: true
- id: rate-badge
  disabled: true
```

A disabled row has **no fiber**, and the client scan skips fiber-less rows, so
the plugin silently does nothing — no error, no log, no boot failure. Fixing the
code and reinstalling changes nothing until those two entries are removed.

If a plugin loads but does nothing, check this file:

```sh
cat ~/.dsh/profiles/web/cordis.patch.yml
```

### 2. The RPC channel must start with `/`

`ctx.connection.rpc.handle()` validates against
`/^\/[A-Za-z0-9._~-]+$/` (`packages/client/connection/src/rpc-host.ts`,
`assertChannel`). A bare `my-plugin` is rejected, and because the check runs
inside `apply()`, the throw fails the loader entry and the **whole harness**
refuses to start:

```
Error: dsh: plugin tree failed to load: loader fibers failed
  failed to apply loader entry … connection: invalid or reserved RPC channel "…"
```

Use `'/my-plugin'`. Both host halves here also wrap registration in `try/catch`
so that a mistake of this class degrades to "settings cannot be saved" instead of
a dead harness — a plugin should never be able to stop DSH from booting.

## Design notes

**Why the host half exists at all.** A cue plays in the browser and the badge is
pure clock arithmetic, so neither needs a server. Both need a *persisted
preference*, though, and there are two mechanical reasons the host half is
unavoidable: DSH discovers a browser half by scanning live Loader entries for
packages declaring `dsh.client`, so even a client-only plugin needs a mounted
row; and the settings toggle has to outlive a reload. Each host half therefore
does exactly one thing — serve `$DSH_HOME/<plugin>/prefs.json` over a
loopback-authority RPC — and contains no business logic.

**How "main session, not subagent" is decided.** `session-notify` subscribes to
`ctx.sessions.list` (an `ObservableSnapshot<SessionListState>`) and reads, per
session, `running` and `origin`. `origin === 'subagent'` is the harness's own
durable subagent marker — the same test its session-lineage index uses — so a
subagent session is skipped before any edge is considered. "Needs your input"
comes from `ctx.uiSession.pendingInteractions`, the same map the sidebar's status
dots are built from.

**Why the first observation is silent.** A page that loads while sessions sit
idle must not replay old completions, so the first sighting of a session (and of
a pending interaction) only records state. This mirrors the Session Controller's
own completion-reminder logic, which arms on a running→idle edge and deliberately
skips the first observation.

**Why the badge timer sleeps.** A closed badge arms a single timeout aimed at the
next period boundary instead of ticking once a second; only an open popover with
a visible countdown runs an interval. Both timers live in React effects, so
unmounting clears them.

## Related: the first-party rate-period pill

The harness ships `@deepseek-ai/dsh-client-ui-rate-period`, a session-header
peak/off-peak pill with a schedule popover. It is built but **not mounted** by any
bundle in this profile, which is why no badge was visible.

`rate-badge` is a separate implementation rather than a mount of that package,
for one concrete reason: the requested on/off setting cannot govern a statically
mounted plugin row. Owning the component is what makes the toggle work. If you
would rather have the shipped pill, enable it in the profile patch and disable
`rate-badge` instead:

```yaml
- insert:
    - id: rate-period
      name: '@deepseek-ai/dsh-client-ui-rate-period'
```

The schedule constants in `client/rate-period.js` match the shipped ones and the
published pricing page: peak is Monday–Friday 01:00–04:00 and 06:00–10:00 UTC,
window ends exclusive, everything else off-peak at half price.
