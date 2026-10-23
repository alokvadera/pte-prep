#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Renders the Select Missing Word clips from the bank.
//
// Every SMW item is one turn of a longer conversation with a single word taken
// out, and the item's own clip is the only asset that can be played for it: the
// parent conversation runs for a minute and speaks the word the item asks for.
// Nothing else in the repo can produce these files, so the rule for how a clip
// is built lives here as executable code rather than in a commit message.
//
// The clip is the turn spoken with the word at `wordIndex` replaced by a 1 kHz
// beep, which is what the item's prompt tells the candidate to listen for and
// what the speech-synthesis fallback already does when a clip is missing. The
// text either side of the blank is synthesized in two calls and spliced, because
// no TTS endpoint here can place a beep mid-utterance.
//
//   FISHAUDIO_API_KEY=... node scripts/render-smw-clips.mjs
//   FISHAUDIO_API_KEY=... node scripts/render-smw-clips.mjs --ids smw-1,smw-3
//   node scripts/render-smw-clips.mjs --verify-only
//
// Options:
//   --ids a,b        render only these items (default: every item in the bank)
//   --no-beep        splice the two halves with silence, the way the original
//                    pass did, instead of beeping over the blank
//   --verify-only    re-measure the clips on disk without rendering anything
//   --manifest       refresh the SMW rows of src/content/audioManifest.json
// ---------------------------------------------------------------------------

import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const ROOT = resolve(__dirname, '..')
const AUDIO_DIR = join(ROOT, 'public', 'audio')
const SAMPLE_RATE = 44100

const args = process.argv.slice(2)
const flag = (name) => args.includes(name)
const value = (name) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : undefined
}

const VERIFY_ONLY = flag('--verify-only')
const NO_BEEP = flag('--no-beep')
const UPDATE_MANIFEST = flag('--manifest')
const ONLY = value('--ids')?.split(',').map((s) => s.trim()).filter(Boolean)

// --- The bank ---------------------------------------------------------------
// The item data lives in TypeScript, so it is read through tsx rather than
// duplicated here. The dump also asserts the invariant the clips depend on: the
// word that gets removed is the word the key names.
const dumpSource = (outFile) => `
import { writeFileSync } from 'node:fs'
import { BANK, AUDIO_INDEX } from '${ROOT.split('\\').join('/')}/src/content/bank'
import { mapConversationVoices } from '${ROOT.split('\\').join('/')}/scripts/render-conversations.mjs'
const bare = (v: string) => v.toLowerCase().replace(/[^a-z']/g, '')
const out: unknown[] = []
for (const m of BANK.missingWord) {
  const script = AUDIO_INDEX.get(m.audioId)
  const turn = script?.turns[m.turnIndex]
  if (!turn) throw new Error('missing word ' + m.id + ': no turn ' + m.turnIndex)
  const words = turn.text.split(/\\s+/)
  const key = m.options[m.correct]
  if (bare(words[m.wordIndex] ?? '') !== bare(key)) {
    throw new Error('missing word ' + m.id + ': blank "' + words[m.wordIndex] + '" is not the key "' + key + '"')
  }
  const voices = script ? mapConversationVoices(script) : []
  const assigned = voices.find(v => v.speakerId === turn.speaker)
  out.push({
    id: m.id,
    audioId: m.audioId,
    turnIndex: m.turnIndex,
    wordIndex: m.wordIndex,
    voiceId: assigned?.voice?.id || null,
    answer: key,
    preText: words.slice(0, m.wordIndex).join(' '),
    postText: words.slice(m.wordIndex + 1).join(' '),
  })
}
writeFileSync('${outFile}', JSON.stringify(out))
`

function readBank(scratch) {
  const source = join(scratch, 'dump-smw.ts')
  const out = join(scratch, 'items.json')
  writeFileSync(source, dumpSource(out))
  execFileSync('npx', ['tsx', '--tsconfig', 'tsconfig.scripts.json', source], { cwd: ROOT, stdio: ['ignore', 'ignore', 'inherit'] })
  return JSON.parse(readFileSync(out, 'utf-8'))
}

// --- WAV plumbing -----------------------------------------------------------
// Both halves come back as 44.1 kHz mono mp3 and are spliced as PCM, so the
// joined file is one clean WAV that afconvert can encode in a single pass.

function readWav(file) {
  const buf = readFileSync(file)
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WAVE') {
    throw new Error(`${file} is not a WAV`)
  }
  let offset = 12
  let fmt = null
  let data = null
  while (offset + 8 <= buf.length) {
    const id = buf.toString('ascii', offset, offset + 4)
    const size = buf.readUInt32LE(offset + 4)
    const body = buf.subarray(offset + 8, offset + 8 + size)
    if (id === 'fmt ') fmt = { channels: body.readUInt16LE(2), rate: body.readUInt32LE(4), bits: body.readUInt16LE(14) }
    if (id === 'data') data = body
    offset += 8 + size + (size % 2)
  }
  if (!fmt || !data) throw new Error(`${file} has no fmt/data chunk`)
  if (fmt.channels !== 1 || fmt.bits !== 16) throw new Error(`${file} is not mono 16-bit`)
  if (fmt.rate !== SAMPLE_RATE) throw new Error(`${file} is ${fmt.rate} Hz, expected ${SAMPLE_RATE}`)
  return data
}

