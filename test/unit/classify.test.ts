// Phase 1: input classifier. A pasted string becomes a typed result —
// did:plc, did:web, handle, or at:// URI — or a typed rejection.
import { describe, expect, it } from 'vitest';
import { classifyInput, InvalidInputError } from '../../src/identity/classify';

describe('classifyInput', () => {
  it('classifies a did:plc', () => {
    expect(classifyInput('did:plc:z72i7hdynmk6r22z27h6tvur')).toEqual({
      kind: 'did',
      method: 'plc',
      did: 'did:plc:z72i7hdynmk6r22z27h6tvur',
    });
  });

  it('classifies a did:web', () => {
    expect(classifyInput('did:web:example.com')).toEqual({
      kind: 'did',
      method: 'web',
      did: 'did:web:example.com',
    });
  });

  it('classifies a handle and strips a leading @', () => {
    expect(classifyInput('alice.example.com')).toEqual({
      kind: 'handle',
      handle: 'alice.example.com',
    });
    expect(classifyInput('@alice.example.com')).toEqual({
      kind: 'handle',
      handle: 'alice.example.com',
    });
  });

  it('lowercases handles and trims whitespace', () => {
    expect(classifyInput('  Alice.Example.COM  ')).toEqual({
      kind: 'handle',
      handle: 'alice.example.com',
    });
  });

  it('classifies at:// URIs with DID or handle authority', () => {
    expect(classifyInput('at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.post/3kabc')).toEqual({
      kind: 'at-uri',
      uri: {
        authority: 'did:plc:z72i7hdynmk6r22z27h6tvur',
        collection: 'app.bsky.feed.post',
        rkey: '3kabc',
      },
    });
    expect(classifyInput('at://alice.example.com')).toEqual({
      kind: 'at-uri',
      uri: { authority: 'alice.example.com' },
    });
  });

  it('rejects garbage with a typed error', () => {
    for (const bad of ['', '   ', 'not a handle', 'http://example.com', 'did:key:zabc', 'single-label']) {
      expect(() => classifyInput(bad), `should reject: "${bad}"`).toThrow(InvalidInputError);
    }
  });
});
