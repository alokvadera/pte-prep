#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Dark-mode lettering and contrast audit.
//
// `scripts/contrast.mjs` checks token pairs on paper. It cannot see what the
// browser actually renders, which is where dark mode had been going wrong:
//
//   - a bare `text-ink-500` with no `dark:` override ships the light-scheme
//     step onto the navy ground, where it lands at 2.40:1;
//   - a hardcoded `#0d1117` panel does not belong to any token in the ramp;
//   - a translucent ground means the "background" behind a run of text is not
//     the colour the class name suggests.
//
// So this drives a real browser, forces the `.dark` class, and reads computed
// styles. For every element with its own text it resolves the *effective*
// background by compositing the translucent ancestor chain down to the opaque
// ground, then checks the real ratio against the WCAG bar for that size.
//
// The display face is Baloo 2 — a heavy, rounded sans whose strokes hold at any
// size on a dark ground, so the thin-stroke/faux-bold lettering checks the
// earlier Instrument Serif face needed no longer apply and are gone.
//
// Usage: node scripts/dark-audit.mjs [baseUrl] [route ...]
// Skips cleanly when no Chrome binary is present, so it is safe in `verify:full`
// on a machine without one.
// ---------------------------------------------------------------------------

import { stopChrome, spawnChrome } from './lib/chrome.mjs'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { existsSync } from 'node:fs'

const BASE = (process.argv[2] ?? 'http://localhost:5200').replace(/\/+$/, '')
const ROUTES = process.argv.slice(3).length
  ? process.argv.slice(3)
  : ['/', '/practice', '/mock', '/dashboard', '/format', '/guide', '/scoring', '/about', '/result']

const CHROME_CANDIDATES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  process.env.CHROME_PATH,
].filter(Boolean)

const bin = CHROME_CANDIDATES.find((p) => existsSync(p))
if (!bin) {
  console.error('\n  Dark audit — no Chrome binary found.')
  console.error('  Set CHROME_PATH to run it, or pass --allow-skip to skip.\n')
  if (process.argv.includes('--allow-skip')) {
    process.exit(0)
  }
  process.exit(1)
}

const profile = await mkdtemp(path.join(tmpdir(), 'pte-dark-audit-'))
const port = 9800 + Math.floor(Math.random() * 150)
const chrome = spawnChrome(bin, [
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
  '--no-first-run',
  'about:blank',
])

