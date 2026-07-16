// Phase 5: the service worker's routing decision. Cache-first applies to the
// same-origin app shell ONLY; every XRPC, plc.directory, and well-known
// request is network-only — an offline-capable shell must never serve stale
// PDS data from cache.
import { describe, expect, it } from 'vitest';
import { isShellRequest } from '../../src/sw/routing';

const APP = 'https://pdsview.croft.ing';

describe('isShellRequest', () => {
  it('caches same-origin shell assets', () => {
    for (const path of [
      '/',
      '/index.html',
      '/main.js',
      '/app.css',
      '/fonts/lora-latin-var.woff2',
      '/fonts/inter-latin-var.woff2',
      '/icon.svg',
      '/manifest.webmanifest',
    ]) {
      expect(isShellRequest(new URL(path, APP), APP), path).toBe(true);
    }
  });

  it('never caches XRPC, even same-origin', () => {
    expect(isShellRequest(new URL('/xrpc/com.atproto.repo.describeRepo?repo=x', APP), APP)).toBe(false);
  });

  it('never caches well-known probes, even same-origin', () => {
    expect(isShellRequest(new URL('/.well-known/atproto-did', APP), APP)).toBe(false);
  });

  it('never caches other origins: PDS hosts, plc.directory, api.bsky.app, handle domains', () => {
    for (const url of [
      'https://plc.directory/did:plc:abc',
      'https://api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=x',
      'https://pds.example.org/xrpc/com.atproto.repo.listRecords?repo=x&collection=y',
      'https://alice.example.com/.well-known/atproto-did',
    ]) {
      expect(isShellRequest(new URL(url), APP), url).toBe(false);
    }
  });
});
