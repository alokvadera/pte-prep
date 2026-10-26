import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { TestRunner } from '../../src/components/test/TestRunner'
import { useTest } from '../../src/store/useTest'
import { makeItem, makeMockTest } from '../helpers/factories'
import type { Item, MockTest, TestSection } from '../../src/domain/types'

/* ---------------------------------------------------------------------------
   The test runner.

   The runner owns the candidate's journey through a mock: the cursor between
   questions, the recording of an answer, the hand-off from one section to the
   next, and the clock that has to end a section even when the candidate is
   still working.
   --------------------------------------------------------------------------- */

const ITEM_1 = makeItem({
  id: 'item-1',
  type: 'multiple-choice-single',
  section: 'reading',
  responseKind: 'choice',
  prompt: 'Which statement is true?',
  options: ['Alpha', 'Beta'],
})

const ITEM_2 = makeItem({
  id: 'item-2',
  type: 'multiple-choice-single',
  section: 'reading',
  responseKind: 'choice',
  prompt: 'Which other statement is true?',
  options: ['Gamma', 'Delta'],
})

const ITEM_3 = makeItem({
  id: 'item-3',
  type: 'fill-in-blanks-listening',
  section: 'listening',
  groupId: 'group-1',
  responseKind: 'blanks',
  prompt: 'Listen and fill in the blanks.',
  targetText: 'The meeting starts at ______.',
})

function makeRunnerMock(overrides: Partial<MockTest> = {}): MockTest {
  return makeMockTest({
    id: 'mock-1',
    title: 'Runner Mock',
    sections: [
      {
        id: 'reading',
        title: 'Reading',
        seconds: 600,
        groups: [],
        itemIds: ['item-1', 'item-2'],
      },
      {
        id: 'listening',
        title: 'Listening',
        seconds: 600,
        groups: [
          {
            id: 'group-1',
            section: 'listening',
            type: 'fill-in-blanks-listening',
            skills: ['listening'],
            order: 0,
            stimulus: {
              passageTitle: 'A short passage',
              passageParagraphs: ['The first paragraph.', 'The second paragraph.'],
              note: 'A note about the passage.',
            },
            itemIds: ['item-3'],
          },
        ],
        itemIds: ['item-3'],
      },
    ],
    items: { 'item-1': ITEM_1, 'item-2': ITEM_2, 'item-3': ITEM_3 },
    answers: {},
    ...overrides,
  })
}

/** Puts the store into a running mock and renders the runner. */
function renderRunner({
  mock = makeRunnerMock(),
  status = 'running',
  sectionIndex = 0,
  itemIndex = 0,
  responses = {},
  mode = 'exam',
  sectionEndsAt = Date.now() + 600_000,
  timeExpired = false,
}: {
  mock?: MockTest | null
  status?: 'briefing' | 'running' | 'break' | 'finished'
  sectionIndex?: number
  itemIndex?: number
  responses?: Record<string, { choice?: string; flagged?: boolean }>
  mode?: 'exam' | 'practice' | 'review'
  sectionEndsAt?: number | null
  timeExpired?: boolean
} = {}) {
  useTest.setState({
    mock,
    status,
    sectionIndex,
    itemIndex,
    responses,
    mode,
    sectionEndsAt,
    timeExpired,
  })
  const onExit = vi.fn()
  const result = render(<TestRunner onExit={onExit} />)
  return { ...result, onExit }
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  cleanup()
})

