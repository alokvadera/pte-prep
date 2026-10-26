import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Recorder, TypedAnswer } from '../../src/components/recorder/Recorder'
import { useSettings } from '../../src/store/useSettings'
import { installFetchMock } from '../helpers/fetch'

/* ---------------------------------------------------------------------------
   The recorder.

   Recording is the one part of the runner that touches the machine rather
   than the page: it asks for the microphone, watches the level, and hands the
   analysis back to the item. The tests below drive that whole path, plus the
   two ways it can fail — a refused microphone and a browser with no Web
   Audio at all.
   --------------------------------------------------------------------------- */

/**
 * A frame queue.
 *
 * The recorder samples the microphone on every animation frame. The queue is
 * flushed by hand so a test decides exactly how many samples are taken.
 */
function stubAnimationFrames(stepMs = 1000) {
  let queued: FrameRequestCallback[] = []
  let elapsed = 0
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    queued.push(cb)
    return queued.length
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    const i = id - 1
    if (queued[i]) queued[i] = () => {}
  })
  return {
    flush: () => {
      const pending = queued
      queued = []
      for (const cb of pending) {
        elapsed += stepMs
        cb(performance.now() + elapsed)
      }
    },
  }
}

/* ---------------------------------------------------------------------------
   A microphone the recorder can actually read.

   The browser environment's analyser node does not implement the time-domain
   read the recorder uses, so the recorder cannot run against it. This one can.
   --------------------------------------------------------------------------- */

/** The amplitude every sample is filled with; a test changes it between frames. */
let sampleLevel = 0.2

class ReadableAnalyser {
  fftSize = 2048
  smoothingTimeConstant = 0.4
  connect(node: unknown): unknown {
    return node
  }
  disconnect(): void {}
  getFloatTimeDomainData(buffer: Float32Array): void {
    buffer.fill(sampleLevel)
  }
  getByteFrequencyData(buffer: Uint8Array): void {
    buffer.fill(0)
  }
  getFloatFrequencyData(buffer: Float32Array): void {
    buffer.fill(0)
  }
}

class ReadableAudioContext {
  state: AudioContextState = 'running'
  currentTime = 0
  sampleRate = 44100
  destination = {
    connect(node: unknown): unknown {
      return node
    },
    disconnect(): void {},
  }
  resume(): Promise<void> {
    this.state = 'running'
    return Promise.resolve()
  }
  suspend(): Promise<void> {
    this.state = 'suspended'
    return Promise.resolve()
  }
  close(): Promise<void> {
    this.state = 'closed'
    return Promise.resolve()
  }
  createOscillator() {
    return {
      type: 'sine',
      frequency: {
        value: 0,
        setValueAtTime(): void {},
        exponentialRampToValueAtTime(): void {},
      },
      connect(node: unknown): unknown {
        return node
      },
      disconnect(): void {},
      start(): void {},
      stop(): void {},
    }
  }
  createGain() {
    return {
      gain: {
        value: 0,
        setValueAtTime(): void {},
        exponentialRampToValueAtTime(): void {},
      },
      connect(node: unknown): unknown {
        return node
      },
      disconnect(): void {},
    }
  }
  createAnalyser(): ReadableAnalyser {
    return new ReadableAnalyser()
  }
  createMediaStreamSource() {
    return {
      connect(node: unknown): unknown {
        return node
      },
      disconnect(): void {},
    }
  }
}

/**
 * A recorder that hands back audio.
 *
 * The browser environment's recorder produces an empty blob, and an empty blob
 * is never sent to the transcription service. This one produces a take.
 */
class RecordingMediaRecorder extends EventTarget {
  static isTypeSupported(): boolean {
    return true
  }
  state: 'inactive' | 'recording' | 'paused' = 'inactive'
  mimeType = 'audio/webm'
  ondataavailable: ((event: BlobEvent) => void) | null = null
  onstop: (() => void) | null = null
  onerror: ((event: Event) => void) | null = null

  start(): void {
    this.state = 'recording'
  }

