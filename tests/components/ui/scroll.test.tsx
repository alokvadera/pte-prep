import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, screen } from '@testing-library/react'
import { ScrollProgress } from '../../../src/components/ui/scroll-progress'
import { BackToTop } from '../../../src/components/ui/back-to-top'
import { ProgressDots } from '../../../src/components/ui/progress-dots'
import { ScrollVelocity } from '../../../src/components/ui/scroll-velocity'
import { flushIntersections, setMedia } from '../../setup/browser-env'
import { renderWithProviders } from '../../helpers/render'

/* ---------------------------------------------------------------------------
   The components that read the scroll position.

   Three of them measure the same thing — where the reader is — and each one
   answers it differently: a hairline that fills, a button that appears, and a
   rail that names the section you are in. The fourth reacts to how *fast* the
   reader is moving.

   Every one of them writes its number from a rAF-throttled scroll listener,
   so the tests drive the frames themselves.
   --------------------------------------------------------------------------- */

/**
 * A rAF queue the test drives.
 *
 * `cancelAnimationFrame` deliberately leaves the callback in the queue: the
 * components under test cancel a frame they have already scheduled, and the
 * callback still runs afterwards. That is exactly the case the running flag
 * inside the ticker exists to survive.
 */
function stubFrames(stepMs = 16): { flush: () => void } {
  let queued: FrameRequestCallback[] = []
  let elapsed = 0
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    queued.push(callback)
    return queued.length
  })
  vi.stubGlobal('cancelAnimationFrame', () => {})
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

/** Overrides a window property and hands back a function that puts it back. */
function override(target: object, key: string, value: unknown): () => void {
  const previous = Object.getOwnPropertyDescriptor(target, key)
  Object.defineProperty(target, key, { configurable: true, writable: true, value })
  return () => {
    if (previous) Object.defineProperty(target, key, previous)
    else delete (target as Record<string, unknown>)[key]
  }
}

describe('ScrollProgress', () => {
  let frames: { flush: () => void }
  let restoreScrollY: () => void
  let restoreInnerHeight: () => void
  let restoreScrollHeight: () => void

  beforeEach(() => {
    frames = stubFrames()
    restoreScrollY = override(window, 'scrollY', 0)
    restoreInnerHeight = override(window, 'innerHeight', 1000)
    restoreScrollHeight = override(document.documentElement, 'scrollHeight', 2000)
  })

  afterEach(() => {
    restoreScrollY()
    restoreInnerHeight()
    restoreScrollHeight()
    vi.unstubAllGlobals()
  })

  it('starts at zero', () => {
    renderWithProviders(<ScrollProgress />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
  })

  it('fills as the page is read', () => {
    const { container } = renderWithProviders(<ScrollProgress />)
    act(() => {
      Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 500 })
      window.dispatchEvent(new Event('scroll'))
    })
    act(() => frames.flush())
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50')
    expect(container.querySelector('[style*="width"]')).toHaveStyle({ width: '50%' })
  })

  it('rounds to a tenth of a percent', () => {
    renderWithProviders(<ScrollProgress />)
    act(() => {
      Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 333 })
      window.dispatchEvent(new Event('scroll'))
    })
    act(() => frames.flush())
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '33')
  })

  it('never goes past a hundred', () => {
    renderWithProviders(<ScrollProgress />)
    act(() => {
      Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 5000 })
      window.dispatchEvent(new Event('scroll'))
    })
    act(() => frames.flush())
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
  })

  it('never goes below zero', () => {
    renderWithProviders(<ScrollProgress />)
    act(() => {
      Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: -400 })
      window.dispatchEvent(new Event('scroll'))
    })
    act(() => frames.flush())
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
  })

  it('reads nothing when the page does not scroll', () => {
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      writable: true,
      value: 1000,
    })
    renderWithProviders(<ScrollProgress />)
    act(() => {
      Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 500 })
      window.dispatchEvent(new Event('scroll'))
    })
    act(() => frames.flush())
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
  })

  it('waits for the next frame rather than reading on every scroll', () => {
    renderWithProviders(<ScrollProgress />)
    act(() => {
      Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 500 })
      window.dispatchEvent(new Event('scroll'))
      window.dispatchEvent(new Event('scroll'))
      window.dispatchEvent(new Event('scroll'))
    })
    // Nothing has been read yet: the first scroll scheduled the frame.
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
    act(() => frames.flush())
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50')
  })

  it('reads again after the frame has run', () => {
    renderWithProviders(<ScrollProgress />)
    act(() => {
      Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 500 })
      window.dispatchEvent(new Event('scroll'))
    })
    act(() => frames.flush())
    act(() => {
      Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 1000 })
      window.dispatchEvent(new Event('scroll'))
    })
    act(() => frames.flush())
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
  })

  it('cancels its pending frame when it goes', () => {
    const { unmount } = renderWithProviders(<ScrollProgress />)
    act(() => {
      window.dispatchEvent(new Event('scroll'))
    })
    unmount()
    expect(() => act(() => frames.flush())).not.toThrow()
  })

  it('goes quietly when there is nothing pending', () => {
    const { unmount } = renderWithProviders(<ScrollProgress />)
    unmount()
    expect(() => unmount()).not.toThrow()
  })

  it('takes a class name', () => {
    const { container } = renderWithProviders(<ScrollProgress className="z-50" />)
    expect(container.firstChild).toHaveClass('z-50')
  })
})

