// Phase 1 classifier: a pasted string becomes a typed result — did:plc,
// did:web, handle, or at:// URI — or a typed rejection. atproto supports
// exactly two DID methods, so anything else is rejected up front.
import { parseAtUri, type AtUri } from './at-uri';
import { InvalidInputError } from './errors';

export { InvalidInputError };

export type Classified =
  | { kind: 'did'; method: 'plc' | 'web'; did: string }
  | { kind: 'handle'; handle: string }
  | { kind: 'at-uri'; uri: AtUri };

const DID_PLC_RE = /^did:plc:[a-z2-7]{24}$/;
const DID_WEB_RE = /^did:web:[a-z0-9][a-z0-9.-]*$/;
const HANDLE_RE = /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z](?:[a-z0-9-]*[a-z0-9])?$/;

export function isAtprotoDid(input: string): boolean {
  return DID_PLC_RE.test(input) || DID_WEB_RE.test(input);
}

export function isHandle(input: string): boolean {
  return HANDLE_RE.test(input);
}

export function classifyInput(raw: string): Classified {
  const trimmed = raw.trim();
  if (trimmed === '') throw new InvalidInputError(raw, 'empty');

  if (trimmed.startsWith('at://')) {
    return { kind: 'at-uri', uri: parseAtUri(trimmed) };
  }

  if (trimmed.startsWith('did:')) {
    if (DID_PLC_RE.test(trimmed)) return { kind: 'did', method: 'plc', did: trimmed };
    if (DID_WEB_RE.test(trimmed.toLowerCase())) {
      return { kind: 'did', method: 'web', did: trimmed.toLowerCase() };
    }
    throw new InvalidInputError(trimmed, 'atproto supports only did:plc and did:web');
  }

  const handle = trimmed.replace(/^@/, '').toLowerCase();
  if (isHandle(handle)) return { kind: 'handle', handle };

  throw new InvalidInputError(raw, 'not a valid handle shape');
}
