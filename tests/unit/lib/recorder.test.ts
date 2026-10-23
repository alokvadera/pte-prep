import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isRecordingSupported, isSpeechRecognitionSupported, VoiceRecorder } from '../../../src/lib/recorder'
import type { Mock } from 'vitest'
import type { RecorderEvents, RecorderLevel, RecorderState } from '../../../src/lib/recorder'

/* ---------------------------------------------------------------------------
   The microphone recorder.

   The recorder does four things at once: it asks for the microphone, it
   measures the level of the incoming signal frame by frame, it drives the
   browser's speech recogniser for a transcript, and it turns all of that
   into an acoustic analysis when the take ends.

   The shared browser environment supplies the platform objects. What this
   file adds is control over the *signal*: the samples the analyser hands
   over, the chunks the media recorder produces, and the transcript the
   recogniser reports. Those are the parts a test has to drive.
   --------------------------------------------------------------------------- */

/** One sample of the fake analyser: the value at `index` of a `length`-sample frame. */
type Waveform = (index: number, length: number) => number

/** The analyser node the shared environment would have handed over. */
type SetupAnalyserNode = ReturnType<typeof window.AudioContext.prototype.createAnalyser>

/** The shape the recorder expects from a speech recognition event. */
interface RecognitionEventLike {
  resultIndex: number
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>
}

/* ---------------------------------------------------------------------------
   The fake analyser.

   The recorder always asks for 1024 samples, and the level it reports
   follows from their root mean square. Handing over a different wave per
   frame is therefore enough to drive every branch of the meter: a loud
   frame, a quiet one, a tone the pitch detector can lock onto, and noise
   it cannot.

   The waves belong to the analyser, not to the file: a recorder that is
   still ticking after its test has finished must not eat the frames of the
   next one.
   --------------------------------------------------------------------------- */

const SILENCE: Waveform = () => 0

/** A frame of constant amplitude. */
function constant(amplitude: number): Waveform {
  return () => amplitude
}

/** A square wave with the given period, in samples. */
function square(period: number): Waveform {
  return (index) => (index % period < period / 2 ? 1 : -1)
}

/** Deterministic noise: no period for the pitch detector to lock onto. */
function noise(index: number): number {
  const x = Math.sin(index * 12.9898) * 43758.5453
  return (x - Math.floor(x)) * 2 - 1
}

class FakeAnalyser {
  fftSize = 2048
  smoothingTimeConstant = 0
  /** The waves still to come, one per frame. */
  waves: Waveform[] = []
  /** The wave the frames fall back on once the queue is empty. */
  wave: Waveform = SILENCE
  /** How many frames have been handed over. */
  frames = 0

  connect<T>(destination: T): T {
    return destination
  }

  getFloatTimeDomainData(array: Float32Array): void {
    this.frames += 1
    const queued = this.waves.shift()
    if (queued) this.wave = queued
    const current = this.wave
    for (let i = 0; i < array.length; i++) array[i] = current(i, array.length)
  }
}

class FakeSource {
  connectedTo: unknown = null
  connect<T>(destination: T): T {
    this.connectedTo = destination
    return destination
  }
}

let analyser: FakeAnalyser
let source: FakeSource

/* ---------------------------------------------------------------------------
   The fake recogniser.

   The recorder creates one of these, points it at a transcript and starts
   it. The instance is kept so a test can deliver a result, an error, or
   check that it was stopped.
   --------------------------------------------------------------------------- */

class FakeRecognition {
  static instances: FakeRecognition[] = []
  lang = ''
  continuous = false
  interimResults = false
  maxAlternatives = 1
  onresult: ((event: RecognitionEventLike) => void) | null = null
  onerror: ((event: { error: string }) => void) | null = null
  onend: (() => void) | null = null
  onstart: (() => void) | null = null
  started = false
  stopped = false
  aborted = false

  constructor() {
    FakeRecognition.instances.push(this)
  }

  start(): void {
    this.started = true
  }

  stop(): void {
    this.stopped = true
  }

  abort(): void {
    this.aborted = true
  }
}

function lastRecognition(): FakeRecognition {
  const instance = FakeRecognition.instances[FakeRecognition.instances.length - 1]
  if (!instance) throw new Error('no recogniser was created')
  return instance
}

/* ---------------------------------------------------------------------------
   Helpers
   --------------------------------------------------------------------------- */

interface Harness {
  recorder: VoiceRecorder
  onStateChange: Mock<(state: RecorderState) => void>
  onLevel: Mock<(level: RecorderLevel) => void>
  onError: Mock<(message: string) => void>
  onTranscript: Mock<(text: string) => void>
}

/** Every recorder a test made, so that none of them is left ticking. */
const liveRecorders: VoiceRecorder[] = []