  stop(): void {
    this.state = 'inactive'
    this.ondataavailable?.({
      data: new Blob(['a recorded take'], { type: 'audio/webm' }),
    } as BlobEvent)
    this.onstop?.()
  }

  pause(): void {
    this.state = 'paused'
  }

  resume(): void {
    this.state = 'recording'
  }
}

/** A speech recogniser the test can hand a transcript to. */
class CapturingRecognition extends EventTarget {
  static instances: CapturingRecognition[] = []
  lang = 'en-US'
  continuous = false
  interimResults = false
  maxAlternatives = 1
  onresult:
    | ((event: {
        resultIndex: number
        results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>
      }) => void)
    | null = null
  onerror: ((event: { error: string }) => void) | null = null
  onend: (() => void) | null = null
  onstart: (() => void) | null = null

  constructor() {
    super()
    CapturingRecognition.instances.push(this)
  }

  start(): void {
    this.onstart?.()
  }

  stop(): void {
    this.onend?.()
  }

  abort(): void {
    this.onend?.()
  }
}

const originalAudioContext = window.AudioContext
const originalWebkitAudioContext = window.webkitAudioContext
const originalSpeechRecognition = window.SpeechRecognition
const originalWebkitSpeechRecognition = window.webkitSpeechRecognition

function renderRecorder(props: Partial<React.ComponentProps<typeof Recorder>> = {}) {
  const onRecorded = vi.fn()
  const onTyped = vi.fn()
  const result = render(
    <Recorder itemId="item-1" seconds={40} onRecorded={onRecorded} onTyped={onTyped} {...props} />,
  )
  return { ...result, onRecorded, onTyped }
}

/** Starts a take and stops it, leaving the recorder in its finished state. */
async function recordTake(stop = true): Promise<void> {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /Start (recording|preparation)/ }))
  })
  if (!stop) return
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Stop recording' }))
  })
}

beforeEach(() => {
  vi.useFakeTimers()
  sampleLevel = 0.2
  CapturingRecognition.instances = []
  vi.stubGlobal('requestAnimationFrame', () => 0)
  vi.stubGlobal('cancelAnimationFrame', () => {})
  window.AudioContext = ReadableAudioContext as unknown as typeof AudioContext
  Object.defineProperty(window, 'SpeechRecognition', {
    configurable: true,
    value: CapturingRecognition,
  })
  useSettings.setState({
    settings: { ...useSettings.getState().settings, groqApiKey: '' },
  })
  installFetchMock([])
})

afterEach(() => {
  vi.useRealTimers()
  cleanup()
  window.AudioContext = originalAudioContext
  window.webkitAudioContext = originalWebkitAudioContext
  Object.defineProperty(window, 'SpeechRecognition', {
    configurable: true,
    value: originalSpeechRecognition,
  })
  Object.defineProperty(window, 'webkitSpeechRecognition', {
    configurable: true,
    value: originalWebkitSpeechRecognition,
  })
})

