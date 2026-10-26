import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render } from '@testing-library/react'
import { TaglineReveal } from '../../../src/components/ui/TaglineReveal'
import { RenderType } from '../../../src/components/ui/render-type'
import { TextReveal } from '../../../src/components/ui/text-reveal'
import { TextScramble } from '../../../src/components/ui/text-scramble'
import { flushIntersections, setMedia } from '../../setup/browser-env'

/* ---------------------------------------------------------------------------
   The components that assemble a sentence out of its words.

   Each of them has the same shape: the resolved text is what the server
   sends, the animation only arms once the element is on screen, and a
   visitor who asked for less motion never sees the hidden state at all.

   The tests here are about the edges the earlier motion suites did not
   reach: an element that never becomes visible, a phrase list with nothing
   in it, and the stagger that puts the words back in reading order.
   --------------------------------------------------------------------------- */

describe('TaglineReveal', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('shows every word of every line', () => {
    const { container } = render(<TaglineReveal lines={['One two', 'Three']} />)
    expect(container.textContent?.replace(/\s+/g, ' ').trim()).toBe('One two Three')
  })

  it('mutes the words until they are seen', () => {
    const { container } = render(<TaglineReveal lines={['One two']} />)
    expect(container.querySelectorAll('[data-active="false"]')).toHaveLength(2)
  })

  it('leaves a word that never comes into view muted', () => {
    const { container } = render(<TaglineReveal lines={['One two']} />)
    act(() => flushIntersections(undefined, false))
    expect(container.querySelectorAll('[data-active="true"]')).toHaveLength(0)
  })

  it('resolves the words in reading order', () => {
    const { container } = render(<TaglineReveal lines={['One two']} />)
    act(() => flushIntersections())
    act(() => vi.advanceTimersByTime(0))
    expect(container.querySelector('[data-reveal-word="0"]')).toHaveAttribute('data-active', 'true')
    expect(container.querySelector('[data-reveal-word="1"]')).toHaveAttribute(
      'data-active',
      'false',
    )

    act(() => vi.advanceTimersByTime(42))
    expect(container.querySelector('[data-reveal-word="1"]')).toHaveAttribute('data-active', 'true')
  })

  it('draws the rule as the sentence lands', () => {
    const { container } = render(<TaglineReveal lines={['One']} />)
    const rule = container.querySelector('[data-reveal-rule]') as HTMLElement
    expect(rule).toHaveAttribute('data-armed', 'true')
    act(() => flushIntersections())
    expect(rule).toHaveAttribute('data-revealed', 'true')
  })

  it('leaves the resolved markup alone when the browser has no observer', () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    const { container } = render(<TaglineReveal lines={['One']} />)
    expect(container.querySelector('[data-reveal-word]')).toHaveAttribute('data-active', 'true')
    expect(container.querySelector('[data-reveal-rule]')).not.toHaveAttribute('data-armed')
  })

  it('goes quietly when it is removed', () => {
    const { unmount } = render(<TaglineReveal lines={['One']} />)
    act(() => flushIntersections())
    unmount()
    expect(() => act(() => vi.advanceTimersByTime(100))).not.toThrow()
  })
})

describe('RenderType', () => {
  afterEach(() => {
    setMedia('(prefers-reduced-motion: reduce)', false)
  })

  it('shows nothing for an empty phrase list when motion is reduced', () => {
    setMedia('(prefers-reduced-motion: reduce)', true)
    const { container } = render(<RenderType text={[]} />)
    expect(container.textContent).toBe('')
  })

  it('reads the first phrase of a list to a screen reader', () => {
    const { container } = render(<RenderType text={['One', 'Two']} />)
    expect(container.querySelector('.sr-only')?.textContent).toBe('One')
  })

  it('stops the cursor blinking while the phrase is being typed', () => {
    vi.useFakeTimers()
    const { container } = render(<RenderType text="Hello" speed={10} startDelay={0} />)
    act(() => vi.advanceTimersByTime(10))
    expect(container.querySelector('.animate-type-cursor')).toBeNull()
    vi.useRealTimers()
  })
})

describe('TextReveal', () => {
  it('does not arm when the heading never comes into view', () => {
    const { container } = render(<TextReveal text="A heading" />)
    act(() => flushIntersections(undefined, false))
    expect(container.querySelectorAll('[data-armed="true"]')).toHaveLength(0)
  })

  it('leaves the resolved markup alone when the browser has no observer', () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    const { container } = render(<TextReveal text="A heading" />)
    expect(container.querySelectorAll('[data-armed="true"]')).toHaveLength(0)
    vi.unstubAllGlobals()
  })
})

describe('TextScramble', () => {
  it('does not scramble when the label never comes into view', () => {
    const { container } = render(<TextScramble text="Status" />)
    act(() => flushIntersections(undefined, false))
    expect(container.textContent).toBe('Status')
  })

  it('leaves the resolved markup alone when the browser has no observer', () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    const { container } = render(<TextScramble text="Status" />)
    expect(container.textContent).toBe('Status')
    vi.unstubAllGlobals()
  })
})
