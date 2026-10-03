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

import { spawn } from 'node:child_process'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { existsSync } from 'node:fs'

const BASE = (process.argv[2] ?? 'http://localhost:5200').replace(/\/+$/, '')
const OUT_DIR = path.resolve('design-lab/motion-review')

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
  console.log('\n  No Chrome binary found — skipping the motion review.\n')
  process.exit(0)
}

const ROUTES = [
  { path: '/', name: 'home' },
  { path: '/format', name: 'format' },
  { path: '/guide', name: 'guide' },
  { path: '/question-types/', name: 'question-types' },
  { path: '/scoring', name: 'scoring' },
  { path: '/practice', name: 'practice' },
]

const profile = await mkdtemp(path.join(tmpdir(), 'pte-motion-'))
const PORT = 9335
const chrome = spawn(
  binary,
  [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    '--no-first-run',
    '--no-default-browser-check',
    // GPU raster is off in headless; without an explicit frame budget the
    // frame numbers would measure the software rasteriser rather than the CSS.
    '--disable-gpu',
    '--hide-scrollbars',
    '--window-size=1280,900',
    'about:blank',
  ],
  { stdio: 'ignore' },
)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

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
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise }, sessionId)
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? 'evaluate failed')
  return r.result.value
}

const navigate = async (url, waitMs = 1800) => {
  await send('Page.navigate', { url }, sessionId)
  await sleep(waitMs)
}

async function screenshot(file) {
  const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }, sessionId)
  await writeFile(file, Buffer.from(data, 'base64'))
}

async function setReducedMotion(reduce) {
  await send(
    'Emulation.setEmulatedMedia',
    { features: [{ name: 'prefers-reduced-motion', value: reduce ? 'reduce' : 'no-preference' }] },
    sessionId,
  )
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

  // Select every armed element, not only those already carrying data-shown: an
  // element that never reveals never gets the attribute and would be missed.
  const reveals = [...document.querySelectorAll('[data-armed]')]
  const hidden = reveals.filter((el) => el.dataset.shown !== 'true')
  // A hidden element that is on screen right now is invisible content.
  const hiddenOnScreen = hidden.filter((el) => {
    const r = el.getBoundingClientRect()
    return r.bottom > 0 && r.top < innerHeight && r.width > 0
  }).length

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
  const reveals = [...document.querySelectorAll('[data-armed]')]
  const hidden = reveals.filter((el) => el.dataset.shown !== 'true')
  return {
    total: reveals.length,
    stillHidden: hidden.length,
    hiddenTags: hidden.slice(0, 5).map((el) => (el.id ? '#' + el.id : el.className.toString().split(' ')[0])),
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
  const els = [...document.querySelectorAll('[data-armed]')]
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
  return {
    armed,
    heroInvisible: invisibleHero,
    auroraMaxDuration: Math.round(Math.max(0, ...auroraDur) * 1000),
  }
})()`

// --- run -------------------------------------------------------------------

await mkdir(OUT_DIR, { recursive: true })
await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId)

const findings = []
const line = (s) => findings.push(s)

line('\n  Motion review (headless Chrome, 1280×900)\n')

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
  line(`    revealed ${scrolled.total - scrolled.stillHidden}/${scrolled.total}` +
    (revealRatio === 1 ? '' : `  ← ${scrolled.stillHidden} never revealed (${scrolled.hiddenTags.join(', ')})`))
  line(`    tilt stages ${snap.tiltCount} · cards ${snap.cardCount}`)
  line(`    worst reveal lag after entering view ${lag.worstLag}ms`)
  line(`    frame gaps  p50 ${frames.p50}ms · p95 ${frames.p95}ms · max ${frames.max}ms · long(>32ms) ${frames.long}`)
  if (snap.aurora.length) {
    line(`    aurora opacity ${snap.aurora[0].opacity} · blur ${snap.aurora[0].blur} · drift dur ${snap.aurora[0].dur}`)
  }

  if (stuck) findings.push(`    FAIL  ${route.path}: ${scrolled.stillHidden} elements stayed hidden after a full scroll`)
  if (snap.hiddenOnScreen && snap.hiddenOnScreen > 0) {
    findings.push(`    NOTE  ${route.path}: ${snap.hiddenOnScreen} armed-but-hidden elements on screen at rest`)
  }
  if (frames.p95 > 24) findings.push(`    NOTE  ${route.path}: p95 frame gap ${frames.p95}ms (above a 24ms budget)`)
  if (frames.long > 4) findings.push(`    NOTE  ${route.path}: ${frames.long} frames over 32ms while scrolling`)
  if (lag.worstLag > 500) {
    findings.push(`    NOTE  ${route.path}: a card waited ${lag.worstLag}ms after entering view (stagger is index-based)`)
  }
}

// --- tilt response ---------------------------------------------------------

await navigate(BASE + '/guide', 2200)
// `scroll-behavior: smooth` makes scrollIntoView animate, so the rect has to be
// read after the scroll has come to rest, not in the same turn.
await evaluate(`(() => { document.documentElement.style.scrollBehavior = 'auto'; const el = document.querySelector('.tilt'); if (el) el.scrollIntoView({ block: 'center' }); return 1 })()`)
await sleep(500)
const tiltBox = await evaluate(`(() => {
  const el = document.querySelector('.tilt')
  if (!el) return null
  const r = el.getBoundingClientRect()
  const x = Math.round(r.left + r.width / 2)
  const y = Math.round(r.top + r.height / 2)
  const hit = document.elementFromPoint(x, y)
  return { x, y, covered: hit ? el.contains(hit) || hit === el : false }
})()`)

if (tiltBox) {
  // Two moves: the first establishes the pointer inside the element, which is
  // what some engines require before they emit a pointermove.
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: tiltBox.x, y: tiltBox.y }, sessionId)
  await sleep(80)
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: tiltBox.x - 55, y: tiltBox.y - 35 }, sessionId)
  await sleep(180)
  const leaning = await evaluate(`document.querySelector('.tilt').style.getPropertyValue('--tilt-y')`)
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 4, y: 4 }, sessionId)
  await sleep(260)
  const rested = await evaluate(`document.querySelector('.tilt').style.getPropertyValue('--tilt-y')`)
  line(`\n  tilt: pointer hit ${tiltBox.covered ? 'yes' : 'NO'} · lean ${leaning.trim() || '(unset)'} → rest ${rested.trim() || '(unset)'}`)
  if (!leaning.trim() || leaning.trim() === '0deg') findings.push('    FAIL  tilt did not respond to a pointer move')
  if (rested.trim() && rested.trim() !== '0deg') findings.push(`    NOTE  tilt did not reset (${rested.trim()})`)
}

// --- reduced motion --------------------------------------------------------

await setReducedMotion(true)
await navigate(BASE + '/', 2200)
const reduced = await evaluate(REDUCED_PROBE)
line(`\n  reduced motion: armed=${reduced.armed} · hero invisible=${reduced.heroInvisible} · aurora dur=${reduced.auroraMaxDuration}ms`)
if (reduced.armed !== 0) findings.push('    FAIL  reveals still armed under prefers-reduced-motion')
if (reduced.heroInvisible > 0) findings.push(`    FAIL  ${reduced.heroInvisible} hero items not fully opaque under reduced motion`)
await screenshot(path.join(OUT_DIR, 'home-reduced-motion.png'))
await setReducedMotion(false)

console.log(findings.join('\n'))
console.log(`\n  Screenshots written to ${path.relative(process.cwd(), OUT_DIR)}${path.sep}*.png\n`)

chrome.kill()
await sleep(300)
await rm(profile, { recursive: true, force: true }).catch(() => {})
