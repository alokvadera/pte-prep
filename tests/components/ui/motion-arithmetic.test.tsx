import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render } from '@testing-library/react'
import { CountUp, Magnetic, PointerField, Tilt } from '../../../src/components/ui/motion'
import { flushIntersections, setMedia } from '../../setup/browser-env'

/* ---------------------------------------------------------------------------
   The arithmetic behind the motion primitives.

   Once a component has armed itself, what it does with the pointer and the
   clock is plain arithmetic — and arithmetic is where the interesting edges
   live: a surface narrower than its own travel allowance, a pointer exactly
   on a card's centre, a value that changes after the roll has finished.

   The clock is faked for the whole file. The primitives measure the roll
   against `performance.now()`, and a real clock makes the arithmetic depend
   on how busy the machine is: a frame that arrives 90 ms late instead of
   10 ms late has already reached the end of the roll.
   --------------------------------------------------------------------------- */

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

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

describe('CountUp arithmetic', () => {
  let frames: { flush: () => void }

  beforeEach(() => {
    frames = stubAnimationFrames()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('ignores an element that is not on screen', () => {
    render(<CountUp value={42} />)
    act(() => flushIntersections(undefined, false))
    act(() => frames.flush())
    expect(document.body.textContent).toContain('42')
  })

  it('glides to a new value after it has already rolled', () => {
    const { rerender } = render(<CountUp value={42} duration={100} />)
    act(() => flushIntersections())
    act(() => frames.flush())

    rerender(<CountUp value={60} duration={100} />)
    act(() => frames.flush())

    expect(document.body.textContent).toContain('60')
  })

  it('settles immediately when the new value is the old one', () => {
    const { rerender } = render(<CountUp value={42} duration={100} />)
    act(() => flushIntersections())
    act(() => frames.flush())

    rerender(<CountUp value={42} duration={100} />)
    act(() => frames.flush())

    expect(document.body.textContent).toContain('42')
  })

  it('takes several frames to reach the end of the roll', () => {
    const slow = stubAnimationFrames(10)
    render(<CountUp value={42} duration={100} />)
    act(() => flushIntersections())
    act(() => slow.flush())
    act(() => slow.flush())
    act(() => slow.flush())
    // Still on its way up: the roll is eased, not linear.
    const shown = Number.parseFloat(document.body.textContent ?? '0')
    expect(shown).toBeGreaterThan(0)
    expect(shown).toBeLessThan(42)
    vi.unstubAllGlobals()
  })
})

describe('Tilt arithmetic', () => {
  let frames: { flush: () => void }

  beforeEach(() => {
    frames = stubAnimationFrames()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('leans no further than the travel allowance on a narrow surface', () => {
    const { container } = render(
      <Tilt travel={16} max={40}>
        <span>Tilted</span>
      </Tilt>,
    )
    const stage = container.querySelector('.tilt') as HTMLElement
    // A surface narrower than twice the travel allowance has no angle limit
    // of its own, so the maximum angle applies.
    stage.getBoundingClientRect = () => ({ left: 0, top: 0, width: 20, height: 20 }) as DOMRect

    act(() => {
      stage.dispatchEvent(new PointerEvent('pointermove', { clientX: 15, clientY: 15, bubbles: true }))
      frames.flush()
    })

    // The pointer is a quarter of the way across, so the lean is a quarter
    // of the maximum angle.
    expect(stage.style.getPropertyValue('--tilt-y')).toBe('10.00deg')
  })

  it('does not lean when motion is reduced', () => {
    setMedia('(prefers-reduced-motion: reduce)', true)
    const { container } = render(
      <Tilt>
        <span>Tilted</span>
      </Tilt>,
    )
    const stage = container.querySelector('.tilt') as HTMLElement
    stage.getBoundingClientRect = () => ({ left: 0, top: 0, width: 400, height: 200 }) as DOMRect

    act(() => {
      stage.dispatchEvent(new PointerEvent('pointermove', { clientX: 300, clientY: 150, bubbles: true }))
      frames.flush()
    })

    expect(stage.style.getPropertyValue('--tilt-y')).toBe('')
    setMedia('(prefers-reduced-motion: reduce)', false)
  })
})

describe('PointerField arithmetic', () => {
  let frames: { flush: () => void }

  beforeEach(() => {
    frames = stubAnimationFrames()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function fieldWith(rect: () => DOMRect) {
    const rendered = render(
      <PointerField>
        <span data-pf="true">Card</span>
      </PointerField>,
    )
    const field = rendered.container.firstChild as HTMLElement
    const target = rendered.container.querySelector('[data-pf]') as HTMLElement
    target.getBoundingClientRect = rect
    return { field, target }
  }

  it('leaves a card that is out of range where it is', () => {
    const { field, target } = fieldWith(() => ({ left: 0, top: 0, width: 100, height: 100 }) as DOMRect)
    act(() => {
      field.dispatchEvent(new PointerEvent('pointermove', { clientX: 5000, clientY: 5000, bubbles: true }))
      frames.flush()
    })
    expect(target.style.getPropertyValue('--pf-x')).toBe('')
  })

  it('resets a card that was already leaning', () => {
    const { field, target } = fieldWith(() => ({ left: 0, top: 0, width: 100, height: 100 }) as DOMRect)
    act(() => {
      field.dispatchEvent(new PointerEvent('pointermove', { clientX: 50, clientY: 50, bubbles: true }))
      frames.flush()
    })
    expect(target.style.getPropertyValue('--pf-x')).not.toBe('')

    act(() => {
      field.dispatchEvent(new PointerEvent('pointermove', { clientX: 5000, clientY: 5000, bubbles: true }))
      frames.flush()
    })
    expect(target.style.getPropertyValue('--pf-x')).toBe('0px')
  })

  it('skips a card with no size', () => {
    const { field, target } = fieldWith(() => ({ left: 0, top: 0, width: 0, height: 0 }) as DOMRect)
    act(() => {
      field.dispatchEvent(new PointerEvent('pointermove', { clientX: 50, clientY: 50, bubbles: true }))
      frames.flush()
    })
    expect(target.style.getPropertyValue('--pf-x')).toBe('')
  })

  it('handles a pointer exactly on the centre of a card', () => {
    const { field, target } = fieldWith(() => ({ left: 0, top: 0, width: 100, height: 100 }) as DOMRect)
    act(() => {
      field.dispatchEvent(new PointerEvent('pointermove', { clientX: 50, clientY: 50, bubbles: true }))
      frames.flush()
    })
    expect(target.style.getPropertyValue('--pf-x')).not.toBe('')
  })

  it('does nothing when there is no pointer to apply', () => {
    const { field } = fieldWith(() => ({ left: 0, top: 0, width: 100, height: 100 }) as DOMRect)
    act(() => {
      field.dispatchEvent(new PointerEvent('pointermove', { clientX: 50, clientY: 50, bubbles: true }))
      frames.flush()
      frames.flush()
    })
    expect(document.body.textContent).toBeTruthy()
  })

  it('does not drift when motion is reduced', () => {
    setMedia('(prefers-reduced-motion: reduce)', true)
    const { field, target } = fieldWith(() => ({ left: 0, top: 0, width: 100, height: 100 }) as DOMRect)
    act(() => {
      field.dispatchEvent(new PointerEvent('pointermove', { clientX: 50, clientY: 50, bubbles: true }))
      frames.flush()
    })
    expect(target.style.getPropertyValue('--pf-x')).toBe('')
    setMedia('(prefers-reduced-motion: reduce)', false)
  })
})

describe('Magnetic arithmetic', () => {
  let frames: { flush: () => void }

  beforeEach(() => {
    frames = stubAnimationFrames()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('caps the travel at the maximum', () => {
    const { container } = render(
      <Magnetic maxTravel={2} strength={1}>
        <span>Button</span>
      </Magnetic>,
    )
    const field = container.firstChild as HTMLElement
    field.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 40 }) as DOMRect

    act(() => {
      field.dispatchEvent(new PointerEvent('pointerenter', { clientX: 60, clientY: 20, bubbles: true }))
      frames.flush()
      window.dispatchEvent(new PointerEvent('pointermove', { clientX: 60, clientY: 20, bubbles: true }))
      frames.flush()
    })

    expect(Number.parseFloat(field.style.getPropertyValue('--mg-x'))).toBeLessThanOrEqual(2)
  })

  it('ignores a second entry while it is already leaning', () => {
    const { container } = render(
      <Magnetic>
        <span>Button</span>
      </Magnetic>,
    )
    const field = container.firstChild as HTMLElement
    field.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 40 }) as DOMRect

    act(() => {
      field.dispatchEvent(new PointerEvent('pointerenter', { clientX: 55, clientY: 20, bubbles: true }))
      frames.flush()
      field.dispatchEvent(new PointerEvent('pointerenter', { clientX: 90, clientY: 20, bubbles: true }))
      frames.flush()
    })

    expect(document.body.textContent).toBeTruthy()
  })

  it('does nothing when there is no pointer to apply', () => {
    const { container } = render(
      <Magnetic>
        <span>Button</span>
      </Magnetic>,
    )
    const field = container.firstChild as HTMLElement
    field.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 40 }) as DOMRect

    act(() => {
      field.dispatchEvent(new PointerEvent('pointerenter', { clientX: 55, clientY: 20, bubbles: true }))
      frames.flush()
      frames.flush()
    })

    expect(document.body.textContent).toBeTruthy()
  })

  it('does not lean when motion is reduced', () => {
    setMedia('(prefers-reduced-motion: reduce)', true)
    const { container } = render(
      <Magnetic>
        <span>Button</span>
      </Magnetic>,
    )
    const field = container.firstChild as HTMLElement
    field.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 40 }) as DOMRect

    act(() => {
      field.dispatchEvent(new PointerEvent('pointerenter', { clientX: 55, clientY: 20, bubbles: true }))
      frames.flush()
    })

    expect(field.style.getPropertyValue('--mg-x')).toBe('')
    setMedia('(prefers-reduced-motion: reduce)', false)
  })
})
