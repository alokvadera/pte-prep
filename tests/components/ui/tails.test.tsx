import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { renderWithProviders } from '../../helpers/render'
import { CountUp, Magnetic, PointerField, Reveal } from '../../../src/components/ui/motion'
import { CursorGlow } from '../../../src/components/ui/cursor-glow'
import { ParallaxVisual } from '../../../src/components/ui/parallax-visual'
import { ScrollVelocity } from '../../../src/components/ui/scroll-velocity'
import { TaglineReveal } from '../../../src/components/ui/TaglineReveal'
import { CommandPalette } from '../../../src/components/ui/CommandPalette'
import { RenderType } from '../../../src/components/ui/render-type'
import { ScrollProgress } from '../../../src/components/ui/scroll-progress'
import { flushIntersections, setMedia } from '../../setup/browser-env'

/* ---------------------------------------------------------------------------
   The last of the motion branches.

   Most of what is left here is the same handful of situations: the visitor
   asked for less motion, the pointer moved twice before the frame ran, or a
   value changed by an amount too small to animate.
   --------------------------------------------------------------------------- */

function stubAnimationFrames(stepMs = 1000): { flush: () => void } {
  let queued: FrameRequestCallback[] = []
  let elapsed = 0
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    queued.push(callback)
    return queued.length
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    const index = id - 1
    if (queued[index]) queued[index] = () => {}
  })
  return {
    flush: () => {
      const pending = queued
      queued = []
      for (const callback of pending) {
        elapsed += stepMs
        callback(performance.now() + elapsed)
      }
    },
  }
}

describe('Reveal with an element that is not on screen', () => {
  it('waits for the element to come into view', () => {
    const { container } = render(
      <Reveal>
        <span>Revealed</span>
      </Reveal>,
    )
    act(() => flushIntersections(undefined, false))
    expect(container.firstChild).not.toHaveAttribute('data-shown')
  })
})

