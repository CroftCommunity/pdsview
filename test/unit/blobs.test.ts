// Phase 4: blob references. Shape confirmed against a live record fixture
// (ledger item 4): { $type: "blob", ref: { $link: cid }, mimeType, size }.
import { describe, expect, it } from 'vitest';
import { blobHtml, blobUrl, humanSize, isBlobRef } from '../../src/views/blob';
import { esc } from '../../src/views/html';
import { recordView } from '../../src/views/record';
import { getRecordFixture } from '../fixtures/get-record';

const PDS = 'https://puffball.us-east.host.bsky.network';
const DID = 'did:plc:z72i7hdynmk6r22z27h6tvur';
const avatar = (getRecordFixture.value as { avatar: unknown }).avatar;

describe('isBlobRef', () => {
  it('accepts the live avatar blob from the fixture', () => {
    expect(isBlobRef(avatar)).toBe(true);
  });

  it('rejects near-misses', () => {
    expect(isBlobRef(null)).toBe(false);
    expect(isBlobRef({ $type: 'blob' })).toBe(false);
    expect(isBlobRef({ $type: 'not-blob', ref: { $link: 'x' }, mimeType: 'a/b', size: 1 })).toBe(false);
    expect(isBlobRef({ $type: 'blob', ref: {}, mimeType: 'a/b', size: 1 })).toBe(false);
  });
});

describe('blobUrl and humanSize', () => {
  it('builds the sync.getBlob URL', () => {
    expect(blobUrl(PDS, DID, 'bafkabc')).toBe(
      `${PDS}/xrpc/com.atproto.sync.getBlob?did=${DID}&cid=bafkabc`,
    );
  });

  it('formats sizes for humans', () => {
    expect(humanSize(512)).toBe('512 B');
    expect(humanSize(2048)).toBe('2.0 kB');
    expect(humanSize(1554074)).toBe('1.5 MB');
  });
});

describe('blobHtml', () => {
  const image = { $type: 'blob', ref: { $link: 'bafkimg' }, mimeType: 'image/jpeg', size: 1000 } as const;
  const pdf = { $type: 'blob', ref: { $link: 'bafkpdf' }, mimeType: 'application/pdf', size: 2048 } as const;

  it('renders image mimeTypes as lazy inline images with field-path alt text', () => {
    const html = blobHtml(PDS, DID, image, 'value.avatar');
    expect(html).toContain(`src="${esc(blobUrl(PDS, DID, 'bafkimg'))}"`);
    expect(html).toContain('loading="lazy"');
    expect(html).toMatch(/alt="[^"]*value\.avatar/);
  });

  it('renders non-image blobs as a labeled download link with mimeType and size', () => {
    const html = blobHtml(PDS, DID, pdf, 'value.doc');
    expect(html).not.toContain('<img');
    expect(html).toContain(`href="${esc(blobUrl(PDS, DID, 'bafkpdf'))}"`);
    expect(html).toContain('application/pdf');
    expect(html).toContain('2.0 kB');
  });

  it('images carry the data needed to degrade to the download-link presentation', () => {
    const html = blobHtml(PDS, DID, image, 'value.avatar');
    expect(html).toContain('data-blob-mime="image/jpeg"');
    expect(html).toContain('data-blob-size="1000"');
  });
});

describe('recordView with a PDS context', () => {
  it('renders the fixture avatar inline', () => {
    const html = recordView(DID, 'app.bsky.actor.profile', 'self', getRecordFixture, PDS);
    const cid = (avatar as { ref: { $link: string } }).ref.$link;
    expect(html).toContain(`src="${esc(blobUrl(PDS, DID, cid))}"`);
    expect(html).toContain('loading="lazy"');
  });

  it('renders blobs as plain JSON when no PDS is known', () => {
    const html = recordView(DID, 'app.bsky.actor.profile', 'self', getRecordFixture);
    expect(html).not.toContain('<img');
  });
});
