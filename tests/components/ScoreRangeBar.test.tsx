import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { ScoreRangeBar, SkillBars } from '../../src/components/charts/ScoreRangeBar'

/* ---------------------------------------------------------------------------
   The score range bar.

   The bar shows a score as a position on the 10–90 track with the CEFR band
   boundaries drawn on it, and — when there is an attempt behind the score —
   a second rail underneath showing how far the conversion could be wrong.
   That rail is a bound on the mapping, not a probability, and the copy has to
   say so: calling it a confidence interval would claim a distribution the
   deterministic scorer does not have.
   --------------------------------------------------------------------------- */

afterEach(() => {
  cleanup()
})

/** Finds the paragraph that carries the given words. */
function paragraph(needle: string): HTMLElement {
  const match = Array.from(document.querySelectorAll('p')).find((p) =>
    (p.textContent ?? '').includes(needle),
  )
  if (!match) throw new Error(`No paragraph contains "${needle}"`)
  return match
}

describe('ScoreRangeBar', () => {
  it('places the score on the track and names the band', () => {
    render(<ScoreRangeBar score={61} band="B2" />)

    expect(screen.getByRole('img')).toHaveAttribute(
      'aria-label',
      'Score 61 out of 90, CEFR band B2',
    )
    const band = paragraph('B2 runs 59–75')
    expect(band).toHaveTextContent('61 of 90')
    expect(band).toHaveTextContent('14 points short of C1')
  })

  it('uses the singular when one point short', () => {
    render(<ScoreRangeBar score={74} band="B2" />)

    expect(paragraph('short of C1')).toHaveTextContent('1 point short of C1')
  })

  it('draws the sensitivity rail when a fraction is supplied', () => {
    render(<ScoreRangeBar score={61} band="B2" fraction={0.5} />)

    expect(screen.getByRole('img')).toHaveAttribute(
      'aria-label',
      'Score 61 out of 90, CEFR band B2, conversion sensitivity 50 to 61',
    )
    const copy = paragraph('could land between')
    expect(copy).toHaveTextContent('could land between')
    expect(copy).toHaveTextContent('50')
    expect(copy).toHaveTextContent('61')
  })

  it('draws no rail for a degenerate band', () => {
    render(<ScoreRangeBar score={90} band="C2" fraction={1} />)

    expect(screen.getByRole('img')).toHaveAttribute(
      'aria-label',
      'Score 90 out of 90, CEFR band C2',
    )
    expect(screen.queryByText(/could land between/)).not.toBeInTheDocument()
  })

  it('draws no rail when the fraction is unknown', () => {
    render(<ScoreRangeBar score={61} band="B2" />)

    expect(screen.getByRole('img')).not.toHaveAttribute('aria-label', /conversion sensitivity/)
    expect(screen.queryByText(/could land between/)).not.toBeInTheDocument()
  })

  it('never calls the rail a confidence interval', () => {
    render(<ScoreRangeBar score={61} band="B2" fraction={0.5} />)

    const text = document.body.textContent ?? ''
    expect(text).toMatch(/not a confidence interval/i)
    // Strip the one permitted mention; nothing else may use the phrase.
    expect(text.replace(/not a confidence interval/gi, '')).not.toMatch(/confidence interval/i)
  })

  it('clamps a score to the 10–90 scale', () => {
    render(<ScoreRangeBar score={95} band="C2" />)

    expect(screen.getByRole('img')).toHaveAttribute(
      'aria-label',
      'Score 90 out of 90, CEFR band C2',
    )

    cleanup()
    render(<ScoreRangeBar score={2} band="A1" />)

    expect(screen.getByRole('img')).toHaveAttribute(
      'aria-label',
      'Score 10 out of 90, CEFR band A1',
    )
  })

  it('copes with a band it does not know', () => {
    render(<ScoreRangeBar score={61} band="Z9" />)

    expect(screen.getByRole('img')).toHaveAttribute(
      'aria-label',
      'Score 61 out of 90, CEFR band Z9',
    )
    expect(screen.queryByText(/of 90,/)).not.toBeInTheDocument()
  })

  it('says there is nothing above the top band', () => {
    render(<ScoreRangeBar score={90} band="C2" />)

    expect(paragraph('short of the top of the scale')).toHaveTextContent(
      'short of the top of the scale',
    )
  })

  it('accepts a custom label and a smaller size', () => {
    const { container } = render(
      <ScoreRangeBar score={50} band="B1" size="sm" label="Overall score" />,
    )

    expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Overall score')
    expect(container.querySelector('.h-1\\.5')).toBeInTheDocument()
  })

  it('exposes the in-band position to assistive technology', () => {
    render(<ScoreRangeBar score={61} band="B2" />)

    expect(screen.getByText(/per cent of the way through the B2 band/)).toBeInTheDocument()
  })
})

describe('SkillBars', () => {
  it('renders one bar per skill with its value', () => {
    render(
      <SkillBars
        skills={[
          { skill: 'reading', value: 60 },
          { skill: 'listening', value: 45 },
        ]}
      />,
    )

    expect(screen.getByText('reading')).toBeInTheDocument()
    expect(screen.getByText('listening')).toBeInTheDocument()
    expect(screen.getByText('60')).toBeInTheDocument()
    expect(screen.getByText('45')).toBeInTheDocument()
  })

  it('marks the weakest and the strongest skill', () => {
    render(
      <SkillBars
        skills={[
          { skill: 'reading', value: 60 },
          { skill: 'listening', value: 45 },
          { skill: 'speaking', value: 80 },
        ]}
        weakest="listening"
        strongest="speaking"
      />,
    )

    expect(screen.getByText('work on this one')).toBeInTheDocument()
    expect(screen.getByText('strongest')).toBeInTheDocument()
  })

  it('does not call a skill both the weakest and the strongest', () => {
    render(
      <SkillBars
        skills={[{ skill: 'reading', value: 60 }]}
        weakest="reading"
        strongest="reading"
      />,
    )

    expect(screen.getByText('work on this one')).toBeInTheDocument()
    expect(screen.queryByText('strongest')).not.toBeInTheDocument()
  })
})
