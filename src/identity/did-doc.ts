// Phase 1 DID document fetch. did:plc resolves via plc.directory; did:web via
// the domain's /.well-known/did.json. A did:web network failure is its own
// error type: the spec does not require CORS on that path, so a browser block
// there is an expected condition, not a generic failure.
import { InvalidInputError } from './errors';

export interface DidDocInfo {
  did: string;
  /** serviceEndpoint of the #atproto_pds service entry, or null if absent. */
  pdsEndpoint: string | null;
  /** Handle from the first at:// alsoKnownAs entry, or null if absent. */
  claimedHandle: string | null;
  doc: Record<string, unknown>;
}

export class DidNotFoundError extends Error {
  override name = 'DidNotFoundError';
  constructor(did: string) {
    super(`DID not found in its directory: ${did}`);
  }
}

export class DidWebUnreachableError extends Error {
  override name = 'DidWebUnreachableError';
  constructor(did: string) {
    super(
      `could not fetch the did:web document for ${did} — the domain may be down or may not allow browser reads (CORS is not required on /.well-known/did.json)`,
    );
  }
}

export class DidDocFetchError extends Error {
  override name = 'DidDocFetchError';
  constructor(did: string, detail: string) {
    super(`failed to fetch DID document for ${did}: ${detail}`);
  }
}

export function didDocUrl(did: string): string {
  if (did.startsWith('did:plc:')) return `https://plc.directory/${did}`;
  if (did.startsWith('did:web:')) {
    return `https://${did.slice('did:web:'.length)}/.well-known/did.json`;
  }
  throw new InvalidInputError(did, 'atproto supports only did:plc and did:web');
}

interface ServiceEntry {
  id?: unknown;
  type?: unknown;
  serviceEndpoint?: unknown;
}

export function extractPdsEndpoint(doc: Record<string, unknown>): string | null {
  const services = Array.isArray(doc['service']) ? (doc['service'] as ServiceEntry[]) : [];
  const pds = services.find(
    (s) =>
      (typeof s.id === 'string' && s.id.endsWith('#atproto_pds')) ||
      s.type === 'AtprotoPersonalDataServer',
  );
  return typeof pds?.serviceEndpoint === 'string' ? pds.serviceEndpoint : null;
}

export function extractClaimedHandle(doc: Record<string, unknown>): string | null {
  const aka = Array.isArray(doc['alsoKnownAs']) ? doc['alsoKnownAs'] : [];
  const entry = aka.find((a): a is string => typeof a === 'string' && a.startsWith('at://'));
  return entry ? entry.slice('at://'.length) : null;
}

export async function fetchDidDoc(
  did: string,
  fetchFn: typeof fetch = fetch,
): Promise<DidDocInfo> {
  const url = didDocUrl(did);
  let res: Response;
  try {
    res = await fetchFn(url);
  } catch (err) {
    if (did.startsWith('did:web:')) throw new DidWebUnreachableError(did);
    throw new DidDocFetchError(did, String(err));
  }
  if (res.status === 404 || res.status === 410) throw new DidNotFoundError(did);
  if (!res.ok) throw new DidDocFetchError(did, `HTTP ${res.status}`);
  const doc = (await res.json()) as Record<string, unknown>;
  return {
    did,
    pdsEndpoint: extractPdsEndpoint(doc),
    claimedHandle: extractClaimedHandle(doc),
    doc,
  };
}
