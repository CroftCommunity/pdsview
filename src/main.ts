// App wiring: classify input, resolve handles (never letting one reach the
// URL), route hashes to views, and delegate copy/load-more interactions.
import { classifyInput } from './identity/classify';
import { DidWebUnreachableError, fetchDidDoc, type DidDocInfo } from './identity/did-doc';
import { InvalidInputError } from './identity/errors';
import { HandleResolutionError, resolveHandle, type ResolutionRung } from './identity/resolve';
import { isHandleVerified } from './identity/verify';
import { guardedFetch } from './fetch-guard';
import { atRoute, parseRoute } from './router/routes';
import {
  AccountUnavailableError,
  PdsReadBlockedError,
  XrpcNotFoundError,
  describeRepo,
  getRecord,
  listRecords,
  type RecordEnvelope,
} from './xrpc';
import { collectionView } from './views/collection';
import { errorView } from './views/errors';
import { recordView } from './views/record';
import { repoView } from './views/repo';

const main = document.querySelector('main');
const homeHtml = main?.innerHTML ?? '';

// Identity info per DID, so navigating repo -> collection -> record does not
// re-fetch the DID document every time.
interface Identity extends DidDocInfo {
  verified: boolean;
}
const identityCache = new Map<string, Promise<Identity>>();

// Set when the user arrives via a handle, to show resolution provenance.
let lastResolution: { did: string; rung: ResolutionRung } | null = null;

function loadIdentity(did: string): Promise<Identity> {
  let cached = identityCache.get(did);
  if (!cached) {
    cached = (async () => {
      const info = await fetchDidDoc(did, guardedFetch({}));
      let verified = false;
      if (
        info.claimedHandle !== null &&
        isHandleVerified(info.claimedHandle, info.doc as { alsoKnownAs?: string[] })
      ) {
        // Bidirectional: the doc claims the handle; the handle must also
        // resolve forward to this same DID.
        try {
          const fetchFn = guardedFetch({ handleDomain: info.claimedHandle });
          verified = (await resolveHandle(info.claimedHandle, fetchFn)).did === did;
        } catch {
          verified = false;
        }
      }
      return { ...info, verified };
    })();
    identityCache.set(did, cached);
    cached.catch(() => identityCache.delete(did));
  }
  return cached;
}

function renderError(err: unknown): string {
  if (err instanceof PdsReadBlockedError) return errorView('cors');
  if (err instanceof XrpcNotFoundError) return errorView('not-found', err.what);
  if (err instanceof AccountUnavailableError) return errorView('account-unavailable', err.pdsMessage);
  if (err instanceof InvalidInputError) return errorView('invalid');
  if (err instanceof DidWebUnreachableError) return errorView('network', err.message);
  return errorView('network');
}

function pdsFetch(identity: Identity): { pds: string; fetchFn: typeof fetch } {
  if (!identity.pdsEndpoint) {
    throw new XrpcNotFoundError('repo', 'the DID document lists no PDS for this account');
  }
  return {
    pds: identity.pdsEndpoint,
    fetchFn: guardedFetch({ pdsOrigin: identity.pdsEndpoint }),
  };
}

async function renderRepo(did: string): Promise<string> {
  const identity = await loadIdentity(did);
  const { pds, fetchFn } = pdsFetch(identity);
  const described = await describeRepo(pds, did, fetchFn);
  const provenance = lastResolution?.did === did ? lastResolution.rung : null;
  return repoView({
    did,
    claimedHandle: identity.claimedHandle,
    verified: identity.verified,
    provenance,
    pdsEndpoint: identity.pdsEndpoint,
    collections: described.collections,
  });
}

// Accumulated records for the collection route currently on screen, so Load
// more can append across cursor pages.
let collectionState: { key: string; records: RecordEnvelope[]; cursor?: string } | null = null;

