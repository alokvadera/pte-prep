#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Static file server used for local verification.
//
// `vite preview` answers every unknown path with the root index.html, which
// masks a whole class of prerendering bugs and makes hydration look broken on
// routes that are in fact correct. This server resolves paths the way a real
// static host does:
//
//   /guide  ->  dist/guide/index.html
//   /guide/ ->  dist/guide/index.html
//   /       ->  dist/index.html
//   /nope   ->  dist/404.html with a 404 status
//
// Usage: node scripts/serve.mjs [port] [dir]
// ---------------------------------------------------------------------------

import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const PORT = Number(process.argv[2] ?? 5200)
const ROOT = path.resolve(process.argv[3] ?? 'dist')

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
}

async function resolveFile(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0] ?? '/')
  // Reject traversal outright rather than relying on path normalisation.
  if (decoded.includes('..')) return null

  const base = path.join(ROOT, decoded)
  if (!base.startsWith(ROOT)) return null

  const candidates = []
  if (decoded.endsWith('/')) {
    candidates.push(path.join(base, 'index.html'))
  } else {
    candidates.push(base, path.join(base, 'index.html'), `${base}.html`)
  }

  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue
    const info = await stat(candidate).catch(() => null)
    if (info?.isFile()) return candidate
  }
  return null
}

const server = createServer(async (req, res) => {
  const file = await resolveFile(req.url ?? '/')

  if (!file) {
    const notFound = path.join(ROOT, '404.html')
    if (existsSync(notFound)) {
      const body = await readFile(notFound)
      res.writeHead(404, { 'content-type': TYPES['.html'] })
      res.end(body)
      return
    }
    res.writeHead(404, { 'content-type': 'text/plain' })
    res.end('Not found')
    return
  }

  const ext = path.extname(file).toLowerCase()
  const headers = {
    'content-type': TYPES[ext] ?? 'application/octet-stream',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'x-frame-options': 'SAMEORIGIN',
    'content-security-policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: blob:; media-src 'self' blob: data:; connect-src 'self' https://api.groq.com; worker-src 'self' blob:; frame-ancestors 'self'; base-uri 'self'; form-action 'self';",
  }
  // Hashed assets are immutable; HTML and the service worker must revalidate.
  if (file.includes(`${path.sep}assets${path.sep}`)) {
    headers['cache-control'] = 'public, max-age=31536000, immutable'
  } else {
    headers['cache-control'] = 'no-cache'
  }

  const body = await readFile(file)
  res.writeHead(200, headers)
  res.end(body)
})

server.listen(PORT, () => {
  console.log(`\n  Serving ${ROOT} on http://localhost:${PORT}\n`)
})
