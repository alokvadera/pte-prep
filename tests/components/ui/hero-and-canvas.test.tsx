import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent } from '@testing-library/react'
import { HeroScoreCard } from '../../../src/components/ui/HeroScoreCard'
import { DottedGlowBackground } from '../../../src/components/ui/dotted-glow-background'
import { RadialProgress } from '../../../src/components/ui/radial-progress'
import { flushResizes, setMedia } from '../../setup/browser-env'
import { renderWithProviders } from '../../helpers/render'

/* ---------------------------------------------------------------------------
   Three surfaces that paint rather than print.

   HeroScoreCard is the landing page's score dial: a CEFR band, a target that
   cycles, a mascot that reacts, a tone that plays, and a pointer that tilts
   the card. DottedGlowBackground is the canvas behind it: a grid of dots that
   shimmer, follow the colour scheme, and settle down when motion is reduced.
   RadialProgress is the small ring that wraps a single number.

   None of them take their content from props that a test can vary much, so
   each one is driven the way a visitor drives it: by clicking, by hovering,
   by resizing the window, and by changing the operating system's preferences.
   --------------------------------------------------------------------------- */

/* ---------------------------------------------------------------------------
   Shared helpers.
   --------------------------------------------------------------------------- */

/**
 * A rAF queue the test drives by hand.
 *
 * `requestAnimationFrame` is not part of Vitest's fake timers, so a component
 * that animates would sit and wait for a frame that never comes. The queue
 * hands out timestamps derived from `performance.now()`, which is what the
 * animation code measures its progress against.
 */
function stubAnimationFrames(stepMs = 1000): { flush: () => void; pending: () => number } {
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
    pending: () => queued.length,
  }
}

/* ---------------------------------------------------------------------------
   HeroScoreCard.
   --------------------------------------------------------------------------- */

/** A tone recorder that stands in for `window.AudioContext`. */
class RecordedParam {
  value = 0
  calls: Array<{ method: string; args: unknown[] }> = []
  setValueAtTime(...args: unknown[]): void {
    this.calls.push({ method: 'setValueAtTime', args })
  }
  exponentialRampToValueAtTime(...args: unknown[]): void {
    this.calls.push({ method: 'exponentialRampToValueAtTime', args })
  }
  linearRampToValueAtTime(): void {}
  setTargetAtTime(): void {}
}

class RecordedOscillator {
  type = 'sine'
  frequency = new RecordedParam()
  calls: Array<{ method: string; args: unknown[] }> = []
  start(): void {
    this.calls.push({ method: 'start', args: [] })
  }
  stop(...args: unknown[]): void {
    this.calls.push({ method: 'stop', args })
  }
  connect<T>(destination: T): T {
    return destination
  }
}

class RecordedGain {
  gain = new RecordedParam()
  connect<T>(destination: T): T {
    return destination
  }
}

class RecordedAudioContext {
  static instances: RecordedAudioContext[] = []
  currentTime = 0
  sampleRate = 44100
  destination = {} as unknown
  oscillators: RecordedOscillator[] = []
  gains: RecordedGain[] = []

  constructor() {
    RecordedAudioContext.instances.push(this)
  }

  createOscillator(): RecordedOscillator {
    const oscillator = new RecordedOscillator()
    this.oscillators.push(oscillator)
    return oscillator
  }

  createGain(): RecordedGain {
    const gain = new RecordedGain()
    this.gains.push(gain)
    return gain
  }
}

const OriginalAudioContext = window.AudioContext
const OriginalWebkitAudioContext = (
  window as unknown as { webkitAudioContext?: typeof AudioContext }
).webkitAudioContext
const OriginalMatchMedia = window.matchMedia
const OriginalDevicePixelRatio = window.devicePixelRatio

function installAudioContext(): void {
  RecordedAudioContext.instances = []
  window.AudioContext = RecordedAudioContext as unknown as typeof AudioContext
  ;(
    window as unknown as { webkitAudioContext?: typeof AudioContext }
  ).webkitAudioContext = RecordedAudioContext as unknown as typeof AudioContext
}