function makeRecorder(events: RecorderEvents = {}): Harness {
  const onStateChange = vi.fn<(state: RecorderState) => void>()
  const onLevel = vi.fn<(level: RecorderLevel) => void>()
  const onError = vi.fn<(message: string) => void>()
  const onTranscript = vi.fn<(text: string) => void>()
  const recorder = new VoiceRecorder({ onStateChange, onLevel, onError, onTranscript, ...events })
  liveRecorders.push(recorder)
  return { recorder, onStateChange, onLevel, onError, onTranscript }
}

/** A stream whose single track records that it was stopped. */
function useStream(): { track: { stop: Mock<() => void> }; stream: MediaStream } {
  const track = { stop: vi.fn<() => void>() }
  const stream = {
    getTracks: () => [track],
    getAudioTracks: () => [track],
  } as unknown as MediaStream
  vi.spyOn(navigator.mediaDevices, 'getUserMedia').mockResolvedValue(stream)
  return { track, stream }
}

/**
 * The window properties the recorder looks for. The DOM types only declare
 * the standard spellings, so the prefixed ones are read through this.
 */
interface RecorderGlobals {
  AudioContext?: unknown
  webkitAudioContext?: unknown
  SpeechRecognition?: unknown
  webkitSpeechRecognition?: unknown
}

function globals(): RecorderGlobals {
  return window as unknown as RecorderGlobals
}

/** Runs `body` with the standard audio context removed from the window. */
async function withoutStandardAudioContext(body: () => Promise<void> | void): Promise<void> {
  const saved = globals().AudioContext
  Reflect.deleteProperty(window, 'AudioContext')
  try {
    await body()
  } finally {
    Object.defineProperty(window, 'AudioContext', { configurable: true, writable: true, value: saved })
  }
}

/** Runs `body` with both audio context spellings removed from the window. */
async function withoutAudioContext(body: () => Promise<void> | void): Promise<void> {
  const saved = globals().AudioContext
  const savedWebkit = globals().webkitAudioContext
  Reflect.deleteProperty(window, 'AudioContext')
  Reflect.deleteProperty(window, 'webkitAudioContext')
  try {
    await body()
  } finally {
    Object.defineProperty(window, 'AudioContext', { configurable: true, writable: true, value: saved })
    Object.defineProperty(window, 'webkitAudioContext', { configurable: true, writable: true, value: savedWebkit })
  }
}

/** Runs `body` with the standard speech recognition API removed from the window. */
async function withoutStandardRecognition(body: () => Promise<void> | void): Promise<void> {
  const saved = globals().SpeechRecognition
  Reflect.deleteProperty(window, 'SpeechRecognition')
  try {
    await body()
  } finally {
    Object.defineProperty(window, 'SpeechRecognition', { configurable: true, writable: true, value: saved })
  }
}

/** Runs `body` with both speech recognition spellings removed from the window. */
async function withoutRecognition(body: () => Promise<void> | void): Promise<void> {
  const saved = globals().SpeechRecognition
  const savedWebkit = globals().webkitSpeechRecognition
  Reflect.deleteProperty(window, 'SpeechRecognition')
  Reflect.deleteProperty(window, 'webkitSpeechRecognition')
  try {
    await body()
  } finally {
    Object.defineProperty(window, 'SpeechRecognition', { configurable: true, writable: true, value: saved })
    Object.defineProperty(window, 'webkitSpeechRecognition', { configurable: true, writable: true, value: savedWebkit })
  }
}

/** Installs the fake analyser and the fake source on the shared audio context. */
function useFakeAnalyser(): void {
  analyser = new FakeAnalyser()
  source = new FakeSource()
  vi.spyOn(window.AudioContext.prototype, 'createAnalyser').mockImplementation(
    () => analyser as unknown as SetupAnalyserNode,
  )
  vi.spyOn(window.AudioContext.prototype, 'createMediaStreamSource').mockImplementation(
    () => source as unknown as ReturnType<typeof window.AudioContext.prototype.createMediaStreamSource>,
  )
}

/* ---------------------------------------------------------------------------
   Support
   --------------------------------------------------------------------------- */

describe('isRecordingSupported', () => {
  it('is true when the browser has a microphone and an audio context', () => {
    expect(isRecordingSupported()).toBe(true)
  })

  it('is false when there is no navigator at all', () => {
    vi.stubGlobal('navigator', undefined)
    expect(isRecordingSupported()).toBe(false)
  })

  it('is false when the browser exposes no media devices', () => {
    vi.stubGlobal('navigator', {})
    expect(isRecordingSupported()).toBe(false)
  })

  it('is false when getUserMedia is not a function', () => {
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia: 'not callable' } })
    expect(isRecordingSupported()).toBe(false)
  })

  it('is false when the browser has no audio context', async () => {
    await withoutAudioContext(() => {
      expect(isRecordingSupported()).toBe(false)
    })
  })

  it('is true when only the prefixed audio context is available', async () => {
    await withoutStandardAudioContext(() => {
      expect(isRecordingSupported()).toBe(true)
    })
  })
})

