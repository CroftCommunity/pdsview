// Named invariant: deep-links-are-did-canonical.
// Every internally generated route contains a DID, never a handle. Handle
// input resolves first, then navigation goes to the DID URL.
import { describe, expect, it } from 'vitest';
import { atRoute, parseRoute } from '../../src/router/routes';

const DID = 'did:plc:z72i7hdynmk6r22z27h6tvur';

describe('deep-links-are-did-canonical', () => {
  it('generates repo, collection and record routes from a DID', () => {
    expect(atRoute(DID)).toBe(`#/at/${DID}`);
    expect(atRoute(DID, 'app.bsky.feed.post')).toBe(`#/at/${DID}/app.bsky.feed.post`);
    expect(atRoute(DID, 'app.bsky.feed.post', '3kabc')).toBe(
      `#/at/${DID}/app.bsky.feed.post/3kabc`,
    );
  });

  it('refuses to generate a route for a handle authority', () => {
    expect(() => atRoute('alice.example.com')).toThrow();
    expect(() => atRoute('@alice.example.com')).toThrow();
    expect(() => atRoute('bsky.app', 'app.bsky.feed.post')).toThrow();
  });

  it('accepts did:web authorities too', () => {
    expect(atRoute('did:web:example.com')).toBe('#/at/did:web:example.com');
  });

  it('round-trips: parse(generate(x)) === x', () => {
    const r = parseRoute(atRoute(DID, 'app.bsky.feed.post', '3kabc'));
    expect(r).toEqual({
      kind: 'record',
      did: DID,
      collection: 'app.bsky.feed.post',
      rkey: '3kabc',
    });
  });

  it('parses repo and collection routes', () => {
    expect(parseRoute(`#/at/${DID}`)).toEqual({ kind: 'repo', did: DID });
    expect(parseRoute(`#/at/${DID}/app.bsky.feed.post`)).toEqual({
      kind: 'collection',
      did: DID,
      collection: 'app.bsky.feed.post',
    });
  });

  it('unknown or handle-bearing routes fall back to home', () => {
    expect(parseRoute('#/nonsense')).toEqual({ kind: 'home' });
    expect(parseRoute('')).toEqual({ kind: 'home' });
    expect(parseRoute('#/at/alice.example.com')).toEqual({ kind: 'home' });
  });
});
