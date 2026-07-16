// Error states are first-class and distinct: each has its own copy, in
// interface voice, stating what happened and what the user can do.
import { esc } from './html';

export type ErrorKind = 'cors' | 'not-found' | 'account-unavailable' | 'network' | 'invalid';

const COPY: Record<ErrorKind, (detail?: string) => { title: string; body: string }> = {
  cors: () => ({
    title: 'This PDS can’t be read from a browser',
    body: 'This PDS does not allow browser reads (CORS). The data is still public — a command-line fetch of the same URL would work — but pdsview runs entirely in your browser, so it can’t reach it. You can still export the full repo as a CAR file, which the spec guarantees works without authentication.',
  }),
  'not-found': (detail) => ({
    title: `No such ${detail ?? 'thing'} here`,
    body: 'The PDS answered, but nothing lives at this path. It may have been deleted, or the address may have a typo. Check the collection and record key, or go back to the repo page and browse from there.',
  }),
  'account-unavailable': (detail) => ({
    title: 'This account is not available',
    body: `The PDS declined to serve this repository. Its exact words: “${detail ?? 'unavailable'}”. Deactivated accounts can come back; taken-down ones usually don’t.`,
  }),
  network: () => ({
    title: 'The network didn’t answer',
    body: 'The request never completed — you may be offline, or the server may be down. Check your connection and try again.',
  }),
  invalid: () => ({
    title: 'That input didn’t parse',
    body: 'pdsview accepts a handle (alice.bsky.social), a DID (did:plc:… or did:web:…), or an at:// URI. Paste one of those and try again.',
  }),
};

export function errorView(kind: ErrorKind, detail?: string): string {
  const { title, body } = COPY[kind](detail);
  return `<section class="error-state" role="alert"><h2>${esc(title)}</h2><p>${esc(body)}</p></section>`;
}
