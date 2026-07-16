// Blob references in record values. Shape confirmed against a live record
// (run-01 verify ledger item 4): { $type: "blob", ref: { $link: cid },
// mimeType, size }.
import { esc } from './html';

export interface BlobRef {
  $type: 'blob';
  ref: { $link: string };
  mimeType: string;
  size: number;
}

export function isBlobRef(value: unknown): value is BlobRef {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  const ref = v['ref'] as Record<string, unknown> | undefined;
  return (
    v['$type'] === 'blob' &&
    typeof ref === 'object' &&
    ref !== null &&
    typeof ref['$link'] === 'string' &&
    typeof v['mimeType'] === 'string' &&
    typeof v['size'] === 'number'
  );
}

export function blobUrl(pds: string, did: string, cid: string): string {
  return `${pds}/xrpc/com.atproto.sync.getBlob?did=${did}&cid=${cid}`;
}

export function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} kB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function blobDownloadLink(pds: string, did: string, blob: BlobRef): string {
  const url = blobUrl(pds, did, blob.ref.$link);
  return `<a class="blob-download" href="${esc(url)}" download="${esc(blob.ref.$link)}">download blob (${esc(blob.mimeType)}, ${esc(humanSize(blob.size))})</a>`;
}

export function blobHtml(pds: string, did: string, blob: BlobRef, fieldPath: string): string {
  if (blob.mimeType.startsWith('image/')) {
    const url = blobUrl(pds, did, blob.ref.$link);
    return `<img class="blob-image" src="${esc(url)}" loading="lazy" alt="image blob at ${esc(fieldPath)}" data-blob-mime="${esc(blob.mimeType)}" data-blob-size="${String(blob.size)}" data-blob-cid="${esc(blob.ref.$link)}">`;
  }
  return blobDownloadLink(pds, did, blob);
}
