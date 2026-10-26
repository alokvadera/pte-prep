import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { QuestionView } from '../../src/components/questions/QuestionView'
import { makeItem } from '../helpers/factories'
import type { Item, ItemResponse, QuestionType, ResponseKind } from '../../src/domain/types'

/* ---------------------------------------------------------------------------
   The question view.

   Every one of the 22 official PTE item types is answered through this
   component, and each type belongs to one of seven response kinds. The tests
   below therefore work kind by kind: what control the candidate is given, and
   what the component hands back when they answer it.
   --------------------------------------------------------------------------- */

/** A real script from the content bank, so the audio player has something to show. */
const AUDIO_ID = 'conv-streaming'

function renderQuestion(item: Item, response?: ItemResponse, examMode = false) {
  const onChange = vi.fn()
  const result = render(
    <QuestionView item={item} response={response} onChange={onChange} examMode={examMode} />,
  )
  return { ...result, onChange }
}

describe('the play allowance', () => {
  it('is recorded in the response, so a remount cannot restore it', () => {
    vi.useFakeTimers()
    try {
      const { onChange } = renderQuestion(
        makeItem({
          id: 't-repeat',
          type: 'repeat-sentence',
          responseKind: 'audio',
          prompt: 'Repeat the sentence.',
          stimulusId: AUDIO_ID,
          replays: 0,
        }),
      )

      fireEvent.click(screen.getByRole('button', { name: /^Play/ }))
      act(() => {
        vi.advanceTimersByTime(6000)
      })

      // The count belongs to the response, not to the player: the runner
      // remounts the player every time the candidate moves between items, so
      // a count held in the player would be reset by navigating away and back.
      expect(onChange).toHaveBeenCalledWith({ playsUsed: 1 })
    } finally {
      vi.useRealTimers()
    }
  })
})

/* ---------------------------------------------------------------------------
   One item per official type, with the response kind the assembler gives it.
   --------------------------------------------------------------------------- */

interface TypeCase {
  type: QuestionType
  kind: ResponseKind
  build: () => Item
}

