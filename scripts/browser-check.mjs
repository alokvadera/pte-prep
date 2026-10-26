#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Browser smoke test.
//
// Loads every prerendered route in headless Chrome, records console errors and
// failed requests, and asserts that React hydrated rather than re-rendering the
// empty shell. Catches the class of bug that a static HTML dump cannot:
// hydration mismatches and client-side exceptions.
//
// Usage: node scripts/browser-check.mjs [baseUrl]
// Requires a Chrome/Chromium binary; skips cleanly when none is found.
// ---------------------------------------------------------------------------

import { execSync } from 'node:child_process'
import { stopChrome, spawnChrome } from './lib/chrome.mjs'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { existsSync } from 'node:fs'

const BASE = (process.argv[2] ?? 'http://localhost:5200').replace(/\/+$/, '')

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
  console.log('\n  No Chrome binary found — skipping browser checks.')
  console.log('  Set CHROME_PATH to run them.\n')
  const allowSkip = process.argv.includes('--allow-skip') || process.env.ALLOW_SKIP_BROWSER === '1'
  if ((process.env.CI || process.argv.includes('--strict')) && !allowSkip) {
    console.error(
      '  Failing because Chrome is required in CI or when --strict is passed. Use --allow-skip to bypass.\n',
    )
    process.exit(1)
  }
  process.exit(0)
}

const QUESTION_TYPE_SLUGS = execSync('npx tsx scripts/print-type-slugs.ts', { encoding: 'utf8' })
  .split('\n')
  .map((s) => s.trim())
  .filter(Boolean)

const ALL_ROUTES = [
  '/',
  '/mock',
  '/practice',
  '/format',
  '/scoring',
  '/guide',
  '/about',
  '/dashboard',
  '/not-a-page',
  '/question-types/',
  '/privacy/',
  '/login/',
  '/register/',
  '/ui-elements/',
  ...QUESTION_TYPE_SLUGS.map((s) => `/question-types/${s}/`),
]
// `PTE_ROUTES=/,/mock` narrows the run to a subset, for a quick look at one
// page while iterating. The default is every route.
const ROUTE_FILTER = (process.env.PTE_ROUTES ?? '')
  .split(',')
  .map((r) => r.trim())
  .filter(Boolean)
const ROUTES =
  ROUTE_FILTER.length > 0 ? ALL_ROUTES.filter((r) => ROUTE_FILTER.includes(r)) : ALL_ROUTES

const profile = await mkdtemp(path.join(tmpdir(), 'pte-chrome-'))
const PORT = 9333