describe('Recorder', () => {
  it('offers a microphone and says how long the take may be', () => {
    renderRecorder()

    expect(screen.getByText('Record your response')).toBeInTheDocument()
    expect(screen.getByText('Up to 40 seconds.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Start recording/ })).toBeEnabled()
  })

  it('waits for the audio to finish before it records', () => {
    renderRecorder({ disabled: true })

    expect(screen.getByText(/Audio is playing/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Start recording/ })).toBeDisabled()
  })

  it('says when there is no microphone', () => {
    const audio = window.AudioContext
    const webkit = window.webkitAudioContext
    delete (window as { AudioContext?: unknown }).AudioContext
    delete (window as { webkitAudioContext?: unknown }).webkitAudioContext
    try {
      renderRecorder()
      expect(screen.getByText(/Microphone not detected/)).toBeInTheDocument()
    } finally {
      window.AudioContext = audio
      window.webkitAudioContext = webkit
    }
  })

  it('counts the preparation time down before it records', async () => {
    renderRecorder({ prepSeconds: 3 })

    expect(screen.getByRole('button', { name: 'Start preparation' })).toBeInTheDocument()
    expect(screen.getByText('3s to prepare, then up to 40s to speak.')).toBeInTheDocument()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Start preparation' }))
    })

    expect(screen.getByRole('timer')).toHaveAttribute('aria-label', '3 seconds to prepare')
    expect(screen.getByText('Prepare')).toBeInTheDocument()
  })

  it('gives up the preparation and waits', async () => {
    renderRecorder({ prepSeconds: 3 })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Start preparation' }))
    })
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.getByRole('button', { name: 'Start preparation' })).toBeInTheDocument()
  })

  it('starts recording once the preparation is over', async () => {
    renderRecorder({ prepSeconds: 2 })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Start preparation' }))
    })
    await act(async () => {
      vi.advanceTimersByTime(2000)
    })
    await act(async () => {})

    expect(screen.getByRole('button', { name: 'Stop recording' })).toBeInTheDocument()
  })

  it('shows that it is recording and how long is left', async () => {
    const { container } = renderRecorder()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Start recording/ }))
    })

    expect(screen.getByText('Recording')).toBeInTheDocument()
    expect(container.textContent).toContain('40s')
  })

  it('counts the recording time down', async () => {
    const { container } = renderRecorder()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Start recording/ }))
    })
    await act(async () => {
      vi.advanceTimersByTime(3000)
    })

    expect(container.textContent).toContain('37s')
  })

  it('stops the recording when the time is up', async () => {
    const { onRecorded } = renderRecorder({ seconds: 2 })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Start recording/ }))
    })
    await act(async () => {
      vi.advanceTimersByTime(2000)
    })
    await act(async () => {})

    expect(onRecorded).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Response captured')).toBeInTheDocument()
  })

  it('hands the analysis back when the take is stopped', async () => {
    const { onRecorded } = renderRecorder()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Start recording/ }))
    })
    await act(async () => {
      vi.advanceTimersByTime(2000)
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Stop recording' }))
    })

    expect(onRecorded).toHaveBeenCalledTimes(1)
    const [analysis, transcript] = onRecorded.mock.calls[0] as [
      { durationMs: number; wordsPerMinute: number; speechRatio: number },
      string,
    ]
    expect(analysis.durationMs).toBeGreaterThan(0)
    expect(analysis.wordsPerMinute).toBe(0)
    expect(analysis.speechRatio).toBe(1)
    expect(transcript).toBe('')
  })

  it('reports that the microphone was released', async () => {
    renderRecorder()

    await recordTake()

    expect(screen.getByText('Response captured')).toBeInTheDocument()
    expect(screen.getByText('Microphone released')).toBeInTheDocument()
  })

  it('shows the level meter while it records', async () => {
    const { container } = renderRecorder()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Start recording/ }))
    })

    const bars = container.querySelectorAll('span.h-full.flex-1')
    expect(bars).toHaveLength(48)
    expect(container.querySelectorAll('.bg-mint-500')).toHaveLength(48)
  })

  it('follows the level of the room', async () => {
    const frames = stubAnimationFrames()
    const { container } = renderRecorder()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Start recording/ }))
    })

    sampleLevel = 0.05
    act(() => {
      frames.flush()
    })

    expect(container.querySelectorAll('.bg-mint-500')).toHaveLength(8)
    expect(container.querySelectorAll('.bg-amber-500\\/60')).toHaveLength(7)
  })

  it('reports a refused microphone', async () => {
    const getUserMedia = navigator.mediaDevices.getUserMedia as unknown as ReturnType<typeof vi.fn>
    getUserMedia.mockRejectedValueOnce(new DOMException('Refused', 'NotAllowedError'))
    const { onRecorded } = renderRecorder()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Start recording/ }))
    })

    expect(screen.getByText('Answer not recorded')).toBeInTheDocument()
    expect(screen.getByText('Microphone permission denied')).toBeInTheDocument()
    expect(screen.getByText(/Microphone permission was denied/)).toBeInTheDocument()
    expect(onRecorded).not.toHaveBeenCalled()
  })

  it('reports a browser with no microphone at all', async () => {
    const audio = window.AudioContext
    const webkit = window.webkitAudioContext
    delete (window as { AudioContext?: unknown }).AudioContext
    delete (window as { webkitAudioContext?: unknown }).webkitAudioContext
    try {
      const { onRecorded } = renderRecorder()

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Start recording/ }))
      })

      expect(screen.getByText('Answer not recorded')).toBeInTheDocument()
      expect(screen.getByText('No microphone detected')).toBeInTheDocument()
      expect(screen.getByText(/does not expose microphone access/)).toBeInTheDocument()
      expect(onRecorded).not.toHaveBeenCalled()
    } finally {
      window.AudioContext = audio
      window.webkitAudioContext = webkit
    }
  })

  it('takes another go when the candidate asks for one', async () => {
    const { onRecorded } = renderRecorder()

    await recordTake()
    expect(onRecorded).toHaveBeenCalledTimes(1)

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Record again' }))
    })

    expect(screen.getByRole('button', { name: 'Stop recording' })).toBeInTheDocument()
  })

  it('takes the typed answer when there is no speech recognition', async () => {
    Object.defineProperty(window, 'SpeechRecognition', { configurable: true, value: undefined })
    Object.defineProperty(window, 'webkitSpeechRecognition', {
      configurable: true,
      value: undefined,
    })
    const { onTyped } = renderRecorder()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Start recording/ }))
    })
    expect(screen.getByText(/This browser cannot transcribe speech/)).toBeInTheDocument()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Stop recording' }))
    })
    const box = screen.getByRole('textbox') as HTMLTextAreaElement
    await act(async () => {
      fireEvent.change(box, { target: { value: 'Four words go here' } })
    })
    expect(onTyped).toHaveBeenCalledWith('Four words go here')
    expect(screen.getByText('4 words, this will be used for scoring')).toBeInTheDocument()
  })

  it('shows the transcript the browser heard', async () => {
    const { onRecorded } = renderRecorder()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Start recording/ }))
    })

    const recognition = CapturingRecognition.instances[0]
    expect(recognition).toBeDefined()
    await act(async () => {
      recognition?.onresult?.({
        resultIndex: 0,
        results: [{ isFinal: true, 0: { transcript: 'the quick brown fox' } }],
      } as never)
    })

    expect(screen.getByText('“the quick brown fox”')).toBeInTheDocument()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Stop recording' }))
    })

    expect(onRecorded).toHaveBeenCalledWith(expect.anything(), 'the quick brown fox')
    expect(screen.getByText('What the browser heard')).toBeInTheDocument()
    expect(screen.getByText('Web Speech (Free)')).toBeInTheDocument()
  })

  it('warns about a take that is too short to score', async () => {
    renderRecorder()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Start recording/ }))
    })
    await act(async () => {
      vi.advanceTimersByTime(300)
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Stop recording' }))
    })

    expect(screen.getByRole('status')).toHaveTextContent('under half a second')
  })

  it('does not warn about a take that is long enough', async () => {
    renderRecorder()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Start recording/ }))
    })
    await act(async () => {
      vi.advanceTimersByTime(2000)
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Stop recording' }))
    })

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('sends the take to the transcription service when AI Examiner is enabled', async () => {
    useSettings.setState({
      settings: {
        ...useSettings.getState().settings,
        groqApiKey: 'gsk-test',
        aiScoringEnabled: true,
      },
    })
    vi.stubGlobal('MediaRecorder', RecordingMediaRecorder)
    installFetchMock([
      {
        url: 'https://api.groq.com/openai/v1/audio/transcriptions',
        body: { text: 'the quick brown fox' },
      },
    ])
    const { onRecorded } = renderRecorder()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Start recording/ }))
    })
    expect(screen.getByText(/Listening for speech/)).toHaveTextContent('(Whisper Turbo on stop)')
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Stop recording' }))
    })
    await act(async () => {})

    expect(onRecorded).toHaveBeenCalledWith(expect.anything(), 'the quick brown fox')
    expect(screen.getByText('Transcribed via Whisper Turbo')).toBeInTheDocument()
    expect(screen.getByText('Groq Whisper Turbo')).toBeInTheDocument()
  })

  it('shows that it is transcribing while the service works', async () => {
    useSettings.setState({
      settings: {
        ...useSettings.getState().settings,
        groqApiKey: 'gsk-test',
        aiScoringEnabled: true,
      },
    })
    vi.stubGlobal('MediaRecorder', RecordingMediaRecorder)
    let resolveWhisper: (value: Response) => void = () => {}
    const pending = new Promise<Response>((resolve) => {
      resolveWhisper = resolve
    })
    vi.stubGlobal(
      'fetch',
      vi.fn(() => pending),
    )

    renderRecorder()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Start recording/ }))
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Stop recording' }))
    })

    expect(screen.getByText('Transcribing with Groq Whisper Turbo...')).toBeInTheDocument()

    await act(async () => {
      resolveWhisper(
        new Response(JSON.stringify({ text: 'the quick brown fox' }), {
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      await pending
    })

    expect(screen.getByText('the quick brown fox')).toBeInTheDocument()
  })

  it('falls back to the browser when the transcription service says nothing', async () => {
    useSettings.setState({
      settings: {
        ...useSettings.getState().settings,
        groqApiKey: 'gsk-test',
        aiScoringEnabled: true,
      },
    })
    vi.stubGlobal('MediaRecorder', RecordingMediaRecorder)
    installFetchMock([
      {
        url: 'https://api.groq.com/openai/v1/audio/transcriptions',
        body: { text: '   ' },
      },
    ])
    const { onRecorded } = renderRecorder()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Start recording/ }))
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Stop recording' }))
    })
    await act(async () => {})

    expect(onRecorded).toHaveBeenCalledWith(expect.anything(), '')
    expect(screen.queryByText('Transcribing with Groq Whisper Turbo...')).not.toBeInTheDocument()
  })

  it('falls back to the browser transcript when the service finds nothing', async () => {
    useSettings.setState({
      settings: {
        ...useSettings.getState().settings,
        groqApiKey: 'gsk-test',
        aiScoringEnabled: true,
      },
    })
    vi.stubGlobal('MediaRecorder', RecordingMediaRecorder)
    installFetchMock([
      {
        url: 'https://api.groq.com/openai/v1/audio/transcriptions',
        body: { text: '' },
      },
    ])
    renderRecorder()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Start recording/ }))
    })
    const recognition = CapturingRecognition.instances[0]
    await act(async () => {
      recognition?.onresult?.({
        resultIndex: 0,
        results: [{ isFinal: true, 0: { transcript: 'the quick brown fox' } }],
      } as never)
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Stop recording' }))
    })
    await act(async () => {})

    expect(screen.getByText('Browser Fallback')).toBeInTheDocument()
    expect(screen.getByText('What the browser heard')).toBeInTheDocument()
  })

  it('says the take will be transcribed when AI Examiner is enabled', async () => {
    useSettings.setState({
      settings: {
        ...useSettings.getState().settings,
        groqApiKey: 'gsk-test',
        aiScoringEnabled: true,
      },
    })
    renderRecorder()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Start recording/ }))
    })
    const recognition = CapturingRecognition.instances[0]
    await act(async () => {
      recognition?.onresult?.({
        resultIndex: 0,
        results: [{ isFinal: true, 0: { transcript: 'the quick brown fox' } }],
      } as never)
    })

    expect(screen.getByText('Whisper on stop')).toBeInTheDocument()
  })

  it('says the take will be transcribed when there is no speech recognition', async () => {
    useSettings.setState({
      settings: {
        ...useSettings.getState().settings,
        groqApiKey: 'gsk-test',
        aiScoringEnabled: true,
      },
    })
    Object.defineProperty(window, 'SpeechRecognition', { configurable: true, value: undefined })
    Object.defineProperty(window, 'webkitSpeechRecognition', {
      configurable: true,
      value: undefined,
    })
    renderRecorder()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Start recording/ }))
    })

    expect(
      screen.getByText('Recording audio. Whisper Turbo will transcribe on stop.'),
    ).toBeInTheDocument()
  })

  it('names the answer box when the item has no id', async () => {
    renderRecorder({ itemId: undefined })

    await recordTake()

    expect(screen.getByRole('textbox')).toHaveAttribute('id', 'typed-response')
  })

  it('ignores a second press of the stop button', async () => {
    const { onRecorded } = renderRecorder()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Start recording/ }))
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Stop recording' }))
      fireEvent.click(screen.getByRole('button', { name: 'Stop recording' }))
    })

    expect(onRecorded).toHaveBeenCalledTimes(1)
  })

  it('copes with the microphone button being pressed twice', async () => {
    const { onRecorded, unmount } = renderRecorder()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Start recording/ }))
      fireEvent.click(screen.getByRole('button', { name: /Start recording/ }))
    })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Stop recording' }))
    })
    unmount()

    // The first take's timer is still running. It must not disturb anything.
    await act(async () => {
      vi.advanceTimersByTime(41000)
    })

    expect(onRecorded).toHaveBeenCalledTimes(1)
  })

  it('copes with the preparation button being pressed twice', async () => {
    renderRecorder({ prepSeconds: 2 })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Start preparation' }))
      fireEvent.click(screen.getByRole('button', { name: 'Start preparation' }))
    })
    await act(async () => {
      vi.advanceTimersByTime(3000)
    })

    expect(screen.getByRole('button', { name: 'Stop recording' })).toBeInTheDocument()
  })

  it('abandons a take when the stimulus audio starts playing', async () => {
    const onRecorded = vi.fn()
    const { rerender } = renderRecorder({ onRecorded })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Start recording/ }))
    })
    expect(screen.getByRole('button', { name: 'Stop recording' })).toBeInTheDocument()

    // The stimulus audio starts. The microphone must not keep recording it,
    // or the transcript and the acoustic analysis are both contaminated.
    rerender(
      <Recorder itemId="item-1" seconds={40} onRecorded={onRecorded} onTyped={vi.fn()} disabled />,
    )

    expect(screen.getByRole('button', { name: /Start recording/ })).toBeInTheDocument()
    expect(onRecorded).not.toHaveBeenCalled()
  })

  it('opens the microphone only once when the button is pressed twice', async () => {
    // The second press arrives while the first is still asking for the
    // microphone. A second stream would be opened, the first recorder
    // overwritten, and the browser's recording indicator left on.
    vi.mocked(navigator.mediaDevices.getUserMedia).mockReturnValueOnce(
      new Promise<MediaStream>(() => {
        /* never resolves: the microphone is still being asked for */
      }),
    )

    renderRecorder()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Start recording/ }))
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Start recording/ }))
    })

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledTimes(1)
  })

  it('ignores a microphone that answers after the component is gone', async () => {
    let resolveStream: (value: MediaStream) => void = () => {}
    const pending = new Promise<MediaStream>((resolve) => {
      resolveStream = resolve
    })
    vi.mocked(navigator.mediaDevices.getUserMedia).mockReturnValueOnce(pending)
    const { unmount, onRecorded } = renderRecorder()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Start recording/ }))
    })
    unmount()
    await act(async () => {
      resolveStream({
        getTracks: () => [{ stop: () => {} }],
        getAudioTracks: () => [{ stop: () => {} }],
      } as unknown as MediaStream)
      await pending
    })

    // The microphone answering after the page has gone must not reach the
    // item: the answer would land on a question the candidate has left.
    expect(onRecorded).not.toHaveBeenCalled()
  })

  it('ignores a refused microphone that answers after the component is gone', async () => {
    let rejectStream: (reason: unknown) => void = () => {}
    const pending = new Promise<MediaStream>((_resolve, reject) => {
      rejectStream = reject
    })
    vi.mocked(navigator.mediaDevices.getUserMedia).mockReturnValueOnce(pending)
    const { unmount, onRecorded } = renderRecorder()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Start recording/ }))
    })
    unmount()
    await act(async () => {
      rejectStream(new DOMException('Refused', 'NotAllowedError'))
      await pending.catch(() => undefined)
    })

    expect(onRecorded).not.toHaveBeenCalled()
  })

  it('ignores a transcript that arrives after the component is gone', async () => {
    const { unmount, onRecorded } = renderRecorder()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Start recording/ }))
    })
    const recognition = CapturingRecognition.instances[0]
    unmount()
    await act(async () => {
      recognition?.onresult?.({
        resultIndex: 0,
        results: [{ isFinal: true, 0: { transcript: 'the quick brown fox' } }],
      } as never)
    })

    // Leaving the item finishes the take, so the answer is kept — but the
    // transcript that arrives afterwards must not record it a second time,
    // which would overwrite the answer with the late one.
    expect(onRecorded).toHaveBeenCalledTimes(1)
  })

  it('ignores a transcription that answers after the component is gone', async () => {
    useSettings.setState({
      settings: {
        ...useSettings.getState().settings,
        groqApiKey: 'gsk-test',
        aiScoringEnabled: true,
      },
    })
    vi.stubGlobal('MediaRecorder', RecordingMediaRecorder)
    installFetchMock([
      {
        url: 'https://api.groq.com/openai/v1/audio/transcriptions',
        body: { text: 'the quick brown fox' },
      },
    ])
    const { unmount, onRecorded } = renderRecorder()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Start recording/ }))
    })
    unmount()
    await act(async () => {})

    // The take is finished when the page is left, so the answer is kept; the
    // transcription that arrives afterwards must not record it again.
    expect(onRecorded).toHaveBeenCalledTimes(1)
  })

  it('ignores an empty transcription that answers after the component is gone', async () => {
    useSettings.setState({
      settings: {
        ...useSettings.getState().settings,
        groqApiKey: 'gsk-test',
        aiScoringEnabled: true,
      },
    })
    vi.stubGlobal('MediaRecorder', RecordingMediaRecorder)
    installFetchMock([
      {
        url: 'https://api.groq.com/openai/v1/audio/transcriptions',
        body: { text: '' },
      },
    ])
    const { unmount, onRecorded } = renderRecorder()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Start recording/ }))
    })
    unmount()
    await act(async () => {})

    expect(onRecorded).toHaveBeenCalledTimes(1)
  })
})

