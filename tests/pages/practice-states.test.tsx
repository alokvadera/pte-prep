import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, screen } from '@testing-library/react'
import { renderRoute } from '../helpers/render'
import { makeMockTest } from '../helpers/factories'
import { useTest } from '../../src/store/useTest'
import { useAuth } from '../../src/store/useAuth'
import { ALL_QUESTION_TYPES, QUESTION_META } from '../../src/domain/blueprint'
import type { QuestionType } from '../../src/domain/types'

/* ---------------------------------------------------------------------------
   The practice hub.

   The page is a picker in front of an assembler it only loads when a drill is
   actually started. So the tests here drive three things: the picker's own
   state (skill filter, selected types, questions per type), the two ways a
   drill can fail to appear, and the overwrite prompt that guards a run in
   progress.
   --------------------------------------------------------------------------- */

const stubs = vi.hoisted(() => ({
  /** Overrides the bank's per-type capacity; null means the real manifest. */
  capacity: { value: null as Record<string, number> | null },
  buildDrillMock: vi.fn(),
}))

vi.mock('../../src/content/manifest', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/content/manifest')>()
  return {
    ...actual,
    manifestCapacityByType: () => stubs.capacity.value ?? actual.manifestCapacityByType(),
  }
})

vi.mock('../../src/domain/blueprint', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/domain/blueprint')>()
  return {
    ...actual,
    QUESTION_META: {
      ...actual.QUESTION_META,
      // One type the blueprint says scores no skill at all. The page asks a
      // type for its first skill, and must cope with there not being one.
      'summarize-spoken-text': {
        ...actual.QUESTION_META['summarize-spoken-text'],
        skills: [],
      },
    },
  }
})

vi.mock('../../src/domain/assemble', () => ({
  buildDrillMock: (...args: unknown[]) => stubs.buildDrillMock(...args),
}))

const Practice = (await import('../../src/pages/Practice')).default

function renderPractice(route = '/practice') {
  return renderRoute(<Practice />, '/practice', { route })
}

function checkboxes(container: HTMLElement): HTMLInputElement[] {
  return [...container.querySelectorAll('input[type="checkbox"]')] as HTMLInputElement[]
}

function startButtons(): HTMLElement[] {
  return screen.getAllByRole('button', { name: /Start drill/ })
}

