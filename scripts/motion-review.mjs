#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Motion review.
//
// The unit suite proves the motion layer is wired correctly; it cannot show
// whether the motion is *good*. This script answers the questions that only a
// real engine can:
//
//   1. Coverage  — does every revealed card actually reveal, or does one stay
//                  stuck at opacity 0 (invisible content)?
//   2. Timing    — what is the real entrance window and per-group stagger?
//   3. Frame health — does scrolling the heavy pages drop frames?
//   4. Reduced motion — with the preference set, is all content simply there
//                  and nothing animating?
//   5. Tilt      — does a pointer move lean a card, and does leaving reset it?
//
// It also writes viewport screenshots to design-lab/motion-review/ so a human
// can do the part a script cannot: judge whether it looks right.
//
// Usage: node scripts/motion-review.mjs [baseUrl]
// ---------------------------------------------------------------------------

import { stopChrome, spawnChrome } from './lib/chrome.mjs'
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import zlib from 'node:zlib'
import path from 'node:path'
import { existsSync, readFileSync } from 'node:fs'

// Usage: node scripts/motion-review.mjs [baseUrl] [--width=390] [--height=844]
//
// The viewport is a flag because the motion that matters on a phone is different:
// a sticky header, taller cards and a longer scroll mean fewer items are on
// screen at once, and a reveal that settles in 600ms on a desktop can still be
// running when the next one is scrolled to.
const args = process.argv.slice(2)
const numericFlag = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`))
  const value = hit ? Number(hit.split('=')[1]) : NaN
  return Number.isFinite(value) && value > 0 ? value : fallback
}
const BASE = (args.find((a) => !a.startsWith('--')) ?? 'http://localhost:5200').replace(/\/+$/, '')
const WIDTH = numericFlag('width', 1280)
const HEIGHT = numericFlag('height', 900)
const MOBILE = WIDTH < 700
const OUT_DIR = path.resolve(
  MOBILE ? 'design-lab/motion-review/mobile' : 'design-lab/motion-review',
)

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
  console.error('\n  No Chrome binary found — skipping the motion review.')
  console.error('  Set CHROME_PATH to run, or pass --allow-skip to skip.\n')
  if (process.argv.includes('--allow-skip')) {
    process.exit(0)
  }
  process.exit(1)
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Wait for the server rather than assuming it is up. Without this the first
// route can be fetched before the static server is listening, and the review
// reports confident findings about a page that was never rendered.
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

const ROUTES = [
  { path: '/', name: 'home' },
  { path: '/format', name: 'format' },
  { path: '/guide', name: 'guide' },
  { path: '/question-types/', name: 'question-types' },
  { path: '/scoring', name: 'scoring' },
  { path: '/practice', name: 'practice' },
]

/**
 * The lean budget, read from the component's own default. A reviewer that
 * hard-codes its own copy of a tuning constant starts describing a site that no
 * longer exists, so this one cannot drift.
 */
const TILT_TRAVEL = Number(
  readFileSync('src/components/ui/motion.tsx', 'utf8').match(/travel = (\d+)/)?.[1] ?? 26,
)

const profile = await mkdtemp(path.join(tmpdir(), 'pte-motion-'))
const PORT = 9335
const chrome = spawnChrome(binary, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`,
  '--no-first-run',
  '--no-default-browser-check',
  // GPU raster is off in headless; without an explicit frame budget the
  // frame numbers would measure the software rasteriser rather than the CSS.
  '--disable-gpu',
  '--hide-scrollbars',
  `--window-size=${WIDTH},${HEIGHT}`,
  'about:blank',
])

async function waitForDevTools() {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) return true
    } catch {
      /* not up yet */
    }
    await sleep(250)
  }
  return false
}

if (!(await waitForDevTools())) {
  await stopChrome(chrome, profile)
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
  if (!m.id || !pending.has(m.id)) return
  const p = pending.get(m.id)
  if (m.error) p.reject(new Error(m.error.message))
  else p.resolve(m.result)
})

function send(method, params = {}, sessionId) {
  const id = nextId++
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject })
    ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }))
  })
}

const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
await send('Page.enable', {}, sessionId)
await send('Runtime.enable', {}, sessionId)

async function evaluate(expression, awaitPromise = false) {
  const r = await send(
    'Runtime.evaluate',
    { expression, returnByValue: true, awaitPromise },
    sessionId,
  )
  if (r.exceptionDetails)
    throw new Error(r.exceptionDetails.exception?.description ?? 'evaluate failed')
  return r.result.value
}

const navigate = async (url, waitMs = 1800) => {
  await send('Page.navigate', { url }, sessionId)
  await sleep(waitMs)
}

async function screenshot(file) {
  const { data } = await send(
    'Page.captureScreenshot',
    { format: 'png', captureBeyondViewport: false },
    sessionId,
  )
  await writeFile(file, Buffer.from(data, 'base64'))
}

