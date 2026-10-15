#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Static prerender.
//
// A single-page app serves an empty <div id="root"> to anything that does not
// execute JavaScript, which means a search engine indexes nothing. This step
// renders the indexable routes to real HTML at build time and writes them into
// dist/, then generates sitemap.xml and robots.txt.
//
// The site stays a static bundle: no server, no hosting cost.
// ---------------------------------------------------------------------------

import { mkdir, readFile, writeFile, rm, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const DIST = path.resolve('dist')
const SSR_BUNDLE = path.resolve('dist-ssr/entry-server.js')

/**
 * Minimal .env loader so a domain can be configured in one place.
 * Real environment variables always win, which is what CI wants.
 */
async function loadEnv() {
  for (const file of ['.env', '.env.production', '.env.local']) {
    const full = path.resolve(file)
    if (!existsSync(full)) continue
    const contents = await readFile(full, 'utf8')
    for (const line of contents.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      let value = trimmed.slice(eq + 1).trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      if (process.env[key] === undefined) process.env[key] = value
    }
  }
}

await loadEnv()

const FALLBACK_ORIGIN = 'https://pte-prep.pages.dev'
const ORIGIN = ((process.env.SITE_ORIGIN ?? process.env.VITE_SITE_ORIGIN ?? '').replace(/\/+$/, '')) || FALLBACK_ORIGIN

// A Netlify placeholder origin would bake wrong canonicals into every page.
// Fail here, with the fix, rather than deploying bad metadata silently.
if (/your-site|example\.(com|test)/.test(ORIGIN)) {
  throw new Error(
    `Refusing to build with placeholder origin "${ORIGIN}". Set SITE_ORIGIN to the real domain.`,
  )
}

// Sub-path deployments (e.g. GitHub project Pages at /repo/) set BASE_PATH so
// that root-absolute references to public assets and internal links keep working.
const BASE = (() => {
  const raw = (process.env.BASE_PATH ?? '/').trim() || '/'
  const withSlashes = raw.startsWith('/') ? raw : `/${raw}`
  return withSlashes.endsWith('/') ? withSlashes : `${withSlashes}/`
})()

/**
 * Rewrites root-absolute font references inside built CSS so they survive
 * under a sub-path base. Everything else already carries the base: bundled
 * assets and the document head via Vite, internal links via the router
 * basename shared by the client and the SSR render. (An earlier version of
 * this function also rewrote HTML and double-prefixed what Vite had already
 * fixed — HTML is deliberately left alone.)
 */
function applyBase(text, isCss = false) {
  if (BASE === '/' || !isCss) return text
  return text.replaceAll('url(/fonts/', `url(${BASE}fonts/`)
}

/** Routes that should exist as real HTML files. */
const ROUTES = [
  { path: '/', file: 'index.html', priority: '1.0', changefreq: 'weekly' },
  { path: '/mock/', file: 'mock/index.html', priority: '0.9', changefreq: 'weekly' },
  { path: '/practice/', file: 'practice/index.html', priority: '0.9', changefreq: 'monthly' },
  { path: '/format/', file: 'format/index.html', priority: '0.8', changefreq: 'monthly' },
  { path: '/scoring/', file: 'scoring/index.html', priority: '0.8', changefreq: 'monthly' },
  { path: '/guide/', file: 'guide/index.html', priority: '0.8', changefreq: 'monthly' },
  { path: '/about/', file: 'about/index.html', priority: '0.5', changefreq: 'yearly' },
  { path: '/privacy/', file: 'privacy/index.html', priority: '0.4', changefreq: 'yearly' },
  { path: '/dashboard/', file: 'dashboard/index.html', priority: '0.0', changefreq: 'yearly', noindex: true },
  { path: '/login/', file: 'login/index.html', priority: '0.0', changefreq: 'yearly', noindex: true },
  { path: '/register/', file: 'register/index.html', priority: '0.0', changefreq: 'yearly', noindex: true },
]

// The per-question-type hub and spokes. The slug list mirrors the keys in
// src/content/questionTypeDetail.ts, which is the single source of truth; the
// assertion below keeps the two from drifting apart silently.
const QUESTION_TYPE_SLUGS = [
  'read-aloud',
  'repeat-sentence',
  'describe-image',
  'retell-lecture',
  'answer-short-question',
  'summarize-group-discussion',
  'respond-to-situation',
  'summarize-written-text',
  'write-essay',
  'fill-in-blanks-dropdown',
  'fill-in-blanks-table',
  'multiple-choice-single',
  'multiple-choice-multiple',
  'reorder-paragraphs',
  'summarize-spoken-text',
  'fill-in-blanks-listening',
  'highlight-correct-summary',
  'listening-multiple-choice-single',
  'listening-multiple-choice-multiple',
  'select-missing-word',
  'highlight-incorrect-words',
  'write-from-dictation',
]

const EXPECTED_QUESTION_TYPE_COUNT = 22
if (QUESTION_TYPE_SLUGS.length !== EXPECTED_QUESTION_TYPE_COUNT) {
  throw new Error(
    `Expected ${EXPECTED_QUESTION_TYPE_COUNT} question-type slugs in prerender.mjs, found ${QUESTION_TYPE_SLUGS.length}. ` +
      'Keep this list in step with src/content/questionTypeDetail.ts.',
  )
}

ROUTES.push(
  { path: '/question-types/', file: 'question-types/index.html', priority: '0.8', changefreq: 'monthly' },
  ...QUESTION_TYPE_SLUGS.map((slug) => ({
    path: `/question-types/${slug}/`,
    file: `question-types/${slug}/index.html`,
    priority: '0.6',
    changefreq: 'monthly',
  })),
)

/** Absolute URLs are only emitted when the origin is known at build time. */
function abs(p) {
  return ORIGIN ? `${ORIGIN}${p}` : p
}

function escapeXml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** Build a complete static document from the shared template. */
function buildPage(template, { html, head, canonical, noindex, hydrate = true }) {
  let out = template

  // index.html ships placeholder metadata; the prerendered head replaces it so
  // that each route carries its own title, description and social tags.
  out = out
    .replace(/<title>[\s\S]*?<\/title>/, '')
    // The template's own metadata is written across several lines, so the
    // patterns have to tolerate whitespace between the attributes.
    .replace(/\s*<meta\s[^>]*name="description"[^>]*>/g, '')
    .replace(/\s*<meta\s[^>]*name="keywords"[^>]*>/g, '')
    .replace(/\s*<meta\s[^>]*property="og:[^"]*"[^>]*>/g, '')
    .replace(/\s*<meta\s[^>]*name="twitter:[^"]*"[^>]*>/g, '')
    .replace(/\s*<link\s[^>]*rel="canonical"[^>]*>/g, '')
    .replace(/\s*<meta\s[^>]*name="robots"[^>]*>/g, '')

  // The registry's canonical is dropped in favour of the build-time URL, so the
  // static HTML and the runtime document never disagree.
  const headTags = head
    .replace(/\s*<link\s[^>]*rel="canonical"[^>]*>/g, '')
    .replace(/\s*<meta\s[^>]*name="robots"[^>]*>/g, '')

  const tags = [headTags]
  if (noindex) tags.push('<meta name="robots" content="noindex, nofollow" />')
  else tags.push('<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />')
  // A single canonical is emitted; the registry's version is relative when the
  // origin is unknown at build time, so it is rewritten to an absolute URL.
  // Shells and the 404 pass null: they are noindex and must not offer crawlers
  // a canonical that either 404s or points at an unindexable app route.
  if (canonical) tags.push(`<link rel="canonical" href="${canonical}" />`)

  out = out.replace('</head>', `    ${tags.join('\n    ')}\n  </head>`)

  // The root marker tells the client to hydrate this markup instead of
  // rendering from scratch, which is what keeps the prerender useful. Shells
  // pass hydrate:false: their screen-reader heading is injected unmarked so
  // the client renders fresh instead of hydrating against markup it never made.
  const marker = hydrate ? ' data-hydrate="true"' : ''
  if (html) {
    out = out.replace(/<div id="root"><\/div>/, `<div id="root"${marker}>${html}</div>`)
    out = out.replace(/<div id="root" data-hydrate="true"><\/div>/, `<div id="root"${marker}>${html}</div>`)
  }

  return out
}

async function main() {
  if (!existsSync(SSR_BUNDLE)) {
    console.error(`\n  Missing SSR bundle at ${SSR_BUNDLE}.`)
    console.error('  Run: vite build --ssr src/entry-server.tsx --outDir dist-ssr\n')
    process.exit(1)
  }

  const template = await readFile(path.join(DIST, 'index.html'), 'utf8')
  const { render } = await import(pathToFileURL(SSR_BUNDLE).href)

  let written = 0

  for (const route of ROUTES) {
    const page = await render(route.path)
    const html = buildPage(template, {
      html: page.html,
      head: page.head,
      canonical: abs(route.path),
      noindex: Boolean(route.noindex) || page.noindex,
    })

    const target = path.join(DIST, route.file)
    await mkdir(path.dirname(target), { recursive: true })
    await writeFile(target, applyBase(html), 'utf8')
    written += 1

    const kb = (Buffer.byteLength(html) / 1024).toFixed(0)
    const inner = (Buffer.byteLength(page.html) / 1024).toFixed(0)
    const ld = page.structuredData.length
    console.log(`  \u2713 ${route.path.padEnd(12)} ${route.file.padEnd(22)} ${kb} kB (${inner} kB markup, ${ld} JSON-LD)`)
  }

  // --- sitemap.xml -------------------------------------------------------
  const today = new Date().toISOString().slice(0, 10)
  const urls = ROUTES.filter((r) => !r.noindex)
    .map(
      (r) => `  <url>
    <loc>${escapeXml(abs(r.path))}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`,
    )
    .join('\n')

  await writeFile(
    path.join(DIST, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    'utf8',
  )
  console.log(`  ✓ sitemap.xml   ${ROUTES.filter((r) => !r.noindex).length} indexable URLs`)

  // --- robots.txt --------------------------------------------------------
  const sitemapLine = ORIGIN ? `Sitemap: ${ORIGIN}/sitemap.xml` : '# Set SITE_ORIGIN at build time to emit an absolute Sitemap line.'
  await writeFile(
    path.join(DIST, 'robots.txt'),
    `User-agent: *
Allow: /
Disallow: /test
Disallow: /result
Disallow: /reset-password

${sitemapLine}
`,
    'utf8',
  )
  console.log('  ✓ robots.txt')

  // --- 404 ---------------------------------------------------------------
  // Hosters that serve a custom 404 still need real content, not an empty shell.
  {
    const notFound = await render('/this-page-does-not-exist', { known: false })
    const html = buildPage(template, {
      html: notFound.html,
      head: notFound.head,
      canonical: null,
      noindex: true,
    })
    await writeFile(path.join(DIST, '404.html'), applyBase(html), 'utf8')
    console.log('  ✓ 404.html')
  }

  // --- app shells ----------------------------------------------------------
  // /test and /result can never be prerendered (they need a live test in
  // progress), but hosts must serve *something* with the right shape: an empty
  // root the client boots into, noindex, and no canonical. Serving the home
  // document here used to make the client hydrate against the wrong markup and
  // flash the wrong title — these shells fix reloads, deep links and offline.
  for (const shell of [
    { path: '/test/', file: 'test/index.html', title: 'Sit a mock test — PTE Prep', h1: 'Sit a PTE Academic mock test' },
    { path: '/result/', file: 'result/index.html', title: 'Your mock score — PTE Prep', h1: 'Your PTE Academic mock score' },
    { path: '/reset-password/', file: 'reset-password/index.html', title: 'Reset Your PTE Prep Password', h1: 'Reset your PTE Prep password' },
  ]) {
    const shellHtml = buildPage(template, {
      html: `<h1 class="sr-only">${shell.h1}</h1>`,
      head: `<title>${shell.title}</title>\n    <meta name="description" content="PTE Prep runs in your browser." />`,
      canonical: null,
      noindex: true,
      hydrate: false,
    })
    const target = path.join(DIST, shell.file)
    await mkdir(path.dirname(target), { recursive: true })
    await writeFile(target, applyBase(shellHtml), 'utf8')
    console.log(`  ✓ ${shell.path.padEnd(12)} ${shell.file.padEnd(22)} app shell`)
  }

  // --- base-path rewrite -------------------------------------------------
  // Vite leaves public-dir references (fonts) at root-absolute paths. Under a
  // sub-path base they 404, so the built CSS is rewritten in place.
  if (BASE !== '/') {
    const assetsDir = path.join(DIST, 'assets')
    if (existsSync(assetsDir)) {
      for (const entry of await readdir(assetsDir)) {
        if (!entry.endsWith('.css')) continue
        const file = path.join(assetsDir, entry)
        const css = await readFile(file, 'utf8')
        const rewritten = applyBase(css, true)
        if (rewritten !== css) await writeFile(file, rewritten, 'utf8')
      }
    }
    console.log(`  ✓ base paths rewritten for "${BASE}"`)
  }

  // --- offline HTML precache ------------------------------------------------
  // The service worker is generated before this step runs, so it cannot know
  // the prerendered documents. Every dist document is appended to its precache
  // manifest (content-hashed, so updates invalidate), which makes unvisited
  // routes work offline — the "works offline" claim on the marketing pages.
  {
    const { createHash } = await import('node:crypto')
    const pages = []
    async function walk(dir) {
      for (const entry of await readdir(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) await walk(full)
        else if (entry.name.endsWith('.html')) pages.push(full)
      }
    }
    await walk(DIST)
    const entries = []
    for (const file of pages.sort()) {
      const body = await readFile(file)
      const url = path.relative(DIST, file).split(path.sep).join('/')
      const revision = createHash('md5').update(body).digest('hex')
      entries.push(`{url:"${url}",revision:"${revision}"}`)
    }
    const swFile = path.join(DIST, 'sw.js')
    if (existsSync(swFile) && entries.length > 0) {
      let sw = await readFile(swFile, 'utf8')
      if (!sw.includes('precacheAndRoute([')) throw new Error('sw.js precache call not found')
      sw = sw
        .replace('precacheAndRoute([', `precacheAndRoute([${entries.join(',')},`)
        // Match directory URLs (/mock/) to their index documents, and ignore
        // query strings (/practice/?type=x) — no precached page varies by query.
        .replace('],{})', '],{directoryIndex:"index.html",ignoreURLParametersMatching:[/.*/]})')
      await writeFile(swFile, sw, 'utf8')
      console.log(`  ✓ sw.js precaches ${entries.length} documents`)
    }
  }

  // Vite's SSR output is a build artefact, not a deployable asset.
  await rm(path.resolve('dist-ssr'), { recursive: true, force: true })

  console.log(`\n  Prerendered ${written} routes into dist/`)
  if (!process.env.SITE_ORIGIN && !process.env.VITE_SITE_ORIGIN) {
    console.log(`  Note: SITE_ORIGIN was not set, defaulted to ${FALLBACK_ORIGIN}.`)
    console.log('        Set SITE_ORIGIN=https://your-domain to emit absolute URLs for a custom domain.\n')
  } else {
    console.log(`  Origin: ${ORIGIN}\n`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
