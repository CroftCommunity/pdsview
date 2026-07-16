// The app's single fetch chokepoint. Every network request pdsview makes goes
// through guardedFetch, which enforces the no-unexpected-origins invariant at
// runtime — not only in tests.
import { assertAllowedUrl, type OriginContext } from './identity/allowlist';

export function guardedFetch(ctx: OriginContext): typeof fetch {
  return (input, init) => {
    const url = typeof input === 'string' || input instanceof URL ? String(input) : input.url;
    assertAllowedUrl(url, ctx);
    return fetch(input, init);
  };
}