async function setReducedMotion(reduce) {
  await send(
    'Emulation.setEmulatedMedia',
    { features: [{ name: 'prefers-reduced-motion', value: reduce ? 'reduce' : 'no-preference' }] },
    sessionId,
  )
}

// --- pixels ----------------------------------------------------------------
//
// The hero is the one place where two expressive layers stack: the drifting
// aurora behind, the animated gradient title in front. Neither the token
// contrast audit nor the computed styles can say whether the result is still
// legible, so the hero is measured from the rendered pixels.

/** Minimal decoder for the 8-bit RGB/RGBA PNGs CDP returns. */
function decodePng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG')
  let off = 8
  let width = 0
  let height = 0
  let bitDepth = 0
  let colorType = 0
  const idat = []
  while (off < buf.length) {
    const len = buf.readUInt32BE(off)
    const type = buf.toString('ascii', off + 4, off + 8)
    const data = buf.subarray(off + 8, off + 8 + len)
    if (type === 'IHDR') {
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      bitDepth = data[8]
      colorType = data[9]
    } else if (type === 'IDAT') idat.push(data)
    else if (type === 'IEND') break
    off += 12 + len
  }
  if (bitDepth !== 8 || (colorType !== 6 && colorType !== 2)) {
    throw new Error(`unsupported PNG (${bitDepth}-bit, colour type ${colorType})`)
  }
  const bpp = colorType === 6 ? 4 : 3
  const raw = zlib.inflateSync(Buffer.concat(idat))
  const stride = width * bpp
  const out = Buffer.alloc(width * height * bpp)
  let pos = 0
  for (let y = 0; y < height; y++) {
    const filter = raw[pos++]
    const line = raw.subarray(pos, pos + stride)
    pos += stride
    const o = y * stride
    const prev = o - stride
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? out[o + x - bpp] : 0
      const b = y > 0 ? out[prev + x] : 0
      const c = x >= bpp && y > 0 ? out[prev + x - bpp] : 0
      let v = line[x]
      if (filter === 1) v = (v + a) & 255
      else if (filter === 2) v = (v + b) & 255
      else if (filter === 3) v = (v + ((a + b) >> 1)) & 255
      else if (filter === 4) {
        const p = a + b - c
        const pa = Math.abs(p - a)
        const pb = Math.abs(p - b)
        const pc = Math.abs(p - c)
        const pr = pa <= pb && pa <= pc ? a : pb <= pc ? b : c
        v = (v + pr) & 255
      }
      out[o + x] = v
    }
  }
  return { width, height, bpp, data: out }
}

const relLum = (r, g, b) => {
  const f = (c) => {
    const s = c / 255
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}

/**
 * Contrast of each glyph pixel against its own local background.
 *
 * `fg` is the render, `bg` the same frame with the text hidden. Subtracting the
 * two per pixel gives the true background under every glyph — necessary because
 * the aurora makes the backdrop non-uniform, so no single "background colour"
 * can be sampled from the box.
 */
function glyphContrast(fg, bg, box) {
  const W = box.x1 - box.x0
  const H = box.y1 - box.y0
  if (W <= 2 || H <= 2)
    return { min: Infinity, below3: 0, below45: 0, glyphs: 0, fgWorst: null, bgWorst: null }

  const dist = new Int32Array(W * H)
  const lum = new Float64Array(W * H)
  const bgLum = new Float64Array(W * H)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = ((box.y0 + y) * fg.width + (box.x0 + x)) * fg.bpp
      const fr = fg.data[i]
      const fgc = fg.data[i + 1]
      const fb = fg.data[i + 2]
      dist[y * W + x] = Math.max(
        Math.abs(fr - bg.data[i]),
        Math.abs(fgc - bg.data[i + 1]),
        Math.abs(fb - bg.data[i + 2]),
      )
      lum[y * W + x] = relLum(fr, fgc, fb)
      bgLum[y * W + x] = relLum(bg.data[i], bg.data[i + 1], bg.data[i + 2])
    }
  }

  let min = Infinity
  let below3 = 0
  let below45 = 0
  let glyphs = 0
  let fgWorst = null
  let bgWorst = null
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const k = y * W + x
      const d = dist[k]
      if (d <= 60) continue
      // Keep only stroke cores: pixels whose colour-distance from the backdrop is
      // a local maximum. An antialiased edge is a blend of glyph and backdrop and
      // would otherwise be scored as if it were the text's own colour.
      let isCore = true
      for (let dy = -1; dy <= 1 && isCore; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue
          if (dist[(y + dy) * W + (x + dx)] > d) {
            isCore = false
            break
          }
        }
      }
      if (!isCore) continue
      glyphs++
      const lf = lum[k]
      const lb = bgLum[k]
      const ratio = (Math.max(lf, lb) + 0.05) / (Math.min(lf, lb) + 0.05)
      if (ratio < min) {
        min = ratio
        const i = ((box.y0 + y) * fg.width + (box.x0 + x)) * fg.bpp
        fgWorst = `rgb(${fg.data[i]},${fg.data[i + 1]},${fg.data[i + 2]})`
        bgWorst = `rgb(${bg.data[i]},${bg.data[i + 1]},${bg.data[i + 2]})`
      }
      if (ratio < 3) below3++
      if (ratio < 4.5) below45++
    }
  }
  return { min, below3, below45, glyphs, fgWorst, bgWorst }
}

