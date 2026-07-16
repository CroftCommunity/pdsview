// Phase 4: inline blobs in the record view — images render from getBlob,
// broken loads degrade to the download-link presentation.
import { expect, test } from '@playwright/test';

const DID = 'did:plc:z72i7hdynmk6r22z27h6tvur';
const PDS = 'https://pds.example.org';
const CID = 'bafkreitestimage';

// 1x1 transparent PNG.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

const record = {
  uri: `at://${DID}/app.bsky.actor.profile/self`,
  cid: 'bafyreirecord',
  value: {
    $type: 'app.bsky.actor.profile',
    displayName: 'blob test',
    avatar: { $type: 'blob', ref: { $link: CID }, mimeType: 'image/png', size: 68 },
  },
};

async function mockIdentityAndRecord(page: import('@playwright/test').Page) {
  await page.route('**/*', (route) => {
    const host = new URL(route.request().url()).hostname;
    return host === '127.0.0.1' || host === 'localhost' ? route.fallback() : route.abort();
  });
  await page.route(`https://plc.directory/${DID}`, (r) =>
    r.fulfill({
      json: {
        id: DID,
        alsoKnownAs: [],
        service: [{ id: '#atproto_pds', type: 'AtprotoPersonalDataServer', serviceEndpoint: PDS }],
      },
    }),
  );
  await page.route(`${PDS}/xrpc/com.atproto.repo.getRecord**`, (r) => r.fulfill({ json: record }));
}

test('an image blob renders inline via sync.getBlob, lazily', async ({ page }) => {
  await mockIdentityAndRecord(page);
  await page.route(`${PDS}/xrpc/com.atproto.sync.getBlob**`, (r) =>
    r.fulfill({ body: PNG, contentType: 'image/png' }),
  );
  await page.goto(`/#/at/${DID}/app.bsky.actor.profile/self`);
  const img = page.locator('img.blob-image');
  await expect(img).toBeVisible();
  await expect(img).toHaveAttribute('loading', 'lazy');
  await expect(img).toHaveAttribute('src', `${PDS}/xrpc/com.atproto.sync.getBlob?did=${DID}&cid=${CID}`);
});

test('a broken blob degrades to the download-link presentation', async ({ page }) => {
  await mockIdentityAndRecord(page);
  await page.route(`${PDS}/xrpc/com.atproto.sync.getBlob**`, (r) => r.abort());
  await page.goto(`/#/at/${DID}/app.bsky.actor.profile/self`);
  const fallback = page.locator('a.blob-download');
  await expect(fallback).toBeVisible();
  await expect(fallback).toContainText('image/png');
  await expect(page.locator('img.blob-image')).toHaveCount(0);
});
