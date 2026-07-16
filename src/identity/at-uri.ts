// Phase 1 at:// URI parse/format. Parsing accepts DID or handle authorities
// (both arrive as user input); formatting is DID-canonical only — the
// formatter refuses handle authorities so no internal link ever carries one.
import { InvalidInputError } from './errors';

export interface AtUri {
  authority: string;
  collection?: string;
  rkey?: string;
}

export function parseAtUri(input: string): AtUri {
  if (!input.startsWith('at://')) {
    throw new InvalidInputError(input, 'an at:// URI must start with at://');
  }
  const [authority, collection, rkey, ...rest] = input
    .slice('at://'.length)
    .split('/')
    .filter((p) => p.length > 0);
  if (authority === undefined) throw new InvalidInputError(input, 'empty authority');
  if (rest.length > 0) throw new InvalidInputError(input, 'too many path segments');

  const uri: AtUri = { authority };
  if (collection !== undefined) uri.collection = collection;
  if (rkey !== undefined) uri.rkey = rkey;
  return uri;
}

export function formatAtUri(uri: AtUri): string {
  if (!uri.authority.startsWith('did:')) {
    throw new InvalidInputError(
      uri.authority,
      'canonical at:// URIs carry a DID authority, never a handle',
    );
  }
  let out = `at://${uri.authority}`;
  if (uri.collection !== undefined) out += `/${uri.collection}`;
  if (uri.rkey !== undefined) {
    if (uri.collection === undefined) {
      throw new InvalidInputError(String(uri.rkey), 'an rkey requires a collection');
    }
    out += `/${uri.rkey}`;
  }
  return out;
}