/**
 * How much colour the aurora actually contributes to the hero pixels.
 *
 * `opacity: 0.34` through a 72px blur is not 34% of anything measurable, so the
 * only honest reading of "is the aurora doing enough to be worth its cost?" is
 * the delta it puts into the rendered frame. Returns mean and p95 channel
 * difference, in 0–255 levels, over the given box.
 */
function pixelDelta(a, b, box) {
  const deltas = []
  for (let y = box.y0; y < box.y1; y += 2) {
    for (let x = box.x0; x < box.x1; x += 2) {
      const i = (y * a.width + x) * a.bpp
      const d = Math.max(
        Math.abs(a.data[i] - b.data[i]),
        Math.abs(a.data[i + 1] - b.data[i + 1]),
        Math.abs(a.data[i + 2] - b.data[i + 2]),
      )
      deltas.push(d)
    }
  }
  if (!deltas.length) return { mean: 0, p95: 0, max: 0 }
  deltas.sort((x, y) => x - y)
  const sum = deltas.reduce((s, d) => s + d, 0)
  return {
    mean: +(sum / deltas.length).toFixed(1),
    p95: deltas[Math.floor(deltas.length * 0.95)],
    max: deltas[deltas.length - 1],
  }
}

async function shootPng() {
  const { data } = await send(
    'Page.captureScreenshot',
    { format: 'png', captureBeyondViewport: false },
    sessionId,
  )
  return decodePng(Buffer.from(data, 'base64'))
}

// --- probes ----------------------------------------------------------------

/** Static picture of the motion layer on the current route. */
const SNAPSHOT = `(() => {
  const hero = [...document.querySelectorAll('.animate-rise-in')]
  const heroWindow = hero.reduce((max, el) => {
    const cs = getComputedStyle(el)
    const delay = parseFloat(cs.animationDelay) || 0
    const dur = parseFloat(cs.animationDuration) || 0
    return Math.max(max, delay + dur)
  }, 0)

  // Every *Reveal* element, not only those already carrying data-shown: one that
  // never reveals never gets the attribute and would otherwise be missed. The
  // tagline rule also sets data-armed but resolves through data-revealed, so it
  // is excluded.
  const reveals = [...document.querySelectorAll('[data-armed]:not([data-reveal-rule])')]
  const hidden = reveals.filter((el) => el.dataset.shown !== 'true')
  // A hidden element that is on screen right now is invisible content.
  // The observer only fires once an element is 8% past the bottom edge, so
  // "on screen" here has to mean the same thing or the bottom band reads as
  // invisible content when it is simply not meant to have revealed yet.
  const hiddenOnScreenEls = hidden.filter((el) => {
    const r = el.getBoundingClientRect()
    if (!r.width || !r.height) return false
    // Match what the observer itself requires: at least a tenth of the element
    // inside a root shortened by 8% at the bottom. A looser test flags a card
    // resting in the bottom band that is simply not meant to have revealed yet.
    const visible = Math.min(innerHeight * 0.92, r.bottom) - Math.max(0, r.top)
    return visible > 0 && visible / r.height >= 0.1
  })
  const hiddenOnScreen = hiddenOnScreenEls.length

  const aurora = [...document.querySelectorAll('.hero-aurora span')].map((el) => {
    const cs = getComputedStyle(el)
    return { opacity: cs.opacity, blur: cs.filter, anim: cs.animationName, dur: cs.animationDuration }
  })

  const durations = {}
  for (const el of reveals) {
    const d = getComputedStyle(el).transitionDuration
    durations[d] = (durations[d] || 0) + 1
  }

  return {
    heroWindow: Math.round(heroWindow * 1000),
    heroCount: hero.length,
    revealCount: reveals.length,
    hiddenCount: hidden.length,
    hiddenOnScreen,
    hiddenOnScreenTags: hiddenOnScreenEls.slice(0, 4).map((el) => {
      const r = el.getBoundingClientRect()
      return el.tagName.toLowerCase() + ' top' + Math.round(r.top) + ' h' + Math.round(r.height)
    }),
    aurora,
    tiltCount: document.querySelectorAll('.tilt').length,
    durations,
    cardCount: document.querySelectorAll('main .card, main .card-solid, main .card-exam').length,
  }
})()`

