// Phase 3: export. NDJSON assembly walks the cursor sequentially (politeness:
// no parallel fan-out), terminates when the PDS stops returning a cursor, is
// abortable, and filenames follow the documented conventions.
import { describe, expect, it } from 'vitest';
import { carFilename, ndjsonFilename, recordFilename } from '../../src/export/filenames';
import { exportCollectionNdjson } from '../../src/export/ndjson';
import { listRecordsFixture } from '../fixtures/list-records';

const PDS = 'https://pds.example.org';
const DID = 'did:plc:z72i7hdynmk6r22z27h6tvur';
const NSID = 'app.bsky.feed.post';

// Two pages built from the live fixture: first with a cursor, second without.
const page1 = { records: listRecordsFixture.records.slice(0, 2), cursor: 'page-2' };
const page2 = { records: listRecordsFixture.records.slice(2) };

function pagedFetch(log: string[] = []): typeof fetch {
  let inFlight = 0;
  return async (input) => {
    const url = new URL(String(input));
    log.push(url.searchParams.get('cursor') ?? '(first)');
    inFlight += 1;
    expect(inFlight, 'requests must be sequential, not parallel').toBe(1);
    await new Promise((r) => setTimeout(r, 5));
    inFlight -= 1;
    const body = url.searchParams.get('cursor') === 'page-2' ? page2 : page1;
    return new Response(JSON.stringify(body));
  };
}

describe('exportCollectionNdjson', () => {
  it('walks every page and emits one {uri, cid, value} JSON line per record', async () => {
    const { ndjson, records } = await exportCollectionNdjson(PDS, DID, NSID, pagedFetch(), {});
    const lines = ndjson.trimEnd().split('\n');
    expect(records).toBe(listRecordsFixture.records.length);
    expect(lines).toHaveLength(listRecordsFixture.records.length);
    lines.forEach((line, i) => {
      const parsed = JSON.parse(line);
      expect(Object.keys(parsed)).toEqual(['uri', 'cid', 'value']);
      expect(parsed.uri).toBe(listRecordsFixture.records[i]!.uri);
    });
  });

  it('terminates exactly when no cursor returns', async () => {
    const log: string[] = [];
    await exportCollectionNdjson(PDS, DID, NSID, pagedFetch(log), {});
    expect(log).toEqual(['(first)', 'page-2']);
  });

  it('reports progress per page', async () => {
    const seen: number[] = [];
    await exportCollectionNdjson(PDS, DID, NSID, pagedFetch(), {
      onProgress: (n) => seen.push(n),
    });
    expect(seen).toEqual([2, 3]);
  });

  it('aborts between pages without another request', async () => {
    const log: string[] = [];
    const controller = new AbortController();
    const f = pagedFetch(log);
    const aborting: typeof fetch = async (input) => {
      const res = await f(input);
      controller.abort();
      return res;
    };
    await expect(
      exportCollectionNdjson(PDS, DID, NSID, aborting, { signal: controller.signal }),
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(log).toEqual(['(first)']);
  });
});

describe('filename conventions', () => {
  it('follows {did}.car, {did}.{collection}.ndjson, {did}.{collection}.{rkey}.json', () => {
    expect(carFilename(DID)).toBe(`${DID}.car`);
    expect(ndjsonFilename(DID, NSID)).toBe(`${DID}.${NSID}.ndjson`);
    expect(recordFilename(DID, NSID, '3kabc')).toBe(`${DID}.${NSID}.3kabc.json`);
  });
});
