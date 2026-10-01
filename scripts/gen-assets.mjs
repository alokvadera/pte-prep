#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Brand asset generator.
//
// Produces the PWA icons and the Open Graph image as real PNGs using a minimal
// encoder built on Node's zlib, so the repository carries no binary blobs that
// cannot be regenerated. Run with: npm run assets
// ---------------------------------------------------------------------------

import { deflateSync } from 'node:zlib'
import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

// --- minimal PNG encoder ---------------------------------------------------

function crc32(buf) {
  let c
  const table = crc32.table ?? (crc32.table = (() => {
    const t = new Int32Array(256)
    for (let n = 0; n < 256; n++) {
      c = n
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      t[n] = c
    }
    return t
  })())
  let crc = -1
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
  return (crc ^ -1) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([len, body, crc])
}

/** `pixels` is RGBA, row-major, length width*height*4. */
function encodePng(width, height, pixels) {
  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0 // filter: none
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride)
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // colour type RGBA
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// --- drawing helpers -------------------------------------------------------

function lerp(a, b, t) {
  return a + (b - a) * t
}

function mix(c1, c2, t) {
  return [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)]
}

class Canvas {
  constructor(w, h) {
    this.w = w
    this.h = h
    this.data = Buffer.alloc(w * h * 4)
  }

  blend(x, y, [r, g, b], a = 1) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h || a <= 0) return
    const i = (y * this.w + x) * 4
    const inv = 1 - a
    this.data[i] = Math.round(this.data[i] * inv + r * a)
    this.data[i + 1] = Math.round(this.data[i + 1] * inv + g * a)
    this.data[i + 2] = Math.round(this.data[i + 2] * inv + b * a)
    this.data[i + 3] = Math.max(this.data[i + 3], Math.round(255 * a))
  }

  /** Signed-distance rounded rectangle with a soft edge. */
  roundRect(x0, y0, w, h, radius, colour, alpha = 1) {
    const x1 = x0 + w
    const y1 = y0 + h
    const r = Math.min(radius, w / 2, h / 2)
    for (let y = Math.floor(y0) - 1; y <= Math.ceil(y1) + 1; y++) {
      for (let x = Math.floor(x0) - 1; x <= Math.ceil(x1) + 1; x++) {
        const cx = Math.max(x0 + r, Math.min(x, x1 - r))
        const cy = Math.max(y0 + r, Math.min(y, y1 - r))
        const dx = x - cx
        const dy = y - cy
        const dist = Math.hypot(dx, dy) - r
        const cover = Math.max(0, Math.min(1, 0.5 - dist))
        if (cover > 0) this.blend(x, y, colour, cover * alpha)
      }
    }
  }

  /** Draws a capital P using rectangles, so the mark needs no font. */
  monogram(cx, cy, size, colour) {
    const u = size / 100
    const left = cx - 34 * u
    const top = cy - 50 * u
    const stem = 20 * u
    // Stem
    this.roundRect(left, top, stem, 100 * u, 5 * u, colour)
    // Bowl: outer bar, right stem, and two cross bars
    this.roundRect(left, top, 66 * u, 22 * u, 5 * u, colour)
    this.roundRect(left + 46 * u, top, 20 * u, 52 * u, 5 * u, colour)
    this.roundRect(left, top + 30 * u, 66 * u, 22 * u, 5 * u, colour)
  }

  background(topLeft, topRight, bottomLeft) {
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const tx = x / this.w
        const ty = y / this.h
        const top = mix(topLeft, topRight, tx)
        const colour = mix(top, bottomLeft, ty)
        this.blend(x, y, colour, 1)
      }
    }
  }

  /** Soft radial glow, used to keep large flat areas from looking dead. */
  glow(cx, cy, radius, colour, strength = 0.35) {
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const d = Math.hypot(x - cx, y - cy) / radius
        if (d >= 1) continue
        const a = (1 - d) ** 2 * strength
        this.blend(x, y, colour, a)
      }
    }
  }

  toPng() {
    return encodePng(this.w, this.h, this.data)
  }
}

// The same tokens as src/index.css, so the marks and the site are one system.
const BRAND_TEAL = [47, 110, 104]
const BRAND_TEAL_DEEP = [36, 84, 79]
const OXIDE = [140, 58, 58]
const PAPER = [231, 233, 227]
const INK_DEEP = [8, 12, 11]
const WHITE = [255, 255, 255]

// --- icon ------------------------------------------------------------------

function appIcon(size, { maskable = false } = {}) {
  const c = new Canvas(size, size)
  c.background(BRAND_TEAL_DEEP, [14, 30, 32], INK_DEEP)
  c.glow(size * 0.3, size * 0.22, size * 0.75, BRAND_TEAL, 0.55)
  c.glow(size * 0.82, size * 0.85, size * 0.65, OXIDE, 0.26)

  // Maskable icons must keep their content inside the safe zone (80% of the
  // canvas) or platform masks will clip it.
  const inset = maskable ? 0.2 : 0.13
  const box = size * (1 - inset * 2)
  const radius = maskable ? box * 0.5 : box * 0.26

  // Card plate
  c.roundRect(size * inset, size * inset, box, box, radius, [255, 255, 255], 0.1)
  c.roundRect(size * inset, size * inset, box, box, radius, BRAND_TEAL, 0.26)

  c.monogram(size / 2, size / 2, box * 0.62, WHITE)
  return c.toPng()
}

