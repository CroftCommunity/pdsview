import * as esbuild from 'esbuild';
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist', { recursive: true });
mkdirSync('.build', { recursive: true });

const result = await esbuild.build({
  entryPoints: ['src/main.ts', 'src/styles/app.css'],
  bundle: true,
  format: 'esm',
  target: 'es2022',
  outdir: 'dist',
  sourcemap: true,
  minify: true,
  loader: { '.woff2': 'copy' },
  metafile: true,
});

// The metafile backs the zero-runtime-deps invariant test; it is a build
// byproduct, not a deployable, so it lives outside dist/.
writeFileSync('.build/metafile.json', JSON.stringify(result.metafile, null, 2));

cpSync('assets/index.html', 'dist/index.html');
cpSync('assets/fonts', 'dist/fonts', { recursive: true });
writeFileSync('dist/CNAME', 'pdsview.croft.ing');

console.log('built dist/');