/** Scrolls the whole page, then reports how much of it is still unrevealed. */
const SCROLL_AND_SETTLE = `(async () => {
  const H = document.documentElement.scrollHeight
  const step = Math.max(240, Math.ceil(H / 30))
  for (let y = 0; y <= H; y += step) {
    window.scrollTo(0, y)
    await new Promise((r) => setTimeout(r, 90))
  }
  window.scrollTo(0, H)
  await new Promise((r) => setTimeout(r, 1400))
  const reveals = [...document.querySelectorAll('[data-armed]:not([data-reveal-rule])')]
  const hidden = reveals.filter((el) => el.dataset.shown !== 'true')
  return {
    total: reveals.length,
    stillHidden: hidden.length,
    hiddenTags: hidden.slice(0, 6).map((el) => {
      const r = el.getBoundingClientRect()
      const cls = (typeof el.className === 'string' ? el.className : '').split(' ').filter(Boolean)[0] || ''
      return el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (cls ? '.' + cls : '') +
        ' ' + Math.round(r.width) + 'x' + Math.round(r.height) + ' top' + Math.round(r.top)
    }),
  }
})()`

/**
 * How long an element waits between entering the viewport and becoming visible.
 *
 * This is the number an index-based stagger gets wrong: on a long page each
 * element enters view on its own, so a delay derived from its absolute index
 * makes late items appear long after they have been scrolled to.
 */
const REVEAL_LAG = `(async () => {
  document.documentElement.style.scrollBehavior = 'auto'
  window.scrollTo(0, 0)
  await new Promise((r) => setTimeout(r, 700))
  const els = [...document.querySelectorAll('[data-armed]:not([data-reveal-rule])')]
  const seen = new Map()
  const iv = setInterval(() => {
    const t = performance.now()
    for (const el of els) {
      let s = seen.get(el)
      if (!s) { s = { entered: null, shown: null }; seen.set(el, s) }
      const r = el.getBoundingClientRect()
      if (r.bottom > 0 && r.top < innerHeight && s.entered === null) s.entered = t
      if (el.dataset.shown === 'true' && s.shown === null) s.shown = t
    }
  }, 40)
  const H = document.documentElement.scrollHeight
  for (let y = 0; y <= H; y += 220) {
    window.scrollTo(0, y)
    await new Promise((r) => setTimeout(r, 55))
  }
  await new Promise((r) => setTimeout(r, 1800))
  clearInterval(iv)
  let worst = 0
  let worstEl = ''
  for (const [el, s] of seen) {
    if (s.entered === null || s.shown === null) continue
    const lag = s.shown - s.entered
    if (lag > worst) {
      worst = lag
      worstEl = el.id || String(el.className).split(' ')[0]
    }
  }
  return { count: seen.size, worstLag: Math.round(worst), worstEl }
})()`

/** Frame intervals while scrolling from top to bottom. */
const SCROLL_FRAMES = `(async () => {
  const gaps = []
  let last = performance.now()
  let stop = false
  const tick = (t) => { gaps.push(t - last); last = t; if (!stop) requestAnimationFrame(tick) }
  requestAnimationFrame(tick)
  const H = document.documentElement.scrollHeight
  const step = Math.max(300, Math.ceil(H / 28))
  for (let y = 0; y <= H; y += step) {
    window.scrollTo(0, y)
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
  }
  await new Promise((r) => setTimeout(r, 250))
  stop = true
  gaps.shift()
  const sorted = [...gaps].sort((a, b) => a - b)
  const at = (p) => Math.round((sorted[Math.floor(sorted.length * p)] ?? 0) * 10) / 10
  return {
    frames: gaps.length,
    long: gaps.filter((g) => g > 32).length,
    p50: at(0.5),
    p95: at(0.95),
    max: Math.round(Math.max(0, ...gaps) * 10) / 10,
  }
})()`

