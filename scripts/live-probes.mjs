// Manual live-network probes for the run-01 verify ledger. NEVER run in CI —
// all CI tests are hermetic. Run `npm run probe` by hand and record the
// results in the run summary before building on them.
//
// Each probe sends an Origin header so responses show the CORS posture a
// browser at https://pdsview.croft.ing would see (server-side CORS headers
// are observable this way even without a real browser).

const ORIGIN = 'https://pdsview.croft.ing';
const HANDLE = process.argv[2] ?? 'bsky.app';

const out = [];
function record(name, data) {
  out.push({ name, ...data });
  console.log(`\n=== ${name} ===`);
  console.log(JSON.stringify(data, null, 2));
}

async function probe(name, url, init = {}) {
  try {
    const res = await fetch(url, {
      headers: { Origin: ORIGIN, ...(init.headers ?? {}) },
      ...init,
    });
    const cors = {};
    for (const [k, v] of res.headers) {
      if (k.startsWith('access-control-') || k.includes('ratelimit') || k === 'content-type' || k === 'content-disposition') {
        cors[k] = v;
      }
    }
    let body;
    const ct = res.headers.get('content-type') ?? '';
    if (ct.includes('json') || ct.startsWith('text/')) {
      body = (await res.text()).slice(0, 2000);
    } else {
      const buf = await res.arrayBuffer();
      body = `<binary ${buf.byteLength} bytes>`;
    }
    record(name, { url, status: res.status, headers: cors, body });
    return { res, body };
  } catch (err) {
    record(name, { url, error: String(err) });
    return null;
  }
}

// Ledger 5: plc.directory CORS.
// Ledger prerequisite: resolve the probe handle to a DID and PDS.
const resolved = await probe(
  'resolveHandle via api.bsky.app',
  `https://api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=${HANDLE}`,
);
const did = resolved ? JSON.parse(resolved.body).did : null;
if (!did) throw new Error('could not resolve probe handle');

const didDocProbe = await probe('plc.directory DID doc (ledger 5)', `https://plc.directory/${did}`);
const didDoc = JSON.parse(didDocProbe.body);
const pds = didDoc.service.find((s) => s.id.endsWith('#atproto_pds')).serviceEndpoint;
console.log(`\nprobe identity: ${HANDLE} -> ${did} -> ${pds}`);

// Ledger 1: unauthenticated repo reads on the reference PDS.
await probe('describeRepo (ledger 1)', `${pds}/xrpc/com.atproto.repo.describeRepo?repo=${did}`);
const list = await probe(
  'listRecords (ledger 1)',
  `${pds}/xrpc/com.atproto.repo.listRecords?repo=${did}&collection=app.bsky.feed.post&limit=5`,
);
const records = list ? JSON.parse(list.body).records : [];
if (records[0]) {
  const parts = records[0].uri.slice('at://'.length).split('/');
  await probe(
    'getRecord (ledger 1)',
    `${pds}/xrpc/com.atproto.repo.getRecord?repo=${did}&collection=${parts[1]}&rkey=${parts[2]}`,
  );
}

// Ledger 4: exact blob-ref shape from a live record with an image.
const avatarList = await probe(
  'profile record for blob shape (ledger 4)',
  `${pds}/xrpc/com.atproto.repo.getRecord?repo=${did}&collection=app.bsky.actor.profile&rkey=self`,
);

// Ledger 3: getBlob content-type / content-disposition.
if (avatarList) {
  const value = JSON.parse(avatarList.body).value;
  const blobCid = value?.avatar?.ref?.$link;
  if (blobCid) {
    await probe('getBlob (ledger 3)', `${pds}/xrpc/com.atproto.sync.getBlob?did=${did}&cid=${blobCid}`);
  }
}

// Ledger 2: CORS behavior of a third-party (non-bsky.network) PDS.
// Default subject: a self-hosted PDS account; override with argv[3].
const thirdPartyHandle = process.argv[3] ?? 'atproto.com';
const tp = await probe(
  'resolve third-party handle (ledger 2)',
  `https://api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=${thirdPartyHandle}`,
);
if (tp) {
  const tpDid = JSON.parse(tp.body).did;
  const tpDocProbe = await probe('third-party DID doc (ledger 2)', `https://plc.directory/${tpDid}`);
  const tpPds = JSON.parse(tpDocProbe.body).service.find((s) => s.id.endsWith('#atproto_pds')).serviceEndpoint;
  console.log(`third-party PDS: ${tpPds}`);
  await probe('third-party describeRepo (ledger 2)', `${tpPds}/xrpc/com.atproto.repo.describeRepo?repo=${tpDid}`);
}

// Ledger 6: rate-limit headers during a multi-page listRecords walk.
let cursor;
for (let page = 0; page < 3; page++) {
  const url = `${pds}/xrpc/com.atproto.repo.listRecords?repo=${did}&collection=app.bsky.feed.like&limit=100${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`;
  const r = await probe(`listRecords walk page ${page + 1} (ledger 6)`, url);
  if (!r) break;
  cursor = JSON.parse(r.body).cursor;
  if (!cursor) break;
}

console.log('\nAll probes complete. Copy the output above into the run summary.');