describe('HeroScoreCard', () => {
  beforeEach(() => {
    installAudioContext()
    stubAnimationFrames()
  })

  afterEach(() => {
    vi.useRealTimers()
    window.AudioContext = OriginalAudioContext
    ;(
      window as unknown as { webkitAudioContext?: typeof AudioContext }
    ).webkitAudioContext = OriginalWebkitAudioContext
    document.documentElement.classList.remove('dark', 'light')
  })

  /** The card's outer element — the one the pointer tilt is measured against. */
  function card(container: HTMLElement): HTMLElement {
    return container.firstElementChild as HTMLElement
  }

  /** The dial: the clickable row that holds the SVG gauge. */
  function dial(container: HTMLElement): HTMLElement {
    return container.querySelector(
      '[title="Click to replay score simulation"]',
    ) as HTMLElement
  }

  /** The floating CEFR badge that cycles the target profile. */
  function badge(container: HTMLElement): HTMLElement {
    return container.querySelector(
      '[aria-label^="Active target:"]',
    ) as HTMLElement
  }

  /** The mascot. */
  function mascot(container: HTMLElement): HTMLElement {
    return container.querySelector(
      '[aria-label^="PTE Mascot companion"]',
    ) as HTMLElement
  }

  /** The card surface that carries the 3D transform. */
  function surface(container: HTMLElement): HTMLElement {
    return container.querySelector('.lift') as HTMLElement
  }

  it('shows the first preset: a CEFR band, its score, and three skills', () => {
    const { container } = renderWithProviders(<HeroScoreCard />)

    expect(badge(container).textContent).toContain('C1 · CEFR band')
    expect(badge(container).getAttribute('aria-label')).toBe(
      'Active target: C1 · CEFR band. Click to switch CEFR score target',
    )
    expect(badge(container).style.backgroundColor).toBe('rgb(255, 126, 182)')
    expect(badge(container).style.boxShadow).toBe('0 5px 0 #E85B9B')

    expect(container.querySelector('svg[role="img"]')?.getAttribute('aria-label')).toBe(
      'Score dial reading 76 out of 90',
    )
    expect(container.querySelector('[data-countup]')?.textContent).toBe('76')

    const rows = [...container.querySelectorAll('li')]
    expect(rows).toHaveLength(3)
    expect(rows[0]?.textContent).toContain('Speaking')
    expect(rows[0]?.textContent).toContain('71 / 90')
    expect(rows[1]?.textContent).toContain('Writing')
    expect(rows[1]?.textContent).toContain('79 / 90')
    expect(rows[2]?.textContent).toContain('Reading & Listening')
    expect(rows[2]?.textContent).toContain('77 / 90')
  })

  it('cycles the CEFR target through every preset and back to the first', () => {
    vi.useFakeTimers()
    const { container } = renderWithProviders(<HeroScoreCard />)

    const expected = [
      { band: 'C1 · Proficient 79+', score: 83, speaking: 85, writing: 82, reading: 81 },
      { band: 'C2 · Superior 85+', score: 88, speaking: 90, writing: 87, reading: 88 },
      { band: '65+ · Visa Ready', score: 66, speaking: 68, writing: 65, reading: 66 },
      { band: 'C1 · CEFR band', score: 76, speaking: 71, writing: 79, reading: 77 },
    ]

    for (const preset of expected) {
      act(() => {
        fireEvent.click(badge(container))
      })
      expect(badge(container).textContent).toContain(preset.band)
      expect(container.querySelector('svg[role="img"]')?.getAttribute('aria-label')).toBe(
        `Score dial reading ${preset.score} out of 90`,
      )
      const rows = [...container.querySelectorAll('li')]
      expect(rows[0]?.textContent).toContain(`${preset.speaking} / 90`)
      expect(rows[1]?.textContent).toContain(`${preset.writing} / 90`)
      expect(rows[2]?.textContent).toContain(`${preset.reading} / 90`)
    }

    // The badge keeps its own colour per profile.
    expect(badge(container).style.backgroundColor).toBe('rgb(255, 126, 182)')

    // The celebration that follows each switch settles on its own.
    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(mascot(container).className).not.toContain('scale-110')
  })

  it('draws the dial from the low end of the scale to the simulated top', () => {
    vi.useFakeTimers()
    const { container } = renderWithProviders(<HeroScoreCard />)

    const arc = container.querySelectorAll('svg[role="img"] path')[1] as SVGElement
    const marker = container.querySelector('svg[role="img"] circle') as SVGElement
    const total = Math.PI * 35

    // Preset 1 scores 76: (76 - 10) / 80 of the arc.
    expect(Number(arc.getAttribute('stroke-dashoffset'))).toBeCloseTo(
      total * (1 - 66 / 80),
      6,
    )
    expect(Number(arc.getAttribute('stroke-dashoffset'))).toBeCloseTo(total * (1 - 0.825), 6)

    // The simulated run pins the dial to the top of the 10-90 scale.
    act(() => {
      fireEvent.click(container.querySelector('button[title*="simulation"]') as HTMLElement)
    })
    expect(Number(arc.getAttribute('stroke-dashoffset'))).toBe(0)
    expect(Number(marker.getAttribute('cx'))).toBe(78)
    expect(Number(marker.getAttribute('cy'))).toBe(46)

    // And it settles back to the preset score once the run finishes.
    act(() => {
      vi.advanceTimersByTime(1100)
    })
    expect(Number(arc.getAttribute('stroke-dashoffset'))).toBeCloseTo(total * (1 - 0.825), 6)
  })

  it('reacts to the mascot being hovered: a thought appears and the eye winks', () => {
    const { container } = renderWithProviders(<HeroScoreCard />)

    expect(mascot(container).querySelector('[aria-live="polite"]')).toBeNull()

    act(() => {
      fireEvent.mouseEnter(mascot(container))
    })

    const bubble = mascot(container).querySelector('[aria-live="polite"]') as HTMLElement
    expect(bubble.textContent).toContain('Target: 79+ 🚀')

    // The right eye swaps from a round pupil to a wink.
    expect(container.querySelector('.-rotate-6')).not.toBeNull()
    // The face grows a little and the blush deepens.
    expect(mascot(container).querySelector('.scale-105')).not.toBeNull()

    act(() => {
      fireEvent.mouseLeave(mascot(container))
    })
    expect(mascot(container).querySelector('[aria-live="polite"]')).toBeNull()
    expect(container.querySelector('.-rotate-6')).toBeNull()
  })

  it('celebrates when the mascot is clicked and settles afterwards', () => {
    vi.useFakeTimers()
    const { container } = renderWithProviders(<HeroScoreCard />)

    act(() => {
      fireEvent.click(mascot(container))
    })

    expect(mascot(container).querySelector('[aria-live="polite"]')?.textContent).toContain(
      'Fluency: 100% ⚡',
    )
    expect(mascot(container).className).toContain('scale-110')
    expect(mascot(container).className).toContain('-rotate-6')
    expect(container.querySelectorAll('.confetti-particle')).toHaveLength(32)

    // The bounce settles after half a second...
    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(mascot(container).className).not.toContain('scale-110')

    // ...and the thought bubble is gone after two and a half seconds.
    act(() => {
      vi.advanceTimersByTime(1900)
    })
    expect(mascot(container).querySelector('[aria-live="polite"]')).toBeNull()
    expect(container.querySelectorAll('.confetti-particle')).toHaveLength(0)
  })

  it('answers the keyboard on the mascot', () => {
    vi.useFakeTimers()
    const { container } = renderWithProviders(<HeroScoreCard />)

    act(() => {
      fireEvent.keyDown(mascot(container), { key: 'Enter' })
    })
    expect(container.querySelector('[aria-live="polite"]')?.textContent).toContain(
      'Fluency: 100% ⚡',
    )

    act(() => {
      fireEvent.keyDown(mascot(container), { key: ' ' })
    })
    expect(container.querySelector('[aria-live="polite"]')?.textContent).toContain(
      'Looking sharp! ✨',
    )

    // Any other key does nothing at all.
    act(() => {
      fireEvent.keyDown(mascot(container), { key: 'a' })
    })
    expect(container.querySelector('[aria-live="polite"]')?.textContent).toContain(
      'Looking sharp! ✨',
    )
  })

  it('plays a tactile pop when the score is clicked', () => {
    vi.useFakeTimers()
    const { container } = renderWithProviders(<HeroScoreCard />)

    act(() => {
      fireEvent.click(dial(container))
    })

    expect(RecordedAudioContext.instances).toHaveLength(1)
    const context = RecordedAudioContext.instances[0]!
    expect(context.oscillators).toHaveLength(1)
    const oscillator = context.oscillators[0]!
    expect(oscillator.type).toBe('sine')
    expect(oscillator.frequency.calls).toEqual([
      { method: 'setValueAtTime', args: [540, 0] },
      { method: 'exponentialRampToValueAtTime', args: [880, 0.07] },
    ])
    expect(oscillator.calls).toEqual([
      { method: 'start', args: [] },
      { method: 'stop', args: [0.08] },
    ])
    expect(context.gains).toHaveLength(1)
    expect(context.gains[0]!.gain.calls).toEqual([
      { method: 'setValueAtTime', args: [0.04, 0] },
      { method: 'exponentialRampToValueAtTime', args: [0.001, 0.07] },
    ])
  })

  it('answers the keyboard on the score dial', () => {
    vi.useFakeTimers()
    const { container } = renderWithProviders(<HeroScoreCard />)

    const arc = container.querySelectorAll('svg[role="img"] path')[1] as SVGElement

    act(() => {
      fireEvent.keyDown(dial(container), { key: 'Enter' })
    })
    expect(Number(arc.getAttribute('stroke-dashoffset'))).toBe(0)

    act(() => {
      vi.advanceTimersByTime(1200)
    })
    expect(Number(arc.getAttribute('stroke-dashoffset'))).toBeCloseTo(
      Math.PI * 35 * (1 - 0.825),
      6,
    )

    act(() => {
      fireEvent.keyDown(dial(container), { key: ' ' })
    })
    expect(Number(arc.getAttribute('stroke-dashoffset'))).toBe(0)

    // A key that is neither Enter nor Space leaves the dial alone.
    act(() => {
      vi.advanceTimersByTime(1200)
      fireEvent.keyDown(dial(container), { key: 'Tab' })
    })
    expect(Number(arc.getAttribute('stroke-dashoffset'))).toBeCloseTo(
      Math.PI * 35 * (1 - 0.825),
      6,
    )
  })

  it('tilts the card towards the pointer and springs back when it leaves', () => {
    const box = { left: 0, top: 0, width: 400, height: 300 }
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
      () =>
        ({
          x: box.left,
          y: box.top,
          left: box.left,
          top: box.top,
          right: box.left + box.width,
          bottom: box.top + box.height,
          width: box.width,
          height: box.height,
          toJSON: () => ({}),
        }) as DOMRect,
    )

    const { container } = renderWithProviders(<HeroScoreCard />)
    const root = card(container)

    act(() => {
      fireEvent.pointerEnter(root)
    })
    // The card leans, but the pointer has not moved yet.
    expect(surface(container).style.transform).toBe(
      'rotateX(0deg) rotateY(0deg) scale3d(1.015, 1.015, 1.015)',
    )

    act(() => {
      fireEvent.pointerMove(root, { clientX: 400, clientY: 150 })
    })

    // nx = 1, ny = 0.5 -> rotateY 5.5deg, rotateX 0deg.
    expect(surface(container).style.transform).toBe(
      'rotateX(0deg) rotateY(5.5deg) scale3d(1.015, 1.015, 1.015)',
    )
    // The sheen follows the pointer.
    const sheen = surface(container).firstElementChild as HTMLElement
    expect(sheen.style.background).toContain('radial-gradient(circle at 100% 50%')
    // The mascot and the badge ride the same parallax.
    expect(mascot(container).style.transform).toBe('translateZ(65px) rotate(4.4deg)')
    expect(badge(container).style.transform).toBe('translateZ(48px) rotate(-2deg)')

    act(() => {
      fireEvent.pointerLeave(root)
    })
    expect(surface(container).style.transform).toBe('')
    expect(mascot(container).style.transform).toBe('')
    expect(badge(container).style.transform).toBe('')
  })

  it('highlights the skill row the pointer is over', () => {
    const { container } = renderWithProviders(<HeroScoreCard />)
    const rows = [...container.querySelectorAll('li')]

    act(() => {
      fireEvent.mouseEnter(rows[0] as HTMLElement)
    })
    expect((rows[0] as HTMLElement).className).toContain('ring-mint-500/40')
    expect((rows[0] as HTMLElement).querySelector('.opacity-100')).not.toBeNull()

    act(() => {
      fireEvent.mouseLeave(rows[0] as HTMLElement)
    })
    expect((rows[0] as HTMLElement).className).not.toContain('ring-mint-500/40')

    act(() => {
      fireEvent.mouseEnter(rows[1] as HTMLElement)
    })
    expect((rows[1] as HTMLElement).className).toContain('ring-mark-500/40')
    expect((rows[1] as HTMLElement).textContent).toContain('essay graded ⌨')

    act(() => {
      fireEvent.mouseLeave(rows[1] as HTMLElement)
    })
    expect((rows[1] as HTMLElement).className).not.toContain('ring-mark-500/40')

    act(() => {
      fireEvent.mouseEnter(rows[2] as HTMLElement)
    })
    expect((rows[2] as HTMLElement).className).toContain('ring-amber-400/40')
    expect((rows[2] as HTMLElement).textContent).toContain('integrated 🎧')

    act(() => {
      fireEvent.mouseLeave(rows[2] as HTMLElement)
    })
    expect((rows[2] as HTMLElement).className).not.toContain('ring-amber-400/40')
  })

  it('holds still when the visitor asks for reduced motion', () => {
    setMedia('(prefers-reduced-motion: reduce)', true)
    const { container } = renderWithProviders(<HeroScoreCard />)
    const root = card(container)

    // No transitions are armed, and the card does not lean.
    expect(surface(container).className).not.toContain('transition-transform')
    expect(mascot(container).className).not.toContain('transition-transform')

    act(() => {
      fireEvent.pointerEnter(root)
      fireEvent.pointerMove(root, { clientX: 400, clientY: 150 })
    })
    expect(surface(container).style.transform).toBe('')
    expect(mascot(container).style.transform).toBe('')
    expect(badge(container).style.transform).toBe('')
  })

  it('follows the reduced-motion preference when it changes mid-session', () => {
    const { container } = renderWithProviders(<HeroScoreCard />)
    expect(surface(container).className).toContain('transition-transform')

    act(() => {
      setMedia('(prefers-reduced-motion: reduce)', true)
    })
    expect(surface(container).className).not.toContain('transition-transform')

    act(() => {
      setMedia('(prefers-reduced-motion: reduce)', false)
    })
    expect(surface(container).className).toContain('transition-transform')
  })

  it('falls back to the prefixed audio context', () => {
    Reflect.deleteProperty(window, 'AudioContext')
    const { container } = renderWithProviders(<HeroScoreCard />)

    act(() => {
      fireEvent.click(mascot(container))
    })

    expect(RecordedAudioContext.instances).toHaveLength(1)
  })

  it('stays silent when audio is not available at all', () => {
    Reflect.deleteProperty(window, 'AudioContext')
    Reflect.deleteProperty(window, 'webkitAudioContext')
    const { container } = renderWithProviders(<HeroScoreCard />)

    act(() => {
      fireEvent.click(mascot(container))
    })

    // The click still works; only the tone is lost.
    expect(container.querySelector('[aria-live="polite"]')?.textContent).toContain(
      'Fluency: 100% ⚡',
    )
    expect(RecordedAudioContext.instances).toHaveLength(0)
  })
})

