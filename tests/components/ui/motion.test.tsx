import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { CountUp, Magnetic, PointerField, Reveal, Tilt } from '../../../src/components/ui/motion'
import { TextReveal } from '../../../src/components/ui/text-reveal'
import { TextScramble } from '../../../src/components/ui/text-scramble'
import { TaglineReveal } from '../../../src/components/ui/TaglineReveal'
import { RenderType } from '../../../src/components/ui/render-type'
import { flushIntersections, setMedia } from '../../setup/browser-env'

/* ---------------------------------------------------------------------------
   The motion primitives.

   The rule the house follows is that the resolved state is the server state:
   nothing is hidden until the component has armed itself, and the animation
   only runs once the element is seen. So the tests here are mostly about
   when a component DOES and DOES NOT arm, and about the arithmetic once it
   has.
   --------------------------------------------------------------------------- */

/**
 * Replaces requestAnimationFrame with a queue the test drives itself.
 *
 * The callbacks are held until `flush` is called, and then run with a
 * timestamp far enough ahead that an easing curve lands on its end value.
 */
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

describe('Reveal', () => {
  it('renders its children', () => {
    render(
      <Reveal>
        <span>Revealed</span>
      </Reveal>,
    )
    expect(screen.getByText('Revealed')).toBeInTheDocument()
  })

  it('stays unresolved until it is observed', () => {
    const { container } = render(
      <Reveal>
        <span>Revealed</span>
      </Reveal>,
    )
    expect(container.firstChild).not.toHaveAttribute('data-shown')
  })

  it('shows itself once the observer fires', () => {
    vi.useFakeTimers()
    const { container } = render(
      <Reveal>
        <span>Revealed</span>
      </Reveal>,
    )
    act(() => flushIntersections())
    act(() => vi.advanceTimersByTime(600))
    expect(container.firstChild).toHaveAttribute('data-shown', 'true')
    vi.useRealTimers()
  })

  it('does not arm when motion is reduced', () => {
    setMedia('(prefers-reduced-motion: reduce)', true)
    const { container } = render(
      <Reveal>
        <span>Revealed</span>
      </Reveal>,
    )
    act(() => flushIntersections())
    expect(container.firstChild).not.toHaveAttribute('data-armed')
    setMedia('(prefers-reduced-motion: reduce)', false)
  })

  it.each(['up', 'down', 'left', 'right', 'scale', 'fade', 'blur-up'] as const)(
    'renders the %s variant',
    (variant) => {
      const { container } = render(
        <Reveal variant={variant}>
          <span>Revealed</span>
        </Reveal>,
      )
      expect(container.firstChild).toBeInTheDocument()
    },
  )

  it('renders as another element', () => {
    render(
      <Reveal as="section">
        <span>Revealed</span>
      </Reveal>,
    )
    expect(screen.getByText('Revealed').closest('section')).toBeInTheDocument()
  })

  it('keeps an id for anchoring', () => {
    const { container } = render(
      <Reveal id="anchor">
        <span>Revealed</span>
      </Reveal>,
    )
    expect(container.firstChild).toHaveAttribute('id', 'anchor')
  })
})

