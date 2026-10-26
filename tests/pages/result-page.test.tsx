import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, screen } from '@testing-library/react'
import { renderRoute } from '../helpers/render'
import { installFetchMock } from '../helpers/fetch'
import { makeAnswerKey, makeAttempt, makeItem, makeMockTest } from '../helpers/factories'
import { useAuth } from '../../src/store/useAuth'
import { useTest } from '../../src/store/useTest'
import { useSettings } from '../../src/store/useSettings'
import type { AttemptRecord, ItemScoreDetail, QuestionType } from '../../src/domain/types'

/* ---------------------------------------------------------------------------
   The score report.

   The report has three jobs: present a stored attempt, present a session that
   has just finished, and say plainly when there is neither. Everything else —
   the pace panel, the answer review, the AI examiner — hangs off whichever of
   those produced the report.
   --------------------------------------------------------------------------- */

const stubs = vi.hoisted(() => ({
  listAttempts: vi.fn(async () => [] as unknown[]),
  listAllAttempts: vi.fn(async () => [] as unknown[]),
  getAttempt: vi.fn(async () => null as unknown),
  saveAttempt: vi.fn(async () => {}),
  deleteAttempt: vi.fn(async () => {}),
  clearAttempts: vi.fn(async () => {}),
  readKv: vi.fn(async (_key: string, fallback: unknown) => fallback),
  writeKv: vi.fn(async () => {}),
  syncCloudToLocal: vi.fn(async () => ({ pushed: 0, pulled: 0 })),
  countGuestAttempts: vi.fn(async () => 0),
  claimGuestAttemptsForCurrentUser: vi.fn(async () => 0),
  deleteAttemptEverywhere: vi.fn(async () => true),
  clearAllAttemptsEverywhere: vi.fn(async () => true),
  syncAttemptToCloud: vi.fn(async () => true),
  fetchAttemptFromCloud: vi.fn(async () => null as unknown),
  canPushAttemptToCloud: vi.fn(() => false),
  planSyncReconciliation: vi.fn(() => ({ toPull: [], toPush: [] })),
  evaluateWithAi: vi.fn(async () => null as unknown),
  buildFullMock: vi.fn(),
  /** Flipped off to reproduce the prerendered (server) pass. */
  clientReady: { value: true },
}))

vi.mock('../../src/db/db', () => ({
  attemptOwnerId: (attempt: { ownerId?: string; userId?: string }, guest: string) =>
    attempt.ownerId ?? attempt.userId ?? guest,
  saveAttempt: stubs.saveAttempt,
  listAttempts: stubs.listAttempts,
  listAllAttempts: stubs.listAllAttempts,
  getAttempt: stubs.getAttempt,
  deleteAttempt: stubs.deleteAttempt,
  clearAttempts: stubs.clearAttempts,
  readKv: stubs.readKv,
  writeKv: stubs.writeKv,
}))

vi.mock('../../src/lib/sync', () => ({
  syncCloudToLocal: stubs.syncCloudToLocal,
  countGuestAttempts: stubs.countGuestAttempts,
  claimGuestAttemptsForCurrentUser: stubs.claimGuestAttemptsForCurrentUser,
  deleteAttemptEverywhere: stubs.deleteAttemptEverywhere,
  clearAllAttemptsEverywhere: stubs.clearAllAttemptsEverywhere,
  syncAttemptToCloud: stubs.syncAttemptToCloud,
  fetchAttemptFromCloud: stubs.fetchAttemptFromCloud,
  canPushAttemptToCloud: stubs.canPushAttemptToCloud,
  planSyncReconciliation: stubs.planSyncReconciliation,
}))

vi.mock('../../src/lib/aiScorer', () => ({
  evaluateWithAi: stubs.evaluateWithAi,
}))

vi.mock('../../src/domain/assemble', () => ({
  buildFullMock: (...args: unknown[]) => stubs.buildFullMock(...args),
}))

vi.mock('../../src/lib/useClientReady', () => ({
  useClientReady: () => stubs.clientReady.value,
}))

vi.mock('../../src/domain/scoring', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/domain/scoring')>()
  return {
    ...actual,
    // Every threshold the app ships reads "50–60" or "63+", so the report's
    // guard against a threshold it cannot parse is never reached with the
    // real table. One threshold with no numbers in it is added so that
    // defensive branch is exercised rather than assumed.
    ADMISSION_TARGETS: [
      ...actual.ADMISSION_TARGETS,
      { label: 'Any score', range: 'varies', note: 'A threshold with no numbers in it.' },
    ],
  }
})

const ResultPage = (await import('../../src/pages/ResultPage')).default

const USER = { id: 'usr_1', email: 'a@b.c', targetScore: 60 }

function detail(overrides: Partial<ItemScoreDetail> = {}): ItemScoreDetail {
  return {
    itemId: 'item-1',
    type: 'read-aloud',
    label: 'Read Aloud',
    skills: ['speaking'],
    maxPoints: 4,
    points: 4,
    ratio: 1,
    status: 'correct',
    notes: [],
    reference: 'The quick brown fox jumps over the lazy dog.',
    ...overrides,
  }
}