/* ---------------------------------------------------------------------------
   DottedGlowBackground.
   --------------------------------------------------------------------------- */

interface RecordedFill {
  alpha: number
  shadowBlur: number
  shadowColor: string
  fillStyle: string
}

interface CanvasRecorder {
  ctx: CanvasRenderingContext2D
  arcs: Array<{ x: number; y: number; radius: number }>
  fills: RecordedFill[]
  gradient: { addColorStop: ReturnType<typeof vi.fn> }
  createGradients: ReturnType<typeof vi.fn>
  clearRects: ReturnType<typeof vi.fn>
  fillRects: ReturnType<typeof vi.fn>
  transforms: ReturnType<typeof vi.fn>
}

function createCanvasRecorder(): CanvasRecorder {
  const arcs: Array<{ x: number; y: number; radius: number }> = []
  const fills: RecordedFill[] = []
  const state = { globalAlpha: 1, shadowBlur: 0, shadowColor: '', fillStyle: '' }
  const gradient = { addColorStop: vi.fn() }

  const clearRects = vi.fn()
  const fillRects = vi.fn()
  const transforms = vi.fn()
  const createGradients = vi.fn(() => gradient)

  const ctx = {
    get globalAlpha() {
      return state.globalAlpha
    },
    set globalAlpha(value: number) {
      state.globalAlpha = value
    },
    get shadowBlur() {
      return state.shadowBlur
    },
    set shadowBlur(value: number) {
      state.shadowBlur = value
    },
    get shadowColor() {
      return state.shadowColor
    },
    set shadowColor(value: string) {
      state.shadowColor = value
    },
    get fillStyle() {
      return state.fillStyle
    },
    set fillStyle(value: string) {
      state.fillStyle = value
    },
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    clearRect: clearRects,
    fillRect: fillRects,
    setTransform: transforms,
    createRadialGradient: createGradients,
    arc: vi.fn((x: number, y: number, radius: number) => {
      arcs.push({ x, y, radius })
    }),
    fill: vi.fn(() => {
      fills.push({
        alpha: state.globalAlpha,
        shadowBlur: state.shadowBlur,
        shadowColor: state.shadowColor,
        fillStyle: state.fillStyle,
      })
    }),
  }

  return {
    ctx: ctx as unknown as CanvasRenderingContext2D,
    arcs,
    fills,
    gradient,
    createGradients,
    clearRects,
    fillRects,
    transforms,
  }
}

