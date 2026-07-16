# pdsview

A standalone, purely client-side browser for the **public** contents of any
ATProto PDS (personal data server). Paste a handle, DID, or `at://` URI and
browse that account's repository — collections, records, inline images — and
export what you find. No backend, no accounts, no feed: everything runs in
your browser and talks only to the PDS itself (plus the two public directory
services needed to find it).

Live at [pdsview.croft.ing](https://pdsview.croft.ing). Part of
[croft.ing](https://croft.ing).

## The zero-dependency stance

`dependencies` in `package.json` is empty and stays that way. The shipped
bundle contains nothing from `node_modules` — a named invariant test
(`zero-runtime-deps`) verifies this against the build metafile on every run.
The dev toolchain is strict TypeScript, esbuild, Vitest, and Playwright.

Three more named invariants are tested from day one and kept forever:

- **no-unexpected-origins** — the fetch layer refuses any origin that is not
  the resolved PDS host, `plc.directory`, `api.bsky.app`, or the handle's own
  domain (well-known probe).
- **deep-links-are-did-canonical** — generated routes always contain a DID,
  never a handle; handle input resolves first, then navigates to the DID URL.
- **verified-requires-bidirectional** — a handle is marked "verified" only
  when the DID document claims it back via its canonical `alsoKnownAs` entry.

## Running tests

```sh
npm ci
npm run typecheck   # strict tsc, no emit
npm test            # Vitest unit tests (hermetic, fixture-driven)
npm run build       # esbuild -> dist/ (index.html, JS, CSS, fonts, CNAME)
npm run test:e2e    # Playwright against the built dist/, no network
```

All CI tests are hermetic: unit tests run from recorded fixtures, and the e2e
suite serves `dist/` locally and fails on any request that leaves the local
origin. Live-network probes live in `scripts/live-probes.mjs`
(`npm run probe`), are run manually only, and never in CI.

## License

[AGPL-3.0](LICENSE). Fonts (Lora, Inter) are self-hosted under the SIL Open
Font License; see `assets/fonts/OFL-*.txt`.
