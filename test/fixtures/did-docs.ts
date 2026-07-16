// Recorded DID documents, captured 2026-07-16 via scripts/live-probes.mjs.
// Source accounts: bsky.app (did:plc:z72i7hdynmk6r22z27h6tvur, reference PDS)
// and bnewbold.net (did:plc:44ybard66vv44zksje25o7dz, self-hosted PDS at
// pds.robocracy.org). Trimmed to the fields pdsview reads plus @context.

export const bskyAppDidDoc = {
  '@context': [
    'https://www.w3.org/ns/did/v1',
    'https://w3id.org/security/multikey/v1',
    'https://w3id.org/security/suites/secp256k1-2019/v1',
  ],
  id: 'did:plc:z72i7hdynmk6r22z27h6tvur',
  alsoKnownAs: ['at://bsky.app'],
  verificationMethod: [
    {
      id: 'did:plc:z72i7hdynmk6r22z27h6tvur#atproto',
      type: 'Multikey',
      controller: 'did:plc:z72i7hdynmk6r22z27h6tvur',
      publicKeyMultibase: 'zQ3shQo6TF2moaqMTrUZEM1jeuYRQXeHEx4evX9751y2qPqRA',
    },
  ],
  service: [
    {
      id: '#atproto_pds',
      type: 'AtprotoPersonalDataServer',
      serviceEndpoint: 'https://puffball.us-east.host.bsky.network',
    },
  ],
};

export const bnewboldDidDoc = {
  '@context': [
    'https://www.w3.org/ns/did/v1',
    'https://w3id.org/security/multikey/v1',
    'https://w3id.org/security/suites/secp256k1-2019/v1',
  ],
  id: 'did:plc:44ybard66vv44zksje25o7dz',
  alsoKnownAs: ['at://bnewbold.net'],
  verificationMethod: [
    {
      id: 'did:plc:44ybard66vv44zksje25o7dz#atproto',
      type: 'Multikey',
      controller: 'did:plc:44ybard66vv44zksje25o7dz',
      publicKeyMultibase: 'zQ3shkke2XfFX6A1aRXkCqXKKF9m9N4GH9NCiRuDNFkpsqFmd',
    },
    {
      id: 'did:plc:44ybard66vv44zksje25o7dz#example',
      type: 'Multikey',
      controller: 'did:plc:44ybard66vv44zksje25o7dz',
      publicKeyMultibase: 'z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
    },
  ],
  service: [
    {
      id: '#atproto_pds',
      type: 'AtprotoPersonalDataServer',
      serviceEndpoint: 'https://pds.robocracy.org',
    },
  ],
};