describe('isSpeechRecognitionSupported', () => {
  it('is true when the browser has the standard API', () => {
    expect(isSpeechRecognitionSupported()).toBe(true)
  })

  it('is true when only the prefixed API is available', async () => {
    await withoutStandardRecognition(() => {
      expect(isSpeechRecognitionSupported()).toBe(true)
    })
  })

  it('is false when the browser has neither API', async () => {
    await withoutRecognition(() => {
      expect(isSpeechRecognitionSupported()).toBe(false)
    })
  })
})

/* ---------------------------------------------------------------------------
   Starting
   --------------------------------------------------------------------------- */

describe('VoiceRecorder.start', () => {
  beforeEach(() => {
    useFakeAnalyser()
  })

  afterEach(() => {
    for (const recorder of liveRecorders.splice(0)) recorder.dispose()
  })

  it('starts out idle', () => {
    expect(new VoiceRecorder().getState()).toBe('idle')
  })

  it('reports a browser that cannot record', async () => {
    const { recorder, onStateChange, onError } = makeRecorder()
    vi.stubGlobal('navigator', {})

    await expect(recorder.start()).resolves.toBe(false)

    expect(recorder.getState()).toBe('unsupported')
    expect(onStateChange).toHaveBeenCalledTimes(1)
    expect(onStateChange).toHaveBeenCalledWith('unsupported')
    expect(onError).toHaveBeenCalledWith('This browser does not expose microphone access.')
  })

  it('reports a denied permission', async () => {
    const { recorder, onStateChange, onError } = makeRecorder()
    vi.spyOn(navigator.mediaDevices, 'getUserMedia').mockRejectedValue(
      new DOMException('Permission denied', 'NotAllowedError'),
    )

    await expect(recorder.start()).resolves.toBe(false)

    expect(recorder.getState()).toBe('denied')
    expect(onStateChange).toHaveBeenCalledWith('denied')
    expect(onError).toHaveBeenCalledWith(
      'Microphone permission was denied. You can still type your answer — the estimate will use the written form.',
    )
  })

  it('reports a blocked permission the same way', async () => {
    const { recorder, onError } = makeRecorder()
    vi.spyOn(navigator.mediaDevices, 'getUserMedia').mockRejectedValue(
      new DOMException('Blocked', 'SecurityError'),
    )

    await expect(recorder.start()).resolves.toBe(false)

    expect(recorder.getState()).toBe('denied')
    expect(onError).toHaveBeenCalledWith(
      'Microphone permission was denied. You can still type your answer — the estimate will use the written form.',
    )
  })

  it('reports a missing microphone', async () => {
    const { recorder, onStateChange, onError } = makeRecorder()
    vi.spyOn(navigator.mediaDevices, 'getUserMedia').mockRejectedValue(
      new DOMException('No device', 'NotFoundError'),
    )

    await expect(recorder.start()).resolves.toBe(false)

    expect(recorder.getState()).toBe('error')
    expect(onStateChange).toHaveBeenCalledWith('error')
    expect(onError).toHaveBeenCalledWith('No microphone was found. You can still type your answer.')
  })

  it('reports a failure that is not a DOM exception', async () => {
    const { recorder, onError } = makeRecorder()
    vi.spyOn(navigator.mediaDevices, 'getUserMedia').mockRejectedValue(new Error('boom'))

    await expect(recorder.start()).resolves.toBe(false)

    expect(recorder.getState()).toBe('error')
    expect(onError).toHaveBeenCalledWith('No microphone was found. You can still type your answer.')
  })

  it('records once the microphone is granted', async () => {
    useStream()
    const { recorder, onStateChange } = makeRecorder()
    const start = vi.spyOn(window.MediaRecorder.prototype, 'start')

    await expect(recorder.start()).resolves.toBe(true)

    expect(recorder.getState()).toBe('recording')
    expect(onStateChange.mock.calls).toEqual([['requesting'], ['recording']])
    expect(start).toHaveBeenCalledWith(250)
    expect(analyser.fftSize).toBe(1024)
    expect(analyser.smoothingTimeConstant).toBe(0.4)
    expect(source.connectedTo).toBe(analyser)
  })

  it('does nothing when it is already recording', async () => {
    useStream()
    const { recorder, onStateChange } = makeRecorder()
    await recorder.start()

    await expect(recorder.start()).resolves.toBe(true)

    expect(vi.mocked(navigator.mediaDevices.getUserMedia)).toHaveBeenCalledTimes(1)
    expect(onStateChange.mock.calls).toEqual([['requesting'], ['recording']])
  })

  it('gives up when the recording is stopped while the prompt is open', async () => {
    const track = { stop: vi.fn<() => void>() }
    const stream = { getTracks: () => [track] } as unknown as MediaStream
    let grant: (value: MediaStream) => void = () => {
      throw new Error('the microphone was never granted')
    }
    vi.spyOn(navigator.mediaDevices, 'getUserMedia').mockImplementation(
      () =>
        new Promise<MediaStream>((resolve) => {
          grant = resolve
        }),
    )
    const { recorder } = makeRecorder()

    const started = recorder.start()
    await recorder.stop()
    grant(stream)
    await expect(started).resolves.toBe(false)

    expect(track.stop).toHaveBeenCalledTimes(1)
    expect(recorder.getState()).toBe('idle')
  })

  it('reports a failure to build the analyser', async () => {
    const { track } = useStream()
    vi.spyOn(window.AudioContext.prototype, 'createAnalyser').mockImplementation(() => {
      throw new Error('no analyser')
    })
    const { recorder, onStateChange, onError } = makeRecorder()

    await expect(recorder.start()).resolves.toBe(false)

    expect(recorder.getState()).toBe('error')
    expect(onStateChange).toHaveBeenCalledWith('error')
    expect(onError).toHaveBeenCalledWith('Failed to initialize audio analyzer.')
    expect(track.stop).toHaveBeenCalledTimes(1)
  })

  it('resumes an audio context that starts suspended', async () => {
    useStream()
    const resume = vi.fn(async () => undefined)
    class SuspendedContext {
      state: AudioContextState = 'suspended'
      sampleRate = 44100
      destination = {}
      resume = resume
      close = vi.fn(async () => undefined)
      createAnalyser(): AnalyserNode {
        return analyser as unknown as AnalyserNode
      }
      createMediaStreamSource(): unknown {
        return source
      }
    }
    vi.stubGlobal('AudioContext', SuspendedContext as unknown as typeof AudioContext)
    const { recorder } = makeRecorder()

    await expect(recorder.start()).resolves.toBe(true)

    expect(resume).toHaveBeenCalledTimes(1)
    expect(recorder.getState()).toBe('recording')
  })

  it('carries on when the audio context cannot be resumed', async () => {
    useStream()
    class BrokenContext {
      state: AudioContextState = 'suspended'
      sampleRate = 44100
      destination = {}
      resume = vi.fn(async () => {
        throw new Error('cannot resume')
      })
      close = vi.fn(async () => undefined)
      createAnalyser(): AnalyserNode {
        return analyser as unknown as AnalyserNode
      }
      createMediaStreamSource(): unknown {
        return source
      }
    }
    vi.stubGlobal('AudioContext', BrokenContext as unknown as typeof AudioContext)
    const { recorder, onError } = makeRecorder()

    await expect(recorder.start()).resolves.toBe(true)

    expect(recorder.getState()).toBe('recording')
    expect(onError).not.toHaveBeenCalled()
  })

  it('falls back to the prefixed audio context', async () => {
    useStream()
    await withoutStandardAudioContext(async () => {
      const { recorder } = makeRecorder()
      await expect(recorder.start()).resolves.toBe(true)
      expect(recorder.getState()).toBe('recording')
    })
  })

  it('records without an analyser when the browser has no audio context', async () => {
    useStream()
    vi.stubGlobal('AudioContext', undefined)
    vi.stubGlobal('webkitAudioContext', undefined)
    const { recorder, onLevel } = makeRecorder()

    await expect(recorder.start()).resolves.toBe(true)

    expect(recorder.getState()).toBe('recording')
    expect(onLevel).not.toHaveBeenCalled()
  })

  it('records without a media recorder', async () => {
    useStream()
    vi.stubGlobal('MediaRecorder', undefined)
    const { recorder } = makeRecorder()

    await expect(recorder.start()).resolves.toBe(true)

    expect(recorder.getState()).toBe('recording')
  })

  it('falls back to a recorder without a mime type', async () => {
    useStream()
    vi.spyOn(window.MediaRecorder, 'isTypeSupported').mockImplementation(() => {
      throw new Error('no idea')
    })
    const { recorder } = makeRecorder()

    await expect(recorder.start()).resolves.toBe(true)

    expect(recorder.getState()).toBe('recording')
  })

  it('carries on when the media recorder cannot be created', async () => {
    useStream()
    class BrokenRecorder {
      constructor() {
        throw new Error('no recorder')
      }
    }
    vi.stubGlobal('MediaRecorder', BrokenRecorder as unknown as typeof MediaRecorder)
    const { recorder } = makeRecorder()

    await expect(recorder.start()).resolves.toBe(true)

    expect(recorder.getState()).toBe('recording')
  })

  it('carries on when the media recorder refuses to start', async () => {
    useStream()
    class BrokenRecorder {
      state = 'inactive'
      mimeType = 'audio/webm'
      start(): void {
        throw new Error('cannot start')
      }
      stop(): void {}
    }
    vi.stubGlobal('MediaRecorder', BrokenRecorder as unknown as typeof MediaRecorder)
    const { recorder } = makeRecorder()

    await expect(recorder.start()).resolves.toBe(true)

    expect(recorder.getState()).toBe('recording')
  })
})