/** Reduced-motion contract: nothing armed, everything visible. */
const REDUCED_PROBE = `(() => {
  const armed = document.querySelectorAll('[data-armed]').length
  const hero = [...document.querySelectorAll('.animate-rise-in')]
  const invisibleHero = hero.filter((el) => +getComputedStyle(el).opacity < 1).length
  // The aurora keeps its animation name but its duration collapses to ~0.
  const auroraDur = [...document.querySelectorAll('.hero-aurora span')]
    .map((el) => parseFloat(getComputedStyle(el).animationDuration) || 0)

  // What the entrance actually resolves to. The point of the reduced-motion
  // layer is that an arrival still happens — as a fade. This reads the real
  // computed animation rather than trusting the stylesheet.
  const route = document.querySelector('.route-enter')
  const routeCs = route ? getComputedStyle(route) : null

  // Nothing anywhere may still be travelling: any running animation whose
  // keyframes mention transform is a movement this preference asked to stop.
  const moving = [...document.querySelectorAll('body *')].filter((el) => {
    const cs = getComputedStyle(el)
    if (parseFloat(cs.animationDuration) > 0.02 && cs.animationName !== 'none') {
      for (const sheet of document.styleSheets) {
        let rules
        try { rules = sheet.cssRules } catch { continue }
        for (const rule of rules) {
          if (rule.type === CSSRule.KEYFRAMES_RULE && rule.name === cs.animationName) {
            if (rule.cssText.includes('transform') || rule.cssText.includes('translate')) return true
          }
        }
      }
    }
    return false
  })

  const btn = document.querySelector('a.btn-primary, button.btn-primary')
  const btnCs = btn ? getComputedStyle(btn) : null

  return {
    armed,
    heroInvisible: invisibleHero,
    auroraMaxDuration: Math.round(Math.max(0, ...auroraDur) * 1000),
    routeName: routeCs ? routeCs.animationName : '(no route-enter element)',
    routeDuration: routeCs ? Math.round(parseFloat(routeCs.animationDuration) * 1000) : 0,
    movingCount: moving.length,
    buttonTransitionProperty: btnCs ? btnCs.transitionProperty : '',
    buttonTransitionMs: btnCs ? Math.round(parseFloat(btnCs.transitionDuration) * 1000) : 0,
  }
})()`

// --- run -------------------------------------------------------------------

await mkdir(OUT_DIR, { recursive: true })
await send(
  'Emulation.setDeviceMetricsOverride',
  { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: MOBILE },
  sessionId,
)

const findings = []
const line = (s) => findings.push(s)

line(`\n  Motion review (headless Chrome, ${WIDTH}×${HEIGHT}${MOBILE ? ', mobile' : ''})\n`)

for (const route of ROUTES) {
  await evaluate('window.scrollTo(0,0); 1')
  await navigate(BASE + route.path, 2200)

  const snap = await evaluate(SNAPSHOT)
  // Lag must be measured on the first, fresh pass: once SCROLL_AND_SETTLE has
  // run, every element is already `shown` and the probe would read zero.
  const lag = await evaluate(REVEAL_LAG, true)
  const scrolled = await evaluate(SCROLL_AND_SETTLE, true)
  const frames = await evaluate(SCROLL_FRAMES, true)

  await evaluate('window.scrollTo(0,0); 1')
  await sleep(900)
  await screenshot(path.join(OUT_DIR, `${route.name}-top.png`))

  const revealRatio = scrolled.total ? (scrolled.total - scrolled.stillHidden) / scrolled.total : 1
  const stuck = scrolled.stillHidden > 0

  line(`  ${route.path}`)
  line(`    entrance window ${snap.heroWindow}ms · hero items ${snap.heroCount}`)
  line(
    `    revealed ${scrolled.total - scrolled.stillHidden}/${scrolled.total}` +
      (revealRatio === 1
        ? ''
        : `  ← ${scrolled.stillHidden} never revealed (${scrolled.hiddenTags.join(', ')})`),
  )
  line(`    tilt stages ${snap.tiltCount} · cards ${snap.cardCount}`)
  line(`    worst reveal lag after entering view ${lag.worstLag}ms`)
  line(
    `    frame gaps  p50 ${frames.p50}ms · p95 ${frames.p95}ms · max ${frames.max}ms · long(>32ms) ${frames.long}`,
  )
  if (snap.aurora.length) {
    line(
      `    aurora opacity ${snap.aurora[0].opacity} · blur ${snap.aurora[0].blur} · drift dur ${snap.aurora[0].dur}`,
    )
  }

  if (stuck)
    findings.push(
      `    FAIL  ${route.path}: ${scrolled.stillHidden} elements stayed hidden after a full scroll`,
    )
  if (snap.hiddenOnScreen && snap.hiddenOnScreen > 0) {
    findings.push(
      `    NOTE  ${route.path}: ${snap.hiddenOnScreen} armed-but-hidden on screen at rest (${snap.hiddenOnScreenTags.join(', ')})`,
    )
  }
  if (frames.p95 > 24)
    findings.push(`    NOTE  ${route.path}: p95 frame gap ${frames.p95}ms (above a 24ms budget)`)
  if (frames.long > 4)
    findings.push(`    NOTE  ${route.path}: ${frames.long} frames over 32ms while scrolling`)
  if (lag.worstLag > 500) {
    findings.push(
      `    NOTE  ${route.path}: a card waited ${lag.worstLag}ms after entering view (stagger is index-based)`,
    )
  }
}

// --- hero legibility over the aurora ---------------------------------------

