#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Contrast audit.
//
// WCAG 1.4.3 requires 4.5:1 for body text and 3:1 for large text and non-text
// UI. Colour tokens are the most common source of silent failures in a design
// system, because nothing complains when a step is nudged two shades too dark.
//
// This reads the tokens out of src/index.css, computes the WCAG relative
// luminance of every documented foreground/background pair, and fails on any
// pair that misses its threshold. Run with: node scripts/contrast.mjs
// ---------------------------------------------------------------------------

import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

const CSS = await readFile(path.resolve('src/index.css'), 'utf8')

function normalizeHex(hex) {
  let h = hex.slice(1).toLowerCase()
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
  } else if (h.length === 8) {
    h = h.slice(0, 6)
  }
  return `#${h}`
}

/**
 * Pulls `--color-<name>: #hex;` out of the @theme block.
 *
 * Also indexes the bare hexes used as chart series colours in
 * `src/content/charts*.ts`. Those are literal values in data files rather than
 * tokens, so they would otherwise be uncheckable — which is how a fill that
 * vanishes against the navy ground could sit in the bank unnoticed. Keyed
 * without the leading `#`.
 */
async function tokens() {
  const out = new Map()
  const re = /--color-([a-z0-9-]+):\s*(#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3}))\s*;/g
  let m
  while ((m = re.exec(CSS))) out.set(m[1], normalizeHex(m[2]))

  const contentDir = path.resolve('src/content')
  const files = (await readdir(contentDir)).filter((f) => /^charts.*\.ts$/.test(f))
  const chartRe = /color:\s*(['"]?)(#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3}))\1/g
  for (const file of files) {
    const charts = await readFile(path.join(contentDir, file), 'utf8')
    chartRe.lastIndex = 0
    while ((m = chartRe.exec(charts))) {
      const normalized = normalizeHex(m[2])
      out.set(`chart${normalized}`, normalized)
    }
  }

  return out
}

function hexToRgb(hex) {
  const norm = normalizeHex(hex).slice(1)
  const n = parseInt(norm, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(fg, bg) {
  const a = luminance(fg)
  const b = luminance(bg)
  const [hi, lo] = a > b ? [a, b] : [b, a]
  return (hi + 0.05) / (lo + 0.05)
}

const T = await tokens()
T.set('white', '#ffffff')

/**
 * [foreground, background, minimum, where]
 * 4.5 = body text. 3 = large text (>=24px, or >=18.5px bold) and non-text UI.
 */
const PAIRS = [
  /* --- Light scheme ------------------------------------------------------- */
  ['ink-900', 'ink-50', 4.5, 'light body text'],
  ['ink-700', 'ink-50', 4.5, 'light passage text'],
  ['ink-600', 'ink-50', 4.5, 'light secondary text'],
  ['ink-500', 'ink-50', 4.5, 'light muted text'],
  ['ink-500', 'ink-100', 4.5, 'muted label on the tinted ground'],
  ['ink-500', 'white', 4.5, 'light muted text on a panel'],
  ['ink-600', 'white', 4.5, 'light secondary on a panel'],
  /* ink-400 is a rule, a border or a large mark — never body text. Audited at
     the 3:1 non-text bar on purpose; treating it as body copy is the mistake
     that shipped a 2.32:1 footer separator. */
  ['ink-400', 'ink-50', 3, 'light rule / large mark (not body text)'],
  ['brand-600', 'white', 4.5, 'action ink on a panel'],
  ['brand-700', 'ink-50', 4.5, 'action ink on the page'],
  ['mark-600', 'ink-50', 4.5, 'the mark (lost point, attention) on the page'],
  ['mark-600', 'white', 4.5, 'the mark on a panel'],
  ['mint-700', 'white', 4.5, 'held text on a panel'],
  ['mint-700', 'ink-50', 4.5, 'held text on the page'],
  ['mint-700', 'ink-100', 4.5, 'held text on a tint'],
  ['amber-700', 'ink-50', 4.5, 'caution text on the page'],
  ['amber-600', 'ink-50', 4.5, 'caution text'],
  ['white', 'ink-900', 4.5, 'primary button (indigo fill, e.g. num markers)'],
  ['ink-900', 'mint-500', 4.5, 'CtaBand + candy buttons: indigo label on green'],
  ['ink-900', 'amber-400', 4.5, 'btn-orange: indigo label on the orange fill'],
  ['white', 'ink-700', 4.5, 'primary button, hover'],
  ['ink-900', 'ink-50', 4.5, 'primary button text in dark mode (inverted fill)'],
  ['mint-400', 'ink-50', 3, 'held bar fill'],
  ['mark-500', 'ink-50', 3, 'score marker fill'],
  ['amber-500', 'ink-50', 4.5, 'caution bar text'],
  ['rose-600', 'ink-50', 4.5, 'lost point text'],

  /* --- Dark scheme --------------------------------------------------------
     Audited against all three grounds the app renders text on: the page
     (ink-900), a route column (ink-950) and a solid panel (ink-850). */
  ['ink-100', 'ink-900', 4.5, 'dark body text'],
  ['ink-200', 'ink-900', 4.5, 'dark passage text'],
  ['ink-on-dark', 'ink-900', 4.5, 'dark text step 1 (page ground)'],
  ['ink-on-dark', 'ink-950', 4.5, 'dark text step 1 (route ground)'],
  ['ink-on-dark', 'ink-850', 4.5, 'dark text step 1 (solid panel)'],
  ['ink-on-dark-muted', 'ink-900', 4.5, 'dark muted text (page ground)'],
  ['ink-on-dark-muted', 'ink-950', 4.5, 'dark muted text (route ground)'],
  ['ink-on-dark-muted', 'ink-850', 4.5, 'dark muted text (solid panel)'],
  ['ink-on-dark-faint', 'ink-900', 4.5, 'dark faint text (page ground)'],
  ['ink-on-dark-faint', 'ink-950', 4.5, 'dark faint text (route ground)'],
  ['ink-on-dark-faint', 'ink-850', 4.5, 'dark faint text (solid panel)'],
  ['brand-300', 'ink-900', 4.5, 'dark action ink'],
  ['brand-300', 'ink-950', 4.5, 'dark action ink on the route ground'],
  ['mark-300', 'ink-900', 4.5, 'dark mark text'],
  ['mark-400', 'ink-900', 4.5, 'dark mark, stronger'],
  ['mint-300', 'ink-900', 4.5, 'dark held text'],
  ['mint-300', 'ink-850', 4.5, 'dark held text on a panel'],
  ['amber-300', 'ink-900', 4.5, 'dark caution text'],
  ['rose-300', 'ink-900', 4.5, 'dark lost point text'],

  /* Non-text marks: SC 1.4.11 asks for 3:1. */
  ['ink-on-dark-faint', 'ink-900', 3, 'dark rules, dots, disabled marks'],
  ['ink-on-dark-faint', 'ink-950', 3, 'dark marks on the route ground'],
  ['mint-400', 'ink-900', 3, 'dark held mark, non-text'],
  ['mark-400', 'ink-900', 3, 'dark focus ring and marks'],
  ['brand-300', 'ink-900', 3, 'dark neutral marks'],

  /* Score rail bands (ScoreRangeBar) — bar fills, so 3:1. */
  ['mint-400', 'ink-50', 3, 'score band C2, light'],
  ['mint-300', 'ink-900', 3, 'score band C2, dark'],
  ['brand-600', 'ink-50', 3, 'score band C1, light'],
  ['brand-300', 'ink-900', 3, 'score band C1, dark'],
  ['amber-brand', 'ink-50', 3, 'score band B2, light'],
  ['amber-300', 'ink-900', 3, 'score band B2, dark'],
  ['amber-600', 'ink-50', 3, 'score band B1, light'],
  ['amber-400', 'ink-900', 3, 'score band B1, dark'],
  ['rose-brand', 'ink-50', 3, 'score band A2, light'],
  ['rose-300', 'ink-900', 3, 'score band A2, dark'],
  ['rose-400', 'ink-900', 3, 'score band A1, dark'],
  ['ink-400', 'ink-50', 3, 'score band fallback, light'],

  /* Chart series marks: literal hexes in src/content/charts*.ts. A playful
     set chosen to clear 3:1 on BOTH the white light card and the indigo
     dark ground (the working band is luminance ~0.19-0.30). */
  ['chart#3b82f6', 'ink-900', 3, 'chart series blue, dark ground'],
  ['chart#3b82f6', 'white', 3, 'chart series blue, light ground'],
  ['chart#8b5cf6', 'ink-900', 3, 'chart series purple, dark ground'],
  ['chart#8b5cf6', 'white', 3, 'chart series purple, light ground'],
  ['chart#7c8aa3', 'ink-900', 3, 'chart series grey, dark ground'],
  ['chart#7c8aa3', 'white', 3, 'chart series grey, light ground'],
  ['chart#e85b9b', 'ink-900', 3, 'chart series pink, dark ground'],
  ['chart#e85b9b', 'white', 3, 'chart series pink, light ground'],
  ['chart#2f9a63', 'ink-900', 3, 'chart series green, dark ground'],
  ['chart#2f9a63', 'white', 3, 'chart series green, light ground'],
  ['chart#d97706', 'ink-900', 3, 'chart series orange, dark ground'],
  ['chart#d97706', 'white', 3, 'chart series orange, light ground'],

  /* A panel ground is decorative: separated by a hairline, carrying no text of
     its own, so 1:1 is the honest bar. */
  ['ink-850', 'ink-900', 1, 'panel surface, decorative (border carries the edge)'],
]

console.log('\n  Contrast audit (WCAG 1.4.3 / 1.4.11)\n')
let failures = 0
let checked = 0

for (const [fg, bg, min, where] of PAIRS) {
  const f = T.get(fg)
  const b = T.get(bg)
  if (!f || !b) {
    console.log(`  ??   ${fg} on ${bg} — token not found`)
    failures += 1
    continue
  }
  checked += 1
  const ratio = contrast(f, b)
  const pass = ratio >= min
  if (!pass) failures += 1
  const mark = pass ? 'ok  ' : 'FAIL'
  const needed = min === 1 ? 'none (decorative)' : min.toFixed(1)
  console.log(
    `  ${mark}  ${fg} on ${bg}  ${ratio.toFixed(2).padStart(6)}:1  (needs ${needed})  ${where}`,
  )
}

console.log(`\n  ${checked} pairs checked, ${failures} failing\n`)
process.exit(failures === 0 ? 0 : 1)
