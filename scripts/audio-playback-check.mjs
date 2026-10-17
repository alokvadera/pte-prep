#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Audio playback check.
//
// Loads a listening drill in headless Chrome, presses play, and asserts that
// the clip it asked for is the one that actually came over the wire and that
// playback ran. Nothing else in the repo exercises the listening layer: the
// bank checks confirm the files exist, and browser-check confirms the routes
// hydrate, but neither notices a player that silently degrades to speech
// synthesis or fetches the parent conversation instead of the item's clip.
//
//   node scripts/audio-playback-check.mjs [baseUrl]
//
// Requires a Chrome/Chromium binary; skips cleanly when none is found.
// ---------------------------------------------------------------------------

import { spawn } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { existsSync } from 'node:fs'

const BASE = (process.argv[2] ?? 'http://localhost:5200').replace(/\/+$/, '')
const TYPE = process.argv[3] ?? 'select-missing-word'

// Clip ids are prefixed by the type that produced them; the parent scripts
// (con-*, lec-*) are what the player must never fall back to. Listening Fill in
// Blanks has two entry points, so it carries two prefixes.
const PREFIXES = {
  'select-missing-word': /^smw-/,
  'write-from-dictation': /^wfd-/,
  'highlight-incorrect-words': /^hiw-/,
  'fill-in-blanks-listening': /^(fibl|lfib)-/,
}

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
  console.log('\n  No Chrome binary found — skipping audio playback check.\n')
  process.exit(0)
}

try {
  const res = await fetch(BASE, { method: 'HEAD' })
  if (!res.ok) throw new Error(`status ${res.status}`)
} catch {
  console.error(`\n  No server at ${BASE}. Start one with: npm run serve\n`)
  process.exit(0)
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

const profile = await mkdtemp(path.join(tmpdir(), 'pte-audio-'))
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
    // Media autoplay is normally blocked in headless runs; the player waits for
    // a real click, which this check supplies, but the policy would still deny
    // it without a user gesture recorded for the page.
    '--autoplay-policy=no-user-gesture-required',
    'about:blank',
  ],
  { stdio: 'ignore' },
)

