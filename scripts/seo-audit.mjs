#!/usr/bin/env node
/**
 * Static SEO audit, run against the built `dist/` output.
 *
 * The seo-audit skill warns that `curl`-style fetching cannot see JSON-LD, but
 * that warning is about *client-side injected* schema. This site prerenders its
 * head from the same metadata registry the client uses, so the JSON-LD is in the
 * static file by construction — which the script asserts rather than assumes.
 * Rendered-DOM checks (Core Web Vitals, tap targets, viewport behaviour) live in
 * `scripts/seo-audit-browser.mjs`.
 */
import fs from 'node:fs'
import path from 'node:path'

const DIST = path.resolve(process.argv[2] ?? 'dist')
const findings = []
const add = (area, issue, impact, evidence, fix) =>
  findings.push({ area, issue, impact, evidence, fix })

const pages = []
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p)
    else if (e.name === 'index.html') pages.push(p)
  }
}
if (!fs.existsSync(DIST)) {
  console.error(`No dist at ${DIST}. Run npm run build first.`)
  process.exit(2)
}

// A stale build produces confident findings about pages that are not the ones
// about to ship. Compare the newest source file with the build output and say so
// plainly rather than reporting a wall of false failures.
{
  // Only inputs that shape the build output. Excluding scripts/ keeps this check
  // from firing on its own edit, which would make it useless.
  const newestSource = newestMtime([
    'src',
    'index.html',
    'vite.config.ts',
    'tsconfig.app.json',
    'tsconfig.node.json',
    'package.json',
  ])
  const oldestArtifact = oldestMtime([path.join(DIST, 'index.html'), path.join(DIST, 'assets')])
  if (newestSource > oldestArtifact) {
    console.error(
      `dist is older than the source. Findings would describe a build that no longer exists.\n` +
        `Run: npm run build && npm run seo:audit`,
    )
    process.exit(2)
  }
}

function walkTimes(dir) {
  const out = []
  if (!fs.existsSync(dir)) return out
  const stat = fs.statSync(dir)
  if (!stat.isDirectory()) return [stat.mtimeMs]
  for (const e of fs.readdirSync(dir)) out.push(...walkTimes(path.join(dir, e)))
  return out
}
function newestMtime(targets) {
  const times = targets.flatMap((t) => walkTimes(path.join(process.cwd(), t)))
  return times.length ? Math.max(...times) : 0
}
function oldestMtime(targets) {
  const times = targets.flatMap((t) => walkTimes(t))
  return times.length ? Math.min(...times) : 0
}
walk(DIST)

const routeOf = (f) => {
  const rel = path.relative(DIST, f).split(path.sep)
  rel.pop()
  return rel.length ? `/${rel.join('/')}/` : '/'
}

const pick = (html, re) => (html.match(re) ?? [])[1]
function getMetaContent(html, nameOrProp, attrName = 'name') {
  const metaTags = html.match(/<meta\s+[^>]*>/gi) ?? []
  for (const tag of metaTags) {
    if (new RegExp(`${attrName}=["']${nameOrProp}["']`, 'i').test(tag)) {
      const contentMatch = tag.match(/content=["']([^"']*)["']/i)
      if (contentMatch) return contentMatch[1]
    }
  }
  return ''
}
function getLinkHref(html, rel) {
  const linkTags = html.match(/<link\s+[^>]*>/gi) ?? []
  for (const tag of linkTags) {
    if (new RegExp(`rel=["']${rel}["']`, 'i').test(tag)) {
      const hrefMatch = tag.match(/href=["']([^"']*)["']/i)
      if (hrefMatch) return hrefMatch[1]
    }
  }
  return ''
}

