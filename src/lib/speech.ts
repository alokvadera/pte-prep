import type { AudioScript, Speaker } from '../content/schema'

// ---------------------------------------------------------------------------
// Speech playback.
//
// The entire audio bank is the text in `src/content`. Rather than shipping MP3s
// (which would mean hosting megabytes on a free tier), every recording is
// synthesised in the browser by the platform speech engine. On macOS and
// Windows that engine is entirely local, so practice works offline too.
// ---------------------------------------------------------------------------

export type VoiceHint = Speaker['voiceHint']

export interface SpeakOptions {
  /** Words per minute. PTE recordings run a little faster than conversation. */
  rate?: number
  pitch?: number
  /** Inclusive turn range to speak. Defaults to the whole script. */
  fromTurn?: number
  toTurn?: number
  onTurnStart?: (turnIndex: number) => void
  onEnd?: () => void
  onError?: (message: string) => void
}

export interface SpeakController {
  stop(): void
  speaking: boolean
}

let cachedVoices: SpeechSynthesisVoice[] = []

function synth(): SpeechSynthesis | null {
  if (typeof window === 'undefined') return null
  return window.speechSynthesis ?? null
}

/** Chrome and Safari populate `getVoices()` asynchronously. */
export function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  const s = synth()
  if (!s) return Promise.resolve([])
  const existing = s.getVoices()
  if (existing.length > 0) {
    cachedVoices = existing
    return Promise.resolve(existing)
  }
  return new Promise((resolve) => {
    let settled = false
    let fallback: number | null = typeof window !== 'undefined' ? window.setTimeout(finish, 600) : null
    function finish() {
      if (settled) return
      settled = true
      if (fallback !== null) {
        window.clearTimeout(fallback)
        fallback = null
      }
      cachedVoices = s?.getVoices() ?? []
      resolve(cachedVoices)
    }
    s.addEventListener('voiceschanged', finish, { once: true })
    // Some engines never fire the event; resolve on a short timer.
  })
}

function scoreVoice(voice: SpeechSynthesisVoice, hint: VoiceHint): number {
  const name = voice.name.toLowerCase()
  const lang = voice.lang.toLowerCase()
  if (!lang.startsWith('en')) return -1000

  // 1. Completely reject legacy novelty, robotic, and cartoon voices
  if (
    /(fred|albert|bad news|bahh|bells|boing|bubbles|cellos|deranged|good news|hysterical|junior|kathy|pipe organ|princess|ralph|trinoids|whisper|zarvox|espeak|compact|eloquence|wobble|organ|jester)/.test(
      name,
    )
  ) {
    return -1000
  }

  let score = 0

  // 2. Strongly reward modern neural, enhanced, and natural voices
  if (/(natural|neural|premium|enhanced|online)/.test(name)) score += 35
  if (/(siri|ava|evan|zoe|allison|nathan|oliver|matilda|fiona)/.test(name)) score += 25
  if (/(microsoft|google)/.test(name)) score += 15

  // 3. Prioritize authentic accents tested in Pearson PTE Academic
  if (lang.includes('au')) score += 14 // Australian
  if (lang.includes('gb') || lang.includes('uk')) score += 12 // British
  if (lang.includes('us')) score += 10 // American
  if (lang.includes('in') || lang.includes('ie')) score += 8 // Indian / Irish

  // 4. Local device rendering
  if (voice.localService) score += 6

  // 5. Gender / pitch profile matching
  switch (hint) {
    case 'low':
      if (/(evan|nathan|oliver|daniel|guy|george|david|male|arthur|eddy|reed)/.test(name)) score += 18
      break
    case 'high':
      if (/(ava|zoe|allison|karen|samantha|serena|jenny|aria|female|tessa|fiona|flo|moira)/.test(name)) score += 18
      break
    case 'mid-high':
      if (/(zoe|samantha|karen|serena|jenny|flo)/.test(name)) score += 10
      break
    case 'mid':
      if (/(siri|ava|evan|daniel|david|eddy)/.test(name)) score += 10
      break
  }
  return score
}