await navigate(BASE + '/', 2200)
for (const theme of ['light', 'dark']) {
  await evaluate(`document.documentElement.classList.toggle('dark', ${theme === 'dark'}); 1`)
  await sleep(500)
  const box = await evaluate(`(() => {
    const h = document.querySelector('main h1')
    if (!h) return null
    const r = h.getBoundingClientRect()
    return { x0: Math.max(0, Math.round(r.left)), y0: Math.max(0, Math.round(r.top)),
             x1: Math.min(${WIDTH}, Math.round(r.right)), y1: Math.min(${HEIGHT}, Math.round(r.bottom)) }
  })()`)
  if (!box) continue
  // Freeze every animation first. The aurora drifts and the title gradient pans,
  // so two frames taken even 120ms apart differ all over the hero — and every
  // moved background pixel would read as a glyph at roughly 1:1.
  await evaluate(`(() => {
    const s = document.createElement('style')
    s.id = 'motion-freeze'
    s.textContent = '*,*::before,*::after{animation:none !important;transition:none !important}'
    document.head.appendChild(s)
    return 1
  })()`)
  await sleep(80)
  const withText = await shootPng()
  await evaluate(
    "document.querySelector('main h1').style.color = 'transparent'; document.querySelectorAll('main h1 *').forEach(e => { e.style.color = 'transparent'; e.style.webkitTextFillColor = 'transparent'; }); 1",
  )
  await sleep(80)
  const withoutText = await shootPng()
  await evaluate(
    "document.querySelector('main h1').style.color = ''; document.querySelectorAll('main h1 *').forEach(e => { e.style.color = ''; e.style.webkitTextFillColor = ''; }); document.getElementById('motion-freeze')?.remove(); 1",
  )

  const c = glyphContrast(withText, withoutText, box)
  const label = c.min === Infinity ? 'n/a' : c.min.toFixed(2) + ':1'
  line(
    `\n  hero title over aurora (${theme}): worst core-glyph contrast ${label} ` +
      `· ${c.below3} px under 3 (large) · ${c.below45} px under 4.5 · ${c.glyphs} core px` +
      (c.fgWorst ? ` · worst ${c.fgWorst} on ${c.bgWorst}` : ''),
  )
  if (c.min < 3)
    findings.push(`    FAIL  hero title contrast ${label} in ${theme} theme (large text needs 3.0)`)
  else if (c.min < 3.6)
    findings.push(
      `    NOTE  hero title contrast ${label} in ${theme} theme is close to the 3.0 floor`,
    )
  await screenshot(path.join(OUT_DIR, `hero-${theme}.png`))
}
await evaluate("document.documentElement.classList.remove('dark'); 1")

// --- aurora strength ------------------------------------------------------

await navigate(BASE + '/', 2000)
for (const theme of ['light', 'dark']) {
  await evaluate(`document.documentElement.classList.toggle('dark', ${theme === 'dark'}); 1`)
  await sleep(400)
  const box = await evaluate(`(() => {
    const el = document.querySelector('.hero-aurora')
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { x0: Math.max(0, Math.round(r.left)), y0: Math.max(0, Math.round(r.top)),
             x1: Math.min(${WIDTH}, Math.round(r.right)), y1: Math.min(${HEIGHT}, Math.round(r.bottom)) }
  })()`)
  if (!box) continue
  // Freeze first: a drifting blob would differ between the two frames and every
  // moved pixel would be counted as aurora.
  await evaluate(`(() => {
    const s = document.createElement('style')
    s.id = 'motion-freeze'
    s.textContent = '*,*::before,*::after{animation:none !important;transition:none !important}'
    document.head.appendChild(s)
    return 1
  })()`)
  await sleep(80)
  const withAurora = await shootPng()
  await evaluate("document.querySelector('.hero-aurora').style.visibility = 'hidden'; 1")
  await sleep(80)
  const withoutAurora = await shootPng()
  await evaluate(
    "document.querySelector('.hero-aurora').style.visibility = ''; document.getElementById('motion-freeze')?.remove(); 1",
  )
  const d = pixelDelta(withAurora, withoutAurora, box)
  line(
    `\n  aurora contribution (${theme}): mean ${d.mean} · p95 ${d.p95} · max ${d.max} levels of 255`,
  )
  if (d.mean < 3)
    findings.push(
      `    NOTE  the aurora is nearly invisible in the ${theme} theme (mean ${d.mean}/255)`,
    )
  if (d.mean > 16)
    findings.push(
      `    NOTE  the aurora is heavy in the ${theme} theme (mean ${d.mean}/255) — competes with the headline`,
    )
}
await evaluate("document.documentElement.classList.remove('dark'); 1")

// --- tilt response ---------------------------------------------------------

