// The service worker's single routing decision, kept pure so it can be
// unit-tested: cache-first for the same-origin app shell ONLY. Every XRPC,
// plc.directory, and well-known request — any cross-origin request at all —
// is network-only, so the PDS data on screen is never stale from cache.
export function isShellRequest(url: URL, appOrigin: string): boolean {
  if (url.origin !== appOrigin) return false;
  if (url.pathname.startsWith('/xrpc/')) return false;
  if (url.pathname.startsWith('/.well-known/')) return false;
  return true;
}
