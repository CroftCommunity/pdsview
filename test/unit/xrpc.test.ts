// Phase 2: the XRPC read client. Happy paths parse recorded fixtures; error
// states are first-class and distinct — CORS-blocked PDS is its own type,
// never a generic failure, and account deactivation/takedown surfaces the
// PDS's own message.
import { describe, expect, it } from 'vitest';
import {
  AccountUnavailableError,
  PdsReadBlockedError,
  XrpcNotFoundError,
  XrpcRequestError,
  describeRepo,
  getRecord,
  listRecords,
} from '../../src/xrpc';
import { describeRepoFixture } from '../fixtures/describe-repo';
import { getRecordFixture } from '../fixtures/get-record';
import { listRecordsFixture } from '../fixtures/list-records';

const PDS = 'https://puffball.us-east.host.bsky.network';
const DID = 'did:plc:z72i7hdynmk6r22z27h6tvur';

const jsonRes = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

function fetchReturning(body: unknown, status = 200): typeof fetch {
  return async () => jsonRes(body, status);
}

describe('happy paths from fixtures', () => {
  it('describeRepo returns the collection list', async () => {
    const res = await describeRepo(PDS, DID, fetchReturning(describeRepoFixture));
    expect(res.collections).toContain('app.bsky.feed.post');
    expect(res.handle).toBe('bsky.app');
  });

  it('listRecords returns record envelopes and a cursor', async () => {
    const res = await listRecords(PDS, DID, 'app.bsky.feed.post', {}, fetchReturning(listRecordsFixture));
    expect(res.records).toHaveLength(3);
    expect(res.records[0]!.uri).toMatch(/^at:\/\/did:plc:/);
    expect(res.cursor).toBeTruthy();
  });

  it('getRecord returns uri, cid and value', async () => {
    const res = await getRecord(PDS, DID, 'app.bsky.actor.profile', 'self', fetchReturning(getRecordFixture));
    expect(res.cid).toBe(getRecordFixture.cid);
    expect(res.value).toHaveProperty('$type', 'app.bsky.actor.profile');
  });

  it('listRecords builds the documented query shape', async () => {
    let seen = '';
    const f: typeof fetch = async (input) => {
      seen = String(input);
      return jsonRes(listRecordsFixture);
    };
    await listRecords(PDS, DID, 'app.bsky.feed.post', { limit: 50, cursor: 'abc' }, f);
    expect(seen).toBe(
      `${PDS}/xrpc/com.atproto.repo.listRecords?repo=${DID}&collection=app.bsky.feed.post&limit=50&cursor=abc`,
    );
  });
});

describe('distinct error states', () => {
  const throwing: typeof fetch = async () => {
    throw new TypeError('Failed to fetch');
  };

  it('a fetch-level failure on a PDS read is the CORS-distinct type', async () => {
    await expect(describeRepo(PDS, DID, throwing)).rejects.toBeInstanceOf(PdsReadBlockedError);
  });

  it('the CORS-distinct error carries the required interface copy', async () => {
    const err = await describeRepo(PDS, DID, throwing).catch((e) => e);
    expect(String(err.message)).toContain('does not allow browser reads (CORS)');
  });

  it('RecordNotFound / RepoNotFound map to typed not-found errors', async () => {
    const record = await getRecord(PDS, DID, 'x', 'y', fetchReturning({ error: 'RecordNotFound', message: 'Could not locate record' }, 400)).catch((e) => e);
    expect(record).toBeInstanceOf(XrpcNotFoundError);
    expect(record.what).toBe('record');

    const repo = await describeRepo(PDS, DID, fetchReturning({ error: 'RepoNotFound', message: 'Could not find repo' }, 400)).catch((e) => e);
    expect(repo).toBeInstanceOf(XrpcNotFoundError);
    expect(repo.what).toBe('repo');
  });

  it('deactivated and taken-down accounts surface the PDS message', async () => {
    const err = await describeRepo(PDS, DID, fetchReturning({ error: 'RepoDeactivated', message: 'Repo has been deactivated' }, 400)).catch((e) => e);
    expect(err).toBeInstanceOf(AccountUnavailableError);
    expect(err.pdsMessage).toBe('Repo has been deactivated');

    const taken = await describeRepo(PDS, DID, fetchReturning({ error: 'RepoTakendown', message: 'Repo has been takendown' }, 400)).catch((e) => e);
    expect(taken).toBeInstanceOf(AccountUnavailableError);
  });

  it('other failures are a generic typed request error', async () => {
    const err = await describeRepo(PDS, DID, fetchReturning({ error: 'InternalServerError' }, 500)).catch((e) => e);
    expect(err).toBeInstanceOf(XrpcRequestError);
  });
});