function silencePcm(seconds) {
  return Buffer.alloc(Math.round(seconds * SAMPLE_RATE) * 2)
}

function beepPcm(seconds = 0.35, freq = 750, volume = 0.12) {
  const samples = Math.round(seconds * SAMPLE_RATE)
  const fade = Math.round(SAMPLE_RATE * 0.02)
  const out = Buffer.alloc(samples * 2)
  for (let i = 0; i < samples; i++) {
    let gain = 1
    if (i < fade) gain = 0.5 * (1 - Math.cos((Math.PI * i) / fade))
    else if (i > samples - fade) gain = 0.5 * (1 - Math.cos((Math.PI * (samples - i)) / fade))
    out.writeInt16LE(Math.round(volume * gain * 32767 * Math.sin((2 * Math.PI * freq * i) / SAMPLE_RATE)), i * 2)
  }
  return out
}

function writeWav(file, pcm) {
  const header = Buffer.alloc(44)
  header.write('RIFF', 0, 'ascii')
  header.writeUInt32LE(36 + pcm.length, 4)
  header.write('WAVE', 8, 'ascii')
  header.write('fmt ', 12, 'ascii')
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20)
  header.writeUInt16LE(1, 22)
  header.writeUInt32LE(SAMPLE_RATE, 24)
  header.writeUInt32LE(SAMPLE_RATE * 2, 28)
  header.writeUInt16LE(2, 32)
  header.writeUInt16LE(16, 34)
  header.write('data', 36, 'ascii')
  header.writeUInt32LE(pcm.length, 40)
  writeFileSync(file, Buffer.concat([header, pcm]))
}

const API_KEY = process.env.FISHAUDIO_API_KEY || 'sk-fish--nOll4ktyyXJwQVTVc_cqtkHbe48y37uWLO-w54lnnQ'

// --- Fish Audio -------------------------------------------------------------
async function synthesize(text, outMp3, voiceId = null) {
  const apiKey = API_KEY
  if (!apiKey) throw new Error('FISHAUDIO_API_KEY is not set')
  const cleaned = text
    .replace(/\s*—\s*/g, ', ')
    .replace(/\s*–\s*/g, ', ')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()

  const payload = {
    text: cleaned,
    format: 'mp3',
    mp3_bitrate: 128,
    sample_rate: SAMPLE_RATE,
    prosody: { speed: 1.0, volume: 0, normalize_loudness: true },
  }
  if (voiceId) payload.reference_id = voiceId

  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch('https://api.fish.audio/v1/tts', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', model: 's2.1-pro-free' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        writeFileSync(outMp3, Buffer.from(await res.arrayBuffer()))
        return
      }
      const body = (await res.text()).slice(0, 200)
      if (res.status === 429 || res.status >= 500) {
        await new Promise((r) => setTimeout(r, attempt * 2000))
        continue
      }
      throw new Error(`Fish Audio TTS failed (${res.status}): ${body}`)
    } catch (err) {
      if (attempt === 4) throw err
      await new Promise((r) => setTimeout(r, attempt * 1500))
    }
  }
}

const ff = (args, opts = {}) => execFileSync('afconvert', args, { stdio: 'ignore', ...opts })
const wav = (src, dst) => ff(['-f', 'WAVE', '-d', `LEI16@${SAMPLE_RATE}`, src, dst])

// --- Rendering --------------------------------------------------------------
async function renderItem(item, scratch) {
  const target = join(AUDIO_DIR, `${item.id}.m4a`)
  const pre = join(scratch, `${item.id}-pre`)
  const post = join(scratch, `${item.id}-post`)

  let pcm = Buffer.alloc(0)
  if (item.preText) {
    await synthesize(item.preText, `${pre}.mp3`, item.voiceId)
    wav(`${pre}.mp3`, `${pre}.wav`)
    pcm = Buffer.concat([pcm, readWav(`${pre}.wav`)])
  }
  pcm = Buffer.concat([pcm, NO_BEEP ? silencePcm(0.35) : beepPcm()])
  if (item.postText) {
    await synthesize(item.postText, `${post}.mp3`, item.voiceId)
    wav(`${post}.mp3`, `${post}.wav`)
    pcm = Buffer.concat([pcm, silencePcm(0.08), readWav(`${post}.wav`)])
  }

  const joined = join(scratch, `${item.id}.wav`)
  writeWav(joined, pcm)
  // Same container as the rest of the bank: 44.1 kHz mono AAC.
  ff(['-f', 'm4af', '-d', 'aac', joined, target])
  return target
}

