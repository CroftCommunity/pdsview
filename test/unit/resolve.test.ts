// Phase 1: the handle resolution ladder. Rung 1 is the handle domain's
// well-known text file (works only if the site sends CORS); rung 2 falls back
// to api.bsky.app. The rung that succeeded is recorded as provenance.
import { describe, expect, it } from 'vitest';
import { HandleResolutionError, resolveHandle } from '../../src/identity/resolve';

function fakeFetch(routes: Record<string, () => Response>): typeof fetch {
  return async (input) => {
    const url = String(input);
    const handler = routes[url];
    if (!handler) throw new TypeError(`Failed to fetch: no route for ${url}`);
    return handler();
  };
}

const DID = 'did:plc:z72i7hdynmk6r22z27h6tvur';

describe('resolveHandle', () => {
  it('rung 1: reads a bare DID from the well-known text file, stripping whitespace', async () => {
    const f = fakeFetch({
      'https://alice.example.com/.well-known/atproto-did': () => new Response(`  ${DID}\n`),
    });
    expect(await resolveHandle('alice.example.com', f)).toEqual({
      did: DID,
      rung: 'well-known',
    });
  });

  it('rung 2: falls back to api.bsky.app when the well-known probe throws (no CORS)', async () => {
    const f = fakeFetch({
      [`https://api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=alice.example.com`]:
        () => new Response(JSON.stringify({ did: DID })),
    });
    expect(await resolveHandle('alice.example.com', f)).toEqual({
      did: DID,
      rung: 'api.bsky.app',
    });
  });

  it('rung 2 also covers a well-known response that is not a valid DID', async () => {
    const f = fakeFetch({
      'https://alice.example.com/.well-known/atproto-did': () =>
        new Response('<html>404 page</html>'),
      [`https://api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=alice.example.com`]:
        () => new Response(JSON.stringify({ did: DID })),
    });
    expect((await resolveHandle('alice.example.com', f)).rung).toBe('api.bsky.app');
  });

  it('normalizes the handle (@, case, whitespace) before resolving', async () => {
    const f = fakeFetch({
      'https://alice.example.com/.well-known/atproto-did': () => new Response(DID),
    });
    expect((await resolveHandle(' @Alice.Example.com ', f)).did).toBe(DID);
  });

  it('throws a typed error when both rungs fail', async () => {
    const f = fakeFetch({
      [`https://api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=alice.example.com`]:
        () => new Response(JSON.stringify({ error: 'InvalidRequest' }), { status: 400 }),
    });
    await expect(resolveHandle('alice.example.com', f)).rejects.toBeInstanceOf(
      HandleResolutionError,
    );
  });
});
