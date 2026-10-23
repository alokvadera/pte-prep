import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { ReadableStream as NodeReadableStream } from 'node:stream/web'
import { afterEach, beforeEach, vi } from 'vitest'

/* ---------------------------------------------------------------------------
   Browser environment for the test suite.

   jsdom implements the DOM but not the platform APIs the app leans on. This
   file installs the ones jsdom leaves out, so component tests exercise the
   real code paths rather than the component's own "is this supported?" guards.

   Everything here is deliberately inert: an observer never fires on its own,
   a media query never changes on its own, a speech utterance ends on a timer.
   Tests drive those explicitly through the helpers exported at the bottom.
   --------------------------------------------------------------------------- */

// ---------------------------------------------------------------------------
// matchMedia
//
// jsdom 30 has no `matchMedia` at all. The app asks four distinct questions,
// and the answers differ per query — so the stub is keyed by query string
// rather than returning one global answer.
// ---------------------------------------------------------------------------

type MediaListener = (event: MediaQueryListEvent) => void

interface MediaState {
  matches: boolean
  listeners: Set<MediaListener>
}

const mediaStates = new Map<string, MediaState>()

/**
 * Defaults chosen so that the "happy" path is the default: motion is allowed,
 * the pointer is fine, the scheme is light. A test that wants the other
 * behaviour says so with `setMedia`.
 */
const MEDIA_DEFAULTS: Record<string, boolean> = {
  '(prefers-reduced-motion: reduce)': false,
  '(prefers-reduced-motion)': false,
  '(pointer: coarse)': false,
  '(hover: hover) and (pointer: fine)': true,
  '(prefers-color-scheme: dark)': false,
}

function mediaStateFor(query: string): MediaState {
  let state = mediaStates.get(query)
  if (!state) {
    state = { matches: MEDIA_DEFAULTS[query] ?? false, listeners: new Set() }
    mediaStates.set(query, state)
  }
  return state
}

function installMatchMedia(): void {
  window.matchMedia = ((query: string): MediaQueryList => {
    const state = mediaStateFor(query)
    const mql = {
      media: query,
      get matches() {
        return state.matches
      },
      onchange: null,
      addEventListener: (_type: string, listener: MediaListener) => {
        state.listeners.add(listener)
      },
      removeEventListener: (_type: string, listener: MediaListener) => {
        state.listeners.delete(listener)
      },
      // Legacy aliases: still referenced by older engines and by some libs.
      addListener: (listener: MediaListener) => {
        state.listeners.add(listener)
      },
      removeListener: (listener: MediaListener) => {
        state.listeners.delete(listener)
      },
      dispatchEvent: () => true,
    }
    return mql as unknown as MediaQueryList
  }) as typeof window.matchMedia
}

/** Sets the answer for one media query and notifies anything listening. */
export function setMedia(query: string, matches: boolean): void {
  const state = mediaStateFor(query)
  state.matches = matches
  const event = { matches, media: query } as MediaQueryListEvent
  for (const listener of [...state.listeners]) listener(event)
}

// ---------------------------------------------------------------------------
// IntersectionObserver / ResizeObserver
//
// Both are controllable: the observer records what it is watching and waits
// for the test to say "now they are visible" (or "now they resized").
// ---------------------------------------------------------------------------

interface ObserverRecord {
  callback: (entries: unknown[], observer: unknown) => void
  targets: Set<Element>
}

const intersectionRecords = new Set<ObserverRecord>()
const resizeRecords = new Set<ObserverRecord>()

function makeIntersectionEntry(target: Element, isIntersecting: boolean): IntersectionObserverEntry {
  const rect = target.getBoundingClientRect()
  return {
    target,
    isIntersecting,
    intersectionRatio: isIntersecting ? 1 : 0,
    boundingClientRect: rect,
    intersectionRect: isIntersecting ? rect : rect,
    rootBounds: null,
    time: Date.now(),
  } as IntersectionObserverEntry
}

class FakeIntersectionObserver implements IntersectionObserver {
  readonly root: Element | null = null
  readonly rootMargin: string = ''
  readonly scrollMargin: string = ''
  readonly thresholds: ReadonlyArray<number>
  private readonly record: ObserverRecord

  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.thresholds = Array.isArray(options?.threshold)
      ? options.threshold
      : options?.threshold !== undefined
        ? [options.threshold]
        : [0]
    this.record = { callback: callback as ObserverRecord['callback'], targets: new Set() }
    intersectionRecords.add(this.record)
  }

  observe(target: Element): void {
    this.record.targets.add(target)
  }

  unobserve(target: Element): void {
    this.record.targets.delete(target)
  }

  disconnect(): void {
    this.record.targets.clear()
    intersectionRecords.delete(this.record)
  }

  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
}