// --- Open Graph card -------------------------------------------------------

function ogImage() {
  const W = 1200
  const H = 630
  const c = new Canvas(W, H)
  c.background([20, 52, 50], [16, 28, 30], INK_DEEP)
  c.glow(W * 0.16, H * 0.1, W * 0.6, BRAND_TEAL, 0.5)
  c.glow(W * 0.92, H * 0.95, W * 0.55, OXIDE, 0.26)

  // Left accent bar standing in for the progress bar in the app.
  c.roundRect(72, 96, 12, 438, 6, PAPER, 0.9)

  // Mark
  c.roundRect(72, 96, 116, 116, 30, WHITE, 0.14)
  c.monogram(130, 154, 74, WHITE)

  // Question navigator motif: a grid of item cells, some answered and some not,
  // which is what the test runner actually looks like.
  const gridX = 232
  const gridY = 250
  const cell = 56
  const gap = 12
  const cols = 6
  for (let r = 0; r < 3; r++) {
    for (let col = 0; col < cols; col++) {
      const i = r * cols + col
      const answered = [0, 1, 2, 3, 5, 6, 7, 9, 10, 12, 13].includes(i)
      const flagged = i === 8
      const x = gridX + col * (cell + gap)
      const y = gridY + r * (cell + gap)
      if (answered) {
        c.roundRect(x, y, cell, cell, 12, BRAND_TEAL, 0.8)
      } else {
        c.roundRect(x, y, cell, cell, 12, WHITE, 0.12)
      }
      if (flagged) c.roundRect(x + cell - 12, y - 4, 16, 16, 8, OXIDE, 0.95)
    }
  }

  // Answer lines beneath the grid, echoing a reading passage.
  for (let i = 0; i < 3; i++) {
    const y = gridY + 3 * (cell + gap) + 14 + i * 30
    const w = 420 - i * 96
    c.roundRect(gridX, y, w, 12, 6, WHITE, 0.12)
  }

  // Progress mock, mirroring the score card in the app.
  const panelX = 720
  const panelY = 96
  const panelW = 408
  const panelH = 438
  c.roundRect(panelX, panelY, panelW, panelH, 28, WHITE, 0.08)
  c.roundRect(panelX, panelY, panelW, panelH, 28, BRAND_TEAL, 0.2)

  // A linear range bar rather than a donut: length carries magnitude, and it
  // can show where the score sits against its band, which an arc cannot.
  const ax = panelX + 44
  const ay = panelY + 66
  const aw = panelW - 88
  const BANDS = [
    [10, 29],
    [30, 42],
    [43, 58],
    [59, 75],
    [76, 84],
    [85, 90],
  ]
  for (const [from, to] of BANDS) {
    const x0 = ax + ((from - 10) / 80) * aw
    const w = ((to - from + 1) / 80) * aw
    c.roundRect(x0, ay, w, 12, 3, WHITE, 0.09)
  }
  const score = 61
  const scoreW = ((score - 10) / 80) * aw
  c.roundRect(ax, ay, scoreW, 12, 3, PAPER, 0.92)
  // The marker, so the value reads without relying on fill colour.
  c.roundRect(ax + scoreW - 2, ay - 8, 4, 28, 2, WHITE, 0.95)
  c.roundRect(ax, ay + 26, aw, 3, 1, WHITE, 0.12)

  // Skill bars
  // One dimension, one hue: the accent carries the value, the oxide marks the
  // one that needs work.
  const skills = [
    { w: 0.78, colour: BRAND_TEAL },
    { w: 0.7, colour: BRAND_TEAL },
    { w: 0.62, colour: BRAND_TEAL },
    { w: 0.58, colour: OXIDE },
  ]
  const barX = panelX + 44
  const barW = panelW - 88
  skills.forEach((s, i) => {
    const y = panelY + 172 + i * 46
    c.roundRect(barX, y, barW, 12, 3, WHITE, 0.11)
    c.roundRect(barX, y, barW * s.w, 12, 3, s.colour, 0.95)
  })

  return c.toPng()
}

// --- write -----------------------------------------------------------------

const OUT = path.resolve('public')
await mkdir(OUT, { recursive: true })

const files = [
  ['icon-192.png', appIcon(192)],
  ['icon-512.png', appIcon(512)],
  ['icon-maskable.png', appIcon(512, { maskable: true })],
  ['apple-touch-icon.png', appIcon(180)],
  ['og-default.png', ogImage()],
]

for (const [name, buffer] of files) {
  await writeFile(path.join(OUT, name), buffer)
  console.log(`  ✓ public/${name.padEnd(22)} ${(buffer.length / 1024).toFixed(1)} kB`)
}

console.log('\n  Brand assets generated.\n')
