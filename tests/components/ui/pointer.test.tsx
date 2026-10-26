import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent } from '@testing-library/react'
import { CursorGlow } from '../../../src/components/ui/cursor-glow'
import { ParallaxVisual } from '../../../src/components/ui/parallax-visual'
import { SpotlightCard } from '../../../src/components/ui/spotlight-card'
import { useMagneticControls } from '../../../src/components/ui/useMagneticControls'
import { setMedia } from '../../setup/browser-env'
import { renderWithProviders } from '../../helpers/render'

/* ---------------------------------------------------------------------------
   The components that answer to the pointer.

   A pool of light that follows the cursor, a card that drifts against it, a
   surface that lights up where it is touched, and the delegated listener that
   pulls every button towards the mouse.

   All four are pointer work, and all four are written so that the browser
   does the painting: the numbers are written to custom properties rather than
   pushed through React state.
   --------------------------------------------------------------------------- */

/** A rAF queue the test drives. */
function stubFrames(stepMs = 16): { flush: () => void; pending: () => number } {
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
    pending: () => queued.length,
  }
}

/**
 * A rAF queue whose cancellations do not remove the callback.
 *
 * The magnetic controls let go of a control by cancelling the frame they had
 * already queued — but the frame still arrives, and the callback has to
 * notice that it has nothing to do.
 */
