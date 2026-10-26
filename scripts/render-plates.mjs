#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Plate renderer — "Calibrated Silence".
//
// Draws the design philosophy as a static artefact. Built as one HTML
// composition and rasterised with headless Chrome, so the typography is real
// typography rather than a facsimile drawn with rectangles.
//
//   node scripts/render-plates.mjs
// ---------------------------------------------------------------------------

import { mkdtemp, writeFile, readFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { stopChrome, spawnChrome } from './lib/chrome.mjs'
import { tmpdir } from 'node:os'
import path from 'node:path'

const ROOT = path.resolve('.')
const OUT_DIR = path.join(ROOT, 'docs', 'design')

const CHROME = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  process.env.CHROME_PATH,
]
  .filter(Boolean)
  .find((p) => existsSync(p))

if (!CHROME) {
  console.log('  No Chrome binary found — skipping the plates.')
  const allowSkip = process.argv.includes('--allow-skip') || process.env.ALLOW_SKIP_BROWSER === '1'
  if ((process.env.CI || process.argv.includes('--strict')) && !allowSkip) {
    console.error(
      '  Failing because Chrome is required in CI or when --strict is passed. Use --allow-skip to bypass.',
    )
    process.exit(1)
  }
  process.exit(0)
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ---------------------------------------------------------------------------
// Typefaces, inlined so the composition is self-contained.
// ---------------------------------------------------------------------------
const FONT_FILES = {
  serif: 'Baloo2-Variable',
  sans: 'Nunito-Variable',
  mono: 'IBMPlexMono-Regular',
}

const fontCss = async () => {
  const parts = []
  for (const [family, file] of Object.entries(FONT_FILES)) {
    const buf = await readFile(path.join(ROOT, 'public', 'fonts', `${file}.woff2`))
    parts.push(
      `@font-face{font-family:'${family}';src:url(data:font/woff2;base64,${buf.toString('base64')}) format('woff2');font-display:block;}`,
    )
  }
  return parts.join('\n')
}

// ---------------------------------------------------------------------------
// The composition
// ---------------------------------------------------------------------------

/** The idea: a score report drawn as a specimen plate. Marks accumulate on a
 *  calibrated axis; the axis is divided into CEFR bands; every reading sits
 *  somewhere on it, and the reader can read the value without being told. */
function composition(fonts) {
  // A deterministic pseudo-random sequence, so the plate is reproducible.
  let seed = 20260930
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed / 2147483648
  }

  // 320 observations of an utterance, drawn as tick heights.
  const marks = []
  let h = 0.4
  for (let i = 0; i < 320; i++) {
    // A speech envelope: a phrase rising and falling, with jitter.
    const phrase = Math.sin(i / 26) * 0.5 + 0.5
    const emphasis = rnd() < 0.06 ? 0.28 : 0
    h = Math.max(0.04, Math.min(1, phrase * 0.72 + rnd() * 0.22 + emphasis))
    marks.push({ h, strong: emphasis > 0 })
  }

  const BANDS = [
    { band: 'C2', from: 85, to: 90 },
    { band: 'C1', from: 76, to: 84 },
    { band: 'B2', from: 59, to: 75 },
    { band: 'B1', from: 43, to: 58 },
    { band: 'A2', from: 30, to: 42 },
    { band: 'A1', from: 10, to: 29 },
  ]

  // The axis geometry, in canvas units.
  const AX = 150 // left edge of the scale
  const AW = 1300 // full width of the scale
  const AY = 1080 // the axis line
  const x = (v) => AX + ((v - 10) / 80) * AW

  const bandMarks = BANDS.map((b) => {
    const x0 = x(b.from)
    const x1 = x(b.to + 1)
    return `<g>
      <line x1="${x0.toFixed(1)}" y1="${AY - 470}" x2="${x0.toFixed(1)}" y2="${AY + 34}" stroke="#141A20" stroke-opacity="0.13" stroke-width="1"/>
      <text x="${((x0 + x1) / 2).toFixed(1)}" y="${AY + 62}" class="mono" font-size="15" fill="#141A20" fill-opacity="0.5" text-anchor="middle" letter-spacing="1.6">${b.band}</text>
    </g>`
  }).join('')

  const ticks = []
  for (let v = 10; v <= 90; v += 5) {
    const major = v % 10 === 0
    const px = x(v)
    ticks.push(
      `<line x1="${px.toFixed(1)}" y1="${AY}" x2="${px.toFixed(1)}" y2="${AY + (major ? 14 : 7)}" stroke="#141A20" stroke-opacity="${major ? 0.5 : 0.28}" stroke-width="1"/>`,
    )
    if (major) {
      ticks.push(
        `<text x="${px.toFixed(1)}" y="${AY + 34}" class="mono" font-size="14" fill="#141A20" fill-opacity="0.55" text-anchor="middle">${v}</text>`,
      )
    }
  }

  // The utterance trace, standing on the axis.
  const colW = AW / marks.length
  const bars = marks
    .map((m, i) => {
      const px = AX + i * colW
      const hpx = m.h * 276
      return `<rect x="${(px + colW * 0.22).toFixed(2)}" y="${(AY - hpx).toFixed(1)}" width="${(colW * 0.56).toFixed(2)}" height="${hpx.toFixed(1)}" fill="${
        m.strong ? '#B0552A' : '#2F6E68'
      }" fill-opacity="${m.strong ? 0.95 : 0.34}"/>`
    })
    .join('')

  // A second, quieter register: the same utterance, one dot per word.
  const wordDots = marks
    .filter((_, i) => i % 3 === 0)
    .map((m, i) => {
      const px = AX + i * colW * 3 + colW
      return `<circle cx="${(px + colW * 0.5).toFixed(1)}" cy="${(AY + 108 + (1 - m.h) * 46).toFixed(1)}" r="${m.strong ? 3.2 : 2.1}" fill="#141A20" fill-opacity="0.34"/>`
    })
    .join('')

  // The reading: where this particular candidate landed.
  const reading = 66
  const rx = x(reading)

  // Reference markers, the way a plate is annotated.
  // Reference markers, the way a plate is annotated. They live in the left
  // margin so nothing can ever cross the headline or the mark field.
  const ref = [
    { y: 508, label: 'FIG. 1', note: 'utterance, 320 marks' },
    { y: 546, label: 'FIG. 2', note: 'scale, calibrated 10—90' },
  ]
    .map(
      (r) => `<g>
      <line x1="150" y1="${r.y - 4}" x2="146" y2="${r.y - 4}" stroke="#B0552A" stroke-width="1.5"/>
      <text x="158" y="${r.y}" class="mono" font-size="13" fill="#B0552A" letter-spacing="1.2">${r.label}</text>
      <text x="256" y="${r.y}" class="sans" font-size="14" fill="#141A20" fill-opacity="0.42">${r.note}</text>
    </g>`,
    )
    .join('')

  // A marginal index, set as a specimen sheet would carry one.
  const indexRows = [
    ['utterance', 'continuous'],
    ['marks', '320'],
    ['reading', String(reading)],
    ['scale', '10—90'],
    ['bands', '6'],
    ['method', 'item response'],
    ['reliability', '0.93'],
  ]
  const index = indexRows
    .map(
      ([k, v], i) => `<g>
      <text x="150" y="${1492 + i * 30}" class="mono" font-size="14" fill="#141A20" fill-opacity="0.42">${k}</text>
      <text x="392" y="${1492 + i * 30}" class="mono" font-size="14" fill="#141A20" fill-opacity="0.78">${v}</text>
      <line x1="150" y1="${1500 + i * 30}" x2="700" y2="${1500 + i * 30}" stroke="#141A20" stroke-opacity="0.08" stroke-width="1"/>
    </g>`,
    )
    .join('')

  // A second register: the same observation counted, band by band.
  const bandColumn = BANDS.map((b, i) => {
    const y = 1492 + i * 30
    const share = (b.to - b.from + 1) / 81
    return `<g>
      <text x="880" y="${y}" class="mono" font-size="14" fill="#141A20" fill-opacity="0.42">${b.band}</text>
      <rect x="940" y="${y - 9}" width="380" height="10" fill="#141A20" fill-opacity="0.07"/>
      <rect x="940" y="${y - 9}" width="${Math.max(3, 380 * share).toFixed(1)}" height="10" fill="#2F6E68" fill-opacity="0.34"/>
      <text x="1400" y="${y}" class="mono" font-size="13" fill="#141A20" fill-opacity="0.5" text-anchor="end">${b.from}—${b.to}</text>
    </g>`
  }).join('')

  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
${fonts}
  * { margin:0; padding:0; box-sizing:border-box; }
  body { width:${W}px; height:${H}px; overflow:hidden; background:#E7E9E3; }
</style></head>
<body>
<!-- The whole plate is one coordinate space, so nothing can drift or overlap. -->
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .serif { font-family:'serif'; }
      .sans  { font-family:'sans'; }
      .mono  { font-family:'mono'; }
    </style>
    <!-- A faint tooth, as on a printed sheet. Never a texture you notice. -->
    <pattern id="tooth" width="3" height="3" patternUnits="userSpaceOnUse">
      <rect width="3" height="3" fill="#E7E9E3"/>
      <line x1="0" y1="0" x2="0" y2="3" stroke="#141A20" stroke-opacity="0.016" stroke-width="1"/>
    </pattern>
    <clipPath id="plate"><rect x="90" y="90" width="1420" height="1660"/></clipPath>
  </defs>

  <rect width="${W}" height="${H}" fill="#E7E9E3"/>
  <rect width="${W}" height="${H}" fill="url(#tooth)"/>

  <g clip-path="url(#plate)">
    <!-- Frame: one hairline, inset. Structure by rule, not by panel. -->
    <rect x="90.5" y="90.5" width="1419" height="1659" fill="none" stroke="#141A20" stroke-opacity="0.2" stroke-width="1"/>

    <!-- Plate mark -->
    <text x="150" y="196" class="mono" font-size="13" fill="#141A20" fill-opacity="0.42" letter-spacing="3.4">PLATE ONE</text>
    <line x1="150" y1="213" x2="1450" y2="213" stroke="#141A20" stroke-opacity="0.2" stroke-width="1"/>

    <!-- The one large moment: type as image. -->
    <text x="150" y="324" class="serif" font-size="106" fill="#141A20" letter-spacing="-1.5">Proficiency,</text>
    <text x="150" y="428" class="serif" font-size="106" fill="#141A20" fill-opacity="0.32" font-style="italic">observed.</text>

    ${ref}

    <!-- Band divisions through the plot area. -->
    ${bandMarks}

    <!-- The utterance: marks standing on their axis. -->
    ${bars}
    ${wordDots}

    <!-- The axis itself, and its figures. -->
    <line x1="150" y1="${AY}" x2="1450" y2="${AY}" stroke="#141A20" stroke-opacity="0.6" stroke-width="1.5"/>
    ${ticks.join('')}

    <!-- The reading: one vertical, everything else context. -->
    <line x1="${rx.toFixed(1)}" y1="${AY - 300}" x2="${rx.toFixed(1)}" y2="${AY + 22}" stroke="#B0552A" stroke-width="1.5"/>
    <circle cx="${rx.toFixed(1)}" cy="${AY - 300}" r="4.5" fill="#B0552A"/>
    <text x="${rx.toFixed(1)}" y="${AY - 322}" class="mono" font-size="18" fill="#B0552A" text-anchor="middle" letter-spacing="1">${reading}</text>

    <line x1="150" y1="${AY + 196}" x2="1450" y2="${AY + 196}" stroke="#141A20" stroke-opacity="0.12" stroke-width="1"/>
    <text x="150" y="${AY + 232}" class="sans" font-size="15" fill="#141A20" fill-opacity="0.4">axis 10—90, divided at the six bands</text>

    <!-- Marginal index, as a specimen sheet carries one. -->
    <line x1="150" y1="1442" x2="1450" y2="1442" stroke="#141A20" stroke-opacity="0.2" stroke-width="1"/>
    ${index}
    ${bandColumn}

    <text x="1450" y="1740" class="serif" font-size="31" fill="#141A20" fill-opacity="0.28" text-anchor="end" font-style="italic">calibrated silence</text>
  </g>
</svg>
</body></html>`
}

// ---------------------------------------------------------------------------
// Rasterise
// ---------------------------------------------------------------------------

const W = 1600
const H = 1850

async function render(html, outPath) {
  const profile = await mkdtemp(path.join(tmpdir(), 'plate-'))
  const port = 9500 + Math.floor(Math.random() * 300)
  const chrome = spawnChrome(CHROME, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--hide-scrollbars',
    `--window-size=${W},${H}`,
    'about:blank',
  ])

  try {
    for (let i = 0; i < 80; i++) {
      try {
        const r = await fetch(`http://127.0.0.1:${port}/json/version`)
        if (r.ok) break
      } catch {
        /* not up yet */
      }
      await sleep(200)
    }
    const version = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json()
    const ws = new WebSocket(version.webSocketDebuggerUrl)
    let id = 1
    const pending = new Map()
    ws.addEventListener('message', (e) => {
      const m = JSON.parse(e.data)
      if (m.id && pending.has(m.id)) {
        const { resolve, reject } = pending.get(m.id)
        pending.delete(m.id)
        if (m.error) reject(new Error(m.error.message))
        else resolve(m.result)
      }
    })
    await new Promise((res, rej) => {
      ws.addEventListener('open', res, { once: true })
      ws.addEventListener('error', rej, { once: true })
    })
    const send = (method, params = {}, sessionId) =>
      new Promise((resolve, reject) => {
        const i = id++
        pending.set(i, { resolve, reject })
        ws.send(JSON.stringify({ id: i, method, params, sessionId }))
      })

    const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
    await send('Page.enable', {}, sessionId)
    await send(
      'Emulation.setDeviceMetricsOverride',
      { width: W, height: H, deviceScaleFactor: 1, mobile: false },
      sessionId,
    )
    await send(
      'Page.navigate',
      { url: `data:text/html;charset=utf-8,${encodeURIComponent(html)}` },
      sessionId,
    )
    await sleep(2200)
    const shot = await send(
      'Page.captureScreenshot',
      { format: 'png', captureBeyondViewport: false },
      sessionId,
    )
    await writeFile(outPath, Buffer.from(shot.data, 'base64'))
    ws.close()
    return true
  } finally {
    // The whole browser process group is stopped and waited on, so the helper
    // processes Chrome spawned go with it and none is left running.
    await stopChrome(chrome, profile)
  }
}

const fonts = await fontCss()
// The output directory is not guaranteed to exist on a clean checkout, so it
// is created here rather than relying on a committed folder being present.
await mkdir(OUT_DIR, { recursive: true })
await render(composition(fonts), path.join(OUT_DIR, 'plate-01.png'))
console.log('  ✓ docs/design/plate-01.png')
console.log('\n  Plates rendered.\n')
