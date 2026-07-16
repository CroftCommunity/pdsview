// Phase 0 shell: wordmark, one-line description, input box (non-functional
// yet). Hermetic — the built dist/ is served locally and ANY request leaving
// the local origin fails the test (no-unexpected-origins, browser level; also
// proves fonts are self-hosted).
import { expect, test } from '@playwright/test';

test('shell renders wordmark, description and input with zero external requests', async ({
  page,
}) => {
  const external: string[] = [];
  page.on('request', (req) => {
    if (!/^(127\.0\.0\.1|localhost)$/.test(new URL(req.url()).hostname)) {
      external.push(req.url());
    }
  });

  await page.goto('/');

  await expect(page).toHaveTitle(/pdsview/);
  await expect(page.locator('.wordmark')).toHaveText('pdsview');
  await expect(page.locator('header p, .tagline').first()).toBeVisible();

  const input = page.getByRole('textbox');
  await expect(input).toBeVisible();
  await expect(input).toHaveAttribute('placeholder', /handle|did/i);

  await page.waitForLoadState('networkidle');
  expect(external, `external requests observed: ${external.join(', ')}`).toEqual([]);
});

test('self-hosted fonts load from the local origin', async ({ page }) => {
  const fontRequests: string[] = [];
  page.on('request', (req) => {
    if (req.resourceType() === 'font') fontRequests.push(req.url());
  });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  expect(fontRequests.length).toBeGreaterThan(0);
  for (const url of fontRequests) {
    expect(new URL(url).hostname).toBe('127.0.0.1');
  }
});
