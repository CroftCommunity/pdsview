// Named invariant: no-unexpected-origins.
// The only origins pdsview may ever talk to are: plc.directory, api.bsky.app,
// the resolved PDS host, and the handle's own domain (well-known probe). All
// over https, exact-origin match only.

export interface OriginContext {
  /** Origin of the resolved PDS, e.g. "https://pds.example.com". */
  pdsOrigin?: string;
  /** Bare domain of the handle being resolved, e.g. "alice.example.com". */
  handleDomain?: string;
}

export class DisallowedOriginError extends Error {
  override name = 'DisallowedOriginError';
  constructor(origin: string) {
    super(`refusing to fetch from unexpected origin: ${origin}`);
  }
}

const STATIC_ORIGINS: readonly string[] = ['https://plc.directory', 'https://api.bsky.app'];

export function isAllowedOrigin(origin: string, ctx: OriginContext): boolean {
  let parsed: URL;
  try {
    parsed = new URL(origin);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'https:') return false;
  if (STATIC_ORIGINS.includes(parsed.origin)) return true;
  if (ctx.pdsOrigin) {
    try {
      if (new URL(ctx.pdsOrigin).origin === parsed.origin) return true;
    } catch {
      // an unparsable context origin allows nothing
    }
  }
  if (ctx.handleDomain && parsed.origin === `https://${ctx.handleDomain.toLowerCase()}`) {
    return true;
  }
  return false;
}

export function assertAllowedUrl(url: string, ctx: OriginContext): URL {
  const parsed = new URL(url);
  if (!isAllowedOrigin(parsed.origin, ctx)) throw new DisallowedOriginError(parsed.origin);
  return parsed;
}