describe('BackToTop', () => {
  let frames: { flush: () => void }
  let restoreScrollY: () => void

  beforeEach(() => {
    frames = stubFrames()
    restoreScrollY = override(window, 'scrollY', 0)
  })

  afterEach(() => {
    restoreScrollY()
    vi.unstubAllGlobals()
  })

  it('stays out of the way at the top of the page', () => {
    const { container } = renderWithProviders(<BackToTop />)
    expect(container.querySelector('button')).toHaveAttribute('aria-hidden', 'true')
  })

  it('appears once the reader has gone a screen or so', () => {
    const { container } = renderWithProviders(<BackToTop />)
    act(() => {
      Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 900 })
      window.dispatchEvent(new Event('scroll'))
    })
    act(() => frames.flush())
    expect(container.querySelector('button')).toHaveAttribute('aria-hidden', 'false')
  })

  it('stays away just below the threshold', () => {
    const { container } = renderWithProviders(<BackToTop />)
    act(() => {
      Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 600 })
      window.dispatchEvent(new Event('scroll'))
    })
    act(() => frames.flush())
    expect(container.querySelector('button')).toHaveAttribute('aria-hidden', 'true')
  })

  it('ignores a second scroll while a frame is pending', () => {
    const { container } = renderWithProviders(<BackToTop />)
    act(() => {
      Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 900 })
      window.dispatchEvent(new Event('scroll'))
      window.dispatchEvent(new Event('scroll'))
    })
    expect(container.querySelector('button')).toHaveAttribute('aria-hidden', 'true')
    act(() => frames.flush())
    expect(container.querySelector('button')).toHaveAttribute('aria-hidden', 'false')
  })

  it('tucks itself away again at the top', () => {
    const { container } = renderWithProviders(<BackToTop />)
    act(() => {
      Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 900 })
      window.dispatchEvent(new Event('scroll'))
    })
    act(() => frames.flush())
    act(() => {
      Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 0 })
      window.dispatchEvent(new Event('scroll'))
    })
    act(() => frames.flush())
    expect(container.querySelector('button')).toHaveAttribute('aria-hidden', 'true')
  })

  it('keeps a hidden button out of the tab order', () => {
    const { container } = renderWithProviders(<BackToTop />)
    expect(container.querySelector('button')).toHaveAttribute('tabindex', '-1')
  })

  it('puts a showing button back in the tab order', () => {
    const { container } = renderWithProviders(<BackToTop />)
    act(() => {
      Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 900 })
      window.dispatchEvent(new Event('scroll'))
    })
    act(() => frames.flush())
    expect(container.querySelector('button')).toHaveAttribute('tabindex', '0')
  })

  it('scrolls the page back to the top', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    const { container } = renderWithProviders(<BackToTop />)
    fireEvent.click(container.querySelector('button') as HTMLElement)
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
  })

  it('scrolls without animation when motion is reduced', () => {
    setMedia('(prefers-reduced-motion: reduce)', true)
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    const { container } = renderWithProviders(<BackToTop />)
    fireEvent.click(container.querySelector('button') as HTMLElement)
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'auto' })
    setMedia('(prefers-reduced-motion: reduce)', false)
  })

  it('takes a class name', () => {
    const { container } = renderWithProviders(<BackToTop className="left-8" />)
    expect(container.querySelector('button')).toHaveClass('left-8')
  })

  it('cancels its pending frame when it goes', () => {
    const { unmount } = renderWithProviders(<BackToTop />)
    act(() => {
      window.dispatchEvent(new Event('scroll'))
    })
    unmount()
    expect(() => act(() => frames.flush())).not.toThrow()
  })
})

