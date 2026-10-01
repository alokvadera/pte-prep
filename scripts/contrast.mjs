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

import { readFile } from 'node:fs/promises'
import path from 'node:path'

const CSS = await readFile(path.resolve('src/index.css'), 'utf8')

/** Pulls `--color-<name>: #hex;` out of the @theme block. */
function tokens() {
  const out = new Map()
  const re = /--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\s*;/g
  let m
  while ((m = re.exec(CSS))) out.set(m[1], m[2].toLowerCase())
  return out
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16)
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

const T = tokens()
T.set('white', '#ffffff')

/**
 * [foreground, background, minimum, where]
 * 4.5 = body text. 3 = large text (>=24px, or >=18.5px bold) and non-text UI.
 */
const PAIRS = [
  ['ink-900', 'ink-50', 4.5, 'light body text'],
  ['ink-700', 'ink-50', 4.5, 'light passage text'],
  ['ink-600', 'ink-50', 4.5, 'light secondary text'],
  ['ink-500', 'ink-50', 4.5, 'light muted text'],
  ['ink-500', 'white', 4.5, 'light muted text on a card'],
  ['ink-600', 'white', 4.5, 'light secondary on a card'],
  ['ink-500', 'ink-100', 4.5, 'light muted on a tint'],
  ['brand-600', 'white', 4.5, 'light accent text'],
  ['brand-700', 'ink-50', 4.5, 'light accent text on the page'],
  ['mint-700', 'white', 4.5, 'light accent text (checkmarks)'],
  ['mint-700', 'ink-50', 4.5, 'light accent on the page'],
  ['mint-700', 'ink-100', 4.5, 'mint text on a mint tint'],
  ['white', 'brand-500', 4.5, 'primary button'],
  ['white', 'brand-600', 4.5, 'primary button, hover'],
  ['ink-100', 'ink-900', 4.5, 'dark body text'],
  ['ink-200', 'ink-900', 4.5, 'dark passage text'],
  ['ink-300', 'ink-900', 4.5, 'dark secondary text'],
  ['ink-400', 'ink-900', 4.5, 'dark muted text'],
  ['brand-300', 'ink-900', 4.5, 'dark accent text'],
  ['mint-300', 'ink-900', 4.5, 'dark mint text'],
  ['mint-400', 'ink-900', 3, 'dark mint, non-text'],
  ['amber-600', 'ink-50', 4.5, 'light warning text'],
  ['amber-300', 'ink-900', 4.5, 'dark warning text'],
  ['rose-600', 'ink-50', 4.5, 'light error text'],
  ['rose-300', 'ink-900', 4.5, 'dark error text'],
  ['mint-400', 'ink-50', 3, 'light held bar fill'],
  ['amber-500', 'ink-50', 4.5, 'light partial text (bars)'],
  ['ink-850', 'ink-900', 1, 'card surface, decorative'],
  ['brand-500', 'white', 3, 'focus ring, light ground (SC 1.4.11)'],
  ['brand-300', 'ink-900', 3, 'focus ring and dark accent (SC 1.4.11)'],
  ['brand-500', 'ink-50', 3, 'focus ring on the page ground'],
  ['brand-300', 'ink-900', 3, 'dark marks and bullets (SC 1.4.11)'],
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
  const needed = min === 3 ? '3.0' : '4.5'
  console.log(
    `  ${mark}  ${fg} on ${bg}  ${ratio.toFixed(2).padStart(6)}:1  (needs ${needed})  ${where}`,
  )
}

console.log(`\n  ${checked} pairs checked, ${failures} failing\n`)
process.exit(failures === 0 ? 0 : 1)
