import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderRoute } from '../helpers/render'
import QuestionTypePage from '../../src/pages/QuestionTypePage'
import { QUESTION_META } from '../../src/domain/blueprint'
import { relatedTypes, typeSlug } from '../../src/content/questionTypeDetail'

/* ---------------------------------------------------------------------------
   The question-type spokes.

   The route has to be mounted as a parameterised path (`/question-types/:slug/`)
   or `useParams` resolves to nothing and the page answers with its 404 — which
   is what the type is asked to do, so the test has to mount it the way the
   router does.
   --------------------------------------------------------------------------- */

function renderType(slug: string) {
  return renderRoute(<QuestionTypePage />, '/question-types/:slug/', {
    route: `/question-types/${slug}/`,
  })
}

describe('QuestionTypePage', () => {
  it('renders the type the slug names', () => {
    renderType('read-aloud')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Read Aloud')
  })

  it('lists the traits Pearson rates for a trait-composite type', () => {
    const { container } = renderType('read-aloud')
    expect(container.textContent).toContain('Traits Pearson rates')
    expect(container.textContent).toContain('Pronunciation')
  })

  it('leaves the traits row out for a type with no rated traits', () => {
    const { container } = renderType('highlight-incorrect-words')
    expect(container.textContent).not.toContain('Traits Pearson rates')
  })

  it('explains an integrated item that scores two skills', () => {
    const { container } = renderType('summarize-spoken-text')
    expect(container.textContent).toContain('This is an integrated item')
    expect(container.textContent).toContain('2 different skill scores')
  })

  it('leaves the integrated-item note out for a single-skill type', () => {
    const { container } = renderType('read-aloud')
    expect(container.textContent).not.toContain('This is an integrated item')
  })

  it('links to the related types in the same section', () => {
    renderType('read-aloud')
    const related = relatedTypes('read-aloud')
    expect(related.length).toBeGreaterThan(0)
    for (const r of related) {
      const label = QUESTION_META[r].label
      const link = screen.getByRole('link', { name: new RegExp(`^${label}`) })
      expect(link).toHaveAttribute('href', `/question-types/${typeSlug(r)}/`)
    }
  })

  it('answers the questions a candidate asks about the type', () => {
    const { container } = renderType('read-aloud')
    expect(container.textContent).toContain('How many Read Aloud questions are on the PTE Academic?')
    expect(container.textContent).toContain('How is Read Aloud scored?')
    expect(container.textContent).toContain('What goes wrong most often on Read Aloud?')
  })

  it('links to the practice drill for the type', () => {
    renderType('read-aloud')
    expect(screen.getByRole('link', { name: /Practice Read Aloud/ })).toHaveAttribute(
      'href',
      '/practice?type=read-aloud',
    )
  })
})