/* ---------------------------------------------------------------------------
   The level meter
   --------------------------------------------------------------------------- */

describe('VoiceRecorder level meter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useFakeAnalyser()
  })

  afterEach(() => {
    vi.useRealTimers()
    for (const recorder of liveRecorders.splice(0)) recorder.dispose()
  })

  it('reports silence for a silent signal', async () => {
    useStream()
    const { recorder, onLevel } = makeRecorder()

    await recorder.start()

    expect(onLevel).toHaveBeenCalledTimes(1)
    expect(onLevel).toHaveBeenCalledWith({ level: 0, speechiness: 0 })
  })

  it('reports a loud signal as speech', async () => {
    analyser.wave = constant(1)
    useStream()
    const { recorder, onLevel } = makeRecorder()

    await recorder.start()

    expect(onLevel).toHaveBeenCalledWith({ level: 1, speechiness: 1 })
  })

  it('reports a quiet signal as silence', async () => {
    analyser.wave = constant(1)
    useStream()
    const { recorder, onLevel } = makeRecorder()
    await recorder.start()

    analyser.wave = constant(0.1)
    await vi.advanceTimersByTimeAsync(16)

    expect(onLevel).toHaveBeenCalledTimes(2)
    const level = onLevel.mock.calls[1]?.[0] as RecorderLevel
    // The running peak is still the loud frame, so the quiet one is a fraction of it.
    expect(level.level).toBeCloseTo(0.1 / (0.9995 * 0.85), 6)
    expect(level.speechiness).toBe(0)
  })

  it('counts a pause after a long silence', async () => {
    analyser.waves = [constant(1), ...Array.from({ length: 9 }, () => constant(0.01)), constant(1)]
    useStream()
    const { recorder, onLevel } = makeRecorder()

    await recorder.start()
    await vi.advanceTimersByTimeAsync(160)

    expect(onLevel).toHaveBeenCalledTimes(11)
    const { analysis } = await recorder.stop()
    expect(analysis.pauseCount).toBe(1)
    // The silent frames are counted as they arrive and cleared the moment
    // speech comes back, so the two speech frames are the whole take.
    expect(analysis.speechRatio).toBe(1)
  })

  it('keeps the energy buffer bounded', async () => {
    // The first frame is loud, every frame after it is quiet: with the buffer
    // capped at ten thousand samples the loud frame falls out of the window
    // and the variance collapses to nothing. The quiet frames are quiet
    // enough for the pitch detector to skip them, which keeps ten thousand
    // frames cheap.
    analyser.wave = () => (analyser.frames === 1 ? 1 : 0.002)
    useStream()
    const { recorder } = makeRecorder()

    await recorder.start()
    for (let chunk = 0; chunk < 17; chunk += 1) {
      await vi.advanceTimersByTimeAsync(10_000)
    }
    const { analysis } = await recorder.stop()

    expect(analysis.energyVariance).toBe(0)
  }, 30_000)

  it('measures the pitch of a tone', async () => {
    analyser.wave = square(220)
    useStream()
    const { recorder } = makeRecorder()

    await recorder.start()
    const { analysis } = await recorder.stop()

    expect(analysis.meanPitchHz).toBe(200)
  })

  it('ignores a tone that is too high to be a voice', async () => {
    analyser.wave = square(110)
    useStream()
    const { recorder, onLevel } = makeRecorder()

    await recorder.start()
    const { analysis } = await recorder.stop()

    expect(onLevel).toHaveBeenCalledWith({ level: 1, speechiness: 1 })
    expect(analysis.meanPitchHz).toBeNull()
  })

  it('ignores a signal that is too quiet to analyse', async () => {
    analyser.wave = constant(0.005)
    useStream()
    const { recorder } = makeRecorder()

    await recorder.start()
    const { analysis } = await recorder.stop()

    expect(analysis.meanPitchHz).toBeNull()
  })

  it('ignores noise', async () => {
    analyser.wave = noise
    useStream()
    const { recorder } = makeRecorder()

    await recorder.start()
    const { analysis } = await recorder.stop()

    expect(analysis.meanPitchHz).toBeNull()
  })

  it('ignores a frame that is too short to analyse', async () => {
    class FastContext {
      state: AudioContextState = 'running'
      sampleRate = 192_000
      destination = {}
      resume = vi.fn(async () => undefined)
      close = vi.fn(async () => undefined)
      createAnalyser(): AnalyserNode {
        return analyser as unknown as AnalyserNode
      }
      createMediaStreamSource(): unknown {
        return source
      }
    }
    vi.stubGlobal('AudioContext', FastContext as unknown as typeof AudioContext)
    analyser.wave = square(220)
    useStream()
    const { recorder } = makeRecorder()

    await recorder.start()
    const { analysis } = await recorder.stop()

    expect(analysis.meanPitchHz).toBeNull()
  })

  it('keeps ticking after the recorder has been disposed', async () => {
    analyser.wave = constant(1)
    useStream()
    const { recorder, onLevel } = makeRecorder()
    await recorder.start()
    const levelBefore = onLevel.mock.calls.length

    // A browser that ignores the cancel request leaves the frame queued; the
    // next one runs without an audio context.
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined)
    recorder.dispose()
    await vi.advanceTimersByTimeAsync(16)

    expect(onLevel.mock.calls.length).toBe(levelBefore + 1)
  })
})

