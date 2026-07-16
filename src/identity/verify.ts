// Named invariant: verified-requires-bidirectional.
// A handle counts as verified only when the DID document claims it back: the
// canonical handle is the FIRST `at://` entry in alsoKnownAs, per atproto
// identity semantics. One-way resolution (handle -> DID only) is unverified.

export function normalizeHandle(input: string): string {
  return input.trim().replace(/^@/, '').toLowerCase();
}

export function isHandleVerified(
  handle: string,
  didDoc: { alsoKnownAs?: string[] },
): boolean {
  const canonical = (didDoc.alsoKnownAs ?? []).find((aka) => aka.startsWith('at://'));
  if (!canonical) return false;
  return canonical.slice('at://'.length).toLowerCase() === normalizeHandle(handle);
}
