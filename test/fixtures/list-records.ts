// Recorded com.atproto.repo.listRecords response (app.bsky.feed.post, limit=3), captured 2026-07-16 from the reference PDS
// (puffball.us-east.host.bsky.network). Source account: bsky.app
// (did:plc:z72i7hdynmk6r22z27h6tvur).
export const listRecordsFixture = {
  "records": [
    {
      "uri": "at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.post/3mqcp5qjdfs26",
      "cid": "bafyreig6kgwgaixxenkfv62gkz43fgdyoe2ddbgqbfr2edkqv5ya5kginu",
      "value": {
        "text": "Personnel news: @toni.bsky.team is dropping the “interim” from his title and will serve as our permanent CEO!",
        "$type": "app.bsky.feed.post",
        "embed": {
          "$type": "app.bsky.embed.record",
          "record": {
            "cid": "bafyreigov2ns6elnyiksqufzr6ctfg4i4eiodharfupyoc5sq23tvyew4a",
            "uri": "at://did:plc:cwf4mmm7mpzistinx3ox2zhj/app.bsky.feed.post/3mqcp425edfgx"
          }
        },
        "langs": [
          "en"
        ],
        "facets": [
          {
            "$type": "app.bsky.richtext.facet",
            "index": {
              "byteEnd": 31,
              "byteStart": 16
            },
            "features": [
              {
                "did": "did:plc:cwf4mmm7mpzistinx3ox2zhj",
                "$type": "app.bsky.richtext.facet#mention"
              }
            ]
          }
        ],
        "createdAt": "2026-07-10T17:43:30.972Z"
      }
    },
    {
      "uri": "at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.post/3mqafridzgk2e",
      "cid": "bafyreibowb4zpdgv74mzhpn3w433q4affyql5jd6c43tluinucj4q2jdzy",
      "value": {
        "text": "v1.127 is live! We're rolling out improvements to search over the coming weeks. You'll get more relevant results and more ways to find what you're looking for. \n\nThe new \"Filters\" button lets you query and filter by keywords, people, date range, language and more. You can even share your searches!",
        "$type": "app.bsky.feed.post",
        "embed": {
          "$type": "app.bsky.embed.images",
          "images": [
            {
              "alt": "A rendering of the new \"Filters\" button and option fields, which allow you to query and filter by keywords, people, date range, language and more.",
              "image": {
                "ref": {
                  "$link": "bafkreifvw4djmv7ney453nfyozyvoxvrwrlnpmbfhezarsn6plkrcvrw64"
                },
                "size": 1554074,
                "$type": "blob",
                "mimeType": "image/jpeg"
              },
              "aspectRatio": {
                "width": 2140,
                "height": 2000
              }
            }
          ]
        },
        "langs": [
          "en"
        ],
        "createdAt": "2026-07-09T19:50:16.599Z"
      }
    },
    {
      "uri": "at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.post/3mpok7nkjtc2o",
      "cid": "bafyreib3xpze6k6lagrwhjn75wj4daeaj73hvhhjkmt3d5umm6qkqba5fa",
      "value": {
        "text": "wait a minute",
        "$type": "app.bsky.feed.post",
        "embed": {
          "$type": "app.bsky.embed.images",
          "images": [
            {
              "alt": "two spidermen pointing at each other",
              "image": {
                "ref": {
                  "$link": "bafkreihlfz7eeyynraq3zqhozs4q3l3wabewbjevjb5jgophbtcjj7eijm"
                },
                "size": 161421,
                "$type": "blob",
                "mimeType": "image/jpeg"
              },
              "aspectRatio": {
                "width": 686,
                "height": 386
              }
            }
          ]
        },
        "langs": [
          "en"
        ],
        "reply": {
          "root": {
            "cid": "bafyreigjxsxzw2ywmz3uu5pr33eg5j7xqwzarpjthc4nxmpn3cy4v3vopu",
            "uri": "at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.post/3mpoezgevvc23"
          },
          "parent": {
            "cid": "bafyreifzkundbxh3docpjjd5oyffcxyjk63ha7zoht6iy4y6bjvvct5zgy",
            "uri": "at://did:plc:xxj5ugkba3k6ftpmcl67vv6r/app.bsky.feed.post/3mpog44tffs2r"
          }
        },
        "createdAt": "2026-07-02T17:21:51.498Z"
      }
    }
  ],
  "cursor": "3mpok7nkjtc2o"
};
