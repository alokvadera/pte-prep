import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render } from '@testing-library/react'
import ColourfulText from '../../../src/components/ui/colourful-text'
import ColourfulTextDemo from '../../../src/components/ui/colourful-text-demo'
import { WordRotate } from '../../../src/components/ui/word-rotate'
import { NumberTicker } from '../../../src/components/ui/number-ticker'
import { setMedia } from '../../setup/browser-env'

/* ---------------------------------------------------------------------------
   The three components that lean on `motion/react`.

   Framer Motion owns an animation loop of its own, which does not belong in
   a unit test, so the library is stubbed here — and only here. What is left
   is the part of each component that is this site's own: when the palette
   reshuffles, when the word turns over, and when the number starts counting.

   The stub still runs the change handlers the components rely on, because
   those are the code under test.
   --------------------------------------------------------------------------- */

const motionState = vi.hoisted(() => ({ inView: true }))

vi.mock('motion/react', async () => {
  const React = await import('react')
  const MOTION_PROPS = new Set([
    'initial',
    'animate',
    'exit',
    'transition',
    'whileHover',
    'whileTap',
    'whileDrag',
    'whileFocus',
    'layout',
    'layoutId',
    'custom',
    'variants',
  ])
  const make = (tag: string) => {
    const Component = ({
      children,
      ...props
    }: { children?: React.ReactNode } & Record<string, unknown>) => {
      const clean: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(props)) {
        if (!MOTION_PROPS.has(key)) clean[key] = value
      }
      return React.createElement(tag, clean, children)
    }
    return Component
  }
  const makeValue = (initial: number) => {
    let current = initial
    const listeners: Array<(latest: number) => void> = []
    return {
      get: () => current,
      set: (next: number) => {
        current = next
        for (const listener of listeners) listener(next)
      },
      on: (_type: string, callback: (latest: number) => void) => {
        listeners.push(callback)
        callback(current)
        return () => {}
      },
    }
  }
  return {
    motion: new Proxy({} as Record<string, unknown>, {
      get: (_target, tag: string) => make(tag),
    }),
    AnimatePresence: ({ children }: { children?: React.ReactNode }) => children,
    useInView: () => motionState.inView,
    useMotionValue: (initial: number) => makeValue(initial),
    useSpring: (value: {
      get: () => number
      set: (n: number) => void
      on: (t: string, cb: (n: number) => void) => () => void
    }) => ({
      get: () => value.get(),
      set: (next: number) => value.set(next),
      on: (_type: string, callback: (latest: number) => void) => value.on('change', callback),
    }),
  }
})

describe('ColourfulText', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    setMedia('(prefers-reduced-motion: reduce)', false)
  })

  it('renders one span per character', () => {
    const { container } = render(<ColourfulText text="abc" />)
    expect(container.querySelectorAll('span')).toHaveLength(3)
  })

  it('keeps the text it was given', () => {
    const { container } = render(<ColourfulText text="abc" />)
    expect(container.textContent).toBe('abc')
  })

  it('reshuffles the palette every five seconds', () => {
    const { container } = render(<ColourfulText text="abc" />)
    // Each character is keyed by the shuffle count, so a reshuffle replaces
    // every character element.
    const first = container.querySelector('span') as HTMLElement
    first.setAttribute('data-marker', 'first')
    act(() => vi.advanceTimersByTime(5000))
    expect(container.querySelector('span')?.hasAttribute('data-marker')).toBe(false)
  })

  it('does not reshuffle when motion is reduced', () => {
    setMedia('(prefers-reduced-motion: reduce)', true)
    const { container } = render(<ColourfulText text="abc" />)
    const first = container.querySelector('span') as HTMLElement
    first.setAttribute('data-marker', 'first')
    act(() => vi.advanceTimersByTime(5000))
    expect(container.querySelector('span')?.hasAttribute('data-marker')).toBe(true)
  })

  it('goes quietly when it is removed', () => {
    const { unmount } = render(<ColourfulText text="abc" />)
    unmount()
    expect(() => act(() => vi.advanceTimersByTime(5000))).not.toThrow()
  })
})

describe('ColourfulTextDemo', () => {
  it('renders the colourful word inside its heading', () => {
    const { container } = render(<ColourfulTextDemo />)
    expect(container.querySelector('h1')).toHaveTextContent(
      'The best components you will ever find',
    )
  })

  it('renders the background image', () => {
    const { container } = render(<ColourfulTextDemo />)
    expect(container.querySelector('img')).toBeInTheDocument()
  })
})

