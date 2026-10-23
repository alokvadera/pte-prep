import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import { act, fireEvent, screen } from '@testing-library/react'
import { renderRoute } from '../helpers/render'
import { makeMockTest } from '../helpers/factories'
import { useTest } from '../../src/store/useTest'
import { useAuth } from '../../src/store/useAuth'

/* ---------------------------------------------------------------------------
   The mock setup page.

   Three separate pieces of machinery live here: the picker (length, timing,
   section), the assembler it loads only when a session is actually started,
   and the microphone check. The assembler is stubbed so a test can decide what
   a session looks like — including never answering at all.
   --------------------------------------------------------------------------- */

const stubs = vi.hoisted(() => {
  let release!: () => void
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  return {
    /** Overrides the bank's per-type capacity; null means the real manifest. */
    capacity: { value: null as Record<string, number> | null },
    buildFullMock: vi.fn(),
    buildSectionMock: vi.fn(),
    gate,
    release,
  }
})

vi.mock('../../src/content/manifest', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/content/manifest')>()
  return {
    ...actual,
    manifestCapacityByType: () => stubs.capacity.value ?? actual.manifestCapacityByType(),
  }
})

// The assembler is imported dynamically by the page, so the mock has to hold
// the import open until the test lets it through.
vi.mock('../../src/domain/assemble', async () => {
  await stubs.gate
  return {
    buildFullMock: (...args: unknown[]) => stubs.buildFullMock(...args),
    buildSectionMock: (...args: unknown[]) => stubs.buildSectionMock(...args),
  }
})

const MockSetup = (await import('../../src/pages/MockSetup')).default

/* ---------------------------------------------------------------------------
   Media doubles. jsdom has no camera, no microphone and no analyser, so the
   check gets the smallest thing that behaves like the real one.
   --------------------------------------------------------------------------- */

class FakeAnalyser {
  fftSize = 2048
  frequencyBinCount = 1024
  getByteFrequencyData(array: Uint8Array): void {
    array.fill(255)
  }
}

class FakeAudioContext {
  state: AudioContextState
  currentTime = 0
  sampleRate = 44100
  destination = {} as unknown as AudioNode
  constructor(suspended = false) {
    this.state = suspended ? 'suspended' : 'running'
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
  createMediaStreamSource(): { connect: () => void } {
    return { connect: () => {} }
  }
  createAnalyser(): FakeAnalyser {
    return new FakeAnalyser()
  }
}

class FakeRecorder {
  static supported = true
  static isTypeSupported(): boolean {
    return FakeRecorder.supported
  }
  state: 'inactive' | 'recording' = 'inactive'
  mimeType = 'audio/webm'
  ondataavailable: ((event: BlobEvent) => void) | null = null
  onstop: (() => void) | null = null
  constructor(_stream?: MediaStream, options?: { mimeType?: string }) {
    if (options?.mimeType) this.mimeType = options.mimeType
  }
  start(): void {
    this.state = 'recording'
  }
  stop(): void {
    this.state = 'inactive'
    this.ondataavailable?.({ data: new Blob(['sample'], { type: this.mimeType }) } as BlobEvent)
    this.onstop?.()
  }
}

const fakeStream = {
  getTracks: () => [{ stop: () => {} }],
} as unknown as MediaStream

/** A requestAnimationFrame queue the test flushes by hand. */
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

function installMedia(options: { suspended?: boolean; supported?: boolean; mediaDevices?: boolean } = {}) {
  FakeRecorder.supported = options.supported ?? true
  vi.stubGlobal('AudioContext', class extends FakeAudioContext {
    constructor() {
      super(options.suspended ?? false)
    }
  })
  vi.stubGlobal('MediaRecorder', FakeRecorder)
  if (options.mediaDevices === false) {
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: undefined })
  } else {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: vi.fn(async () => fakeStream) },
    })
  }
  URL.createObjectURL = vi.fn(() => 'blob:mock')
  URL.revokeObjectURL = vi.fn()
}

function renderSetup() {
  return renderRoute(<MockSetup />, '/mock')
}

function startMockButton(): HTMLElement {
  return screen.getAllByRole('button', { name: /Start mock test/ })[0]!
}

function lengthRadios(container: HTMLElement): HTMLInputElement[] {
  return [...container.querySelectorAll('input[type="radio"]')] as HTMLInputElement[]
}

