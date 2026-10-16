#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Rendered contrast audit — both themes.
//
// `scripts/contrast.mjs` audits the palette tokens statically, but it cannot
// see what actually renders: translucent surfaces composite over whatever sits
// beneath them, and a utility pair that passes on one card can fail on another
// ground. This script loads every prerendered route in headless Chrome, walks
// the rendered text nodes, composites each foreground through the alpha chain
// of surfaces behind it, and scores the result against WCAG 1.4.3 (4.5 body,
// 3 large) and 1.4.11 (focus visibility).
//
// Both themes are audited because they fail differently. The dark audit caught
// a mint green written for a light ground rendering at 2.95:1 on a dark card —
// a class of bug that only exists once the surfaces are composited. The light
// theme has translucent white bands over two different grounds (the page shell
// and the tinted band), which the token-level check cannot see either.
//
// It also writes full-page screenshots of a sample of routes so a human can
// review the paint, not just the numbers.
//
// Usage:
//   node scripts/contrast-render.mjs [baseUrl]              # both themes
//   node scripts/contrast-render.mjs --theme=light          # one theme
//   node scripts/contrast-render.mjs --no-shots             # audit only
// ---------------------------------------------------------------------------

import { spawn } from 'node:child_process'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { existsSync } from 'node:fs'

const BASE = (process.argv[2] ?? 'http://localhost:5200').replace(/\/+$/, '')
const SHOTS = !process.argv.includes('--no-shots')
const OUT_DIR = path.resolve('design-lab/contrast-render')
const THEME = (() => {
  const hit = process.argv.find((a) => a.startsWith('--theme='))
  const value = hit ? hit.split('=')[1] : 'both'
  return ['light', 'dark', 'both'].includes(value) ? value : 'both'
})()
const THEMES = THEME === 'both' ? ['dark', 'light'] : [THEME]

const CANDIDATES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  process.env.CHROME_PATH,
].filter(Boolean)

const binary = CANDIDATES.find((p) => existsSync(p))
if (!binary) {
  console.error('\n  No Chrome binary found — skipping the contrast render.')
  console.error('  Set CHROME_PATH to run it, or pass --allow-skip to skip.\n')
  if (process.argv.includes('--allow-skip')) {
    process.exit(0)
  }
  process.exit(1)
}

// Same route list as browser-check: every prerendered page. /test and /result
// need a live test in progress and render their shells, so they are excluded.
const QUESTION_TYPE_SLUGS = [
  'read-aloud', 'repeat-sentence', 'describe-image', 'retell-lecture', 'answer-short-question',
  'summarize-group-discussion', 'respond-to-situation', 'summarize-written-text', 'write-essay',
  'fill-in-blanks-dropdown', 'fill-in-blanks-table', 'multiple-choice-single', 'multiple-choice-multiple',
  'reorder-paragraphs', 'summarize-spoken-text', 'fill-in-blanks-listening', 'highlight-correct-summary',
  'listening-multiple-choice-single', 'listening-multiple-choice-multiple', 'select-missing-word',
  'highlight-incorrect-words', 'write-from-dictation',
]

const ROUTES = [
  { path: '/', shot: 'home' },
  { path: '/mock', shot: 'mock-setup' },
  { path: '/practice', shot: 'practice' },
  { path: '/format', shot: null },
  { path: '/scoring', shot: null },
  { path: '/guide', shot: null },
  { path: '/about', shot: null },
  { path: '/dashboard', shot: 'dashboard' },
  // Auth renders muted helper copy on tinted card surfaces, which is where an
  // inverted ink pair hides longest. Both modes share one component but show
  // different copy, so both are walked.
  { path: '/login', shot: null },
  { path: '/register', shot: null },
  { path: '/not-a-page', shot: null },
  { path: '/privacy/', shot: null },
  { path: '/question-types/', shot: 'question-types-hub' },
  // A representative slice of the 22 spokes: prose-heavy, table-heavy, and
  // chart-bearing pages exercise different surfaces.
  { path: '/question-types/read-aloud/', shot: 'qt-read-aloud' },
  { path: '/question-types/reorder-paragraphs/', shot: null },
  { path: '/question-types/describe-image/', shot: 'qt-describe-image' },
  { path: '/question-types/write-essay/', shot: null },
  { path: '/question-types/write-from-dictation/', shot: null },
  ...QUESTION_TYPE_SLUGS
    .filter((s) => !['read-aloud', 'reorder-paragraphs', 'describe-image', 'write-essay', 'write-from-dictation'].includes(s))
    .map((s) => ({ path: `/question-types/${s}/`, shot: null })),
]