/* ---------------------------------------------------------------------------
   Speech recognition
   --------------------------------------------------------------------------- */

describe('VoiceRecorder speech recognition', () => {
  beforeEach(() => {
    FakeRecognition.instances = []
    useFakeAnalyser()
    vi.stubGlobal('SpeechRecognition', FakeRecognition)
  })

  afterEach(() => {
    for (const recorder of liveRecorders.splice(0)) recorder.dispose()
  })

  it('starts the recogniser in English', async () => {
    useStream()
    const { recorder } = makeRecorder()

    await recorder.start()

    const recognition = lastRecognition()
    expect(recognition.started).toBe(true)
    expect(recognition.continuous).toBe(true)
    expect(recognition.interimResults).toBe(true)
    expect(recognition.lang).toBe('en-US')
    expect(recognition.onerror).not.toBeNull()
  })

  it('assembles a transcript from the final results', async () => {
    useStream()
    const { recorder, onTranscript } = makeRecorder()
    await recorder.start()

    lastRecognition().onresult?.({
      resultIndex: 0,
      results: [
        { isFinal: true, 0: { transcript: 'The cat sat' } },
        { isFinal: true, 0: { transcript: 'on the mat' } },
      ],
    })

    expect(onTranscript).toHaveBeenCalledWith('The cat sat on the mat')
  })

  it('adds an interim result to the transcript', async () => {
    useStream()
    const { recorder, onTranscript } = makeRecorder()
    await recorder.start()

    lastRecognition().onresult?.({
      resultIndex: 0,
      results: [{ isFinal: false, 0: { transcript: 'the cat' } }],
    })

    expect(onTranscript).toHaveBeenCalledWith('the cat')
  })

  it('keeps a final transcript that already contains the interim one', async () => {
    useStream()
    const { recorder, onTranscript } = makeRecorder()
    await recorder.start()

    lastRecognition().onresult?.({
      resultIndex: 0,
      results: [{ isFinal: true, 0: { transcript: 'the cat' } }],
    })
    lastRecognition().onresult?.({
      resultIndex: 0,
      results: [{ isFinal: false, 0: { transcript: 'cat' } }],
    })

    expect(onTranscript).toHaveBeenNthCalledWith(1, 'the cat')
    expect(onTranscript).toHaveBeenNthCalledWith(2, 'the cat  cat')
  })

  it('skips a result that carries no text', async () => {
    useStream()
    const { recorder, onTranscript } = makeRecorder()
    await recorder.start()

    lastRecognition().onresult?.({
      resultIndex: 0,
      results: [{ isFinal: true, 0: { transcript: '   ' } }],
    })

    expect(onTranscript).not.toHaveBeenCalled()
  })

  it('skips a result slot that was never filled in', async () => {
    useStream()
    const { recorder, onTranscript } = makeRecorder()
    await recorder.start()

    const results: Array<{ isFinal: boolean; 0: { transcript: string } }> = []
    results[0] = { isFinal: true, 0: { transcript: 'first' } }
    results[2] = { isFinal: true, 0: { transcript: 'third' } }
    lastRecognition().onresult?.({ resultIndex: 0, results })

    expect(onTranscript).toHaveBeenCalledWith('first third')
  })

  it('ignores a recognition error', async () => {
    useStream()
    const { recorder, onError, onStateChange } = makeRecorder()
    await recorder.start()

    lastRecognition().onerror?.({ error: 'network' })

    expect(onError).not.toHaveBeenCalled()
    expect(onStateChange).not.toHaveBeenCalledWith('error')
    expect(recorder.getState()).toBe('recording')
  })

  it('ignores a recognition error that says the microphone is not allowed', async () => {
    useStream()
    const { recorder, onError } = makeRecorder()
    await recorder.start()

    lastRecognition().onerror?.({ error: 'not-allowed' })

    expect(onError).not.toHaveBeenCalled()
    expect(recorder.getState()).toBe('recording')
  })

  it('carries on when the recogniser refuses to start', async () => {
    class BrokenRecognition {
      lang = ''
      continuous = false
      interimResults = false
      onresult = null
      onerror = null
      onend = null
      start(): void {
        throw new Error('cannot start')
      }
      stop(): void {}
      abort(): void {}
    }
    vi.stubGlobal('SpeechRecognition', BrokenRecognition)
    useStream()
    const { recorder } = makeRecorder()

    await expect(recorder.start()).resolves.toBe(true)

    expect(recorder.getState()).toBe('recording')
  })

  it('records without a recogniser when the browser has none', async () => {
    useStream()
    await withoutRecognition(async () => {
      const { recorder } = makeRecorder()
      await expect(recorder.start()).resolves.toBe(true)
      expect(recorder.getState()).toBe('recording')
    })
  })
})

