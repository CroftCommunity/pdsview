// Read-only XRPC client. Layer honesty: permissive CORS on com.atproto.repo.*
// reads is deployment behavior of the reference PDS, not a spec guarantee —
// so a fetch-level failure on a PDS read is typed as PdsReadBlockedError and
// rendered as its own state, never a generic failure.

export interface RecordEnvelope {
  uri: string;
  cid: string;
  value: unknown;
}

export interface DescribeRepoResponse {
  did: string;
  handle: string;
  didDoc: unknown;
  collections: string[];
}

export interface ListRecordsResponse {
  records: RecordEnvelope[];
  cursor?: string;
}

export class PdsReadBlockedError extends Error {
  override name = 'PdsReadBlockedError';
  constructor(pds: string) {
    super(
      `could not read from ${pds}: this PDS does not allow browser reads (CORS), or the request could not leave the browser`,
    );
  }
}

export class XrpcNotFoundError extends Error {
  override name = 'XrpcNotFoundError';
  constructor(
    public readonly what: 'repo' | 'record',
    pdsMessage: string,
  ) {
    super(pdsMessage);
  }
}

export class AccountUnavailableError extends Error {
  override name = 'AccountUnavailableError';
  constructor(
    public readonly state: 'deactivated' | 'takendown',
    public readonly pdsMessage: string,
  ) {
    super(pdsMessage);
  }
}

export class XrpcRequestError extends Error {
  override name = 'XrpcRequestError';
}

async function xrpcGet<T>(
  pds: string,
  nsid: string,
  params: Record<string, string>,
  fetchFn: typeof fetch,
): Promise<T> {
  // Colons are legal in query strings; keep DIDs readable (matches the
  // documented endpoint shapes and copy-pastes cleanly).
  const query = new URLSearchParams(params).toString().replaceAll('%3A', ':');
  const url = `${pds}/xrpc/${nsid}${query ? `?${query}` : ''}`;
  let res: Response;
  try {
    res = await fetchFn(url);
  } catch {
    throw new PdsReadBlockedError(pds);
  }
  if (!res.ok) {
    let body: { error?: string; message?: string } = {};
    try {
      body = (await res.json()) as typeof body;
    } catch {
      // non-JSON error body; fall through to the generic error
    }
    const message = body.message ?? `HTTP ${res.status}`;
    switch (body.error) {
      case 'RecordNotFound':
        throw new XrpcNotFoundError('record', message);
      case 'RepoNotFound':
        throw new XrpcNotFoundError('repo', message);
      case 'RepoDeactivated':
        throw new AccountUnavailableError('deactivated', message);
      case 'RepoTakendown':
        throw new AccountUnavailableError('takendown', message);
      default:
        throw new XrpcRequestError(`${nsid} failed: ${message}`);
    }
  }
  return (await res.json()) as T;
}

export function describeRepo(
  pds: string,
  did: string,
  fetchFn: typeof fetch,
): Promise<DescribeRepoResponse> {
  return xrpcGet(pds, 'com.atproto.repo.describeRepo', { repo: did }, fetchFn);
}

export function listRecords(
  pds: string,
  did: string,
  collection: string,
  opts: { limit?: number; cursor?: string },
  fetchFn: typeof fetch,
): Promise<ListRecordsResponse> {
  const params: Record<string, string> = { repo: did, collection };
  if (opts.limit !== undefined) params['limit'] = String(opts.limit);
  if (opts.cursor !== undefined) params['cursor'] = opts.cursor;
  return xrpcGet(pds, 'com.atproto.repo.listRecords', params, fetchFn);
}

export function getRecord(
  pds: string,
  did: string,
  collection: string,
  rkey: string,
  fetchFn: typeof fetch,
): Promise<RecordEnvelope> {
  return xrpcGet(pds, 'com.atproto.repo.getRecord', { repo: did, collection, rkey }, fetchFn);
}
