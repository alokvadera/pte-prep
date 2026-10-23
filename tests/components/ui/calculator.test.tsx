import { describe, expect, it } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { ScoreCalculator } from '../../../src/components/ui/score-calculator'
import { renderWithProviders } from '../../helpers/render'

/* ---------------------------------------------------------------------------
   The "what do I need" widget.

   Four skill sliders and a target, with the estimated overall and the single
   skill that is furthest from the target. The arithmetic is a straight mean of
   the four skills — an approximation of Pearson's weighting, which the widget
   says on its face.

   The interesting part is the advice: the same widget answers differently
   depending on whether the target is already met, is a few points away, or
   is a long climb.
   --------------------------------------------------------------------------- */

function setSkill(label: string, value: number): void {
  fireEvent.change(screen.getByLabelText(label), { target: { value: String(value) } })
}

describe('ScoreCalculator', () => {
  it('estimates the overall as the mean of the four skills', () => {
    renderWithProviders(<ScoreCalculator />)
    expect(screen.getByRole('progressbar', { name: 'Estimated overall' })).toHaveAttribute('aria-valuenow', '58')
  })

  it('starts with every skill on the same mark', () => {
    renderWithProviders(<ScoreCalculator />)
    expect(screen.getByLabelText('Speaking')).toHaveValue('58')
    expect(screen.getByLabelText('Writing')).toHaveValue('58')
    expect(screen.getByLabelText('Reading')).toHaveValue('58')
    expect(screen.getByLabelText('Listening')).toHaveValue('58')
  })

  it('starts on a target of 65', () => {
    renderWithProviders(<ScoreCalculator />)
    expect(screen.getByLabelText('Target score')).toHaveValue('65')
  })

  it('names the gap to the target', () => {
    renderWithProviders(<ScoreCalculator />)
    expect(screen.getByText('−7')).toBeInTheDocument()
  })

  it('calls a long climb a long climb', () => {
    renderWithProviders(<ScoreCalculator />)
    expect(screen.getByText('A longer climb')).toBeInTheDocument()
  })

  it('moves the estimate when a skill moves', () => {
    renderWithProviders(<ScoreCalculator />)
    setSkill('Speaking', 70)
    // 70 + 58 + 58 + 58 = 244, over four skills, is 61.
    expect(screen.getByRole('progressbar', { name: 'Estimated overall' })).toHaveAttribute('aria-valuenow', '61')
  })

  it('calls a gap of four points within reach', () => {
    renderWithProviders(<ScoreCalculator />)
    setSkill('Speaking', 61)
    setSkill('Writing', 61)
    setSkill('Reading', 61)
    setSkill('Listening', 61)
    expect(screen.getByText('Within reach')).toBeInTheDocument()
  })

  it('says how many points the weakest skill needs', () => {
    renderWithProviders(<ScoreCalculator />)
    setSkill('Speaking', 61)
    setSkill('Writing', 61)
    setSkill('Reading', 61)
    setSkill('Listening', 61)
    // 4 x 65 - (61 x 3) = 77 points on the weakest skill.
    expect(screen.getByText(/gaining 16 points on Speaking/)).toBeInTheDocument()
  })

  it('says the target has been met once it has', () => {
    renderWithProviders(<ScoreCalculator />)
    setSkill('Speaking', 70)
    setSkill('Writing', 70)
    setSkill('Reading', 70)
    setSkill('Listening', 70)
    expect(screen.getByText('Target met')).toBeInTheDocument()
  })

  it('reports the surplus when the target has been met', () => {
    renderWithProviders(<ScoreCalculator />)
    setSkill('Speaking', 70)
    setSkill('Writing', 70)
    setSkill('Reading', 70)
    setSkill('Listening', 70)
    expect(screen.getByText('+5')).toBeInTheDocument()
  })

  it('names the weakest skill to focus on', () => {
    renderWithProviders(<ScoreCalculator />)
    setSkill('Writing', 40)
    const focus = screen.getByText('Focus first').parentElement as HTMLElement
    expect(focus.textContent).toContain('Writing')
    expect(focus.textContent).toContain('40/90')
  })

  it('falls back to an average when one skill cannot carry the target alone', () => {
    renderWithProviders(<ScoreCalculator />)
    // Four skills on 88 leave a gap of two, but the weakest skill would need
    // 96 points to reach a target of 90 — more than a skill can hold.
    setSkill('Speaking', 88)
    setSkill('Writing', 88)
    setSkill('Reading', 88)
    setSkill('Listening', 88)
    fireEvent.change(screen.getByLabelText('Target score'), { target: { value: '90' } })
    expect(screen.getByText('Within reach')).toBeInTheDocument()
    expect(screen.getByText(/an average of 2 points across each skill/)).toBeInTheDocument()
  })

  it('moves the target', () => {
    renderWithProviders(<ScoreCalculator />)
    fireEvent.change(screen.getByLabelText('Target score'), { target: { value: '55' } })
    expect(screen.getByText('Target met')).toBeInTheDocument()
    expect(screen.getByText('+3')).toBeInTheDocument()
  })

  it('shows the eyebrow by default', () => {
    renderWithProviders(<ScoreCalculator />)
    expect(screen.getByText('What-if')).toBeInTheDocument()
  })

  it('hides the eyebrow on request', () => {
    renderWithProviders(<ScoreCalculator hideEyebrow />)
    expect(screen.queryByText('What-if')).not.toBeInTheDocument()
  })

  it('says plainly that the estimate is only an estimate', () => {
    renderWithProviders(<ScoreCalculator />)
    expect(screen.getByText(/Estimate only\./)).toBeInTheDocument()
  })

  it('takes a class name', () => {
    const { container } = renderWithProviders(<ScoreCalculator className="mt-8" />)
    expect(container.querySelector('.card-solid')).toHaveClass('mt-8')
  })
})