function stubFramesKeepingCallbacks(stepMs = 16): { flush: () => void } {
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

describe('CursorGlow', () => {
  let frames: { flush: () => void; pending: () => number }

  beforeEach(() => {
    frames = stubFrames()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    setMedia('(prefers-reduced-motion: reduce)', false)
    setMedia('(pointer: coarse)', false)
  })

  function renderGlow() {
    const rendered = renderWithProviders(
      <>
        <CursorGlow />
        <button type="button">A control</button>
      </>,
    )
    return { ...rendered, glow: rendered.container.querySelector('.cursor-glow') as HTMLElement }
  }

  it('hides itself from the accessibility tree', () => {
    const { glow } = renderGlow()
    expect(glow).toHaveAttribute('aria-hidden', 'true')
  })

  it('stays dark when motion is reduced', () => {
    setMedia('(prefers-reduced-motion: reduce)', true)
    const { glow } = renderGlow()
    act(() => {
      window.dispatchEvent(new PointerEvent('pointermove', { clientX: 10, clientY: 10 }))
    })
    act(() => frames.flush())
    expect(glow.style.opacity).toBe('')
  })

  it('stays dark on a touch screen', () => {
    setMedia('(pointer: coarse)', true)
    const { glow } = renderGlow()
    act(() => {
      window.dispatchEvent(new PointerEvent('pointermove', { clientX: 10, clientY: 10 }))
    })
    act(() => frames.flush())
    expect(glow.style.opacity).toBe('')
  })

  it('appears when the pointer arrives', () => {
    const { glow } = renderGlow()
    act(() => {
      window.dispatchEvent(new PointerEvent('pointermove', { clientX: 100, clientY: 120 }))
    })
    expect(glow.style.opacity).toBe('1')
  })

  it('sits under the pointer once it has moved there', () => {
    const { glow } = renderGlow()
    act(() => {
      window.dispatchEvent(new PointerEvent('pointermove', { clientX: 100, clientY: 120 }))
    })
    act(() => frames.flush())
    expect(glow.style.transform).toBe('translate3d(100px, 120px, 0) scale(1)')
  })

  it('glides towards a pointer that has moved on', () => {
    const { glow } = renderGlow()
    act(() => {
      window.dispatchEvent(new PointerEvent('pointermove', { clientX: 100, clientY: 120 }))
    })
    act(() => frames.flush())
    act(() => {
      window.dispatchEvent(new PointerEvent('pointermove', { clientX: 400, clientY: 120 }))
    })
    act(() => frames.flush())
    // The glow has not teleported: it has taken a sixteenth of the way.
    expect(glow.style.transform).toContain('translate3d(142px')
  })

  it('stops asking for frames once it has settled', () => {
    const { glow: _glow } = renderGlow()
    act(() => {
      window.dispatchEvent(new PointerEvent('pointermove', { clientX: 100, clientY: 120 }))
    })
    act(() => frames.flush())
    expect(frames.pending()).toBe(0)
  })

  it('swells over a control', () => {
    const { glow } = renderGlow()
    const control = document.querySelector('button') as HTMLElement
    act(() => {
      control.dispatchEvent(
        new PointerEvent('pointermove', { clientX: 100, clientY: 120, bubbles: true }),
      )
    })
    act(() => frames.flush())
    // The scale chases 1.35 and takes a sixth of the way each frame.
    expect(glow.style.transform).toContain('scale(1.056)')
    act(() => frames.flush())
    expect(glow.style.transform).toContain('scale(1.103)')
  })

  it('stays at its resting size over plain ground', () => {
    const { glow } = renderGlow()
    act(() => {
      document.body.dispatchEvent(
        new PointerEvent('pointermove', { clientX: 100, clientY: 120, bubbles: true }),
      )
    })
    act(() => frames.flush())
    expect(glow.style.transform).toContain('scale(1)')
  })

  it('compresses while the pointer is held down', () => {
    const { glow } = renderGlow()
    act(() => {
      window.dispatchEvent(new PointerEvent('pointermove', { clientX: 100, clientY: 120 }))
    })
    act(() => frames.flush())
    act(() => {
      window.dispatchEvent(new PointerEvent('pointerdown', { clientX: 100, clientY: 120 }))
    })
    act(() => frames.flush())
    const scale = Number.parseFloat(glow.style.transform.match(/scale\(([\d.]+)\)/)?.[1] ?? '1')
    expect(scale).toBeLessThan(1)
  })

  it('swells back when the pointer is released', () => {
    const { glow } = renderGlow()
    act(() => {
      window.dispatchEvent(new PointerEvent('pointermove', { clientX: 100, clientY: 120 }))
    })
    act(() => frames.flush())
    act(() => {
      window.dispatchEvent(new PointerEvent('pointerdown', { clientX: 100, clientY: 120 }))
    })
    act(() => frames.flush())
    act(() => {
      window.dispatchEvent(new PointerEvent('pointerup', { clientX: 100, clientY: 120 }))
    })
    for (let i = 0; i < 40; i++) act(() => frames.flush())
    expect(glow.style.transform).toContain('scale(1)')
  })

  it('fades out when the pointer leaves the page', () => {
    const { glow } = renderGlow()
    act(() => {
      window.dispatchEvent(new PointerEvent('pointermove', { clientX: 100, clientY: 120 }))
    })
    expect(glow.style.opacity).toBe('1')
    act(() => {
      document.documentElement.dispatchEvent(new Event('pointerleave'))
    })
    expect(glow.style.opacity).toBe('0')
  })

  it('fades out when the window loses focus', () => {
    const { glow } = renderGlow()
    act(() => {
      window.dispatchEvent(new PointerEvent('pointermove', { clientX: 100, clientY: 120 }))
    })
    expect(glow.style.opacity).toBe('1')
    act(() => {
      window.dispatchEvent(new Event('blur'))
    })
    expect(glow.style.opacity).toBe('0')
  })

  it('goes quietly when it is removed', () => {
    const { unmount } = renderGlow()
    unmount()
    expect(() => act(() => frames.flush())).not.toThrow()
  })
})

describe('ParallaxVisual', () => {
  let frames: { flush: () => void; pending: () => number }

  beforeEach(() => {
    frames = stubFrames()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    setMedia('(prefers-reduced-motion: reduce)', false)
    setMedia('(pointer: coarse)', false)
  })

  function renderVisual(depth = 10) {
    const rendered = renderWithProviders(
      <ParallaxVisual depth={depth}>
        <span>Card</span>
      </ParallaxVisual>,
    )
    const element = rendered.container.firstChild as HTMLElement
    element.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 100 }) as DOMRect
    return { ...rendered, element }
  }

  it('renders its children', () => {
    renderWithProviders(
      <ParallaxVisual>
        <span>Card</span>
      </ParallaxVisual>,
    )
    expect(document.body.textContent).toContain('Card')
  })

  it('stays still when motion is reduced', () => {
    setMedia('(prefers-reduced-motion: reduce)', true)
    const { element } = renderVisual()
    act(() => {
      element.dispatchEvent(new PointerEvent('pointermove', { clientX: 300, clientY: 50 }))
    })
    act(() => frames.flush())
    expect(element.style.transform).toBe('')
  })

  it('stays still on a touch screen', () => {
    setMedia('(pointer: coarse)', true)
    const { element } = renderVisual()
    act(() => {
      element.dispatchEvent(new PointerEvent('pointermove', { clientX: 300, clientY: 50 }))
    })
    act(() => frames.flush())
    expect(element.style.transform).toBe('')
  })

  it('drifts towards the pointer', () => {
    const { element } = renderVisual()
    act(() => {
      element.dispatchEvent(new PointerEvent('pointermove', { clientX: 300, clientY: 50 }))
    })
    act(() => frames.flush())
    // A sixth of the way towards the target on the first frame.
    expect(element.style.transform).toBe('translate3d(0.60px, 0.00px, 0)')
  })

  it('asks for only one frame for two moves', () => {
    const { element } = renderVisual()
    act(() => {
      element.dispatchEvent(new PointerEvent('pointermove', { clientX: 300, clientY: 50 }))
      element.dispatchEvent(new PointerEvent('pointermove', { clientX: 300, clientY: 50 }))
    })
    act(() => frames.flush())
    expect(element.style.transform).toBe('translate3d(0.60px, 0.00px, 0)')
  })

  it('settles at the pointer edge', () => {
    const { element } = renderVisual()
    act(() => {
      element.dispatchEvent(new PointerEvent('pointermove', { clientX: 300, clientY: 50 }))
    })
    for (let i = 0; i < 200; i++) act(() => frames.flush())
    expect(element.style.transform).toBe('translate3d(10.00px, 0.00px, 0)')
  })

  it('leaves no transform behind at the centre', () => {
    const { element } = renderVisual()
    act(() => {
      element.dispatchEvent(new PointerEvent('pointermove', { clientX: 100, clientY: 50 }))
    })
    for (let i = 0; i < 200; i++) act(() => frames.flush())
    expect(element.style.transform).toBe('')
  })

  it('returns to rest when the pointer leaves', () => {
    const { element } = renderVisual()
    act(() => {
      element.dispatchEvent(new PointerEvent('pointermove', { clientX: 300, clientY: 50 }))
    })
    for (let i = 0; i < 200; i++) act(() => frames.flush())
    expect(element.style.transform).not.toBe('')
    act(() => {
      element.dispatchEvent(new Event('pointerleave'))
    })
    for (let i = 0; i < 200; i++) act(() => frames.flush())
    expect(element.style.transform).toBe('')
  })

  it('goes quietly when it is removed', () => {
    const { element, unmount } = renderVisual()
    act(() => {
      element.dispatchEvent(new PointerEvent('pointermove', { clientX: 300, clientY: 50 }))
    })
    unmount()
    expect(() => act(() => frames.flush())).not.toThrow()
  })
})

