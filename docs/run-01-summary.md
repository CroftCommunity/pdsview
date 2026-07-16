# pdsview — run-01 summary

All six phases (0–5) landed on this branch as phase-tagged red/green commit
pairs. 107 unit tests + 12 Playwright tests, all hermetic; typecheck, build,
unit and e2e all green at HEAD.

## Manual owner steps

1. **DNS**: add a CNAME record `pdsview` → `croftcommunity.github.io` on croft.ing.
2. **Pages**: repo Settings → Pages → set *Source* to **GitHub Actions**.
3. **HTTPS**: once the certificate provisions, tick *Enforce HTTPS*.
4. Merge this branch to `main` — the deploy workflow publishes `dist/`
   (which contains `CNAME` with exactly `pdsview.croft.ing`).
5. Review the two [confirm] copy items below before announcing.

## Red-to-green evidence per phase

Every acceptance bullet became a failing test before implementation; each
phase is a `test(phase-N): red` commit whose suite fails, followed by a
`feat(phase-N): green` commit. Captured failing output for phase 0 is in
`docs/evidence-phase0-red.txt` (all 6 unit files failing), green state in
`docs/evidence-phase0-green.txt`.

| Phase | Red commit | Green commit |
| --- | --- | --- |
| 0 scaffold | `bcf4cbf` | `0a60268` |
| 1 identity core | `31e4bf0` | `a67530c` |
| 2 browse pages | `edf0246` | `4f80487` |
| 3 export | `f2b3f05` | `da70fdd` |
| 4 inline blobs | `de1abfe` | `5dea67f` |
| 5 PWA | `bac0823` | `d7496e9` |

The zero-runtime-deps invariant paid for itself during phase 0: `npm install`
silently dropped the empty `"dependencies": {}` key from package.json and the
test caught it (noted in `0a60268`).

The four named invariant tests (`zero-runtime-deps`, `no-unexpected-origins`,
`deep-links-are-did-canonical`, `verified-requires-bidirectional`) were
written in the phase-0 red commit and pass at HEAD.

## Verify-in-run ledger — probe results

Probes ran 2026-07-16 via `npm run probe` (`scripts/live-probes.mjs`, manual
only, never CI); raw output committed as `docs/evidence-probes-run01.txt`.
Probe subjects: `bsky.app` (reference PDS, puffball.us-east.host.bsky.network)
and `bnewbold.net` (self-hosted PDS, pds.robocracy.org). Requests carried
`Origin: https://pdsview.croft.ing` so server CORS posture is what a browser
would see.

1. **Unauthenticated reads on the reference PDS**: `describeRepo`,
   `listRecords`, `getRecord` all 200 with
   `access-control-allow-origin: *`. The docs' "usually require
   authentication" banner does not match deployed behavior — reads work.
2. **Third-party PDS CORS**: `pds.robocracy.org` (stock self-hosted PDS
   dist) also answers 200 with `access-control-allow-origin: *`. The CORS
   error state exists in the UI but should be uncommon for reference-code
   PDSes. (First candidate tried, `atproto.com`, turned out to live on a
   bsky.network mushroom — verify the host before calling a PDS
   "third-party".)
3. **getBlob**: 200, `content-type: image/jpeg`,
   `content-disposition: attachment; filename="{cid}"`, ACAO `*`. The
   attachment disposition does **not** affect `<img>` rendering (it only
   applies to navigations), so inline images are fine — confirmed by the
   phase-4 e2e.
4. **Blob-ref shape** (from a live `app.bsky.actor.profile` record):
   `{"$type": "blob", "ref": {"$link": "<cid>"}, "mimeType": "image/jpeg", "size": N}` —
   exactly as the instructions assumed. Detection was built against this
   recorded fixture.
5. **plc.directory CORS**: 200, `access-control-allow-origin: *`,
   `content-type: application/did+ld+json`.
6. **Rate-limit headers** during a 3-page `listRecords` walk:
   `ratelimit-limit: 3000`, `ratelimit-policy: 3000;w=300`,
   `ratelimit-remaining` decrementing by 1 per request — 3000 requests per
   300 s window. Sequential NDJSON pagination at 100 records/page is far
   inside this budget; no extra pacing added.

No probe contradicted the instructions; nothing was re-architected.

## Contrast ratios shipped (WCAG, computed by `test/unit/contrast.test.ts`)

| Pair | Ratio | Use |
| --- | --- | --- |
| iron-ore-black `#1C1E20` on oatmeal-canvas `#E9E1D8` | 12.92:1 | body text |
| oatmeal-canvas on deep-schist `#2F3539` | 9.61:1 | JSON panels, footer |
| ruddy-orange `#B75C34` on oatmeal-canvas | 3.53:1 | headings/wordmark — **large text only**, enforced by test |
| **ruddy-ink `#8A4526`** (derived) on oatmeal-canvas | 5.48:1 | links, buttons, body-size accents |
| dark-moss `#3D8548` on oatmeal-canvas | 3.49:1 | large verified accents only |
| **moss-ink `#2E6437`** (derived) on oatmeal-canvas | 5.42:1 | body-size verified text |
| oatmeal-canvas on moss-ink | 5.42:1 | verified badge |
| iron-ore-black on light-granite `#A2A8A5` | 6.94:1 | course stones |
| light-granite on oatmeal-canvas | 1.87:1 | **rejected for text** — borders/surfaces only, enforced by test |

Board-natural pairs failed as predicted (ruddy-on-oatmeal body, granite text);
the two derived inks above are the only non-board colors and exist solely to
carry those roles at body size.

## [confirm] items — what was assumed

- **License**: the repo already contained AGPL-3.0 — kept, matching the org
  precedent. `package.json` says `AGPL-3.0-only`.
- **Wordmark**: lowercase `pdsview`, set in Lora, as directed. The PWA icon
  is a lowercase serif "p" monogram (explicitly acceptable this run).
- **Landing blurb** (on-page tagline, please review word for word):
  > Paste a handle, DID, or at:// URI and browse the public contents of the
  > data server behind it — collections, records, images, exports. Nothing
  > leaves your browser.
  (The last sentence means "no backend of ours sees anything" — traffic goes
  only to the PDS/directories. Happy to reword if it reads as overclaiming.)
- **HTML meta description**: "A quiet, client-side browser for the public
  contents of any ATProto personal data server."

## Deferred, and why

- **PNG raster icons**: no runtime deps and no rasterizer in the toolchain;
  the manifest ships an SVG monogram (valid for modern installability). A
  future run can pre-render PNGs offline and commit them as assets.
- **Record-view "verified" course styling nuance and richer previews**
  (e.g. embed-aware snippets) — collection previews cover text/displayName/
  name/title + createdAt only, per "trivially available".
- **did:web port/path forms** (`did:web:host%3A8080`): rejected by the
  classifier; atproto uses bare-hostname did:web in practice.
- **CAR content-disposition probe on getRepo**: the export anchor follows the
  spec'd shape (`download` attribute); cross-origin `download` naming is
  advisory in browsers, so the served filename may win. Cosmetic only.

## Test/tooling notes

- Playwright in this container uses the pre-installed Chromium
  (`/opt/pw-browsers/chromium`); CI installs its own matching build.
- e2e hermeticity: every spec either asserts zero non-local requests or
  installs a catch-all abort for non-local origins before mocking specific
  XRPC/directory routes.
