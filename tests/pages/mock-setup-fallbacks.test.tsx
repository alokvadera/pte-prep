import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, screen } from '@testing-library/react'
import { renderRoute } from '../helpers/render'
import { useTest } from '../../src/store/useTest'
import { useAuth } from '../../src/store/useAuth'

/* ---------------------------------------------------------------------------
   The setup page against a blueprint that does not know everything.

   The page is defensive in three places: it falls back to a raw id when the
   blueprint has no label for a section or a question type, and it trims the
   reading types back to the passages the bank actually holds. With the real
   blueprint — which knows all 22 types and all three sections — those
   fallbacks are invisible, so the blueprint is mocked here to a partial one.

   The mock is the point of the file: it is the only way to show that the page
   still describes a session when the blueprint goes quiet.
   --------------------------------------------------------------------------- */

vi.mock('../../src/content/manifest', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/content/manifest')>()
  return {
    ...actual,
    // An empty capacity means the bank holds nothing at all, which is what
    // makes the reading over-request visible.
    manifestCapacityByType: () => ({}) as Record<string, number>,
  }
})

vi.mock('../../src/domain/blueprint', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/domain/blueprint')>()
  return {
    ...actual,
    // A blueprint that does not know one of the reading types.
    MOCK_BLUEPRINT: Object.fromEntries(
      Object.entries(actual.MOCK_BLUEPRINT).filter(([type]) => type !== 'reorder-paragraphs'),
    ),
    // A section the blueprint knows but has no title for.
    SECTION_META: {
      ...actual.SECTION_META,
      reading: { ...actual.SECTION_META.reading, longTitle: '' },
    },
    // A type the blueprint knows but has no label for.
    QUESTION_META: {
      ...actual.QUESTION_META,
      'read-aloud': { ...actual.QUESTION_META['read-aloud'], label: '' },
    },
  }
})

const MockSetup = (await import('../../src/pages/MockSetup')).default

function renderSetup() {
  return renderRoute(<MockSetup />, '/mock')
}

function lengthRadios(container: HTMLElement): HTMLInputElement[] {
  return [...container.querySelectorAll('input[type="radio"]')] as HTMLInputElement[]
}

describe('MockSetup against a partial blueprint', () => {
  beforeEach(() => {
    useTest.setState({ mock: null, mode: 'exam', status: 'briefing', responses: {} })
    useAuth.setState({ user: null, token: null })
  })

  it('names a section the blueprint has no title for', async () => {
    const { container } = renderSetup()

    // The summary joins the section titles with an arrow, falling back to the
    // section id where the blueprint is silent.
    expect(container.textContent).toContain('Speaking & Writing → reading → Listening')
  })

  it('names a type the blueprint has no label for', () => {
    const { container } = renderSetup()

    const types = [...container.querySelectorAll('li')].map((li) => li.textContent ?? '')
    expect(types.some((text) => text.includes('read-aloud'))).toBe(true)
  })

  it('names a section the blueprint has no title for in the section filter', async () => {
    const { container } = renderSetup()
    const radios = lengthRadios(container)

    // The filter only appears for a shorter run.
    await act(async () => {
      fireEvent.click(radios[1]!)
    })

    expect(screen.getByRole('button', { name: 'reading' })).toBeInTheDocument()
  })

  it('trims the reading types back to the passages the bank holds', () => {
    const { container } = renderSetup()

    // The partial blueprint requests 15 reading items across four types. With
    // a six-passage fallback cap, the page trims exactly three and does not add
    // the missing Re-order Paragraphs type: 75 items become 69.
    expect(container.textContent).toContain('69 items')
  })
})