describe('DottedGlowBackground', () => {
  let recorder: CanvasRecorder
  let box: { left: number; top: number; width: number; height: number }
  let frames: { flush: () => void; pending: () => number }

  beforeEach(() => {
    recorder = createCanvasRecorder()
    box = { left: 0, top: 0, width: 240, height: 120 }

    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((contextId: string) => {
      if (contextId !== '2d') return null
      return recorder.ctx
    })

    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
      () =>
        ({
          x: box.left,
          y: box.top,
          left: box.left,
          top: box.top,
          right: box.left + box.width,
          bottom: box.top + box.height,
          width: box.width,
          height: box.height,
          toJSON: () => ({}),
        }) as DOMRect,
    )

    frames = stubAnimationFrames()
  })

  afterEach(() => {
    document.documentElement.classList.remove('dark', 'light')
    setMedia('(prefers-reduced-motion: reduce)', false)
    setMedia('(prefers-color-scheme: dark)', false)
    // Two of the tests take a browser API away; it goes back afterwards.
    window.matchMedia = OriginalMatchMedia
    Object.defineProperty(window, 'devicePixelRatio', {
      value: OriginalDevicePixelRatio,
      configurable: true,
      writable: true,
    })
  })

  /** The canvas and its wrapper. */
  function canvasParts(container: HTMLElement): { canvas: HTMLCanvasElement; wrapper: HTMLElement } {
    const canvas = container.querySelector('canvas') as HTMLCanvasElement
    return { canvas, wrapper: canvas.parentElement as HTMLElement }
  }

  /** A deterministic stand-in for `Math.random`, so the dot field is stable. */
  function stubRandom(): void {
    let count = 0
    vi.spyOn(Math, 'random').mockImplementation(() => {
      count += 1
      return (count % 7) / 7
    })
  }

  it('paints a grid of dots on the canvas', () => {
    stubRandom()
    const { container } = renderWithProviders(<DottedGlowBackground />)
    const { canvas } = canvasParts(container)

    expect(canvas.tagName).toBe('CANVAS')

    act(() => {
      frames.flush()
    })

    // A 240x120 grid at a gap of 12: 22 columns by 12 rows, each padded by one.
    expect(recorder.arcs).toHaveLength(23 * 13)
    expect(recorder.arcs.every((arc) => arc.radius === 2)).toBe(true)
    expect(recorder.fills).toHaveLength(23 * 13)
    expect(recorder.fills.every((fill) => fill.fillStyle === 'rgba(0,0,0,0.7)')).toBe(true)
    // The canvas is sized to the box, in CSS pixels.
    expect(canvas.width).toBe(240)
    expect(canvas.height).toBe(120)
    expect(canvas.style.width).toBe('240px')
    expect(canvas.style.height).toBe('120px')
    // The frame is cleared and drawn at the device pixel ratio, and with no
    // background fade unless one is asked for.
    expect(recorder.clearRects).toHaveBeenCalledWith(0, 0, 240, 120)
    expect(recorder.transforms).toHaveBeenCalledWith(1, 0, 0, 1, 0, 0)
    expect(recorder.fillRects).not.toHaveBeenCalled()
  })

  it('keeps animating: every frame clears and repaints', () => {
    stubRandom()
    renderWithProviders(<DottedGlowBackground />)

    act(() => {
      frames.flush()
    })
    const firstFrame = recorder.fills.map((fill) => fill.alpha)

    act(() => {
      frames.flush()
    })
    const secondFrame = recorder.fills.map((fill) => fill.alpha)

    expect(secondFrame.length).toBe(firstFrame.length * 2)
    // The dots have moved on to a new point of their cycle.
    expect(secondFrame.slice(firstFrame.length)).not.toEqual(firstFrame)
    // The loop keeps asking for the next frame.
    expect(frames.pending()).toBeGreaterThan(0)
  })

  it('glows the bright dots and leaves the dim ones plain', () => {
    stubRandom()
    renderWithProviders(<DottedGlowBackground speedScale={0} glowColor="rgba(0, 170, 255, 0.85)" />)

    act(() => {
      frames.flush()
    })

    const glowing = recorder.fills.filter((fill) => fill.shadowBlur > 0)
    const plain = recorder.fills.filter((fill) => fill.shadowBlur === 0)
    expect(glowing.length).toBeGreaterThan(0)
    expect(plain.length).toBeGreaterThan(0)
    expect(glowing.every((fill) => fill.shadowColor === 'rgba(0, 170, 255, 0.85)')).toBe(true)
    expect(plain.every((fill) => fill.shadowColor === 'transparent')).toBe(true)
    // Alpha runs from a quarter of full brightness up to four fifths.
    const alphas = recorder.fills.map((f) => f.alpha)
    expect(Math.min(...alphas)).toBeCloseTo(0.25 * 0.6, 5)
    expect(Math.max(...alphas)).toBeLessThanOrEqual(0.8 * 0.6)
    expect(Math.max(...alphas)).toBeGreaterThan(0.6 * 0.6)
  })

  it('paints a background fade when one is asked for', () => {
    stubRandom()
    const { container } = renderWithProviders(<DottedGlowBackground backgroundOpacity={0.4} />)
    const { canvas } = canvasParts(container)

    act(() => {
      frames.flush()
    })

    expect(canvas.width).toBe(240)
    // A radial fade, from transparent in the middle to 40% black at the edge.
    expect(recorder.createGradients).toHaveBeenCalledTimes(1)
    expect(recorder.gradient.addColorStop).toHaveBeenCalledWith(0, 'rgba(0,0,0,0)')
    expect(recorder.gradient.addColorStop).toHaveBeenCalledWith(1, 'rgba(0,0,0,0.4)')
    expect(recorder.fillRects).toHaveBeenCalledWith(0, 0, 240, 120)
    expect(recorder.fills.length).toBeGreaterThan(0)
  })

  it('uses the dark palette when the scheme is dark', () => {
    setMedia('(prefers-color-scheme: dark)', true)
    stubRandom()
    renderWithProviders(
      <DottedGlowBackground
        color="rgba(0,0,0,0.7)"
        darkColor="rgba(240,240,240,0.8)"
        glowColor="rgba(0, 170, 255, 0.85)"
        darkGlowColor="rgba(120, 200, 255, 0.9)"
      />,
    )

    act(() => {
      frames.flush()
    })

    expect(recorder.fills.every((fill) => fill.fillStyle === 'rgba(240,240,240,0.8)')).toBe(true)
    const glowing = recorder.fills.filter((fill) => fill.shadowBlur > 0)
    expect(glowing.length).toBeGreaterThan(0)
    expect(glowing.every((fill) => fill.shadowColor === 'rgba(120, 200, 255, 0.9)')).toBe(true)
  })

  it('keeps the default palette in dark mode when no dark colour is given', () => {
    setMedia('(prefers-color-scheme: dark)', true)
    stubRandom()
    renderWithProviders(
      <DottedGlowBackground color="rgba(0,0,0,0.7)" glowColor="rgba(0, 170, 255, 0.85)" />,
    )

    act(() => {
      frames.flush()
    })

    expect(recorder.fills.every((fill) => fill.fillStyle === 'rgba(0,0,0,0.7)')).toBe(true)
    const glowing = recorder.fills.filter((fill) => fill.shadowBlur > 0)
    expect(glowing.length).toBeGreaterThan(0)
    expect(glowing.every((fill) => fill.shadowColor === 'rgba(0, 170, 255, 0.85)')).toBe(true)
  })

  it('uses the dark palette when the document carries the dark class', () => {
    document.documentElement.classList.add('dark')
    stubRandom()
    renderWithProviders(
      <DottedGlowBackground color="rgba(0,0,0,0.7)" darkColor="rgba(10,10,10,0.9)" />,
    )

    act(() => {
      frames.flush()
    })

    expect(recorder.fills.every((fill) => fill.fillStyle === 'rgba(10,10,10,0.9)')).toBe(true)
  })

  it('uses the light palette when the document carries the light class', () => {
    document.documentElement.classList.add('light')
    stubRandom()
    renderWithProviders(
      <DottedGlowBackground color="rgba(0,0,0,0.7)" darkColor="rgba(10,10,10,0.9)" />,
    )

    act(() => {
      frames.flush()
    })

    expect(recorder.fills.every((fill) => fill.fillStyle === 'rgba(0,0,0,0.7)')).toBe(true)
  })

  it('resolves a CSS variable for the dot colour', () => {
    const values: Record<string, string> = { '--color-zinc-900': '  #27272a  ' }
    vi.spyOn(window, 'getComputedStyle').mockImplementation(
      () =>
        ({
          getPropertyValue: (name: string) => values[name] ?? '',
        }) as unknown as CSSStyleDeclaration,
    )

    stubRandom()
    renderWithProviders(
      <DottedGlowBackground colorLightVar="color-zinc-900" color="rgba(0,0,0,0.7)" />,
    )

    act(() => {
      frames.flush()
    })

    expect(recorder.fills.every((fill) => fill.fillStyle === '#27272a')).toBe(true)
  })

  it('falls back to the root when the element has no value for the variable', () => {
    vi.spyOn(window, 'getComputedStyle').mockImplementation(
      (element: Element) =>
        ({
          getPropertyValue: (name: string) =>
            element === document.documentElement && name === '--color-zinc-100'
              ? '#f4f4f5'
              : '',
        }) as unknown as CSSStyleDeclaration,
    )

    stubRandom()
    renderWithProviders(
      <DottedGlowBackground colorLightVar="--color-zinc-100" color="rgba(0,0,0,0.7)" />,
    )

    act(() => {
      frames.flush()
    })

    expect(recorder.fills.every((fill) => fill.fillStyle === '#f4f4f5')).toBe(true)
  })

  it('falls back to the prop when the variable resolves to nothing', () => {
    vi.spyOn(window, 'getComputedStyle').mockImplementation(
      () =>
        ({
          getPropertyValue: () => '',
        }) as unknown as CSSStyleDeclaration,
    )

    stubRandom()
    renderWithProviders(
      <DottedGlowBackground colorLightVar="--color-zinc-100" color="rgba(0,0,0,0.7)" />,
    )

    act(() => {
      frames.flush()
    })

    expect(recorder.fills.every((fill) => fill.fillStyle === 'rgba(0,0,0,0.7)')).toBe(true)
  })

  it('redraws when the container is resized', () => {
    stubRandom()
    const { container } = renderWithProviders(<DottedGlowBackground />)
    const { canvas } = canvasParts(container)
    expect(canvas.width).toBe(240)

    box = { left: 0, top: 0, width: 480, height: 240 }
    act(() => {
      flushResizes()
    })

    expect(canvas.width).toBe(480)
    expect(canvas.height).toBe(240)
    expect(canvas.style.width).toBe('480px')
  })

  it('redraws when the window itself is resized', () => {
    stubRandom()
    const { container } = renderWithProviders(<DottedGlowBackground />)
    const { canvas } = canvasParts(container)

    box = { left: 0, top: 0, width: 120, height: 60 }
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })

    expect(canvas.width).toBe(120)
    expect(canvas.height).toBe(60)
  })

  it('settles into a still frame when motion is reduced', () => {
    setMedia('(prefers-reduced-motion: reduce)', true)
    stubRandom()
    const { container } = renderWithProviders(<DottedGlowBackground />)
    const { canvas } = canvasParts(container)

    // The settled state is drawn once: mid alpha on every dot, no glow.
    expect(recorder.fills.length).toBe(23 * 13)
    expect(recorder.fills.every((fill) => fill.alpha === 0.5 * 0.6)).toBe(true)
    expect(recorder.fills.every((fill) => fill.shadowBlur === 0)).toBe(true)
    // And nothing is queued: there is no loop to run.
    expect(frames.pending()).toBe(0)

    // A resize repaints the settled state — on the new, larger grid.
    box = { left: 0, top: 0, width: 480, height: 240 }
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })
    expect(canvas.width).toBe(480)
    expect(recorder.fills.length).toBe(23 * 13 + 43 * 23)
  })

  it('pauses while the layer is off screen and resumes when it comes back', () => {
    stubRandom()
    const callbacks: IntersectionObserverCallback[] = []

    class CapturingObserver implements IntersectionObserver {
      readonly root = null
      readonly rootMargin = ''
      readonly scrollMargin = ''
      readonly thresholds = [0]
      constructor(callback: IntersectionObserverCallback) {
        callbacks.push(callback)
      }
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
      takeRecords(): IntersectionObserverEntry[] {
        return []
      }
    }
    vi.stubGlobal('IntersectionObserver', CapturingObserver)

    renderWithProviders(<DottedGlowBackground />)

    // An empty entry list means "assume visible".
    act(() => {
      callbacks[0]!([], {} as IntersectionObserver)
    })

    // The layer scrolls out of view.
    act(() => {
      callbacks[0]!([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver)
    })
    act(() => {
      frames.flush()
    })
    // Nothing was painted while it was hidden.
    expect(recorder.fills).toHaveLength(0)

    // And back in again.
    act(() => {
      callbacks[0]!([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver)
    })
    act(() => {
      frames.flush()
    })
    expect(recorder.fills.length).toBeGreaterThan(0)
  })

  it('does nothing at all when the browser has no 2d context', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => null)
    const { container } = renderWithProviders(<DottedGlowBackground />)

    expect(container.querySelector('canvas')).not.toBeNull()
    expect(recorder.arcs).toHaveLength(0)
    expect(frames.pending()).toBe(0)
  })

  it('treats a missing device pixel ratio as one', () => {
    Object.defineProperty(window, 'devicePixelRatio', {
      value: 0,
      configurable: true,
      writable: true,
    })
    stubRandom()
    const { container } = renderWithProviders(<DottedGlowBackground />)
    const { canvas } = canvasParts(container)

    expect(canvas.width).toBe(240)
  })

  it('copes with a browser that has no matchMedia at all', () => {
    Reflect.deleteProperty(window, 'matchMedia')
    stubRandom()
    const { container } = renderWithProviders(<DottedGlowBackground />)

    act(() => {
      frames.flush()
    })

    expect(recorder.fills.length).toBeGreaterThan(0)
    expect(container.querySelector('canvas')).not.toBeNull()
  })
})

