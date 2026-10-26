#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Renders dialogue and group conversations using Fish Audio Cloud TTS
// with curated, high-clarity male and female voices.
//
// Usage:
//   node scripts/render-conversations.mjs --id=con-student-accommodation
//   node scripts/render-conversations.mjs --list
//   node scripts/render-conversations.mjs --all
//   node scripts/render-conversations.mjs --all --force
// ---------------------------------------------------------------------------

import { existsSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { execSync, execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const ROOT = resolve(__dirname, '..')
const AUDIO_DIR = join(ROOT, 'public', 'audio')
if (!existsSync(AUDIO_DIR)) mkdirSync(AUDIO_DIR, { recursive: true })

const API_KEY = process.env.FISHAUDIO_API_KEY

// Verified official Fish Audio clean voice models
export const VOICES = {
  // Female
  freya: {
    id: '8abfa9ebd4c24a3399b68c3cdac8c7b5',
    name: 'Freya',
    gender: 'Female',
    accent: 'British',
    desc: 'Young, crisp, natural',
  },
  sophia: {
    id: '0efe38923c0b445ab09382e851ae1e30',
    name: 'Sophia',
    gender: 'Female',
    accent: 'British',
    desc: 'Professional, articulate',
  },
  megan: {
    id: '705690224f264386b87fb598083ab022',
    name: 'Megan',
    gender: 'Female',
    accent: 'British (London)',
    desc: 'Warm, relaxed',
  },
  harper: {
    id: 'c250136a9ec74cc0b799be54664a83f2',
    name: 'Harper',
    gender: 'Female',
    accent: 'American',
    desc: 'Clear, modern, confident',
  },
  chloe: {
    id: 'b121b91872f54f04ba9f6da08b8b6253',
    name: 'Chloe',
    gender: 'Female',
    accent: 'Australian',
    desc: 'Natural, brisk, authentic',
  },

  // Male
  james: {
    id: '08b4100b4c3747fe84ed8b57d26a95ba',
    name: 'James',
    gender: 'Male',
    accent: 'British',
    desc: 'Young adult, friendly, articulate',
  },
  anthony: {
    id: '98e364e9a41c465a9d4fdafc267f84ea',
    name: 'Anthony',
    gender: 'Male',
    accent: 'British',
    desc: 'Deep, academic, authoritative',
  },
  oliver: {
    id: '8d8aec63a56c460cb7def795bdf754fa',
    name: 'Oliver',
    gender: 'Male',
    accent: 'British',
    desc: 'Crisp, confident',
  },
  mason: {
    id: '02e950ce577d4f008a2dfb4782789a3a',
    name: 'Mason',
    gender: 'Male',
    accent: 'American',
    desc: 'Young adult, clear, brisk',
  },
  jack: {
    id: 'a92fb82d739d428a80d4645c5cf91e38',
    name: 'Jack',
    gender: 'Male',
    accent: 'Australian',
    desc: 'Young adult, crisp Australian',
  },
}

export function cleanText(text) {
  return text
    .replace(/\s*—\s*/g, ', ')
    .replace(/\s*–\s*/g, ', ')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

export function mapConversationVoices(script) {
  const speakers = script.speakers || []
  const assigned = []
  const usedVoiceKeys = new Set()

  for (let i = 0; i < speakers.length; i++) {
    const sp = speakers[i]
    const name = (sp.name || '').toLowerCase()
    const role = (sp.role || '').toLowerCase()
    const hint = (sp.voiceHint || '').toLowerCase()

    const isFemale =
      /priya|mara|chen|novak|bergstr|amara|karen|lindgren|tanaka|hartley|adeyemi|hana|leila|lindqvist|gallagher|meyer/.test(
        name,
      ) ||
      /mrs|ms|nurse|sister/.test(name) ||
      /nurse/.test(role) ||
      (hint.includes('high') &&
        !/mr\b|dr marsh|jonas|duarte|idris|bernard|gordon|dev|cole|s[øo]rensen|brandt|evans|o'connor/.test(
          name,
        ))

    let voiceKey = 'james'
    if (isFemale) {
      if (
        role.includes('prof') ||
        role.includes('dean') ||
        role.includes('director') ||
        role.includes('head') ||
        hint.includes('low')
      ) {
        voiceKey = !usedVoiceKeys.has('sophia') ? 'sophia' : 'freya'
      } else if (!usedVoiceKeys.has('freya')) {
        voiceKey = 'freya'
      } else if (!usedVoiceKeys.has('harper')) {
        voiceKey = 'harper'
      } else if (!usedVoiceKeys.has('chloe')) {
        voiceKey = 'chloe'
      } else if (!usedVoiceKeys.has('sophia')) {
        voiceKey = 'sophia'
      } else {
        voiceKey = 'megan'
      }
    } else {
      if (
        role.includes('prof') ||
        role.includes('supervisor') ||
        role.includes('manager') ||
        role.includes('archivist') ||
        hint.includes('low')
      ) {
        voiceKey = !usedVoiceKeys.has('anthony') ? 'anthony' : 'oliver'
      } else if (!usedVoiceKeys.has('james')) {
        voiceKey = 'james'
      } else if (!usedVoiceKeys.has('mason')) {
        voiceKey = 'mason'
      } else if (!usedVoiceKeys.has('jack')) {
        voiceKey = 'jack'
      } else if (!usedVoiceKeys.has('anthony')) {
        voiceKey = 'anthony'
      } else {
        voiceKey = 'oliver'
      }
    }

    usedVoiceKeys.add(voiceKey)
    assigned.push({
      speakerId: sp.id,
      name: sp.name,
      role: sp.role,
      hint: sp.voiceHint,
      voiceKey,
      voice: VOICES[voiceKey],
    })
  }

  return assigned
}

function getAudioDuration(filePath) {
  try {
    // The argument list form is used rather than a shell string: `filePath`
    // comes from the content bank, and a shell would let any quoting
    // character in it break out of the command.
    const out = execFileSync('afinfo', [filePath], { encoding: 'utf-8' })
    const m = out.match(/estimated duration:\s*([\d.]+)/)
    return m ? parseFloat(m[1]) : 0
  } catch {
    return 0
  }
}

export async function synthesizeDialogue(script) {
  if (!API_KEY) {
    throw new Error('FISHAUDIO_API_KEY environment variable is required to synthesize audio')
  }
  const voiceAssignments = mapConversationVoices(script)
  const speakerIndexMap = new Map()
  const referenceIds = []

  voiceAssignments.forEach((va, idx) => {
    speakerIndexMap.set(va.speakerId, idx)
    referenceIds.push(va.voice.id)
  })

  const lines = []
  for (const t of script.turns) {
    const sIdx = speakerIndexMap.get(t.speaker) ?? 0
    lines.push(`<|speaker:${sIdx}|> ${cleanText(t.text)}`)
  }
  const payloadText = lines.join('\n')

  console.log(`\n🎙️  Synthesizing "${script.title}" (${script.id})`)
  voiceAssignments.forEach((va, idx) => {
    console.log(
      `     [${idx}] ${va.name} (${va.role}): ${va.voice.name} (${va.voice.gender}, ${va.voice.accent})`,
    )
  })
  console.log(`   Text: ${payloadText.length} chars, ${script.turns.length} turns`)

  let res = null
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      res = await fetch('https://api.fish.audio/v1/tts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          model: 's2.1-pro-free',
        },
        body: JSON.stringify({
          text: payloadText,
          reference_id: referenceIds,
          format: 'mp3',
          mp3_bitrate: 128,
          sample_rate: 44100,
          prosody: { speed: 1.0, volume: 0, normalize_loudness: true },
        }),
      })

      if (res.ok) break

      const errBody = (await res.text()).slice(0, 200)
      if (res.status === 429 || res.status >= 500) {
        console.warn(
          `   ⚠️  Attempt ${attempt} failed (${res.status}), retrying in ${attempt * 3}s...`,
        )
        await new Promise((r) => setTimeout(r, attempt * 3000))
        continue
      }
      throw new Error(`Fish Audio API failed (${res.status}): ${errBody}`)
    } catch (err) {
      if (attempt === 4) throw err
      console.warn(`   ⚠️  Attempt ${attempt} network error: ${err.message}, retrying...`)
      await new Promise((r) => setTimeout(r, attempt * 2000))
    }
  }

  if (!res || !res.ok) {
    throw new Error(`Failed after retries`)
  }

  const mp3Buf = Buffer.from(await res.arrayBuffer())
  const tmpMp3 = join(AUDIO_DIR, `${script.id}.tmp.mp3`)
  const targetM4a = join(AUDIO_DIR, `${script.id}.m4a`)

  writeFileSync(tmpMp3, mp3Buf)
  execFileSync('afconvert', ['-f', 'm4af', '-d', 'aac', tmpMp3, targetM4a], { stdio: 'pipe' })
  rmSync(tmpMp3, { force: true })

  const durationSec = getAudioDuration(targetM4a)
  // The browser serves the converted M4A, so the manifest has to report the
  // size of that file rather than the larger Fish Audio MP3 source.
  const byteSize = readFileSync(targetM4a).length

  // Update manifest
  const manifestPath = join(ROOT, 'src', 'content', 'audioManifest.json')
  if (existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
      const found = manifest.items.find((x) => x.id === script.id)
      if (found) {
        found.durationSec = Math.round(durationSec * 10) / 10
        found.byteSize = byteSize
        found.status = 'ready'
      }
      manifest.generatedAt = new Date().toISOString()
      writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
    } catch (e) {
      console.warn('   Could not update manifest:', e.message)
    }
  }

  console.log(
    `   ✓ Saved: public/audio/${script.id}.m4a (${Math.round(byteSize / 1024)} KB, ${durationSec.toFixed(1)}s)`,
  )
  return { id: script.id, durationSec, bytes: byteSize }
}