const TYPE_CASES: TypeCase[] = [
  {
    type: 'read-aloud',
    kind: 'audio',
    build: () =>
      makeItem({
        id: 't-read-aloud',
        type: 'read-aloud',
        responseKind: 'audio',
        prompt: 'Look at the text below.',
        targetText: 'The quick brown fox jumps over the lazy dog.',
      }),
  },
  {
    type: 'repeat-sentence',
    kind: 'audio',
    build: () =>
      makeItem({
        id: 't-repeat',
        type: 'repeat-sentence',
        responseKind: 'audio',
        prompt: 'You will hear a recording. Repeat what you hear.',
        targetText: 'The sentence to repeat.',
        audioUtterance: 'The sentence to repeat.',
      }),
  },
  {
    type: 'describe-image',
    kind: 'audio',
    build: () =>
      makeItem({
        id: 't-describe',
        type: 'describe-image',
        responseKind: 'audio',
        prompt: 'Describe the information given in the chart below.',
        chartId: 'chart-renewable',
      }),
  },
  {
    type: 'retell-lecture',
    kind: 'audio',
    build: () =>
      makeItem({
        id: 't-retell',
        type: 'retell-lecture',
        responseKind: 'audio',
        prompt: 'Listen to the recording and re-tell what you heard.',
        stimulusId: AUDIO_ID,
        tokens: ['Retell the key argument of the lecture.'],
      }),
  },
  {
    type: 'answer-short-question',
    kind: 'audio',
    build: () =>
      makeItem({
        id: 't-asq',
        type: 'answer-short-question',
        responseKind: 'audio',
        prompt: 'Listen and answer the question below.',
        tokens: ['What colour was the umbrella?'],
        stimulusId: AUDIO_ID,
      }),
  },
  {
    type: 'summarize-group-discussion',
    kind: 'audio',
    build: () =>
      makeItem({
        id: 't-sgd',
        type: 'summarize-group-discussion',
        responseKind: 'audio',
        prompt: 'Summarize the group discussion.',
        stimulusId: AUDIO_ID,
      }),
  },
  {
    type: 'respond-to-situation',
    kind: 'audio',
    build: () =>
      makeItem({
        id: 't-rts',
        type: 'respond-to-situation',
        responseKind: 'audio',
        prompt: 'Respond to the situation below.',
        prepSeconds: 25,
      }),
  },
  {
    type: 'summarize-written-text',
    kind: 'text',
    build: () =>
      makeItem({
        id: 't-swt',
        type: 'summarize-written-text',
        responseKind: 'text',
        prompt: 'Read the passage and write a one-sentence summary.',
        targetText: 'A passage about photosynthesis.',
      }),
  },
  {
    type: 'write-essay',
    kind: 'text',
    build: () =>
      makeItem({
        id: 't-essay',
        type: 'write-essay',
        responseKind: 'text',
        prompt: 'Write an essay in response to the prompt below.',
      }),
  },
  {
    type: 'fill-in-blanks-dropdown',
    kind: 'blanks',
    build: () =>
      makeItem({
        id: 't-fib-drop',
        type: 'fill-in-blanks-dropdown',
        responseKind: 'blanks',
        prompt: 'Complete the passage below.',
        targetText: 'Photosynthesis converts ______ into ______ in plants.',
        options: ['light', 'sugar', 'water'],
      }),
  },
  {
    type: 'fill-in-blanks-table',
    kind: 'blanks',
    build: () =>
      makeItem({
        id: 't-fib-table',
        type: 'fill-in-blanks-table',
        responseKind: 'blanks',
        prompt: 'Complete the table below.',
        table: {
          headers: ['Year', 'Visitors'],
          rows: [
            ['1990', null],
            ['2000', '1.2 million'],
          ],
          blankCells: [{ row: 0, col: 1 }],
          context: ['A short context paragraph.'],
        },
      }),
  },
  {
    type: 'multiple-choice-single',
    kind: 'choice',
    build: () =>
      makeItem({
        id: 't-mcq-single',
        type: 'multiple-choice-single',
        responseKind: 'choice',
        prompt: 'Which statement is true?',
        options: ['Alpha', 'Beta', 'Gamma'],
      }),
  },
  {
    type: 'multiple-choice-multiple',
    kind: 'multi-choice',
    build: () =>
      makeItem({
        id: 't-mcq-multi',
        type: 'multiple-choice-multiple',
        responseKind: 'multi-choice',
        prompt: 'Which statements are true?',
        options: ['Alpha', 'Beta', 'Gamma'],
      }),
  },
  {
    type: 'reorder-paragraphs',
    kind: 'order',
    build: () =>
      makeItem({
        id: 't-reorder',
        type: 'reorder-paragraphs',
        responseKind: 'order',
        prompt: 'Put the paragraphs in the correct sequence.',
        blocks: [
          { id: 'b1', text: 'First paragraph.' },
          { id: 'b2', text: 'Second paragraph.' },
          { id: 'b3', text: 'Third paragraph.' },
        ],
      }),
  },
  {
    type: 'summarize-spoken-text',
    kind: 'text',
    build: () =>
      makeItem({
        id: 't-sst',
        type: 'summarize-spoken-text',
        responseKind: 'text',
        prompt: 'Listen and summarize what you hear.',
        stimulusId: AUDIO_ID,
      }),
  },
  {
    type: 'fill-in-blanks-listening',
    kind: 'blanks',
    build: () =>
      makeItem({
        id: 't-fib-listen',
        type: 'fill-in-blanks-listening',
        responseKind: 'blanks',
        prompt: 'Listen and fill in the blanks.',
        targetText: 'The meeting starts at ______ in the ______ hall.',
      }),
  },
  {
    type: 'highlight-correct-summary',
    kind: 'choice',
    build: () =>
      makeItem({
        id: 't-hcs',
        type: 'highlight-correct-summary',
        responseKind: 'choice',
        prompt: 'Choose the correct summary.',
        options: ['Summary one', 'Summary two', 'Summary three'],
        stimulusId: AUDIO_ID,
      }),
  },
  {
    type: 'listening-multiple-choice-single',
    kind: 'choice',
    build: () =>
      makeItem({
        id: 't-lmcq-single',
        type: 'listening-multiple-choice-single',
        responseKind: 'choice',
        prompt: 'What does the speaker say?',
        options: ['Yes', 'No', 'Maybe'],
        stimulusId: AUDIO_ID,
      }),
  },
  {
    type: 'listening-multiple-choice-multiple',
    kind: 'multi-choice',
    build: () =>
      makeItem({
        id: 't-lmcq-multi',
        type: 'listening-multiple-choice-multiple',
        responseKind: 'multi-choice',
        prompt: 'Which speakers agree?',
        options: ['First', 'Second', 'Third'],
        stimulusId: AUDIO_ID,
      }),
  },
  {
    type: 'select-missing-word',
    kind: 'choice',
    build: () =>
      makeItem({
        id: 't-smw',
        type: 'select-missing-word',
        responseKind: 'choice',
        prompt: 'Listen and select the missing word.',
        options: ['word', 'ward', 'warp'],
        stimulusId: AUDIO_ID,
      }),
  },
  {
    type: 'highlight-incorrect-words',
    kind: 'highlight',
    build: () =>
      makeItem({
        id: 't-hiw',
        type: 'highlight-incorrect-words',
        responseKind: 'highlight',
        prompt: 'Highlight the two words that are wrong.',
        tokens: ['The', 'meeting', 'starts', '___', 'nine', 'o’clock'],
        stimulusId: AUDIO_ID,
      }),
  },
  {
    type: 'write-from-dictation',
    kind: 'text',
    build: () =>
      makeItem({
        id: 't-wfd',
        type: 'write-from-dictation',
        responseKind: 'text',
        prompt: 'Listen and type exactly what you hear.',
        stimulusId: AUDIO_ID,
      }),
  },
]

afterEach(() => {
  cleanup()
})

/* ---------------------------------------------------------------------------
   A microphone the recorder can actually read.

   The browser environment's analyser node does not implement the time-domain
   read the recorder uses, so the recorder cannot run against it. This one can,
   which lets the speaking types be driven end to end.
   --------------------------------------------------------------------------- */