describe('SpotlightCard', () => {
  it('renders its children', () => {
    renderWithProviders(
      <SpotlightCard>
        <span>Card</span>
      </SpotlightCard>,
    )
    expect(document.body.textContent).toContain('Card')
  })

  it('lights up when the pointer enters', () => {
    const { container } = renderWithProviders(
      <SpotlightCard>
        <span>Card</span>
      </SpotlightCard>,
    )
    const card = container.firstChild as HTMLElement
    expect(card.querySelector('.spotlight-glow')).not.toHaveClass('spotlight-glow-on')
    act(() => {
      fireEvent.pointerEnter(card)
    })
    expect(card.querySelector('.spotlight-glow')).toHaveClass('spotlight-glow-on')
  })

  it('goes dark when the pointer leaves', () => {
    const { container } = renderWithProviders(
      <SpotlightCard>
        <span>Card</span>
      </SpotlightCard>,
    )
    const card = container.firstChild as HTMLElement
    act(() => {
      fireEvent.pointerEnter(card)
    })
    expect(card.querySelector('.spotlight-glow')).toHaveClass('spotlight-glow-on')
    act(() => {
      fireEvent.pointerLeave(card)
    })
    expect(card.querySelector('.spotlight-glow')).not.toHaveClass('spotlight-glow-on')
  })

  it('writes the pointer position to custom properties', () => {
    const { container } = renderWithProviders(
      <SpotlightCard>
        <span>Card</span>
      </SpotlightCard>,
    )
    const card = container.firstChild as HTMLElement
    card.getBoundingClientRect = () => ({ left: 10, top: 20, width: 200, height: 100 }) as DOMRect
    act(() => {
      card.dispatchEvent(
        new PointerEvent('pointermove', { clientX: 45, clientY: 60, bubbles: true }),
      )
    })
    expect(card.style.getPropertyValue('--sp-x')).toBe('35px')
    expect(card.style.getPropertyValue('--sp-y')).toBe('40px')
  })

  it('passes its other props through', () => {
    const { container } = renderWithProviders(
      <SpotlightCard className="rounded-xl" id="spotlight">
        <span>Card</span>
      </SpotlightCard>,
    )
    const card = container.firstChild as HTMLElement
    expect(card).toHaveClass('rounded-xl')
    expect(card).toHaveAttribute('id', 'spotlight')
  })
})