async function main() {
  const args = process.argv.slice(2)
  const idArg = args.find((a) => a.startsWith('--id='))?.split('=')[1]
  const isList = args.includes('--list')
  const isAll = args.includes('--all')
  const isForce = args.includes('--force')

  // Load items from bank
  const dumpCmd = `npx tsx -e "
    import { AUDIO_INDEX } from './src/content/bank';
    const items = Array.from(AUDIO_INDEX.values()).filter(s =>
      s.kind === 'dialogue' || s.kind === 'group' || (s.speakers && s.speakers.length > 1) ||
      s.id.startsWith('con-') || s.id.startsWith('conv-') || s.id.startsWith('gd-')
    ).map(s => ({
      id: s.id,
      title: s.title,
      kind: s.kind,
      speakers: s.speakers,
      turns: s.turns
    }));
    console.log(JSON.stringify(items));
  "`
  const raw = execSync(dumpCmd, { cwd: ROOT, encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 })
  const conversations = JSON.parse(raw.trim())

  if (isList) {
    console.log(`\nFound ${conversations.length} conversations:`)
    conversations.forEach((c, idx) => {
      const v = mapConversationVoices(c)
      console.log(
        `\n${String(idx + 1).padStart(2)}. [${c.id}] "${c.title}" (${c.kind}) - ${c.turns.length} turns`,
      )
      v.forEach((s) =>
        console.log(
          `     → [${s.speakerId}] ${s.name} (${s.role}): ${s.voice.name} (${s.voice.gender}, ${s.voice.accent})`,
        ),
      )
    })
    return
  }

  let targets = []
  if (idArg) {
    const found = conversations.find((c) => c.id === idArg)
    if (!found) {
      console.error(`Conversation "${idArg}" not found!`)
      process.exit(1)
    }
    targets = [found]
  } else if (isAll) {
    targets = conversations
  } else {
    console.log(`Specify --id=<id>, --all, or --list`)
    console.log(`Example: node scripts/render-conversations.mjs --id=con-student-accommodation`)
    return
  }

  const stateFile = join(ROOT, '.rendered-conversations.json')
  let state = {}
  if (existsSync(stateFile)) {
    try {
      state = JSON.parse(readFileSync(stateFile, 'utf-8'))
    } catch {}
  }

  // Pre-seed the already rendered items
  state['con-student-accommodation'] =
    state['con-student-accommodation'] || new Date().toISOString()
  state['con-lab-notebook'] = state['con-lab-notebook'] || new Date().toISOString()
  state['con-field-station'] = state['con-field-station'] || new Date().toISOString()
  writeFileSync(stateFile, JSON.stringify(state, null, 2))

  console.log(`\n🚀 Starting render of ${targets.length} conversation(s) one by one...\n`)
  let completed = 0
  for (let i = 0; i < targets.length; i++) {
    const script = targets[i]
    if (!isForce && !idArg && state[script.id]) {
      console.log(
        `[${i + 1}/${targets.length}] ⏩ Skipping ${script.id} (already rendered with clean voices). Use --force to re-render.`,
      )
      completed++
      continue
    }

    console.log(`[${i + 1}/${targets.length}] Processing ${script.id}...`)
    try {
      await synthesizeDialogue(script)
      state[script.id] = new Date().toISOString()
      writeFileSync(stateFile, JSON.stringify(state, null, 2))
      completed++
      if (i < targets.length - 1) {
        console.log(`   Sleeping 2.0s before next request...`)
        await new Promise((r) => setTimeout(r, 2000))
      }
    } catch (err) {
      console.error(`❌ Failed on ${script.id}:`, err.message)
    }
  }

  console.log(`\n✨ Finished: ${completed}/${targets.length} conversations rendered!`)

  // Refresh audio review explorer
  try {
    console.log(`\n🔄 Updating audio review explorer...`)
    execSync('npx tsx scripts/gen-audio-review.mjs', { cwd: ROOT, stdio: 'inherit' })
  } catch (err) {
    console.warn(`Could not refresh audio review:`, err.message)
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
}
