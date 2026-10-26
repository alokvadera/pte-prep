import type { AudioAnalysis } from '../domain/types'

// ---------------------------------------------------------------------------
// Microphone capture.
//
// Recording is used for two things: waveform feedback while the candidate
// speaks, and a lightweight acoustic analysis that feeds the fluency portion of
// the speaking estimate. Raw audio is never stored — nothing leaves the device
// and nothing is persisted between attempts.
// ---------------------------------------------------------------------------

export type RecorderState = 'idle' | 'requesting' | 'recording' | 'denied' | 'unsupported' | 'error'

export interface RecorderLevel {
  /** 0..1 RMS level for the meter. */
  level: number
  /** 0..1 speech likelihood for the activity indicator. */
  speechiness: number
}

export interface RecorderEvents {
  onStateChange?: (state: RecorderState) => void
  onLevel?: (level: RecorderLevel) => void
  onError?: (message: string) => void
  onTranscript?: (text: string) => void
}

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onresult:
    | ((event: {
        resultIndex: number
        results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>
      }) => void)
    | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function isRecordingSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices?.getUserMedia === 'function' &&
    typeof window !== 'undefined' &&
    ('AudioContext' in window || 'webkitAudioContext' in window)
  )
}

export function isSpeechRecognitionSupported(): boolean {
  return getRecognitionCtor() !== null
}

/** Frames quieter than this fraction of peak are treated as silence. */
const SILENCE_RATIO = 0.16

/**
 * Autocorrelation pitch estimate over one analysis frame.
 * Returns Hz, or null when the frame is unvoiced (silence or noise).
 */
function detectPitch(buffer: Float32Array, sampleRate = 44100): number | null {
  const minLag = Math.floor(sampleRate / 400) // 400 Hz ceiling
  const maxLag = Math.floor(sampleRate / 65) // 65 Hz floor
  if (maxLag >= buffer.length) return null

  let energy = 0
  for (let i = 0; i < buffer.length; i++) energy += (buffer[i] as number) ** 2
  const rms = Math.sqrt(energy / buffer.length)
  if (rms < 0.006) return null

  let bestLag = -1
  let bestScore = 0
  for (let lag = minLag; lag <= maxLag; lag++) {
    let sum = 0
    for (let i = 0; i < buffer.length - lag; i++) {
      sum += (buffer[i] as number) * (buffer[i + lag] as number)
    }
    const score = sum / (buffer.length - lag)
    if (score > bestScore) {
      bestScore = score
      bestLag = lag
    }
  }

  if (bestLag <= 0 || bestScore / rms < 0.3) return null
  const hz = sampleRate / bestLag
  return hz >= 60 && hz <= 400 ? Math.round(hz) : null
}

export class VoiceRecorder {
  private stream: MediaStream | null = null
  private ctx: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private raf = 0
  private recognition: SpeechRecognitionLike | null = null
  private state: RecorderState = 'idle'
  private startedAt = 0
  private energySamples: number[] = []
  private peakLevel = 1e-5
  private silentFrames = 0
  private speechFrames = 0
  private pauses = 0
  private inPause = false
  private pitchSum = 0
  private pitchCount = 0
  private transcript = ''
  private lastInterim = ''
  private events: RecorderEvents
  private stopping = false
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: Blob[] = []

  constructor(events: RecorderEvents = {}) {
    this.events = events
  }

  getState(): RecorderState {
    return this.state
  }

  private setState(next: RecorderState): void {
    if (this.state === next) return
    this.state = next
    this.events.onStateChange?.(next)
  }