/* ---------------------------------------------------------------------------
   Stopping
   --------------------------------------------------------------------------- */

describe('VoiceRecorder.stop', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useFakeAnalyser()
    FakeRecognition.instances = []
    vi.stubGlobal('SpeechRecognition', FakeRecognition)
  })

  afterEach(() => {
    vi.useRealTimers()
    for (const recorder of liveRecorders.splice(0)) recorder.dispose()
  })

  it('stops cleanly when nothing was recorded', async () => {
    const { recorder, onStateChange } = makeRecorder()

    const result = await recorder.stop()

    expect(result.transcript).toBe('')
    expect(result.audioBlob).toBeNull()
    expect(result.analysis).toEqual({
      durationMs: 0,
      wordsPerMinute: 0,
      speechRatio: 0,
      pauseCount: 0,
      meanPitchHz: null,
      energyVariance: 0,
      reliable: false,
    })
    expect(onStateChange).not.toHaveBeenCalled()
  })

  it('releases the microphone and returns to idle', async () => {
    const { track } = useStream()
    const { recorder, onStateChange } = makeRecorder()
    await recorder.start()

    await vi.advanceTimersByTimeAsync(2000)
    const result = await recorder.stop()

    expect(track.stop).toHaveBeenCalledTimes(1)
    expect(recorder.getState()).toBe('idle')
    expect(onStateChange).toHaveBeenLastCalledWith('idle')
    expect(result.analysis.durationMs).toBe(2000)
    expect(result.analysis.reliable).toBe(true)
    expect(result.analysis.speechRatio).toBe(0)
    expect(result.analysis.meanPitchHz).toBeNull()
  })

  it('stops the media recorder and the recogniser', async () => {
    useStream()
    const stop = vi.spyOn(window.MediaRecorder.prototype, 'stop')
    const { recorder } = makeRecorder()
    await recorder.start()
    const recognition = lastRecognition()

    await recorder.stop()

    expect(stop).toHaveBeenCalledTimes(1)
    expect(recognition.stopped).toBe(true)
  })

  it('returns the recorded audio as a blob', async () => {
    class ChunkedRecorder {
      state = 'inactive'
      mimeType = ''
      ondataavailable: ((event: { data: Blob | null }) => void) | null = null
      onstop: (() => void) | null = null
      start(): void {
        this.state = 'recording'
      }
      stop(): void {
        this.state = 'inactive'
        this.ondataavailable?.({ data: new Blob(['abc'], { type: 'audio/webm' }) })
        this.onstop?.()
      }
    }
    vi.stubGlobal('MediaRecorder', ChunkedRecorder as unknown as typeof MediaRecorder)
    useStream()
    const { recorder } = makeRecorder()
    await recorder.start()

    const result = await recorder.stop()

    expect(result.audioBlob).not.toBeNull()
    expect(result.audioBlob?.size).toBe(3)
    // The recorder had no mime type of its own, so the default is used.
    expect(result.audioBlob?.type).toBe('audio/webm')
  })

  it('ignores a chunk that carries no data', async () => {
    class EmptyRecorder {
      state = 'inactive'
      mimeType = 'audio/webm'
      ondataavailable: ((event: { data: Blob | null }) => void) | null = null
      onstop: (() => void) | null = null
      start(): void {
        this.state = 'recording'
      }
      stop(): void {
        this.state = 'inactive'
        this.ondataavailable?.({ data: null })
        this.onstop?.()
      }
    }
    vi.stubGlobal('MediaRecorder', EmptyRecorder as unknown as typeof MediaRecorder)
    useStream()
    const { recorder } = makeRecorder()
    await recorder.start()

    const result = await recorder.stop()

    expect(result.audioBlob).toBeNull()
  })

  it('survives a media recorder that throws when it stops', async () => {
    class BrokenRecorder {
      state = 'inactive'
      mimeType = 'audio/webm'
      start(): void {
        this.state = 'recording'
      }
      stop(): void {
        this.state = 'inactive'
        throw new Error('cannot stop')
      }
    }
    vi.stubGlobal('MediaRecorder', BrokenRecorder as unknown as typeof MediaRecorder)
    useStream()
    const { recorder } = makeRecorder()
    await recorder.start()

    const result = await recorder.stop()

    expect(result.audioBlob).toBeNull()
    expect(recorder.getState()).toBe('idle')
  })

  it('survives a recogniser that throws when it stops', async () => {
    class BrokenRecognition {
      lang = ''
      continuous = false
      interimResults = false
      onresult = null
      onerror = null
      onend = null
      start(): void {}
      stop(): void {
        throw new Error('cannot stop')
      }
      abort(): void {}
    }
    vi.stubGlobal('SpeechRecognition', BrokenRecognition)
    useStream()
    const { recorder } = makeRecorder()
    await recorder.start()

    const result = await recorder.stop()

    expect(result.transcript).toBe('')
    expect(recorder.getState()).toBe('idle')
  })

  it('closes the audio context', async () => {
    useStream()
    const close = vi.spyOn(window.AudioContext.prototype, 'close')
    const { recorder } = makeRecorder()
    await recorder.start()

    await recorder.stop()

    expect(close).toHaveBeenCalledTimes(1)
  })

  it('survives an audio context that refuses to close', async () => {
    class BrokenContext {
      state: AudioContextState = 'running'
      sampleRate = 44100
      destination = {}
      resume = vi.fn(async () => undefined)
      close = vi.fn(async () => {
        throw new Error('cannot close')
      })
      createAnalyser(): AnalyserNode {
        return analyser as unknown as AnalyserNode
      }
      createMediaStreamSource(): unknown {
        return source
      }
    }
    vi.stubGlobal('AudioContext', BrokenContext as unknown as typeof AudioContext)
    useStream()
    const { recorder } = makeRecorder()
    await recorder.start()

    const result = await recorder.stop()

    expect(result.analysis.durationMs).toBe(0)
    expect(recorder.getState()).toBe('idle')
  })

  it('keeps the last interim result in the transcript', async () => {
    useStream()
    const { recorder } = makeRecorder()
    await recorder.start()

    lastRecognition().onresult?.({
      resultIndex: 0,
      results: [{ isFinal: false, 0: { transcript: 'half a sentence' } }],
    })
    const result = await recorder.stop()

    expect(result.transcript).toBe('half a sentence')
  })

  it('measures the words per minute', async () => {
    useStream()
    const { recorder } = makeRecorder()
    await recorder.start()

    lastRecognition().onresult?.({
      resultIndex: 0,
      results: [{ isFinal: true, 0: { transcript: 'one two three' } }],
    })
    await vi.advanceTimersByTimeAsync(30_000)
    const result = await recorder.stop()

    expect(result.transcript).toBe('one two three')
    expect(result.analysis.wordsPerMinute).toBe(6)
  })

  it('does not report a state change twice', async () => {
    useStream()
    const { recorder, onStateChange } = makeRecorder()
    await recorder.start()

    await recorder.stop()
    onStateChange.mockClear()
    await recorder.stop()

    expect(onStateChange).not.toHaveBeenCalled()
  })
})

