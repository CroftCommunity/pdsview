// App wiring: classify input, resolve handles (never letting one reach the
// URL), and render the current hash route. Views grow phase by phase.
import { classifyInput } from './identity/classify';
import { fetchDidDoc, DidWebUnreachableError } from './identity/did-doc';
import { InvalidInputError } from './identity/errors';
import { HandleResolutionError, resolveHandle } from './identity/resolve';
import { isHandleVerified } from './identity/verify';
import { guardedFetch } from './fetch-guard';
import { atRoute, parseRoute } from './router/routes';

const main = document.querySelector('main');
const homeHtml = main?.innerHTML ?? '';

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  children: (Node | string)[] = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  node.append(...children);
  return node;
}

function showError(message: string): void {
  document.querySelector('.error')?.remove();
  document
    .querySelector('form.lookup')
    ?.insertAdjacentElement('afterend', el('p', { class: 'error', role: 'alert' }, [message]));
}

function errorMessage(err: unknown): string {
  if (err instanceof InvalidInputError) {
    return 'That doesn’t look like a handle, DID, or at:// URI. Try something like alice.bsky.social or did:plc:…';
  }
  if (err instanceof HandleResolutionError) {
    return 'That handle didn’t resolve to a DID. Check the spelling, or paste the DID directly.';
  }
  if (err instanceof DidWebUnreachableError) {
    return 'The did:web document couldn’t be fetched — the domain may be down, or it doesn’t allow browser reads (CORS).';
  }
  return 'Something went wrong talking to the network. Try again in a moment.';
}

function wireForm(): void {
  const form = document.querySelector<HTMLFormElement>('form.lookup');
  const input = document.querySelector<HTMLInputElement>('#lookup-input');
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    document.querySelector('.error')?.remove();
    const raw = input?.value ?? '';
    try {
      const classified = classifyInput(raw);
      if (classified.kind === 'did') {
        location.hash = atRoute(classified.did);
        return;
      }
      if (classified.kind === 'handle') {
        const fetchFn = guardedFetch({ handleDomain: classified.handle });
        const { did } = await resolveHandle(classified.handle, fetchFn);
        location.hash = atRoute(did);
        return;
      }
      const { authority, collection, rkey } = classified.uri;
      const did = authority.startsWith('did:')
        ? authority
        : (await resolveHandle(authority, guardedFetch({ handleDomain: authority }))).did;
      location.hash = atRoute(did, collection, rkey);
    } catch (err) {
      showError(errorMessage(err));
    }
  });
}

async function renderRepo(did: string): Promise<void> {
  if (!main) return;
  main.replaceChildren(el('p', { class: 'note' }, ['Loading identity…']));
  try {
    const info = await fetchDidDoc(did, guardedFetch({}));
    // Bidirectional: the DID doc claims the handle (checked here against the
    // doc), and the handle resolves forward to this same DID. Either failing
    // renders as unverified.
    let verified = false;
    if (info.claimedHandle !== null && isHandleVerified(info.claimedHandle, info.doc as { alsoKnownAs?: string[] })) {
      try {
        const fetchFn = guardedFetch({ handleDomain: info.claimedHandle });
        verified = (await resolveHandle(info.claimedHandle, fetchFn)).did === did;
      } catch {
        verified = false;
      }
    }
    const card = el('section', { class: 'identity-card' }, [
      el('h2', {}, [info.claimedHandle ?? '(no handle claimed)']),
      el('p', { class: verified ? 'verified' : 'unverified' }, [
        verified
          ? 'verified — this DID claims the handle back'
          : 'unverified — the DID document does not claim this handle back',
      ]),
      el('p', { class: 'did-line' }, [el('code', {}, [info.did])]),
      el('p', {}, [
        'PDS: ',
        info.pdsEndpoint
          ? el('code', {}, [new URL(info.pdsEndpoint).host])
          : 'none listed in the DID document',
      ]),
    ]);
    main.replaceChildren(
      card,
      el('p', { class: 'note' }, ['Collections and records arrive in the next phase.']),
    );
  } catch (err) {
    main.replaceChildren(el('p', { class: 'error', role: 'alert' }, [errorMessage(err)]));
  }
}

function renderRoute(): void {
  const route = parseRoute(location.hash);
  if (!main) return;
  if (route.kind === 'home') {
    main.innerHTML = homeHtml;
    wireForm();
    return;
  }
  void renderRepo(route.did);
}

window.addEventListener('hashchange', renderRoute);
renderRoute();