const records = pages.map((file) => {
  const html = fs.readFileSync(file, 'utf8')
  return {
    file,
    route: routeOf(file),
    html,
    title: pick(html, /<title>([\s\S]*?)<\/title>/) ?? '',
    desc: getMetaContent(html, 'description', 'name'),
    canonical: getLinkHref(html, 'canonical'),
    robots: getMetaContent(html, 'robots', 'name'),
    ogUrl: getMetaContent(html, 'og:url', 'property'),
    lang: pick(html, /<html\s+[^>]*lang=["']([^"']*)["']/i) ?? '',
    viewport: getMetaContent(html, 'viewport', 'name'),
    h1s: [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map((m) =>
      m[1].replace(/<[^>]+>/g, '').trim(),
    ),
    headings: [...html.matchAll(/<h([1-6])[^>]*>/g)].map((m) => Number(m[1])),
    jsonld: [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(
      (m) => m[1],
    ),
    imgs: [...html.matchAll(/<img([^>]*)>/g)].map((m) => m[1]),
    links: [...html.matchAll(/href="([^"]*)"/g)].map((m) => m[1]),
    bodyText: (() => {
      const m = html.match(/<main[^>]*>([\s\S]*)<\/main>/)
      return (m ? m[1] : html)
        .replace(/<script[\s\S]*?<\/script>/g, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    })(),
  }
})

const dec = (s) =>
  (s ?? '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')

// Relative URLs are legal in builds without SITE_ORIGIN (local verification).
// Parse everything against a throwaway base so the audit reports findings
// instead of crashing exactly when it is needed most.
const P = (u) => new URL(u, 'https://audit.local')

const indexable = records.filter((r) => !/noindex/.test(r.robots))

// --- 1. Crawlability -------------------------------------------------------
const robotsPath = path.join(DIST, 'robots.txt')
if (!fs.existsSync(robotsPath)) {
  add(
    'Crawlability',
    'robots.txt missing',
    'High',
    'dist/robots.txt not found',
    'Generate robots.txt at build time',
  )
} else {
  const robots = fs.readFileSync(robotsPath, 'utf8')
  if (!/Sitemap:\s*\S+/i.test(robots))
    add(
      'Crawlability',
      'robots.txt does not reference the sitemap',
      'Medium',
      robots.slice(0, 120),
      'Add a Sitemap: line',
    )
  if (/\nUser-agent:\s*\*/i.test(robots) && /\nDisallow:\s*\/\s*$/m.test(robots))
    add(
      'Crawlability',
      'robots.txt blocks all crawling',
      'Critical',
      'Disallow: / for *',
      'Remove the blanket block',
    )
  if (!/Allow:/i.test(robots) && /Sitemap:/i.test(robots)) {
    /* absence of Allow is fine unless Disallow present */
  }
}

// --- 2. Sitemap ------------------------------------------------------------
const sitemapPath = path.join(DIST, 'sitemap.xml')
let sitemapLocs = []
if (!fs.existsSync(sitemapPath)) {
  add(
    'Crawlability',
    'sitemap.xml missing',
    'High',
    'dist/sitemap.xml not found',
    'Generate it at build time',
  )
} else {
  const xml = fs.readFileSync(sitemapPath, 'utf8')
  if (!/<urlset[^>]+xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9"/.test(xml)) {
    add(
      'Crawlability',
      'sitemap.xml is missing the standard namespace',
      'High',
      '<urlset> without xmlns',
      'Add the sitemap schema namespace',
    )
  }
  sitemapLocs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
  if (!/<lastmod>/.test(xml))
    add('Crawlability', 'sitemap has no lastmod', 'Low', 'no <lastmod>', 'Add a lastmod')
  for (const loc of sitemapLocs) {
    if (!/^https:\/\//.test(loc))
      add(
        'Crawlability',
        `sitemap URL is not absolute/https: ${loc}`,
        'High',
        loc,
        'Emit absolute https URLs',
      )
  }
}

// --- 3. Indexation & canonicals -------------------------------------------
const noindexRoutes = records.filter((r) => /noindex/.test(r.robots)).map((r) => r.route)
const sitemapRoutes = new Set(sitemapLocs.map((u) => P(u).pathname))
for (const r of indexable) {
  if (!r.canonical) {
    add(
      'Indexation',
      `${r.route} has no canonical`,
      'High',
      'missing link rel=canonical',
      'Emit a self-referencing canonical',
    )
    continue
  }
  if (!r.canonical.startsWith('https://'))
    add('Indexation', `${r.route} canonical is not https`, 'Medium', r.canonical, 'Use https')
  if (!sitemapRoutes.has(P(r.canonical).pathname)) {
    add(
      'Indexation',
      `${r.route} is indexable but absent from sitemap.xml`,
      'High',
      r.canonical,
      'Add the route to scripts/prerender.mjs ROUTES',
    )
  }
  if (r.ogUrl && r.ogUrl !== r.canonical)
    add(
      'Indexation',
      `${r.route} og:url disagrees with canonical`,
      'Low',
      `${r.ogUrl} vs ${r.canonical}`,
      'Make them identical',
    )
}
for (const r of records) {
  if (/noindex/.test(r.robots) && sitemapRoutes.has(P('https://x' + r.route).pathname)) {
    add(
      'Indexation',
      `${r.route} is noindex but present in the sitemap`,
      'High',
      'noindex + listed',
      'Remove it from the sitemap',
    )
  }
}

// --- 4. Trailing-slash consistency ----------------------------------------
for (const r of records) {
  // Noindex shells (app routes, 404) deliberately carry no canonical.
  if (/noindex/.test(r.robots) && !r.canonical) continue
  const canonPath = r.canonical ? P(r.canonical).pathname : ''
  if (canonPath !== r.route) {
    add(
      'Indexation',
      `${r.route} canonical path ${canonPath} differs from route`,
      'Medium',
      `${canonPath} vs ${r.route}`,
      'Keep canonical path identical to the served path',
    )
  }
}

// --- 5. On-page: titles -----------------------------------------------------
const titles = new Map()
for (const r of records) {
  const t = dec(r.title)
  if (!t) {
    add('On-Page', `${r.route} has no title`, 'High', 'empty <title>', 'Every page needs a title')
    continue
  }
  titles.set(t, (titles.get(t) ?? 0) + 1)
  // The SERP shows roughly 60 characters before truncation on desktop.
  if (t.length > 65)
    add(
      'On-Page',
      `${r.route} title is ${t.length} chars (likely truncated)`,
      'Medium',
      t,
      'Trim to under 60 before the brand suffix',
    )
  if (t.length < 25)
    add(
      'On-Page',
      `${r.route} title is very short (${t.length} chars)`,
      'Low',
      t,
      'Use the available space to carry the keyword',
    )
}
for (const [t, n] of titles)
  if (n > 1) add('On-Page', `Duplicate title on ${n} pages`, 'High', t, 'Make titles unique')

// --- 6. On-page: descriptions ----------------------------------------------
const descs = new Map()
for (const r of indexable) {
  const d = dec(r.desc)
  if (!d) {
    add('On-Page', `${r.route} has no meta description`, 'High', 'missing', 'Add one')
    continue
  }
  descs.set(d, (descs.get(d) ?? 0) + 1)
  if (d.length > 165)
    add(
      'On-Page',
      `${r.route} description is ${d.length} chars (likely truncated)`,
      'Medium',
      d.slice(0, 90) + '…',
      'Trim toward 150-160',
    )
  if (d.length < 110)
    add(
      'On-Page',
      `${r.route} description is only ${d.length} chars`,
      'Low',
      d.slice(0, 90),
      'Use more of the snippet allowance',
    )
}
for (const [d, n] of descs)
  if (n > 1)
    add(
      'On-Page',
      `Duplicate meta description on ${n} pages`,
      'High',
      d.slice(0, 90),
      'Make descriptions unique',
    )

// --- 7. Headings ------------------------------------------------------------
for (const r of records) {
  if (r.h1s.length === 0)
    add('On-Page', `${r.route} has no h1`, 'High', '0 h1', 'Add a single descriptive h1')
  else if (r.h1s.length > 1)
    add(
      'On-Page',
      `${r.route} has ${r.h1s.length} h1s`,
      'Medium',
      r.h1s.join(' | '),
      'Keep exactly one h1',
    )
  let prev = 0
  for (const level of r.headings) {
    if (prev && level > prev + 1) {
      add(
        'On-Page',
        `${r.route} skips a heading level (h${prev} → h${level})`,
        'Low',
        `h${prev} then h${level}`,
        'Do not skip heading levels',
      )
      break
    }
    prev = level
  }
}

// --- 8. Structured data -----------------------------------------------------
for (const r of indexable) {
  if (r.jsonld.length === 0) {
    add('Structured Data', `${r.route} has no JSON-LD`, 'Medium', '0 blocks', 'Add relevant schema')
    continue
  }
  for (const raw of r.jsonld) {
    try {
      JSON.parse(raw.replace(/\\u003c/g, '<'))
    } catch (e) {
      add(
        'Structured Data',
        `${r.route} has invalid JSON-LD`,
        'High',
        String(e).slice(0, 90),
        'Fix the serialisation',
      )
    }
  }
  // FAQPage markup is only valid if the same questions are visible on the page.
  for (const raw of r.jsonld) {
    let parsed
    try {
      parsed = JSON.parse(raw.replace(/\\u003c/g, '<'))
    } catch {
      continue
    }
    if (parsed['@type'] === 'FAQPage') {
      for (const q of parsed.mainEntity ?? []) {
        const needle = (q.name ?? '').split('?')[0].trim().slice(0, 34)
        if (needle && !r.bodyText.includes(needle)) {
          add(
            'Structured Data',
            `${r.route} marks up a FAQ question that is not visible on the page`,
            'High',
            needle,
            'Render the marked-up FAQ in the page body',
          )
          break
        }
      }
    }
  }
}

// --- 9. Images --------------------------------------------------------------
for (const r of records) {
  for (const attrs of r.imgs) {
    if (!/\balt\s*=/.test(attrs))
      add(
        'Images',
        `${r.route} has an <img> with no alt attribute`,
        'Medium',
        attrs.slice(0, 80),
        'Add descriptive alt text',
      )
    else if (/alt\s*=\s*""/.test(attrs))
      add(
        'Images',
        `${r.route} has a decorative <img> with empty alt`,
        'Low',
        attrs.slice(0, 80),
        'Mark decorative images alt="" and aria-hidden',
      )
    if (!/\bloading\s*=/.test(attrs) && !/favicon|logo|icon/i.test(attrs))
      add(
        'Images',
        `${r.route} img is not lazily loaded`,
        'Low',
        attrs.slice(0, 80),
        'Add loading="lazy" to below-the-fold images',
      )
  }
}

// --- 10. Internal links -----------------------------------------------------
const routeSet = new Set(records.map((r) => r.route))
const assetExists = (rel) => fs.existsSync(path.join(DIST, rel.replace(/^\//, '')))
for (const r of records) {
  for (const href of new Set(r.links)) {
    if (/^(https?:|mailto:|tel:|#)/.test(href)) continue
    // Query routes (/practice/?type=x) and anchors (/guide/#templates) resolve
    // like their base path — the same way browsers and static hosts treat them —
    // so validate the file behind the query/hash instead of skipping or failing.
    const bare = href.split(/[?#]/)[0]
    if (!bare || !bare.startsWith('/')) continue
    const hrefForCheck = bare
    if (!assetExists(hrefForCheck)) {
      add(
        'Internal Links',
        `${r.route} links to ${href} which has no file`,
        'High',
        href,
        'Fix the route or remove the link',
      )
      continue
    }
    const target = hrefForCheck.endsWith('/') ? hrefForCheck : `${hrefForCheck}/`
    if (!routeSet.has(target) && !/assets|\.[a-z0-9]+$/i.test(hrefForCheck))
      add(
        'Internal Links',
        `${r.route} links to ${href} with no matching page`,
        'Medium',
        href,
        'Correct the target',
      )
  }
}

// Orphans: indexable pages nothing links to.
const linked = new Set()
for (const r of records)
  for (const h of r.links) if (h.startsWith('/')) linked.add(h.endsWith('/') ? h : `${h}/`)
for (const r of indexable) {
  if (r.route === '/') continue
  if (!linked.has(r.route))
    add(
      'Internal Links',
      `${r.route} is an orphan (no internal links point to it)`,
      'High',
      'no inbound links',
      'Link it from the hub, nav, or footer',
    )
}

// --- 11. Language & viewport ------------------------------------------------
for (const r of records) {
  if (!r.lang)
    add(
      'Technical',
      `${r.route}: <html> has no lang attribute`,
      'Medium',
      'missing lang',
      'Add lang="en"',
    )
  if (!r.viewport)
    add(
      'Technical',
      `${r.route}: No viewport meta tag`,
      'High',
      'missing viewport',
      'Add width=device-width, initial-scale=1',
    )
  else if (!/width=device-width/.test(r.viewport))
    add(
      'Technical',
      `${r.route}: Viewport is not device-width aware`,
      'Medium',
      r.viewport,
      'Use width=device-width',
    )
}

// --- 12. Font payload ------------------------------------------------------
// Self-hosted faces mean no third-party request, but they are also the heaviest
// static asset on a text site. Raw TTF in particular is roughly three times the
// size of the same face as WOFF2 and delays LCP, which is body text.
{
  const fontDir = path.join(DIST, 'fonts')
  if (fs.existsSync(fontDir)) {
    const fonts = fs.readdirSync(fontDir).filter((f) => /\.(ttf|otf|woff2?)$/i.test(f))
    let bytes = 0
    const raw = []
    for (const f of fonts) {
      const size = fs.statSync(path.join(fontDir, f)).size
      bytes += size
      if (!f.endsWith('.woff2') && !f.endsWith('.woff'))
        raw.push(`${f} (${Math.round(size / 1024)} KB)`)
    }
    const kb = Math.round(bytes / 1024)
    if (kb > 300)
      add(
        'Speed',
        `Font payload is ${kb} KB`,
        'Medium',
        `${fonts.length} files`,
        'Convert to WOFF2 and subset to the characters the site uses',
      )
    if (raw.length)
      add(
        'Speed',
        `${raw.length} font(s) are not WOFF2`,
        'Medium',
        raw.join(', '),
        'Convert with fonttools; WOFF2 is 60-70% smaller',
      )

    // The CSS must reference the format it actually ships.
    const css = fs.readdirSync(path.join(DIST, 'assets')).filter((f) => f.endsWith('.css'))
    const cssText = css.map((f) => fs.readFileSync(path.join(DIST, 'assets', f), 'utf8')).join('\n')
    if (fonts.some((f) => f.endsWith('.woff2')) && !/format\(["']?woff2/.test(cssText)) {
      add(
        'Speed',
        'WOFF2 files are shipped but the CSS does not declare format("woff2")',
        'High',
        'no woff2 format token in built CSS',
        'Update the @font-face src descriptors',
      )
    }
  }
}

// --- 13. Progressive enhancement of animated content -----------------------
// The mockup's tagline is static highlighted text (no JS animation), so the
// server markup ships the fully resolved state. Verify the hl highlight
// pattern exists instead of the old word-reveal nodes.
{
  const home = records.find((r) => r.route === '/')
  if (home) {
    const hasHighlight = home.html.includes('tagline-text') && home.html.includes('hl"')
    if (!hasHighlight) {
      add(
        'Progressive Enhancement',
        '/ has no tagline highlight',
        'Medium',
        '0 tagline-text/hl nodes',
        'Keep the B11 section on the home page',
      )
    }
  }
}

// --- Report -----------------------------------------------------------------
const byImpact = { Critical: 0, High: 0, Medium: 0, Low: 0 }
for (const f of findings) byImpact[f.impact] = (byImpact[f.impact] ?? 0) + 1

console.log(`\n== Static SEO audit of ${path.basename(DIST)} ==`)
console.log(
  `\n  ${records.length} pages (${indexable.length} indexable, ${noindexRoutes.length} noindex)`,
)
console.log(`  ${sitemapLocs.length} sitemap URLs`)
console.log(
  `\n  Findings: ${findings.length}  (critical ${byImpact.Critical}, high ${byImpact.High}, medium ${byImpact.Medium}, low ${byImpact.Low})`,
)

if (!findings.length) {
  console.log('\n  No issues found.\n')
  process.exit(0)
}

const order = { Critical: 0, High: 1, Medium: 2, Low: 3 }
findings.sort((a, b) => order[a.impact] - order[b.impact] || a.area.localeCompare(b.area))
for (const f of findings) {
  console.log(`\n  [${f.impact}] ${f.area} — ${f.issue}`)
  console.log(`      evidence: ${f.evidence}`)
  console.log(`      fix:      ${f.fix}`)
}
console.log('')
process.exit(findings.some((f) => f.impact === 'Critical' || f.impact === 'High') ? 1 : 0)