describe('TypedAnswer', () => {
  it('counts the words', () => {
    const { container } = render(<TypedAnswer value="three short words" onChange={() => {}} />)

    expect(container.querySelector('p')).toHaveTextContent('3 words')
  })

  it('counts nothing for an empty answer', () => {
    const { container } = render(<TypedAnswer value="   " onChange={() => {}} />)

    expect(container.querySelector('p')).toHaveTextContent('0 words')
  })

  it('says when the answer is too short', () => {
    const { container } = render(<TypedAnswer value="two" onChange={() => {}} minWords={50} />)

    expect(container.querySelector('p')).toHaveTextContent('minimum about 50')
    expect(container.querySelector('p')).toHaveTextContent('too short so far')
  })

  it('says when the answer is too long', () => {
    const { container } = render(<TypedAnswer value="a b c d e" onChange={() => {}} maxWords={3} />)

    expect(container.querySelector('p')).toHaveTextContent('maximum about 3')
    expect(container.querySelector('p')).toHaveTextContent('over length')
  })

  it('keeps the count away when it is not wanted', () => {
    const { container } = render(
      <TypedAnswer value="three short words" onChange={() => {}} showCount={false} />,
    )

    expect(container.querySelector('p')).toBeNull()
  })

  it('reports what was typed', () => {
    const onChange = vi.fn()
    render(<TypedAnswer value="" onChange={onChange} />)

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Hello' } })

    expect(onChange).toHaveBeenCalledWith('Hello')
  })

  it('takes the label and the rows it is given', () => {
    render(<TypedAnswer value="" onChange={() => {}} id="answer-1" label="Your answer" rows={9} />)

    const box = screen.getByRole('textbox', { name: 'Your answer' })
    expect(box).toHaveAttribute('id', 'answer-1')
    expect(box).toHaveAttribute('rows', '9')
  })
})