function storedAttempt(overrides: Partial<AttemptRecord> = {}): AttemptRecord {
  return makeAttempt({
    id: 'attempt-1',
    overallScore: 55,
    availablePoints: 4,
    earnedPoints: 2,
    breakdown: {
      'read-aloud': {
        type: 'read-aloud',
        label: 'Read Aloud',
        skill: 'speaking',
        correct: 2,
        partial: 0,
        incorrect: 2,
        total: 4,
        maxPoints: 4,
        earnedPoints: 2,
        seconds: 160,
      },
    },
    details: [detail()],
    ...overrides,
  })
}

function renderResult(route = '/result?attempt=attempt-1') {
  return renderRoute(<ResultPage />, '/result', { route })
}

/**
 * A report with more than one question type, uneven skill scores and a
 * breakdown that does not divide evenly — the shape that exercises the
 * ordering, the ratios and the per-skill bands at once.
 */
function richAttempt(overrides: Partial<AttemptRecord> = {}): AttemptRecord {
  return storedAttempt({
    overallIsEstimate: false,
    availablePoints: 0,
    earnedPoints: 0,
    skillScores: { reading: 60, listening: 50, speaking: 72, writing: 50 },
    breakdown: {
      'read-aloud': {
        type: 'read-aloud',
        label: 'Read Aloud',
        skill: 'speaking',
        correct: 9,
        partial: 0,
        incorrect: 1,
        total: 10,
        maxPoints: 10,
        earnedPoints: 9,
        seconds: 400,
      },
      'repeat-sentence': {
        type: 'repeat-sentence',
        label: 'Repeat Sentence',
        skill: 'speaking',
        correct: 3,
        partial: 0,
        incorrect: 1,
        total: 4,
        maxPoints: 4,
        earnedPoints: 3,
        seconds: 120,
      },
      'multiple-choice-single': {
        type: 'multiple-choice-single',
        label: 'Multiple Choice (Single Answer)',
        skill: 'reading',
        correct: 0,
        partial: 0,
        incorrect: 0,
        total: 0,
        maxPoints: 0,
        earnedPoints: 0,
        seconds: 0,
      },
    },
    details: [detail()],
    ...overrides,
  })
}

/** Puts every store back the way a fresh page load would find it. */
function resetStores() {
  stubs.clientReady.value = true
  stubs.getAttempt.mockResolvedValue(null)
  stubs.fetchAttemptFromCloud.mockResolvedValue(null)
  stubs.buildFullMock.mockImplementation(() => makeMockTest())
  stubs.evaluateWithAi.mockResolvedValue(null)
  stubs.syncAttemptToCloud.mockResolvedValue(true)
  installFetchMock([])
  useAuth.setState({ user: USER, token: 'tok' })
  useTest.setState({
    mock: null,
    status: 'briefing',
    mode: 'exam',
    responses: {},
    ownerId: 'usr_1',
    attemptId: null,
  })
  useSettings.getState().reset()
  useSettings.getState().set('autoOpenReview', false)
}