const chrome = spawnChrome(binary, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-gpu',
  '--hide-scrollbars',
  '--window-size=1280,900',
  '--blink-settings=primaryPointerType=4,primaryHoverType=2,availablePointerTypes=4,availableHoverTypes=2',
  'about:blank',
])

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function waitForDevTools() {
  for (let i = 0; i < 120; i++) {
    if (chrome.exitCode !== null) {
      console.error(`  Chrome exited prematurely with code ${chrome.exitCode}`)
      return false
    }
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
  await stopChrome(chrome, profile)
  console.error('  Chrome did not expose a debugging port.')
  process.exit(1)
}

let failures = 0
function report(ok, label, detail = '') {
  if (ok) {
    console.log(`  ok   ${label}`)
  } else {
    failures += 1
    console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ''}`)
  }
}

// Minimal CDP client over the browser websocket.
const version = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json()
const ws = new WebSocket(version.webSocketDebuggerUrl)
let nextId = 1
const pending = new Map()
const events = []

// One listener for the lifetime of the socket; per-route collectors subscribe
// through `collectors` so the listener count never grows.
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
  events.push(msg)
  for (const collect of collectors) collect(msg)
})

await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve, { once: true })
  ws.addEventListener('error', reject, { once: true })
})

/** Polls an expression until it is truthy, or the timeout expires. */
async function waitUntil(sessionId, expression, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const probe = await send('Runtime.evaluate', { expression, returnByValue: true }, sessionId)
    if (probe.result.value) return true
    await sleep(200)
  }
  return false
}

function send(method, params = {}, sessionId) {
  const id = nextId++
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject })
    ws.send(JSON.stringify({ id, method, params, sessionId }))
  })
}

console.log(`\n== Browser check against ${BASE} ==\n`)

// Wait for the server instead of assuming it is listening. Two Chrome suites
// running back to back used to race the static server's startup and report
// confident failures against pages that were never rendered.
{
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
}

// Each route gets a fresh browser context so that a service worker installed by
// an earlier route cannot influence the next one.
for (const route of ROUTES) {
  const { browserContextId } = await send('Target.createBrowserContext', {})
  const { targetId } = await send('Target.createTarget', { url: 'about:blank', browserContextId })
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })

  const consoleErrors = []
  const pageErrors = []
  const failedRequests = []

  await send('Runtime.enable', {}, sessionId)
  await send('Log.enable', {}, sessionId)
  await send('Network.enable', {}, sessionId)
  // Never let a stale build be tested against a previous one.
  await send('Page.enable', {}, sessionId)
  await send(
    'Page.addScriptToEvaluateOnNewDocument',
    {
      source: `window.addEventListener('securitypolicyviolation', (e) => {
        console.error('CSP violation: ' + e.effectiveDirective + ' blocked ' + e.blockedURI);
      });`,
    },
    sessionId,
  )

  const collect = (msg) => {
    if (msg.sessionId !== sessionId) return
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      consoleErrors.push(msg.params.args.map((a) => a.value ?? a.description ?? '').join(' '))
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      pageErrors.push(
        msg.params.exceptionDetails?.exception?.description ??
          msg.params.exceptionDetails?.text ??
          'unknown',
      )
    }
    if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') {
      consoleErrors.push(msg.params.entry.text)
    }
    if (msg.method === 'Network.loadingFailed') {
      failedRequests.push(msg.params.errorText)
    }
  }
  collectors.add(collect)

  await send('Page.navigate', { url: `${BASE}${route}` }, sessionId)

  // Wait for the document to finish and the app to actually paint, rather than
  // guessing with a fixed delay.
  const deadline = Date.now() + 30000
  let ready = false
  while (Date.now() < deadline) {
    const probe = await send(
      'Runtime.evaluate',
      {
        expression: `(() => { const r = document.getElementById('root'); return JSON.stringify({ s: document.readyState, n: r ? r.querySelectorAll('*').length : 0, hydrated: document.documentElement.dataset.appReady === 'true' }); })()`,
        returnByValue: true,
      },
      sessionId,
    )
    try {
      const { s: state, n, hydrated } = JSON.parse(probe.result.value)
      if (state === 'complete' && n > 0 && hydrated) {
        ready = true
        break
      }
    } catch {
      /* still loading */
    }
    await sleep(200)
  }
  // Give hydration a moment to finish and surface any error.
  await sleep(700)
  if (!ready) console.log(`  (warn) ${route} did not finish loading within 30s`)

  const result = await send(
    'Runtime.evaluate',
    {
      expression: `(() => {
        const root = document.getElementById('root');
        return JSON.stringify({
          nodes: root ? root.querySelectorAll('*').length : 0,
          title: document.title,
          h1: document.querySelector('h1')?.textContent?.trim() ?? '',
          canonical: document.querySelector('link[rel=canonical]')?.getAttribute('href') ?? '',
          description: document.querySelector('meta[name=description]')?.getAttribute('content') ?? '',
          jsonLd: document.querySelectorAll('script[type="application/ld+json"]').length,
          interactive: document.querySelectorAll('a[href], button, input, select, textarea').length,
          currentNav: [...document.querySelectorAll('header.site-header nav a[aria-current]')]
            .map((a) => ({ label: a.textContent.trim(), current: a.getAttribute('aria-current') })),
          // A section band escapes the page shell with a negative margin, which
          // is only safe while the shell is centred — assert the rendered
          // geometry rather than trusting the arithmetic.
          overflowX: document.documentElement.scrollWidth - window.innerWidth,
          bands: document.querySelectorAll('.band, .band-plain, .band-flush, .band-flush-plain').length,
          bandOvershoot: [...document.querySelectorAll('.band, .band-plain')].some((b) => {
            const r = b.getBoundingClientRect()
            return r.left < -1 || r.right > window.innerWidth + 1
          }),
          // A band whose ground never resolved would read as a stray hairline.
          bandGroundOk: [...document.querySelectorAll('.band, .band-flush')].every((b) => {
            const cs = getComputedStyle(b)
            const bg = cs.backgroundColor
            const clear = !bg || bg === 'transparent' || bg.endsWith(', 0)')
            return cs.backgroundImage !== 'none' || !clear
          }),
          callouts: document.querySelectorAll('.callout, .callout-rule').length,
          // Structure, which a component refactor silently breaks: a heading
          // level skipped, an aria-labelledby pointing at nothing, an in-page
          // link to a target that was renamed.
          headingSkips: (() => {
            const levels = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')]
              .filter((h) => h.getClientRects().length > 0)
              .map((h) => Number(h.tagName[1]))
            const skips = []
            for (let i = 1; i < levels.length; i++) {
              if (levels[i] - levels[i - 1] > 1) skips.push(levels[i - 1] + '→' + levels[i])
            }
            return skips
          })(),
          danglingLabels: [...document.querySelectorAll('[aria-labelledby]')]
            // Split on a literal space rather than a whitespace class: this
            // expression lives inside a template literal, where the backslash of
            // an escape is consumed before the browser ever sees it.
            .flatMap((el) => (el.getAttribute('aria-labelledby') || '').split(' '))
            .filter((id) => id && !document.getElementById(id)),
          danglingAnchors: [...document.querySelectorAll('a[href^="#"]')]
            .map((a) => (a.getAttribute('href') || '').slice(1))
            .filter((id) => id && !document.getElementById(id)),
          // The route transition is the one animation every navigation runs, so
          // its weight is asserted rather than eyeballed: it has to resolve to
          // the shared keyframe inside a sane band, not to nothing and not to
          // something slow enough to delay the page.
          routeEnter: (() => {
            const el = document.querySelector('.route-enter')
            if (!el) return null
            const cs = getComputedStyle(el)
            return {
              name: cs.animationName,
              ms: Math.round(parseFloat(cs.animationDuration) * 1000),
            }
          })(),
        });
      })()`,
      returnByValue: true,
    },
    sessionId,
  )

  const data = JSON.parse(result.result.value)

  const hydrationWarning = consoleErrors.find((e) =>
    /hydrat|did not match|Text content does not match/i.test(e),
  )
  const realErrors = consoleErrors.filter(
    (e) =>
      !/favicon|Download the React DevTools/i.test(e) &&
      // A 404 on the document itself is the correct response for an unknown route.
      !(route.startsWith('/not-') && /status of 404/i.test(e)),
  )
  const label = route === '/' ? '/' : route

  report(
    data.nodes > 40,
    `${label.padEnd(14)} rendered (${data.nodes} nodes, ${data.interactive} interactive)`,
  )
  report(data.h1.length > 0, `${label.padEnd(14)} has an h1`, data.h1 || 'none')
  report(data.title.length > 10, `${label.padEnd(14)} has a title`, data.title)
  report(data.description.length > 40, `${label.padEnd(14)} has a meta description`)
  report(data.canonical.length > 0, `${label.padEnd(14)} has a canonical`, data.canonical)
  const expectedNav = route.startsWith('/question-types/')
    ? 'Test format'
    : {
        '/mock': 'Mock test',
        '/practice': 'Practice',
        '/format': 'Test format',
        '/dashboard': 'Progress',
      }[route]
  if (expectedNav) {
    report(
      data.currentNav.some((n) => n.label === expectedNav),
      `${label.padEnd(14)} marks its current nav section`,
      JSON.stringify(data.currentNav),
    )
  }
  report(
    data.overflowX <= 1,
    `${label.padEnd(14)} does not scroll sideways`,
    `overflows by ${data.overflowX}px`,
  )
  report(!data.bandOvershoot, `${label.padEnd(14)} bands span the shell without overshooting`)
  report(data.bandGroundOk, `${label.padEnd(14)} band grounds resolve`)
  report(
    data.callouts <= 3,
    `${label.padEnd(14)} uses at most three tinted callouts`,
    `${data.callouts}`,
  )
  report(
    data.headingSkips.length === 0,
    `${label.padEnd(14)} skips no heading level`,
    data.headingSkips.join(' '),
  )
  report(
    data.danglingLabels.length === 0,
    `${label.padEnd(14)} aria-labelledby all resolve`,
    data.danglingLabels.join(' '),
  )
  report(
    data.danglingAnchors.length === 0,
    `${label.padEnd(14)} in-page links resolve`,
    data.danglingAnchors.join(' '),
  )
  report(
    data.routeEnter === null ||
      (data.routeEnter.name === 'route-enter' &&
        data.routeEnter.ms >= 200 &&
        data.routeEnter.ms <= 400),
    `${label.padEnd(14)} route transition is the shared one, weighted right`,
    data.routeEnter ? `${data.routeEnter.name} ${data.routeEnter.ms}ms` : 'no route-enter element',
  )
  report(!hydrationWarning, `${label.padEnd(14)} hydrates without mismatch`, hydrationWarning ?? '')
  report(
    pageErrors.length === 0,
    `${label.padEnd(14)} has no uncaught exceptions`,
    pageErrors.join(' | '),
  )
  const cspViolations = consoleErrors.filter((e) => /CSP violation/i.test(e))
  report(
    cspViolations.length === 0,
    `${label.padEnd(14)} has no CSP violations`,
    cspViolations.join(' | '),
  )
  report(
    realErrors.length === 0,
    `${label.padEnd(14)} has no console errors`,
    realErrors.join(' | ').slice(0, 160),
  )
  const expectedStatus = route.startsWith('/not-') ? 404 : 200
  report(
    failedRequests.filter(
      (e) => !/ERR_ABORTED|favicon/.test(e) && !(expectedStatus === 404 && /404/.test(e)),
    ).length === 0,
    `${label.padEnd(14)} loads all assets`,
    failedRequests.join(' | ').slice(0, 160),
  )

  collectors.delete(collect)
  await send('Target.closeTarget', { targetId })
  await send('Target.disposeBrowserContext', { browserContextId })
}

// ---------------------------------------------------------------------------
// Reduced motion
//
// A visitor who has asked for reduced motion is a different browser from the
// one the server rendered for. The server has no media query, so the first
// render has to use the server's answer and apply the real preference
// afterwards. Reading the preference during render instead gives a
// reduced-motion visitor different markup from the server's, which breaks
// hydration on the prerendered pages.
//
// Every other check in this file runs as a visitor with no preference, so
// without this one that whole class of bug is invisible.
// ---------------------------------------------------------------------------
{
  const { browserContextId } = await send('Target.createBrowserContext', {})
  const { targetId } = await send('Target.createTarget', { url: 'about:blank', browserContextId })
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })

  const reducedErrors = []
  const collectReduced = (msg) => {
    if (msg.sessionId !== sessionId) return
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      reducedErrors.push(msg.params.args.map((a) => a.value ?? a.description ?? '').join(' '))
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      reducedErrors.push(msg.params.exceptionDetails?.exception?.description ?? 'unknown')
    }
  }
  collectors.add(collectReduced)

  await send('Runtime.enable', {}, sessionId)
  await send('Page.enable', {}, sessionId)
  await send(
    'Emulation.setEmulatedMedia',
    { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] },
    sessionId,
  )
  await send('Page.navigate', { url: `${BASE}/` }, sessionId)
  await waitUntil(sessionId, `document.documentElement.dataset.appReady === 'true'`)
  await sleep(800)

  // React 19 reports a text-content mismatch as minified error #418, which
  // says nothing about hydration. The number is the signal.
  const reducedHydration = reducedErrors.find((e) =>
    /hydrat|did not match|Text content does not match|React error #418/i.test(e),
  )
  report(!reducedHydration, 'reduced motion hydrates without mismatch', reducedHydration ?? '')
  report(
    reducedErrors.length === 0,
    'reduced motion throws nothing',
    reducedErrors.join(' | ').slice(0, 200),
  )

  collectors.delete(collectReduced)
  await send('Target.closeTarget', { targetId })
  await send('Target.disposeBrowserContext', { browserContextId })
}

// Client-side navigation check: the router must work without a full page load.
{
  const { browserContextId } = await send('Target.createBrowserContext', {})
  const { targetId } = await send('Target.createTarget', { url: `${BASE}/`, browserContextId })
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
  await send('Page.enable', {}, sessionId)
  await send('Runtime.enable', {}, sessionId)
  await send('Network.enable', {}, sessionId)
  await send('Network.setCacheDisabled', { cacheDisabled: true }, sessionId)

  // Wait for hydration to complete and the link to exist, rather than guessing
  // with a fixed delay: the whole site is now one eagerly-imported bundle.
  const navReady = Date.now() + 15000
  while (Date.now() < navReady) {
    const probe = await send(
      'Runtime.evaluate',
      {
        expression: `document.documentElement.dataset.appReady === 'true' && document.querySelectorAll('a[href="/format"]').length > 0`,
        returnByValue: true,
      },
      sessionId,
    )
    if (probe.result.value) break
    await sleep(200)
  }

  const errors = []
  const navCollect = (msg) => {
    if (msg.sessionId !== sessionId) return
    if (msg.method === 'Runtime.exceptionThrown') {
      errors.push(msg.params.exceptionDetails?.exception?.description ?? 'unknown')
    }
  }
  collectors.add(navCollect)

  // Click the internal link to the format guide, the way a user would.
  const clicked = await send(
    'Runtime.evaluate',
    {
      expression: `(() => {
        const link = [...document.querySelectorAll('a[href="/format"]')][0];
        if (!link) return 'no-link';
        link.scrollIntoView();
        link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window, button: 0 }));
        return 'clicked';
      })()`,
      returnByValue: true,
    },
    sessionId,
  )
  if (clicked.result.value !== 'clicked') {
    report(false, 'the format link is present in the page', clicked.result.value)
  }

  const navDeadline2 = Date.now() + 6000
  let navigated = false
  while (Date.now() < navDeadline2) {
    const probe = await send(
      'Runtime.evaluate',
      { expression: `location.pathname`, returnByValue: true },
      sessionId,
    )
    if (probe.result.value === '/format') {
      navigated = true
      break
    }
    await sleep(150)
  }
  await sleep(400)

  const nav = await send(
    'Runtime.evaluate',
    {
      expression: `JSON.stringify({ url: location.pathname, h1: document.querySelector('h1')?.textContent?.trim() ?? '', title: document.title })`,
      returnByValue: true,
    },
    sessionId,
  )
  const data = JSON.parse(nav.result.value)

  report(navigated, 'client-side routing navigates to /format', data.url)
  report(data.h1.length > 0, 'routed page has an h1', data.h1)
  report(/test format/i.test(data.title), 'routed page title is updated', data.title)
  const accountReturn = await send(
    'Runtime.evaluate',
    {
      expression: `(() => {
      const link = document.querySelector('header.site-header a[aria-label="Create account"], header.site-header a[aria-label="Sign in"]')
      return link ? new URL(link.href).searchParams.get('from') : ''
    })()`,
      returnByValue: true,
    },
    sessionId,
  )
  report(
    accountReturn.result.value === '/format',
    'sign in returns to the page you came from',
    accountReturn.result.value,
  )
  report(errors.length === 0, 'client-side navigation throws nothing', errors.join(' | '))

  collectors.delete(navCollect)
  await send('Target.closeTarget', { targetId })
  await send('Target.disposeBrowserContext', { browserContextId })
}

// ---------------------------------------------------------------------------
// End-to-end flow: start a mock, answer items, and confirm the runner responds.
// This is the product itself, so it is worth exercising rather than trusting.
// ---------------------------------------------------------------------------
{
  const { browserContextId } = await send('Target.createBrowserContext', {})
  const { targetId } = await send('Target.createTarget', { url: `${BASE}/mock`, browserContextId })
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
  const flowErrors = []
  const collectFlow = (msg) => {
    if (msg.sessionId !== sessionId) return
    if (msg.method === 'Runtime.exceptionThrown') {
      flowErrors.push(msg.params.exceptionDetails?.exception?.description ?? 'unknown')
    }
  }
  collectors.add(collectFlow)

  await send('Runtime.enable', {}, sessionId)
  await send('Page.enable', {}, sessionId)
  await send('Page.navigate', { url: `${BASE}/mock` }, sessionId)
  await sleep(2500)

  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true }, sessionId)
    return r.result.value
  }

  const startClicked = await evaluate(`(() => {
    const btn = [...document.querySelectorAll('button')].find(b => /^Start (full mock|mock test|session)$/i.test(b.textContent.trim()));
    if (!btn) return 'no-button';
    btn.click();
    return 'clicked';
  })()`)
  report(startClicked === 'clicked', 'the mock setup page has a start button', startClicked)

  await sleep(1500)
  const onTest = await evaluate(`location.pathname`)
  report(onTest === '/test', 'starting a mock navigates to the runner', onTest)

  // The runner opens on a section briefing; starting it reveals a timer.
  const began = await evaluate(`(() => {
    const btn = [...document.querySelectorAll('button')].find(b => /^Begin /i.test(b.textContent.trim()));
    if (!btn) return 'no-button';
    btn.click();
    return 'clicked';
  })()`)
  report(began === 'clicked', 'the section briefing can be started', began)

  await waitUntil(sessionId, `document.querySelector('[role="timer"]') !== null`)
  const state = JSON.parse(
    await evaluate(`JSON.stringify({
      timer: document.querySelector('[role="timer"]')?.getAttribute('aria-label') ?? '',
      question: document.body.textContent?.replace(/\\s+/g, ' ').match(/Question \\d+ of \\d+/)?.[0] ?? '',
      inputs: document.querySelectorAll('#root input, #root select, #root textarea, #root button').length,
    })`),
  )
  report(/\d/.test(state.timer), 'the section timer is running', state.timer)
  report(
    /Question \d+ of \d+/.test(state.question),
    'the runner shows question progress',
    state.question || JSON.stringify(state).slice(0, 200),
  )
  report(state.inputs > 3, 'the runner renders an interactive item', String(state.inputs))

  // Walk forward through several items to prove the runner, state and clock
  // all survive navigation.
  let advanced = 0
  for (let i = 0; i < 6; i++) {
    const moved = await evaluate(`(() => {
      const btn = [...document.querySelectorAll('button.btn-primary')].find(b => /^(Next|Finish test|End section)/i.test(b.textContent.trim()))
        ?? [...document.querySelectorAll('button')].find(b => /^(Next|Finish test|End section)/i.test(b.textContent.trim()) && !b.hasAttribute('aria-pressed'));
      if (!btn) return false;
      btn.click();
      return true;
    })()`)
    if (!moved) break
    advanced += 1
    await sleep(700)
  }
  report(advanced >= 5, 'the runner advances through items', `${advanced} steps`)

  const stillAlive = JSON.parse(
    await evaluate(`JSON.stringify({
      question: document.body.textContent?.replace(/\\s+/g, ' ').match(/Question \\d+ of \\d+/)?.[0] ?? '',
      timer: document.querySelector('[role="timer"]')?.getAttribute('aria-label') ?? '',
      head: document.body.textContent?.replace(/\\s+/g, ' ').slice(0, 160),
    })`),
  )
  report(
    stillAlive.question !== '',
    'the runner is still on a question after navigating',
    stillAlive.question || stillAlive.head,
  )
  report(stillAlive.timer !== '', 'the timer survives navigation', stillAlive.timer)

  // Leaving a running session must offer a clear route back without silently
  // discarding it. A full navigation also exercises persisted store hydration.
  await send('Page.navigate', { url: `${BASE}/mock` }, sessionId)
  const canResume = await waitUntil(
    sessionId,
    `!!document.querySelector('aside[aria-label="Active session"] a[href="/test"]')`,
  )
  report(canResume, 'mock setup offers to resume a running session')
  const headerResume = await evaluate(
    `!!document.querySelector('header.site-header a[href="/test"]')`,
  )
  report(headerResume, 'the site header keeps the resume path visible')
  if (canResume) {
    await evaluate(
      `document.querySelector('aside[aria-label="Active session"] a[href="/test"]').click()`,
    )
    const resumed = await waitUntil(
      sessionId,
      `location.pathname === '/test' && !!document.querySelector('[role="timer"]')`,
    )
    report(resumed, 'resume returns to the running question and timer')
  }
  report(
    flowErrors.length === 0,
    'sitting the test throws nothing',
    flowErrors.join(' | ').slice(0, 200),
  )

  collectors.delete(collectFlow)
  await send('Target.closeTarget', { targetId })
  await send('Target.disposeBrowserContext', { browserContextId })
}

// ---------------------------------------------------------------------------
// Timing control
//
// The untimed and extended timings were wired end to end — the preview, the
// assembler, the store and the runner header all honour them — but the setup
// screen had no control to choose one, so a candidate who needs extra time
// could never reach the affordance the WCAG 2.2.1 note describes.
// ---------------------------------------------------------------------------
{
  const { browserContextId } = await send('Target.createBrowserContext', {})
  const { targetId } = await send('Target.createTarget', { url: 'about:blank', browserContextId })
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
  await send('Runtime.enable', {}, sessionId)
  await send('Page.enable', {}, sessionId)

  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true }, sessionId)
    return r.exceptionDetails ? '' : r.result.value
  }

  await send('Page.navigate', { url: `${BASE}/mock` }, sessionId)
  await waitUntil(sessionId, `document.documentElement.dataset.appReady === 'true'`)

  const options = JSON.parse(
    await evaluate(`(() => {
    const group = document.querySelector('[role="group"][aria-label="Timing"]')
    if (!group) return JSON.stringify({ found: false, count: 0 })
    const buttons = [...group.querySelectorAll('button')]
    buttons.find((b) => /untimed/i.test(b.textContent))?.click()
    return JSON.stringify({ found: true, count: buttons.length })
  })()`),
  )
  report(
    options.found && options.count === 4,
    'the setup screen offers every timing option',
    JSON.stringify(options),
  )

  await sleep(400)
  const applied = JSON.parse(
    await evaluate(`JSON.stringify({
    summary: document.querySelector('dl')?.textContent ?? '',
    body: document.body.textContent ?? '',
    pressed: document.querySelector('[role="group"][aria-label="Timing"] button[aria-pressed="true"]')?.textContent?.trim() ?? '',
  })`),
  )
  report(applied.pressed === 'Untimed', 'the chosen timing is marked as selected', applied.pressed)
  report(
    /Untimed/.test(applied.summary),
    'choosing a timing updates the session summary',
    applied.summary.replace(/\\s+/g, ' ').slice(0, 80),
  )
  report(/No clock/.test(applied.body), 'the chosen timing explains what changes', 'No clock')

  await send('Target.closeTarget', { targetId })
  await send('Target.disposeBrowserContext', { browserContextId })
}

// ---------------------------------------------------------------------------
// Full attempt: answer nothing, sit every section to the end, and confirm the
// results page renders a real scored report. This exercises the scoring
// pipeline, the section transitions and IndexedDB persistence together.
// ---------------------------------------------------------------------------
{
  const { browserContextId } = await send('Target.createBrowserContext', {})
  const { targetId } = await send('Target.createTarget', { url: `${BASE}/mock`, browserContextId })
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
  const resultErrors = []
  const collectResult = (msg) => {
    if (msg.sessionId !== sessionId) return
    if (msg.method === 'Runtime.exceptionThrown') {
      resultErrors.push(msg.params.exceptionDetails?.exception?.description ?? 'unknown')
    }
  }
  collectors.add(collectResult)

  await send('Runtime.enable', {}, sessionId)
  await send('Page.enable', {}, sessionId)
  await send('Page.navigate', { url: `${BASE}/mock` }, sessionId)
  await waitUntil(sessionId, `document.documentElement.dataset.appReady === 'true'`)

  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true }, sessionId)
    return r.result.value
  }

  await evaluate(`(() => {
    const btn = [...document.querySelectorAll('button')].find(b => /^Start (full mock|mock test|session)$/i.test(b.textContent.trim()));
    if (btn) btn.click();
    return !!btn;
  })()`)
  await waitUntil(sessionId, `location.pathname === '/test'`)

  // Drive the whole test: begin a section when asked, otherwise advance.
  const deadline = Date.now() + 90000
  let steps = 0
  let reachedResult = false
  while (Date.now() < deadline) {
    const outcome = await evaluate(`(() => {
      if (location.pathname === '/result') return 'done';
      const begin = [...document.querySelectorAll('button.btn-primary')].find(b => /^(Begin |Start )/i.test(b.textContent.trim()))
        ?? [...document.querySelectorAll('button')].find(b => /^(Begin |Start )/i.test(b.textContent.trim()) && !b.hasAttribute('aria-pressed'));
      if (begin) { begin.click(); return 'begin'; }
      const next = [...document.querySelectorAll('button.btn-primary')].find(b => /^(Next|End section|Finish test)/i.test(b.textContent.trim()))
        ?? [...document.querySelectorAll('button')].find(b => /^(Next|End section|Finish test)/i.test(b.textContent.trim()) && !b.hasAttribute('aria-pressed'));
      if (next) { next.click(); return 'next'; }
      return 'stuck';
    })()`)
    steps += 1
    if (outcome === 'done') {
      reachedResult = true
      break
    }
    if (outcome === 'stuck') break
    await sleep(90)
  }
  report(reachedResult, 'a full test can be sat to the end', `${steps} steps`)

  // The report is scored asynchronously on arrival.
  const reportDeadline = Date.now() + 15000
  while (Date.now() < reportDeadline) {
    const raw = await evaluate(`JSON.stringify({
      h1: document.querySelector('h1')?.textContent?.trim() ?? '',
      score: document.querySelector('h1')?.parentElement?.textContent?.match(/CEFR [A-C][12]/) ? 'cefr' : '',
      text: document.body.textContent?.replace(/\\s+/g, ' ') ?? '',
    })`)
    const parsed = JSON.parse(raw)
    if (/CEFR\s[A-C][12]/.test(parsed.text)) break
    await sleep(300)
  }

  const summary = JSON.parse(
    await evaluate(`JSON.stringify({
      hasScore: /10 to 90/.test(document.body.textContent ?? ''),
      hasNoLegacyScale: !/TOEFL|60[–-]120/i.test(document.body.textContent ?? ''),
      hasSkills:
        ['speaking', 'writing', 'reading', 'listening'].every((s) =>
          new RegExp(s, 'i').test(document.body.textContent ?? ''),
        ),
      hasTabs: /By question type/.test(document.body.textContent ?? ''),
      hasEstimateNote: /estimated/i.test(document.body.textContent ?? ''),
      noAttemptsText: /No attempts yet/.test(document.body.textContent ?? ''),
    })`),
  )

  report(summary.hasScore, 'the results page states the official 10 to 90 scale')
  report(summary.hasNoLegacyScale, 'the results page does not show a 60-120 or TOEFL equivalent')
  report(summary.hasSkills, 'the results page reports the four skills')
  report(summary.hasTabs, 'the results page offers its breakdown tabs')
  report(summary.hasEstimateNote, 'the results page labels estimates')
  report(!summary.noAttemptsText, 'the report is not an empty state', 'rendered the empty state')
  const nextStep = JSON.parse(
    await evaluate(`JSON.stringify({
    practice: !!document.querySelector('#main-content header a[href^="/practice"]'),
    progress: !!document.querySelector('#main-content header a[href="/dashboard"]'),
  })`),
  )
  report(
    nextStep.practice && nextStep.progress,
    'the report offers practice and progress without scrolling',
  )

  // Opening the answer review must list every attempted item.
  await evaluate(`(() => {
    const tab = [...document.querySelectorAll('[role=tab]')].find(t => /Answer review/i.test(t.textContent));
    if (tab) tab.click();
    return !!tab;
  })()`)
  await sleep(600)
  const review = JSON.parse(
    await evaluate(`JSON.stringify({
      items: document.querySelectorAll('[role=tablist] ~ * li').length,
      hasTypes: /Read Aloud|Repeat Sentence|Fill in the Blanks/.test(document.body.textContent ?? ''),
      text: (document.body.textContent ?? '').replace(/\\s+/g, ' ').slice(0, 200),
    })`),
  )
  report(review.hasTypes, 'the answer review lists question types', review.text)

  report(
    resultErrors.length === 0,
    'completing a test throws nothing',
    resultErrors.join(' | ').slice(0, 200),
  )

  collectors.delete(collectResult)
  await send('Target.closeTarget', { targetId })
  await send('Target.disposeBrowserContext', { browserContextId })
}

// ---------------------------------------------------------------------------
// Theme
//
// The site ships exactly two themes and deliberately has no `system` option, so
// the two things that can silently break are a stale stored preference from the
// release that did have one, and a toggle that no longer repaints. Both were
// real: a v1 store carrying `theme: "system"` survived an unverified migration
// and rendered the light ground while the toggle still claimed "system".
// ---------------------------------------------------------------------------
{
  const { browserContextId } = await send('Target.createBrowserContext', {})
  const { targetId } = await send('Target.createTarget', { url: 'about:blank', browserContextId })
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })

  await send('Runtime.enable', {}, sessionId)
  await send('Page.enable', {}, sessionId)
  await send('Network.setCacheDisabled', { cacheDisabled: true }, sessionId)
  await send('Page.navigate', { url: `${BASE}/` }, sessionId)
  await sleep(2500)

  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true }, sessionId)
    if (r.exceptionDetails) return ''
    return r.result.value
  }

  /* Read the grounds off the stylesheet rather than hardcoding them.
     These two literals had drifted three times over: they said `rgb(23,27,32)`
     while the app painted `rgb(13,17,23)`, and both predate the navy palette
     that moved them to `rgb(10,22,40)`. Every theme assertion below was
     therefore failing on a value nobody had looked at in a year, which is a
     test that reports on itself rather than on the app. Reading the token means
     a palette change does not turn four assertions red — and if the ground is
     genuinely wrong, the token comparison still catches it. */
  const token = async (name) =>
    (await evaluate(
      `getComputedStyle(document.documentElement).getPropertyValue('${name}').trim()`,
    )) ?? ''
  const rgbOf = (hex) => {
    // The build minifies #ffffff to #fff, so both lengths have to parse or
    // every light-ground assertion silently compares against an empty string.
    const m = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i.exec(hex)
    if (!m) return ''
    const full = m[1].length === 3 ? m[1].replace(/./g, (c) => c + c) : m[1]
    const n = parseInt(full, 16)
    return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`
  }
  const DARK_BG = rgbOf(await token('--color-ink-900'))
  const LIGHT_BG = rgbOf(await token('--color-ink-50'))

  // A realistic v1 record: the removed `system` theme, at the shape v1 wrote.
  await evaluate(`localStorage.setItem('pte-prep-settings', JSON.stringify({
    state: { settings: { theme: 'system', reducedMotion: true, showWordCount: true,
      speakPrompts: false, countdownBeeps: true, textScale: 1,
      defaultMode: 'full', autoOpenReview: true }, hydrated: true },
    version: 1
  }))`)
  await send('Page.navigate', { url: `${BASE}/` }, sessionId)
  await sleep(2500)

  const migrated = JSON.parse((await evaluate("localStorage.getItem('pte-prep-settings')")) ?? '{}')
  report(
    migrated?.state?.settings?.theme === 'light',
    'a stored "system" theme is migrated away',
    `theme=${JSON.stringify(migrated?.state?.settings?.theme)} version=${JSON.stringify(migrated?.version)}`,
  )
  report(
    migrated?.version === 2,
    'the settings store is on version 2',
    `version=${migrated?.version}`,
  )
  report(
    migrated?.state?.settings?.reducedMotion === true,
    'migration preserves unrelated settings',
    `reducedMotion=${JSON.stringify(migrated?.state?.settings?.reducedMotion)}`,
  )
  report(
    (await evaluate('getComputedStyle(document.body).backgroundColor')) === LIGHT_BG,
    'the migrated theme paints the light ground',
    await evaluate('getComputedStyle(document.body).backgroundColor'),
  )

  const toggleLabel = () =>
    evaluate("document.querySelector('button[aria-label*=Theme]').getAttribute('aria-label')")
  report(
    /^Theme: (light|dark)\./.test((await toggleLabel()) ?? ''),
    'the toggle reports a real theme',
    await toggleLabel(),
  )
  report(
    !/\bsystem\b/i.test((await evaluate('document.body.textContent ?? ""')) ?? ''),
    'no system theme is offered anywhere',
  )

  // Both directions, and the choice has to survive a reload.
  await evaluate("document.querySelector('button[aria-label*=Theme]').click()")
  await sleep(800)
  report(
    (await evaluate('getComputedStyle(document.body).backgroundColor')) === DARK_BG,
    'the toggle switches to the dark ground',
    await evaluate('getComputedStyle(document.body).backgroundColor'),
  )
  /* Assert the relationship, not a literal. The chrome colour is derived from
     the painted ground (see the theme-color effect in App.tsx), so the invariant
     worth protecting is "they agree" — pinning `#171b20` here would break every
     time the palette moves and would never have caught the three-way drift
     between that value, the pre-paint script in index.html, and the real
     `--color-ink-900`. */
  const hexToRgbStr = (h) => {
    const m = /^#?([0-9a-f]{6})$/i.exec((h ?? '').trim())
    if (!m) return ''
    const n = parseInt(m[1], 16)
    return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`
  }
  report(
    hexToRgbStr(await evaluate("document.querySelector('meta[name=theme-color]').content")) ===
      DARK_BG,
    'the browser chrome follows the dark theme',
    await evaluate("document.querySelector('meta[name=theme-color]').content"),
  )

  await send('Page.navigate', { url: `${BASE}/` }, sessionId)
  await sleep(2000)
  report(
    (await evaluate('getComputedStyle(document.body).backgroundColor')) === DARK_BG,
    'the chosen theme survives a reload',
    await evaluate('getComputedStyle(document.body).backgroundColor'),
  )

  await evaluate("document.querySelector('button[aria-label*=Theme]').click()")
  await sleep(800)
  report(
    (await evaluate('getComputedStyle(document.body).backgroundColor')) === LIGHT_BG,
    'the toggle switches back to the light ground',
    await evaluate('getComputedStyle(document.body).backgroundColor'),
  )
  report(
    hexToRgbStr(await evaluate("document.querySelector('meta[name=theme-color]').content")) ===
      LIGHT_BG,
    'the browser chrome follows the light theme',
    await evaluate("document.querySelector('meta[name=theme-color]').content"),
  )

  // The dashboard control must expose the same two options as the header.
  await send('Page.navigate', { url: `${BASE}/dashboard` }, sessionId)
  await sleep(2000)
  const options = await evaluate(`JSON.stringify([...document.querySelectorAll('button')]
    .map(b => b.textContent.trim())
    .filter(t => ['light', 'dark', 'system'].includes(t)))`)
  report(options === '["light","dark"]', 'the settings panel offers light and dark', options)

  await send('Target.closeTarget', { targetId })
  await send('Target.disposeBrowserContext', { browserContextId })
}

// ---------------------------------------------------------------------------
// Question-type page metadata
//
// Two PTE types share a display name across sections (Multiple Choice Single
// Answer and Multiple Answer each appear in Reading and Listening) and there are
// three Fill in the Blanks variants. If titles were built from the label alone
// those pages would compete with each other. This asserts the disambiguation
// actually holds, rather than trusting the template.
// ---------------------------------------------------------------------------
{
  const { browserContextId } = await send('Target.createBrowserContext', {})
  const { targetId } = await send('Target.createTarget', { url: 'about:blank', browserContextId })
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
  await send('Runtime.enable', {}, sessionId)
  await send('Page.enable', {}, sessionId)

  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true }, sessionId)
    return r.exceptionDetails ? '' : r.result.value
  }

  const titles = new Set()
  const descriptions = new Set()
  const canonicals = new Set()
  let noH1 = 0
  let noCanonical = 0
  let noCrumb = 0
  let noVisibleFaq = 0
  let thinnest = Infinity

  for (const slug of QUESTION_TYPE_SLUGS) {
    await send('Page.navigate', { url: `${BASE}/question-types/${slug}/` }, sessionId)
    // Wait for the document to be ready rather than sleeping a fixed amount.
    // Under load a page intermittently had not rendered within the old fixed
    // 1100ms, which produced confident failures about missing canonicals,
    // breadcrumbs and headings on a page that was simply not there yet.
    for (let i = 0; i < 40; i++) {
      const ready = await evaluate(
        "document.readyState === 'complete' && !!document.querySelector('main h1') && !!document.querySelector('link[rel=canonical]')",
      )
      if (ready === true) break
      await sleep(150)
    }
    titles.add((await evaluate('document.title')) ?? '')
    descriptions.add(
      (await evaluate("document.querySelector('meta[name=description]')?.content ?? ''")) ?? '',
    )
    canonicals.add(
      (await evaluate("document.querySelector('link[rel=canonical]')?.href ?? ''")) ?? '',
    )
    if ((await evaluate("document.querySelectorAll('h1').length")) !== 1) noH1++
    if (!(await evaluate("!!document.querySelector('link[rel=canonical]')"))) noCanonical++
    if (!(await evaluate("!!document.querySelector('nav[aria-label=Breadcrumb] ol')"))) noCrumb++
    // Must return a primitive: handing back a DOM node trips CDP's
    // "object reference chain is too long" limit.
    if (
      !(await evaluate(
        "!!Array.from(document.querySelectorAll('main h2')).find(h => /questions, answered/i.test(h.textContent))",
      ))
    ) {
      noVisibleFaq++
    }
    const words = Number(
      (await evaluate(
        "(document.querySelector('main')?.innerText ?? '').trim().split(/\\s+/).length",
      )) ?? 0,
    )
    if (words > 0 && words < thinnest) thinnest = words
  }

  report(
    titles.size === QUESTION_TYPE_SLUGS.length,
    `all ${QUESTION_TYPE_SLUGS.length} question-type titles are unique`,
    `${titles.size} unique`,
  )
  report(
    descriptions.size === QUESTION_TYPE_SLUGS.length,
    `all ${QUESTION_TYPE_SLUGS.length} question-type descriptions are unique`,
    `${descriptions.size} unique`,
  )
  report(
    canonicals.size === QUESTION_TYPE_SLUGS.length,
    `all ${QUESTION_TYPE_SLUGS.length} question-type canonicals are unique`,
    `${canonicals.size} unique`,
  )
  report(noH1 === 0, 'every question-type page has exactly one h1', `${noH1} bad`)
  report(noCanonical === 0, 'every question-type page has a canonical', `${noCanonical} missing`)
  report(noCrumb === 0, 'every question-type page shows breadcrumbs', `${noCrumb} missing`)
  report(
    noVisibleFaq === 0,
    'every FAQPage block is also visible on its page',
    `${noVisibleFaq} hidden`,
  )
  report(thinnest >= 250, 'no question-type page is thin', `thinnest=${thinnest} words`)

  // The shared labels must not collide once rendered.
  await send('Page.navigate', { url: `${BASE}/question-types/multiple-choice-single/` }, sessionId)
  await sleep(1100)
  const readingTitle = await evaluate('document.title')
  await send(
    'Page.navigate',
    { url: `${BASE}/question-types/listening-multiple-choice-single/` },
    sessionId,
  )
  await sleep(1100)
  const listeningTitle = await evaluate('document.title')
  report(
    Boolean(readingTitle) && readingTitle !== listeningTitle,
    'the two Multiple Choice (Single Answer) pages are distinguishable',
    `${readingTitle} / ${listeningTitle}`,
  )

  await send('Page.navigate', { url: `${BASE}/question-types/no-such-type/` }, sessionId)
  await sleep(1200)
  report(
    await evaluate(
      "/not found|no such page|404/i.test(document.querySelector('main')?.innerText ?? '')",
    ),
    'an unknown question-type slug renders the 404 page',
  )
  report(
    await evaluate(
      "document.querySelector('meta[name=robots]')?.content?.includes('noindex') ?? false",
    ),
    'an unknown question-type slug is noindex',
  )

  await send('Target.closeTarget', { targetId })
  await send('Target.disposeBrowserContext', { browserContextId })
}

// ---------------------------------------------------------------------------
// Tagline
//
// The mockup's tagline is one static sentence — no word-by-word reveal — with
// the "one type" phrase punched out on its own highlight. The regressions this
// guards are the section being dropped, or the highlight losing its span so the
// sentence reverts to plain body colour.
// ---------------------------------------------------------------------------
{
  const { browserContextId } = await send('Target.createBrowserContext', {})
  const { targetId } = await send('Target.createTarget', { url: 'about:blank', browserContextId })
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
  await send('Runtime.enable', {}, sessionId)
  await send('Page.enable', {}, sessionId)

  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true }, sessionId)
    return r.exceptionDetails ? '' : r.result.value
  }

  await send('Page.navigate', { url: `${BASE}/` }, sessionId)
  await sleep(2500)

  const text = await evaluate("document.querySelector('.tagline-text')?.textContent?.trim() ?? ''")
  report(
    text.startsWith('Find the'),
    'the tagline renders its sentence',
    `text="${text.slice(0, 30)}"`,
  )

  const highlight = await evaluate(
    "document.querySelector('.tagline-text .hl')?.textContent?.trim() ?? ''",
  )
  report(highlight === 'one type', 'the tagline highlight wraps "one type"', `hl="${highlight}"`)

  const opacity = await evaluate(
    "getComputedStyle(document.querySelector('.tagline-text .hl')).opacity",
  )
  report(
    opacity === '1',
    'the tagline ships fully resolved, with no muted words',
    `opacity=${opacity}`,
  )

  await send('Target.closeTarget', { targetId })
  await send('Target.disposeBrowserContext', { browserContextId })
}

// ---------------------------------------------------------------------------
// Pace tab
//
// The report only offers Pace when the runner actually recorded per-item time.
// The regression this guards is subtle: `secondsOnItem` is a declared field that
// nothing writes, so the tab can silently never appear while every unit test
// still passes against a hand-built fixture.
// ---------------------------------------------------------------------------
{
  const { browserContextId } = await send('Target.createBrowserContext', {})
  const { targetId } = await send('Target.createTarget', { url: 'about:blank', browserContextId })
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
  await send('Runtime.enable', {}, sessionId)
  await send('Page.enable', {}, sessionId)

  const evaluate = async (expression) => {
    const r = await send(
      'Runtime.evaluate',
      { expression, returnByValue: true, awaitPromise: true },
      sessionId,
    )
    return r.exceptionDetails ? '' : r.result.value
  }
  const click = async (re) =>
    evaluate(`(() => {
      const b = [...document.querySelectorAll('button, a')].find((x) => new RegExp(${JSON.stringify(re)}, 'i').test(x.textContent.trim()))
      if (!b) return 'none'
      b.click()
      return 'ok'
    })()`)

  // Read Aloud is the densest timed type, so a short drill exercises the timer.
  await send('Page.navigate', { url: `${BASE}/practice?type=read-aloud` }, sessionId)
  await sleep(2200)
  await click('Start drill')
  await sleep(2000)
  await click('^Begin')
  await sleep(2200)
  for (let i = 0; i < 16; i++) {
    await click('^(Next|Submit|Finish|See my report|View report|Done)')
    await sleep(1000)
    const path = await evaluate('location.pathname')
    if (path === '/result' || path === '/dashboard') break
  }

  const onResult = (await evaluate('location.pathname')) === '/result'
  report(onResult, 'a timed drill reaches the report', await evaluate('location.pathname'))

  if (onResult) {
    const hasTab = await evaluate(
      "[...document.querySelectorAll('[role=tab]')].some((t) => t.textContent.trim() === 'Pace')",
    )
    report(hasTab === true, 'the report offers a Pace tab once time has been recorded')
    if (hasTab) {
      await click('^Pace$')
      await sleep(1200)
      report(
        await evaluate('/Where your time went/.test(document.body.innerText)'),
        'the Pace tab explains the comparison against real-test budgets',
      )
      report(
        await evaluate(
          "[...document.querySelectorAll('main li')].some((l) => / of \\d/.test(l.innerText))",
        ),
        'the Pace tab lists a measured row with spent and allowed time',
      )
      report(
        await evaluate('/Under budget is not automatically good/.test(document.body.innerText)'),
        'the Pace tab warns that being under budget is not automatically good',
      )
    }
  }

  await send('Target.closeTarget', { targetId })
  await send('Target.disposeBrowserContext', { browserContextId })
}

// ---------------------------------------------------------------------------
// Weak-type recommendation
//
// The dashboard offers a "Practise these next" panel and a separate "Drill
// weakest type" link. They must name the same type: both once read from the
// latest attempt only, so a candidate could be told to drill one thing by the
// panel and another by the link.
// ---------------------------------------------------------------------------
{
  const { browserContextId } = await send('Target.createBrowserContext', {})
  const { targetId } = await send('Target.createTarget', { url: 'about:blank', browserContextId })
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
  await send('Runtime.enable', {}, sessionId)
  await send('Page.enable', {}, sessionId)

  const evaluate = async (expression) => {
    const r = await send(
      'Runtime.evaluate',
      { expression, returnByValue: true, awaitPromise: true },
      sessionId,
    )
    return r.exceptionDetails ? '' : r.result.value
  }
  const click = async (re) =>
    evaluate(`(() => {
      const b = [...document.querySelectorAll('button, a')].find((x) => new RegExp(${JSON.stringify(re)}, 'i').test(x.textContent.trim()))
      if (!b) return 'none'
      b.click()
      return 'ok'
    })()`)

  await send('Page.navigate', { url: `${BASE}/practice?type=summarize-written-text` }, sessionId)
  await sleep(2200)
  await click('Start drill')
  await sleep(2200)
  await click('^Begin')
  await sleep(2200)
  for (let i = 0; i < 12; i++) {
    await evaluate(
      "[...document.querySelectorAll('textarea')].forEach((t) => { t.value = 'The passage reports that the mechanism transfers information between brain regions.'; t.dispatchEvent(new Event('input', { bubbles: true })) }); 1",
    )
    await click('^(Next|Submit|Finish|See my report|View report|Done)')
    await sleep(1200)
    const path = await evaluate('location.pathname')
    if (path === '/result' || path === '/dashboard') break
  }
  const scored = await waitUntil(
    sessionId,
    `location.pathname === '/result' && !!document.querySelector('#main-content header')`,
  )
  report(scored, 'the recommended drill produces a result')
  if (scored) await click('View progress|Dashboard|Progress')
  const onDashboard =
    scored &&
    (await waitUntil(
      sessionId,
      `location.pathname === '/dashboard' && !!document.querySelector('#focus-heading')`,
    ))
  report(onDashboard, 'the result leads into progress')

  const card = await evaluate(
    "(() => { const a = document.querySelector('section[aria-labelledby=\"focus-heading\"] a[href^=\"/practice?type=\"]'); return a ? a.getAttribute('href') : '' })()",
  )
  const link = await evaluate(
    "(() => { const b = [...document.querySelectorAll('a')].find((x) => /Drill weakest type/i.test(x.textContent)); return b ? b.getAttribute('href') : '' })()",
  )
  report(Boolean(card), 'the dashboard recommends a next drill from real attempt history', card)
  report(
    card === link,
    'the recommendation panel and the weakest-type link agree',
    `${card} vs ${link}`,
  )
  // A fresh profile is needed for the zero state: by now the drill above has
  // written an attempt, which is the whole point of the panel.
  await send('Target.closeTarget', { targetId })
  await send('Target.disposeBrowserContext', { browserContextId })

  const { browserContextId: freshId } = await send('Target.createBrowserContext', {})
  const { targetId: freshTarget } = await send('Target.createTarget', {
    url: 'about:blank',
    browserContextId: freshId,
  })
  const { sessionId: freshSession } = await send('Target.attachToTarget', {
    targetId: freshTarget,
    flatten: true,
  })
  await send('Runtime.enable', {}, freshSession)
  await send('Page.enable', {}, freshSession)
  await send('Page.navigate', { url: `${BASE}/dashboard` }, freshSession)
  await sleep(2200)
  const zeroState = await send(
    'Runtime.evaluate',
    {
      expression:
        '!/Practise these next/.test(document.body.innerText) && /No attempts yet/.test(document.body.innerText)',
      returnByValue: true,
    },
    freshSession,
  )
  report(
    zeroState.result.value === true,
    'the recommendation panel is hidden with no attempts',
    String(zeroState.result.value),
  )
  await send('Target.closeTarget', { targetId: freshTarget })
  await send('Target.disposeBrowserContext', { browserContextId: freshId })
}

// ---------------------------------------------------------------------------
// Text wrapping
//
// B1 asks for balanced headings and pretty body copy. The failure mode here is
// subtle: putting `text-balance` outside the className string compiles fine and
// renders as a boolean attribute, so nothing fails — the headings simply stay
// unbalanced. This checks the computed value rather than the markup.
// ---------------------------------------------------------------------------
{
  const { browserContextId } = await send('Target.createBrowserContext', {})
  const { targetId } = await send('Target.createTarget', { url: 'about:blank', browserContextId })
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
  await send('Runtime.enable', {}, sessionId)
  await send('Page.enable', {}, sessionId)

  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true }, sessionId)
    return r.exceptionDetails ? '' : r.result.value
  }

  for (const route of ['/about/', '/format/', '/question-types/read-aloud/']) {
    await send('Page.navigate', { url: `${BASE}${route}` }, sessionId)
    await sleep(1800)

    const result = await evaluate(`
      (() => {
        const style = (el) => getComputedStyle(el).textWrapStyle
        const heads = [...document.querySelectorAll('main h1, main h2')]
        return JSON.stringify({
          total: heads.length,
          unbalanced: heads.filter(h => style(h) !== 'balance')
            .map(h => h.textContent.trim().slice(0, 30)),
          stray: document.querySelectorAll('[text-balance]').length,
        })
      })()
    `)

    const { total, unbalanced, stray } = JSON.parse(result ?? '{}')
    report(
      unbalanced.length === 0,
      `${route} headings use text-wrap: balance`,
      `${total - unbalanced.length}/${total}` +
        (unbalanced.length ? ` — ${unbalanced.join(', ')}` : ''),
    )
    report(stray === 0, `${route} has no stray text-balance attribute`, `${stray} found`)
  }

  await send('Target.closeTarget', { targetId })
  await send('Target.disposeBrowserContext', { browserContextId })
}

// ---------------------------------------------------------------------------
// Page structure and motion
//
// Two regressions that are invisible in markup: the homepage losing its
// three-step "how a mock runs" section (skill A2 puts it between the benefits
// and the FAQ), and the motion curve silently reverting to the framework
// default, which would leave the tagline reveal moving on a different curve to
// every hover in the app.
// ---------------------------------------------------------------------------
{
  const { browserContextId } = await send('Target.createBrowserContext', {})
  const { targetId } = await send('Target.createTarget', { url: 'about:blank', browserContextId })
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
  await send('Runtime.enable', {}, sessionId)
  await send('Page.enable', {}, sessionId)

  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true }, sessionId)
    return r.exceptionDetails ? '' : r.result.value
  }

  await send('Page.navigate', { url: `${BASE}/` }, sessionId)
  await sleep(2200)

  const steps = await evaluate(
    "[...document.querySelectorAll('main ol > li')].filter(li => /^Step \\d/.test(li.textContent.trim())).length",
  )
  report(
    Number(steps) === 3,
    'the homepage explains how a mock runs in three steps',
    `${steps} steps`,
  )

  const order = await evaluate(`
    JSON.stringify([...document.querySelectorAll('main h2')].map(h => h.textContent.trim().slice(0, 24)))
  `)
  /* Match the section by its position in the step list rather than by one
     exact string. This asserted the literal "How a mock runs" and had been
     failing every run since the heading was rewritten to "Ready in three
     steps" — a check that goes stale silently and then trains you to ignore
     the file. The invariant worth keeping is structural: the walkthrough has to
     come before the FAQ. */
  const headings = JSON.parse(order ?? '[]')
  const stepIdx = headings.findIndex((h) => /ready in three steps|how a mock runs/i.test(h))
  const faqIdx = headings.findIndex((h) => /frequently asked/i.test(h))
  report(
    stepIdx >= 0 && faqIdx > stepIdx,
    'the three steps sit before the FAQ, per the page structure',
    `steps=${stepIdx} faq=${faqIdx}`,
  )

  /* Query a nav pill, not `nav a`. The first anchor inside <nav> is the logo
     link, which carries no transition of its own, so this assertion had been
     reading a computed `ease` off an element that was never meant to have the
     house curve and reporting it as a failure. The logo also has an href, so
     exclude it by aria-label and take a real navigation link. */
  const curve = await evaluate(
    `(() => {
       const link = [...document.querySelectorAll('nav a[href]')]
         .find(a => !a.getAttribute('aria-label')?.includes('home'))
       return link ? getComputedStyle(link).transitionTimingFunction : ''
     })()`,
  )
  report(
    (curve ?? '').includes('0.32'),
    'transitions share one motion curve rather than the framework default',
    curve,
  )

  // B9 asks for physical press feedback. The geometry matters as much as the
  // effect: a scale would shrink a 24px tap target, so the press is a
  // translation and the measured box must be identical before and after.
  const box = JSON.parse(
    (await evaluate(`
      (() => {
        const b = document.querySelector('main a.btn-primary, a.btn-primary')
        const r = b.getBoundingClientRect()
        return JSON.stringify({
          x: Math.round(r.left + r.width / 2),
          y: Math.round(r.top + r.height / 2),
          top: Math.round(r.top),
          height: Math.round(r.height),
        })
      })()
    `)) ?? '{}',
  )
  await send(
    'Input.dispatchMouseEvent',
    { type: 'mousePressed', x: box.x, y: box.y, button: 'left', clickCount: 1 },
    sessionId,
  )
  await sleep(220)
  const pressed = JSON.parse(
    (await evaluate(`
      (() => {
        const b = document.querySelector('main a.btn-primary, a.btn-primary')
        const r = b.getBoundingClientRect()
        return JSON.stringify({
          top: Math.round(r.top),
          height: Math.round(r.height),
          translate: getComputedStyle(b).translate,
        })
      })()
    `)) ?? '{}',
  )
  // The press animates over 700ms, so a literal string compare races the
  // transition and intermittently reads a fractional value. Compare numerically.
  // The press depth is a design choice — the 06-playful buttons sink 5px onto
  // their offset shadow — so assert the intent (a real downward press) rather
  // than one hard-coded pixel value.
  const pressY = Number.parseFloat(String(pressed.translate).split(/\s+/)[1] ?? 'NaN')
  report(
    Number.isFinite(pressY) && pressY >= 1,
    'buttons give physical press feedback',
    `translate=${pressed.translate}`,
  )
  report(
    pressed.height === box.height && pressed.top === box.top + Math.round(pressY),
    'the press does not resize the tap target',
    `height ${box.height}->${pressed.height}, top ${box.top}->${pressed.top}`,
  )
  await send(
    'Input.dispatchMouseEvent',
    { type: 'mouseReleased', x: box.x, y: box.y, button: 'left', clickCount: 1 },
    sessionId,
  )
  await sleep(220)
  // Park the pointer away from the button first. While it remains over the
  // element the hover transform is the correct resting state, so asserting
  // "none" here would be testing the pointer position rather than the press.
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 2, y: 2 }, sessionId)
  await sleep(900)
  const released = await evaluate(
    "getComputedStyle(document.querySelector('main a.btn-primary, a.btn-primary')).translate",
  )
  const restY = Number.parseFloat(String(released).split(/\s+/)[1] ?? 'NaN')
  report(
    !Number.isFinite(restY) || Math.abs(restY) < 0.05,
    'the button returns on release',
    `translate=${released}`,
  )

  // Unlike the hero CTA, the format page's secondary action has no wrapper.
  // Its pointer pull is delegated site-wide, without changing its box or link.
  await send('Page.navigate', { url: `${BASE}/format` }, sessionId)
  await sleep(1000)
  await waitUntil(
    sessionId,
    "document.documentElement.dataset.appReady === 'true' && !!document.querySelector('main a.btn-secondary')",
  )
  const action = JSON.parse(
    (await evaluate(`(() => {
    const a = document.querySelector('main a.btn-secondary')
    if (!a) return '{}'
    const r = a.getBoundingClientRect()
    return JSON.stringify({ x: Math.round(r.left + r.width * .7), y: Math.round(r.top + r.height * .65) })
  })()`)) ?? '{}',
  )
  if (Number.isFinite(action.x) && Number.isFinite(action.y)) {
    await send(
      'Input.dispatchMouseEvent',
      { type: 'mouseMoved', x: action.x, y: action.y },
      sessionId,
    )
    await sleep(450)
    const pulled = await evaluate(
      "document.querySelector('main a.btn-secondary')?.style.getPropertyValue('--control-x')",
    )
    report(
      Math.abs(Number.parseFloat(pulled)) > 0.2,
      'functional page actions follow the pointer',
      `x=${pulled}`,
    )
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 2, y: 2 }, sessionId)
    const settled = await evaluate(
      "document.querySelector('main a.btn-secondary')?.style.getPropertyValue('--control-x')",
    )
    report(
      Number.parseFloat(settled) === 0,
      'functional actions settle when the pointer leaves',
      `x=${settled}`,
    )
    await send(
      'Emulation.setEmulatedMedia',
      { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] },
      sessionId,
    )
    await send(
      'Input.dispatchMouseEvent',
      { type: 'mouseMoved', x: action.x, y: action.y },
      sessionId,
    )
    const still = await evaluate(
      "document.querySelector('main a.btn-secondary')?.style.getPropertyValue('--control-x')",
    )
    report(Number.parseFloat(still) === 0, 'reduced motion disables pointer pull', `x=${still}`)
  } else {
    report(false, 'functional page actions are present for hover testing')
  }

  await send('Target.closeTarget', { targetId })
  await send('Target.disposeBrowserContext', { browserContextId })
}

// --- section furniture at narrow widths -------------------------------------
//
// A band escapes the page shell's gutters with a negative margin, and that
// margin is breakpoint-dependent (-mx-4 / sm:-mx-6 / lg:-mx-8). The desktop pass
// above therefore proves one width out of three; the geometry is measured again
// at each breakpoint on the routes that actually carry a band.

for (const width of [390, 768, 1100]) {
  const { browserContextId } = await send('Target.createBrowserContext', {})
  const { targetId } = await send('Target.createTarget', { url: 'about:blank', browserContextId })
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
  await send('Page.enable', {}, sessionId)
  await send(
    'Emulation.setDeviceMetricsOverride',
    {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: width < 700,
    },
    sessionId,
  )

  for (const route of ['/', '/about', '/guide', '/format', '/question-types/']) {
    await send('Page.navigate', { url: BASE + route }, sessionId)
    await sleep(900)
    const probe = await send(
      'Runtime.evaluate',
      {
        expression: `(() => {
          const W = window.innerWidth
          const bands = [...document.querySelectorAll('.band, .band-plain, .band-flush, .band-flush-plain')]
          const bad = bands.filter((el) => {
            const r = el.getBoundingClientRect()
            return r.left < -1 || r.right > W + 1
          })
          // Name the offenders: a pixel count alone cannot be fixed.
          const offenders = []
          for (const el of document.querySelectorAll('body *')) {
            const r = el.getBoundingClientRect()
            if (r.width === 0 && r.height === 0) continue
            if (r.right > W + 1 || r.left < -1) {
              const cls = String(el.className).split(' ').slice(0, 2).join('.')
              offenders.push(el.tagName.toLowerCase() + (cls ? '.' + cls : '') + ' w=' + Math.round(r.width) + ' r=' + Math.round(r.right))
            }
          }
          return { overflow: document.documentElement.scrollWidth - W,
                   bands: bands.length, bad: bad.length, offenders: offenders.slice(0, 6) }
        })()`,
        returnByValue: true,
      },
      sessionId,
    )
    const v = probe.result.value
    report(
      v.overflow <= 1 && v.bad === 0,
      `${route.padEnd(14)} furniture at ${width}px keeps its geometry`,
      `overflow ${v.overflow}px · ${v.bad}/${v.bands} bands off-edge · ${(v.offenders ?? []).join(' | ')}`,
    )
  }

  await send('Target.closeTarget', { targetId })
  await send('Target.disposeBrowserContext', { browserContextId })
}

// --- hero collage occlusion ---------------------------------------------------
//
// The home hero is a layered artwork: two sample cards sit at the outside edge
// of a dark practice preview. This checks their real rectangles against the
// preview's text and links, plus page headings, so a future size change cannot
// hide useful copy behind the visual layers.
//
// Below the breakpoint where the cards drop out of absolute positioning and
// become ordinary grid cells, nothing can occlude anything and the check is
// skipped rather than trivially passed.

{
  const { browserContextId } = await send('Target.createBrowserContext', {})
  const { targetId } = await send('Target.createTarget', { url: 'about:blank', browserContextId })
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
  await send('Page.enable', {}, sessionId)

  for (const width of [1440, 1100, 900, 768, 390]) {
    await send(
      'Emulation.setDeviceMetricsOverride',
      {
        width,
        height: 900,
        deviceScaleFactor: 1,
        mobile: width < 700,
      },
      sessionId,
    )
    await send('Page.navigate', { url: `${BASE}/` }, sessionId)
    await sleep(1000)

    const probe = await send(
      'Runtime.evaluate',
      {
        expression: `(() => {
          const box = (el) => {
            const b = el.getBoundingClientRect()
            return { l: b.left, t: b.top, r: b.right, b: b.bottom }
          }
          // Only absolutely-positioned cards can occlude; a static card is in
          // flow and cannot overlap a sibling.
          const floats = [...document.querySelectorAll('.practice-float')]
            .filter((el) => getComputedStyle(el).position === 'absolute')
          if (!floats.length) return JSON.stringify({ skipped: true })

          // Everything a card must not sit on top of: the site header, the
          // preview's own nav and links, and every heading on the page.
          const targets = []
          const header = document.querySelector('header')
          if (header) targets.push({ label: 'site header', el: header })
          for (const el of document.querySelectorAll(
            '.practice-window-nav a, .practice-window-nav span, .practice-window-main a, .practice-window-main h2',
          )) {
            targets.push({
              label: (el.closest('.practice-window-nav') ? 'preview nav ' : 'preview link ') + el.textContent.trim().slice(0, 24),
              el,
            })
          }
          for (const el of document.querySelectorAll('main h1, main h2, main h3')) {
            targets.push({ label: el.tagName + ' "' + el.textContent.trim().slice(0, 28) + '"', el })
          }

          const hits = []
          for (const f of floats) {
            const fb = box(f)
            const name = (f.className.split(' ').find((c) => c.startsWith('practice-float-')) || 'float')
            for (const t of targets) {
              if (f.contains(t.el) || t.el.contains(f)) continue
              const tb = box(t.el)
              if (tb.width === 0 || tb.height === 0) continue
              const x = Math.min(fb.r, tb.r) - Math.max(fb.l, tb.l)
              const y = Math.min(fb.b, tb.b) - Math.max(fb.t, tb.t)
              if (x > 1 && y > 1) {
                hits.push(name + ' covers ' + t.label + ' by ' + Math.round(x) + 'x' + Math.round(y) + 'px')
              }
            }
          }
          return JSON.stringify({ skipped: false, floats: floats.length, hits })
        })()`,
        returnByValue: true,
      },
      sessionId,
    )

    const v = JSON.parse(probe.result.value)
    if (v.skipped) continue
    report(
      v.hits.length === 0,
      `the hero collage clears the nav and headings at ${width}px`,
      v.hits.slice(0, 3).join('; '),
    )
  }

  await send('Target.closeTarget', { targetId })
  await send('Target.disposeBrowserContext', { browserContextId })
}

// The landing hero should use the most recently saved attempt, not its old
// hard-coded example score.
{
  const { browserContextId } = await send('Target.createBrowserContext', {})
  const { targetId } = await send('Target.createTarget', { url: 'about:blank', browserContextId })
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
  await send('Runtime.enable', {}, sessionId)
  await send('Page.enable', {}, sessionId)

  const evaluate = async (expression) => {
    const r = await send(
      'Runtime.evaluate',
      { expression, returnByValue: true, awaitPromise: true },
      sessionId,
    )
    return r.exceptionDetails ? null : r.result.value
  }

  await send('Page.navigate', { url: `${BASE}/` }, sessionId)
  const ready = await waitUntil(sessionId, "document.documentElement.dataset.appReady === 'true'")
  await sleep(300)
  const seeded = await evaluate(`new Promise((resolve) => {
    const open = indexedDB.open('pte-prep')
    open.onerror = () => resolve(false)
    open.onsuccess = () => {
      const db = open.result
      if (!db.objectStoreNames.contains('attempts')) { db.close(); resolve(false); return }
      const tx = db.transaction('attempts', 'readwrite')
      tx.objectStore('attempts').put({
        id: 'browser-check-latest',
        finishedAt: '2026-10-12T10:00:00.000Z',
        overallScore: 73.5,
        overallIsEstimate: true,
      })
      tx.oncomplete = () => { db.close(); resolve(true) }
      tx.onerror = () => { db.close(); resolve(false) }
    }
  })`)
  report(ready && seeded, 'the saved-score fixture is available in local history')

  await send('Page.reload', {}, sessionId)
  const shown = await waitUntil(
    sessionId,
    "document.querySelector('h1')?.textContent?.includes('73.5/90')",
  )
  const details = JSON.parse(
    String(
      await evaluate(`JSON.stringify({
    heading: document.querySelector('h1')?.textContent?.trim() ?? '',
    label: document.querySelector('h1 + p')?.textContent?.trim() ?? '',
    reportLink: [...document.querySelectorAll('a')].some(a => a.href.includes('attempt=browser-check-latest')),
  })`),
    ),
  )
  report(
    shown && /73\.5\/90/.test(details.heading),
    'the homepage shows the latest saved practice score',
    details.heading,
  )
  report(
    details.label.includes('Practice estimate'),
    'the homepage identifies estimated scores as practice estimates',
    details.label,
  )
  report(details.reportLink, 'the homepage links the score to its result report')

  await send('Target.closeTarget', { targetId })
  await send('Target.disposeBrowserContext', { browserContextId })
}

ws.close()
// The whole browser process group is stopped and waited on, so the helper
// processes Chrome spawned go with it and none is left running.
await stopChrome(chrome, profile)

console.log(
  `\n${failures === 0 ? 'ALL BROWSER CHECKS PASSED' : `${failures} BROWSER CHECK(S) FAILED`}\n`,
)
process.exit(failures === 0 ? 0 : 1)