async function firstPageTarget() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`)
      const list = await res.json()
      const page = list.find((t) => t.type === 'page')
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl
    } catch {
      /* devtools not up yet */
    }
    await new Promise((r) => setTimeout(r, 150))
  }
  throw new Error('devtools never came up')
}

const ws = new WebSocket(await firstPageTarget())
await new Promise((res, rej) => {
  ws.onopen = res
  ws.onerror = rej
})

let nextId = 0
const pending = new Map()
ws.onmessage = (e) => {
  const msg = JSON.parse(e.data)
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id)
    pending.delete(msg.id)
    if (msg.error) reject(new Error(msg.error.message))
    else resolve(msg.result)
  }
}
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const n = ++nextId
    pending.set(n, { resolve, reject })
    ws.send(JSON.stringify({ id: n, method, params }))
  })

const evaluate = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true })
  if (r.exceptionDetails) return ''
  return r.result.value
}

/**
 * Runs in the page. Returns one record per distinct rendered text style.
 *
 * The background resolution matters: most surfaces here are translucent
 * (`bg-white/[0.035]`, `bg-white/5`), so the colour behind a run of text is a
 * composite of several layers. Compositing down to the first opaque ancestor is
 * the only way to get the number a user actually sees.
 */
const COLLECT = `(() => {
  const parse = (c) => {
    const m = String(c).match(/rgba?\\(([^)]+)\\)/)
    if (!m) return null
    const p = m[1].split(/[,\\s/]+/).filter(Boolean).map(Number)
    if (p.length < 3 || p.some(Number.isNaN)) return null
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }
  }
  const over = (fg, bg) => ({
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  })
  const lum = (c) => {
    const f = (v) => { const s = v / 255; return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4) }
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b)
  }
  const ratio = (a, b) => {
    const l1 = lum(a), l2 = lum(b)
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
  }
  const hex = (c) => '#' + [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')
  const effectiveBg = (el) => {
    const layers = []
    let n = el
    while (n && n !== document.documentElement) {
      const c = parse(getComputedStyle(n).backgroundColor)
      if (c && c.a > 0) { layers.push(c); if (c.a >= 1) break }
      n = n.parentElement
    }
    layers.push(parse(getComputedStyle(document.body).backgroundColor) || { r: 255, g: 255, b: 255, a: 1 })
    let acc = layers.pop()
    while (layers.length) acc = over(layers.pop(), acc)
    return acc
  }
  const out = []
  const seen = new Set()
  for (const el of document.querySelectorAll('body *')) {
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1)
    if (!own) continue
    const cs = getComputedStyle(el)
    if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) continue
    const rect = el.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) continue
    const raw = parse(cs.color)
    if (!raw) continue
    const bg = effectiveBg(el)
    const fg = raw.a < 1 ? over(raw, bg) : raw
    const px = parseFloat(cs.fontSize)
    const weight = Number(cs.fontWeight) || 400
    const large = px >= 24 || (px >= 18.66 && weight >= 700)
    const key = [hex(fg), hex(bg), cs.fontSize, cs.fontWeight, cs.fontFamily].join('|')
    if (seen.has(key)) continue
    seen.add(key)
    out.push({
      text: el.textContent.trim().slice(0, 44),
      fg: hex(fg), bg: hex(bg),
      ratio: Math.round(ratio(fg, bg) * 100) / 100,
      size: px, weight: cs.fontWeight,
      need: large ? 3 : 4.5,
      tag: el.tagName.toLowerCase(),
      cls: typeof el.className === 'string' ? el.className.slice(0, 66) : '',
    })
  }
  return JSON.stringify(out)
})()`

async function settle() {
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 1200,
    deviceScaleFactor: 1,
    mobile: false,
  })
  await send('Page.navigate', { url: BASE })
  await new Promise((r) => setTimeout(r, 1200))
  await evaluate(
    `localStorage.setItem('pte-prep-settings', ${JSON.stringify(
      JSON.stringify({ state: { settings: { theme: 'dark', reducedMotion: false } }, version: 0 }),
    )})`,
  )
}

await send('Page.enable')
await send('Runtime.enable')
await settle()

console.log('\n  Dark-mode audit — computed styles, navy grounds\n')

let failures = 0
let checked = 0

for (const route of ROUTES) {
  await send('Page.navigate', { url: BASE + route })
  await new Promise((r) => setTimeout(r, 2200))

  const isDark = await evaluate("document.documentElement.classList.contains('dark')")
  if (!isDark) {
    console.log(`  ??   ${route} did not apply the dark theme — cannot audit`)
    failures += 1
    continue
  }

  let rows = []
  try {
    rows = JSON.parse((await evaluate(COLLECT)) || '[]')
  } catch {
    console.log(`  ??   ${route} could not be inspected`)
    failures += 1
    continue
  }
  checked += rows.length

  const badContrast = rows.filter((r) => r.ratio < r.need)

  if (!badContrast.length) {
    console.log(`  ok   ${route.padEnd(11)} ${String(rows.length).padStart(3)} text styles legible`)
    continue
  }

  failures += badContrast.length
  console.log(`  --   ${route}`)
  for (const r of badContrast.sort((a, b) => a.ratio - b.ratio)) {
    console.log(
      `    FAIL ${r.ratio.toFixed(2)}:1 (needs ${r.need}) ${r.size}/${r.weight} ${r.fg} on ${r.bg}`,
    )
    console.log(`         <${r.tag}> "${r.text}"`)
    console.log(`         ${r.cls}`)
  }
}

console.log(
  failures === 0
    ? `\n  ${checked} rendered text styles across ${ROUTES.length} routes, 0 problems\n`
    : `\n  ${checked} rendered text styles across ${ROUTES.length} routes, ${failures} problems\n`,
)

ws.close()
// The browser is stopped before the exit, so its helper processes go with it.
// Exiting first left a whole Chrome behind every run.
await stopChrome(chrome, profile)
process.exit(failures === 0 ? 0 : 1)