/** Deterministically map a speaker to a distinct system voice. */
function pickVoice(speaker: Speaker, index: number, used: Set<string>): SpeechSynthesisVoice | null {
  const pool = cachedVoices
    .map((v) => ({ v, s: scoreVoice(v, speaker.voiceHint) }))
    .filter((x) => x.s > -1000)
    .sort((a, b) => b.s - a.s)

  const preferred = pool.find((x) => !used.has(x.v.name))
  const fallback = pool[index % Math.max(1, pool.length)]
  const chosen = preferred ?? fallback
  if (!chosen) return null
  used.add(chosen.v.name)
  return chosen.v
}

/** Formant-safe pitch: keeping within 0.98–1.02 avoids metallic resampling artifacts. */
function basePitch(hint: VoiceHint): number {
  switch (hint) {
    case 'low':
      return 0.98
    case 'mid':
      return 1.0
    case 'mid-high':
      return 1.01
    case 'high':
      return 1.02
  }
}

/** Clean punctuation and dashes into natural conversational breathing pauses. */
export function cleanProsodyText(raw: string): string {
  return raw
    .replace(/\s*—\s*/g, ', ')
    .replace(/\s*–\s*/g, ', ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

let keepAlive: number | null = null

function stopKeepAlive(): void {
  if (keepAlive !== null) {
    if (typeof window !== 'undefined') window.clearInterval(keepAlive)
    keepAlive = null
  }
}

export function isSpeechSupported(): boolean {
  return synth() !== null && typeof window !== 'undefined' && 'speechSynthesis' in window
}

export async function speakScript(script: AudioScript, options: SpeakOptions = {}): Promise<SpeakController> {
  const s = synth()
  const controller: SpeakController = { stop: () => {}, speaking: false }
  if (!s) {
    options.onError?.('Speech synthesis is not available in this browser.')
    options.onEnd?.()
    return controller
  }

  await loadVoices()
  s.cancel()

  const { rate = 1.0, pitch, onTurnStart, onEnd, onError } = options
  const used = new Set<string>()
  let cancelled = false
  // Turn-scoped playback: WFD and Missing Word test one turn of a long
  // conversation, and FIB-Listening starts mid-script, so the player must be
  // able to speak a slice rather than always starting at turn zero.
  const firstTurn = Math.max(0, options.fromTurn ?? 0)
  const lastTurn = options.toTurn ?? script.turns.length - 1

  // Chrome silently stops long utterances after ~15s (crbug 679437) unless the
  // engine is nudged. A periodic resume() is harmless when nothing is paused
  // and keeps the queue alive when it is.
  stopKeepAlive()
  keepAlive = typeof window !== 'undefined' ? window.setInterval(() => s.resume(), 10000) : null

  let gapTimer: number | null = null
  let safetyTimer: number | null = null

  const clearSafety = () => {
    if (safetyTimer !== null) {
      window.clearTimeout(safetyTimer)
      safetyTimer = null
    }
  }

  const cleanup = () => {
    stopKeepAlive()
    if (gapTimer !== null) {
      window.clearTimeout(gapTimer)
      gapTimer = null
    }
    clearSafety()
    controller.speaking = false
  }

  controller.stop = () => {
    cancelled = true
    s.cancel()
    cleanup()
  }

  const run = (index: number) => {
    if (cancelled) return
    if (index > lastTurn || index >= script.turns.length) {
      cleanup()
      onEnd?.()
      return
    }
    const turn = script.turns[index]
    if (!turn) {
      run(index + 1)
      return
    }
    const speaker = script.speakers.find((sp) => sp.id === turn.speaker) ?? script.speakers[0]
    if (!speaker) {
      run(index + 1)
      return
    }
    onTurnStart?.(index)
    const utter = new SpeechSynthesisUtterance(cleanProsodyText(turn.text))
    const voice = pickVoice(speaker, index, used)
    if (voice) {
      utter.voice = voice
      utter.lang = voice.lang
    }
    utter.rate = rate
    utter.pitch = pitch ?? basePitch(speaker.voiceHint)

    const wordCount = turn.text.split(/\s+/).length
    clearSafety()
    safetyTimer = window.setTimeout(() => {
      if (cancelled) return
      cleanup()
      onError?.('Speech playback timed out.')
      onEnd?.()
    }, Math.max(15000, wordCount * 1500 + 10000))

    utter.onend = () => {
      clearSafety()
      // A short gap between speakers makes the exchange intelligible.
      if (gapTimer !== null) window.clearTimeout(gapTimer)
      gapTimer = window.setTimeout(() => run(index + 1), 220)
    }
    utter.onerror = (event) => {
      clearSafety()
      const err = String((event as SpeechSynthesisErrorEvent).error ?? '')
      if (err === 'interrupted' || err === 'canceled') return
      onError?.(err || 'Speech synthesis failed.')
      cleanup()
      onEnd?.()
    }
    s.speak(utter)
  }

  controller.speaking = true
  run(firstTurn)
  return controller
}

/** Read an arbitrary string (used for question prompts and the countdown). */
export async function speakText(
  text: string,
  options: SpeakOptions & { voiceHint?: VoiceHint } = {},
): Promise<SpeakController> {
  const script: AudioScript = {
    id: 'ad-hoc',
    title: '',
    kind: 'single-speaker',
    topic: '',
    speakers: [{ id: 's', name: 'Narrator', voiceHint: options.voiceHint ?? 'mid' }],
    turns: [{ speaker: 's', text }],
  }
  return speakScript(script, options)
}

/**
 * Select Missing Word playback: speak the lead-in, sound a beep where the
 * word was removed, then speak the remainder. The missing word itself is
 * never voiced — previously the full turn was played and the answer was
 * audible, which made the item solvable without any prediction.
 */
export async function speakWithBeep(
  before: string,
  after: string,
  options: SpeakOptions & { voiceHint?: VoiceHint } = {},
): Promise<SpeakController> {
  const controller: SpeakController = { stop: () => {}, speaking: true }
  let inner: SpeakController | null = null
  let cancelled = false
  let beepTimer: number | null = null
  controller.stop = () => {
    cancelled = true
    if (beepTimer !== null) {
      window.clearTimeout(beepTimer)
      beepTimer = null
    }
    inner?.stop()
    stopAllSpeech()
    controller.speaking = false
  }
  const speakAfter = () => {
    if (cancelled) return
    playTone(990, 320, 0.09)
    beepTimer = window.setTimeout(() => {
      beepTimer = null
      if (cancelled) return
      void speakText(after, {
        ...options,
        onEnd: () => {
          controller.speaking = false
          options.onEnd?.()
        },
        onError: (m) => {
          controller.speaking = false
          options.onError?.(m)
        },
      }).then((c) => {
        inner = c
      })
    }, 420)
  }
  if (!before.trim()) {
    speakAfter()
    return controller
  }
  const first = await speakText(before, {
    ...options,
    onEnd: speakAfter,
    onError: (m) => {
      controller.speaking = false
      options.onError?.(m)
    },
  })
  inner = first
  return controller
}

export function stopAllSpeech(): void {
  const s = synth()
  if (!s) return
  stopKeepAlive()
  s.cancel()
}

// ---------------------------------------------------------------------------
// Short UI tones (countdown beeps) via the Web Audio API
// ---------------------------------------------------------------------------

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  if (!audioCtx) audioCtx = new Ctor()
  if (audioCtx.state === 'suspended') void audioCtx.resume()
  return audioCtx
}

export function playTone(frequency = 660, durationMs = 120, gainPeak = 0.06): void {
  const ctx = getAudioContext()
  if (!ctx) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = frequency
  gain.gain.setValueAtTime(0.0001, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(gainPeak, ctx.currentTime + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000)
  osc.connect(gain).connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + durationMs / 1000 + 0.02)
}

export function playCountdownBeep(remaining: number): void {
  playTone(remaining <= 3 ? 880 : 620, remaining <= 3 ? 160 : 110)
}

export function playSuccessTone(): void {
  playTone(700, 110, 0.05)
  if (typeof window !== 'undefined') {
    window.setTimeout(() => playTone(940, 140, 0.05), 100)
  }
}

export function playErrorTone(): void {
  playTone(300, 180, 0.05)
}