describe('CountUp', () => {
  let frames: { flush: () => void }

  beforeEach(() => {
    frames = stubAnimationFrames()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows the value before it has been seen', () => {
    render(<CountUp value={42} />)
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('rolls up to the value once it is seen', () => {
    render(<CountUp value={42} />)
    act(() => flushIntersections())
    act(() => frames.flush())
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('renders a prefix and a suffix', () => {
    render(<CountUp value={42} prefix="$" suffix=" pts" />)
    expect(screen.getByText('$42 pts')).toBeInTheDocument()
  })

  it('renders decimals', () => {
    render(<CountUp value={42.5} decimals={1} />)
    expect(screen.getByText('42.5')).toBeInTheDocument()
  })

  it('uses a custom formatter', () => {
    render(<CountUp value={42} format={(n) => `${n} points`} />)
    expect(screen.getByText('42 points')).toBeInTheDocument()
  })

  it('does not roll when motion is reduced', () => {
    setMedia('(prefers-reduced-motion: reduce)', true)
    render(<CountUp value={42} />)
    act(() => flushIntersections())
    expect(screen.getByText('42')).toBeInTheDocument()
    setMedia('(prefers-reduced-motion: reduce)', false)
  })
})

describe('Tilt', () => {
  let frames: { flush: () => void }

  beforeEach(() => {
    frames = stubAnimationFrames()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders its children', () => {
    render(
      <Tilt>
        <span>Tilted</span>
      </Tilt>,
    )
    expect(screen.getByText('Tilted')).toBeInTheDocument()
  })

  it('draws a glare by default', () => {
    const { container } = render(
      <Tilt>
        <span>Tilted</span>
      </Tilt>,
    )
    expect(container.querySelector('.tilt-glare')).toBeInTheDocument()
  })

  it('draws no glare when it is turned off', () => {
    const { container } = render(
      <Tilt glare={false}>
        <span>Tilted</span>
      </Tilt>,
    )
    expect(container.querySelector('.tilt-glare')).toBeNull()
  })

  it('leans towards the pointer', () => {
    const { container } = render(
      <Tilt>
        <span>Tilted</span>
      </Tilt>,
    )
    const stage = container.querySelector('.tilt') as HTMLElement
    stage.getBoundingClientRect = () => ({ left: 0, top: 0, width: 400, height: 200 }) as DOMRect

    act(() => {
      stage.dispatchEvent(
        new PointerEvent('pointermove', { clientX: 300, clientY: 150, bubbles: true }),
      )
      frames.flush()
    })

    expect(stage.style.getPropertyValue('--tilt-y')).not.toBe('')
  })

  it('settles back when the pointer leaves', () => {
    const { container } = render(
      <Tilt>
        <span>Tilted</span>
      </Tilt>,
    )
    const stage = container.querySelector('.tilt') as HTMLElement
    stage.getBoundingClientRect = () => ({ left: 0, top: 0, width: 400, height: 200 }) as DOMRect

    act(() => {
      stage.dispatchEvent(
        new PointerEvent('pointermove', { clientX: 300, clientY: 150, bubbles: true }),
      )
      frames.flush()
      stage.dispatchEvent(new PointerEvent('pointerleave', { bubbles: true }))
      frames.flush()
    })

    expect(stage.style.getPropertyValue('--tilt-x')).toBe('0deg')
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
      stage.dispatchEvent(
        new PointerEvent('pointermove', { clientX: 300, clientY: 150, bubbles: true }),
      )
      frames.flush()
    })

    expect(stage.style.getPropertyValue('--tilt-y')).toBe('')
    setMedia('(prefers-reduced-motion: reduce)', false)
  })

  it('does not lean on a coarse pointer', () => {
    setMedia('(pointer: coarse)', true)
    const { container } = render(
      <Tilt>
        <span>Tilted</span>
      </Tilt>,
    )
    const stage = container.querySelector('.tilt') as HTMLElement
    stage.getBoundingClientRect = () => ({ left: 0, top: 0, width: 400, height: 200 }) as DOMRect

    act(() => {
      stage.dispatchEvent(
        new PointerEvent('pointermove', { clientX: 300, clientY: 150, bubbles: true }),
      )
      frames.flush()
    })

    expect(stage.style.getPropertyValue('--tilt-y')).toBe('')
    setMedia('(pointer: coarse)', false)
  })
})

describe('PointerField', () => {
  let frames: { flush: () => void }

  beforeEach(() => {
    frames = stubAnimationFrames()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('drifts the opted-in children towards the pointer', () => {
    const { container } = render(
      <PointerField>
        <span data-pf="true">Card</span>
      </PointerField>,
    )
    const field = container.firstChild as HTMLElement
    const card = container.querySelector('[data-pf]') as HTMLElement
    card.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 100 }) as DOMRect

    act(() => {
      field.dispatchEvent(
        new PointerEvent('pointermove', { clientX: 20, clientY: 20, bubbles: true }),
      )
      frames.flush()
    })

    expect(card.style.getPropertyValue('--pf-x')).not.toBe('')
  })

  it('settles the children back when the pointer leaves', () => {
    const { container } = render(
      <PointerField>
        <span data-pf="true">Card</span>
      </PointerField>,
    )
    const field = container.firstChild as HTMLElement
    const card = container.querySelector('[data-pf]') as HTMLElement
    card.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 100 }) as DOMRect

    act(() => {
      field.dispatchEvent(
        new PointerEvent('pointermove', { clientX: 20, clientY: 20, bubbles: true }),
      )
      frames.flush()
      field.dispatchEvent(new PointerEvent('pointerleave', { bubbles: true }))
      frames.flush()
    })

    expect(card.style.getPropertyValue('--pf-x')).toBe('0px')
  })

  it('does not drift on a coarse pointer', () => {
    setMedia('(pointer: coarse)', true)
    const { container } = render(
      <PointerField>
        <span data-pf="true">Card</span>
      </PointerField>,
    )
    const field = container.firstChild as HTMLElement
    const card = container.querySelector('[data-pf]') as HTMLElement
    card.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 100 }) as DOMRect

    act(() => {
      field.dispatchEvent(
        new PointerEvent('pointermove', { clientX: 20, clientY: 20, bubbles: true }),
      )
      frames.flush()
    })

    expect(card.style.getPropertyValue('--pf-x')).toBe('')
    setMedia('(pointer: coarse)', false)
  })
})