describe('ProgressDots', () => {
  const sections = [
    { id: 'intro', label: 'Introduction' },
    { id: 'body', label: 'The body' },
    { id: 'end', label: 'The end' },
  ]

  let frames: { flush: () => void }
  let restoreScrollY: () => void
  let restoreInnerHeight: () => void
  let restoreScrollHeight: () => void

  beforeEach(() => {
    frames = stubFrames()
    restoreScrollY = override(window, 'scrollY', 0)
    restoreInnerHeight = override(window, 'innerHeight', 1000)
    restoreScrollHeight = override(document.documentElement, 'scrollHeight', 3000)
  })

  afterEach(() => {
    restoreScrollY()
    restoreInnerHeight()
    restoreScrollHeight()
    vi.unstubAllGlobals()
  })

  function placeSection(id: string, top: number, height: number): HTMLElement {
    const el = document.getElementById(id)
    if (!el) throw new Error(`no section ${id}`)
    // The component measures the document position, so the fake layout has to
    // be in the same place: offsetTop is relative to the offsetParent, which
    // is only the page when no ancestor is positioned.
    Object.defineProperty(el, 'getBoundingClientRect', {
      configurable: true,
      value: () => {
        // The component reads the position in the viewport and adds the scroll
        // offset, so the fake layout is expressed in viewport coordinates:
        // the document position minus wherever the page is scrolled to.
        const viewportTop = top - (window.scrollY ?? 0)
        return {
          top: viewportTop,
          height,
          bottom: viewportTop + height,
          left: 0,
          right: 0,
          width: 0,
          x: 0,
          y: viewportTop,
          toJSON: () => ({}),
        }
      },
    })
    return el
  }

  function renderRail(list = sections) {
    return renderWithProviders(
      <>
        <div id="intro" />
        <div id="body" />
        <div id="end" />
        <ProgressDots sections={list} />
      </>,
    )
  }

  it('renders a button for every section', () => {
    renderRail()
    expect(
      screen.getByRole('button', { name: 'Jump to section 1: Introduction' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Jump to section 3: The end' })).toBeInTheDocument()
  })

  it('starts on the first section', () => {
    renderRail()
    expect(screen.getByRole('button', { name: 'Jump to section 1: Introduction' })).toHaveAttribute(
      'aria-current',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Jump to section 2: The body' })).not.toHaveAttribute(
      'aria-current',
    )
  })

  it('shows the section index as a two-digit number', () => {
    renderRail()
    expect(
      screen.getByRole('navigation', { name: 'Page section navigation' }).textContent,
    ).toContain('01')
  })

  it('shows the scroll percentage', () => {
    renderRail()
    expect(
      screen.getByRole('navigation', { name: 'Page section navigation' }).textContent,
    ).toContain('0%')
  })

  it('stays on the first section near the top', () => {
    renderRail()
    act(() => {
      Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 100 })
      window.dispatchEvent(new Event('scroll'))
    })
    act(() => frames.flush())
    expect(screen.getByRole('button', { name: 'Jump to section 1: Introduction' })).toHaveAttribute(
      'aria-current',
      'true',
    )
  })

  it('moves to the last section at the bottom of the page', () => {
    renderRail()
    act(() => {
      Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 2500 })
      window.dispatchEvent(new Event('scroll'))
    })
    act(() => frames.flush())
    expect(screen.getByRole('button', { name: 'Jump to section 3: The end' })).toHaveAttribute(
      'aria-current',
      'true',
    )
  })

  it('follows the section the reader is looking at', () => {
    renderRail()
    placeSection('intro', 0, 200)
    placeSection('body', 400, 800)
    placeSection('end', 1200, 200)
    act(() => {
      Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 500 })
      window.dispatchEvent(new Event('scroll'))
    })
    act(() => frames.flush())
    expect(screen.getByRole('button', { name: 'Jump to section 2: The body' })).toHaveAttribute(
      'aria-current',
      'true',
    )
  })

  it('keeps the last section passed when the reader is between sections', () => {
    renderRail()
    placeSection('intro', 0, 100)
    placeSection('body', 500, 100)
    placeSection('end', 900, 100)
    act(() => {
      Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 300 })
      window.dispatchEvent(new Event('scroll'))
    })
    act(() => frames.flush())
    // The reader is past the introduction and the body, but not yet at the end.
    expect(screen.getByRole('button', { name: 'Jump to section 2: The body' })).toHaveAttribute(
      'aria-current',
      'true',
    )
  })

  it('skips a section that is not on the page', () => {
    renderRail([
      { id: 'intro', label: 'Introduction' },
      { id: 'ghost', label: 'Nowhere' },
      { id: 'body', label: 'The body' },
    ])
    placeSection('intro', 0, 200)
    placeSection('body', 400, 800)
    act(() => {
      Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 500 })
      window.dispatchEvent(new Event('scroll'))
    })
    act(() => frames.flush())
    expect(screen.getByRole('button', { name: 'Jump to section 3: The body' })).toHaveAttribute(
      'aria-current',
      'true',
    )
  })

  it('ignores a second scroll while a frame is pending', () => {
    renderRail()
    act(() => {
      Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 500 })
      window.dispatchEvent(new Event('scroll'))
      window.dispatchEvent(new Event('scroll'))
    })
    act(() => frames.flush())
    // One frame ran, not two, and it moved the rail to the last section.
    expect(screen.getByRole('button', { name: 'Jump to section 3: The end' })).toHaveAttribute(
      'aria-current',
      'true',
    )
  })

  it('renders an empty rail without sections', () => {
    renderRail([])
    expect(screen.getByRole('navigation', { name: 'Page section navigation' })).toBeInTheDocument()
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })

  it('stays on nothing when there are no sections to name', () => {
    renderRail([])
    act(() => {
      Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 400 })
      window.dispatchEvent(new Event('scroll'))
    })
    act(() => frames.flush())
    expect(screen.getByRole('navigation', { name: 'Page section navigation' })).toBeInTheDocument()
  })

  it('has no last section to name at the bottom of an empty page', () => {
    renderRail([])
    act(() => {
      Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 2500 })
      window.dispatchEvent(new Event('scroll'))
    })
    act(() => frames.flush())
    expect(screen.getByRole('navigation', { name: 'Page section navigation' })).toBeInTheDocument()
  })

  it('scrolls to a section when its button is clicked', () => {
    const scrollIntoView = vi
      .spyOn(Element.prototype, 'scrollIntoView')
      .mockImplementation(() => {})
    renderRail()
    placeSection('body', 400, 800)
    fireEvent.click(screen.getByRole('button', { name: 'Jump to section 2: The body' }))
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' })
    expect(screen.getByRole('button', { name: 'Jump to section 2: The body' })).toHaveAttribute(
      'aria-current',
      'true',
    )
  })

  it('does nothing when the section is not on the page', () => {
    const scrollIntoView = vi
      .spyOn(Element.prototype, 'scrollIntoView')
      .mockImplementation(() => {})
    renderRail([{ id: 'ghost', label: 'Nowhere' }])
    fireEvent.click(screen.getByRole('button', { name: 'Jump to section 1: Nowhere' }))
    expect(scrollIntoView).not.toHaveBeenCalled()
  })

  it('cancels its pending frame when it goes', () => {
    const { unmount } = renderRail()
    act(() => {
      window.dispatchEvent(new Event('scroll'))
    })
    unmount()
    expect(() => act(() => frames.flush())).not.toThrow()
  })
})