class ReadableAnalyser {
  fftSize = 2048
  smoothingTimeConstant = 0.4
  connect(node: unknown): unknown {
    return node
  }
  disconnect(): void {}
  getFloatTimeDomainData(buffer: Float32Array): void {
    buffer.fill(0.2)
  }
  getByteFrequencyData(buffer: Uint8Array): void {
    buffer.fill(0)
  }
  getFloatFrequencyData(buffer: Float32Array): void {
    buffer.fill(0)
  }
}

class ReadableAudioContext {
  state: AudioContextState = 'running'
  currentTime = 0
  sampleRate = 44100
  destination = {
    connect(node: unknown): unknown {
      return node
    },
    disconnect(): void {},
  }
  resume(): Promise<void> {
    this.state = 'running'
    return Promise.resolve()
  }
  suspend(): Promise<void> {
    this.state = 'suspended'
    return Promise.resolve()
  }
  close(): Promise<void> {
    this.state = 'closed'
    return Promise.resolve()
  }
  createOscillator() {
    return {
      type: 'sine',
      frequency: {
        value: 0,
        setValueAtTime(): void {},
        exponentialRampToValueAtTime(): void {},
      },
      connect(node: unknown): unknown {
        return node
      },
      disconnect(): void {},
      start(): void {},
      stop(): void {},
    }
  }
  createGain() {
    return {
      gain: {
        value: 0,
        setValueAtTime(): void {},
        exponentialRampToValueAtTime(): void {},
      },
      connect(node: unknown): unknown {
        return node
      },
      disconnect(): void {},
    }
  }
  createAnalyser(): ReadableAnalyser {
    return new ReadableAnalyser()
  }
  createMediaStreamSource() {
    return {
      connect(node: unknown): unknown {
        return node
      },
      disconnect(): void {},
    }
  }
}

const originalAudioContext = window.AudioContext

beforeEach(() => {
  // The recorder samples the microphone on every animation frame. Nothing in
  // these tests needs the samples, so the frames are simply not scheduled.
  vi.stubGlobal('requestAnimationFrame', () => 0)
  vi.stubGlobal('cancelAnimationFrame', () => {})
  window.AudioContext = ReadableAudioContext as unknown as typeof AudioContext
})

afterEach(() => {
  window.AudioContext = originalAudioContext
})

