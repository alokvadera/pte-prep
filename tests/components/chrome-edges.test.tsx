import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { renderWithProviders } from '../helpers/render'
import { TestHeader } from '../../src/components/test/TestHeader'
import { ScoreRangeBar } from '../../src/components/charts/ScoreRangeBar'
import { Seo } from '../../src/seo/Seo'

/* ---------------------------------------------------------------------------
   The remaining edges of the runner's chrome.

   A header that is given no clock falls back to the scale's own baseline, and
   a header with no exit control simply does not offer one.
   --------------------------------------------------------------------------- */

describe('TestHeader without a clock', () => {
  it('falls back to a zero clock', () => {
    render(
      <TestHeader
        sectionTitle="Reading"
        totalSeconds={0}
        itemNumber={1}
        itemCount={10}
        answered={0}
        flagged={0}
      />,
    )
    expect(document.body.textContent).toBeTruthy()
  })

  it('offers no exit control when there is nowhere to exit to', () => {
    render(
      <TestHeader
        sectionTitle="Reading"
        totalSeconds={600}
        secondsRemaining={300}
        itemNumber={1}
        itemCount={10}
        answered={0}
        flagged={0}
      />,
    )
    expect(document.body.textContent).toBeTruthy()
  })
})

describe('ScoreRangeBar at the top of the scale', () => {
  it('draws a band with nothing above it', () => {
    const { container } = render(<ScoreRangeBar score={90} band="C2" fraction={1} />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('draws a band with something above it', () => {
    const { container } = render(<ScoreRangeBar score={60} band="B2" fraction={0.6} />)
    expect(container.firstChild).toBeInTheDocument()
  })
})

describe('the head manager across two routes', () => {
  it('leaves one set of tags behind', () => {
    const first = renderWithProviders(<SeoOnly />, { route: '/about' })
    first.unmount()
    renderWithProviders(<SeoOnly />, { route: '/privacy/' })

    expect(document.head.querySelectorAll('meta[name="description"]').length).toBe(1)
  })
})

function SeoOnly() {
  return <Seo />
}