describe('useMagneticControls', () => {
  let frames: { flush: () => void }

  beforeEach(() => {
    // The delegated listener cancels a frame it has already scheduled when it
    // lets go of a control. The frame is left in the queue here so the test
    // can watch it arrive after the let-go.
    frames = stubFramesKeepingCallbacks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    setMedia('(prefers-reduced-motion: reduce)', false)
    setMedia('(hover: hover) and (pointer: fine)', true)
  })

  function Harness({ children }: { children: React.ReactNode }) {
    useMagneticControls()
    return <>{children}</>
  }

  function renderHarness(children: React.ReactNode) {
    return renderWithProviders(<Harness>{children}</Harness>)
  }

  const mouse = (x: number, y: number) =>
    new PointerEvent('pointermove', { pointerType: 'mouse', clientX: x, clientY: y, bubbles: true })

  it('pulls a primary button towards the pointer', () => {
    const { container } = renderHarness(
      <button type="button" className="btn-primary">
        Press
      </button>,
    )
    const button = container.querySelector('button') as HTMLElement
    button.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 40 }) as DOMRect
    act(() => {
      button.dispatchEvent(mouse(80, 20))
    })
    act(() => frames.flush())
    // The travel is capped at eight pixels either way.
    expect(button.style.getPropertyValue('--control-x')).toBe('5.4px')
    expect(button.style.getPropertyValue('--control-y')).toBe('0.0px')
    expect(button.classList.contains('magnetic-control')).toBe(true)
  })

  it('caps the travel on the vertical axis too', () => {
    const { container } = renderHarness(
      <button type="button" className="btn-secondary">
        Press
      </button>,
    )
    const button = container.querySelector('button') as HTMLElement
    button.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 40 }) as DOMRect
    act(() => {
      button.dispatchEvent(mouse(50, 200))
    })
    act(() => frames.flush())
    expect(button.style.getPropertyValue('--control-y')).toBe('6.0px')
  })

  it('pulls the other button families too', () => {
    const { container } = renderHarness(
      <>
        <button type="button" className="btn-orange">
          Orange
        </button>
        <button type="button" className="btn-ghost">
          Ghost
        </button>
        <button type="button" className="btn-danger">
          Danger
        </button>
      </>,
    )
    const buttons = [...container.querySelectorAll('button')]
    for (const button of buttons) {
      button.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 40 }) as DOMRect
    }
    act(() => {
      buttons[0]!.dispatchEvent(mouse(80, 20))
    })
    act(() => frames.flush())
    expect(buttons[0]!.style.getPropertyValue('--control-x')).toBe('5.4px')

    act(() => {
      buttons[1]!.dispatchEvent(mouse(80, 20))
    })
    act(() => frames.flush())
    expect(buttons[1]!.style.getPropertyValue('--control-x')).toBe('5.4px')

    act(() => {
      buttons[2]!.dispatchEvent(mouse(80, 20))
    })
    act(() => frames.flush())
    expect(buttons[2]!.style.getPropertyValue('--control-x')).toBe('5.4px')
  })

  it('ignores a pointer that is not a mouse', () => {
    const { container } = renderHarness(
      <button type="button" className="btn-primary">
        Press
      </button>,
    )
    const button = container.querySelector('button') as HTMLElement
    button.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 40 }) as DOMRect
    act(() => {
      button.dispatchEvent(
        new PointerEvent('pointermove', {
          pointerType: 'touch',
          clientX: 80,
          clientY: 20,
          bubbles: true,
        }),
      )
    })
    act(() => frames.flush())
    expect(button.style.getPropertyValue('--control-x')).toBe('')
  })

  it('ignores the pointer when motion is reduced', () => {
    setMedia('(prefers-reduced-motion: reduce)', true)
    const { container } = renderHarness(
      <button type="button" className="btn-primary">
        Press
      </button>,
    )
    const button = container.querySelector('button') as HTMLElement
    button.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 40 }) as DOMRect
    act(() => {
      button.dispatchEvent(mouse(80, 20))
    })
    act(() => frames.flush())
    expect(button.style.getPropertyValue('--control-x')).toBe('')
  })

  it('ignores the pointer when there is no fine pointer', () => {
    setMedia('(hover: hover) and (pointer: fine)', false)
    const { container } = renderHarness(
      <button type="button" className="btn-primary">
        Press
      </button>,
    )
    const button = container.querySelector('button') as HTMLElement
    button.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 40 }) as DOMRect
    act(() => {
      button.dispatchEvent(mouse(80, 20))
    })
    act(() => frames.flush())
    expect(button.style.getPropertyValue('--control-x')).toBe('')
  })

  it('ignores a control that is not one of the button families', () => {
    const { container } = renderHarness(
      <button type="button" className="btn-quiet">
        Press
      </button>,
    )
    const button = container.querySelector('button') as HTMLElement
    button.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 40 }) as DOMRect
    act(() => {
      button.dispatchEvent(mouse(80, 20))
    })
    act(() => frames.flush())
    expect(button.style.getPropertyValue('--control-x')).toBe('')
  })

  it('ignores a disabled control', () => {
    const { container } = renderHarness(
      <button type="button" className="btn-primary" disabled>
        Press
      </button>,
    )
    const button = container.querySelector('button') as HTMLElement
    button.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 40 }) as DOMRect
    act(() => {
      button.dispatchEvent(mouse(80, 20))
    })
    act(() => frames.flush())
    expect(button.style.getPropertyValue('--control-x')).toBe('')
  })

  it('ignores a control marked aria-disabled', () => {
    const { container } = renderHarness(
      <button type="button" className="btn-primary" aria-disabled="true">
        Press
      </button>,
    )
    const button = container.querySelector('button') as HTMLElement
    button.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 40 }) as DOMRect
    act(() => {
      button.dispatchEvent(mouse(80, 20))
    })
    act(() => frames.flush())
    expect(button.style.getPropertyValue('--control-x')).toBe('')
  })

  it('leaves a control that already owns its motion alone', () => {
    const { container } = renderHarness(
      <div className="magnetic">
        <button type="button" className="btn-primary">
          Press
        </button>
      </div>,
    )
    const button = container.querySelector('button') as HTMLElement
    button.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 40 }) as DOMRect
    act(() => {
      button.dispatchEvent(mouse(80, 20))
    })
    act(() => frames.flush())
    expect(button.style.getPropertyValue('--control-x')).toBe('')
  })

  it('leaves a control marked no-magnetic alone', () => {
    const { container } = renderHarness(
      <div data-no-magnetic="true">
        <button type="button" className="btn-primary">
          Press
        </button>
      </div>,
    )
    const button = container.querySelector('button') as HTMLElement
    button.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 40 }) as DOMRect
    act(() => {
      button.dispatchEvent(mouse(80, 20))
    })
    act(() => frames.flush())
    expect(button.style.getPropertyValue('--control-x')).toBe('')
  })

  it('leaves the test route alone', () => {
    const { container } = renderHarness(
      <div className="test-route">
        <button type="button" className="btn-primary">
          Press
        </button>
      </div>,
    )
    const button = container.querySelector('button') as HTMLElement
    button.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 40 }) as DOMRect
    act(() => {
      button.dispatchEvent(mouse(80, 20))
    })
    act(() => frames.flush())
    expect(button.style.getPropertyValue('--control-x')).toBe('')
  })

  it('ignores a pointer over something that is not an element', () => {
    renderHarness(
      <button type="button" className="btn-primary">
        Press
      </button>,
    )
    act(() => {
      window.dispatchEvent(
        new PointerEvent('pointermove', { pointerType: 'mouse', clientX: 80, clientY: 20 }),
      )
    })
    act(() => frames.flush())
    expect(document.querySelector('button')?.style.getPropertyValue('--control-x')).toBe('')
  })

  it('skips a control with no size', () => {
    const { container } = renderHarness(
      <button type="button" className="btn-primary">
        Press
      </button>,
    )
    const button = container.querySelector('button') as HTMLElement
    button.getBoundingClientRect = () => ({ left: 0, top: 0, width: 0, height: 0 }) as DOMRect
    act(() => {
      button.dispatchEvent(mouse(80, 20))
    })
    act(() => frames.flush())
    expect(button.style.getPropertyValue('--control-x')).toBe('')
  })

  it('lets go when the pointer leaves the control', () => {
    const { container } = renderHarness(
      <button type="button" className="btn-primary">
        Press
      </button>,
    )
    const button = container.querySelector('button') as HTMLElement
    button.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 40 }) as DOMRect
    act(() => {
      button.dispatchEvent(mouse(80, 20))
    })
    act(() => frames.flush())
    expect(button.style.getPropertyValue('--control-x')).toBe('5.4px')

    act(() => {
      button.dispatchEvent(
        new PointerEvent('pointerout', {
          pointerType: 'mouse',
          relatedTarget: document.body,
          bubbles: true,
        }),
      )
    })
    expect(button.style.getPropertyValue('--control-x')).toBe('0px')
  })

  it('holds on while the pointer is still over the control', () => {
    const { container } = renderHarness(
      <button type="button" className="btn-primary">
        Press
      </button>,
    )
    const button = container.querySelector('button') as HTMLElement
    button.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 40 }) as DOMRect
    act(() => {
      button.dispatchEvent(mouse(80, 20))
    })
    act(() => frames.flush())
    act(() => {
      button.dispatchEvent(
        new PointerEvent('pointerout', {
          pointerType: 'mouse',
          relatedTarget: button,
          bubbles: true,
        }),
      )
    })
    expect(button.style.getPropertyValue('--control-x')).toBe('5.4px')
  })

  it('lets go when motion is turned on mid-gesture', () => {
    const { container } = renderHarness(
      <button type="button" className="btn-primary">
        Press
      </button>,
    )
    const button = container.querySelector('button') as HTMLElement
    button.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 40 }) as DOMRect
    act(() => {
      button.dispatchEvent(mouse(80, 20))
    })
    act(() => frames.flush())
    expect(button.style.getPropertyValue('--control-x')).toBe('5.4px')
    act(() => {
      setMedia('(prefers-reduced-motion: reduce)', true)
    })
    expect(button.style.getPropertyValue('--control-x')).toBe('0px')
  })

  it('lets go when the pointer stops being fine', () => {
    const { container } = renderHarness(
      <button type="button" className="btn-primary">
        Press
      </button>,
    )
    const button = container.querySelector('button') as HTMLElement
    button.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 40 }) as DOMRect
    act(() => {
      button.dispatchEvent(mouse(80, 20))
    })
    act(() => frames.flush())
    act(() => {
      setMedia('(hover: hover) and (pointer: fine)', false)
    })
    expect(button.style.getPropertyValue('--control-x')).toBe('0px')
  })

  it('asks for only one frame for two moves over the same control', () => {
    const { container } = renderHarness(
      <button type="button" className="btn-primary">
        Press
      </button>,
    )
    const button = container.querySelector('button') as HTMLElement
    button.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 40 }) as DOMRect
    act(() => {
      button.dispatchEvent(mouse(80, 20))
      button.dispatchEvent(mouse(80, 20))
    })
    act(() => frames.flush())
    expect(button.style.getPropertyValue('--control-x')).toBe('5.4px')
  })

  it('does nothing with a frame that arrives after the control was let go', () => {
    const { container } = renderHarness(
      <>
        <button type="button" className="btn-primary">
          Press
        </button>
        <span>Elsewhere</span>
      </>,
    )
    const button = container.querySelector('button') as HTMLElement
    button.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 40 }) as DOMRect
    act(() => {
      button.dispatchEvent(mouse(80, 20))
    })
    act(() => {
      document.body.dispatchEvent(mouse(10, 10))
    })
    act(() => frames.flush())
    expect(button.style.getPropertyValue('--control-x')).toBe('0px')
  })

  it('goes quietly when it is removed', () => {
    const { unmount } = renderHarness(
      <button type="button" className="btn-primary">
        Press
      </button>,
    )
    unmount()
    expect(() => act(() => frames.flush())).not.toThrow()
  })
})