await navigate(BASE + '/guide', 2200)
// `scroll-behavior: smooth` makes scrollIntoView animate, so the rect has to be
// read after the scroll has come to rest, not in the same turn.
await evaluate(
  `(() => { document.documentElement.style.scrollBehavior = 'auto'; const el = document.querySelector('.tilt'); if (el) el.scrollIntoView({ block: 'center' }); return 1 })()`,
)
await sleep(500)
const tiltBox = await evaluate(`(() => {
  const el = document.querySelector('.tilt')
  if (!el) return null
  const r = el.getBoundingClientRect()
  const x = Math.round(r.left + r.width / 2)
  const y = Math.round(r.top + r.height / 2)
  const hit = document.elementFromPoint(x, y)
  return { x, y, left: Math.round(r.left), top: Math.round(r.top),
           right: Math.round(r.right), w: Math.round(r.width), h: Math.round(r.height),
           covered: hit ? el.contains(hit) || hit === el : false }
})()`)

if (tiltBox) {
  // Two moves: the first establishes the pointer inside the element, which is
  // what some engines require before they emit a pointermove. The second goes
  // for the corner — lean is proportional to the distance from centre, so a
  // hit near the middle reads ~0deg and would say nothing about intensity.
  await send(
    'Input.dispatchMouseEvent',
    { type: 'mouseMoved', x: tiltBox.x, y: tiltBox.y },
    sessionId,
  )
  await sleep(80)
  await send(
    'Input.dispatchMouseEvent',
    {
      type: 'mouseMoved',
      x: tiltBox.right - (tiltBox.w > 260 ? 14 : 6),
      y: tiltBox.top + (tiltBox.h > 180 ? 14 : 6),
    },
    sessionId,
  )
  await sleep(220)
  const lean = await evaluate(`(() => {
    const el = document.querySelector('.tilt')
    const s = el.style
    return { x: s.getPropertyValue('--tilt-x').trim(), y: s.getPropertyValue('--tilt-y').trim(),
             gx: s.getPropertyValue('--tilt-gx').trim(), gy: s.getPropertyValue('--tilt-gy').trim() }
  })()`)
  // How far the far edge actually travels: half the width times the sine of the
  // lean. This is the number that makes two different surface sizes comparable,
  // and the one the component's `travel` budget bounds.
  const degrees = Math.abs(parseFloat(lean.y) || 0)
  const shiftEstimate = Math.round((tiltBox.w / 2) * Math.sin((degrees * Math.PI) / 180))
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 4, y: 4 }, sessionId)
  await sleep(300)
  const rested = await evaluate(
    `document.querySelector('.tilt').style.getPropertyValue('--tilt-y').trim()`,
  )
  line(`\n  tilt: pointer hit ${tiltBox.covered ? 'yes' : 'NO'} · stage ${tiltBox.w}x${tiltBox.h}`)
  line(
    `    lean x ${lean.x || '(unset)'} · y ${lean.y || '(unset)'} · glare at ${lean.gx || '-'} ${lean.gy || '-'}`,
  )
  line(
    `    edge travel ${shiftEstimate}px at ${degrees.toFixed(2)}deg · rest ${rested || '(unset)'}`,
  )
  if (!lean.y || lean.y === '0deg')
    findings.push('    FAIL  tilt did not respond to a pointer move')
  if (shiftEstimate < 6) {
    findings.push(
      `    NOTE  tilt moves the edge only ${shiftEstimate}px — too slight to read as a lean`,
    )
  } else if (shiftEstimate > 30) {
    findings.push(
      `    NOTE  tilt moves the edge ${shiftEstimate}px — far enough to disturb reading`,
    )
  }
  if (rested && rested !== '0deg') findings.push(`    NOTE  tilt did not reset (${rested})`)
}

// Every stage on the page, sized by the rule the component applies: the lean is
// capped so the outer edge travels about TILT_TRAVEL pixels, whatever surface
// it is. The value itself is read from the component, not copied here.
const stages = await evaluate(
  `(() => [...document.querySelectorAll('.tilt')].map((el) => Math.round(el.getBoundingClientRect().width)))()`,
)
if (stages.length) {
  const perStage = stages.map((w) => {
    const half = w / 2
    const byTravel =
      half > TILT_TRAVEL ? (2 * Math.asin(TILT_TRAVEL / half) * 180) / Math.PI : Infinity
    const deg = Math.min(8, byTravel) / 2
    return { w, deg: +deg.toFixed(2), px: Math.round(half * Math.sin((deg * Math.PI) / 180)) }
  })
  line(
    `\n  tilt stages by width: ` +
      perStage.map((s) => `${s.w}px → ${s.deg}deg / ${s.px}px`).join(' · '),
  )
  const undersized = perStage.filter((s) => s.px < 6)
  if (undersized.length) {
    findings.push(`    NOTE  ${undersized.length} tilt stage(s) lean under 6px at the edge`)
  }
}

// --- expressive layer intensities ------------------------------------------
//
// The tokens say what each effect asked for; only the engine can say what it
// resolved. These are the tuning surface — the aurora's strength, how far the
// title gradient travels, and how long the count-up takes to arrive.

