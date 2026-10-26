import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render } from '@testing-library/react'
import { CountUp } from '../../../src/components/ui/motion'
import { TextReveal } from '../../../src/components/ui/text-reveal'
import { RenderType } from '../../../src/components/ui/render-type'
import { flushIntersections } from '../../setup/browser-env'

/* ---------------------------------------------------------------------------
   The remaining edges of the motion components: a value that returns to
   where it started, a heading made of markup rather than a string, and a
   typed phrase that has to be deleted before the next one starts.
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

describe('CountUp when the value comes back', () => {
  let frames: { flush: () => void }

  beforeEach(() => {
    frames = stubAnimationFrames()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('settles at once when the new value equals the old one', () => {
    const { rerender } = render(<CountUp value={42} duration={100} />)
    act(() => flushIntersections())
    act(() => frames.flush())

    rerender(<CountUp value={60} duration={100} />)
    act(() => frames.flush())
    expect(document.body.textContent).toContain('60')

    rerender(<CountUp value={60} duration={100} />)
    act(() => frames.flush())
    expect(document.body.textContent).toContain('60')
  })
})

describe('TextReveal with composed markup', () => {
  let frames: { flush: () => void }

  beforeEach(() => {
    frames = stubAnimationFrames()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows its words once the reveal has played', () => {
    const { container } = render(<TextReveal text="A heading" />)
    act(() => flushIntersections())
    act(() => frames.flush())
    act(() => frames.flush())
    expect(container.querySelector('.word-in')).not.toBeNull()
  })

  it('treats markup as a single piece', () => {
    const { container } = render(
      <TextReveal
        text={
          <span className="styled">
            A <em>styled</em> heading
          </span>
        }
      />,
    )
    expect(container.querySelectorAll('.word')).toHaveLength(1)
    expect(container.querySelector('.styled')).toBeInTheDocument()
  })
})

describe('RenderType edge cases', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('copes with an empty phrase list', () => {
    const { container } = render(<RenderType text={[]} />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('pauses after punctuation', () => {
    const { container } = render(<RenderType text="Hi, there" speed={10} startDelay={0} />)
    act(() => vi.advanceTimersByTime(10))
    act(() => vi.advanceTimersByTime(10))
    // The comma buys an extra 140ms before the next character appears.
    act(() => vi.advanceTimersByTime(50))
    expect(container.textContent).toContain('H')
  })

  it('deletes the phrase before typing the next one', () => {
    const { container } = render(
      <RenderType
        text={['One', 'Two']}
        speed={10}
        startDelay={0}
        deleteSpeed={10}
        holdDuration={10}
      />,
    )
    for (let i = 0; i < 30; i++) {
      act(() => vi.advanceTimersByTime(50))
    }
    // The first phrase has been deleted and the second one typed in.
    expect(container.textContent).toContain('Two')
  })
})