/* ---------------------------------------------------------------------------
   Disposing
   --------------------------------------------------------------------------- */

describe('VoiceRecorder.dispose', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useFakeAnalyser()
    FakeRecognition.instances = []
    vi.stubGlobal('SpeechRecognition', FakeRecognition)
  })

  afterEach(() => {
    vi.useRealTimers()
    for (const recorder of liveRecorders.splice(0)) recorder.dispose()
  })

  it('copes with being disposed before it starts', () => {
    const recorder = new VoiceRecorder()

    expect(() => recorder.dispose()).not.toThrow()
    expect(recorder.getState()).toBe('idle')
  })

  it('releases the microphone, the recorder and the recogniser', async () => {
    const { track } = useStream()
    const stop = vi.spyOn(window.MediaRecorder.prototype, 'stop')
    const close = vi.spyOn(window.AudioContext.prototype, 'close')
    const { recorder } = makeRecorder()
    await recorder.start()
    const recognition = lastRecognition()

    recorder.dispose()

    expect(stop).toHaveBeenCalledTimes(1)
    expect(track.stop).toHaveBeenCalledTimes(1)
    expect(close).toHaveBeenCalledTimes(1)
    expect(recognition.aborted).toBe(true)
  })

  it('ignores an audio context that refuses to close', async () => {
    class BrokenContext {
      state: AudioContextState = 'running'
      sampleRate = 44100
      destination = {}
      resume = vi.fn(async () => undefined)
      close = vi.fn(async () => {
        throw new Error('cannot close')
      })
      createAnalyser(): AnalyserNode {
        return analyser as unknown as AnalyserNode
      }
      createMediaStreamSource(): unknown {
        return source
      }
    }
    vi.stubGlobal('AudioContext', BrokenContext as unknown as typeof AudioContext)
    useStream()
    const { recorder } = makeRecorder()
    await recorder.start()

    expect(() => recorder.dispose()).not.toThrow()
    expect(recorder.getState()).toBe('recording')
  })

  it('ignores a media recorder that throws when it stops', async () => {
    class BrokenRecorder {
      state = 'inactive'
      mimeType = 'audio/webm'
      start(): void {
        this.state = 'recording'
      }
      stop(): void {
        throw new Error('cannot stop')
      }
    }
    vi.stubGlobal('MediaRecorder', BrokenRecorder as unknown as typeof MediaRecorder)
    useStream()
    const { recorder } = makeRecorder()
    await recorder.start()

    expect(() => recorder.dispose()).not.toThrow()
  })

  it('ignores a recogniser that throws when it aborts', async () => {
    class BrokenRecognition {
      lang = ''
      continuous = false
      interimResults = false
      onresult = null
      onerror = null
      onend = null
      start(): void {}
      stop(): void {}
      abort(): void {
        throw new Error('cannot abort')
      }
    }
    vi.stubGlobal('SpeechRecognition', BrokenRecognition)
    useStream()
    const { recorder } = makeRecorder()
    await recorder.start()

    expect(() => recorder.dispose()).not.toThrow()
  })
})