class FakeResizeObserver implements ResizeObserver {
  readonly record: ObserverRecord

  constructor(callback: ResizeObserverCallback) {
    this.record = { callback: callback as ObserverRecord['callback'], targets: new Set() }
    resizeRecords.add(this.record)
  }

  observe(target: Element): void {
    this.record.targets.add(target)
  }

  unobserve(target: Element): void {
    this.record.targets.delete(target)
  }

  disconnect(): void {
    this.record.targets.clear()
    resizeRecords.delete(this.record)
  }
}

function installObservers(): void {
  ;(globalThis as { IntersectionObserver?: unknown }).IntersectionObserver = FakeIntersectionObserver
  ;(globalThis as { ResizeObserver?: unknown }).ResizeObserver = FakeResizeObserver
}

/**
 * Reports the given elements (or everything currently observed) as
 * intersecting — or, with `isIntersecting` false, as not intersecting.
 */
export function flushIntersections(targets?: Element[], isIntersecting = true): void {
  for (const record of [...intersectionRecords]) {
    const watched = [...record.targets].filter((t) => !targets || targets.includes(t))
    if (watched.length === 0) continue
    record.callback(
      watched.map((t) => makeIntersectionEntry(t, isIntersecting)),
      record,
    )
  }
}

/** Reports the given elements (or everything observed) as resized. */
export function flushResizes(targets?: Element[]): void {
  for (const record of [...resizeRecords]) {
    const watched = [...record.targets].filter((t) => !targets || targets.includes(t))
    if (watched.length === 0) continue
    record.callback(
      watched.map((t) => ({
        target: t,
        contentRect: t.getBoundingClientRect(),
        borderBoxSize: [],
        contentBoxSize: [],
        devicePixelContentBoxSize: [],
      })),
      record,
    )
  }
}

// ---------------------------------------------------------------------------
// Canvas
//
// jsdom returns `null` from `getContext('2d')` and logs "not implemented".
// The dotted-glow background paints through a real 2D context, so a no-op
// context stands in: every method call is accepted, every property write is
// remembered.
// ---------------------------------------------------------------------------

const canvasContexts = new WeakMap<HTMLCanvasElement, CanvasRenderingContext2D>()

function makeContext2D(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const gradient = { addColorStop: () => {} }
  const store: Record<string, unknown> = {
    canvas,
    createRadialGradient: () => gradient,
    createLinearGradient: () => gradient,
    getImageData: () => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 }),
  }
  return new Proxy(store, {
    get(target, prop) {
      if (prop in target) return target[prop as string]
      return () => undefined
    },
    set(target, prop, value) {
      target[prop as string] = value
      return true
    },
  }) as unknown as CanvasRenderingContext2D
}

function installCanvas(): void {
  HTMLCanvasElement.prototype.getContext = function (
    this: HTMLCanvasElement,
    contextId: string,
  ): CanvasRenderingContext2D | null {
    if (contextId !== '2d') return null
    let ctx = canvasContexts.get(this)
    if (!ctx) {
      ctx = makeContext2D(this)
      canvasContexts.set(this, ctx)
    }
    return ctx
  } as typeof HTMLCanvasElement.prototype.getContext
}

// ---------------------------------------------------------------------------
// Native <dialog>
//
// jsdom ships the element but not the methods. `close()` has to fire the
// `close` event, because that is how `Dialog` and `AlertDialog` tell their
// owner that the modal went away.
// ---------------------------------------------------------------------------

function installDialog(): void {
  if (typeof HTMLDialogElement === 'undefined') return
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement): void {
    this.open = true
  }
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement): void {
    this.open = false
    this.dispatchEvent(new Event('close'))
  }
}

// ---------------------------------------------------------------------------
// Web Audio
//
// The tone helpers and the mic level meter need an oscillator, a gain node
// and an analyser. `connect` has to return a node, because the code chains
// `osc.connect(gain).connect(ctx.destination)`.
// ---------------------------------------------------------------------------

class FakeAudioParam {
  value = 0
  setValueAtTime(): void {}
  exponentialRampToValueAtTime(): void {}
  linearRampToValueAtTime(): void {}
  setTargetAtTime(): void {}
}

class FakeAudioNode {
  connect<T>(destination: T): T {
    return destination
  }
  disconnect(): void {}
}

