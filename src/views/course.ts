// The signature element: the record path as a drystone "course" — stacked
// stone segments echoing crofting_site's .course divider.
import { atRoute } from '../router/routes';
import { esc } from './html';

export function course(did: string, collection?: string, rkey?: string): string {
  const stones: string[] = [
    `<a class="stone" href="#/">at://</a>`,
    `<a class="stone" href="${esc(atRoute(did))}"><code>${esc(shortDid(did))}</code></a>`,
  ];
  if (collection !== undefined) {
    const href = rkey === undefined ? null : esc(atRoute(did, collection));
    stones.push(
      href
        ? `<a class="stone" href="${href}">${esc(collection)}</a>`
        : `<span class="stone current">${esc(collection)}</span>`,
    );
  }
  if (rkey !== undefined && collection !== undefined) {
    stones.push(`<span class="stone current">${esc(rkey)}</span>`);
  }
  return `<nav class="course" aria-label="record path">${stones.join('')}</nav>`;
}

function shortDid(did: string): string {
  return did.length > 24 ? `${did.slice(0, 14)}…${did.slice(-4)}` : did;
}