/* ---------------------------------------------------------------------------
   RadialProgress.
   --------------------------------------------------------------------------- */

describe('RadialProgress', () => {
  /** The painted ring: the second circle is the fill. */
  function fill(container: HTMLElement): SVGElement {
    return container.querySelectorAll('svg circle')[1] as SVGElement
  }

  it('falls back to a generic label when none is given', () => {
    const { container } = renderWithProviders(<RadialProgress value={76} />)

    const bar = container.querySelector('[role="progressbar"]') as HTMLElement
    expect(bar.getAttribute('aria-label')).toBe('Progress')
    expect(bar.getAttribute('aria-valuenow')).toBe('76')
    expect(bar.getAttribute('aria-valuemin')).toBe('10')
    expect(bar.getAttribute('aria-valuemax')).toBe('90')
    // No caption is drawn without a label.
    expect(container.querySelectorAll('p')).toHaveLength(1)
    expect(container.querySelector('p')?.textContent).toBe('76')
  })

  it('draws the caption when a label is given', () => {
    const { container } = renderWithProviders(<RadialProgress value={76} label="Overall" />)

    const bar = container.querySelector('[role="progressbar"]') as HTMLElement
    expect(bar.getAttribute('aria-label')).toBe('Overall')
    const captions = [...container.querySelectorAll('p')]
    expect(captions).toHaveLength(2)
    expect(captions[1]?.textContent).toBe('Overall')
  })

  it('clamps the ratio to the ends of the scale', () => {
    const below = renderWithProviders(<RadialProgress value={4} />)
    const circumference = 2 * Math.PI * ((120 - 10) / 2)
    expect(Number(fill(below.container).getAttribute('stroke-dashoffset'))).toBeCloseTo(
      circumference,
      6,
    )

    const above = renderWithProviders(<RadialProgress value={95} />)
    expect(Number(fill(above.container).getAttribute('stroke-dashoffset'))).toBe(0)

    const middle = renderWithProviders(<RadialProgress value={50} />)
    expect(Number(fill(middle.container).getAttribute('stroke-dashoffset'))).toBeCloseTo(
      circumference * 0.5,
      6,
    )
  })

  it('draws an empty ring when the scale has no room in it', () => {
    const { container } = renderWithProviders(<RadialProgress value={50} max={90} min={90} />)

    const bar = container.querySelector('[role="progressbar"]') as HTMLElement
    expect(bar.getAttribute('aria-valuemin')).toBe('90')
    expect(bar.getAttribute('aria-valuemax')).toBe('90')
    const circumference = 2 * Math.PI * ((120 - 10) / 2)
    expect(Number(fill(container).getAttribute('stroke-dashoffset'))).toBeCloseTo(
      circumference,
      6,
    )
  })

  it('paints the ring in the tone it is asked for', () => {
    const { container } = renderWithProviders(<RadialProgress value={76} tone="mint" />)
    expect(fill(container).getAttribute('class')).toContain('stroke-mint-500')
    expect(fill(container).getAttribute('stroke-dasharray')).toBe(
      String(2 * Math.PI * ((120 - 10) / 2)),
    )
  })
})
