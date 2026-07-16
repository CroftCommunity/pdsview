// Minimal static file server for dist/ — used by Playwright's webServer and
// for local inspection. No dependencies, loopback only, no directory traversal.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const port = Number(process.argv[2] ?? 4173);
const root = 'dist';

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json',
  '.map': 'application/json',
};

createServer(async (req, res) => {
  const path = normalize(new URL(req.url, 'http://x').pathname).replace(/^(\.\.[/\\])+/, '');
  let file = join(root, path);
  try {
    let body;
    try {
      body = await readFile(file);
    } catch {
      // SPA fallback: unknown paths serve the shell.
      file = join(root, 'index.html');
      body = await readFile(file);
    }
    res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end('not found');
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`serving ${root}/ on http://127.0.0.1:${port}`);
});