  async start(): Promise<boolean> {
    if (this.state === 'recording') return true
    if (!isRecordingSupported()) {
      this.setState('unsupported')
      this.events.onError?.('This browser does not expose microphone access.')
      return false
    }

    this.setState('requesting')
    this.energySamples = []
    this.peakLevel = 1e-5
    this.silentFrames = 0
    this.speechFrames = 0
    this.pauses = 0
    this.inPause = false
    this.pitchSum = 0
    this.pitchCount = 0
    this.transcript = ''
    this.lastInterim = ''
    this.stopping = false

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      })
    } catch (err) {
      const name = err instanceof DOMException ? err.name : 'Error'
      this.setState(name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'error')
      this.events.onError?.(
        name === 'NotAllowedError' || name === 'SecurityError'
          ? 'Microphone permission was denied. You can still type your answer — the estimate will use the written form.'
          : 'No microphone was found. You can still type your answer.',
      )
      return false
    }

    if (this.stopping || this.state !== 'requesting') {
      this.stream.getTracks().forEach((t) => t.stop())
      this.stream = null
      return false
    }

    try {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (Ctor) {
        this.ctx = new Ctor()
        if (this.ctx.state === 'suspended') await this.ctx.resume().catch(() => undefined)
        const source = this.ctx.createMediaStreamSource(this.stream)
        this.analyser = this.ctx.createAnalyser()
        this.analyser.fftSize = 1024
        this.analyser.smoothingTimeConstant = 0.4
        source.connect(this.analyser)
      }
    } catch {
      this.stream.getTracks().forEach((t) => t.stop())
      this.stream = null
      this.setState('error')
      this.events.onError?.('Failed to initialize audio analyzer.')
      return false
    }

    this.startedAt = performance.now()
    this.setState('recording')
    this.tick()

    if (typeof MediaRecorder !== 'undefined' && this.stream) {
      try {
        const mimeCandidates = [
          'audio/webm;codecs=opus',
          'audio/webm',
          'audio/mp4',
          'audio/ogg;codecs=opus',
          'audio/wav',
        ]
        const mimeType = mimeCandidates.find((m) => {
          try {
            return MediaRecorder.isTypeSupported(m)
          } catch {
            return false
          }
        })
        this.mediaRecorder = mimeType
          ? new MediaRecorder(this.stream, { mimeType })
          : new MediaRecorder(this.stream)
        this.audioChunks = []
        this.mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            this.audioChunks.push(e.data)
          }
        }
        this.mediaRecorder.start(250)
      } catch {
        this.mediaRecorder = null
      }
    }

    // Web Speech recognition provides transcripts on Chrome/Edge. In Safari and Firefox,
    // the scorer gracefully degrades to delivery traits (oral fluency + pronunciation).
    const Recognition = getRecognitionCtor()
    if (Recognition) {
      try {
        const rec = new Recognition()
        rec.continuous = true
        rec.interimResults = true
        rec.lang = 'en-US'
        rec.onresult = (event) => {
          let text = ''
          let interim = ''
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const r = event.results[i]
            if (r) {
              if (r.isFinal) text += `${r[0].transcript} `
              else interim += `${r[0].transcript} `
            }
          }
          if (text.trim()) {
            this.transcript += text
            this.lastInterim = ''
            this.events.onTranscript?.(this.transcript.trim())
          } else if (interim.trim()) {
            this.lastInterim = interim.trim()
            this.events.onTranscript?.(`${this.transcript} ${this.lastInterim}`.trim())
          }
        }
        rec.onerror = () => {
          /* recognition is best-effort; ignore */
        }
        rec.start()
        this.recognition = rec
      } catch {
        this.recognition = null
      }
    }

    return true
  }

  private tick = (): void => {
    if (!this.analyser || this.state !== 'recording') return
    const buffer = new Float32Array(this.analyser.fftSize)
    this.analyser.getFloatTimeDomainData(buffer)

    let sumSquares = 0
    for (let i = 0; i < buffer.length; i++) {
      const v = buffer[i] as number
      sumSquares += v * v
    }
    const rms = Math.sqrt(sumSquares / buffer.length)

    // Keep the sample buffer bounded: ten minutes at 60 ms is plenty.
    if (this.energySamples.length >= 10_000) this.energySamples.shift()
    this.energySamples.push(rms)

    // Running peak with slow decay instead of scanning the whole buffer every
    // frame. A full reduce here is O(n) per animation frame and burns CPU on
    // long recordings.
    this.peakLevel = Math.max(rms, this.peakLevel * 0.9995, 1e-5)
    const loudest = this.peakLevel
    const normalised = Math.min(1, rms / (loudest * 0.85))
    const speechiness = Math.min(1, Math.max(0, (normalised - SILENCE_RATIO) / (1 - SILENCE_RATIO)))
    this.events.onLevel?.({ level: normalised, speechiness })

    if (speechiness > 0.25) {
      this.speechFrames += 1
      if (this.inPause && this.silentFrames > 8) {
        this.pauses += 1
        this.inPause = false
      }
      this.silentFrames = 0
      const pitch = detectPitch(buffer, this.ctx?.sampleRate ?? 44100)
      if (pitch !== null) {
        this.pitchSum += pitch
        this.pitchCount += 1
      }
    } else {
      this.silentFrames += 1
      if (this.silentFrames > 8) this.inPause = true
    }

    this.raf = requestAnimationFrame(this.tick)
  }

  async stop(): Promise<{ analysis: AudioAnalysis; transcript: string; audioBlob?: Blob | null }> {
    this.stopping = true
    if (this.raf) cancelAnimationFrame(this.raf)
    this.raf = 0

    let audioBlob: Blob | null = null
    // Captured locally: the recorder that is running is the one to stop, even
    // if something else clears the field while the promise is pending.
    const recorder = this.mediaRecorder
    if (recorder && recorder.state !== 'inactive') {
      await new Promise<void>((resolve) => {
        recorder.onstop = () => resolve()
        try {
          recorder.stop()
        } catch {
          resolve()
        }
      })
      if (this.audioChunks.length > 0) {
        const mime = recorder.mimeType || 'audio/webm'
        audioBlob = new Blob(this.audioChunks, { type: mime })
      }
    }
    this.mediaRecorder = null
    this.audioChunks = []

    try {
      this.recognition?.stop()
    } catch {
      /* ignore */
    }
    this.recognition = null

    if (
      this.lastInterim.trim() &&
      !this.transcript.toLowerCase().includes(this.lastInterim.toLowerCase().trim())
    ) {
      this.transcript = `${this.transcript} ${this.lastInterim}`.trim()
    }

    this.stream?.getTracks().forEach((t) => t.stop())
    this.stream = null

    const meanPitch = this.pitchCount > 0 ? Math.round(this.pitchSum / this.pitchCount) : null

    if (this.ctx) {
      await this.ctx.close().catch(() => undefined)
      this.ctx = null
      this.analyser = null
    }

    const durationMs = Math.max(0, performance.now() - this.startedAt)
    const totalFrames = this.speechFrames + this.silentFrames
    const speechRatio = totalFrames > 0 ? this.speechFrames / totalFrames : 0
    const samples = this.energySamples
    const mean = samples.length > 0 ? samples.reduce((a, b) => a + b, 0) / samples.length : 0
    const variance =
      samples.length > 1 ? samples.reduce((acc, v) => acc + (v - mean) ** 2, 0) / samples.length : 0
    const energyVariance = mean > 0 ? Math.min(1, Math.sqrt(variance) / mean) : 0

    const transcript = this.transcript.trim()
    const spokenWords = transcript ? transcript.split(/\s+/).filter(Boolean).length : 0
    const wordsPerMinute =
      durationMs > 0 && spokenWords > 0
        ? Math.round((spokenWords / (durationMs / 60000)) * 10) / 10
        : 0

    // A 300ms accidental tap is not a measurement. Gate reliability on a
    // minimum sample so fluency never reports confidence from noise.
    const totalSamples = this.speechFrames + this.silentFrames
    const reliable = this.stopping && durationMs >= 1500 && totalSamples >= 10

    const analysis: AudioAnalysis = {
      durationMs: Math.round(durationMs),
      wordsPerMinute,
      speechRatio: Math.round(speechRatio * 100) / 100,
      pauseCount: this.pauses,
      meanPitchHz: meanPitch,
      energyVariance: Math.round(energyVariance * 100) / 100,
      // Measured from the level meter, so this is true even when no transcript
      // was produced (Safari, Firefox, or a failed transcription). The scorer
      // needs it precisely then: `wordsPerMinute` is derived from the
      // transcript and is 0 in that case, which would read as silence.
      speechDetected: this.speechFrames > 0,
      reliable,
    }

    this.setState('idle')
    return { analysis, transcript, audioBlob }
  }

  dispose(): void {
    if (this.raf) cancelAnimationFrame(this.raf)
    this.raf = 0
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop()
      } catch {
        /* ignore */
      }
    }
    this.mediaRecorder = null
    this.audioChunks = []
    this.stream?.getTracks().forEach((t) => t.stop())
    this.stream = null
    void this.ctx?.close().catch(() => undefined)
    this.ctx = null
    try {
      this.recognition?.abort()
    } catch {
      /* ignore */
    }
    this.recognition = null
  }
}