describe('ScrollVelocity', () => {
  let frames: { flush: () => void }
  let restoreScrollY: () => void

  beforeEach(() => {
    frames = stubFrames()
    restoreScrollY = override(window, 'scrollY', 0)
  })

  afterEach(() => {
    restoreScrollY()
    vi.unstubAllGlobals()
  })

  it('renders the items twice so the loop has no seam', () => {
    const { container } = renderWithProviders(<ScrollVelocity items={['one', 'two']} />)
    expect(container.textContent?.match(/one/g)).toHaveLength(2)
  })

  it('separates the items with a bullet', () => {
    const { container } = renderWithProviders(<ScrollVelocity items={['one']} />)
    expect(container.textContent).toContain('•')
  })

  it('takes a custom separator', () => {
    const { container } = renderWithProviders(<ScrollVelocity items={['one']} separator="—" />)
    expect(container.textContent).toContain('—')
  })

  it('hides itself from the accessibility tree', () => {
    const { container } = renderWithProviders(<ScrollVelocity items={['one']} />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('stays still when motion is reduced', () => {
    setMedia('(prefers-reduced-motion: reduce)', true)
    const { container } = renderWithProviders(<ScrollVelocity items={['one']} />)
    act(() => flushIntersections())
    act(() => frames.flush())
    expect(container.querySelector('.marquee-track')).not.toHaveStyle({
      transform: 'translateX(0px)',
    })
    setMedia('(prefers-reduced-motion: reduce)', false)
  })

  it('travels once it is on screen', () => {
    const { container } = renderWithProviders(<ScrollVelocity items={['one']} />)
    const track = container.querySelector('.marquee-track') as HTMLElement
    Object.defineProperty(track, 'scrollWidth', { configurable: true, value: 400 })
    act(() => flushIntersections())
    act(() => frames.flush())
    expect(track.getAttribute('style')).toContain('translateX')
  })

  it('moves the track when the strip has a width', () => {
    const { container } = renderWithProviders(<ScrollVelocity items={['one']} />)
    const track = container.querySelector('.marquee-track') as HTMLElement
    Object.defineProperty(track, 'scrollWidth', { configurable: true, value: 400 })
    act(() => flushIntersections())
    act(() => frames.flush())
    expect(track.getAttribute('style')).toContain('translateX')
  })

  it('stops when it leaves the screen', () => {
    const { container } = renderWithProviders(<ScrollVelocity items={['one']} />)
    act(() => flushIntersections())
    act(() => frames.flush())
    act(() => flushIntersections(undefined, false))
    const before = container.querySelector('.marquee-track')?.getAttribute('style')
    act(() => frames.flush())
    expect(container.querySelector('.marquee-track')?.getAttribute('style')).toBe(before)
  })

  it('does not start twice for the same appearance', () => {
    renderWithProviders(<ScrollVelocity items={['one']} />)
    act(() => flushIntersections())
    act(() => flushIntersections())
    act(() => frames.flush())
    expect(() => act(() => frames.flush())).not.toThrow()
  })

  it('runs without an observer when the browser has none', () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    const { container } = renderWithProviders(<ScrollVelocity items={['one']} />)
    const track = container.querySelector('.marquee-track') as HTMLElement
    Object.defineProperty(track, 'scrollWidth', { configurable: true, value: 400 })
    act(() => frames.flush())
    expect(track.getAttribute('style')).toContain('translateX')
  })

  it('treats a missing scroll position as the top of the page', () => {
    restoreScrollY()
    restoreScrollY = override(window, 'scrollY', undefined)
    const { container } = renderWithProviders(<ScrollVelocity items={['one']} />)
    act(() => flushIntersections())
    act(() => frames.flush())
    expect(container.querySelector('.marquee-track')).toBeInTheDocument()
  })

  it('boosts when the reader scrolls quickly', () => {
    const { container } = renderWithProviders(<ScrollVelocity items={['one']} />)
    const track = container.querySelector('.marquee-track') as HTMLElement
    Object.defineProperty(track, 'scrollWidth', { configurable: true, value: 400 })
    act(() => flushIntersections())
    act(() => {
      Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 300 })
      window.dispatchEvent(new Event('scroll'))
    })
    act(() => frames.flush())
    expect(track.getAttribute('style')).toContain('translateX')
  })

  it('goes quietly when it is removed', () => {
    const { unmount } = renderWithProviders(<ScrollVelocity items={['one']} />)
    unmount()
    expect(() => act(() => frames.flush())).not.toThrow()
  })
})
