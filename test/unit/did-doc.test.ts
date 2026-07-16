// Phase 1: DID document fetch and extraction, hermetic via an injected fetch.
// did:web CORS failure is an expected, distinctly-typed error — the spec does
// not require CORS on /.well-known/did.json.
import { describe, expect, it } from 'vitest';
import {
  DidNotFoundError,
  DidWebUnreachableError,
  fetchDidDoc,
} from '../../src/identity/did-doc';
import { bnewboldDidDoc, bskyAppDidDoc } from '../fixtures/did-docs';

function fakeFetch(routes: Record<string, () => Response>): typeof fetch {
  return async (input) => {
    const url = String(input);
    const handler = routes[url];
    if (!handler) throw new TypeError(`Failed to fetch: no route for ${url}`);
    return handler();
  };
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

describe('fetchDidDoc', () => {
  it('fetches did:plc from plc.directory and extracts PDS + claimed handle', async () => {
    const f = fakeFetch({
      'https://plc.directory/did:plc:z72i7hdynmk6r22z27h6tvur': () => json(bskyAppDidDoc),
    });
    const info = await fetchDidDoc('did:plc:z72i7hdynmk6r22z27h6tvur', f);
    expect(info.pdsEndpoint).toBe('https://puffball.us-east.host.bsky.network');
    expect(info.claimedHandle).toBe('bsky.app');
  });

  it('extracts from a doc with multiple verificationMethods (self-hosted fixture)', async () => {
    const f = fakeFetch({
      'https://plc.directory/did:plc:44ybard66vv44zksje25o7dz': () => json(bnewboldDidDoc),
    });
    const info = await fetchDidDoc('did:plc:44ybard66vv44zksje25o7dz', f);
    expect(info.pdsEndpoint).toBe('https://pds.robocracy.org');
    expect(info.claimedHandle).toBe('bnewbold.net');
  });

  it('fetches did:web from the domain well-known path', async () => {
    const doc = { ...bskyAppDidDoc, id: 'did:web:example.com' };
    const f = fakeFetch({ 'https://example.com/.well-known/did.json': () => json(doc) });
    const info = await fetchDidDoc('did:web:example.com', f);
    expect(info.pdsEndpoint).toBe('https://puffball.us-east.host.bsky.network');
  });

  it('missing PDS service or handle extract as null, not a crash', async () => {
    const doc = { id: 'did:plc:abc', service: [], alsoKnownAs: ['https://not-a-handle'] };
    const f = fakeFetch({ 'https://plc.directory/did:plc:abc': () => json(doc) });
    const info = await fetchDidDoc('did:plc:abc', f);
    expect(info.pdsEndpoint).toBeNull();
    expect(info.claimedHandle).toBeNull();
  });

  it('404 from plc.directory is a typed not-found error', async () => {
    const f = fakeFetch({
      'https://plc.directory/did:plc:gone': () => json({ message: 'DID not registered' }, 404),
    });
    await expect(fetchDidDoc('did:plc:gone', f)).rejects.toBeInstanceOf(DidNotFoundError);
  });

  it('did:web network/CORS failure is a distinctly-typed error', async () => {
    const f = fakeFetch({}); // every request throws TypeError, like a browser CORS block
    await expect(fetchDidDoc('did:web:example.com', f)).rejects.toBeInstanceOf(
      DidWebUnreachableError,
    );
  });
});