describe('TestRunner', () => {
  it('shows the question the candidate is on', () => {
    renderRunner()

    expect(screen.getByText('Which statement is true?')).toBeInTheDocument()
    expect(screen.getByText('Multiple Choice (Single Answer)')).toBeInTheDocument()
    expect(screen.getByText('Question 1 of 2')).toBeInTheDocument()
  })

  it('moves the cursor forward', () => {
    renderRunner()

    fireEvent.click(screen.getByRole('button', { name: /^Next/ }))

    expect(useTest.getState().itemIndex).toBe(1)
    expect(screen.getByText('Which other statement is true?')).toBeInTheDocument()
  })

  it('moves the cursor back', () => {
    renderRunner({ itemIndex: 1 })

    fireEvent.click(screen.getByRole('button', { name: /Back/ }))

    expect(useTest.getState().itemIndex).toBe(0)
  })

  it('will not go back past the first question', () => {
    renderRunner()

    expect(screen.getByRole('button', { name: /Back/ })).toBeDisabled()
  })

  it('records the answer the candidate gives', () => {
    renderRunner()

    fireEvent.click(screen.getByRole('radio', { name: /Beta/ }))

    expect(useTest.getState().responses['item-1']?.choice).toBe('Beta')
  })

  it('counts how many questions are answered', () => {
    renderRunner({ responses: { 'item-1': { choice: 'Alpha' } } })

    expect(screen.getByText('1 of 2 answered')).toBeInTheDocument()
  })

  it('flags a question for review', () => {
    renderRunner()

    fireEvent.click(screen.getByRole('button', { name: /Flag$/ }))

    expect(useTest.getState().responses['item-1']?.flagged).toBe(true)
    expect(screen.getByRole('button', { name: /Flagged$/ })).toBeInTheDocument()
  })

  it('announces the flag', () => {
    renderRunner()

    fireEvent.click(screen.getByRole('button', { name: /Flag$/ }))

    expect(screen.getByText('Flagged for review.')).toBeInTheDocument()
  })

  it('announces the advance', () => {
    renderRunner()

    fireEvent.click(screen.getByRole('button', { name: /^Next/ }))

    expect(screen.getByText('Question advanced.')).toBeInTheDocument()
  })

  it('hands the section over when the last question of it is answered', () => {
    renderRunner({ itemIndex: 1 })

    fireEvent.click(screen.getByRole('button', { name: /^End section/ }))

    expect(useTest.getState().status).toBe('break')
    expect(screen.getByText('Reading complete')).toBeInTheDocument()
  })

  it('starts the next section from the hand-over', () => {
    renderRunner({ status: 'break', sectionIndex: 1 })

    fireEvent.click(screen.getByRole('button', { name: /Start Listening/ }))

    expect(useTest.getState().status).toBe('running')
    expect(useTest.getState().sectionIndex).toBe(1)
  })

  it('finishes the test from the last question', () => {
    renderRunner({ sectionIndex: 1, itemIndex: 0 })

    fireEvent.click(screen.getByRole('button', { name: /^Finish test/ }))

    expect(useTest.getState().status).toBe('finished')
  })

  it('announces that the test is being scored', () => {
    renderRunner({ sectionIndex: 1, itemIndex: 0 })

    fireEvent.click(screen.getByRole('button', { name: /^Finish test/ }))

    expect(screen.getByText('Test finished, scoring your responses.')).toBeInTheDocument()
  })

  it('ends the section when the clock runs out', () => {
    renderRunner({ sectionEndsAt: Date.now() + 5000 })

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(useTest.getState().timeExpired).toBe(true)
    expect(screen.getByText(/Time is up for/)).toBeInTheDocument()
  })

  it('offers no extension in an exam run', () => {
    renderRunner({ sectionEndsAt: Date.now() + 60_000 })

    expect(screen.queryByRole('button', { name: /Add 5 minutes/ })).not.toBeInTheDocument()
  })

  it('offers an extension in a practice run', () => {
    renderRunner({ mode: 'practice', sectionEndsAt: Date.now() + 60_000 })

    fireEvent.click(screen.getByRole('button', { name: /Add 5 minutes/ }))

    expect(useTest.getState().sectionEndsAt).toBe(Date.now() + 60_000 + 300_000)
    expect(screen.getByText('Time extended by 5 minutes.')).toBeInTheDocument()
  })

  it('shows the section briefing before the section starts', () => {
    renderRunner({ status: 'briefing' })

    expect(screen.getByText('Section 1 of 2, Part 2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Begin Reading/ })).toBeInTheDocument()
  })

  it('starts the section from the briefing', () => {
    renderRunner({ status: 'briefing' })

    fireEvent.click(screen.getByRole('button', { name: /Begin Reading/ }))

    expect(useTest.getState().status).toBe('running')
    expect(useTest.getState().sectionIndex).toBe(0)
  })

  it('says the section is untimed when it is', () => {
    renderRunner({ status: 'briefing', mock: makeRunnerMock({ untimed: true }) })

    expect(screen.getByText('No limit')).toBeInTheDocument()
  })

  it('shows the passage the questions belong to', () => {
    renderRunner({ sectionIndex: 1, itemIndex: 0 })

    expect(screen.getByText('A short passage')).toBeInTheDocument()
    expect(screen.getByText('The first paragraph.')).toBeInTheDocument()
    expect(screen.getByText('A note about the passage.')).toBeInTheDocument()
  })

  it('shows the tip of a practice run', () => {
    const item = makeItem({
      id: 'item-1',
      type: 'multiple-choice-single',
      responseKind: 'choice',
      prompt: 'Which statement is true?',
      options: ['Alpha', 'Beta'],
      tip: 'Read every option before you choose.',
    })
    renderRunner({ mode: 'practice', mock: makeRunnerMock({ items: { 'item-1': item } }) })

    expect(screen.getByText('Read every option before you choose.')).toBeInTheDocument()
  })

  it('keeps the tip out of an exam run', () => {
    const item = makeItem({
      id: 'item-1',
      type: 'multiple-choice-single',
      responseKind: 'choice',
      prompt: 'Which statement is true?',
      options: ['Alpha', 'Beta'],
      tip: 'Read every option before you choose.',
    })
    renderRunner({ mock: makeRunnerMock({ items: { 'item-1': item } }) })

    expect(screen.queryByText('Read every option before you choose.')).not.toBeInTheDocument()
  })

  it('renders nothing without a mock', () => {
    const { container } = renderRunner({ mock: null })

    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when the section is missing', () => {
    const { container } = renderRunner({ sectionIndex: 5 })

    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when the item is missing', () => {
    renderRunner({ itemIndex: 9 })

    // A blank viewport reads as a broken page, so the runner says what
    // happened and offers a way out.
    expect(
      screen.getByRole('heading', { name: 'This question could not be loaded' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Back to the mock setup' })).toBeInTheDocument()
  })

  describe('the question navigator', () => {
    it('opens the drawer', () => {
      renderRunner()

      fireEvent.click(screen.getAllByRole('button', { name: 'All questions' })[0]!)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Question 1, not answered' })).toBeInTheDocument()
    })

    it('shows which questions are answered', () => {
      renderRunner({ responses: { 'item-1': { choice: 'Alpha' } } })

      fireEvent.click(screen.getAllByRole('button', { name: 'All questions' })[0]!)

      expect(screen.getByRole('button', { name: 'Question 1, answered' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Question 2, not answered' })).toBeInTheDocument()
    })

    it('shows which questions are flagged', () => {
      renderRunner({ responses: { 'item-1': { choice: 'Alpha', flagged: true } } })

      fireEvent.click(screen.getAllByRole('button', { name: 'All questions' })[0]!)

      expect(
        screen.getByRole('button', { name: 'Question 1, answered, flagged' }),
      ).toBeInTheDocument()
    })

    it('jumps to a question', () => {
      renderRunner()

      fireEvent.click(screen.getAllByRole('button', { name: 'All questions' })[0]!)
      fireEvent.click(screen.getByRole('button', { name: 'Question 2, not answered' }))

      expect(useTest.getState().itemIndex).toBe(1)
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('closes on Escape', () => {
      renderRunner()

      fireEvent.click(screen.getAllByRole('button', { name: 'All questions' })[0]!)
      fireEvent.keyDown(window, { key: 'Escape' })

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('closes when the scrim is clicked', () => {
      renderRunner()

      fireEvent.click(screen.getAllByRole('button', { name: 'All questions' })[0]!)
      fireEvent.click(screen.getByRole('button', { name: 'Close question overview' }))

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('moves the focus around the drawer', () => {
      renderRunner()

      fireEvent.click(screen.getAllByRole('button', { name: 'All questions' })[0]!)
      const dialog = screen.getByRole('dialog')
      const focusable = [...dialog.querySelectorAll<HTMLElement>('button')].filter(
        (button) => button.getAttribute('aria-label') !== 'Close question overview',
      )
      const first = focusable[0]!
      const last = focusable[focusable.length - 1]!

      last.focus()
      fireEvent.keyDown(window, { key: 'Tab' })
      expect(document.activeElement).toBe(first)

      first.focus()
      fireEvent.keyDown(window, { key: 'Tab', shiftKey: true })
      expect(document.activeElement).toBe(last)
    })
  })

  describe('the keyboard', () => {
    it('advances with Alt+N', () => {
      renderRunner()

      fireEvent.keyDown(window, { key: 'n', altKey: true })

      expect(useTest.getState().itemIndex).toBe(1)
    })

    it('goes back with Alt+B', () => {
      renderRunner({ itemIndex: 1 })

      fireEvent.keyDown(window, { key: 'b', altKey: true })

      expect(useTest.getState().itemIndex).toBe(0)
    })

    it('leaves the keyboard alone while the candidate is typing', () => {
      renderRunner()

      fireEvent.keyDown(screen.getByRole('radio', { name: /Alpha/ }), { key: 'n', altKey: true })

      expect(useTest.getState().itemIndex).toBe(0)
    })
  })

  describe('test-day mode', () => {
    it('will not let the candidate go back', () => {
      renderRunner({ mock: makeRunnerMock({ forwardOnly: true }), itemIndex: 1 })

      expect(screen.queryByRole('button', { name: /Back/ })).not.toBeInTheDocument()
      expect(screen.getAllByText('Test-day mode, forward only').length).toBeGreaterThan(0)
    })

    it('will not let the candidate flag a question', () => {
      renderRunner({ mock: makeRunnerMock({ forwardOnly: true }) })

      expect(screen.queryByRole('button', { name: 'Flag' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'All questions' })).not.toBeInTheDocument()
    })
  })

  it('records how long the candidate spent on the question', () => {
    const { unmount } = renderRunner()

    act(() => {
      vi.advanceTimersByTime(4000)
    })
    unmount()

    expect(useTest.getState().responses['item-1']?.secondsOnItem).toBe(4)
  })
})

/* ---------------------------------------------------------------------------
   The edges.

   The happy path above is one candidate answering one kind of question. The
   runner has to survive a good deal more than that: an item nobody scores, a
   question type the blueprint has never heard of, a stimulus with no title
   and no note, a section the candidate has to be told the name of, a clock
   that runs out on the very last section, and a candidate who holds the
   shortcut key down instead of tapping it.
   --------------------------------------------------------------------------- */

/** An item the test does not score — the personal introduction, say. */
const UNSCORED_ITEM = makeItem({
  id: 'item-unscored',
  type: 'multiple-choice-single',
  section: 'reading',
  responseKind: 'choice',
  prompt: 'An unscored warm-up.',
  options: ['Alpha', 'Beta'],
  maxPoints: 0,
})

/** A question type the blueprint has no row for. */
const MYSTERY_ITEM = makeItem({
  id: 'item-mystery',
  type: 'mystery-type' as Item['type'],
  section: 'reading',
  responseKind: 'choice',
  prompt: 'A question nobody has catalogued.',
  options: ['Alpha', 'Beta'],
})

/** A section of the runner's own making. */
function section(overrides: Partial<TestSection> = {}): TestSection {
  return {
    id: 'reading',
    title: 'Reading',
    seconds: 600,
    groups: [],
    itemIds: ['item-1'],
    ...overrides,
  }
}

/** A section that never got a title at all. */
function untitledSection(overrides: Partial<Omit<TestSection, 'title'>> = {}): TestSection {
  const base: Omit<TestSection, 'title'> = {
    id: 'reading',
    seconds: 600,
    groups: [],
    itemIds: ['item-1'],
    ...overrides,
  }
  return base as TestSection
}

/** A stimulus block with only the fields a test cares about. */
function stimulusOf(overrides: Partial<TestSection['groups'][number]['stimulus']> = {}) {
  return {
    passageTitle: 'A short passage',
    passageParagraphs: ['The first paragraph.'],
    ...overrides,
  }
}

describe('the section briefing', () => {
  it('leaves an unscored item out of the type summary', () => {
    const mock = makeRunnerMock({
      items: { 'item-1': ITEM_1, 'item-2': ITEM_2, 'item-unscored': UNSCORED_ITEM },
      sections: [section({ itemIds: ['item-1', 'item-2', 'item-unscored'] })],
    })
    renderRunner({ mock, status: 'briefing' })

    // Three questions in the section, but only the two scored ones are counted.
    expect(screen.getByText('3 questions')).toBeInTheDocument()
    expect(screen.getByText('×2')).toBeInTheDocument()
  })

  it('names a question type the blueprint has never heard of', () => {
    const mock = makeRunnerMock({ items: { 'item-1': MYSTERY_ITEM, 'item-2': ITEM_2 } })
    renderRunner({ mock, status: 'briefing' })

    expect(screen.getByText('mystery-type')).toBeInTheDocument()
  })
})

describe('the item types the runner can be showing', () => {
  const KINDS: Item[] = [
    makeItem({
      id: 'item-kind',
      type: 'multiple-choice-single',
      responseKind: 'choice',
      prompt: 'A single choice.',
      options: ['Alpha'],
    }),
    makeItem({
      id: 'item-kind',
      type: 'multiple-choice-multiple',
      responseKind: 'multi-choice',
      prompt: 'Several choices.',
      options: ['Alpha'],
    }),
    makeItem({
      id: 'item-kind',
      type: 'fill-in-blanks-listening',
      responseKind: 'blanks',
      prompt: 'Some blanks.',
      targetText: 'It starts at ______.',
    }),
    makeItem({
      id: 'item-kind',
      type: 'reorder-paragraphs',
      responseKind: 'order',
      prompt: 'Put them in order.',
      blocks: [{ id: 'b1', text: 'First.' }],
    }),
    makeItem({
      id: 'item-kind',
      type: 'highlight-incorrect-words',
      responseKind: 'highlight',
      prompt: 'Mark the wrong words.',
      tokens: ['It', 'is'],
    }),
    makeItem({
      id: 'item-kind',
      type: 'write-from-dictation',
      responseKind: 'text',
      prompt: 'Type it out.',
    }),
    makeItem({
      id: 'item-kind',
      type: 'read-aloud',
      responseKind: 'audio',
      prompt: 'Read it out.',
    }),
  ]

  it.each(KINDS.map((item) => [item.responseKind, item] as const))(
    'shows a %s question',
    (_kind, item) => {
      const mock = makeRunnerMock({ items: { 'item-1': item, 'item-2': ITEM_2 } })
      const { unmount } = renderRunner({ mock })

      expect(screen.getByText(item.prompt)).toBeInTheDocument()
      unmount()
    },
  )

  it('falls back to the raw type when the blueprint has no row for it', () => {
    const mock = makeRunnerMock({ items: { 'item-1': MYSTERY_ITEM, 'item-2': ITEM_2 } })
    renderRunner({ mock })

    expect(screen.getByText('mystery-type')).toBeInTheDocument()
  })
})

describe('the navigator drawer', () => {
  // The drawer guards against a missing panel (`if (!panel) return` in the
  // runner) before it traps the focus. That guard cannot be reached: the
  // panel is rendered by the same component, in the very commit that turns
  // the drawer on, and React attaches the ref before it runs any effect —
  // so the panel is always there by the time the effect looks for it. It is
  // left uncovered on purpose.
  it('marks an unscored question', () => {
    const mock = makeRunnerMock({
      items: { 'item-1': ITEM_1, 'item-2': ITEM_2, 'item-unscored': UNSCORED_ITEM },
      sections: [section({ itemIds: ['item-1', 'item-2', 'item-unscored'] })],
    })
    renderRunner({ mock })

    fireEvent.click(screen.getAllByRole('button', { name: 'All questions' })[0]!)

    const button = screen.getByRole('button', { name: 'Question 3, not answered' })
    expect(button.className).toContain('bg-ink-100')
  })

  it('opens from the answered counter as well as from the label', () => {
    renderRunner()

    fireEvent.click(screen.getByRole('button', { name: /0 of 2 answered/ }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('moves the focus forward from the middle of the drawer', () => {
    renderRunner()

    fireEvent.click(screen.getAllByRole('button', { name: 'All questions' })[0]!)
    const first = screen.getByRole('button', { name: 'Question 1, not answered' })
    const last = screen.getByRole('button', { name: 'Question 2, not answered' })

    first.focus()
    fireEvent.keyDown(window, { key: 'Tab' })

    expect(document.activeElement).toBe(last)
  })

  it('moves the focus back from the middle of the drawer', () => {
    renderRunner()

    fireEvent.click(screen.getAllByRole('button', { name: 'All questions' })[0]!)
    const first = screen.getByRole('button', { name: 'Question 1, not answered' })
    const last = screen.getByRole('button', { name: 'Question 2, not answered' })

    last.focus()
    fireEvent.keyDown(window, { key: 'Tab', shiftKey: true })

    expect(document.activeElement).toBe(first)
  })

  it('ignores the keys it has no use for', () => {
    renderRunner()

    fireEvent.click(screen.getAllByRole('button', { name: 'All questions' })[0]!)
    fireEvent.keyDown(window, { key: 'a' })

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})

describe('the keyboard shortcuts', () => {
  it('ignores a key the candidate is holding down', () => {
    renderRunner()

    fireEvent.keyDown(window, { key: 'n', altKey: true, repeat: true })

    expect(useTest.getState().itemIndex).toBe(0)
  })

  it('ignores the keyboard when the section has gone missing', () => {
    renderRunner({ sectionIndex: 9 })

    fireEvent.keyDown(window, { key: 'n', altKey: true })

    expect(useTest.getState().itemIndex).toBe(0)
  })

  it('announces the end of a section', () => {
    renderRunner({ itemIndex: 1 })

    fireEvent.keyDown(window, { key: 'n', altKey: true })

    // The announcement is replaced by the hand-over screen, but the runner
    // still knows the section is over.
    expect(useTest.getState().status).toBe('break')
    expect(screen.getByRole('heading', { name: 'Reading complete' })).toBeInTheDocument()
  })

  it('announces that the test is being scored', () => {
    renderRunner({ sectionIndex: 1, itemIndex: 0 })

    fireEvent.keyDown(window, { key: 'n', altKey: true })

    expect(screen.getByText('Test finished, scoring your responses.')).toBeInTheDocument()
    expect(useTest.getState().status).toBe('finished')
  })

  it('does not go back from the first question', () => {
    renderRunner()

    fireEvent.keyDown(window, { key: 'b', altKey: true })

    expect(useTest.getState().itemIndex).toBe(0)
  })

  it('does not go back in test-day mode', () => {
    renderRunner({ mock: makeRunnerMock({ forwardOnly: true }), itemIndex: 1 })

    fireEvent.keyDown(window, { key: 'b', altKey: true })

    expect(useTest.getState().itemIndex).toBe(1)
  })

  it('goes back with an upper-case shortcut', () => {
    renderRunner({ itemIndex: 1 })

    fireEvent.keyDown(window, { key: 'B', altKey: true })

    expect(useTest.getState().itemIndex).toBe(0)
  })

  it('goes back with the shortcut key code', () => {
    renderRunner({ itemIndex: 1 })

    fireEvent.keyDown(window, { key: 'x', code: 'KeyB', altKey: true })

    expect(useTest.getState().itemIndex).toBe(0)
  })
})

describe('the stimulus the runner shows above the question', () => {
  function mockWithStimulus(stimulus: TestSection['groups'][number]['stimulus']) {
    return makeRunnerMock({
      sections: [
        section({ itemIds: ['item-1'] }),
        section({
          id: 'listening',
          itemIds: ['item-3'],
          groups: [
            {
              id: 'group-1',
              section: 'listening',
              type: 'fill-in-blanks-listening',
              skills: ['listening'],
              order: 0,
              stimulus,
              itemIds: ['item-3'],
            },
          ],
        }),
      ],
    })
  }

  it('shows a passage without a title', () => {
    renderRunner({
      mock: mockWithStimulus(stimulusOf({ passageTitle: undefined })),
      sectionIndex: 1,
      itemIndex: 0,
    })

    expect(screen.getByText('The first paragraph.')).toBeInTheDocument()
    expect(screen.queryByText('A short passage')).not.toBeInTheDocument()
  })

  it('shows a passage without a note', () => {
    renderRunner({
      mock: mockWithStimulus(stimulusOf({ note: undefined })),
      sectionIndex: 1,
      itemIndex: 0,
    })

    expect(screen.getByText('The first paragraph.')).toBeInTheDocument()
    expect(screen.queryByText('A note about the passage.')).not.toBeInTheDocument()
  })

  it('shows a written text in its own article', () => {
    const mock = makeRunnerMock({
      sections: [
        section({ itemIds: ['item-1'] }),
        section({
          id: 'listening',
          itemIds: ['item-3'],
          groups: [
            {
              id: 'group-1',
              section: 'listening',
              type: 'summarize-written-text',
              skills: ['reading', 'writing'],
              order: 0,
              stimulus: stimulusOf({ passageTitle: 'A written text' }),
              itemIds: ['item-3'],
            },
          ],
        }),
      ],
    })
    renderRunner({ mock, sectionIndex: 1, itemIndex: 0 })

    expect(screen.getByText('A written text')).toBeInTheDocument()
    expect(screen.getByText('The first paragraph.')).toBeInTheDocument()
  })

  it('shows a note that has no passage with it', () => {
    renderRunner({
      mock: mockWithStimulus({ note: 'A note on its own.' }),
      sectionIndex: 1,
      itemIndex: 0,
    })

    expect(screen.getByText('A note on its own.')).toBeInTheDocument()
  })
})

describe('the flags', () => {
  it('announces the removal of a flag', () => {
    renderRunner({ responses: { 'item-1': { choice: 'Alpha', flagged: true } } })

    fireEvent.click(screen.getByRole('button', { name: /Flagged$/ }))

    expect(screen.getByText('Flag removed.')).toBeInTheDocument()
  })
})

describe('the end of the test', () => {
  it('ends the test when the clock runs out on the last section', () => {
    renderRunner({ sectionIndex: 1, itemIndex: 0, timeExpired: true })

    expect(screen.getByText('You have reached the end of the test.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Finish test' }))

    expect(useTest.getState().status).toBe('finished')
  })

  it('names an untitled section when the time is up', () => {
    const mock = makeRunnerMock({
      sections: [
        section({ itemIds: ['item-1'] }),
        untitledSection({ id: 'listening', itemIds: ['item-3'] }),
      ],
    })
    renderRunner({ mock, sectionIndex: 1, itemIndex: 0, timeExpired: true })

    expect(screen.getByText('Time is up for this section')).toBeInTheDocument()
  })

  it('names an untitled section when it is complete', () => {
    const mock = makeRunnerMock({
      sections: [
        untitledSection({ itemIds: ['item-1'] }),
        section({ id: 'listening', itemIds: ['item-3'] }),
      ],
    })
    renderRunner({ mock, status: 'break', sectionIndex: 1 })

    expect(screen.getByRole('heading', { name: 'Section complete' })).toBeInTheDocument()
  })

  it('counts no items when the next section has no list to count', () => {
    const mock = makeRunnerMock({
      sections: [
        section({ itemIds: ['item-1'] }),
        section({ id: 'listening', itemIds: ['item-3'] }),
        section({
          id: 'speaking-writing',
          // A section that arrived without a usable list of items must still
          // be announced: the hand-over says zero, not "undefined".
          itemIds: { 0: 'item-3' } as unknown as string[],
        }),
      ],
    })
    renderRunner({ mock, sectionIndex: 1, itemIndex: 0, timeExpired: true })

    expect(screen.getByText(/0 items\./)).toBeInTheDocument()
  })
})
