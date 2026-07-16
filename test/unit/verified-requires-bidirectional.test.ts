// Named invariant: verified-requires-bidirectional.
// A handle is "verified" only when the DID document claims it back via its
// canonical alsoKnownAs entry. One-way resolution renders as unverified.
import { describe, expect, it } from 'vitest';
import { isHandleVerified } from '../../src/identity/verify';

describe('verified-requires-bidirectional', () => {
  it('verified when the DID doc claims the handle back', () => {
    expect(
      isHandleVerified('alice.example.com', { alsoKnownAs: ['at://alice.example.com'] }),
    ).toBe(true);
  });

  it('unverified when the DID doc claims a different handle', () => {
    expect(
      isHandleVerified('alice.example.com', { alsoKnownAs: ['at://bob.example.com'] }),
    ).toBe(false);
  });

  it('unverified when alsoKnownAs is missing or empty (one-way resolution)', () => {
    expect(isHandleVerified('alice.example.com', {})).toBe(false);
    expect(isHandleVerified('alice.example.com', { alsoKnownAs: [] })).toBe(false);
  });

  it('only the first at:// entry is canonical — a later match does not verify', () => {
    expect(
      isHandleVerified('alice.example.com', {
        alsoKnownAs: ['at://bob.example.com', 'at://alice.example.com'],
      }),
    ).toBe(false);
  });

  it('ignores non-at:// alsoKnownAs entries when finding the canonical handle', () => {
    expect(
      isHandleVerified('alice.example.com', {
        alsoKnownAs: ['https://alice.example.com', 'at://alice.example.com'],
      }),
    ).toBe(true);
  });

  it('comparison is case-insensitive and tolerates a leading @', () => {
    expect(
      isHandleVerified('@Alice.Example.COM', { alsoKnownAs: ['at://alice.example.com'] }),
    ).toBe(true);
  });
});
