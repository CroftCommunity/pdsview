// Collapsible JSON tree on a Deep Schist panel. Every at:// URI with a DID
// authority and every bare DID in string values becomes an internal link;
// with a PDS context, blob references render inline (images) or as labeled
// download links.
import { parseAtUri } from '../identity/at-uri';
import { isAtprotoDid } from '../identity/classify';
import { atRoute } from '../router/routes';
import { blobHtml, isBlobRef } from './blob';
import { esc } from './html';

export interface BlobContext {
  pds: string;
  did: string;
}

function linkified(value: string): string | null {
  if (isAtprotoDid(value)) {
    return `<a href="${esc(atRoute(value))}">${esc(value)}</a>`;
  }
  if (value.startsWith('at://')) {
    try {
      const uri = parseAtUri(value);
      if (uri.authority.startsWith('did:')) {
        return `<a href="${esc(atRoute(uri.authority, uri.collection, uri.rkey))}">${esc(value)}</a>`;
      }
    } catch {
      // fall through to plain text
    }
  }
  return null;
}

function renderValue(value: unknown, path: string, ctx: BlobContext | undefined): string {
  if (value === null) return `<span class="json-null">null</span>`;
  switch (typeof value) {
    case 'string': {
      const link = linkified(value);
      return link ?? `<span class="json-string">"${esc(value)}"</span>`;
    }
    case 'number':
    case 'boolean':
      return `<span class="json-literal">${String(value)}</span>`;
    case 'object': {
      if (ctx && isBlobRef(value)) {
        const fields = renderEntries(Object.entries(value), 'blob fields', path, ctx, false);
        return `<div class="blob-node">${blobHtml(ctx.pds, ctx.did, value, path)}${fields}</div>`;
      }
      return Array.isArray(value)
        ? renderArray(value, path, ctx)
        : renderObject(value as Record<string, unknown>, path, ctx);
    }
    default:
      return `<span class="json-literal">${esc(String(value))}</span>`;
  }
}

function renderEntries(
  entries: [string, unknown][],
  summary: string,
  path: string,
  ctx: BlobContext | undefined,
  open = true,
): string {
  const rows = entries
    .map(
      ([key, v]) =>
        `<li><span class="json-key">${esc(key)}</span>: ${renderValue(v, `${path}.${key}`, ctx)}</li>`,
    )
    .join('');
  return `<details${open ? ' open' : ''} class="json-node"><summary>${summary}</summary><ul>${rows}</ul></details>`;
}

function renderObject(
  obj: Record<string, unknown>,
  path: string,
  ctx: BlobContext | undefined,
): string {
  const entries = Object.entries(obj);
  return renderEntries(entries, `{…} <span class="json-meta">${entries.length} keys</span>`, path, ctx);
}

function renderArray(arr: unknown[], path: string, ctx: BlobContext | undefined): string {
  return renderEntries(
    arr.map((v, i) => [String(i), v] as [string, unknown]),
    `[…] <span class="json-meta">${arr.length} items</span>`,
    path,
    ctx,
  );
}

export function jsonTree(value: unknown, ctx?: BlobContext): string {
  return `<div class="json-tree panel">${renderValue(value, 'value', ctx)}</div>`;
}
