// Bundle client/index.jsx → lib/client.js, the artifact DSH's client module
// system actually serves.
//
// The output format is not a choice: DSH's browser module table loads plugin
// bundles by evaluating a script that calls
// `window.__ModuleLoader__.load({ id, factory })`, where `factory(require)`
// returns a CommonJS-style exports object. The reference plugin installed in
// this profile (dsh-remote-tailscale) and the shipped packages under
// packages/client/* both emit exactly this shape, so we match it byte for byte
// rather than inventing a dialect.
//
// `react` and `react/jsx-runtime` stay external: the shell supplies one React
// instance through the module table, and bundling a second copy would break
// hooks across the boundary. `cuelume` is NOT external — it is a plain ESM
// library with no shared runtime identity, so it inlines, which is what makes
// the plugin work with no download and no extra request.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { build } from 'esbuild';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const packageDir = resolve(scriptDir, '..');
const entryPath = resolve(packageDir, 'client/index.jsx');
const outputPath = resolve(packageDir, 'lib/client.js');

// Must equal the package name: the client module table keys the bundle by it,
// and a mismatch means the row loads nothing.
const loaderId = 'dsh-session-notify';

// cuelume is inlined, which makes this bundle a redistribution of its code, so
// the MIT attribution has to live *in* the artifact rather than only beside it.
// esbuild cannot derive that on its own: cuelume's published files carry no
// `@license`/`@preserve` marker, so there is nothing for `legalComments` to
// preserve and the notice would vanish silently. Read the version off the
// installed package so the banner cannot go stale.
const cuelumeManifest = JSON.parse(
  await readFile(resolve(packageDir, 'node_modules/cuelume/package.json'), 'utf8'),
);
const banner = `/*! ${loaderId} — bundles cuelume v${cuelumeManifest.version} `
  + `(MIT, Copyright (c) 2026 Daniel Belyi). See THIRD_PARTY_NOTICES.md. */`;

const result = await build({
  entryPoints: [entryPath],
  bundle: true,
  // CommonJS is the factory's own module convention, not a Node target.
  format: 'cjs',
  platform: 'browser',
  target: ['chrome100'],
  jsx: 'automatic',
  external: ['react', 'react/jsx-runtime', 'react-dom', 'react-dom/client'],
  write: false,
  minify: process.env.NODE_ENV === 'production',
  // Banners survive `legalComments: 'none'`; they are a separate mechanism.
  banner: { js: banner },
  legalComments: 'none',
  charset: 'utf8',
});

const bundled = result.outputFiles?.[0]?.text;
if (bundled === undefined) throw new Error('esbuild produced no client bundle');

const wrapped = `window.__ModuleLoader__.load({
  id: ${JSON.stringify(loaderId)},
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
${bundled}
    return module.exports;
  }
});
`;

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, wrapped, 'utf8');
console.log(`Wrote ${outputPath} (${Buffer.byteLength(wrapped)} bytes)`);