class FakeOscillatorNode extends FakeAudioNode {
  type = 'sine'
  frequency = new FakeAudioParam()
  start(): void {}
  stop(): void {}
}

class FakeGainNode extends FakeAudioNode {
  gain = new FakeAudioParam()
}

class FakeAnalyserNode extends FakeAudioNode {
  fftSize = 2048
  frequencyBinCount = 1024
  getByteFrequencyData(array: Uint8Array): void {
    array.fill(0)
  }
  getFloatFrequencyData(array: Float32Array): void {
    array.fill(0)
  }
}

class FakeMediaStreamAudioSourceNode extends FakeAudioNode {
  mediaStream: MediaStream
  constructor(stream: MediaStream) {
    super()
    this.mediaStream = stream
  }
}

class FakeAudioContext {
  state: AudioContextState = 'running'
  currentTime = 0
  sampleRate = 44100
  destination = new FakeAudioNode()
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
  createOscillator(): FakeOscillatorNode {
    return new FakeOscillatorNode()
  }
  createGain(): FakeGainNode {
    return new FakeGainNode()
  }
  createAnalyser(): FakeAnalyserNode {
    return new FakeAnalyserNode()
  }
  createMediaStreamSource(stream: MediaStream): FakeMediaStreamAudioSourceNode {
    return new FakeMediaStreamAudioSourceNode(stream)
  }
}

function installAudioContext(): void {
  defineGlobal('AudioContext', FakeAudioContext)
  defineGlobal('webkitAudioContext', FakeAudioContext)
}

// ---------------------------------------------------------------------------
// Speech synthesis
//
// `speakScript` walks a script turn by turn, advancing on each utterance's
// `onend`. The stub ends the utterance on a timer so that chain can run under
// fake timers, exactly as it would in a browser.
// ---------------------------------------------------------------------------

class FakeSpeechSynthesisUtterance {
  text: string
  lang = ''
  voice: SpeechSynthesisVoice | null = null
  volume = 1
  rate = 1
  pitch = 1
  onstart: ((event: Event) => void) | null = null
  onend: ((event: Event) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  onboundary: ((event: Event) => void) | null = null

  constructor(text = '') {
    this.text = text
  }
}

const TEST_VOICES: SpeechSynthesisVoice[] = [
  { name: 'Samantha', lang: 'en-US', localService: true, default: true, voiceURI: 'Samantha' },
  { name: 'Daniel', lang: 'en-GB', localService: true, default: false, voiceURI: 'Daniel' },
  { name: 'Karen', lang: 'en-AU', localService: true, default: false, voiceURI: 'Karen' },
  { name: 'Google UK English Female', lang: 'en-GB', localService: false, default: false, voiceURI: 'Google UK English Female' },
  { name: 'Zarvox', lang: 'en-US', localService: true, default: false, voiceURI: 'Zarvox' },
] as SpeechSynthesisVoice[]

class FakeSpeechSynthesis extends EventTarget {
  speaking = false
  pending = false
  paused = false
  onvoiceschanged: ((event: Event) => void) | null = null

  getVoices(): SpeechSynthesisVoice[] {
    return TEST_VOICES
  }

  speak(utterance: SpeechSynthesisUtterance): void {
    this.speaking = true
    this.pending = false
    window.setTimeout(() => {
      const event = new Event('end') as unknown as SpeechSynthesisEvent
      utterance.onstart?.(new Event('start') as unknown as SpeechSynthesisEvent)
      this.speaking = false
      utterance.onend?.(event)
    }, 0)
  }

  cancel(): void {
    this.speaking = false
    this.pending = false
  }

  pause(): void {
    this.paused = true
  }

  resume(): void {
    this.paused = false
  }
}

/**
 * Defines a global on both `globalThis` and `window`.
 *
 * Some of the app reaches for these as bare globals (`new MediaRecorder(...)`)
 * and some as window properties (`window.speechSynthesis`). Vitest's jsdom
 * environment does not keep the two in step once a key is added after setup, so
 * both are written explicitly.
 */
function defineGlobal(name: string, value: unknown): void {
  Object.defineProperty(globalThis, name, {
    configurable: true,
    writable: true,
    value,
  })
  if (window !== globalThis) {
    Object.defineProperty(window, name, {
      configurable: true,
      writable: true,
      value,
    })
  }
}

function installSpeech(): void {
  defineGlobal('SpeechSynthesisUtterance', FakeSpeechSynthesisUtterance)
  defineGlobal('speechSynthesis', new FakeSpeechSynthesis())
}

// ---------------------------------------------------------------------------
// Media capture and speech recognition
// ---------------------------------------------------------------------------

class FakeMediaRecorder extends EventTarget {
  static isTypeSupported(): boolean {
    return true
  }
  state: 'inactive' | 'recording' | 'paused' = 'inactive'
  mimeType = 'audio/webm'
  ondataavailable: ((event: BlobEvent) => void) | null = null
  onstop: (() => void) | null = null
  onerror: ((event: Event) => void) | null = null

