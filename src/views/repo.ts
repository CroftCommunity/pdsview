// Repo view: identity card + collection list from describeRepo.
import type { ResolutionRung } from '../identity/resolve';
import { atRoute } from '../router/routes';
import { didDocUrl } from '../identity/did-doc';
import { esc } from './html';

export interface RepoViewData {
  did: string;
  claimedHandle: string | null;
  verified: boolean;
  /** Which rung resolved the handle, when the user arrived via one. */
  provenance: ResolutionRung | null;
  pdsEndpoint: string | null;
  collections: string[];
}

export function repoView(data: RepoViewData): string {
  const handle = data.claimedHandle;
  const verification = data.verified
    ? `<span class="badge verified">verified</span> <span class="badge-note">this handle and DID claim each other</span>`
    : `<span class="badge unverified">unverified</span> <span class="badge-note">the DID document does not claim this handle back — treat the name with suspicion</span>`;
  const provenance = data.provenance
    ? `<p class="provenance">handle resolved via ${esc(data.provenance)}</p>`
    : '';

  const collections =
    data.collections.length === 0
      ? `<p class="note">No collections — this repository is empty.</p>`
      : `<ul class="collections">${data.collections
          .map(
            (nsid) =>
              `<li><a href="${esc(atRoute(data.did, nsid))}">${esc(nsid)}</a></li>`,
          )
          .join('')}</ul>`;

  return `
<section class="identity-card">
  <h2>${handle ? esc(handle) : '(no handle claimed)'}</h2>
  <p class="verification">${verification}</p>
  ${provenance}
  <p class="did-line"><code>${esc(data.did)}</code>
    <button type="button" class="copy" data-copy-text="${esc(data.did)}">copy DID</button>
  </p>
  <p class="pds-line">PDS: ${
    data.pdsEndpoint
      ? `<code>${esc(new URL(data.pdsEndpoint).host)}</code>`
      : 'none listed in the DID document'
  }
    · <a href="${esc(didDocUrl(data.did))}">DID document</a>
  </p>
</section>
<section class="collections-section">
  <h2>Collections</h2>
  ${collections}
</section>`;
}
