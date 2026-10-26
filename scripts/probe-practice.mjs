// One-off probe: on /practice in dark mode, list elements whose computed
// colour is ink-500, with tag, full class list and effective background.
import { stopChrome, spawnChrome } from './lib/chrome.mjs'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { existsSync } from 'node:fs'

const BASE = 'http://localhost:5200'
const CANDIDATES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  process.env.CHROME_PATH,
].filter(Boolean)
const binary = CANDIDATES.find((p) => existsSync(p))
if (!binary) {
  console.error('no chrome')
  process.exit(1)
}

const profile = await mkdtemp(path.join(tmpdir(), 'pte-probe-'))
const chrome = spawnChrome(binary, [
  '--headless=new',
  '--remote-debugging-port=9339',
  `--user-data-dir=${profile}`,
  '--no-first-run',
  '--disable-gpu',
  'about:blank',
])

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
for (let i = 0; i < 60; i++) {
  try {
    const r = await fetch('http://127.0.0.1:9339/json/version')
    if (r.ok) break
  } catch {}
  await sleep(250)
}
const version = await (await fetch('http://127.0.0.1:9339/json/version')).json()
const ws = new WebSocket(version.webSocketDebuggerUrl)
await new Promise((res, rej) => {
  ws.addEventListener('open', res, { once: true })
  ws.addEventListener('error', rej, { once: true })
})
let nextId = 1
const pending = new Map()
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data)
  if (m.id && pending.has(m.id)) {
    const p = pending.get(m.id)
    pending.delete(m.id)
    if (m.error) p.reject(new Error(m.error.message))
    else p.resolve(m.result)
  }
})
const send = (method, params = {}, sessionId) =>
  new Promise((resolve, reject) => {
    const id = nextId++
    pending.set(id, { resolve, reject })
    ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }))
  })

const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
await send('Page.enable', {}, sessionId)
await send('Runtime.enable', {}, sessionId)
await send('Page.navigate', { url: BASE + '/' }, sessionId)
await sleep(2000)
await send(
  'Runtime.evaluate',
  {
    expression: `localStorage.setItem('pte-prep-settings', JSON.stringify({ state: { settings: { theme: 'dark', reducedMotion: true, showWordCount: true, speakPrompts: false, countdownBeeps: true, textScale: 1, defaultMode: 'full', autoOpenReview: true }, hydrated: true }, version: 2 }))`,
  },
  sessionId,
)
await send('Page.navigate', { url: BASE + '/practice' }, sessionId)
await sleep(2200)

const r = await send(
  'Runtime.evaluate',
  {
    expression: `(() => {
    const rows = []
    for (const el of document.querySelectorAll('th,td')) {
      const cs = getComputedStyle(el)
      if (cs.color !== 'rgb(96, 107, 122)') continue
      rows.push({ tag: el.tagName, cls: el.className, darkOnHtml: document.documentElement.classList.contains('dark'), text: el.textContent.slice(0, 30) })
      if (rows.length >= 8) break
    }
    // also check the first th specifically
    const th = document.querySelector('th')
    return JSON.stringify({
      dark: document.documentElement.classList.contains('dark'),
      thColor: th ? getComputedStyle(th).color : null,
      thClass: th ? th.className : null,
      ink500: rows,
    }, null, 2)
  })()`,
    returnByValue: true,
  },
  sessionId,
)
console.log(r.result.value)
await stopChrome(chrome, profile)
