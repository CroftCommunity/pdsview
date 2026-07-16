// Record view: drystone course, collapsible JSON tree on a Deep Schist panel,
// CID, raw-JSON toggle, copy-link and copy-JSON buttons.
import { atRoute } from '../router/routes';
import type { RecordEnvelope } from '../xrpc';
import { recordFilename } from '../export/filenames';
import { course } from './course';
import { esc } from './html';
import { jsonTree } from './json-tree';

export function recordView(
  did: string,
  collection: string,
  rkey: string,
  record: RecordEnvelope,
  pdsEndpoint?: string,
): string {
  const rawJson = JSON.stringify(record.value, null, 2);
  const blobCtx = pdsEndpoint ? { pds: pdsEndpoint, did } : undefined;
  return `
${course(did, collection, rkey)}
<section class="record">
  <p class="cid-line">CID <code>${esc(record.cid)}</code>
    <button type="button" class="copy" data-copy-text="${esc(record.cid)}">copy CID</button>
  </p>
  <p class="record-actions">
    <button type="button" class="copy" data-copy-link="${esc(atRoute(did, collection, rkey))}">copy link</button>
    <button type="button" class="copy" data-copy-text="${esc(rawJson)}">copy JSON</button>
    <button type="button" class="download-record" data-download-filename="${esc(recordFilename(did, collection, rkey))}">Download record (.json)</button>
  </p>
  ${jsonTree(record.value, blobCtx)}
  <details class="raw-json">
    <summary>raw JSON</summary>
    <pre class="panel">${esc(rawJson)}</pre>
  </details>
</section>`;
}
