# Third-party notices

`dsh-session-notify` redistributes one third-party library inside its built
browser bundle.

## cuelume

- **Version:** 0.2.2 (bundled at build time into `lib/client.js`)
- **Source:** https://github.com/Danilaa1/cuelume · https://cuelume.dev/
- **License:** MIT — Copyright (c) 2026 Daniel Belyi
- **Verbatim text:** [`licenses/cuelume-LICENSE.txt`](licenses/cuelume-LICENSE.txt)

`client/cues.js` imports `cuelume`, and `scripts/build-client.mjs` inlines it
rather than leaving it external, so that the installed plugin needs no download
and no runtime dependency. That makes this repository a redistributor of
cuelume's code, and the MIT terms require its copyright notice and permission
notice to travel with it.

Two things enforce that:

1. **`THIRD_PARTY_NOTICES.md` and `licenses/cuelume-LICENSE.txt` ship in the
   package**, so they are present in every installation, including a `git`-based
   one that copies only this directory.
2. **The build writes a banner into `lib/client.js`** naming cuelume and its
   license. esbuild's `legalComments` handling cannot do this on its own:
   cuelume's distributed files contain no `@license`/`@preserve` marker, so there
   is nothing for a minifier to preserve and the attribution would otherwise be
   dropped silently.

## Everything else

React (MIT) is *not* bundled — `react` and `react/jsx-runtime` are external and
resolved from the DSH shell's module table. No other library is copied into this
package.
