// All color lives in src/styles/tokens.css. No raw hex color anywhere else in
// source or markup — everything references the custom properties.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

const HEX = /#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?(?:[0-9a-fA-F]{2})?\b/;

describe('no raw hex outside tokens.css', () => {
  it('tokens.css exists and is the single home of color', () => {
    expect(readFileSync('src/styles/tokens.css', 'utf8')).toContain('--oatmeal-canvas');
  });

  it('src/ and assets/ carry no raw hex colors outside tokens.css', () => {
    const files = [...walk('src'), ...walk('assets')].filter(
      (f) =>
        !f.endsWith('src/styles/tokens.css') &&
        /\.(ts|css|html|svg|webmanifest|json)$/.test(f),
    );
    expect(files.length).toBeGreaterThan(0);
    for (const f of files) {
      const text = readFileSync(f, 'utf8');
      for (const [i, line] of text.split('\n').entries()) {
        // CSS id selectors and hash-route fragments are not colors; only flag
        // hex in color-looking positions (after ':' or '=' or inside quotes is
        // too broad — flag any #rgb/#rrggbb token not preceded by url or word).
        const m = HEX.exec(line);
        if (m) {
          expect.fail(`${f}:${i + 1} contains raw hex "${m[0]}" — use a token from tokens.css`);
        }
      }
    }
  });
});
