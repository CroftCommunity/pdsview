// Collapsible JSON tree on a Deep Schist panel. Every at:// URI with a DID
// authority and every bare DID in string values becomes an internal link.
import { parseAtUri } from '../identity/at-uri';
import { isAtprotoDid } from '../identity/classify';
import { atRoute } from '../router/routes';
import { esc } from './html';

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

function renderValue(value: unknown): string {
  if (value === null) return `<span class="json-null">null</span>`;
  switch (typeof value) {
    case 'string': {
      const link = linkified(value);
      return link ?? `<span class="json-string">"${esc(value)}"</span>`;
    }
    case 'number':
    case 'boolean':
      return `<span class="json-literal">${String(value)}</span>`;
    case 'object':
      return Array.isArray(value) ? renderArray(value) : renderObject(value as Record<string, unknown>);
    default:
      return `<span class="json-literal">${esc(String(value))}</span>`;
  }
}

function renderEntries(entries: [string, unknown][], summary: string): string {
  const rows = entries
    .map(([key, v]) => `<li><span class="json-key">${esc(key)}</span>: ${renderValue(v)}</li>`)
    .join('');
  return `<details open class="json-node"><summary>${summary}</summary><ul>${rows}</ul></details>`;
}

function renderObject(obj: Record<string, unknown>): string {
  const entries = Object.entries(obj);
  return renderEntries(entries, `{…} <span class="json-meta">${entries.length} keys</span>`);
}

function renderArray(arr: unknown[]): string {
  return renderEntries(
    arr.map((v, i) => [String(i), v] as [string, unknown]),
    `[…] <span class="json-meta">${arr.length} items</span>`,
  );
}

export function jsonTree(value: unknown): string {
  return `<div class="json-tree panel">${renderValue(value)}</div>`;
}
