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
  const table =
    crc32.table ??
    (crc32.table = (() => {
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

// The palette mirrors src/index.css, so the marks and the site are one system:
// graphite ink on paper, with one vermilion that only ever means "a mark".
const INK = [16, 21, 24] // --color-ink-900
const INK_DEEP = [10, 14, 16] // --color-ink-950
const PAPER = [255, 255, 255] // --color-ink-50
const WASH = [244, 246, 247] // --color-ink-100
const RULE = [223, 227, 230] // --color-ink-200
const MARK = [212, 42, 30] // --color-mark-500
const WHITE = [255, 255, 255]

// --- icon ------------------------------------------------------------------

/**
 * A white plate on ink, carrying the monogram and one red corner mark. No
 * gradient and no glow: the system separated surfaces with a hairline, and an
 * icon is the one place there is no room for a hairline, so the separation is
 * the plate against the ground.
 */
function appIcon(size, { maskable = false } = {}) {
  const c = new Canvas(size, size)
  c.background(INK_DEEP, INK_DEEP, INK)

  // Maskable icons must keep their content inside the safe zone (80% of the
  // canvas) or platform masks will clip it.
  const inset = maskable ? 0.2 : 0.12
  const box = size * (1 - inset * 2)
  const radius = box * 0.08

  c.roundRect(size * inset, size * inset, box, box, radius, WHITE, 1)
  c.monogram(size / 2, size / 2 - box * 0.03, box * 0.58, INK)

  // The mark: a red square in the corner of the plate.
  const markSize = box * 0.18
  c.roundRect(
    size * inset + box - markSize - box * 0.08,
    size * inset + box - markSize - box * 0.08,
    markSize,
    markSize,
    markSize * 0.1,
    MARK,
    1,
  )
  return c.toPng()
}

// --- Open Graph card -------------------------------------------------------

function ogImage() {
  const W = 1200
  const H = 630
  const c = new Canvas(W, H)
  c.background(WASH, WASH, PAPER)

  // A heavy top rule, the same device the site opens its sections with.
  c.roundRect(0, 0, W, 8, 0, INK, 1)

  // Mark plate and monogram.
  c.roundRect(72, 84, 104, 104, 8, INK, 1)
  c.monogram(124, 136, 66, WHITE)

  // Question navigator: the grid of item cells the test runner actually shows,
  // answered cells in ink, one flagged in the mark colour.
  const gridX = 236
  const gridY = 132
  const cell = 52
  const gap = 12
  const cols = 6
  for (let r = 0; r < 3; r++) {
    for (let col = 0; col < cols; col++) {
      const i = r * cols + col
      const answered = [0, 1, 2, 3, 5, 6, 7, 9, 10, 12, 13].includes(i)
      const flagged = i === 8
      const x = gridX + col * (cell + gap)
      const y = gridY + r * (cell + gap)
      c.roundRect(x, y, cell, cell, 3, answered ? INK : RULE, answered ? 0.92 : 1)
      if (flagged) c.roundRect(x + cell - 10, y - 6, 14, 14, 2, MARK, 1)
    }
  }

  // Answer rules beneath the grid, echoing a printed answer sheet.
  for (let i = 0; i < 3; i++) {
    const y = gridY + 3 * (cell + gap) + 26 + i * 26
    const w = 360 - i * 84
    c.roundRect(gridX, y, w, 6, 0, RULE, 1)
  }

  // The score scale: one axis, the value drawn in ink, the marker in the mark.
  const ax = 72
  const ay = 452
  const aw = W - 144
  c.roundRect(ax, ay, aw, 1, 0, RULE, 1)
  const score = 61
  const scoreW = ((score - 10) / 80) * aw
  c.roundRect(ax, ay - 3, scoreW, 7, 0, INK, 1)
  for (const t of [10, 30, 50, 65, 79, 90]) {
    const x = ax + ((t - 10) / 80) * aw
    c.roundRect(x, ay - 6, 1, 13, 0, RULE, 1)
  }
  c.roundRect(ax + scoreW - 2, ay - 30, 4, 34, 0, MARK, 1)

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
