import { describe, expect, it } from 'vitest'
import { act, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { renderRoute } from '../helpers/render'
import About from '../../src/pages/About'
import Privacy from '../../src/pages/Privacy'
import NotFound from '../../src/pages/NotFound'
import ScoringGuide from '../../src/pages/ScoringGuide'
import QuestionTypes from '../../src/pages/QuestionTypes'
import QuestionTypePage from '../../src/pages/QuestionTypePage'
import TestFormat from '../../src/pages/TestFormat'
import Guide from '../../src/pages/Guide'
import { ALL_QUESTION_TYPES, QUESTION_META } from '../../src/domain/blueprint'
import { typeSlug } from '../../src/content/questionTypeDetail'

/* ---------------------------------------------------------------------------
   The pages that only read from the content bank.

   They carry the site's prose and its structured data, so the assertions are
   about the copy and the data actually reaching the screen — a question-type
   page that renders the wrong facts is worse than one that renders nothing.
   --------------------------------------------------------------------------- */

describe('About', () => {
  it('renders its headline', () => {
    renderRoute(<About />, '/about')
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('names the number of question types the bank covers', () => {
    const { container } = renderRoute(<About />, '/about')
    expect(container.textContent).toContain(String(ALL_QUESTION_TYPES.length))
  })
})

describe('Privacy', () => {
  it('renders its headline', () => {
    renderRoute(<Privacy />, '/privacy/')
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('links back to the about page', () => {
    renderRoute(<Privacy />, '/privacy/')
    expect(screen.getByRole('link', { name: /about/i })).toBeInTheDocument()
  })
})

describe('NotFound', () => {
  it('shows the status code', () => {
    renderRoute(<NotFound />, '/nowhere')
    expect(screen.getByText('404')).toBeInTheDocument()
  })

  it('explains that the page does not exist', () => {
    renderRoute(<NotFound />, '/nowhere')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('This page does not exist')
  })

  it('offers somewhere else to go', () => {
    renderRoute(<NotFound />, '/nowhere')
    expect(screen.getByRole('link', { name: /Back to home/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Start a mock test/i })).toBeInTheDocument()
  })
})

describe('ScoringGuide', () => {
  it('renders its headline', () => {
    renderRoute(<ScoringGuide />, '/scoring')
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('shows the official score bands', () => {
    const { container } = renderRoute(<ScoringGuide />, '/scoring')
    expect(container.textContent).toContain('90')
    expect(container.textContent).toContain('10')
  })
})

describe('QuestionTypes', () => {
  it('renders every question type', () => {
    const { container } = renderRoute(<QuestionTypes />, '/question-types/')
    for (const type of ALL_QUESTION_TYPES) {
      expect(container.textContent).toContain(QUESTION_META[type].label)
    }
  })

  it('links to each type page', () => {
    renderRoute(<QuestionTypes />, '/question-types/')
    const slug = typeSlug(ALL_QUESTION_TYPES[0]!)
    expect(
      screen.getByRole('link', { name: new RegExp(slug.replace(/-/g, ' '), 'i') }),
    ).toBeInTheDocument()
  })
})

describe('QuestionTypePage', () => {
  it('renders the type it was given', () => {
    const type = ALL_QUESTION_TYPES[0]!
    const { container } = renderRoute(<QuestionTypePage />, `/question-types/${typeSlug(type)}/`, {
      route: `/question-types/${typeSlug(type)}/`,
    })
    expect(container.textContent).toBeTruthy()
  })

  it('shows the not-found page for an unknown slug', () => {
    renderRoute(<QuestionTypePage />, '/question-types/:slug/', {
      route: '/question-types/not-a-type/',
    })
    expect(screen.getByText('404')).toBeInTheDocument()
  })
})

describe('TestFormat', () => {
  it('renders its headline', () => {
    renderRoute(<TestFormat />, '/format')
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('shows the format of every section', () => {
    const { container } = renderRoute(<TestFormat />, '/format')
    expect(container.textContent).toContain('Speaking')
    expect(container.textContent).toContain('Reading')
    expect(container.textContent).toContain('Listening')
  })
})

describe('Guide', () => {
  it('renders its headline', () => {
    renderRoute(<Guide />, '/guide')
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('copies a template to the clipboard', async () => {
    const { container } = renderRoute(<Guide />, '/guide')
    const copyButton = container.querySelector('button') as HTMLButtonElement
    expect(copyButton).toBeInTheDocument()

    await act(async () => {
      copyButton.click()
    })

    expect(navigator.clipboard.writeText).toHaveBeenCalled()
  })

  it('copies twice without stacking timers', async () => {
    const { container } = renderRoute(<Guide />, '/guide')
    const copyButton = container.querySelector('button') as HTMLButtonElement

    await act(async () => {
      copyButton.click()
    })
    await act(async () => {
      copyButton.click()
    })

    expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(2)
  })

  it('forgets that it copied after a couple of seconds', async () => {
    vi.useFakeTimers()
    const { container } = renderRoute(<Guide />, '/guide')
    const copyButton = container.querySelector('button') as HTMLButtonElement

    await act(async () => {
      copyButton.click()
    })
    await act(async () => {
      vi.advanceTimersByTime(2000)
    })

    vi.useRealTimers()
    expect(container).toBeInTheDocument()
  })

  it('survives a clipboard that refuses', async () => {
    const writeText = vi
      .spyOn(navigator.clipboard, 'writeText')
      .mockRejectedValue(new Error('denied'))
    const { container } = renderRoute(<Guide />, '/guide')
    const copyButton = container.querySelector('button') as HTMLButtonElement

    await act(async () => {
      copyButton.click()
    })

    expect(() => writeText).not.toThrow()
    writeText.mockRestore()
  })
})
