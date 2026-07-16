// Collection view: listRecords page with rkey + one-line preview; Load more
// drives the cursor and disappears when the PDS stops returning one.
import { atRoute } from '../router/routes';
import type { RecordEnvelope } from '../xrpc';
import { course } from './course';
import { esc } from './html';

function preview(value: unknown): { snippet: string; createdAt: string } {
  const v = (value ?? {}) as Record<string, unknown>;
  const first = [v['text'], v['displayName'], v['name'], v['title']].find(
    (x): x is string => typeof x === 'string' && x.length > 0,
  );
  return {
    snippet: first ? (first.length > 100 ? `${first.slice(0, 100)}…` : first) : '',
    createdAt: typeof v['createdAt'] === 'string' ? v['createdAt'] : '',
  };
}

export function collectionView(
  did: string,
  collection: string,
  records: RecordEnvelope[],
  cursor: string | undefined,
): string {
  const rows = records
    .map((rec) => {
      const rkey = rec.uri.split('/').pop() ?? '';
      const { snippet, createdAt } = preview(rec.value);
      return `<li class="record-row">
  <a href="${esc(atRoute(did, collection, rkey))}"><code>${esc(rkey)}</code></a>
  ${createdAt ? `<span class="record-when">${esc(createdAt)}</span>` : ''}
  ${snippet ? `<span class="record-snippet">${esc(snippet)}</span>` : ''}
</li>`;
    })
    .join('');

  const more = cursor
    ? `<button type="button" class="load-more" data-cursor="${esc(cursor)}">Load more</button>`
    : '';

  return `
${course(did, collection)}
<section class="collection">
  <h2>${esc(collection)}</h2>
  <p class="record-actions">
    <button type="button" class="export-ndjson">Export collection (.ndjson)</button>
  </p>
  <ul class="records">${rows}</ul>
  ${more}
</section>`;
}