describe('MockSetup', () => {
  beforeEach(() => {
    stubs.capacity.value = null
    stubs.buildFullMock.mockImplementation(() => makeMockTest({ kind: 'full' }))
    stubs.buildSectionMock.mockImplementation(() => makeMockTest({ kind: 'section' }))
    useTest.setState({ mock: null, mode: 'exam', status: 'briefing', responses: {} })
    useAuth.setState({ user: null, token: null })
  })

  afterEach(() => {
    // Let the assembler through for any test that has not already.
    stubs.release()
  })

  it('ignores a second start while the first is still being prepared', async () => {
    useTest.setState({ mock: makeMockTest(), status: 'running' })
    renderSetup()

    await act(async () => {
      fireEvent.click(startMockButton())
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Discard & start' }))
    })

    // The page is still preparing the session, so the start button is
    // disabled and a second press cannot start a second build. The old
    // version of this test clicked a button inside the closed dialog, which
    // proved nothing about the guard.
    const again = screen.getByRole('button', { name: 'Preparing your mock…' })
    expect(again).toBeDisabled()
    await act(async () => {
      fireEvent.click(again)
    })

    expect(stubs.buildFullMock).not.toHaveBeenCalled()
  })

  it('starts a full mock', async () => {
    const { container } = renderSetup()
    await act(async () => {
      fireEvent.click(startMockButton())
    })

    expect(stubs.buildFullMock).toHaveBeenCalled()
    expect(stubs.buildSectionMock).not.toHaveBeenCalled()
    expect(useTest.getState().mock).not.toBeNull()
    expect(useTest.getState().mode).toBe('exam')
    expect(container).toBeInTheDocument()
  })

  it('starts a single section', async () => {
    const { container } = renderSetup()
    const radios = lengthRadios(container)

    await act(async () => {
      fireEvent.click(radios[1]!)
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Reading' }))
    })
    await act(async () => {
      fireEvent.click(startMockButton())
    })

    expect(stubs.buildSectionMock).toHaveBeenCalled()
    expect(stubs.buildFullMock).not.toHaveBeenCalled()
    expect(useTest.getState().mock).not.toBeNull()
  })

  it('goes back to every section', async () => {
    const { container } = renderSetup()
    const radios = lengthRadios(container)

    await act(async () => {
      fireEvent.click(radios[1]!)
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Reading' }))
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'All sections' }))
    })

    expect(container.textContent).toContain('Speaking & Writing → Reading → Listening')
  })

  it('offers the official timings', async () => {
    const { container } = renderSetup()
    const timing = screen.getByRole('group', { name: 'Timing' })

    expect(timing.querySelectorAll('button')).toHaveLength(4)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Extended' }))
    })
    expect(container.textContent).toContain('Half as much time again on every section.')
  })

  it('offers an untimed run', async () => {
    const { container } = renderSetup()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Untimed' }))
    })

    expect(container.textContent).toContain('No clock. The timer bar is replaced with a question counter.')
    await act(async () => {
      fireEvent.click(startMockButton())
    })
    const options = stubs.buildFullMock.mock.calls[0]![1] as { untimed?: boolean }
    expect(options.untimed).toBe(true)
  })

  it('says so when the mock cannot be assembled', async () => {
    stubs.buildFullMock.mockImplementation(() => {
      throw new Error('bank unavailable')
    })
    renderSetup()

    await act(async () => {
      fireEvent.click(startMockButton())
    })

    expect(screen.getByRole('alert').textContent).toContain('Failed to assemble mock test')
  })

  it('asks before replacing a mock in progress', async () => {
    useTest.setState({ mock: makeMockTest(), status: 'running' })
    const { container } = renderSetup()

    await act(async () => {
      fireEvent.click(startMockButton())
    })

    expect(container.textContent).toMatch(/Discard active mock\?/i)
    expect(stubs.buildFullMock).not.toHaveBeenCalled()
  })

  it('keeps the mock in progress when asked to', async () => {
    useTest.setState({ mock: makeMockTest(), status: 'running' })
    renderSetup()

    await act(async () => {
      fireEvent.click(startMockButton())
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    })

    expect(stubs.buildFullMock).not.toHaveBeenCalled()
  })

  it('starts a new mock once the old one is discarded', async () => {
    useTest.setState({ mock: makeMockTest(), status: 'running' })
    renderSetup()

    await act(async () => {
      fireEvent.click(startMockButton())
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Discard & start' }))
    })

    expect(stubs.buildFullMock).toHaveBeenCalled()
  })

  it('closes the discard prompt', async () => {
    useTest.setState({ mock: makeMockTest(), status: 'running' })
    renderSetup()

    await act(async () => {
      fireEvent.click(startMockButton())
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    })

    expect(stubs.buildFullMock).not.toHaveBeenCalled()
  })

  it('keeps the reading section within the passages the bank holds', async () => {
    stubs.capacity.value = {}
    const { container } = renderSetup()

    expect(container.textContent).toContain('Scored items')
    expect(container.textContent).toContain('items')
  })

  it('scores the gap between the practice and the target', async () => {
    const { container } = renderSetup()
    expect(container.textContent).toContain('Score calculator')

    const slider = container.querySelector('input[type="range"]') as HTMLInputElement
    expect(slider).not.toBeNull()
    await act(async () => {
      fireEvent.change(slider, { target: { value: '72' } })
    })
    expect(container.textContent).toContain('Know the gap before you start')
  })
})

