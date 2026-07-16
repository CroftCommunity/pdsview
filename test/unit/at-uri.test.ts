// Phase 1: at:// URI parse/format. Round-trips, and the formatter never
// emits a handle authority — canonical form is DID.
import { describe, expect, it } from 'vitest';
import { formatAtUri, parseAtUri } from '../../src/identity/at-uri';
import { InvalidInputError } from '../../src/identity/classify';

const DID = 'did:plc:z72i7hdynmk6r22z27h6tvur';

describe('parseAtUri', () => {
  it('parses authority-only, collection, and record URIs', () => {
    expect(parseAtUri(`at://${DID}`)).toEqual({ authority: DID });
    expect(parseAtUri(`at://${DID}/app.bsky.feed.post`)).toEqual({
      authority: DID,
      collection: 'app.bsky.feed.post',
    });
    expect(parseAtUri(`at://${DID}/app.bsky.feed.post/3kabc`)).toEqual({
      authority: DID,
      collection: 'app.bsky.feed.post',
      rkey: '3kabc',
    });
  });

  it('parses handle authorities (input side only)', () => {
    expect(parseAtUri('at://alice.example.com/app.bsky.feed.post')).toEqual({
      authority: 'alice.example.com',
      collection: 'app.bsky.feed.post',
    });
  });

  it('rejects non-at:// strings and empty authorities', () => {
    expect(() => parseAtUri('https://example.com')).toThrow(InvalidInputError);
    expect(() => parseAtUri('at://')).toThrow(InvalidInputError);
  });
});

describe('formatAtUri', () => {
  it('round-trips DID-authority URIs', () => {
    for (const s of [`at://${DID}`, `at://${DID}/app.bsky.feed.post`, `at://${DID}/app.bsky.feed.post/3kabc`]) {
      expect(formatAtUri(parseAtUri(s))).toBe(s);
    }
  });

  it('never emits a handle authority', () => {
    expect(() => formatAtUri({ authority: 'alice.example.com' })).toThrow(InvalidInputError);
  });
});