describe('Magnetic', () => {
  let frames: { flush: () => void }

  beforeEach(() => {
    frames = stubAnimationFrames()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('leans towards the pointer when it enters', () => {
    const { container } = render(
      <Magnetic>
        <span>Button</span>
      </Magnetic>,
    )
    const field = container.firstChild as HTMLElement
    field.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 40 }) as DOMRect

    act(() => {
      field.dispatchEvent(
        new PointerEvent('pointerenter', { clientX: 55, clientY: 20, bubbles: true }),
      )
      frames.flush()
      window.dispatchEvent(
        new PointerEvent('pointermove', { clientX: 55, clientY: 20, bubbles: true }),
      )
      frames.flush()
    })

    expect(field.style.getPropertyValue('--mg-x')).not.toBe('')
  })

  it('settles back when the pointer leaves the neighbourhood', () => {
    const { container } = render(
      <Magnetic>
        <span>Button</span>
      </Magnetic>,
    )
    const field = container.firstChild as HTMLElement
    field.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 40 }) as DOMRect

    act(() => {
      field.dispatchEvent(
        new PointerEvent('pointerenter', { clientX: 55, clientY: 20, bubbles: true }),
      )
      frames.flush()
      window.dispatchEvent(
        new PointerEvent('pointermove', { clientX: 5000, clientY: 20, bubbles: true }),
      )
      frames.flush()
    })

    expect(field.style.getPropertyValue('--mg-x')).toBe('0px')
  })

  it('does not lean on a coarse pointer', () => {
    setMedia('(pointer: coarse)', true)
    const { container } = render(
      <Magnetic>
        <span>Button</span>
      </Magnetic>,
    )
    const field = container.firstChild as HTMLElement
    field.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 40 }) as DOMRect

    act(() => {
      field.dispatchEvent(
        new PointerEvent('pointerenter', { clientX: 55, clientY: 20, bubbles: true }),
      )
      frames.flush()
    })

    expect(field.style.getPropertyValue('--mg-x')).toBe('')
    setMedia('(pointer: coarse)', false)
  })
})

describe('TextReveal', () => {
  it('renders the text', () => {
    const { container } = render(<TextReveal text="A heading" />)
    expect(container.textContent?.replace(/\s+/g, ' ').trim()).toBe('A heading')
  })

  it('arms each word once it comes into view', () => {
    const { container } = render(<TextReveal text="A heading" />)
    act(() => flushIntersections())
    const words = container.querySelectorAll('.word')
    expect(words).toHaveLength(2)
    expect(words[0]).toHaveAttribute('data-armed', 'true')
  })

  it('does not arm when motion is reduced', () => {
    setMedia('(prefers-reduced-motion: reduce)', true)
    const { container } = render(<TextReveal text="A heading" />)
    act(() => flushIntersections())
    expect(container.querySelectorAll('[data-armed="true"]')).toHaveLength(0)
    setMedia('(prefers-reduced-motion: reduce)', false)
  })

  it('renders as another element', () => {
    const { container } = render(<TextReveal as="h1" text="A heading" />)
    expect(container.querySelector('h1')).toBeInTheDocument()
  })
})

