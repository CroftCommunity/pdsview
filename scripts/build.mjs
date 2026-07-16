import * as esbuild from 'esbuild';
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist', { recursive: true });
mkdirSync('.build', { recursive: true });

const result = await esbuild.build({
  entryPoints: [
    { in: 'src/main.ts', out: 'main' },
    { in: 'src/styles/app.css', out: 'app' },
    { in: 'src/sw.ts', out: 'sw' },
  ],
  bundle: true,
  format: 'esm',
  target: 'es2022',
  outdir: 'dist',
  sourcemap: true,
  minify: true,
  external: ['/fonts/*'],
  metafile: true,
});

// The metafile backs the zero-runtime-deps invariant test; it is a build
// byproduct, not a deployable, so it lives outside dist/.
writeFileSync('.build/metafile.json', JSON.stringify(result.metafile, null, 2));

cpSync('assets/index.html', 'dist/index.html');
cpSync('assets/fonts', 'dist/fonts', { recursive: true });
writeFileSync('dist/CNAME', 'pdsview.croft.ing');

// Manifest and icon are generated from the tokens file at build time, so all
// color stays in src/styles/tokens.css (the no-raw-hex invariant).
const tokensCss = readFileSync('src/styles/tokens.css', 'utf8');
const tokens = {};
for (const m of tokensCss.matchAll(/--([a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{6})\s*;/g)) {
  tokens[m[1]] = m[2];
}

writeFileSync(
  'dist/manifest.webmanifest',
  JSON.stringify(
    {
      name: 'pdsview',
      short_name: 'pdsview',
      description: 'A quiet, client-side browser for the public contents of any ATProto PDS.',
      start_url: '/',
      display: 'standalone',
      background_color: tokens['oatmeal-canvas'],
      theme_color: tokens['oatmeal-canvas'],
      icons: [
        { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      ],
    },
    null,
    2,
  ),
);

// Wordmark monogram: lowercase serif "p" on the oatmeal canvas.
writeFileSync(
  'dist/icon.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="64" fill="${tokens['oatmeal-canvas']}"/>
  <text x="256" y="380" text-anchor="middle" font-family="Lora, Georgia, serif" font-size="400" fill="${tokens['ruddy-orange']}">p</text>
</svg>
`,
);

console.log('built dist/');