describe('WordRotate', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    setMedia('(prefers-reduced-motion: reduce)', false)
  })

  it('shows the first word to begin with', () => {
    const { container } = render(<WordRotate words={['One', 'Two']} />)
    expect(container.textContent).toBe('One')
  })

  it('turns over to the next word', () => {
    const { container } = render(<WordRotate words={['One', 'Two']} duration={1000} />)
    act(() => vi.advanceTimersByTime(1000))
    expect(container.textContent).toBe('Two')
  })

  it('turns over at its own pace by default', () => {
    const { container } = render(<WordRotate words={['One', 'Two']} />)
    act(() => vi.advanceTimersByTime(2500))
    expect(container.textContent).toBe('Two')
  })

  it('comes back round to the first word', () => {
    const { container } = render(<WordRotate words={['One', 'Two']} duration={1000} />)
    act(() => vi.advanceTimersByTime(1000))
    act(() => vi.advanceTimersByTime(1000))
    expect(container.textContent).toBe('One')
  })

  it('stays put when motion is reduced', () => {
    setMedia('(prefers-reduced-motion: reduce)', true)
    const { container } = render(<WordRotate words={['One', 'Two']} duration={1000} />)
    act(() => vi.advanceTimersByTime(5000))
    expect(container.textContent).toBe('One')
  })

  it('stays put when there is only one word', () => {
    const { container } = render(<WordRotate words={['One']} duration={1000} />)
    act(() => vi.advanceTimersByTime(5000))
    expect(container.textContent).toBe('One')
  })

  it('shows nothing for an empty list of words', () => {
    const { container } = render(<WordRotate words={[]} />)
    expect(container.textContent).toBe('')
  })

  it('takes a custom class name', () => {
    const { container } = render(<WordRotate words={['One']} className="text-2xl" />)
    expect(container.querySelector('span span')).toHaveClass('text-2xl')
  })

  it('goes quietly when it is removed', () => {
    const { unmount } = render(<WordRotate words={['One', 'Two']} duration={1000} />)
    unmount()
    expect(() => act(() => vi.advanceTimersByTime(5000))).not.toThrow()
  })
})

describe('NumberTicker', () => {
  beforeEach(() => {
    motionState.inView = true
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    setMedia('(prefers-reduced-motion: reduce)', false)
  })

  it('shows the start value while the number is waiting to roll', () => {
    const { container } = render(<NumberTicker value={42} startValue={10} />)
    expect(container.textContent).toBe('10')
  })

  it('shows the value straight away when motion is reduced', () => {
    setMedia('(prefers-reduced-motion: reduce)', true)
    const { container } = render(<NumberTicker value={42} startValue={10} />)
    expect(container.textContent).toBe('42')
  })

  it('shows the value when the ticker is not on screen', () => {
    motionState.inView = false
    const { container } = render(<NumberTicker value={42} startValue={10} />)
    act(() => vi.advanceTimersByTime(2000))
    expect(container.textContent).toBe('10')
  })

  it('counts up to the value once it is on screen', () => {
    const { container } = render(<NumberTicker value={42} startValue={10} />)
    expect(container.textContent).toBe('10')
    act(() => vi.advanceTimersByTime(2000))
    expect(container.textContent).toBe('42')
  })

  it('counts down when it is told to', () => {
    const { container } = render(<NumberTicker value={42} startValue={10} direction="down" />)
    expect(container.textContent).toBe('42')
    act(() => vi.advanceTimersByTime(2000))
    expect(container.textContent).toBe('10')
  })

  it('waits for its delay before it starts', () => {
    const { container } = render(<NumberTicker value={42} startValue={10} delay={1} />)
    act(() => vi.advanceTimersByTime(500))
    expect(container.textContent).toBe('10')
  })

  it('shows the decimals it was asked for', () => {
    const { container } = render(<NumberTicker value={42.5} startValue={0} decimalPlaces={1} />)
    expect(container.textContent).toBe('0.0')
  })

  it('takes a class name', () => {
    const { container } = render(<NumberTicker value={42} className="text-3xl" />)
    expect(container.querySelector('span')).toHaveClass('text-3xl')
  })

  it('goes quietly when it is removed', () => {
    const { unmount } = render(<NumberTicker value={42} startValue={10} />)
    unmount()
    expect(() => act(() => vi.advanceTimersByTime(2000))).not.toThrow()
  })
})
