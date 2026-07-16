// Phase 2: views are pure functions of fetched data, rendered to HTML strings
// and tested against recorded fixtures.
import { describe, expect, it } from 'vitest';
import { collectionView } from '../../src/views/collection';
import { errorView } from '../../src/views/errors';
import { recordView } from '../../src/views/record';
import { repoView } from '../../src/views/repo';
import { describeRepoFixture } from '../fixtures/describe-repo';
import { getRecordFixture } from '../fixtures/get-record';
import { listRecordsFixture } from '../fixtures/list-records';

const DID = 'did:plc:z72i7hdynmk6r22z27h6tvur';

describe('repoView', () => {
  const html = repoView({
    did: DID,
    claimedHandle: 'bsky.app',
    verified: true,
    provenance: null,
    pdsEndpoint: 'https://puffball.us-east.host.bsky.network',
    collections: [...describeRepoFixture.collections],
  });

  it('renders the identity card: handle, verification, DID, PDS host, DID doc link', () => {
    expect(html).toContain('bsky.app');
    expect(html).toContain('verified');
    expect(html).toContain(DID);
    expect(html).toContain('puffball.us-east.host.bsky.network');
    expect(html).toContain(`https://plc.directory/${DID}`);
    expect(html).toMatch(/data-copy-text="did:plc:z72i7hdynmk6r22z27h6tvur"/);
  });

  it('links every collection to its DID-canonical route', () => {
    for (const nsid of describeRepoFixture.collections) {
      expect(html).toContain(`href="#/at/${DID}/${nsid}"`);
    }
  });

  it('unverified state renders as unverified with a plain-language note', () => {
    const unv = repoView({
      did: DID,
      claimedHandle: 'bsky.app',
      verified: false,
      provenance: null,
      pdsEndpoint: null,
      collections: [],
    });
    expect(unv).toContain('unverified');
  });
});

describe('collectionView', () => {
  const html = collectionView(DID, 'app.bsky.feed.post', listRecordsFixture.records, listRecordsFixture.cursor);

  it('renders one link per record, to the DID-canonical record route', () => {
    for (const rec of listRecordsFixture.records) {
      const rkey = rec.uri.split('/').pop()!;
      expect(html).toContain(`href="#/at/${DID}/app.bsky.feed.post/${rkey}"`);
    }
  });

  it('renders createdAt and a $type-aware snippet where trivially available', () => {
    expect(html).toContain(listRecordsFixture.records[0].value.createdAt);
    expect(html).toContain(listRecordsFixture.records[0].value.text.slice(0, 40));
  });

  it('shows Load more only when a cursor came back', () => {
    expect(html).toMatch(/load more/i);
    const last = collectionView(DID, 'app.bsky.feed.post', listRecordsFixture.records, undefined);
    expect(last).not.toMatch(/load more/i);
  });

  it('escapes record text (no HTML injection from record values)', () => {
    const evil = [{ uri: `at://${DID}/x.y.z/3k`, cid: 'bafyx', value: { text: '<script>alert(1)</script>' } }];
    expect(collectionView(DID, 'x.y.z', evil, undefined)).not.toContain('<script>');
  });
});

describe('recordView', () => {
  const html = recordView(DID, 'app.bsky.actor.profile', 'self', getRecordFixture);

  it('renders the drystone course breadcrumb: at:// › did › collection › rkey', () => {
    expect(html).toContain('class="course"');
    expect(html).toContain(`href="#/at/${DID}"`);
    expect(html).toContain(`href="#/at/${DID}/app.bsky.actor.profile"`);
    expect(html).toContain('self');
  });

  it('displays the record CID and copy buttons', () => {
    expect(html).toContain(getRecordFixture.cid);
    expect(html).toMatch(/data-copy-text="[^"]*bafyrei/);
    expect(html).toMatch(/copy json/i);
    expect(html).toMatch(/copy link/i);
  });

  it('offers a raw-JSON toggle', () => {
    expect(html).toMatch(/raw json/i);
  });

  it('renders at:// URIs in values as internal links', () => {
    const rec = listRecordsFixture.records.find((r) => JSON.stringify(r.value).includes('app.bsky.embed.record'))!;
    const embedded = (rec.value as { embed: { record: { uri: string } } }).embed.record.uri;
    const target = embedded.replace('at://', '#/at/');
    const rkey = rec.uri.split('/').pop()!;
    const view = recordView(DID, 'app.bsky.feed.post', rkey, rec);
    expect(view).toContain(`href="${target}"`);
  });

  it('renders bare DIDs in values as internal links', () => {
    const rec = { uri: `at://${DID}/x.y.z/3k`, cid: 'bafyx', value: { subject: 'did:plc:44ybard66vv44zksje25o7dz' } };
    expect(recordView(DID, 'x.y.z', '3k', rec)).toContain('href="#/at/did:plc:44ybard66vv44zksje25o7dz"');
  });

  it('escapes string values', () => {
    const rec = { uri: `at://${DID}/x.y.z/3k`, cid: 'bafyx', value: { text: '<img src=x onerror=alert(1)>' } };
    expect(recordView(DID, 'x.y.z', '3k', rec)).not.toContain('<img src=x');
  });
});

describe('errorView: first-class, distinct error states', () => {
  it('CORS-blocked PDS names CORS explicitly', () => {
    expect(errorView('cors')).toContain('does not allow browser reads (CORS)');
  });

  it('not-found, account-unavailable, and network states have their own copy', () => {
    const notFound = errorView('not-found', 'record');
    const account = errorView('account-unavailable', 'Repo has been deactivated');
    const network = errorView('network');
    expect(account).toContain('Repo has been deactivated');
    const all = [errorView('cors'), notFound, account, network];
    expect(new Set(all).size).toBe(4);
  });
});
