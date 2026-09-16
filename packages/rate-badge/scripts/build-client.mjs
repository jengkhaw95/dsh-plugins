// Bundle client/index.jsx → lib/client.js, the artifact DSH's client module
// system serves.
//
// The output format is fixed by the shell: a plugin bundle is a script that
// calls `window.__ModuleLoader__.load({ id, factory })`, where `factory(require)`
// returns a CommonJS-style exports object. The harness's own client packages and
// the reference plugin installed in this profile both emit this shape.
//
// `react`, `react/jsx-runtime`, and `react-dom` are external and resolved from
// the module table's seed set, so the shell keeps exactly one React instance.
// Nothing else needs to be external here: this plugin has no runtime
// dependencies of its own.

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { build } from 'esbuild';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const packageDir = resolve(scriptDir, '..');
const entryPath = resolve(packageDir, 'client/index.jsx');
const outputPath = resolve(packageDir, 'lib/client.js');

// Must equal the package name: the module table keys the bundle by it.
const loaderId = 'dsh-rate-badge';

const result = await build({
  entryPoints: [entryPath],
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  target: ['chrome100'],
  jsx: 'automatic',
  external: ['react', 'react/jsx-runtime', 'react-dom', 'react-dom/client'],
  write: false,
  minify: process.env.NODE_ENV === 'production',
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
