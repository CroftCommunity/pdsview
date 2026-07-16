// Design invariant: every text/background pair the stylesheet ships must meet
// WCAG AA — 4.5:1 for body text, 3:1 for large text (headings, wordmark).
// Board-natural pairs that fail body contrast (ruddy-on-oatmeal,
// granite-on-oatmeal) are restricted here and the stylesheet must respect the
// restriction via derived ink variants.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { contrastRatio, parseTokens } from './helpers/wcag';

const css = readFileSync('src/styles/tokens.css', 'utf8');
const t = parseTokens(css);

function ratio(fg: string, bg: string): number {
  expect(t[fg], `token --${fg} must exist in tokens.css`).toBeDefined();
  expect(t[bg], `token --${bg} must exist in tokens.css`).toBeDefined();
  return contrastRatio(t[fg]!, t[bg]!);
}

describe('board tokens are present', () => {
  it.each([
    ['deep-schist', '#2F3539'],
    ['light-granite', '#A2A8A5'],
    ['ruddy-orange', '#B75C34'],
    ['dark-moss', '#3D8548'],
    ['iron-ore-black', '#1C1E20'],
    ['oatmeal-canvas', '#E9E1D8'],
  ])('--%s is %s from the tectonic board', (name, hex) => {
    expect(t[name]?.toUpperCase()).toBe(hex);
  });
});

describe('body text pairs (>= 4.5:1)', () => {
  it('iron-ore-black on oatmeal-canvas', () => {
    expect(ratio('iron-ore-black', 'oatmeal-canvas')).toBeGreaterThanOrEqual(4.5);
  });
  it('oatmeal-canvas on deep-schist (JSON/code panels, footer)', () => {
    expect(ratio('oatmeal-canvas', 'deep-schist')).toBeGreaterThanOrEqual(4.5);
  });
  it('derived ruddy-ink on oatmeal-canvas (links, body-size accents)', () => {
    expect(ratio('ruddy-ink', 'oatmeal-canvas')).toBeGreaterThanOrEqual(4.5);
  });
  it('derived moss-ink on oatmeal-canvas (body-size verified text)', () => {
    expect(ratio('moss-ink', 'oatmeal-canvas')).toBeGreaterThanOrEqual(4.5);
  });
});

describe('large text pairs (>= 3:1)', () => {
  it('ruddy-orange on oatmeal-canvas (headings, wordmark only)', () => {
    expect(ratio('ruddy-orange', 'oatmeal-canvas')).toBeGreaterThanOrEqual(3);
  });
  it('dark-moss on oatmeal-canvas (large verified badge only)', () => {
    expect(ratio('dark-moss', 'oatmeal-canvas')).toBeGreaterThanOrEqual(3);
  });
});

describe('board-pair restrictions encoded', () => {
  const appCss = () => readFileSync('src/styles/app.css', 'utf8');

  it('light-granite fails body contrast on oatmeal, so it is never a text color', () => {
    expect(ratio('light-granite', 'oatmeal-canvas')).toBeLessThan(4.5);
    for (const rule of appCss().split('}')) {
      expect(rule, 'light-granite may be used for borders/surfaces, not color:').not.toMatch(
        /(?<![a-z-])color\s*:\s*var\(--light-granite\)/,
      );
    }
  });

  it('plain ruddy-orange is large-text-only: as a text color only on headings/wordmark', () => {
    expect(ratio('ruddy-orange', 'oatmeal-canvas')).toBeLessThan(4.5);
    for (const rule of appCss().split('}')) {
      if (!/(?<![a-z-])color\s*:\s*var\(--ruddy-orange\)/.test(rule)) continue;
      const selector = rule.slice(0, rule.indexOf('{')).trim();
      expect(
        /(^|[,\s])(h1|h2|\.wordmark)([,\s{:]|$)/.test(selector),
        `ruddy-orange used as text color outside large-text selectors: "${selector}"`,
      ).toBe(true);
    }
  });
});