async function renderCollection(did: string, collection: string, cursor?: string): Promise<string> {
  const identity = await loadIdentity(did);
  const { pds, fetchFn } = pdsFetch(identity);
  const opts: { limit: number; cursor?: string } = { limit: 50 };
  if (cursor !== undefined) opts.cursor = cursor;
  const page = await listRecords(pds, did, collection, opts, fetchFn);

  const key = `${did}/${collection}`;
  const records =
    cursor !== undefined && collectionState?.key === key
      ? [...collectionState.records, ...page.records]
      : page.records;
  collectionState = { key, records, ...(page.cursor !== undefined ? { cursor: page.cursor } : {}) };
  return collectionView(did, collection, records, page.cursor);
}

async function renderRecord(did: string, collection: string, rkey: string): Promise<string> {
  const identity = await loadIdentity(did);
  const { pds, fetchFn } = pdsFetch(identity);
  const record = await getRecord(pds, did, collection, rkey, fetchFn);
  return recordView(did, collection, rkey, record);
}

async function renderRoute(): Promise<void> {
  if (!main) return;
  const route = parseRoute(location.hash);
  if (route.kind === 'home') {
    main.innerHTML = homeHtml;
    wireForm();
    return;
  }
  main.innerHTML = `<p class="note">Loading…</p>`;
  try {
    switch (route.kind) {
      case 'repo':
        main.innerHTML = await renderRepo(route.did);
        break;
      case 'collection':
        main.innerHTML = await renderCollection(route.did, route.collection);
        break;
      case 'record':
        main.innerHTML = await renderRecord(route.did, route.collection, route.rkey);
        break;
    }
  } catch (err) {
    main.innerHTML = renderError(err);
  }
}

function showFormError(message: string): void {
  document.querySelector('.error')?.remove();
  const p = document.createElement('p');
  p.className = 'error';
  p.setAttribute('role', 'alert');
  p.textContent = message;
  document.querySelector('form.lookup')?.insertAdjacentElement('afterend', p);
}

function formErrorMessage(err: unknown): string {
  if (err instanceof InvalidInputError) {
    return 'That doesn’t look like a handle, DID, or at:// URI. Try something like alice.bsky.social or did:plc:…';
  }
  if (err instanceof HandleResolutionError) {
    return 'That handle didn’t resolve to a DID. Check the spelling, or paste the DID directly.';
  }
  return 'Something went wrong talking to the network. Try again in a moment.';
}

function wireForm(): void {
  const form = document.querySelector<HTMLFormElement>('form.lookup');
  const input = document.querySelector<HTMLInputElement>('#lookup-input');
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    document.querySelector('.error')?.remove();
    try {
      const classified = classifyInput(input?.value ?? '');
      if (classified.kind === 'did') {
        location.hash = atRoute(classified.did);
        return;
      }
      if (classified.kind === 'handle') {
        const fetchFn = guardedFetch({ handleDomain: classified.handle });
        const res = await resolveHandle(classified.handle, fetchFn);
        lastResolution = { did: res.did, rung: res.rung };
        location.hash = atRoute(res.did);
        return;
      }
      const { authority, collection, rkey } = classified.uri;
      let did = authority;
      if (!authority.startsWith('did:')) {
        const res = await resolveHandle(authority, guardedFetch({ handleDomain: authority }));
        lastResolution = { did: res.did, rung: res.rung };
        did = res.did;
      }
      location.hash = atRoute(did, collection, rkey);
    } catch (err) {
      showFormError(formErrorMessage(err));
    }
  });
}

document.body.addEventListener('click', async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const copyText = target.getAttribute('data-copy-text');
  const copyLink = target.getAttribute('data-copy-link');
  if (copyText !== null || copyLink !== null) {
    const text =
      copyText ?? `${location.origin}${location.pathname}${copyLink ?? ''}`;
    await navigator.clipboard.writeText(text);
    const original = target.textContent;
    target.textContent = 'copied';
    setTimeout(() => {
      target.textContent = original;
    }, 1200);
    return;
  }

  if (target.classList.contains('load-more')) {
    const route = parseRoute(location.hash);
    if (route.kind !== 'collection' || !main) return;
    const cursor = target.getAttribute('data-cursor') ?? undefined;
    target.setAttribute('disabled', '');
    try {
      main.innerHTML = await renderCollection(route.did, route.collection, cursor);
    } catch (err) {
      main.innerHTML = renderError(err);
    }
  }
});

window.addEventListener('hashchange', () => void renderRoute());
void renderRoute();
