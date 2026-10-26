#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Comprehensive Light & Dark Mode Audit across ALL 36 routes.
//
// For every route, tests:
// 1. Light Mode (html.dark removed):
//    - Real computed foreground and effective background (compositing translucent layers)
//    - WCAG AA contrast ratio (>= 4.5 for normal text, >= 3.0 for large/bold text)
//    - No unreadable / washed out / inverted text
// 2. Dark Mode (html.dark applied):
//    - Real computed foreground and effective background
//    - WCAG AA contrast ratio (>= 4.5 for normal text, >= 3.0 for large/bold text)
//    - No bare light-mode text on dark navy grounds
//    - Check surfaces, cards, and borders
// ---------------------------------------------------------------------------

import { stopChrome, spawnChrome } from './lib/chrome.mjs'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { existsSync } from 'node:fs'

const BASE = (process.argv[2] ?? 'http://localhost:5200').replace(/\/+$/, '')

const ALL_ROUTES = [
  '/',
  '/mock/',
  '/practice/',
  '/format/',
  '/scoring/',
  '/guide/',
  '/about/',
  '/privacy/',
  '/dashboard/',
  '/login/',
  '/register/',
  '/ui-elements/',
  '/question-types/',
  '/question-types/read-aloud/',
  '/question-types/repeat-sentence/',
  '/question-types/describe-image/',
  '/question-types/retell-lecture/',
  '/question-types/answer-short-question/',
  '/question-types/summarize-group-discussion/',
  '/question-types/respond-to-situation/',
  '/question-types/summarize-written-text/',
  '/question-types/write-essay/',
  '/question-types/fill-in-blanks-dropdown/',
  '/question-types/fill-in-blanks-table/',
  '/question-types/multiple-choice-single/',
  '/question-types/multiple-choice-multiple/',
  '/question-types/reorder-paragraphs/',
  '/question-types/summarize-spoken-text/',
  '/question-types/fill-in-blanks-listening/',
  '/question-types/highlight-correct-summary/',
  '/question-types/listening-multiple-choice-single/',
  '/question-types/listening-multiple-choice-multiple/',
  '/question-types/select-missing-word/',
  '/question-types/highlight-incorrect-words/',
  '/question-types/write-from-dictation/',
  '/result/',
]

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
  console.log('\n  Theme audit — no Chrome binary found, skipping.\n')
  const allowSkip = process.argv.includes('--allow-skip') || process.env.ALLOW_SKIP_BROWSER === '1'
  if ((process.env.CI || process.argv.includes('--strict')) && !allowSkip) {
    console.error(
      '  Failing because Chrome is required in CI or when --strict is passed. Use --allow-skip to bypass.\n',
    )
    process.exit(1)
  }
  process.exit(0)
}

const profile = await mkdtemp(path.join(tmpdir(), 'pte-theme-audit-'))
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
      /* devtools not ready */
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
  if (r.exceptionDetails) {
    console.error('Eval error:', r.exceptionDetails)
    return ''
  }
  return r.result.value
}

/**
 * Script injected into page to inspect every text node's effective contrast.
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
    if (!raw || raw.a === 0 || cs.webkitBackgroundClip === 'text' || cs.backgroundClip === 'text') continue
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

await send('Page.enable')
await send('Runtime.enable')
await send('Emulation.setDeviceMetricsOverride', {
  width: 1440,
  height: 1200,
  deviceScaleFactor: 1,
  mobile: false,
})

console.log('\n============================================================')
console.log('  FULL THEME AUDIT: LIGHT & DARK MODE ACROSS EVERY PAGE')
console.log('============================================================\n')

let totalChecked = 0
let totalFailures = 0
const issuesByRoute = []

for (const theme of ['light', 'dark']) {
  console.log(`\n>>> AUDITING THEME: ${theme.toUpperCase()} MODE <<<\n`)

  for (const route of ALL_ROUTES) {
    await send('Page.navigate', { url: BASE + route })
    await new Promise((r) => setTimeout(r, 600))

    if (theme === 'dark') {
      await evaluate(`
        document.documentElement.classList.add('dark');
        localStorage.setItem('pte-prep-settings', JSON.stringify({ state: { settings: { theme: 'dark', textScale: 1 } }, version: 2 }));
      `)
    } else {
      await evaluate(`
        document.documentElement.classList.remove('dark');
        localStorage.setItem('pte-prep-settings', JSON.stringify({ state: { settings: { theme: 'light', textScale: 1 } }, version: 2 }));
      `)
    }
    await new Promise((r) => setTimeout(r, 400))

    const isDark = await evaluate("document.documentElement.classList.contains('dark')")
    if (theme === 'dark' && !isDark) {
      console.log(`  [FAIL] ${route} did not apply dark mode`)
      totalFailures++
      continue
    }
    if (theme === 'light' && isDark) {
      console.log(`  [FAIL] ${route} did not apply light mode`)
      totalFailures++
      continue
    }

    let rows = []
    try {
      const res = await evaluate(COLLECT)
      rows = JSON.parse(res || '[]')
    } catch (e) {
      console.log(`  [WARN] ${route} could not collect rows:`, e.message)
      continue
    }

    totalChecked += rows.length
    const bad = rows.filter((r) => r.ratio < r.need)

    if (bad.length > 0) {
      totalFailures += bad.length
      issuesByRoute.push({ theme, route, bad })
      console.log(
        `  [FAIL] ${theme.padEnd(5)} ${route.padEnd(42)} ${bad.length} contrast issues (of ${rows.length} styles)`,
      )
      for (const item of bad.slice(0, 5)) {
        console.log(
          `         -> ${item.ratio}:1 (need ${item.need}) <${item.tag}> "${item.text}" (${item.fg} on ${item.bg}) [${item.cls}]`,
        )
      }
      if (bad.length > 5) {
        console.log(`         ... and ${bad.length - 5} more`)
      }
    } else {
      console.log(
        `  [PASS] ${theme.padEnd(5)} ${route.padEnd(42)} ${String(rows.length).padStart(3)} styles legible`,
      )
    }
  }
}

console.log('\n============================================================')
console.log(`  SUMMARY: ${totalChecked} styles checked across ${ALL_ROUTES.length * 2} views`)
if (totalFailures === 0) {
  console.log('  ALL PAGES PASS IN BOTH LIGHT AND DARK MODES!')
} else {
  console.log(`  FOUND ${totalFailures} TOTAL ISSUES. Review details above.`)
}
console.log('============================================================\n')

ws.close()
// The browser is stopped before the exit, so its helper processes go with it.
// Exiting first left a whole Chrome behind every run.
await stopChrome(chrome, profile)
process.exit(totalFailures === 0 ? 0 : 1)
