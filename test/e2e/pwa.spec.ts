// Phase 5: PWA. The app shell loads from cache with the network disabled and
// shows an offline notice; API calls are never served from cache.
import { expect, test } from '@playwright/test';

const DID = 'did:plc:z72i7hdynmk6r22z27h6tvur';
const PDS = 'https://pds.example.org';

test('the shell loads from cache when offline, with an offline notice', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise((resolve) => {
        navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true });
      });
    }
    return reg.active?.state;
  });

  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('.wordmark')).toHaveText('pdsview');
  await expect(page.locator('.offline-notice')).toBeVisible();
  await context.setOffline(false);
});

test('a manifest is linked and declares the app', async ({ page }) => {
  await page.goto('/');
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(href).toBeTruthy();
  const manifest = await page.evaluate(async (h) => (await fetch(h!)).json(), href);
  expect(manifest.name).toBe('pdsview');
  expect(manifest.icons.length).toBeGreaterThan(0);
  expect(manifest.theme_color).toMatch(/^#[0-9a-fA-F]{6}$/);
  expect(manifest.background_color).toMatch(/^#[0-9a-fA-F]{6}$/);
});

test('API responses are never served from the service worker cache', async ({ page }) => {
  let plcHits = 0;
  await page.route('**/*', (route) => {
    const host = new URL(route.request().url()).hostname;
    return host === '127.0.0.1' || host === 'localhost' ? route.fallback() : route.abort();
  });
  await page.route(`https://plc.directory/${DID}`, (r) => {
    plcHits += 1;
    return r.fulfill({
      json: {
        id: DID,
        alsoKnownAs: [],
        service: [{ id: '#atproto_pds', type: 'AtprotoPersonalDataServer', serviceEndpoint: PDS }],
      },
    });
  });
  await page.route(`${PDS}/**`, (r) =>
    r.fulfill({ json: { did: DID, handle: 'x.example', didDoc: {}, collections: [] } }),
  );

  // Activate the service worker first.
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);

  await page.goto(`/#/at/${DID}`);
  await page.waitForSelector('.identity-card');
  // A full reload clears the in-page identity cache; a cached API response
  // would mean zero additional network hits.
  await page.reload();
  await page.waitForSelector('.identity-card');
  expect(plcHits).toBe(2);
});
