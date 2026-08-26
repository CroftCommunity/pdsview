import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Automated accessibility scan. Adopts the workspace standard — canonical writeup
// in croft-pwa/docs/ACCESSIBILITY.md.
// Zero serious/critical axe violations.
//
// HERMETIC by construction: all cross-origin requests are blocked. pdsview's whole
// job is fetching a stranger's PDS, so without the block the scanned DOM depends on
// whether the runner had network — and CI's green would not be about the same page.
//
// SCOPE, stated because an undocumented omission is indistinguishable from an
// oversight: only the home/shell surface is scanned. The repo/collection/record
// views (#/at/<did>/...) render entirely from a live PDS response, so hermetically
// they show only fetch-failure chrome — a surface a user rarely sees, whose
// contrast artifacts would be noise. Their a11y belongs to the browse/record
// feature specs against fixtures, not to this shell gate.
//
// ONE THEME by design: pdsview has no dark mode — tokens.css defines a single
// palette. If a theme axis is ever added, this MUST become a loop over both, since
// contrast is theme-dependent and a light-only scan cannot see a dark-only failure.
test('a11y: shell — no serious/critical violations', async ({ page }) => {
  await page.route('**/*', (route) => {
    const host = new URL(route.request().url()).hostname;
    if (host === 'localhost' || host === '127.0.0.1') void route.continue();
    else void route.abort();
  });
  await page.goto('/');
  await expect(page.locator('.wordmark')).toHaveText('pdsview');

  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id} (${v.impact ?? '?'}) × ${v.nodes.length}`);

  expect(blocking, blocking.join(' · ')).toEqual([]);
});