describe('Practice', () => {
  beforeEach(() => {
    stubs.capacity.value = null
    stubs.buildDrillMock.mockImplementation(() => makeMockTest())
    useTest.setState({ mock: null, mode: 'exam', status: 'briefing', responses: {} })
    useAuth.setState({ user: null, token: null })
  })

  it('selects and clears a question type', async () => {
    const { container } = renderPractice()
    const box = checkboxes(container)[0]!
    expect(box.checked).toBe(true)

    await act(async () => {
      fireEvent.click(box)
    })
    expect(box.checked).toBe(false)

    await act(async () => {
      fireEvent.click(box)
    })
    expect(box.checked).toBe(true)
  })

  it('switches the skill filter on and off', async () => {
    const { container } = renderPractice()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Speaking' }))
    })
    const speaking = ALL_QUESTION_TYPES.filter((t) => QUESTION_META[t].skills.includes('speaking'))
    expect(checkboxes(container)).toHaveLength(speaking.length)

    // Clicking the active skill again clears the filter.
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Speaking' }))
    })
    expect(checkboxes(container)).toHaveLength(ALL_QUESTION_TYPES.length)

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /All skills/ }))
    })
    expect(checkboxes(container)).toHaveLength(ALL_QUESTION_TYPES.length)
  })

  it('changes how many questions each type contributes', async () => {
    const { container } = renderPractice()
    expect(container.textContent).toContain('Total ≈ 3 questions')

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '8' }))
    })
    expect(container.textContent).toContain('Total ≈ 8 questions')
  })

  it('says when a selected type has too few items in the bank', async () => {
    stubs.capacity.value = { 'read-aloud': 1 }
    const { container } = renderPractice()

    expect(container.textContent).toContain('1 selected type is skipped')
    expect(container.textContent).toContain('Read Aloud')
  })

  it('says so when several selected types are skipped', async () => {
    stubs.capacity.value = { 'read-aloud': 1, 'repeat-sentence': 1 }
    const { container } = renderPractice()

    await act(async () => {
      fireEvent.click(screen.getByLabelText('Repeat Sentence'))
    })

    expect(container.textContent).toContain('2 selected types are skipped')
  })

  it('treats a type with no entry in the manifest as having nothing', async () => {
    stubs.capacity.value = { 'read-aloud': 5 }
    const { container } = renderPractice()

    await act(async () => {
      fireEvent.click(screen.getByLabelText('Write Essay'))
    })

    expect(container.textContent).toContain('Write Essay')
    expect(container.textContent).toContain('0 items')
  })

  it('counts nothing for a type the bank stops reporting', () => {
    // The bank answers with a capacity once, and then forgets the type.
    let reads = 0
    const capacity: Record<string, number> = {}
    Object.defineProperty(capacity, 'read-aloud', {
      enumerable: true,
      get: () => {
        reads += 1
        return reads === 1 ? 5 : undefined
      },
    })
    stubs.capacity.value = capacity

    const { container } = renderPractice()

    // The estimate falls back to nothing rather than promising questions the
    // bank can no longer back up.
    expect(container.textContent).toContain('Total ≈ 0 questions')
  })

  it('starts a drill', async () => {
    renderPractice()
    await act(async () => {
      fireEvent.click(startButtons()[0]!)
    })

    expect(stubs.buildDrillMock).toHaveBeenCalled()
    expect(useTest.getState().mock).not.toBeNull()
    expect(useTest.getState().mode).toBe('practice')
  })

  it('says so when the drill cannot be built', async () => {
    stubs.buildDrillMock.mockImplementation(() => {
      throw new Error('bank unavailable')
    })
    renderPractice()

    await act(async () => {
      fireEvent.click(startButtons()[0]!)
    })

    expect(screen.getByRole('alert').textContent).toContain('Failed to load drill questions')
    expect(useTest.getState().mock).toBeNull()
  })

  it('does not start an empty drill', async () => {
    stubs.buildDrillMock.mockImplementation(() =>
      makeMockTest({
        sections: [
          {
            id: 'speaking-writing',
            title: 'Speaking & Writing',
            seconds: 300,
            groups: [],
            itemIds: [],
          },
        ],
      }),
    )
    const { container } = renderPractice()

    await act(async () => {
      fireEvent.click(startButtons()[0]!)
    })

    // The assembler returned nothing to sit, so no session is started and the
    // picker stays exactly where it was.
    expect(useTest.getState().mock).toBeNull()
    expect(startButtons().length).toBeGreaterThan(0)
    expect(container.textContent).toContain('Build a session around what you need.')
  })
})

