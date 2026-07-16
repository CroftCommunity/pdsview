// Named invariant: no-unexpected-origins.
// The fetch layer refuses any origin not in: the resolved PDS host,
// plc.directory, api.bsky.app, and the handle's own domain (well-known probe).
import { describe, expect, it } from 'vitest';
import { isAllowedOrigin } from '../../src/identity/allowlist';

describe('no-unexpected-origins', () => {
  it('always allows plc.directory and api.bsky.app over https', () => {
    expect(isAllowedOrigin('https://plc.directory', {})).toBe(true);
    expect(isAllowedOrigin('https://api.bsky.app', {})).toBe(true);
  });

  it('allows the resolved PDS origin only when it is in context', () => {
    const ctx = { pdsOrigin: 'https://shimeji.us-east.host.bsky.network' };
    expect(isAllowedOrigin('https://shimeji.us-east.host.bsky.network', ctx)).toBe(true);
    expect(isAllowedOrigin('https://shimeji.us-east.host.bsky.network', {})).toBe(false);
    expect(isAllowedOrigin('https://other.host.bsky.network', ctx)).toBe(false);
  });

  it("allows the handle's own domain for the well-known probe", () => {
    const ctx = { handleDomain: 'alice.example.com' };
    expect(isAllowedOrigin('https://alice.example.com', ctx)).toBe(true);
    expect(isAllowedOrigin('https://example.com', ctx)).toBe(false);
  });

  it('refuses plain-http versions of allowed hosts', () => {
    expect(isAllowedOrigin('http://plc.directory', {})).toBe(false);
    expect(isAllowedOrigin('http://api.bsky.app', {})).toBe(false);
    expect(isAllowedOrigin('http://alice.example.com', { handleDomain: 'alice.example.com' })).toBe(false);
  });

  it('refuses lookalike and suffix-attack origins', () => {
    expect(isAllowedOrigin('https://plc.directory.evil.com', {})).toBe(false);
    expect(isAllowedOrigin('https://xplc.directory', {})).toBe(false);
    expect(isAllowedOrigin('https://api.bsky.app.evil.com', {})).toBe(false);
    expect(isAllowedOrigin('https://evil.com', { handleDomain: 'alice.example.com' })).toBe(false);
  });

  it('assertAllowedUrl throws a typed error for a disallowed URL', async () => {
    const { assertAllowedUrl, DisallowedOriginError } = await import('../../src/identity/allowlist');
    expect(() => assertAllowedUrl('https://evil.com/steal', {})).toThrow(DisallowedOriginError);
    expect(() => assertAllowedUrl('https://plc.directory/did:plc:abc', {})).not.toThrow();
  });
});
