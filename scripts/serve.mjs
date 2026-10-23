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
import { existsSync, createReadStream, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const PORT = Number(process.argv[2] ?? 5200)
const ROOT = path.resolve(process.argv[3] ?? 'dist')

// The local server must enforce the same Content-Security-Policy as the
// deployed site. A looser policy here makes the "no CSP violations" assertion
// in browser-check.mjs meaningless, because it would permit the very inline
// scripts the production policy blocks. The policy is read from the same
// public/_headers file that gets deployed, so the two cannot drift.
const HEADERS_FILE = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'public',
  '_headers',
)

const FALLBACK_CSP =
  "default-src 'self'; script-src 'self' 'sha256-cY5WgIhtXwIGboRrbJmxLeNZFOgNzbD6ciTLFeTeV+g='; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: blob:; media-src 'self' blob: data:; connect-src 'self' https://api.groq.com; worker-src 'self' blob:; frame-ancestors 'self'; base-uri 'self'; form-action 'self';"

function readCspPolicy() {
  try {
    if (!existsSync(HEADERS_FILE)) return null
    const match = readFileSync(HEADERS_FILE, 'utf8').match(/^\s*Content-Security-Policy:\s*(.+)$/im)
    return match ? match[1].trim() : null
  } catch {
    return null
  }
}

const CSP = readCspPolicy() ?? FALLBACK_CSP

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
  // The listening bank is .m4a, and every response carries nosniff. Without the
  // audio type here a clip arrives as application/octet-stream, which Chrome
  // refuses to play, so the player silently dropped to speech synthesis on local
  // verification runs while the same file played fine once deployed.
  '.m4a': 'audio/mp4',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
}

async function resolveFile(urlPath) {
  let decoded
  try {
    decoded = decodeURIComponent(urlPath.split('?')[0] ?? '/')
  } catch (err) {
    if (err instanceof URIError) return 'BAD_REQUEST'
    throw err
  }
  // Reject traversal outright rather than relying on path normalisation.
  if (decoded.includes('..')) return null

  // Strip leading slashes to guarantee path remains strictly relative to ROOT.
  const cleanPath = decoded.replace(/^\/+/, '')
  const base = path.join(ROOT, cleanPath)
  if (!base.startsWith(ROOT)) return null

  const candidates = []
  if (decoded.endsWith('/') || cleanPath === '') {
    candidates.push(path.join(base, 'index.html'), path.join(base, 'audio-review.html'))
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
  let file
  try {
    file = await resolveFile(req.url ?? '/')
  } catch (err) {
    if (err instanceof URIError) {
      res.writeHead(400, { 'content-type': 'text/plain' })
      res.end('Bad Request')
      return
    }
    res.writeHead(500, { 'content-type': 'text/plain' })
    res.end('Internal Server Error')
    return
  }

  if (file === 'BAD_REQUEST') {
    res.writeHead(400, { 'content-type': 'text/plain' })
    res.end('Bad Request')
    return
  }

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
    'content-security-policy': CSP,
  }
  // Hashed assets are immutable; HTML and the service worker must revalidate.
  if (file.includes(`${path.sep}assets${path.sep}`)) {
    headers['cache-control'] = 'public, max-age=31536000, immutable'
  } else {
    headers['cache-control'] = 'no-cache'
  }

  const fileStat = await stat(file).catch(() => null)
  const fileSize = fileStat?.size ?? 0

  headers['accept-ranges'] = 'bytes'

  const range = req.headers.range
  if (range && fileSize > 0 && (ext === '.m4a' || ext === '.mp3' || ext === '.wav' || ext === '.mp4')) {
    const parts = range.replace(/bytes=/, '').split('-')
    const start = parseInt(parts[0], 10)
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1

    if (isNaN(start) || start >= fileSize || end >= fileSize || start > end) {
      res.writeHead(416, { 'content-range': `bytes */${fileSize}` })
      res.end()
      return
    }

    headers['content-range'] = `bytes ${start}-${end}/${fileSize}`
    headers['content-length'] = end - start + 1
    res.writeHead(206, headers)
    createReadStream(file, { start, end }).pipe(res)
    return
  }

  if (fileSize > 0) {
    headers['content-length'] = fileSize
  }
  res.writeHead(200, headers)
  createReadStream(file).pipe(res)
})

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`\n  Port ${PORT} is already in use. Stop the existing process or choose another port.\n`)
    process.exit(1)
  }
  throw err
})

server.listen(PORT, () => {
  console.log(`\n  Serving ${ROOT} on http://localhost:${PORT}\n`)
})