let failures = 0
function report(ok, label, detail = '') {
  if (ok) console.log(`  ok   ${label}`)
  else {
    failures += 1
    console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ''}`)
  }
}

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
let nextId = 1
const pending = new Map()
const collectors = new Set()

ws.addEventListener('message', (event) => {
  const msg = JSON.parse(event.data)
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id)
    pending.delete(msg.id)
    if (msg.error) reject(new Error(msg.error.message))
    else resolve(msg.result)
    return
  }
  if (!msg.method) return
  for (const collect of collectors) collect(msg)
})

await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve, { once: true })
  ws.addEventListener('error', reject, { once: true })
})

function send(method, params = {}, sessionId) {
  const id = nextId++
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject })
    ws.send(JSON.stringify({ id, method, params, sessionId }))
  })
}

async function evaluate(sessionId, expression) {
  const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, sessionId)
  return res.result.value
}

async function waitUntil(sessionId, expression, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await evaluate(sessionId, expression)) return true
    await sleep(250)
  }
  return false
}

console.log(`\n== Audio playback check against ${BASE} (${TYPE}) ==\n`)

const { browserContextId } = await send('Target.createBrowserContext', {})
const { targetId } = await send('Target.createTarget', { url: 'about:blank', browserContextId })
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })

await send('Runtime.enable', {}, sessionId)
await send('Page.enable', {}, sessionId)
await send('Network.enable', {}, sessionId)

const audioResponses = []
const audioFailures = []
collectors.add((msg) => {
  if (msg.method === 'Network.responseReceived') {
    const r = msg.params.response
    if (r.url.includes('/audio/')) audioResponses.push({ url: r.url, status: r.status, type: r.mimeType })
  }
  if (msg.method === 'Network.loadingFailed' && msg.params.type === 'Media') {
    audioFailures.push(msg.params.errorText)
  }
})

await send('Page.navigate', { url: `${BASE}/practice?type=${TYPE}` }, sessionId)
report(
  await waitUntil(sessionId, `location.pathname === '/practice' && !![...document.querySelectorAll('button')].find((b) => /^Start drill/.test(b.textContent ?? ''))`),
  'the practice page offers a drill for this type',
)

await evaluate(
  sessionId,
  `window.__audioInstances = [];
   window.__playErrors = [];
   const origPlay = HTMLAudioElement.prototype.play;
   HTMLAudioElement.prototype.play = function() {
     window.__audioInstances.push(this);
     const res = origPlay.apply(this, arguments);
     if (res && res.catch) {
       res.catch((e) => {
         window.__playErrors.push({ name: e.name, message: e.message });
       });
     }
     return res;
   };`,
)

await evaluate(
  sessionId,
  `[...document.querySelectorAll('button')].find((b) => /^Start drill/.test(b.textContent ?? ''))?.click()`,
)
// A test already in progress asks before it discards; a fresh profile has none,
// but the click must not be swallowed when the dialog does appear.
await waitUntil(sessionId, `!![...document.querySelectorAll('button')].find((b) => /Discard & Start drill/.test(b.textContent ?? ''))`, 2500)
await evaluate(
  sessionId,
  `[...document.querySelectorAll('button')].find((b) => /Discard & Start drill/.test(b.textContent ?? ''))?.click()`,
)

report(
  await waitUntil(sessionId, `location.pathname === '/test'`),
  'starting the drill opens the test runner',
)

// The runner opens on a section briefing; start it to reveal the question.
await waitUntil(sessionId, `!![...document.querySelectorAll('button')].find((b) => /^Begin /i.test((b.textContent ?? '').trim()))`, 5000)
await evaluate(
  sessionId,
  `[...document.querySelectorAll('button')].find((b) => /^Begin /i.test((b.textContent ?? '').trim()))?.click()`,
)

report(
  await waitUntil(sessionId, `[...document.querySelectorAll('button')].some((b) => /^Play/.test((b.textContent ?? '').trim()))`),
  'the listening item offers a play control',
)

// Dispatch a trusted user click on the document to satisfy Chrome's autoplay user activation policy
await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 200, y: 200, button: 'left', clickCount: 1 }, sessionId)
await sleep(50)
await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 200, y: 200, button: 'left', clickCount: 1 }, sessionId)
await sleep(50)

const started = await evaluate(
  sessionId,
  `[...document.querySelectorAll('button')].find((b) => /^Play/.test((b.textContent ?? '').trim()))?.click(), 'clicked'`,
)
report(started === 'clicked', 'play was pressed')

// The player counts down before the audio starts; the SMW lead-in is four
// seconds, so the clip itself is only live a little later.
const live = await waitUntil(sessionId, `(() => { const a = window.__audioInstances?.[0] || document.querySelector('audio'); return a && a.currentTime > 0.3 && !a.paused })()`, 20000)
report(live, 'the clip is actually playing in the page')

await sleep(1500)
const position = await evaluate(sessionId, `(window.__audioInstances?.[0] || document.querySelector('audio'))?.currentTime ?? 0`)
report(position > 1.2, 'playback advanced past the lead-in', `currentTime ${position}`)

const clip = audioResponses.filter((r) => /\.m4a(\?|$)/.test(r.url))
report(clip.length > 0, 'a clip was requested', `${audioResponses.length} audio responses`)
report(
  clip.every((r) => r.status === 200 && /audio\/(mp4|mpeg)/.test(r.type)),
  'every clip came back as playable audio',
  clip.map((r) => `${r.status} ${r.type} ${r.url.split('/').pop()}`).join(', '),
)
report(audioFailures.length === 0, 'no media request failed', audioFailures.join(', '))

const requested = clip.map((r) => decodeURIComponent(r.url.split('/').pop() ?? '').replace(/\.(m4a|mp3)$/, ''))
// The risk this check exists for: a listening item whose own clip does not load
// falls back to the parent conversation, a minute of audio that for Select
// Missing Word speaks the very word the blank asks for. The clip id carries the
// item type, the parent script does not.
const DERIVED = /^(smw|wfd|hiw|fibl|lfib)-/
report(
  requested.some((id) => DERIVED.test(id)),
  "the item's own clip played, not the parent conversation",
  requested.join(', '),
)
const expectedPrefix = PREFIXES[TYPE]
if (expectedPrefix) {
  report(
    requested.every((id) => expectedPrefix.test(id)),
    `every clip belongs to ${TYPE}`,
    requested.join(', '),
  )
}

console.log(`\n  clips requested: ${requested.join(', ') || 'none'}`)
console.log(`\n${failures === 0 ? 'AUDIO PLAYBACK CHECK PASSED' : `${failures} FAILED`}\n`)

chrome.kill()
await sleep(600)
try {
  await rm(profile, { recursive: true, force: true })
} catch {
  /* ignore */
}
process.exit(failures === 0 ? 0 : 1)
