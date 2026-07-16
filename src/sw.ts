/// <reference lib="webworker" />
// App-shell service worker: cache-first for the shell, network-only for
// everything else (see src/sw/routing.ts). skipWaiting + clients.claim keeps
// updates immediate.
import { isShellRequest } from './sw/routing';

const sw = self as unknown as ServiceWorkerGlobalScope;

const CACHE = 'pdsview-shell-v1';
const SHELL = [
  '/',
  '/index.html',
  '/main.js',
  '/app.css',
  '/fonts/lora-latin-var.woff2',
  '/fonts/inter-latin-var.woff2',
  '/icon.svg',
  '/manifest.webmanifest',
];

sw.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => sw.skipWaiting()),
  );
});

sw.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => sw.clients.claim()),
  );
});

sw.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || !isShellRequest(url, sw.location.origin)) {
    // Network-only: never respondWith, the request goes straight out.
    return;
  }
  if (event.request.mode === 'navigate') {
    // Any route serves the cached shell; the hash router takes it from there.
    event.respondWith(
      caches.match('/index.html').then((hit) => hit ?? fetch(event.request)),
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then(
      (hit) =>
        hit ??
        fetch(event.request).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            void caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          }
          return res;
        }),
    ),
  );
});