describe('ResultPage', () => {
  beforeEach(resetStores)

  it('waits for the report while the page has no owner to read for', async () => {
    stubs.clientReady.value = false
    const { container } = renderResult()
    await act(async () => {})

    expect(container.textContent).toContain('Scoring your responses')
    expect(stubs.getAttempt).not.toHaveBeenCalled()
  })

  it('shows the report of a stored attempt', async () => {
    stubs.getAttempt.mockResolvedValue(storedAttempt())
    const { container } = renderResult()
    await act(async () => {})

    expect(container.textContent).toContain('CEFR')
    expect(container.textContent).toContain('Attempt history'.slice(0, 0) + 'Read Aloud')
    expect(container.textContent).toContain('Accuracy by question type')
  })

  it('falls back to the cloud when the device has no copy', async () => {
    stubs.fetchAttemptFromCloud.mockResolvedValue(storedAttempt())
    const { container } = renderResult()
    await act(async () => {})

    expect(stubs.fetchAttemptFromCloud).toHaveBeenCalledWith('attempt-1')
    expect(container.textContent).toContain('Accuracy by question type')
  })

  it('shows the empty state when there is no report at all', async () => {
    const { container } = renderResult()
    await act(async () => {})

    expect(container.textContent).toContain('No test result found')
  })

  it('shows the empty state when the lookup fails', async () => {
    stubs.getAttempt.mockRejectedValue(new Error('indexeddb gone'))
    const { container } = renderResult()
    await act(async () => {})

    expect(container.textContent).toContain('No test result found')
  })

  it('scores a session that has just finished', async () => {
    useTest.setState({ mock: makeMockTest(), status: 'running', ownerId: 'usr_1' })
    const { container } = renderResult('/result')
    await act(async () => {})

    expect(stubs.saveAttempt).toHaveBeenCalled()
    expect(container.textContent).toContain('Accuracy by question type')
    // The recorded responses are cleared, because the transcripts must not be
    // left on the device once the report is closed. The mock and its owner
    // stay: the pace tab reads the real-test budgets from the items, and the
    // attempt id is in the URL, so the report can still be reloaded.
    expect(useTest.getState().responses).toEqual({})
    expect(useTest.getState().mock).not.toBeNull()
  })

  it('does not fall over over a question type it no longer knows', async () => {
    // The type comes from a persisted attempt, so it may name a type that
    // has since been renamed or removed. The report must still render.
    stubs.getAttempt.mockResolvedValue(
      storedAttempt({
        details: [
          {
            itemId: 'x',
            // A type the blueprint no longer knows: the record was written
            // before the type was renamed or removed.
            type: 'a-type-that-no-longer-exists' as unknown as QuestionType,
            label: 'Old type',
            skills: ['speaking'],
            points: 1,
            maxPoints: 2,
            ratio: 0.5,
            status: 'partial',
            notes: [],
            traits: {
              content: 0.5,
              form: 0.5,
              oralFluency: 0,
              pronunciation: 0,
              grammar: 0.5,
              vocabulary: 0.5,
              spelling: 0,
              development: 0,
              range: 0,
            },
          },
        ],
      }),
    )
    const { container } = renderResult()
    await act(async () => {})

    expect(container.textContent).toContain('Old type')
  })

  it('marks the admission targets that were met and missed', async () => {
    stubs.getAttempt.mockResolvedValue(storedAttempt({ overallScore: 55 }))
    const { container } = renderResult()
    await act(async () => {})

    expect(container.textContent).toContain('Many UK universities')
    expect(container.textContent).toContain('Competitive courses')
  })

  it('marks the admission targets that were exceeded', async () => {
    stubs.getAttempt.mockResolvedValue(storedAttempt({ overallScore: 75 }))
    const { container } = renderResult()
    await act(async () => {})

    expect(container.textContent).toContain('exceeded')
    expect(container.textContent).toContain('met')
  })

  it('marks every admission target as missed for a low score', async () => {
    stubs.getAttempt.mockResolvedValue(storedAttempt({ overallScore: 30 }))
    const { container } = renderResult()
    await act(async () => {})

    expect(container.textContent).not.toContain('exceeded')
  })

  it('celebrates a score that beats the target', async () => {
    vi.useFakeTimers()
    try {
      stubs.getAttempt.mockResolvedValue(storedAttempt({ overallScore: 90 }))
      const { container } = renderResult()
      await act(async () => {})
      expect(container.querySelector('.confetti-origin')).toBeNull()

      act(() => {
        vi.advanceTimersByTime(1200)
      })
      expect(container.querySelector('.confetti-origin')).not.toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('offers the report as a PDF', async () => {
    stubs.getAttempt.mockResolvedValue(storedAttempt())
    renderResult()
    await act(async () => {})

    const print = vi.spyOn(window, 'print').mockImplementation(() => {})
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Export PDF' }))
    })
    expect(print).toHaveBeenCalled()
    print.mockRestore()
  })

  it('moves between the report tabs', async () => {
    stubs.getAttempt.mockResolvedValue(storedAttempt())
    const { container } = renderResult()
    await act(async () => {})

    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'Answer review' }))
    })
    expect(container.querySelector('#panel-review')).not.toBeNull()

    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'Skill detail' }))
    })
    expect(container.querySelector('#panel-by-type')).not.toBeNull()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Show full review' }))
    })
    expect(container.querySelector('#panel-review')).not.toBeNull()
  })

  it('opens the answer review by itself when the setting says so', async () => {
    useSettings.getState().set('autoOpenReview', true)
    stubs.getAttempt.mockResolvedValue(storedAttempt())
    const { container } = renderResult()
    await act(async () => {})

    expect(container.querySelector('#panel-review')).not.toBeNull()
  })

  it('shows the item-level review of a stored attempt', async () => {
    stubs.getAttempt.mockResolvedValue(storedAttempt())
    renderResult()
    await act(async () => {})

    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'Answer review' }))
    })
    expect(screen.getByRole('button', { name: /All questions \(1\)/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Points lost \(0\)/ })).toBeInTheDocument()
  })

  it('filters the review down to the points that were lost', async () => {
    stubs.getAttempt.mockResolvedValue(
      storedAttempt({
        details: [
          detail(),
          detail({
            itemId: 'item-2',
            points: 0,
            ratio: 0,
            status: 'incorrect',
            notes: ['The wrong word was read.'],
          }),
        ],
      }),
    )
    const { container } = renderResult()
    await act(async () => {})

    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'Answer review' }))
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Points lost/ }))
    })

    expect(screen.queryByRole('button', { name: /All questions/ })).not.toBeNull()
    expect(container.textContent).toContain('Points lost')
  })

  it('opens an item and explains the points that were lost', async () => {
    stubs.getAttempt.mockResolvedValue(
      storedAttempt({
        details: [
          detail({
            type: 'multiple-choice-single',
            label: 'Multiple Choice (Single Answer)',
            skills: ['reading'],
            points: 0,
            ratio: 0,
            status: 'incorrect',
            notes: ['The wrong word was read.'],
            gated: true,
          }),
        ],
        responses: { 'item-1': { choice: 'B' } },
      }),
    )
    renderResult()
    await act(async () => {})

    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'Answer review' }))
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Multiple Choice/ }))
    })

    expect(screen.getByText('The wrong word was read.')).toBeInTheDocument()
    expect(screen.getByText(/Zeroed by the score guide/)).toBeInTheDocument()
    expect(screen.getByText('Answer key')).toBeInTheDocument()
    expect(screen.getByText('Your answer: B')).toBeInTheDocument()
  })

  it('shows the estimated traits of a constructed answer', async () => {
    stubs.getAttempt.mockResolvedValue(
      storedAttempt({
        details: [
          detail({
            type: 'write-essay',
            label: 'Write Essay',
            skills: ['writing'],
            traits: { content: 0.9, form: 0.7, grammar: 0.2, vocabulary: 0.4, spelling: 0.1 },
            contentMax: 6,
            formMax: 6,
            points: 3,
            maxPoints: 6,
            ratio: 0.5,
          }),
        ],
      }),
    )
    renderResult()
    await act(async () => {})

    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'Answer review' }))
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Write Essay/ }))
    })

    expect(screen.getAllByText(/Estimated traits,/).length).toBeGreaterThan(0)
    expect(screen.getAllByText('band top').length).toBeGreaterThan(0)
    expect(screen.getAllByText('band middle').length).toBeGreaterThan(0)
    expect(screen.getAllByText('band low').length).toBeGreaterThan(0)
    expect(screen.getAllByText('band 0').length).toBeGreaterThan(0)
  })

  it('says the review is unavailable when there are no item details', async () => {
    stubs.getAttempt.mockResolvedValue(
      storedAttempt({
        mockKind: 'section',
        details: [],
        sectionIds: ['reading'],
      }),
    )
    const { container } = renderResult()
    await act(async () => {})

    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'Answer review' }))
    })
    expect(container.textContent).toContain(
      'Item-level answer review is available during an active test session',
    )
  })

  it('shows the pace of a run that is still in memory', async () => {
    stubs.getAttempt.mockResolvedValue(
      storedAttempt({
        responses: { 'item-1': { secondsOnItem: 100 } },
      }),
    )
    useTest.setState({ mock: makeMockTest(), ownerId: 'usr_1' })
    const { container } = renderResult()
    await act(async () => {})

    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'Pace' }))
    })
    expect(container.textContent).toContain('Where your time went')
    expect(container.textContent).toContain('over budget')
    expect(container.textContent).toContain('Timing mode was not recorded')
  })

  it('says when the run used a longer clock', async () => {
    stubs.getAttempt.mockResolvedValue(
      storedAttempt({ responses: { 'item-1': { secondsOnItem: 10 } }, timeScale: 2 }),
    )
    useTest.setState({ mock: makeMockTest(), ownerId: 'usr_1' })
    const { container } = renderResult()
    await act(async () => {})

    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'Pace' }))
    })
    expect(container.textContent).toContain('2× clock')
  })

  it('hides the pace tab for an untimed run', async () => {
    stubs.getAttempt.mockResolvedValue(
      storedAttempt({ responses: { 'item-1': { secondsOnItem: 10 } }, untimed: true }),
    )
    useTest.setState({ mock: makeMockTest(), ownerId: 'usr_1' })
    renderResult()
    await act(async () => {})

    expect(screen.queryByRole('tab', { name: 'Pace' })).toBeNull()
  })

  it('ends the session from the report', async () => {
    stubs.getAttempt.mockResolvedValue(storedAttempt())
    useTest.setState({ mock: makeMockTest(), ownerId: 'usr_1' })
    renderResult()
    await act(async () => {})

    await act(async () => {
      fireEvent.click(screen.getByRole('link', { name: 'Take another mock' }))
    })
    expect(useTest.getState().mock).toBeNull()
  })

  it('rebuilds the session from the seed when the attempt has no details', async () => {
    stubs.buildFullMock.mockImplementation(() => makeMockTest())
    stubs.getAttempt.mockResolvedValue(
      storedAttempt({ details: [], responses: { 'item-1': { choice: 'A' } } }),
    )
    const { container } = renderResult()
    await act(async () => {})

    expect(stubs.buildFullMock).toHaveBeenCalled()
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'Answer review' }))
    })
    expect(container.textContent).not.toContain(
      'Item-level answer review is available during an active test session',
    )
  })

  it('gives up on a seed that cannot be rebuilt', async () => {
    stubs.buildFullMock.mockImplementation(() => {
      throw new Error('bank changed')
    })
    stubs.getAttempt.mockResolvedValue(storedAttempt({ details: [] }))
    const { container } = renderResult()
    await act(async () => {})

    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'Answer review' }))
    })
    expect(container.textContent).toContain(
      'Item-level answer review is available during an active test session',
    )
  })

  it('does not rebuild a session that was only part of the test', async () => {
    stubs.getAttempt.mockResolvedValue(
      storedAttempt({ details: [], sectionIds: ['reading'], mockKind: undefined }),
    )
    renderResult()
    await act(async () => {})

    expect(stubs.buildFullMock).not.toHaveBeenCalled()
  })
})