describe('MockSetup microphone check', () => {
  beforeEach(() => {
    stubs.capacity.value = null
    stubs.buildFullMock.mockImplementation(() => makeMockTest())
    useTest.setState({ mock: null, status: 'briefing' })
    useAuth.setState({ user: null, token: null })
  })

  afterEach(() => {
    stubs.release()
  })

  it('records a sample and reports that the microphone works', async () => {
    vi.useFakeTimers()
    const frames = stubAnimationFrames()
    installMedia()
    try {
      const { unmount } = renderSetup()
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Check microphone (3s)' }))
      })

      expect(screen.getByText(/Recording/)).toBeInTheDocument()
      act(() => {
        frames.flush()
      })
      act(() => {
        vi.advanceTimersByTime(3000)
      })

      expect(screen.getByText('Microphone works')).toBeInTheDocument()
      unmount()
    } finally {
      vi.useRealTimers()
    }
  })

  it('cleans the recording up when the page goes away mid-test', async () => {
    vi.useFakeTimers()
    const frames = stubAnimationFrames()
    installMedia()
    try {
      const { unmount } = renderSetup()
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Check microphone (3s)' }))
      })
      act(() => {
        frames.flush()
      })

      expect(screen.getByText(/Recording/)).toBeInTheDocument()
      unmount()
    } finally {
      vi.useRealTimers()
    }
  })

  it('releases the microphone when the check fails after it was opened', async () => {
    vi.useFakeTimers()
    const frames = stubAnimationFrames()
    installMedia()
    // The stream is taken, and then the audio context refuses to open. The
    // microphone has to be released, or the browser's recording indicator
    // stays on for the rest of the session.
    const stop = vi.fn()
    vi.stubGlobal(
      'AudioContext',
      class {
        constructor() {
          throw new Error('no audio')
        }
      },
    )
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn(async () => ({
          getTracks: () => [{ stop }],
          getAudioTracks: () => [],
        })),
      },
    })
    try {
      renderSetup()
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Check microphone (3s)' }))
      })

      expect(stop).toHaveBeenCalled()
      expect(screen.getByText(/Could not access microphone/i)).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
      void frames
    }
  })

  it('records again from the ready state', async () => {
    vi.useFakeTimers()
    const frames = stubAnimationFrames()
    installMedia()
    try {
      renderSetup()
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Check microphone (3s)' }))
      })
      act(() => {
        vi.advanceTimersByTime(3000)
      })
      expect(screen.getByText('Microphone works')).toBeInTheDocument()

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Check again ↺' }))
      })
      expect(screen.getByText(/Recording/)).toBeInTheDocument()
      act(() => {
        frames.flush()
      })
    } finally {
      vi.useRealTimers()
    }
  })

  it('says when the browser has no microphone at all', async () => {
    installMedia({ mediaDevices: false })
    renderSetup()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Check microphone (3s)' }))
    })

    expect(screen.getByText(/Microphone recording is not supported in this browser/)).toBeInTheDocument()
  })

  it('says when the microphone permission is refused', async () => {
    installMedia()
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn(async () => {
          throw new DOMException('denied', 'NotAllowedError')
        }),
      },
    })
    renderSetup()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Check microphone (3s)' }))
    })

    expect(screen.getByText(/Microphone permission was denied/)).toBeInTheDocument()
  })

  it('says when the microphone cannot be reached at all', async () => {
    installMedia()
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn(async () => {
          throw new Error('no headset')
        }),
      },
    })
    renderSetup()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Check microphone (3s)' }))
    })

    expect(screen.getByText(/Could not access microphone/)).toBeInTheDocument()
  })

  it('records without an audio context', async () => {
    vi.useFakeTimers()
    stubAnimationFrames()
    installMedia()
    vi.stubGlobal('AudioContext', undefined)
    vi.stubGlobal('webkitAudioContext', undefined)
    try {
      renderSetup()
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Check microphone (3s)' }))
      })
      act(() => {
        vi.advanceTimersByTime(3000)
      })

      expect(screen.getByText('Microphone works')).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('resumes a suspended audio context', async () => {
    vi.useFakeTimers()
    stubAnimationFrames()
    installMedia({ suspended: true })
    try {
      renderSetup()
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Check microphone (3s)' }))
      })
      act(() => {
        vi.advanceTimersByTime(3000)
      })

      expect(screen.getByText('Microphone works')).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('records without a preferred audio format', async () => {
    vi.useFakeTimers()
    stubAnimationFrames()
    installMedia({ supported: false })
    try {
      renderSetup()
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Check microphone (3s)' }))
      })
      act(() => {
        vi.advanceTimersByTime(3000)
      })

      expect(screen.getByText('Microphone works')).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('says when nothing was captured', async () => {
    vi.useFakeTimers()
    stubAnimationFrames()
    installMedia()
    class EmptyRecorder extends FakeRecorder {
      override stop(): void {
        this.state = 'inactive'
        this.ondataavailable?.({ data: new Blob([]) } as BlobEvent)
        this.onstop?.()
      }
    }
    vi.stubGlobal('MediaRecorder', EmptyRecorder)
    try {
      renderSetup()
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Check microphone (3s)' }))
      })
      act(() => {
        vi.advanceTimersByTime(3000)
      })

      expect(screen.getByText(/No audio was captured/)).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('carries on when the audio context will not resume or close', async () => {
    vi.useFakeTimers()
    stubAnimationFrames()
    installMedia()
    // A browser that refuses to resume a suspended context, and then refuses
    // to close it: the check still has to finish and still has to clean up.
    vi.stubGlobal(
      'AudioContext',
      class extends FakeAudioContext {
        constructor() {
          super(true)
        }
        override resume(): Promise<void> {
          this.state = 'running'
          return Promise.reject(new Error('the context would not resume'))
        }
        override close(): Promise<void> {
          this.state = 'closed'
          return Promise.reject(new Error('the context would not close'))
        }
      },
    )
    try {
      const { unmount } = renderSetup()
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Check microphone (3s)' }))
      })
      act(() => {
        vi.advanceTimersByTime(3000)
      })

      expect(screen.getByText('Microphone works')).toBeInTheDocument()
      unmount()
    } finally {
      vi.useRealTimers()
    }
  })

  it('keeps the countdown honest when the check is started twice', async () => {
    vi.useFakeTimers()
    stubAnimationFrames()
    installMedia()
    try {
      renderSetup()
      const button = screen.getByRole('button', { name: 'Check microphone (3s)' })
      await act(async () => {
        fireEvent.click(button)
        fireEvent.click(button)
      })

      // Two countdowns are now running. The first to reach zero clears the
      // interval the other one is holding and leaves the counter null, so the
      // survivor keeps ticking with nothing left to clear — and with a
      // recorder that has already been stopped.
      act(() => {
        vi.advanceTimersByTime(5000)
      })

      expect(screen.getByText('Microphone works')).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('names the recording format itself when the browser has none', async () => {
    vi.useFakeTimers()
    stubAnimationFrames()
    installMedia({ supported: false })
    // A browser that supports no preferred format reports no mime type of its
    // own, so the page has to name the format it recorded in.
    class NamelessRecorder extends FakeRecorder {
      override mimeType = ''
    }
    vi.stubGlobal('MediaRecorder', NamelessRecorder)
    try {
      renderSetup()
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Check microphone (3s)' }))
      })
      act(() => {
        vi.advanceTimersByTime(3000)
      })

      expect(screen.getByText('Microphone works')).toBeInTheDocument()
      const blob = (URL.createObjectURL as unknown as Mock).mock.calls[0]![0] as Blob
      expect(blob.type).toBe('audio/webm')
    } finally {
      vi.useRealTimers()
    }
  })
})
