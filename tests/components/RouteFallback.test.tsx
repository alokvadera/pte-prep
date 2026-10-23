import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { RouteFallback } from '../../src/components/RouteFallback'

/* ---------------------------------------------------------------------------
   The Suspense fallback for the two lazily loaded routes.

   It exists so the candidate never sees a blank white screen at the exact
   moment they press Start. The shape mirrors the test shell — a status bar, a
   column of content, an action bar — so the transition into the real view is
   a fill rather than a swap, and it announces itself so a screen-reader user
   is told what is happening.
   --------------------------------------------------------------------------- */

afterEach(() => {
  cleanup()
})

describe('RouteFallback', () => {
  it('renders the skeleton blocks of the test shell', () => {
    const { container } = render(<RouteFallback />)

    // A status bar (3), a question column (6), a second block (4) and an
    // action bar (2).
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(15)
    expect(container.querySelector('.site-header-row')).toBeInTheDocument()
    expect(container.querySelector('table')).toBeNull()
  })

  it('announces itself to assistive technology', () => {
    render(<RouteFallback />)

    const status = screen.getByRole('status')
    expect(status).toHaveTextContent('Loading the test')
  })

  it('keeps the decorative skeleton out of the accessibility tree', () => {
    const { container } = render(<RouteFallback />)

    const skeleton = container.firstElementChild?.firstElementChild
    expect(skeleton).toHaveAttribute('aria-hidden', 'true')
  })
})
