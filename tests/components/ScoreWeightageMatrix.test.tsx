import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../helpers/render'
import { ScoreWeightageMatrix } from '../../src/components/ScoreWeightageMatrix'

/* ---------------------------------------------------------------------------
   The weightage matrix.

   Twenty-two cards, one per question type, each carrying the points it is
   estimated to donate and the skills it feeds. The filters are the point of
   the component: a candidate who needs Writing points should be able to see
   only the tasks that give them any.
   --------------------------------------------------------------------------- */

const ALL_TYPES = [
  'Write From Dictation',
  'Repeat Sentence',
  'Read Aloud',
  'Reading & Writing: Fill in the Blanks',
  'Describe Image',
  'Reading: Fill in the Blanks',
  'Summarize Spoken Text',
  'Write Essay',
  'Re-tell Lecture',
  'Summarize Written Text',
  'Listening: Fill in the Blanks',
  'Highlight Incorrect Words',
  'Re-order Paragraphs',
  'Summarize Group Discussion',
  'Respond to a Situation',
  'Multiple Choice, Single Answer (Reading)',
  'Multiple Choice, Multiple Answers (Reading)',
  'Multiple Choice, Single Answer (Listening)',
  'Multiple Choice, Multiple Answers (Listening)',
  'Highlight Correct Summary',
  'Select Missing Word',
  'Answer Short Question',
]

function renderMatrix() {
  return renderWithProviders(<ScoreWeightageMatrix />)
}

function cardNames(): string[] {
  // The card title is the only heading that links to the type's detail page.
  return Array.from(document.querySelectorAll('h3 a[href^="/question-types/"]')).map(
    (a) => a.textContent?.trim() ?? '',
  )
}

afterEach(() => {
  cleanup()
})

describe('ScoreWeightageMatrix', () => {
  it('renders the matrix of question types and their weights', () => {
    const { container } = renderMatrix()

    expect(
      screen.getByRole('heading', { name: 'Score weightage & contributor matrix' }),
    ).toBeInTheDocument()
    expect(container.textContent).toContain('Showing 22 of 22 question types')

    for (const name of ALL_TYPES) {
      expect(screen.getByRole('link', { name })).toBeInTheDocument()
    }
    expect(cardNames()).toHaveLength(22)
  })

  it('shows the estimated points each task donates', () => {
    renderMatrix()

    const wfd = screen.getByRole('link', { name: 'Write From Dictation' }).closest('h3')!
    const card = wfd.parentElement?.parentElement?.parentElement as HTMLElement
    expect(card).toHaveTextContent('Estimated point impact')
    expect(card).toHaveTextContent('25–28 pts (Writing + Listening)')
    expect(card).toHaveTextContent('Cross-skill contributor')
    expect(card).toHaveTextContent('Massive Writing donor')
    expect(card).toHaveTextContent('Target duration: 1–1.5 min per audio')
  })

  it('labels each task with its tier and the skills it feeds', () => {
    renderMatrix()

    expect(screen.getAllByText('Tier 1, Critical')).toHaveLength(6)
    expect(screen.getAllByText('Tier 2, Core')).toHaveLength(9)
    expect(screen.getAllByText('Tier 3, Low yield')).toHaveLength(7)
    expect(screen.getAllByText('listening + writing').length).toBeGreaterThan(0)
    expect(screen.getByText('speaking + reading')).toBeInTheDocument()
  })

  it('highlights the tasks that feed a chosen skill', async () => {
    const user = userEvent.setup()
    const { container } = renderMatrix()

    await user.click(screen.getByRole('button', { name: 'writing' }))

    expect(container.textContent).toContain('Showing 6 of 22 question types')
    expect(
      screen.getByText('Highlighted: all tasks that provide marks toward writing'),
    ).toBeInTheDocument()

    // Only the tasks that feed Writing survive the filter.
    const names = cardNames()
    expect(names).toContain('Write From Dictation')
    expect(names).toContain('Write Essay')
    expect(names).toContain('Summarize Written Text')
    expect(names).not.toContain('Describe Image')
    expect(names).not.toContain('Repeat Sentence')
    expect(names).toHaveLength(6)
  })

  it('filters by tier', async () => {
    const user = userEvent.setup()
    const { container } = renderMatrix()

    await user.click(screen.getByRole('button', { name: 'Tier 1 (Critical)' }))

    expect(container.textContent).toContain('Showing 6 of 22 question types')
    expect(cardNames()).toContain('Write From Dictation')
    expect(cardNames()).not.toContain('Select Missing Word')
  })

  it('combines the skill and the tier filters', async () => {
    const user = userEvent.setup()
    const { container } = renderMatrix()

    await user.click(screen.getByRole('button', { name: 'writing' }))
    await user.click(screen.getByRole('button', { name: 'Tier 1 (Critical)' }))

    expect(container.textContent).toContain('Showing 2 of 22 question types')
    const names = cardNames()
    expect(names).toContain('Write From Dictation')
    expect(names).toContain('Reading & Writing: Fill in the Blanks')
    expect(names).not.toContain('Write Essay')
  })

  it('switches the strategy plan with the target score', async () => {
    const user = userEvent.setup()
    renderMatrix()

    expect(screen.getByText('Full PTE Score Architecture')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Target 65 (Proficient)' }))

    expect(screen.getByText('Target 65 (Proficient English / CEFR B2-C1)')).toBeInTheDocument()
    expect(screen.getByText(/60% Tier 1, 35% Tier 2, 5% Tier 3/)).toBeInTheDocument()
    expect(screen.getByText('Write From Dictation (90%+)')).toBeInTheDocument()
    expect(screen.queryByText('Full PTE Score Architecture')).not.toBeInTheDocument()
  })

  it('warns that the point values are estimates, not published weights', () => {
    renderMatrix()

    const callout = screen
      .getByText('Estimates, not official weights')
      .closest('div') as HTMLElement
    expect(
      within(callout).getByText(/Pearson does not publish official per-item point values/i),
    ).toBeInTheDocument()
  })

  it('links every task to its detail page and to practice', () => {
    renderMatrix()

    expect(screen.getByRole('link', { name: 'Write From Dictation' })).toHaveAttribute(
      'href',
      '/question-types/write-from-dictation/',
    )
    expect(screen.getAllByRole('link', { name: 'Practice now' })[0]).toHaveAttribute(
      'href',
      '/practice?type=write-from-dictation',
    )
  })
})