await navigate(BASE + '/', 2400)
const intensity = await evaluate(
  `(async () => {
  const raf = () => new Promise((r) => requestAnimationFrame(r))
  const aurora = [...document.querySelectorAll('.hero-aurora span')].map((el) => {
    const s = getComputedStyle(el)
    return { opacity: +s.opacity, blur: Math.round(parseFloat(String(s.filter).match(/[\\d.]+/)?.[0] ?? '0')),
             dur: parseFloat(s.animationDuration) }
  })
  const t = document.querySelector('.text-gradient-move')
  const ts = t ? getComputedStyle(t) : null
  const title = ts ? { dur: parseFloat(ts.animationDuration), size: ts.backgroundSize,
                        clip: ts.webkitBackgroundClip || ts.backgroundClip } : null

  // Count-up: bring the figure into view, then sample its digits until they stop.
  const figure = document.querySelector('[data-countup]')
  let firstText = null
  let lastText = null
  let ramp = null
  if (figure) {
    figure.scrollIntoView({ block: 'center' })
    let last = figure.textContent
    let firstChange = null
    let lastChange = null
    const until = performance.now() + 4000
    while (performance.now() < until) {
      await raf()
      const now = performance.now()
      const text = figure.textContent
      if (text !== last) {
        if (firstChange === null) { firstChange = now; firstText = text }
        lastChange = now
        lastText = text
        last = text
      } else if (lastChange !== null && now - lastChange > 260) break
    }
    ramp = firstChange === null ? null : Math.round(lastChange - firstChange)
  }
  return { aurora, title, ramp, firstText, lastText, hasFigure: !!figure }
})()`,
  true,
)

if (intensity.aurora.length) {
  const opacities = [...new Set(intensity.aurora.map((a) => a.opacity))].join('/')
  line(
    `\n  aurora: ${intensity.aurora.length} blobs · opacity ${opacities} · blur ${intensity.aurora[0].blur}px ` +
      `· drift ${intensity.aurora.map((a) => a.dur + 's').join('/')}`,
  )
}
if (intensity.title) {
  line(
    `  hero gradient title: pan ${intensity.title.dur}s · background-size ${intensity.title.size} · clip ${intensity.title.clip}`,
  )
  if (intensity.title.clip !== 'text')
    findings.push('    FAIL  the hero gradient title is not clipped to text')
  if (intensity.title.dur < 5)
    findings.push(
      `    NOTE  the title gradient pans in ${intensity.title.dur}s — fast enough to read as a loop`,
    )
}
if (intensity.hasFigure) {
  line(
    `  count-up ramp ${intensity.ramp === null ? 'did not run (already at value)' : intensity.ramp + 'ms'}` +
      (intensity.firstText ? ` · ${intensity.firstText} → ${intensity.lastText}` : ''),
  )
  if (intensity.ramp !== null && intensity.ramp > 2200) {
    findings.push(
      `    NOTE  count-up takes ${intensity.ramp}ms to arrive — that reads as waiting, not motion`,
    )
  }
}

// --- reduced motion --------------------------------------------------------

await setReducedMotion(true)
await navigate(BASE + '/', 2200)
const reduced = await evaluate(REDUCED_PROBE)
line(
  `\n  reduced motion: armed=${reduced.armed} · hero invisible=${reduced.heroInvisible} · aurora dur=${reduced.auroraMaxDuration}ms`,
)
line(
  `    route enter -> ${reduced.routeName} ${reduced.routeDuration}ms · elements still moving ${reduced.movingCount}`,
)
line(
  `    button transition ${reduced.buttonTransitionMs}ms on [${reduced.buttonTransitionProperty}]`,
)
if (reduced.armed !== 0) findings.push('    FAIL  reveals still armed under prefers-reduced-motion')
if (reduced.heroInvisible > 0)
  findings.push(
    `    FAIL  ${reduced.heroInvisible} hero items not fully opaque under reduced motion`,
  )
if (reduced.movingCount > 0) {
  findings.push(
    `    FAIL  ${reduced.movingCount} element(s) still animate a transform under prefers-reduced-motion`,
  )
}
if (reduced.routeName !== 'fade-in') {
  findings.push(
    `    NOTE  the route entrance is ${reduced.routeName} under reduced motion (expected the opacity-only fade-in)`,
  )
}
if (/translate|transform|all/.test(reduced.buttonTransitionProperty)) {
  findings.push(
    `    FAIL  buttons still transition geometry under reduced motion: ${reduced.buttonTransitionProperty}`,
  )
}
await screenshot(path.join(OUT_DIR, 'home-reduced-motion.png'))
await setReducedMotion(false)

console.log(findings.join('\n'))
console.log(`\n  Screenshots written to ${path.relative(process.cwd(), OUT_DIR)}${path.sep}*.png\n`)

await stopChrome(chrome, profile)
