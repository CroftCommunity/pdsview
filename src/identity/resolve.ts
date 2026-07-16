// Phase 1 handle resolution ladder.
// Rung 1: GET https://{handle}/.well-known/atproto-did — a bare DID in plain
// text; succeeds only if the site sends CORS, so failure here is routine.
// Rung 2: api.bsky.app's resolveHandle. The successful rung is recorded and
// surfaced in the UI as resolution provenance.
import { isAtprotoDid } from './classify';
import { normalizeHandle } from './verify';

export type ResolutionRung = 'well-known' | 'api.bsky.app';

export interface HandleResolution {
  did: string;
  rung: ResolutionRung;
}

export class HandleResolutionError extends Error {
  override name = 'HandleResolutionError';
  constructor(handle: string) {
    super(`could not resolve handle: ${handle}`);
  }
}

export async function resolveHandle(
  input: string,
  fetchFn: typeof fetch = fetch,
): Promise<HandleResolution> {
  const handle = normalizeHandle(input);

  try {
    const res = await fetchFn(`https://${handle}/.well-known/atproto-did`);
    if (res.ok) {
      const did = (await res.text()).trim();
      if (isAtprotoDid(did)) return { did, rung: 'well-known' };
    }
  } catch {
    // No CORS, DNS failure, or no such file — expected; fall to rung 2.
  }

  try {
    const res = await fetchFn(
      `https://api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=${encodeURIComponent(handle)}`,
    );
    if (res.ok) {
      const body = (await res.json()) as { did?: unknown };
      if (typeof body.did === 'string' && isAtprotoDid(body.did)) {
        return { did: body.did, rung: 'api.bsky.app' };
      }
    }
  } catch {
    // fall through to the typed error
  }

  throw new HandleResolutionError(handle);
}