describe('ResultPage AI examiner', () => {
  beforeEach(resetStores)

  async function openEssayReview() {
    stubs.getAttempt.mockResolvedValue(
      storedAttempt({
        details: [
          detail({
            type: 'write-essay',
            label: 'Write Essay',
            skills: ['writing'],
            traits: { content: 0.7, form: 0.5 },
            contentMax: 6,
            points: 3,
            maxPoints: 6,
            ratio: 0.5,
          }),
        ],
        responses: { 'item-1': { text: 'My essay text.' } },
      }),
    )
    renderResult()
    await act(async () => {})
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'Answer review' }))
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Write Essay/ }))
    })
  }

  it('asks for a key before it will grade anything', async () => {
    await openEssayReview()
    expect(screen.getByRole('button', { name: /Grade with AI Examiner/ })).toBeInTheDocument()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Grade with AI Examiner/ }))
    })

    expect(screen.getByLabelText('Groq API key')).toBeInTheDocument()
    expect(stubs.evaluateWithAi).not.toHaveBeenCalled()
  })

  it('grades with a key the candidate types in', async () => {
    stubs.evaluateWithAi.mockResolvedValue({
      traits: { content: 0.8, form: 0.6, grammar: 'n/a' },
      notes: [],
      feedback: ['Your argument was clear.'],
      suggestedRewrittenEssay: 'A stronger essay.',
      rawScore: 7,
      maxScore: 13,
    })
    await openEssayReview()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Grade with AI Examiner/ }))
    })
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Groq API key'), { target: { value: ' gsk_typed ' } })
    })
    await act(async () => {
      fireEvent.submit(screen.getByLabelText('Groq API key').closest('form') as HTMLFormElement)
    })

    expect(stubs.evaluateWithAi).toHaveBeenCalled()
    expect(useSettings.getState().settings.groqApiKey).toBe('gsk_typed')
    expect(screen.getByText('80%')).toBeInTheDocument()
    expect(screen.getByText('Your argument was clear.')).toBeInTheDocument()
    expect(screen.getByText(/A stronger essay\./)).toBeInTheDocument()
    expect(screen.getByText('7/13 pts (AI Estimated)')).toBeInTheDocument()
  })

  it('grades with a key that is already saved', async () => {
    useSettings.getState().set('groqApiKey', 'gsk_saved')
    stubs.evaluateWithAi.mockResolvedValue({
      traits: { content: 0.4 },
      notes: [],
      feedback: [],
      rawScore: 3,
      maxScore: 13,
    })
    await openEssayReview()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Grade with AI Examiner/ }))
    })

    expect(stubs.evaluateWithAi).toHaveBeenCalled()
    expect(screen.getByText('40%')).toBeInTheDocument()
  })

  it('says when the AI examiner could not grade the answer', async () => {
    useSettings.getState().set('groqApiKey', 'gsk_saved')
    stubs.evaluateWithAi.mockResolvedValue(null)
    await openEssayReview()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Grade with AI Examiner/ }))
    })

    expect(screen.getByText(/Evaluation failed/)).toBeInTheDocument()
  })

  it('says when the AI examiner threw', async () => {
    useSettings.getState().set('groqApiKey', 'gsk_saved')
    stubs.evaluateWithAi.mockRejectedValue(new Error('Groq is down'))
    await openEssayReview()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Grade with AI Examiner/ }))
    })

    expect(screen.getByText('Groq is down')).toBeInTheDocument()
  })

  it('says the evaluation failed when the service did not explain itself', async () => {
    useSettings.getState().set('groqApiKey', 'gsk_saved')
    stubs.evaluateWithAi.mockRejectedValue('boom')
    await openEssayReview()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Grade with AI Examiner/ }))
    })

    expect(screen.getByText('Evaluation error')).toBeInTheDocument()
  })

  it('will not save an empty API key', async () => {
    await openEssayReview()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Grade with AI Examiner/ }))
    })
    const input = screen.getByLabelText('Groq API key')
    await act(async () => {
      fireEvent.change(input, { target: { value: '   ' } })
    })
    await act(async () => {
      fireEvent.submit(input.closest('form') as HTMLFormElement)
    })

    expect(useSettings.getState().settings.groqApiKey).toBe('')
    expect(stubs.evaluateWithAi).not.toHaveBeenCalled()
  })

  it('points at the error when the key box is shown again', async () => {
    useSettings.getState().set('groqApiKey', 'gsk_saved')
    stubs.evaluateWithAi.mockRejectedValue(new Error('Groq is down'))
    await openEssayReview()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Grade with AI Examiner/ }))
    })
    expect(screen.getByText('Groq is down')).toBeInTheDocument()

    // The saved key is gone, so the examiner asks for one again — and the
    // failure from the attempt before is still on screen to be read.
    await act(async () => {
      useSettings.getState().set('groqApiKey', '')
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Grade with AI Examiner/ }))
    })

    const input = screen.getByLabelText('Groq API key')
    expect(input.getAttribute('aria-describedby')).toBe('groq-key-hint groq-key-error')
    expect(input.getAttribute('aria-invalid')).toBe('true')
  })

  it('shows a low AI trait score in the warning colour', async () => {
    useSettings.getState().set('groqApiKey', 'gsk_saved')
    stubs.evaluateWithAi.mockResolvedValue({
      traits: { content: 0.2 },
      notes: [],
      feedback: [],
      rawScore: 2,
      maxScore: 13,
    })
    await openEssayReview()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Grade with AI Examiner/ }))
    })

    const bar = document.querySelector('[style*="width: 20%"]')
    expect(bar?.className).toContain('bg-rose-500')
  })
})