describe('TextScramble', () => {
  let frames: { flush: () => void }

  beforeEach(() => {
    frames = stubAnimationFrames(16)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders the text', () => {
    const { container } = render(<TextScramble text="Scrambled" />)
    expect(container.textContent).toContain('S')
  })

  it('settles on the text it was given', () => {
    const { container } = render(<TextScramble text="Scrambled" />)
    act(() => flushIntersections())
    for (let i = 0; i < 50; i++) {
      act(() => frames.flush())
    }
    expect(container.textContent).toBe('Scrambled')
  })

  it('shows the text straight away when motion is reduced', () => {
    setMedia('(prefers-reduced-motion: reduce)', true)
    const { container } = render(<TextScramble text="Scrambled" />)
    expect(container.textContent).toBe('Scrambled')
    setMedia('(prefers-reduced-motion: reduce)', false)
  })
})

describe('TaglineReveal', () => {
  it('renders every line', () => {
    const { container } = render(<TaglineReveal lines={['One', 'Two']} />)
    expect(container.textContent).toContain('One')
    expect(container.textContent).toContain('Two')
  })

  it('arms once it comes into view', () => {
    const { container } = render(<TaglineReveal lines={['One', 'Two']} />)
    act(() => flushIntersections())
    expect(container.firstChild).toBeInTheDocument()
  })

  it('does not arm when motion is reduced', () => {
    setMedia('(prefers-reduced-motion: reduce)', true)
    const { container } = render(<TaglineReveal lines={['One', 'Two']} />)
    act(() => flushIntersections())
    expect(container.firstChild).toBeInTheDocument()
    setMedia('(prefers-reduced-motion: reduce)', false)
  })
})

describe('RenderType', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('reads the full phrase to a screen reader', () => {
    render(<RenderType text="Hello" />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('types the phrase out one character at a time', () => {
    const { container } = render(<RenderType text="Hello" speed={10} startDelay={0} />)
    act(() => vi.advanceTimersByTime(10))
    act(() => vi.advanceTimersByTime(10))
    expect(container.textContent).toContain('H')
  })

  it('shows the phrase straight away when motion is reduced', () => {
    setMedia('(prefers-reduced-motion: reduce)', true)
    const { container } = render(<RenderType text="Hello" />)
    expect(container.textContent).toContain('Hello')
    setMedia('(prefers-reduced-motion: reduce)', false)
  })

  it('reports completion', () => {
    const onComplete = vi.fn()
    render(<RenderType text="Hello" speed={10} startDelay={0} onComplete={onComplete} />)
    for (let i = 0; i < 20; i++) {
      act(() => vi.advanceTimersByTime(50))
    }
    expect(onComplete).toHaveBeenCalled()
  })

  it('renders a prefix and a suffix', () => {
    const { container } = render(<RenderType text="Hello" prefix="<" suffix=">" />)
    expect(container.textContent).toContain('<')
    expect(container.textContent).toContain('>')
  })

  it('draws a cursor by default and hides it on request', () => {
    const { container, rerender } = render(<RenderType text="Hello" />)
    expect(container.querySelector('.animate-type-cursor')).not.toBeNull()
    rerender(<RenderType text="Hello" cursor={false} />)
    expect(container.querySelector('.animate-type-cursor')).toBeNull()
  })

  it.each(['bar', 'block', 'underscore'] as const)('draws the %s cursor', (cursorStyle) => {
    const { container } = render(<RenderType text="Hello" cursorStyle={cursorStyle} />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders as another element', () => {
    render(<RenderType as="h1" text="Hello" />)
    expect(screen.getByText('Hello').closest('h1')).toBeInTheDocument()
  })

  it('loops through a list of phrases', () => {
    const { container } = render(
      <RenderType
        text={['One', 'Two']}
        speed={10}
        startDelay={0}
        deleteSpeed={10}
        holdDuration={10}
      />,
    )
    for (let i = 0; i < 40; i++) {
      act(() => vi.advanceTimersByTime(50))
    }
    expect(container.textContent).toContain('O')
  })
})
