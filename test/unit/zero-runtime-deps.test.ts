// Named invariant: zero-runtime-deps.
// package.json `dependencies` stays empty forever, and the shipped bundle
// contains no code from node_modules — verified against esbuild's metafile.
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';

describe('zero-runtime-deps', () => {
  beforeAll(() => {
    execSync('node scripts/build.mjs', { stdio: 'pipe' });
  }, 60_000);

  it('package.json declares an empty dependencies object', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
    expect(pkg.dependencies).toEqual({});
  });

  it('every module in the bundle comes from src/, none from node_modules', () => {
    const meta = JSON.parse(readFileSync('.build/metafile.json', 'utf8'));
    const inputs = Object.keys(meta.inputs);
    expect(inputs.length).toBeGreaterThan(0);
    for (const input of inputs) {
      expect(input, `bundled third-party module: ${input}`).not.toContain('node_modules');
      expect(input.startsWith('src/'), `bundle input outside src/: ${input}`).toBe(true);
    }
  });

  it('dist/ contains the deployable shell: index.html, JS, CSS, CNAME', () => {
    expect(existsSync('dist/index.html')).toBe(true);
    expect(existsSync('dist/main.js')).toBe(true);
    expect(existsSync('dist/app.css')).toBe(true);
    expect(readFileSync('dist/CNAME', 'utf8')).toBe('pdsview.croft.ing');
  });
});