  constructor(_stream?: MediaStream, options?: { mimeType?: string }) {
    super()
    if (options?.mimeType) this.mimeType = options.mimeType
  }

  start(): void {
    this.state = 'recording'
  }

  stop(): void {
    this.state = 'inactive'
    this.ondataavailable?.({ data: new Blob([]) } as BlobEvent)
    this.onstop?.()
  }

  pause(): void {
    this.state = 'paused'
  }

  resume(): void {
    this.state = 'recording'
  }
}

class FakeSpeechRecognition extends EventTarget {
  lang = 'en-US'
  continuous = false
  interimResults = false
  maxAlternatives = 1
  onresult: ((event: Event) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  onend: ((event: Event) => void) | null = null
  onstart: ((event: Event) => void) | null = null

  start(): void {
    this.onstart?.(new Event('start'))
  }

  stop(): void {
    this.onend?.(new Event('end'))
  }

  abort(): void {
    this.onend?.(new Event('end'))
  }
}

function installMedia(): void {
  defineGlobal('MediaRecorder', FakeMediaRecorder)
  defineGlobal('SpeechRecognition', FakeSpeechRecognition)
  defineGlobal('webkitSpeechRecognition', FakeSpeechRecognition)

  const fakeStream = {
    getTracks: () => [{ stop: () => {} }],
    getAudioTracks: () => [{ stop: () => {} }],
  } as unknown as MediaStream

  const mediaDevices = {
    getUserMedia: vi.fn(async () => fakeStream),
    enumerateDevices: vi.fn(async () => []),
  }
  const clipboard = {
    writeText: vi.fn(async () => undefined),
    readText: vi.fn(async () => ''),
  }

  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: mediaDevices })
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: clipboard })
}

// ---------------------------------------------------------------------------
// Odds and ends jsdom leaves unimplemented
// ---------------------------------------------------------------------------

function installMisc(): void {
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
  window.print = vi.fn() as unknown as typeof window.print
  Element.prototype.scrollIntoView = vi.fn()
  HTMLMediaElement.prototype.play = vi.fn(async () => undefined)
  HTMLMediaElement.prototype.pause = vi.fn()
  HTMLMediaElement.prototype.load = vi.fn()

  if (typeof URL.createObjectURL !== 'function') {
    URL.createObjectURL = vi.fn(() => 'blob:mock') as unknown as typeof URL.createObjectURL
  }
  if (typeof URL.revokeObjectURL !== 'function') {
    URL.revokeObjectURL = vi.fn() as unknown as typeof URL.revokeObjectURL
  }
}

// ---------------------------------------------------------------------------
// Install
//
// Every install below touches `window`, so they are skipped when the file runs
// in a plain Node environment. That is what lets a test opt into
// `// @vitest-environment node` and exercise the server-render guards — the
// paths the prerenderer takes, where there is no DOM at all.
// ---------------------------------------------------------------------------

const hasDom = typeof window !== 'undefined'

if (hasDom) {
  // jsdom does not ship the streams API, and React's server renderer hands
  // back a `ReadableStream` that the prerender step has to drain.
  if (typeof globalThis.ReadableStream === 'undefined') {
    defineGlobal('ReadableStream', NodeReadableStream)
  }
  installMatchMedia()
  installObservers()
  installCanvas()
  installDialog()
  installAudioContext()
  installSpeech()
  installMedia()
  installMisc()
}

beforeEach(() => {
  // A fresh slate for the per-query media answers between tests.
  mediaStates.clear()
  for (const [query, matches] of Object.entries(MEDIA_DEFAULTS)) {
    mediaStateFor(query).matches = matches
  }
  intersectionRecords.clear()
  resizeRecords.clear()
})

afterEach(() => {
  mediaStates.clear()
  intersectionRecords.clear()
  resizeRecords.clear()
  // Testing Library only registers its own cleanup when Vitest's globals are
  // enabled, and this suite imports `describe`/`it` explicitly. Without this,
  // one test's rendered DOM leaks into the next.
  cleanup()
})
