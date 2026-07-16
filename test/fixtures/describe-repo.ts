// Recorded com.atproto.repo.describeRepo response, captured 2026-07-16 from the reference PDS
// (puffball.us-east.host.bsky.network). Source account: bsky.app
// (did:plc:z72i7hdynmk6r22z27h6tvur).
export const describeRepoFixture = {
  "handle": "bsky.app",
  "did": "did:plc:z72i7hdynmk6r22z27h6tvur",
  "didDoc": {
    "@context": [
      "https://www.w3.org/ns/did/v1",
      "https://w3id.org/security/multikey/v1",
      "https://w3id.org/security/suites/secp256k1-2019/v1"
    ],
    "id": "did:plc:z72i7hdynmk6r22z27h6tvur",
    "alsoKnownAs": [
      "at://bsky.app"
    ],
    "verificationMethod": [
      {
        "id": "did:plc:z72i7hdynmk6r22z27h6tvur#atproto",
        "type": "Multikey",
        "controller": "did:plc:z72i7hdynmk6r22z27h6tvur",
        "publicKeyMultibase": "zQ3shQo6TF2moaqMTrUZEM1jeuYRQXeHEx4evX9751y2qPqRA"
      }
    ],
    "service": [
      {
        "id": "#atproto_pds",
        "type": "AtprotoPersonalDataServer",
        "serviceEndpoint": "https://puffball.us-east.host.bsky.network"
      }
    ]
  },
  "collections": [
    "app.bsky.actor.profile",
    "app.bsky.feed.generator",
    "app.bsky.feed.like",
    "app.bsky.feed.post",
    "app.bsky.feed.repost",
    "app.bsky.feed.threadgate",
    "app.bsky.graph.block",
    "app.bsky.graph.follow",
    "app.bsky.graph.list",
    "app.bsky.graph.listitem",
    "app.bsky.graph.starterpack",
    "app.bsky.graph.verification",
    "app.bsky.notification.declaration",
    "chat.bsky.actor.declaration"
  ],
  "handleIsCorrect": true
} as const;
