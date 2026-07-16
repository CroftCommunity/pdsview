// Phase 3: export affordances in the views.
import { describe, expect, it } from 'vitest';
import { collectionView } from '../../src/views/collection';
import { recordView } from '../../src/views/record';
import { repoView } from '../../src/views/repo';
import { getRecordFixture } from '../fixtures/get-record';
import { listRecordsFixture } from '../fixtures/list-records';

const DID = 'did:plc:z72i7hdynmk6r22z27h6tvur';
const PDS = 'https://puffball.us-east.host.bsky.network';

describe('repo export (.car)', () => {
  const html = repoView({
    did: DID,
    claimedHandle: 'bsky.app',
    verified: true,
    provenance: null,
    pdsEndpoint: PDS,
    collections: ['app.bsky.feed.post'],
  });

  it('is a plain download anchor at the spec-guaranteed sync endpoint', () => {
    expect(html).toContain(`href="${PDS}/xrpc/com.atproto.sync.getRepo?did=${DID}"`);
    expect(html).toContain(`download="${DID}.car"`);
  });

  it('says what a CAR is in one sentence', () => {
    expect(html).toMatch(/CAR/);
    expect(html).toMatch(/migration/i);
  });
});

describe('collection export (.ndjson)', () => {
  it('offers an abortable export button', () => {
    const html = collectionView(DID, 'app.bsky.feed.post', listRecordsFixture.records, undefined);
    expect(html).toMatch(/<button[^>]*class="[^"]*export-ndjson/);
    expect(html).toMatch(/export collection/i);
  });
});

describe('record download (.json)', () => {
  it('offers a download button carrying the conventional filename', () => {
    const html = recordView(DID, 'app.bsky.actor.profile', 'self', getRecordFixture);
    expect(html).toMatch(/download record/i);
    expect(html).toContain(`data-download-filename="${DID}.app.bsky.actor.profile.self.json"`);
  });
});
