// Named invariant: deep-links-are-did-canonical.
// Every internally generated route contains a DID, never a handle. Handle
// input must be resolved first; navigation then targets the DID route with
// the handle shown on-page only.

export type Route =
  | { kind: 'home' }
  | { kind: 'repo'; did: string }
  | { kind: 'collection'; did: string; collection: string }
  | { kind: 'record'; did: string; collection: string; rkey: string };

const DID_RE = /^did:[a-z]+:[A-Za-z0-9._%:-]+$/;

export function isDid(input: string): boolean {
  return DID_RE.test(input);
}

export function atRoute(did: string, collection?: string, rkey?: string): string {
  if (!isDid(did)) {
    throw new Error(`routes are DID-canonical; refusing non-DID authority: ${did}`);
  }
  let route = `#/at/${did}`;
  if (collection !== undefined) route += `/${collection}`;
  if (rkey !== undefined) {
    if (collection === undefined) throw new Error('an rkey requires a collection');
    route += `/${rkey}`;
  }
  return route;
}

export function parseRoute(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter((p) => p.length > 0);
  const [at, did, collection, rkey, ...rest] = parts;
  if (at !== 'at' || did === undefined || !isDid(did) || rest.length > 0) {
    return { kind: 'home' };
  }
  if (collection === undefined) return { kind: 'repo', did };
  if (rkey === undefined) return { kind: 'collection', did, collection };
  return { kind: 'record', did, collection, rkey };
}