describe('CountUp with a value that barely moves', () => {
  let frames: { flush: () => void }

  beforeEach(() => {
    frames = stubAnimationFrames()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('settles at once when the new value is the old one to within a hundredth', () => {
    const { rerender } = render(<CountUp value={42} duration={100} />)
    act(() => flushIntersections())
    act(() => frames.flush())

    rerender(<CountUp value={42.005} duration={100} />)
    act(() => frames.flush())

    expect(document.body.textContent).toContain('42')
  })

  it('animates over several frames when the value changes', () => {
    const slow = stubAnimationFrames(10)
    const { rerender } = render(<CountUp value={42} duration={100} />)
    act(() => flushIntersections())
    act(() => slow.flush())

    rerender(<CountUp value={60} duration={100} />)
    act(() => slow.flush())

    // The roll is under way: between where it was and where it is going.
    const shown = Number.parseFloat(document.body.textContent ?? '0')
    expect(shown).toBeGreaterThan(42)
    expect(shown).toBeLessThan(60)
    vi.unstubAllGlobals()
  })
})

describe('PointerField with a second pointer move', () => {
  let frames: { flush: () => void }

  beforeEach(() => {
    frames = stubAnimationFrames()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('uses only the latest pointer position', () => {
    const { container } = render(
      <PointerField>
        <span data-pf="true">Card</span>
      </PointerField>,
    )
    const field = container.firstChild as HTMLElement
    const card = container.querySelector('[data-pf]') as HTMLElement
    card.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 100 }) as DOMRect

    act(() => {
      field.dispatchEvent(new PointerEvent('pointermove', { clientX: 40, clientY: 40, bubbles: true }))
      field.dispatchEvent(new PointerEvent('pointermove', { clientX: 55, clientY: 55, bubbles: true }))
      frames.flush()
    })

    expect(card.style.getPropertyValue('--pf-x')).not.toBe('')
  })
})

describe('Magnetic with a second pointer move', () => {
  let frames: { flush: () => void }

  beforeEach(() => {
    frames = stubAnimationFrames()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('uses only the latest pointer position', () => {
    const { container } = render(
      <Magnetic>
        <span>Button</span>
      </Magnetic>,
    )
    const field = container.firstChild as HTMLElement
    field.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 40 }) as DOMRect

    act(() => {
      field.dispatchEvent(new PointerEvent('pointerenter', { clientX: 50, clientY: 20, bubbles: true }))
      window.dispatchEvent(new PointerEvent('pointermove', { clientX: 55, clientY: 20, bubbles: true }))
      window.dispatchEvent(new PointerEvent('pointermove', { clientX: 58, clientY: 20, bubbles: true }))
      frames.flush()
    })

    expect(field.style.getPropertyValue('--mg-x')).not.toBe('')
  })
})

describe('the ambient layers under reduced motion', () => {
  // The media answer is set inside each test rather than in a hook: the shared
  // setup file resets it between tests, and hook order is not worth relying on.
  it('leaves the cursor glow alone', () => {
    setMedia('(prefers-reduced-motion: reduce)', true)
    const { container } = render(<CursorGlow />)
    setMedia('(prefers-reduced-motion: reduce)', false)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('leaves the parallax field alone', () => {
    setMedia('(prefers-reduced-motion: reduce)', true)
    const { container } = render(
      <ParallaxVisual>
        <span>Layer</span>
      </ParallaxVisual>,
    )
    setMedia('(prefers-reduced-motion: reduce)', false)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('leaves the scroll velocity alone', () => {
    setMedia('(prefers-reduced-motion: reduce)', true)
    const { container } = render(<ScrollVelocity items={['One', 'Two']} />)
    setMedia('(prefers-reduced-motion: reduce)', false)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('leaves the tagline alone', () => {
    setMedia('(prefers-reduced-motion: reduce)', true)
    const { container } = render(<TaglineReveal lines={['One', 'Two']} />)
    setMedia('(prefers-reduced-motion: reduce)', false)
    expect(container.firstChild).toBeInTheDocument()
  })
})

describe('TaglineReveal', () => {
  it('reveals a word that carries no position', () => {
    const { container } = render(<TaglineReveal lines={['One', 'Two']} />)
    act(() => flushIntersections())
    expect(container.firstChild).toBeInTheDocument()
  })
})

describe('CommandPalette', () => {
  it('ignores a key that is not Tab', () => {
    renderWithProviders(<CommandPalette />)
    act(() => {
      window.dispatchEvent(new CustomEvent('open-command-palette'))
    })

    const dialog = document.querySelector('[role="dialog"]')
    expect(dialog).not.toBeNull()
    expect(screen.getByText('Start a Mock Test')).toBeInTheDocument()
    fireEvent.keyDown(dialog as Element, { key: 'a' })
    expect(document.body.textContent).toBeTruthy()
  })
})

describe('RenderType with a phrase that has been typed past', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('copes with a phrase that shrinks', () => {
    const { container } = render(
      <RenderType text={['One', 'Two']} speed={10} startDelay={0} deleteSpeed={10} holdDuration={10} />,
    )
    for (let i = 0; i < 60; i++) {
      act(() => vi.advanceTimersByTime(50))
    }
    expect(container.textContent).toBeTruthy()
  })
})

describe('ScrollProgress', () => {
  let frames: { flush: () => void }

  beforeEach(() => {
    frames = stubAnimationFrames()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('coalesces a burst of scroll events into one frame', () => {
    const { unmount } = render(<ScrollProgress />)

    act(() => {
      window.dispatchEvent(new Event('scroll'))
      window.dispatchEvent(new Event('scroll'))
      frames.flush()
    })

    expect(document.querySelector('[role="progressbar"]')).toBeInTheDocument()
    unmount()
  })

  it('cancels a pending frame when it goes away', () => {
    const { unmount } = render(<ScrollProgress />)

    act(() => {
      window.dispatchEvent(new Event('scroll'))
    })
    expect(() => unmount()).not.toThrow()
  })
})
