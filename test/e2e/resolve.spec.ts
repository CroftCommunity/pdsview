// Phase 1: paste a handle -> resolve -> navigate to the DID route. The
// handle never appears in the URL (deep-links-are-did-canonical, e2e level).
// All XRPC/identity traffic is mocked; nothing leaves the local origin.
import { expect, test } from '@playwright/test';

const DID = 'did:plc:z72i7hdynmk6r22z27h6tvur';
const HANDLE = 'alice.example.com';

test('handle input resolves then navigates to the DID URL, handle shown on-page only', async ({
  page,
}) => {
  // Rung 1 (handle domain well-known) is blocked, like a site without CORS.
  await page.route(`https://${HANDLE}/.well-known/atproto-did`, (route) => route.abort());
  // Rung 2 succeeds.
  await page.route('https://api.bsky.app/**', (route) =>
    route.fulfill({ json: { did: DID } }),
  );
  // The DID doc fetch that follows resolution.
  await page.route(`https://plc.directory/${DID}`, (route) =>
    route.fulfill({
      json: {
        id: DID,
        alsoKnownAs: [`at://${HANDLE}`],
        service: [
          {
            id: '#atproto_pds',
            type: 'AtprotoPersonalDataServer',
            serviceEndpoint: 'https://pds.example.org',
          },
        ],
      },
    }),
  );
  // Anything the repo view may request from the PDS later.
  await page.route('https://pds.example.org/**', (route) =>
    route.fulfill({ json: { did: DID, handle: HANDLE, collections: [] } }),
  );

  await page.goto('/');
  await page.getByRole('textbox').fill(`@${HANDLE}`);
  await page.getByRole('button', { name: /browse/i }).click();

  await expect(page).toHaveURL(new RegExp(`#/at/${DID}$`));
  expect(page.url()).not.toContain(HANDLE);
  await expect(page.locator('body')).toContainText(HANDLE);
});

test('pasting a DID navigates directly', async ({ page }) => {
  // Catch-all first (Playwright matches last-registered first): nothing may
  // leave the local origin except the routes mocked below.
  await page.route('**/*', (route) => {
    const host = new URL(route.request().url()).hostname;
    return host === '127.0.0.1' || host === 'localhost' ? route.fallback() : route.abort();
  });
  await page.route(`https://plc.directory/${DID}`, (route) =>
    route.fulfill({ json: { id: DID, alsoKnownAs: [`at://${HANDLE}`], service: [] } }),
  );
  await page.goto('/');
  await page.getByRole('textbox').fill(DID);
  await page.getByRole('button', { name: /browse/i }).click();
  await expect(page).toHaveURL(new RegExp(`#/at/${DID}$`));
});

test('garbage input shows a typed rejection message and does not navigate', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox').fill('not a handle');
  await page.getByRole('button', { name: /browse/i }).click();
  await expect(page.locator('[role="alert"], .error').first()).toBeVisible();
  expect(new URL(page.url()).hash).toBe('');
});
