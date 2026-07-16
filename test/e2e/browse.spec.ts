// Phase 2: browse flow against fully mocked XRPC routes — repo page ->
// collection -> record -> and the CORS error state as first-class copy.
import { expect, test } from '@playwright/test';

const DID = 'did:plc:z72i7hdynmk6r22z27h6tvur';
const HANDLE = 'bsky.app';
const PDS = 'https://pds.example.org';

const didDoc = {
  id: DID,
  alsoKnownAs: [`at://${HANDLE}`],
  service: [
    { id: '#atproto_pds', type: 'AtprotoPersonalDataServer', serviceEndpoint: PDS },
  ],
};

async function blockExternal(page: import('@playwright/test').Page) {
  await page.route('**/*', (route) => {
    const host = new URL(route.request().url()).hostname;
    return host === '127.0.0.1' || host === 'localhost' ? route.fallback() : route.abort();
  });
}

test('repo -> collection -> record browse flow', async ({ page }) => {
  await blockExternal(page);
  await page.route(`https://plc.directory/${DID}`, (r) => r.fulfill({ json: didDoc }));
  await page.route(`https://${HANDLE}/.well-known/atproto-did`, (r) =>
    r.fulfill({ body: DID, contentType: 'text/plain' }),
  );
  await page.route(`${PDS}/xrpc/com.atproto.repo.describeRepo**`, (r) =>
    r.fulfill({ json: { did: DID, handle: HANDLE, didDoc, collections: ['app.bsky.feed.post'] } }),
  );
  await page.route(`${PDS}/xrpc/com.atproto.repo.listRecords**`, (r) =>
    r.fulfill({
      json: {
        records: [
          {
            uri: `at://${DID}/app.bsky.feed.post/3kaaa`,
            cid: 'bafyreiaaa',
            value: { $type: 'app.bsky.feed.post', text: 'hello drystone world', createdAt: '2026-07-01T00:00:00.000Z' },
          },
        ],
      },
    }),
  );
  await page.route(`${PDS}/xrpc/com.atproto.repo.getRecord**`, (r) =>
    r.fulfill({
      json: {
        uri: `at://${DID}/app.bsky.feed.post/3kaaa`,
        cid: 'bafyreiaaa',
        value: { $type: 'app.bsky.feed.post', text: 'hello drystone world', createdAt: '2026-07-01T00:00:00.000Z' },
      },
    }),
  );

  await page.goto(`/#/at/${DID}`);
  await expect(page.locator('body')).toContainText(HANDLE);
  await expect(page.locator('body')).toContainText('verified');

  await page.getByRole('link', { name: 'app.bsky.feed.post' }).click();
  await expect(page).toHaveURL(new RegExp(`#/at/${DID}/app.bsky.feed.post$`));
  await expect(page.locator('body')).toContainText('hello drystone world');

  await page.getByRole('link', { name: /3kaaa/ }).click();
  await expect(page).toHaveURL(new RegExp(`/app.bsky.feed.post/3kaaa$`));
  await expect(page.locator('.course')).toBeVisible();
  await expect(page.locator('body')).toContainText('bafyreiaaa');
});

test('a CORS-blocked PDS is a distinct, named error state', async ({ page }) => {
  await blockExternal(page);
  await page.route(`https://plc.directory/${DID}`, (r) => r.fulfill({ json: didDoc }));
  await page.route(`https://${HANDLE}/.well-known/atproto-did`, (r) =>
    r.fulfill({ body: DID, contentType: 'text/plain' }),
  );
  // Every PDS read is aborted — what a browser sees from a no-CORS PDS.
  await page.route(`${PDS}/**`, (r) => r.abort());

  await page.goto(`/#/at/${DID}`);
  await expect(page.locator('body')).toContainText('does not allow browser reads (CORS)');
});