// The settings record the pre-paint bootstrap reads. Defaults match
// useSettings.ts; only the theme differs. Reduced motion stays on so nothing is
// sampled mid-transition.
const settingsFor = (theme) =>
  JSON.stringify({
    state: {
      settings: {
        theme, reducedMotion: true, showWordCount: true, speakPrompts: false,
        countdownBeeps: true, textScale: 1, defaultMode: 'full', autoOpenReview: true,
      },
      hydrated: true,
    },
    version: 2,
  })

const profile = await mkdtemp(path.join(tmpdir(), 'pte-contrast-'))
const PORT = 9334

const chrome = spawn(
  binary,
  [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--hide-scrollbars',
    '--window-size=1280,900',
    'about:blank',
  ],
  { stdio: 'ignore' },
)

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function waitForDevTools() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`)
      if (res.ok) return true
    } catch {
      /* not up yet */
    }
    await sleep(250)
  }
  return false
}

if (!(await waitForDevTools())) {
  chrome.kill()
  await rm(profile, { recursive: true, force: true })
  console.error('  Chrome did not expose a debugging port.')
  process.exit(1)
}

const version = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json()
const ws = new WebSocket(version.webSocketDebuggerUrl)
await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve, { once: true })
  ws.addEventListener('error', reject, { once: true })
})

let nextId = 1
const pending = new Map()
ws.addEventListener('message', (event) => {
  const m = JSON.parse(event.data)
  if (m.id && pending.has(m.id)) {
    const p = pending.get(m.id)
    if (m.error) p.reject(new Error(m.error.message))
    else p.resolve(m.result)
  }
})

function send(method, params = {}, sessionId) {
  const id = nextId++
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject })
    ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }))
  })
}

// The in-page audit. Runs after the route has hydrated.
//
// Effective background: the surfaces are translucent in both themes — white
// overlays in dark, tinted white bands in light — so the contrast of a text node
// depends on the full alpha chain behind it. This composites from the farthest
// painted ancestor down to the nearest, over the page ground.
const AUDIT_FN = (theme) => `(() => {
  const out = { fail: [], warn: [], notes: [] }
  const THEME = ${JSON.stringify(theme)}

  function parse(c) {
    const m = c.match(/rgba?\\(([-\\d.]+),\\s*([-\\d.]+),\\s*([-\\d.]+)(?:,\\s*([-\\d.]+))?\\)/)
    if (!m) return null
    return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] }
  }
  function lum(c) {
    const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) }
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b)
  }
  function contrast(f, b) {
    const L1 = lum(f), L2 = lum(b)
    const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1]
    return (hi + 0.05) / (lo + 0.05)
  }
  function effectiveBg(el) {
    const chain = []
    let n = el
    while (n && n.nodeType === 1) {
      const c = parse(getComputedStyle(n).backgroundColor)
      if (c && c.a > 0) chain.push(c)
      if (c && c.a >= 1) break
      n = n.parentElement
    }
    let acc = { ...pageGround(), a: 1 }
    for (let i = chain.length - 1; i >= 0; i--) {
      const c = chain[i]
      acc = {
        r: c.r * c.a + acc.r * (1 - c.a),
        g: c.g * c.a + acc.g * (1 - c.a),
        b: c.b * c.a + acc.b * (1 - c.a),
        a: 1,
      }
    }
    return acc
  }
  // The page ground behind everything translucent. Read from the document rather
  // than hard-coded: the interior routes sit on ink-100 while Home sits on
  // ink-50, and a hard-coded ground would have scored one of them against a
  // colour it is never painted on.
  function pageGround() {
    for (const el of [document.body, document.documentElement]) {
      const c = parse(getComputedStyle(el).backgroundColor)
      if (c && c.a >= 1) return c
    }
    return THEME === 'dark' ? { r: 23, g: 27, b: 32 } : { r: 255, g: 255, b: 255 }
  }
  function sig(el) {
    const parts = []
    let n = el
    while (n && n.nodeType === 1 && parts.length < 4) {
      if (n.id === 'main') { parts.unshift('main'); break }
      let s = n.tagName.toLowerCase()
      if (n.id) s += '#' + n.id
      else if (typeof n.className === 'string' && n.className.trim()) {
        s += '.' + n.className.trim().split(/\\s+/).slice(0, 2).join('.')
      }
      parts.unshift(s)
      n = n.parentElement
    }
    return parts.join('>')
  }
  function bucketKey(color, bg, min) {
    return color + '|' + [bg.r, bg.g, bg.b].map((v) => Math.round(v)).join(',') + '|' + min
  }
  function record(seen, el, fg, bg, cs) {
    const ratio = contrast(fg, bg)
    const size = parseFloat(cs.fontSize)
    const weight = cs.fontWeight === 'bold' || +cs.fontWeight >= 600 ? 700 : 400
    const large = size >= 24 || (size >= 18.66 && weight >= 700)
    const min = large ? 3 : 4.5
    const key = bucketKey(cs.color, bg, min)
    const b = seen.get(key)
    if (b) { b.n++; if (b.samples.length < 3) b.samples.push(sig(el)) }
    else seen.set(key, {
      ratio, min, n: 1, samples: [sig(el)],
      color: cs.color,
      bgCss: 'rgb(' + Math.round(bg.r) + ', ' + Math.round(bg.g) + ', ' + Math.round(bg.b) + ')',
    })
  }

  const seen = new Map()
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(t) {
      if (!t.textContent.trim()) return NodeFilter.FILTER_REJECT
      const p = t.parentElement
      if (!p || p.closest('script,style,noscript')) return NodeFilter.FILTER_REJECT
      return NodeFilter.FILTER_ACCEPT
    },
  })
  for (let node = walk.nextNode(); node; node = walk.nextNode()) {
    const el = node.parentElement
    const cs = getComputedStyle(el)
    if (cs.visibility === 'hidden' || +cs.opacity === 0) continue
    const r = el.getBoundingClientRect()
    if (r.width === 0 && r.height === 0) continue
    // SVG text paints with fill, not color.
    const fg = el.namespaceURI && el.namespaceURI.includes('svg') ? parse(cs.fill) : parse(cs.color)
    if (!fg || fg.a === 0) continue
    record(seen, el, fg, effectiveBg(el), cs)
  }

  // Placeholders: rendered inside inputs whose field surface is translucent,
  // and easy to get wrong because the input itself looks fine.
  for (const el of document.querySelectorAll('input[placeholder], textarea[placeholder]')) {
    const cs = getComputedStyle(el, '::placeholder')
    const fg = parse(cs.color)
    if (!fg || fg.a === 0) continue
    const r = el.getBoundingClientRect()
    if (r.width === 0 && r.height === 0) continue
    record(seen, el, fg, effectiveBg(el), cs)
  }

  const groups = [...seen.values()].sort((a, b) => a.ratio - b.ratio)
  for (const g of groups) {
    const entry = g.color + ' on ' + g.bgCss + ' — ' + g.ratio.toFixed(2) + ':1 (needs ' +
      (g.min === 3 ? '3.0 large' : '4.5') + ') ×' + g.n + ' @ ' + g.samples.join(' | ')
    if (g.ratio < g.min) out.fail.push(entry)
    else if (g.ratio < g.min + 0.5) out.warn.push(entry)
  }

  // Focus visibility (SC 1.4.11): programmatic focus in a fresh page counts as
  // focus-visible, so the ring the keyboard user gets is measurable here.
  const first = document.querySelector('main a[href], main button, a[href]')
  if (first) {
    first.focus()
    const cs = getComputedStyle(first)
    const w = parseFloat(cs.outlineWidth)
    if (cs.outlineStyle === 'none' || w === 0) {
      out.notes.push('focus ring missing on first focusable: ' + sig(first))
    } else {
      const ring = parse(cs.outlineColor)
      if (ring) {
        // The ring is drawn *outside* the element, so it is scored against what
        // surrounds the element rather than against its own fill. Comparing it
        // to the element's background reported the skip link's blue ring as
        // 1.00:1 against its own blue pill, which is a measurement artefact and
        // not a real failure.
        const bg = effectiveBg(first.parentElement || first)
        const ratio = contrast(ring, bg)
        if (ratio < 3) out.notes.push('focus ring below 3:1 (' + ratio.toFixed(2) + ') on ' + sig(first))
      }
    }
    first.blur()
  }

  out.fail = out.fail.slice(0, 10)
  out.warn = out.warn.slice(0, 6)
  return out
})()`

const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
await send('Page.enable', {}, sessionId)
await send('Runtime.enable', {}, sessionId)

async function evaluate(expression) {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true }, sessionId)
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? 'evaluate failed')
  return r.result.value
}

async function navigate(url, waitMs = 1600) {
  await send('Page.navigate', { url }, sessionId)
  await sleep(waitMs)
}

async function setViewport(width, height, mobile) {
  await send('Emulation.setDeviceMetricsOverride', {
    width, height, deviceScaleFactor: mobile ? 2 : 1, mobile,
  }, sessionId)
}

async function screenshot(file) {
  const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true }, sessionId)
  await writeFile(file, Buffer.from(data, 'base64'))
}

// --- run -------------------------------------------------------------------

if (SHOTS) await mkdir(OUT_DIR, { recursive: true })

let failures = 0
const report = [`\n  Rendered contrast audit (WCAG 1.4.3 / 1.4.11) — ${THEMES.join(' + ')}\n`]

for (const theme of THEMES) {
  const themeDir = path.join(OUT_DIR, theme)
  if (SHOTS) await mkdir(themeDir, { recursive: true })

  // Seed the setting once; the pre-paint bootstrap in <head> then applies the
  // class on every subsequent navigation before the first paint. The value is
  // stringified twice on purpose: `settingsFor` returns the JSON text, and this
  // wraps that text as a JS string literal. Interpolating the raw text instead
  // would hand `setItem` an object literal, which it coerces to "[object
  // Object]" — and the app would silently fall back to its default theme.
  await navigate(BASE + '/', 2500)
  await evaluate(`localStorage.setItem('pte-prep-settings', ${JSON.stringify(settingsFor(theme))})`)

  const routeSummary = []
  report.push(`\n  ${theme === 'dark' ? 'Dark' : 'Light'} theme`)

  for (const route of ROUTES) {
    await navigate(BASE + route.path)

    let result
    try {
      result = await evaluate(AUDIT_FN(theme))
    } catch (err) {
      failures++
      routeSummary.push(`  FAIL ${route.path} — audit threw: ${err.message}`)
      continue
    }

    // The bootstrap must actually have painted the theme before this ran. A
    // light run that quietly stayed dark would score the wrong palette.
    const applied = await evaluate(`document.documentElement.classList.contains('dark') === ${theme === 'dark'}`)
    if (!applied) {
      failures++
      routeSummary.push(`  FAIL ${route.path} — the ${theme} theme was not applied on load`)
      continue
    }

    const lines = []
    if (result.fail.length === 0) {
      lines.push(`  ok   ${route.path} — all rendered text clears WCAG in ${theme} mode`)
    } else {
      failures += result.fail.length
      lines.push(`  FAIL ${route.path}`)
      for (const f of result.fail) lines.push(`       ${f}`)
    }
    for (const w of result.warn) lines.push(`  warn ${route.path} — near threshold: ${w}`)
    for (const n of result.notes) lines.push(`  warn ${route.path} — ${n}`)
    routeSummary.push(lines.join('\n'))

    if (SHOTS && route.shot) {
      await setViewport(1280, 900, false)
      await sleep(350)
      await screenshot(path.join(themeDir, `${route.shot}-desktop.png`))
      await setViewport(390, 844, true)
      await sleep(350)
      await screenshot(path.join(themeDir, `${route.shot}-mobile.png`))
      await setViewport(1280, 900, false)
    }
  }

  report.push(routeSummary.join('\n'))
}

console.log(report.join('\n'))

if (SHOTS) {
  console.log(
    `\n  Screenshots written to ${path.relative(process.cwd(), OUT_DIR)}${path.sep}{dark,light}${path.sep}*{desktop,mobile}.png`,
  )
}
console.log('')
process.exit(failures === 0 ? 0 : 1)

// Chrome is torn down by the exit above; keep a handler for the error path.
process.on('exit', () => {
  try {
    chrome.kill()
  } catch {
    /* already gone */
  }
})
