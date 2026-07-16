// Collection export: cursor-walk every page, one JSON line per record.
// Politeness: strictly sequential requests, no parallel fan-out.
import { listRecords } from '../xrpc';

export interface NdjsonExportResult {
  ndjson: string;
  records: number;
}

export async function exportCollectionNdjson(
  pds: string,
  did: string,
  collection: string,
  fetchFn: typeof fetch,
  opts: {
    onProgress?: (records: number) => void;
    signal?: AbortSignal;
    pageLimit?: number;
  },
): Promise<NdjsonExportResult> {
  const lines: string[] = [];
  let cursor: string | undefined;
  let count = 0;

  do {
    if (opts.signal?.aborted) {
      const err = new Error('collection export aborted');
      err.name = 'AbortError';
      throw err;
    }
    const listOpts: { limit: number; cursor?: string } = { limit: opts.pageLimit ?? 100 };
    if (cursor !== undefined) listOpts.cursor = cursor;
    const page = await listRecords(pds, did, collection, listOpts, fetchFn);
    for (const rec of page.records) {
      lines.push(JSON.stringify({ uri: rec.uri, cid: rec.cid, value: rec.value }));
    }
    count += page.records.length;
    opts.onProgress?.(count);
    cursor = page.cursor;
  } while (cursor !== undefined);

  return { ndjson: lines.map((l) => `${l}\n`).join(''), records: count };
}
