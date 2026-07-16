export const carFilename = (did: string): string => `${did}.car`;

export const ndjsonFilename = (did: string, collection: string): string =>
  `${did}.${collection}.ndjson`;

export const recordFilename = (did: string, collection: string, rkey: string): string =>
  `${did}.${collection}.${rkey}.json`;