describe('Practice overwrite prompt', () => {
  beforeEach(() => {
    stubs.capacity.value = null
    stubs.buildDrillMock.mockImplementation(() => makeMockTest())
    useAuth.setState({ user: null, token: null })
  })

  it('asks before replacing a run in progress', async () => {
    useTest.setState({ mock: makeMockTest(), status: 'running' })
    const { container } = renderPractice()

    await act(async () => {
      fireEvent.click(startButtons()[0]!)
    })

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(container.textContent).toContain('Discard active test?')
    expect(stubs.buildDrillMock).not.toHaveBeenCalled()
  })

  it('keeps the active test when asked to', async () => {
    useTest.setState({ mock: makeMockTest(), status: 'running' })
    renderPractice()

    await act(async () => {
      fireEvent.click(startButtons()[0]!)
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Keep active test' }))
    })

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(stubs.buildDrillMock).not.toHaveBeenCalled()
  })

  it('starts the drill once the active test is discarded', async () => {
    useTest.setState({ mock: makeMockTest(), status: 'running' })
    renderPractice()

    await act(async () => {
      fireEvent.click(startButtons()[0]!)
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Discard & Start drill' }))
    })

    expect(stubs.buildDrillMock).toHaveBeenCalled()
    expect(useTest.getState().mock).not.toBeNull()
  })

  it('moves the focus inside the prompt and keeps it there', async () => {
    useTest.setState({ mock: makeMockTest(), status: 'running' })
    renderPractice()

    await act(async () => {
      fireEvent.click(startButtons()[0]!)
    })

    const dialog = screen.getByRole('dialog')
    const focusable = dialog.querySelectorAll('button') as NodeListOf<HTMLButtonElement>
    const first = focusable[0]!
    const last = focusable[focusable.length - 1]!

    // The prompt takes the focus when it opens.
    expect(document.activeElement).toBe(first)

    last.focus()
    await act(async () => {
      fireEvent.keyDown(window, { key: 'Tab' })
    })
    expect(document.activeElement).toBe(first)

    first.focus()
    await act(async () => {
      fireEvent.keyDown(window, { key: 'Tab', shiftKey: true })
    })
    expect(document.activeElement).toBe(last)
  })

  it('closes the prompt on Escape', async () => {
    useTest.setState({ mock: makeMockTest(), status: 'running' })
    const { container } = renderPractice()

    await act(async () => {
      fireEvent.click(startButtons()[0]!)
    })
    await act(async () => {
      fireEvent.keyDown(window, { key: 'Escape' })
    })

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(container.textContent).not.toMatch(/already/i)
  })

  it('ignores a key that is not the tab key', async () => {
    useTest.setState({ mock: makeMockTest(), status: 'running' })
    renderPractice()

    await act(async () => {
      fireEvent.click(startButtons()[0]!)
    })
    const dialog = screen.getByRole('dialog')
    const first = dialog.querySelector('button') as HTMLButtonElement
    expect(document.activeElement).toBe(first)

    await act(async () => {
      fireEvent.keyDown(window, { key: 'a' })
    })

    // The focus has not moved: only the tab key moves it.
    expect(document.activeElement).toBe(first)
  })

  it('leaves the focus alone when the tab key is held over the last button', async () => {
    useTest.setState({ mock: makeMockTest(), status: 'running' })
    renderPractice()

    await act(async () => {
      fireEvent.click(startButtons()[0]!)
    })
    const dialog = screen.getByRole('dialog')
    const buttons = dialog.querySelectorAll('button') as NodeListOf<HTMLButtonElement>
    const last = buttons[buttons.length - 1]!
    last.focus()

    await act(async () => {
      fireEvent.keyDown(window, { key: 'Tab', shiftKey: true })
    })

    // The focus only wraps when it is on the first button, so it stays put.
    expect(document.activeElement).toBe(last)
  })

  it('closes the prompt when the backdrop is clicked', async () => {
    useTest.setState({ mock: makeMockTest(), status: 'running' })
    renderPractice()

    await act(async () => {
      fireEvent.click(startButtons()[0]!)
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    })

    expect(screen.queryByRole('dialog')).toBeNull()
  })
})

describe('Practice deep links', () => {
  beforeEach(() => {
    stubs.capacity.value = null
    stubs.buildDrillMock.mockImplementation(() => makeMockTest())
    useTest.setState({ mock: null, status: 'briefing' })
    useAuth.setState({ user: null, token: null })
  })

  it('opens on the type a deep link names', () => {
    const { container } = renderPractice('/practice?type=write-essay')
    const checked = checkboxes(container).filter((box) => box.checked)
    expect(checked).toHaveLength(1)
    expect(container.textContent).toContain('Write Essay is selected from your last step')
  })

  it('ignores a deep link that names no type', () => {
    const { container } = renderPractice('/practice?type=not-a-type')
    const checked = checkboxes(container).filter((box) => box.checked)
    expect(checked).toHaveLength(1)
    expect(container.textContent).not.toContain('is selected from your last step')
  })

  it('opens with no skill filter for a type that scores no skill', () => {
    const { container } = renderPractice('/practice?type=summarize-spoken-text')

    // "All skills" is the sign that the page found no first skill to filter
    // the list by.
    expect(container.textContent).toContain('All skills,')
    expect(container.textContent).toContain('Summarize Spoken Text is selected from your last step')
  })

  it('starts the deep-linked type', async () => {
    renderPractice('/practice?type=write-essay')
    await act(async () => {
      fireEvent.click(startButtons()[0]!)
    })

    const types = stubs.buildDrillMock.mock.calls[0]![1] as QuestionType[]
    expect(types).toEqual(['write-essay'])
    expect(useTest.getState().mock).not.toBeNull()
  })
})