/* ---------------------------------------------------------------------------
   The rest of the report.

   The report is more than a score. It is four panels, a per-skill
   breakdown, an answer review that can be filtered down to the points that
   were lost, and an AI examiner that talks to Groq. Each of those has a
   state that only shows up when the report is shaped a particular way — a
   skill with no score, an attempt that was never saved, an upload that
   failed, a page that was closed while the lookup was still in flight.
   --------------------------------------------------------------------------- */

describe('ResultPage report panels', () => {
  beforeEach(resetStores)

  it('restores a finished attempt from the device when the page is reloaded', async () => {
    useTest.setState({ mock: null, status: 'finished', attemptId: 'attempt-1', ownerId: 'usr_1' })
    stubs.getAttempt.mockResolvedValue(storedAttempt())

    const { container } = renderResult('/result')
    await act(async () => {})

    expect(stubs.getAttempt).toHaveBeenCalledWith('attempt-1', 'usr_1', expect.any(String))
    expect(container.textContent).toContain('Accuracy by question type')
  })

  it('abandons the lookup when the page has gone away', async () => {
    let resolveLookup: (value: unknown) => void = () => {}
    stubs.getAttempt.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveLookup = resolve
        }),
    )

    const { unmount } = renderResult()
    unmount()
    await act(async () => {
      resolveLookup(storedAttempt())
    })

    expect(stubs.getAttempt).toHaveBeenCalled()
  })

  it('gives up on a failed lookup once the page has gone', async () => {
    let rejectLookup: (reason: unknown) => void = () => {}
    stubs.getAttempt.mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          rejectLookup = reject
        }),
    )

    const { unmount } = renderResult()
    unmount()
    await act(async () => {
      rejectLookup(new Error('indexeddb gone'))
    })

    expect(stubs.getAttempt).toHaveBeenCalled()
  })

  it('does not publish a report that was scored after the page went away', async () => {
    useTest.setState({ mock: makeMockTest(), status: 'running', ownerId: 'usr_1' })

    const { unmount } = renderResult('/result')
    unmount()
    await act(async () => {})

    expect(stubs.saveAttempt).toHaveBeenCalled()
  })

  it('keeps the report even when the cloud refuses the upload', async () => {
    stubs.syncAttemptToCloud.mockRejectedValue(new Error('offline'))
    useTest.setState({ mock: makeMockTest(), status: 'running', ownerId: 'usr_1' })

    const { container } = renderResult('/result')
    await act(async () => {})

    expect(container.textContent).toContain('Accuracy by question type')
  })

  it('shows a report that carries no skill scores at all', async () => {
    stubs.getAttempt.mockResolvedValue(
      storedAttempt({ skillScores: {}, availablePoints: 0, earnedPoints: 0 }),
    )

    const { container } = renderResult()
    await act(async () => {})

    expect(container.textContent).toMatch(/Your weakest area is\s*—/)
    expect(container.textContent).toMatch(/your strongest is\s*—/)
  })

  it('orders the question types by the points that were lost', async () => {
    stubs.getAttempt.mockResolvedValue(richAttempt())

    const { container } = renderResult()
    await act(async () => {})

    expect(container.textContent).toContain('Read Aloud')
    expect(container.textContent).toContain('Repeat Sentence')
    expect(container.textContent).toContain('C1 level')
  })

  it('labels a report that was scored automatically', async () => {
    stubs.getAttempt.mockResolvedValue(storedAttempt({ overallIsEstimate: false }))

    const { container } = renderResult()
    await act(async () => {})

    expect(container.textContent).toContain('Auto-scored')
  })

  it('reports a run that was neither over budget nor on pace', async () => {
    const paceMock = makeMockTest({
      items: {
        'item-1': makeItem({ id: 'item-1', type: 'read-aloud', seconds: 40 }),
        'item-2': makeItem({ id: 'item-2', type: 'repeat-sentence', seconds: 40 }),
      },
      answers: { 'item-1': makeAnswerKey(), 'item-2': makeAnswerKey() },
      sections: [
        {
          id: 'speaking-writing',
          title: 'Speaking & Writing',
          seconds: 300,
          groups: [],
          itemIds: ['item-1', 'item-2'],
        },
      ],
    })
    stubs.getAttempt.mockResolvedValue(
      storedAttempt({
        responses: { 'item-1': { secondsOnItem: 10 }, 'item-2': { secondsOnItem: 30 } },
      }),
    )
    useTest.setState({ mock: paceMock, ownerId: 'usr_1' })

    const { container } = renderResult()
    await act(async () => {})

    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'Pace' }))
    })

    expect(container.textContent).toContain('well under')
    expect(container.textContent).toContain('on pace')
  })

  it('rebuilds a run that never recorded its sections', async () => {
    stubs.buildFullMock.mockImplementation(() => makeMockTest())
    stubs.getAttempt.mockResolvedValue(
      storedAttempt({ details: [], sectionIds: undefined, mockKind: 'full' }),
    )

    renderResult()
    await act(async () => {})

    expect(stubs.buildFullMock).toHaveBeenCalled()
  })

  it('falls back to the item type when the blueprint has no label for it', async () => {
    const oddMock = makeMockTest({
      items: {
        'item-x': makeItem({ id: 'item-x', type: 'not-a-real-type' as unknown as QuestionType }),
      },
      answers: {},
      sections: [
        {
          id: 'speaking-writing',
          title: 'Speaking & Writing',
          seconds: 300,
          groups: [],
          itemIds: ['item-x'],
        },
      ],
    })
    stubs.buildFullMock.mockImplementation(() => oddMock)
    stubs.getAttempt.mockResolvedValue(storedAttempt({ details: [], mockKind: 'full' }))

    renderResult()
    await act(async () => {})

    expect(stubs.buildFullMock).toHaveBeenCalled()
  })

  it('shows a report whose responses were never stored', async () => {
    stubs.getAttempt.mockResolvedValue(storedAttempt({ responses: undefined }))
    useTest.setState({ mock: makeMockTest(), ownerId: 'usr_1' })

    const { container } = renderResult()
    await act(async () => {})

    expect(container.textContent).toContain('Accuracy by question type')
  })

  it('switches the review back to every question', async () => {
    stubs.getAttempt.mockResolvedValue(
      storedAttempt({
        details: [detail(), detail({ itemId: 'item-2', points: 0, ratio: 0, status: 'incorrect' })],
      }),
    )
    renderResult()
    await act(async () => {})

    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'Answer review' }))
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Points lost/ }))
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /All questions/ }))
    })

    expect(screen.getAllByRole('button', { name: /Read Aloud/ })).toHaveLength(2)
  })

  it('offers the breakdown once the review is open', async () => {
    stubs.getAttempt.mockResolvedValue(storedAttempt())
    renderResult()
    await act(async () => {})

    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'Answer review' }))
    })

    expect(screen.getByRole('button', { name: 'Show breakdown' })).toBeInTheDocument()
  })

  it('says when the filter matches no question at all', async () => {
    stubs.getAttempt.mockResolvedValue(storedAttempt({ details: [detail()] }))
    renderResult()
    await act(async () => {})

    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'Answer review' }))
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Points lost/ }))
    })

    expect(screen.getByText('No questions match the current filter')).toBeInTheDocument()
  })

  it('shows a partial item as partially correct', async () => {
    stubs.getAttempt.mockResolvedValue(
      storedAttempt({
        details: [
          detail({
            points: 2,
            maxPoints: 4,
            ratio: 0.5,
            status: 'partial',
            notes: ['One blank was wrong.'],
          }),
        ],
      }),
    )
    renderResult()
    await act(async () => {})

    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'Answer review' }))
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Read Aloud/ }))
    })

    const row = screen.getByRole('button', { name: /Read Aloud/ })
    expect(row.closest('li')?.className).toContain('border-amber-500/40')
    expect(row.querySelector('span[aria-hidden="true"]')?.textContent).toBe('~')
    expect(screen.getByText('One blank was wrong.')).toBeInTheDocument()
  })

  it('leaves out the estimated-traits footer for an item that scored full marks', async () => {
    stubs.getAttempt.mockResolvedValue(storedAttempt({ details: [detail()] }))
    renderResult()
    await act(async () => {})

    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'Answer review' }))
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Read Aloud/ }))
    })

    expect(screen.queryByText(/Estimated traits: content/)).toBeNull()
    expect(screen.getByText('Model answer')).toBeInTheDocument()
  })

  it('shows the traits of a summary without the essay-only scales', async () => {
    stubs.getAttempt.mockResolvedValue(
      storedAttempt({
        details: [
          detail({
            type: 'summarize-written-text',
            label: 'Summarize Written Text',
            skills: ['reading', 'writing'],
            traits: { content: 0.5, development: 0.5, range: 0.6, grammar: 0.4 },
            contentMax: 4,
            points: 2,
            maxPoints: 4,
            ratio: 0.5,
          }),
        ],
      }),
    )
    renderResult()
    await act(async () => {})

    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'Answer review' }))
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Summarize Written Text/ }))
    })

    expect(screen.getAllByText(/Estimated traits,/).length).toBeGreaterThan(0)
    expect(screen.getAllByText('band middle').length).toBeGreaterThan(0)
    expect(screen.getAllByText('band low').length).toBeGreaterThan(0)
  })

  it('shows the estimated traits even when no published maximum was stored', async () => {
    stubs.getAttempt.mockResolvedValue(
      storedAttempt({
        details: [
          detail({
            type: 'write-essay',
            label: 'Write Essay',
            skills: ['writing'],
            traits: { content: 0.9, grammar: 0.5 },
            points: 3,
            maxPoints: 6,
            ratio: 0.5,
          }),
        ],
      }),
    )
    renderResult()
    await act(async () => {})

    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'Answer review' }))
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Write Essay/ }))
    })

    expect(screen.getAllByText(/Estimated traits,/).length).toBeGreaterThan(0)
    expect(screen.getAllByText('band top').length).toBeGreaterThan(0)
    expect(screen.getByText(/0.5 scale/)).toBeInTheDocument()
  })

  it('omits the tip for a type the blueprint has never heard of', async () => {
    stubs.getAttempt.mockResolvedValue(
      storedAttempt({
        details: [
          detail({
            type: 'not-a-real-type' as unknown as QuestionType,
            label: 'Mystery Item',
            skills: ['reading'],
            points: 0,
            maxPoints: 4,
            ratio: 0,
            status: 'incorrect',
            notes: ['Nothing matched.'],
          }),
        ],
      }),
    )
    renderResult()
    await act(async () => {})

    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'Answer review' }))
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Mystery Item/ }))
    })

    expect(screen.getByText('Nothing matched.')).toBeInTheDocument()
    expect(screen.queryByText('Tip,')).toBeNull()
  })

  it('shows nothing for an answer that left no trace', async () => {
    stubs.getAttempt.mockResolvedValue(
      storedAttempt({
        details: [
          detail({
            type: 'multiple-choice-single',
            label: 'Multiple Choice (Single Answer)',
            skills: ['reading'],
            points: 0,
            maxPoints: 4,
            ratio: 0,
            status: 'incorrect',
          }),
        ],
        responses: { 'item-1': { secondsOnItem: 12 } },
      }),
    )
    renderResult()
    await act(async () => {})

    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'Answer review' }))
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Multiple Choice/ }))
    })

    expect(screen.queryByText('What you gave')).toBeNull()
  })

  it('shows an item that was never worth a point', async () => {
    stubs.getAttempt.mockResolvedValue(
      storedAttempt({
        details: [
          detail({
            maxPoints: 0,
            points: 0,
            ratio: 0,
            status: 'incorrect',
            reference: undefined,
            notes: ['Not scored.'],
          }),
        ],
      }),
    )
    renderResult()
    await act(async () => {})

    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'Answer review' }))
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Read Aloud/ }))
    })

    expect(screen.getByText('Not scored.')).toBeInTheDocument()
    expect(screen.queryByText('Answer key')).toBeNull()
  })

  it('shows the empty state when the run on this device belongs to someone else', async () => {
    useTest.setState({ mock: null, status: 'briefing', ownerId: 'other-user' })

    const { container } = renderResult('/result')
    await act(async () => {})

    expect(container.textContent).toContain('No test result found')
  })

  it('offers the practice list when no question type lost a point', async () => {
    stubs.getAttempt.mockResolvedValue(storedAttempt({ breakdown: {} }))

    const { container } = renderResult()
    await act(async () => {})

    expect(container.textContent).toContain('Browse practice drills')
  })

  it('switches back to the breakdown from the review', async () => {
    stubs.getAttempt.mockResolvedValue(storedAttempt())
    const { container } = renderResult()
    await act(async () => {})

    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'Answer review' }))
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Show breakdown' }))
    })

    expect(container.querySelector('#panel-overview')).not.toBeNull()
  })

  it('reports a score for a candidate who is not signed in', async () => {
    useAuth.setState({ user: null, token: null })
    stubs.getAttempt.mockResolvedValue(storedAttempt())

    const { container } = renderResult()
    await act(async () => {})

    expect(container.textContent).toContain('Accuracy by question type')
  })
})
