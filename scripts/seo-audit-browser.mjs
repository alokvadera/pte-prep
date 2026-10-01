#!/usr/bin/env node
/**
 * Rendered-DOM SEO audit.
 *
 * The seo-audit skill is explicit that `curl` and `web_fetch` cannot be used to
 * judge schema, Core Web Vitals or mobile behaviour, because they never run the
 * page. Everything here is measured against a real rendered page in headless
 * Chrome, which is the only honest way to check those three areas.
 *
 * Usage: node scripts/seo-audit-browser.mjs [baseUrl]
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'

const BASE = process.argv[2] ?? 'http://localhost:5200'
const PORT = 9491
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'seo-browser-'))

const chromeBinary = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].find((p) => fs.existsSync(p))

if (!chromeBinary) {
  console.error('No Chrome binary found; skipping rendered-DOM audit.')
  if (process.argv.includes('--strict')) {
    console.error('Failing because --strict was passed.')
    process.exit(1)
  }
  process.exit(0)
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Wait for the server rather than assuming it is up. Without this the first
// route can be fetched before the static server is listening, and the audit
// reports a confident finding about a page that was never rendered.
const deadline = Date.now() + 20_000
for (;;) {
  try {
    const r = await fetch(BASE, { signal: AbortSignal.timeout(2000) })
    if (r.ok) break
  } catch {}
  if (Date.now() > deadline) {
    console.error(`No server at ${BASE}. Start one with: npm run serve`)
    process.exit(2)
  }
  await sleep(300)
}

const chrome = spawn(
  chromeBinary,
  [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    '--no-first-run',
    '--disable-gpu',
    '--hide-scrollbars',
  ],
  { stdio: 'ignore' },
)

let version
for (let i = 0; i < 100; i++) {
  try {
    const r = await fetch(`http://127.0.0.1:${PORT}/json/version`)
    if (r.ok) { version = await r.json(); break }
  } catch {}
  await sleep(200)
}
if (!version) {
  console.error('Chrome did not start')
  process.exit(2)
}

const ws = new WebSocket(version.webSocketDebuggerUrl)
let id = 1
const pending = new Map()
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data)
  if (m.id && pending.has(m.id)) {
    const p = pending.get(m.id)
    pending.delete(m.id)
    m.error ? p.reject(new Error(m.error.message)) : p.resolve(m.result)
  }
})
await new Promise((r) => ws.addEventListener('open', r, { once: true }))
const send = (method, params = {}, sessionId) =>
  new Promise((resolve, reject) => {
    const i = id++
    pending.set(i, { resolve, reject })
    ws.send(JSON.stringify({ id: i, method, params, ...(sessionId ? { sessionId } : {}) }))
  })

const findings = []
const add = (area, issue, impact, evidence, fix) => findings.push({ area, issue, impact, evidence, fix })

const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
await send('Runtime.enable', {}, sessionId)
await send('Page.enable', {}, sessionId)
await send('Network.enable', {}, sessionId)
await send('Log.enable', {}, sessionId)

const consoleErrors = []
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data)
  if (m.sessionId !== sessionId) return
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
    consoleErrors.push(m.params.args.map((a) => a.value ?? a.description ?? '').join(' '))
  }
  if (m.method === 'Log.entryAdded' && m.params.level === 'error') consoleErrors.push(m.params.entry.text)
})

const ev = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, sessionId)
  return r.exceptionDetails ? null : r.result.value
}

const ROUTES = [
  '/', '/mock', '/practice', '/format/', '/scoring/', '/guide/', '/about/', '/question-types/',
  '/question-types/read-aloud/', '/question-types/listening-multiple-choice-multiple/',
]

// ---------------------------------------------------------------------------
// 1. Rendered structured data
// ---------------------------------------------------------------------------
for (const route of ROUTES) {
  await send('Page.navigate', { url: BASE + route }, sessionId)
  await sleep(1800)
  const parsed = await ev(`
    (() => {
      const out = []
      for (const s of document.querySelectorAll('script[type="application/ld+json"]')) {
        try { out.push(JSON.parse(s.textContent)) } catch (e) { out.push({ __invalid: String(e) }) }
      }
      return JSON.stringify(out)
    })()
  `)
  let list = []
  try { list = JSON.parse(parsed ?? '[]') } catch {}
  const valid = list.filter((x) => x && !x.__invalid)
  if (valid.length === 0) add('Structured Data', `${route} renders no valid JSON-LD`, 'Medium', '0 valid blocks', 'Emit schema for the page')
  for (const x of list) {
    if (x.__invalid) add('Structured Data', `${route} renders invalid JSON-LD`, 'High', x.__invalid, 'Fix serialisation')
  }
}

// ---------------------------------------------------------------------------
// 2. Mobile: viewport, horizontal overflow, tap targets
// ---------------------------------------------------------------------------
const MOBILE = { width: 390, height: 844, deviceScaleFactor: 3, mobile: true }
for (const route of ['/', '/format/', '/question-types/', '/question-types/read-aloud/', '/guide/']) {
  await send('Emulation.setDeviceMetricsOverride', MOBILE, sessionId)
  await send('Page.navigate', { url: BASE + route }, sessionId)
  await sleep(1800)

  const overflow = await ev('document.documentElement.scrollWidth - document.documentElement.clientWidth')
  if (overflow > 2) add('Mobile', `${route} scrolls horizontally at 390px`, 'High', `${overflow}px overflow`, 'Constrain the offending element')

  // WCAG 2.2 SC 2.5.8 (Target Size, Minimum) exempts targets that sit inline in
  // a sentence or block of text — padding those would break the typography, and
  // the exception exists precisely for prose links. Visually-hidden elements are
  // also excluded: the skip link is 1px until focused, then jumps to full size,
  // so measuring the unfocused state reports a size a user never has to hit.
  const small = await ev(`
    JSON.stringify([...document.querySelectorAll('a,button,input,select,textarea')]
      .filter(el => el.offsetParent !== null)
      .filter(el => !el.closest('.sr-only'))
      .filter(el => el.tagName !== 'A' || !el.closest('p'))
      .map(el => ({ t: (el.textContent||el.getAttribute('aria-label')||el.type||'').trim().slice(0,30),
                    w: Math.round(el.getBoundingClientRect().width),
                    h: Math.round(el.getBoundingClientRect().height) }))
      .filter(x => x.h > 0 && x.h < 24)
      .slice(0, 6))
  `)
  try {
    const items = JSON.parse(small ?? '[]')
    if (items.length) {
      add('Mobile', `${route} has ${items.length} tap targets under 24px tall`, 'Medium', JSON.stringify(items[0]), 'Increase hit area to at least 24px')
    }
  } catch {}
}

// Tap targets are checked at desktop width too: WCAG 2.5.8 sets a 24px floor
// regardless of viewport, and a desktop nav link sits close enough to the limit
// that a padding change can drop it under.
{
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId)
  for (const route of ['/', '/format/', '/question-types/']) {
    await send('Page.navigate', { url: BASE + route }, sessionId)
    await sleep(1600)
    const small = await ev(`
      JSON.stringify([...document.querySelectorAll('nav a, header button, header a')]
        .filter(el => el.offsetParent !== null)
        .filter(el => !el.closest('.sr-only'))
        .map(el => ({ t: (el.textContent||'').trim().slice(0,26), h: Math.round(el.getBoundingClientRect().height) }))
        .filter(x => x.h > 0 && x.h < 24)
        .slice(0, 5))
    `)
    try {
      const items = JSON.parse(small ?? '[]')
      if (items.length) {
        add('Mobile', `${route} has ${items.length} header targets under 24px tall at desktop width`, 'Medium', JSON.stringify(items[0]), 'Give the link block padding so the hit area clears 24px')
      }
    } catch {}
  }
}

// ---------------------------------------------------------------------------
// 3. Core Web Vitals proxies, measured on a cold cache at a mobile viewport
// ---------------------------------------------------------------------------
await send('Emulation.setDeviceMetricsOverride', MOBILE, sessionId)
await send('Network.setCacheDisabled', { cacheDisabled: true }, sessionId)
await send('Network.emulateNetworkConditions', {
  offline: false,
  latency: 150,
  downloadThroughput: (1.6 * 1024 * 1024) / 8,
  uploadThroughput: (750 * 1024) / 8,
}, sessionId)

for (const route of ['/', '/format/', '/question-types/read-aloud/']) {
  await send('Page.navigate', { url: BASE + route }, sessionId)
  await sleep(500)
  const vitals = await ev(`
    new Promise((resolve) => {
      let lcp = 0, cls = 0
      try {
        new PerformanceObserver((l) => { for (const e of l.getEntries()) lcp = e.startTime }).observe({ type: 'largest-contentful-paint', buffered: true })
        new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) cls += e.value }).observe({ type: 'layout-shift', buffered: true })
      } catch (e) {}
      setTimeout(() => {
        const nav = performance.getEntriesByType('navigation')[0]
        resolve(JSON.stringify({
          lcp: Math.round(lcp),
          cls: Number(cls.toFixed(4)),
          dcl: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
          load: nav ? Math.round(nav.loadEventEnd) : null,
          transfer: nav ? Math.round(nav.transferSize / 1024) : null,
        }))
      }, 2500)
    })
  `)
  let v = {}
  try { v = JSON.parse(vitals ?? '{}') } catch {}
  if (v.lcp > 2500) add('Core Web Vitals', `${route} LCP is ${v.lcp}ms (target < 2500)`, 'High', `LCP ${v.lcp}ms`, 'Reduce render-blocking resources or preload the LCP element')
  if (v.cls > 0.1) add('Core Web Vitals', `${route} CLS is ${v.cls} (target < 0.1)`, 'High', `CLS ${v.cls}`, 'Reserve space for late-loading content')
  if (v.dcl && v.dcl > 2000) add('Speed', `${route} DOMContentLoaded is ${v.dcl}ms (target < 2000)`, 'Medium', `DCL ${v.dcl}ms`, 'Trim the critical path')
}

if (consoleErrors.length) {
  add('Runtime', `${consoleErrors.length} console errors during the crawl`, 'High', consoleErrors.slice(0, 2).join(' | ').slice(0, 160), 'Fix the underlying error')
}

// ---------------------------------------------------------------------------
const byImpact = { Critical: 0, High: 0, Medium: 0, Low: 0 }
for (const f of findings) byImpact[f.impact] = (byImpact[f.impact] ?? 0) + 1

console.log(`\n== Rendered-DOM SEO audit of ${BASE} ==`)
console.log(`\n  ${ROUTES.length} routes rendered, 3 measured for Core Web Vitals`)
console.log(`\n  Findings: ${findings.length}  (critical ${byImpact.Critical}, high ${byImpact.High}, medium ${byImpact.Medium}, low ${byImpact.Low})`)

if (!findings.length) console.log('\n  No issues found.')
for (const f of findings) {
  console.log(`\n  [${f.impact}] ${f.area} — ${f.issue}`)
  console.log(`      evidence: ${f.evidence}`)
  console.log(`      fix:      ${f.fix}`)
}
console.log('')

ws.close()
chrome.kill()
setTimeout(() => {
  try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 3 }) } catch {}
  process.exit(findings.some((f) => f.impact === 'Critical' || f.impact === 'High') ? 1 : 0)
}, 300)