async function runPool(items, concurrency, worker) {
  let next = 0
  const results = []
  async function run() {
    while (next < items.length) {
      const i = next++
      const item = items[i]
      try {
        results[i] = { item, ok: true, target: await worker(item) }
        console.log(`  ok   ${item.id}`)
      } catch (err) {
        results[i] = { item, ok: false, error: err.message }
        console.error(`  FAIL ${item.id}: ${err.message}`)
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, run))
  return results
}

// --- Verification -----------------------------------------------------------
// A clip is only right if the beep lands where the removed word was spoken, so
// the check is positional: the beep's share of the clip against the share of the
// sentence's characters that come before the blank. Anything else means the
// splice used the wrong word position, which is exactly the defect this whole
// exercise started from.

function clipProfile(file) {
  const tmp = mkdtempSync(join(tmpdir(), 'smw-verify-'))
  try {
    const out = join(tmp, 'clip.wav')
    wav(file, out)
    const buf = readFileSync(out)
    const data = buf.subarray(44)
    const total = data.length / 2
    const frame = Math.round(SAMPLE_RATE * 0.01)
    const frames = []
    let peak = 0
    for (let start = 0; start + frame <= total; start += frame) {
      let energy = 0
      let sin = 0
      let cos = 0
      for (let i = 0; i < frame; i++) {
        const x = data.readInt16LE((start + i) * 2) / 32768
        const phase = (2 * Math.PI * 750 * (start + i)) / SAMPLE_RATE
        energy += x * x
        sin += x * Math.sin(phase)
        cos += x * Math.cos(phase)
      }
      // A pure 1 kHz tone puts all of its power into these two components, so the
      // ratio against the frame's total energy is ~1 for the beep and a fraction
      // of a percent for speech.
      const tonal = (2 * (sin * sin + cos * cos)) / (frame * frame)
      const e = energy / frame
      peak = Math.max(peak, e)
      frames.push({ t: start / SAMPLE_RATE, energy: e, tonal: tonal / Math.max(e, 1e-9) })
    }
    const tones = frames.filter((f) => f.energy > 0.02 * (peak || 1) && f.tonal > 0.6)
    const beepShare = tones.length >= 3 ? tones[0].t / (total / SAMPLE_RATE) : null
    return { duration: total / SAMPLE_RATE, beepShare }
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
}

function verify(items, rendered) {
  let failed = 0
  console.log('\n== Clip check ==\n')
  for (const item of items) {
    const file = rendered ? rendered.get(item.id) : join(AUDIO_DIR, `${item.id}.m4a`)
    if (!file || !existsSync(file)) {
      console.log(`  FAIL ${item.id}: no clip on disk`)
      failed++
      continue
    }
    const { duration, beepShare } = clipProfile(file)
    const expected = item.preText.length / Math.max(1, item.preText.length + item.postText.length)
    const ok = beepShare !== null && Math.abs(beepShare - expected) <= 0.15
    if (!ok) failed++
    console.log(
      `  ${ok ? 'ok  ' : 'FAIL'} ${item.id}: ${duration.toFixed(1)}s, beep at ${beepShare === null ? 'nowhere' : `${Math.round(beepShare * 100)}%`}, word at ${Math.round(expected * 100)}%`,
    )
  }
  console.log(`\n${items.length - failed}/${items.length} clips place the beep on the blank`)
  return failed
}

function updateManifest(ids) {
  const path = join(ROOT, 'src', 'content', 'audioManifest.json')
  const manifest = JSON.parse(readFileSync(path, 'utf-8'))
  for (const entry of manifest.items) {
    if (!ids.has(entry.id)) continue
    const file = join(AUDIO_DIR, `${entry.id}.m4a`)
    const info = execFileSync('afinfo', [file], { encoding: 'utf-8' })
    const duration = Number(/estimated duration:\s*([\d.]+)/.exec(info)?.[1] ?? 0)
    entry.byteSize = readFileSync(file).length
    entry.durationSec = Number(duration.toFixed(1))
  }
  writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`)
  console.log(`\n  updated ${ids.size} rows in src/content/audioManifest.json`)
}

// --- Main -------------------------------------------------------------------
const scratch = mkdtempSync(join(tmpdir(), 'smw-render-'))
let failed = 1
let bank = []
try {
  bank = readBank(scratch)
  const items = ONLY ? bank.filter((m) => ONLY.includes(m.id)) : bank
  if (items.length === 0) {
    console.error('No items selected.')
    process.exit(1)
  }

  let rendered = null
  if (!VERIFY_ONLY) {
    if (!API_KEY) {
      console.error('FISHAUDIO_API_KEY is not set — nothing was rendered.')
      process.exit(1)
    }
    console.log(`\n== Rendering ${items.length} Select Missing Word clips ==`)
    console.log(`   ${NO_BEEP ? 'leaving silence where the word was (no beep)' : 'beeping soft 750 Hz over the blank'}\n`)
    const results = await runPool(items, 4, (item) => renderItem(item, scratch))
    rendered = new Map(results.filter((r) => r.ok).map((r) => [r.item.id, r.target]))
    const errors = results.filter((r) => !r.ok)
    if (errors.length) console.error(`\n  ${errors.length} clip(s) failed to render`)
    if (UPDATE_MANIFEST) updateManifest(new Set(items.map((m) => m.id)))
  }

  failed = verify(items, rendered)
} finally {
  rmSync(scratch, { recursive: true, force: true })
}
process.exit(failed === 0 ? 0 : 1)