describe('QuestionView', () => {
  it('covers all 22 official question types', () => {
    expect(TYPE_CASES).toHaveLength(22)
    expect(new Set(TYPE_CASES.map((c) => c.type)).size).toBe(22)
  })

  describe.each(TYPE_CASES)('$type', ({ kind, build }) => {
    it('renders the control the answer is given in', () => {
      const item = build()
      const { container } = renderQuestion(item)

      if (kind === 'choice') {
        expect(container.querySelectorAll('input[type="radio"]')).toHaveLength(3)
      } else if (kind === 'multi-choice') {
        expect(container.querySelectorAll('input[type="checkbox"]')).toHaveLength(3)
      } else if (kind === 'blanks') {
        if (item.type === 'fill-in-blanks-dropdown') {
          expect(container.querySelector('select')).not.toBeNull()
        } else if (item.type === 'fill-in-blanks-table') {
          expect(container.querySelector('table')).not.toBeNull()
        } else {
          expect(container.querySelector('input[type="text"]')).not.toBeNull()
        }
      } else if (kind === 'order') {
        expect(screen.getByRole('button', { name: 'Move paragraph 1 up' })).toBeInTheDocument()
      } else if (kind === 'highlight') {
        expect(screen.getByRole('button', { name: 'meeting' })).toBeInTheDocument()
      } else if (kind === 'text') {
        expect(screen.getByRole('textbox', { name: item.prompt })).toBeInTheDocument()
      } else {
        expect(
          screen.getByRole('button', { name: /Start (recording|preparation)/ }),
        ).toBeInTheDocument()
      }
    })
  })

  describe('single choice', () => {
    it('records the chosen option', () => {
      const item = makeItem({
        id: 'q1',
        type: 'multiple-choice-single',
        responseKind: 'choice',
        prompt: 'Which one?',
        options: ['Alpha', 'Beta'],
      })
      const { onChange } = renderQuestion(item)

      fireEvent.click(screen.getByRole('radio', { name: /Beta/ }))

      expect(onChange).toHaveBeenCalledWith({ choice: 'Beta' })
    })

    it('marks the stored option as selected', () => {
      const item = makeItem({
        id: 'q1',
        type: 'multiple-choice-single',
        responseKind: 'choice',
        prompt: 'Which one?',
        options: ['Alpha', 'Beta'],
      })
      renderQuestion(item, { choice: 'Alpha' })

      expect(screen.getByRole('radio', { name: /Alpha/ })).toBeChecked()
      expect(screen.getByRole('radio', { name: /Beta/ })).not.toBeChecked()
    })

    it('plays the stimulus audio when the item has one', () => {
      const item = makeItem({
        id: 'q1',
        type: 'listening-multiple-choice-single',
        responseKind: 'choice',
        prompt: 'What is said?',
        options: ['Yes', 'No'],
        stimulusId: AUDIO_ID,
      })
      renderQuestion(item)

      expect(screen.getByRole('button', { name: /^Play/ })).toBeInTheDocument()
    })

    it('offers no audio player without a stimulus', () => {
      const item = makeItem({
        id: 'q1',
        type: 'multiple-choice-single',
        responseKind: 'choice',
        prompt: 'Which one?',
        options: ['Alpha', 'Beta'],
      })
      renderQuestion(item)

      expect(screen.queryByRole('button', { name: /^Play/ })).not.toBeInTheDocument()
    })

    it('keeps the coaching note out of an exam run', () => {
      const item = makeItem({
        id: 'q1',
        type: 'multiple-choice-single',
        responseKind: 'choice',
        prompt: 'Which one?',
        options: ['Alpha', 'Beta'],
      })
      const { container } = renderQuestion(item, undefined, true)

      expect(container.textContent).not.toContain('No negative marking')
    })

    it('shows the coaching note in a practice run', () => {
      const item = makeItem({
        id: 'q1',
        type: 'multiple-choice-single',
        responseKind: 'choice',
        prompt: 'Which one?',
        options: ['Alpha', 'Beta'],
      })
      const { container } = renderQuestion(item)

      expect(container.textContent).toContain('No negative marking')
    })
  })

  describe('multiple choice', () => {
    it('adds an option to the answer', () => {
      const item = makeItem({
        id: 'q2',
        type: 'multiple-choice-multiple',
        responseKind: 'multi-choice',
        prompt: 'Which ones?',
        options: ['Alpha', 'Beta', 'Gamma'],
      })
      const { onChange } = renderQuestion(item)

      fireEvent.click(screen.getByRole('checkbox', { name: /Alpha/ }))

      expect(onChange).toHaveBeenCalledWith({ choices: ['Alpha'] })
    })

    it('removes an option that was already chosen', () => {
      const item = makeItem({
        id: 'q2',
        type: 'multiple-choice-multiple',
        responseKind: 'multi-choice',
        prompt: 'Which ones?',
        options: ['Alpha', 'Beta', 'Gamma'],
      })
      const { onChange } = renderQuestion(item, { choices: ['Alpha'] })

      fireEvent.click(screen.getByRole('checkbox', { name: /Alpha/ }))

      expect(onChange).toHaveBeenCalledWith({ choices: [] })
    })

    it('checks the options that were already chosen', () => {
      const item = makeItem({
        id: 'q2',
        type: 'multiple-choice-multiple',
        responseKind: 'multi-choice',
        prompt: 'Which ones?',
        options: ['Alpha', 'Beta', 'Gamma'],
      })
      renderQuestion(item, { choices: ['Beta'] })

      expect(screen.getByRole('checkbox', { name: /Beta/ })).toBeChecked()
      expect(screen.getByRole('checkbox', { name: /Alpha/ })).not.toBeChecked()
    })

    it('warns that wrong options cost a point', () => {
      const item = makeItem({
        id: 'q2',
        type: 'multiple-choice-multiple',
        responseKind: 'multi-choice',
        prompt: 'Which ones?',
        options: ['Alpha'],
      })
      const { container } = renderQuestion(item)

      expect(container.textContent).toContain('Negative marking')
    })
  })

  describe('dropdown blanks', () => {
    it('records the chosen word and pads the rest', () => {
      const item = makeItem({
        id: 'q3',
        type: 'fill-in-blanks-dropdown',
        responseKind: 'blanks',
        prompt: 'Complete the passage.',
        targetText: 'Photosynthesis converts ______ into ______ in plants.',
        options: ['light', 'sugar'],
      })
      const { onChange } = renderQuestion(item)

      fireEvent.change(screen.getByLabelText('Blank 2'), { target: { value: 'sugar' } })

      expect(onChange).toHaveBeenCalledWith({ blanks: [null, 'sugar'] })
    })

    it('keeps the words already entered', () => {
      const item = makeItem({
        id: 'q3',
        type: 'fill-in-blanks-dropdown',
        responseKind: 'blanks',
        prompt: 'Complete the passage.',
        targetText: 'Photosynthesis converts ______ into ______ in plants.',
        options: ['light', 'sugar'],
      })
      const { onChange } = renderQuestion(item, { blanks: ['light'] })

      fireEvent.change(screen.getByLabelText('Blank 2'), { target: { value: 'sugar' } })

      expect(onChange).toHaveBeenCalledWith({ blanks: ['light', 'sugar'] })
    })

    it('shows the chosen word in the select', () => {
      const item = makeItem({
        id: 'q3',
        type: 'fill-in-blanks-dropdown',
        responseKind: 'blanks',
        prompt: 'Complete the passage.',
        targetText: 'Photosynthesis converts ______ into ______ in plants.',
        options: ['light', 'sugar'],
      })
      renderQuestion(item, { blanks: ['light', null] })

      expect(screen.getByLabelText('Blank 1')).toHaveValue('light')
      expect(screen.getByLabelText('Blank 2')).toHaveValue('')
    })
  })

  describe('inline blanks', () => {
    it('records the word typed into a blank', () => {
      const item = makeItem({
        id: 'q4',
        type: 'fill-in-blanks-listening',
        responseKind: 'blanks',
        prompt: 'Listen and fill in the blanks.',
        targetText: 'The meeting starts at ______ in the ______ hall.',
      })
      const { onChange } = renderQuestion(item)

      fireEvent.change(screen.getByLabelText('Blank 1'), { target: { value: 'nine' } })

      expect(onChange).toHaveBeenCalledWith({ blanks: ['nine', null] })
    })

    it('shows the words already entered', () => {
      const item = makeItem({
        id: 'q4',
        type: 'fill-in-blanks-listening',
        responseKind: 'blanks',
        prompt: 'Listen and fill in the blanks.',
        targetText: 'The meeting starts at ______ in the ______ hall.',
      })
      renderQuestion(item, { blanks: ['nine', 'main'] })

      expect(screen.getByLabelText('Blank 1')).toHaveValue('nine')
      expect(screen.getByLabelText('Blank 2')).toHaveValue('main')
    })
  })

  describe('table blanks', () => {
    it('records the word typed into a table cell', () => {
      const item = makeItem({
        id: 'q5',
        type: 'fill-in-blanks-table',
        responseKind: 'blanks',
        prompt: 'Complete the table.',
        table: {
          headers: ['Year', 'Visitors'],
          rows: [
            ['1990', null],
            ['2000', '1.2 million'],
          ],
          blankCells: [{ row: 0, col: 1 }],
          context: ['A short context paragraph.'],
        },
      })
      const { onChange } = renderQuestion(item)

      fireEvent.change(screen.getByLabelText('Blank 1, row 1'), { target: { value: '900,000' } })

      expect(onChange).toHaveBeenCalledWith({ blanks: ['900,000'] })
    })

    it('pads the answer array to the number of blank cells', () => {
      const item = makeItem({
        id: 'q5',
        type: 'fill-in-blanks-table',
        responseKind: 'blanks',
        prompt: 'Complete the table.',
        table: {
          headers: ['Year', 'Visitors'],
          rows: [
            ['1990', null],
            ['2000', '1.2 million'],
          ],
          blankCells: [{ row: 0, col: 1 }],
          context: [],
        },
      })
      const { onChange } = renderQuestion(item, { blanks: [] })

      fireEvent.change(screen.getByLabelText('Blank 1, row 1'), { target: { value: 'x' } })

      expect(onChange).toHaveBeenCalledWith({ blanks: ['x'] })
    })

    it('shows the context and the headers', () => {
      const item = makeItem({
        id: 'q5',
        type: 'fill-in-blanks-table',
        responseKind: 'blanks',
        prompt: 'Complete the table.',
        table: {
          headers: ['Year', 'Visitors'],
          rows: [
            ['1990', null],
            ['2000', '1.2 million'],
          ],
          blankCells: [{ row: 0, col: 1 }],
          context: ['A short context paragraph.'],
        },
      })
      const { container } = renderQuestion(item)

      expect(container.textContent).toContain('A short context paragraph.')
      expect(screen.getByRole('columnheader', { name: 'Visitors' })).toBeInTheDocument()
    })
  })

  describe('reorder paragraphs', () => {
    it('lists the blocks in the order they were given', () => {
      const item = makeItem({
        id: 'q6',
        type: 'reorder-paragraphs',
        responseKind: 'order',
        prompt: 'Put them in order.',
        blocks: [
          { id: 'b1', text: 'First paragraph.' },
          { id: 'b2', text: 'Second paragraph.' },
        ],
      })
      const { container } = renderQuestion(item)

      const items = container.querySelectorAll('li')
      expect(items[0]?.textContent).toContain('First paragraph.')
      expect(items[1]?.textContent).toContain('Second paragraph.')
    })

    it('moves a paragraph up', () => {
      const item = makeItem({
        id: 'q6',
        type: 'reorder-paragraphs',
        responseKind: 'order',
        prompt: 'Put them in order.',
        blocks: [
          { id: 'b1', text: 'First paragraph.' },
          { id: 'b2', text: 'Second paragraph.' },
        ],
      })
      const { onChange } = renderQuestion(item)

      fireEvent.click(screen.getByRole('button', { name: 'Move paragraph 2 up' }))

      expect(onChange).toHaveBeenCalledWith({ order: ['b2', 'b1'] })
    })

    it('moves a paragraph down', () => {
      const item = makeItem({
        id: 'q6',
        type: 'reorder-paragraphs',
        responseKind: 'order',
        prompt: 'Put them in order.',
        blocks: [
          { id: 'b1', text: 'First paragraph.' },
          { id: 'b2', text: 'Second paragraph.' },
        ],
      })
      const { onChange } = renderQuestion(item)

      fireEvent.click(screen.getByRole('button', { name: 'Move paragraph 1 down' }))

      expect(onChange).toHaveBeenCalledWith({ order: ['b2', 'b1'] })
    })

    it('uses the order that was already answered', () => {
      const item = makeItem({
        id: 'q6',
        type: 'reorder-paragraphs',
        responseKind: 'order',
        prompt: 'Put them in order.',
        blocks: [
          { id: 'b1', text: 'First paragraph.' },
          { id: 'b2', text: 'Second paragraph.' },
        ],
      })
      const { container } = renderQuestion(item, { order: ['b2', 'b1'] })

      const items = container.querySelectorAll('li')
      expect(items[0]?.textContent).toContain('Second paragraph.')
    })

    it('skips a block id that is not in the item', () => {
      const item = makeItem({
        id: 'q6',
        type: 'reorder-paragraphs',
        responseKind: 'order',
        prompt: 'Put them in order.',
        blocks: [{ id: 'b1', text: 'First paragraph.' }],
      })
      const { container } = renderQuestion(item, { order: ['ghost', 'b1'] })

      expect(container.querySelectorAll('li')).toHaveLength(1)
    })
  })

  describe('highlight incorrect words', () => {
    it('highlights a word and records its index', () => {
      const item = makeItem({
        id: 'q7',
        type: 'highlight-incorrect-words',
        responseKind: 'highlight',
        prompt: 'Highlight the wrong words.',
        tokens: ['The', 'meeting', 'starts', 'at', 'nine'],
      })
      const { onChange } = renderQuestion(item)

      fireEvent.click(screen.getByRole('button', { name: 'meeting' }))

      expect(onChange).toHaveBeenCalledWith({ highlighted: [1] })
    })

    it('unhighlights a word that was already highlighted', () => {
      const item = makeItem({
        id: 'q7',
        type: 'highlight-incorrect-words',
        responseKind: 'highlight',
        prompt: 'Highlight the wrong words.',
        tokens: ['The', 'meeting', 'starts', 'at', 'nine'],
      })
      const { onChange } = renderQuestion(item, { highlighted: [1] })

      fireEvent.click(screen.getByRole('button', { name: 'meeting' }))

      expect(onChange).toHaveBeenCalledWith({ highlighted: [] })
    })

    it('keeps the highlighted words in index order', () => {
      const item = makeItem({
        id: 'q7',
        type: 'highlight-incorrect-words',
        responseKind: 'highlight',
        prompt: 'Highlight the wrong words.',
        tokens: ['The', 'meeting', 'starts', 'at', 'nine'],
      })
      const { onChange } = renderQuestion(item, { highlighted: [3] })

      fireEvent.click(screen.getByRole('button', { name: 'meeting' }))

      expect(onChange).toHaveBeenCalledWith({ highlighted: [1, 3] })
    })

    it('marks the highlighted words as pressed', () => {
      const item = makeItem({
        id: 'q7',
        type: 'highlight-incorrect-words',
        responseKind: 'highlight',
        prompt: 'Highlight the wrong words.',
        tokens: ['The', 'meeting', 'starts', 'at', 'nine'],
      })
      renderQuestion(item, { highlighted: [1] })

      expect(screen.getByRole('button', { name: 'meeting' })).toHaveAttribute(
        'aria-pressed',
        'true',
      )
      expect(screen.getByRole('button', { name: 'starts' })).toHaveAttribute(
        'aria-pressed',
        'false',
      )
    })

    it('renders the gap as a separator rather than a word', () => {
      const item = makeItem({
        id: 'q7',
        type: 'highlight-incorrect-words',
        responseKind: 'highlight',
        prompt: 'Highlight the wrong words.',
        tokens: ['The', '___', 'nine'],
      })
      renderQuestion(item)

      expect(screen.getByRole('separator')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: '___' })).not.toBeInTheDocument()
    })
  })

  describe('written answers', () => {
    it('records the typed text', () => {
      const item = makeItem({
        id: 'q8',
        type: 'write-essay',
        responseKind: 'text',
        prompt: 'Write an essay.',
      })
      const { onChange } = renderQuestion(item)

      fireEvent.change(screen.getByRole('textbox', { name: 'Write an essay.' }), {
        target: { value: 'A paragraph.' },
      })

      expect(onChange).toHaveBeenCalledWith({ text: 'A paragraph.' })
    })

    it('counts the words and flags an essay that is too short', () => {
      const item = makeItem({
        id: 'q8',
        type: 'write-essay',
        responseKind: 'text',
        prompt: 'Write an essay.',
      })
      const { container } = renderQuestion(item, { text: 'Too short.' })

      expect(container.textContent).toContain('2 words')
      expect(container.textContent).toContain('minimum about 200')
      expect(container.textContent).toContain('too short so far')
    })

    it('flags an essay that is too long', () => {
      const item = makeItem({
        id: 'q8',
        type: 'write-essay',
        responseKind: 'text',
        prompt: 'Write an essay.',
      })
      const { container } = renderQuestion(item, { text: new Array(400).fill('word').join(' ') })

      expect(container.textContent).toContain('over length')
    })

    it('gives a dictation no word limit and its own placeholder', () => {
      const item = makeItem({
        id: 'q9',
        type: 'write-from-dictation',
        responseKind: 'text',
        prompt: 'Type exactly what you hear.',
      })
      const { container } = renderQuestion(item)

      expect(container.textContent).toContain('0 words')
      expect(container.textContent).not.toContain('minimum about')
      expect(screen.getByRole('textbox', { name: 'Type exactly what you hear.' })).toHaveAttribute(
        'placeholder',
        'Type exactly what you hear, including punctuation.',
      )
    })

    it('asks for a longer summary of a spoken text', () => {
      const item = makeItem({
        id: 'q10',
        type: 'summarize-spoken-text',
        responseKind: 'text',
        prompt: 'Summarize what you hear.',
      })
      const { container } = renderQuestion(item)

      expect(container.textContent).toContain('minimum about 50')
      expect(container.textContent).toContain('maximum about 70')
    })

    it('asks for a one-line summary of a written text', () => {
      const item = makeItem({
        id: 'q11',
        type: 'summarize-written-text',
        responseKind: 'text',
        prompt: 'Write a one-sentence summary.',
      })
      const { container } = renderQuestion(item)

      expect(container.textContent).toContain('minimum about 5')
      expect(container.textContent).toContain('maximum about 75')
    })

    it('keeps the coaching notes out of an exam run', () => {
      const item = makeItem({
        id: 'q8',
        type: 'write-essay',
        responseKind: 'text',
        prompt: 'Write an essay.',
      })
      const { container } = renderQuestion(item, undefined, true)

      expect(container.textContent).not.toContain('Aim for 200')
    })

    it('falls back to the default length for an unknown written type', () => {
      const item = makeItem({
        id: 'q12',
        type: 'answer-short-question',
        responseKind: 'text',
        prompt: 'Write something.',
      })
      const { container } = renderQuestion(item)

      expect(container.textContent).toContain('minimum about 20')
      expect(container.textContent).toContain('maximum about 45')
    })
  })

  describe('spoken answers', () => {
    it('shows the text to read aloud', () => {
      const item = makeItem({
        id: 'r1',
        type: 'read-aloud',
        responseKind: 'audio',
        prompt: 'Read the text aloud.',
        targetText: 'The quick brown fox jumps over the lazy dog.',
      })
      const { container } = renderQuestion(item)

      expect(container.textContent).toContain('The quick brown fox jumps over the lazy dog.')
    })

    it('hides the sentence to repeat', () => {
      const item = makeItem({
        id: 'r2',
        type: 'repeat-sentence',
        responseKind: 'audio',
        prompt: 'Repeat what you hear.',
        targetText: 'The secret sentence.',
      })
      const { container } = renderQuestion(item)

      expect(container.textContent).not.toContain('The secret sentence.')
    })

    it('keeps the heard question of a short-answer item off the screen', () => {
      const item = makeItem({
        id: 'r3',
        type: 'answer-short-question',
        responseKind: 'audio',
        prompt: 'Listen and answer.',
        tokens: ['What colour was the umbrella?'],
      })
      const { container } = renderQuestion(item)

      expect(container.textContent).not.toContain('What colour was the umbrella?')
    })

    it('shows the written instruction of an item that has one', () => {
      const item = makeItem({
        id: 'r7',
        type: 'retell-lecture',
        responseKind: 'audio',
        prompt: 'Listen and retell.',
        tokens: ['Retell the key argument of the lecture.'],
      })
      const { container } = renderQuestion(item)

      expect(container.textContent).toContain('Retell the key argument of the lecture.')
    })

    it('records the typed answer to a short-answer item', () => {
      const item = makeItem({
        id: 'r3',
        type: 'answer-short-question',
        responseKind: 'audio',
        prompt: 'Listen and answer.',
      })
      const { onChange } = renderQuestion(item)

      fireEvent.change(screen.getByLabelText('Your answer'), { target: { value: 'Blue' } })

      expect(onChange).toHaveBeenCalledWith({ text: 'Blue' })
    })

    it('shows the chart of a describe-image item', () => {
      const item = makeItem({
        id: 'r4',
        type: 'describe-image',
        responseKind: 'audio',
        prompt: 'Describe the chart.',
        chartId: 'chart-renewable',
      })
      renderQuestion(item)

      expect(screen.getByRole('img')).toBeInTheDocument()
    })

    it('offers a recorder with the item’s own time limit', () => {
      const item = makeItem({
        id: 'r5',
        type: 'read-aloud',
        responseKind: 'audio',
        prompt: 'Read aloud.',
        seconds: 40,
      })
      const { container } = renderQuestion(item)

      expect(container.textContent).toContain('Up to 40 seconds.')
    })

    it('locks the recorder while the stimulus is playing', () => {
      const item = makeItem({
        id: 'r6',
        type: 'retell-lecture',
        responseKind: 'audio',
        prompt: 'Retell the lecture.',
        stimulusId: AUDIO_ID,
      })
      renderQuestion(item)

      const start = screen.getByRole('button', { name: /Start recording/ })
      expect(start).toBeEnabled()

      fireEvent.click(screen.getByRole('button', { name: /^Play/ }))

      expect(screen.getByRole('button', { name: /Start recording/ })).toBeDisabled()
    })
  })

  it('reports an unsupported response kind rather than crashing', () => {
    const item = makeItem({
      id: 'bad',
      type: 'read-aloud',
      responseKind: 'dragging' as unknown as ResponseKind,
    })
    renderQuestion(item)

    expect(screen.getByRole('alert')).toHaveTextContent('Unsupported question type: dragging')
  })

  describe('defensive paths', () => {
    it('renders no options for a choice item that has none', () => {
      const item = makeItem({
        id: 'q1',
        type: 'multiple-choice-single',
        responseKind: 'choice',
        prompt: 'Which one?',
      })
      const { container } = renderQuestion(item)

      expect(container.querySelectorAll('input')).toHaveLength(0)
    })

    it('renders no options for a multi-choice item that has none', () => {
      const item = makeItem({
        id: 'q2',
        type: 'multiple-choice-multiple',
        responseKind: 'multi-choice',
        prompt: 'Which ones?',
      })
      const { container } = renderQuestion(item)

      expect(container.querySelectorAll('input')).toHaveLength(0)
    })

    it('renders no dropdown for a blank item that has no text', () => {
      const item = makeItem({
        id: 'q3',
        type: 'fill-in-blanks-dropdown',
        responseKind: 'blanks',
        prompt: 'Complete the passage.',
        targetText: undefined,
      })
      const { container } = renderQuestion(item)

      expect(container.querySelector('select')).toBeNull()
    })

    it('renders an empty word bank for a dropdown with no options', () => {
      const item = makeItem({
        id: 'q3',
        type: 'fill-in-blanks-dropdown',
        responseKind: 'blanks',
        prompt: 'Complete the passage.',
        targetText: 'A ______ gap.',
      })
      renderQuestion(item)

      expect(screen.getByLabelText('Blank 1').querySelectorAll('option')).toHaveLength(1)
    })

    it('renders no inputs for an inline blank item that has no text', () => {
      const item = makeItem({
        id: 'q4',
        type: 'fill-in-blanks-listening',
        responseKind: 'blanks',
        prompt: 'Listen and fill in the blanks.',
        targetText: undefined,
      })
      const { container } = renderQuestion(item)

      expect(container.querySelectorAll('input')).toHaveLength(0)
    })

    it('renders no paragraphs for a reorder item that has no blocks', () => {
      const item = makeItem({
        id: 'q6',
        type: 'reorder-paragraphs',
        responseKind: 'order',
        prompt: 'Put them in order.',
      })
      const { container } = renderQuestion(item)

      expect(container.querySelectorAll('li')).toHaveLength(0)
    })

    it('renders no words for a highlight item that has no tokens', () => {
      const item = makeItem({
        id: 'q7',
        type: 'highlight-incorrect-words',
        responseKind: 'highlight',
        prompt: 'Highlight the wrong words.',
      })
      const { container } = renderQuestion(item)

      expect(container.querySelectorAll('button')).toHaveLength(0)
    })

    it('keeps the partial-credit note out of an exam run', () => {
      const dropdown = makeItem({
        id: 'q3',
        type: 'fill-in-blanks-dropdown',
        responseKind: 'blanks',
        prompt: 'Complete the passage.',
        targetText: 'A ______ gap.',
        options: ['gap'],
      })
      const inline = makeItem({
        id: 'q4',
        type: 'fill-in-blanks-listening',
        responseKind: 'blanks',
        prompt: 'Listen and fill in the blanks.',
        targetText: 'A ______ gap.',
      })
      const table = makeItem({
        id: 'q5',
        type: 'fill-in-blanks-table',
        responseKind: 'blanks',
        prompt: 'Complete the table.',
        table: {
          headers: ['Year'],
          rows: [[null]],
          blankCells: [{ row: 0, col: 0 }],
          context: [],
        },
      })
      const order = makeItem({
        id: 'q6',
        type: 'reorder-paragraphs',
        responseKind: 'order',
        prompt: 'Put them in order.',
        blocks: [{ id: 'b1', text: 'First.' }],
      })

      for (const item of [dropdown, inline, table, order]) {
        const { container, unmount } = renderQuestion(item, undefined, true)
        expect(container.textContent).not.toContain('Partial credit')
        unmount()
      }
    })
  })

  describe('a recorded take', () => {
    it('stores the analysis and the transcript', async () => {
      const item = makeItem({
        id: 'r8',
        type: 'read-aloud',
        responseKind: 'audio',
        prompt: 'Read aloud.',
        targetText: 'The quick brown fox.',
      })
      const { onChange } = renderQuestion(item)

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Start recording/ }))
      })
      expect(screen.getByRole('button', { name: 'Stop recording' })).toBeInTheDocument()

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Stop recording' }))
      })

      expect(onChange).toHaveBeenCalledWith({
        audio: expect.objectContaining({
          durationMs: expect.any(Number),
          reliable: expect.any(Boolean),
        }),
        transcript: '',
      })
    })

    it('stores the typed answer that stands in for a take', async () => {
      const item = makeItem({
        id: 'r8',
        type: 'read-aloud',
        responseKind: 'audio',
        prompt: 'Read aloud.',
        targetText: 'The quick brown fox.',
      })
      const { onChange } = renderQuestion(item)

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Start recording/ }))
      })
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Stop recording' }))
      })

      const box = screen.getByRole('textbox', {
        name: /Type what you said/,
      }) as HTMLTextAreaElement
      await act(async () => {
        fireEvent.change(box, { target: { value: 'The quick brown fox' } })
      })

      expect(onChange).toHaveBeenCalledWith({ text: 'The quick brown fox' })
    })
  })
})
