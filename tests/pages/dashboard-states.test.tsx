import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, screen } from '@testing-library/react'
import { renderRoute } from '../helpers/render'
import { installFetchMock } from '../helpers/fetch'
import { makeAttempt } from '../helpers/factories'
import { useAuth } from '../../src/store/useAuth'
import { useSettings } from '../../src/store/useSettings'
import type { AttemptRecord, TypeStat } from '../../src/domain/types'

/* ---------------------------------------------------------------------------
   The progress dashboard.

   Almost everything on this page is conditional: which panel is shown depends
   on the history behind it, and the history comes from the device and the
   cloud. The store and the sync layer are stubbed so the page can be given a
   history to present.
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
  syncCloudToLocal: vi.fn(async () => ({ pushed: 0, pulled: 0, failed: 0 })),
  countGuestAttempts: vi.fn(async () => 0),
  claimGuestAttemptsForCurrentUser: vi.fn(async () => 0),
  deleteAttemptEverywhere: vi.fn(async () => true),
  clearAllAttemptsEverywhere: vi.fn(async () => true),
  syncAttemptToCloud: vi.fn(async () => true),
  fetchAttemptFromCloud: vi.fn(async () => null as unknown),
  canPushAttemptToCloud: vi.fn(() => false),
  planSyncReconciliation: vi.fn(() => ({ toPull: [], toPush: [] })),
  validateGroqKey: vi.fn(async (): Promise<{ ok: boolean; error?: string }> => ({ ok: true })),
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
  validateGroqKey: stubs.validateGroqKey,
}))

vi.mock('../../src/lib/useClientReady', () => ({
  useClientReady: () => stubs.clientReady.value,
}))

const Dashboard = (await import('../../src/pages/Dashboard')).default

const USER = { id: 'usr_1', email: 'a@b.c', targetScore: 60 }

function stat(overrides: Partial<TypeStat> = {}): TypeStat {
  return {
    type: 'read-aloud',
    label: 'Read Aloud',
    skill: 'speaking',
    correct: 2,
    partial: 0,
    incorrect: 2,
    total: 4,
    maxPoints: 4,
    earnedPoints: 2,
    seconds: 120,
    ...overrides,
  }
}

function attemptWithBreakdown(overrides: Partial<AttemptRecord> = {}): AttemptRecord {
  return makeAttempt({
    id: 'attempt-1',
    finishedAt: '2026-01-02T00:00:00.000Z',
    overallScore: 55,
    breakdown: { 'read-aloud': stat() },
    ...overrides,
  })
}

function renderDashboard() {
  return renderRoute(<Dashboard />, '/dashboard')
}

describe('Dashboard sync reporting', () => {
  beforeEach(() => {
    stubs.clientReady.value = true
    stubs.listAttempts.mockResolvedValue([])
    installFetchMock([])
    useAuth.setState({ user: null, token: null, hasLoggedInBefore: false })
  })

  it('says when an attempt could not be backed up', async () => {
    stubs.syncCloudToLocal.mockResolvedValue({ pushed: 0, pulled: 0, failed: 2 })
    renderDashboard()

    // The attempt is still only on this device, so the candidate is told.
    await act(async () => {})
    expect(screen.getByText(/could not be backed up/i)).toBeInTheDocument()
  })
})

describe('Dashboard account state', () => {
  beforeEach(() => {
    stubs.clientReady.value = true
    stubs.listAttempts.mockResolvedValue([])
    stubs.syncCloudToLocal.mockResolvedValue({ pushed: 0, pulled: 0, failed: 0 })
    installFetchMock([])
    useAuth.setState({ user: null, token: null, hasLoggedInBefore: false })
    useSettings.getState().reset()
  })

  it('reads no history while the page is still the prerendered one', async () => {
    stubs.clientReady.value = false
    renderDashboard()
    await act(async () => {})

    expect(stubs.listAttempts).not.toHaveBeenCalled()
  })

  it('shows a signed-out candidate that the history is on this device', async () => {
    const { container } = renderDashboard()
    await act(async () => {})

    expect(container.textContent).toContain('Saved locally on this device')
    expect(container.textContent).toContain('Local storage')
  })

  it('offers a first-time candidate an account', async () => {
    renderDashboard()
    await act(async () => {})

    expect(screen.getByRole('link', { name: 'Create free account' })).toHaveAttribute('href', '/register')
  })

  it('offers a returning candidate a sign-in', async () => {
    useAuth.setState({ hasLoggedInBefore: true })
    renderDashboard()
    await act(async () => {})

    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login')
  })

  it('shows a signed-in candidate that the history is in the cloud', async () => {
    useAuth.setState({ user: USER, token: 'tok', hasLoggedInBefore: true })
    const { container } = renderDashboard()
    await act(async () => {})

    expect(container.textContent).toContain('Cloud account active')
    expect(container.textContent).toContain(`Account: ${USER.email} · Target: ${USER.targetScore}`)
    expect(screen.getByRole('link', { name: 'Manage account' })).toHaveAttribute('href', '/login')
  })

  it('does not paint the previous account history after the session changes', async () => {
    useAuth.setState({ user: USER, token: 'tok' })
    installFetchMock([
      { url: '/api/auth/me', body: { user: { id: 'usr_2', email: 'other@b.c', targetScore: 60 } } },
    ])
    const { container } = renderDashboard()
    await act(async () => {})

    expect(container.textContent).not.toContain('Attempt history')
  })

  it('says how much was synced with the cloud', async () => {
    stubs.syncCloudToLocal.mockResolvedValue({ pushed: 1, pulled: 0, failed: 0 })
    renderDashboard()
    await act(async () => {})

    expect(document.body.textContent).toContain('Synced 1 change with the cloud')
  })

  it('says how many changes were synced with the cloud', async () => {
    stubs.syncCloudToLocal.mockResolvedValue({ pushed: 0, pulled: 2, failed: 0 })
    renderDashboard()
    await act(async () => {})

    expect(document.body.textContent).toContain('Synced 2 changes with the cloud')
  })
})

describe('Dashboard history', () => {
  beforeEach(() => {
    stubs.clientReady.value = true
    stubs.listAttempts.mockResolvedValue([])
    stubs.syncCloudToLocal.mockResolvedValue({ pushed: 0, pulled: 0, failed: 0 })
    stubs.deleteAttemptEverywhere.mockResolvedValue(true)
    stubs.clearAllAttemptsEverywhere.mockResolvedValue(true)
    installFetchMock([])
    useAuth.setState({ user: null, token: null, hasLoggedInBefore: false })
    useSettings.getState().reset()
  })

  it('shows the empty state when there is no history', async () => {
    const { container } = renderDashboard()
    await act(async () => {})

    expect(container.textContent).toContain('No attempts yet')
    expect(container.textContent).not.toContain('Attempt history')
  })

  it('lists the attempts and their scores', async () => {
    stubs.listAttempts.mockResolvedValue([attemptWithBreakdown()])
    const { container } = renderDashboard()
    await act(async () => {})

    expect(container.textContent).toContain('Attempt history')
    expect(container.textContent).toContain('Read Aloud')
  })

  it('names the kind of every attempt', async () => {
    stubs.listAttempts.mockResolvedValue([
      attemptWithBreakdown({ id: 'a1', mockKind: 'full' }),
      attemptWithBreakdown({ id: 'a2', mockKind: 'section' }),
      attemptWithBreakdown({ id: 'a3', mockKind: 'drill' }),
      attemptWithBreakdown({
        id: 'a4',
        mockKind: undefined,
        sectionIds: ['reading'],
        availablePoints: 10,
        mockTitle: 'PTE Full Mock',
      }),
      attemptWithBreakdown({
        id: 'a5',
        mockKind: undefined,
        sectionIds: ['reading'],
        availablePoints: 10,
        mockTitle: 'Practice Speaking',
      }),
      attemptWithBreakdown({
        id: 'a6',
        mockKind: undefined,
        sectionIds: ['reading'],
        availablePoints: 10,
        mockTitle: 'Read Aloud drill',
      }),
    ])
    const { container } = renderDashboard()
    await act(async () => {})

    expect(container.textContent).toContain('Full')
    expect(container.textContent).toContain('Section')
    expect(container.textContent).toContain('Drill')
  })

  it('shows the practice plan for the types that cost the most points', async () => {
    stubs.listAttempts.mockResolvedValue([attemptWithBreakdown()])
    const { container } = renderDashboard()
    await act(async () => {})

    expect(container.textContent).toContain('Practise these next')
    expect(container.textContent).toContain('Drill this type')
  })

  it('shows the by-type panel and the weakest type', async () => {
    stubs.listAttempts.mockResolvedValue([attemptWithBreakdown()])
    const { container } = renderDashboard()
    await act(async () => {})

    expect(container.textContent).toContain('Question types to work on')
    expect(container.textContent).toContain('Drill weakest type')
  })

  it('falls back to a general practice link when nothing has been measured', async () => {
    stubs.listAttempts.mockResolvedValue([makeAttempt({ breakdown: {} })])
    const { container } = renderDashboard()
    await act(async () => {})

    expect(container.textContent).toContain('Practice by question type')
  })

  it('names a type the blueprint does not know', async () => {
    stubs.listAttempts.mockResolvedValue([
      attemptWithBreakdown({
        breakdown: { 'mystery-type': stat({ type: 'read-aloud', label: 'Mystery' }) },
      }),
    ])
    const { container } = renderDashboard()
    await act(async () => {})

    expect(container.textContent).toContain('mystery type')
  })

  it('draws the score trajectory for more than one attempt', async () => {
    stubs.listAttempts.mockResolvedValue([
      attemptWithBreakdown({ id: 'a1', finishedAt: '2026-01-01T00:00:00.000Z', overallScore: 50 }),
      attemptWithBreakdown({ id: 'a2', finishedAt: '2026-01-02T00:00:00.000Z', overallScore: 60 }),
    ])
    const { container } = renderDashboard()
    await act(async () => {})

    expect(container.textContent).toContain('Overall score trajectory')
    expect(container.querySelector('svg[aria-label*="attempts"]')).not.toBeNull()
  })

  it('celebrates a personal best', async () => {
    vi.useFakeTimers()
    try {
      stubs.listAttempts.mockResolvedValue([
        attemptWithBreakdown({ id: 'a1', finishedAt: '2026-01-01T00:00:00.000Z', overallScore: 50 }),
        attemptWithBreakdown({ id: 'a2', finishedAt: '2026-01-02T00:00:00.000Z', overallScore: 70 }),
      ])
      const { container } = renderDashboard()
      await act(async () => {})
      expect(container.querySelector('.confetti-origin')).toBeNull()

      act(() => {
        vi.advanceTimersByTime(900)
      })
      expect(container.querySelector('.confetti-origin')).not.toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('opens the report of an attempt', async () => {
    stubs.listAttempts.mockResolvedValue([attemptWithBreakdown()])
    const { container } = renderDashboard()
    await act(async () => {})

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'View' }))
    })

    expect(container.textContent).not.toContain('Attempt history')
  })

  it('deletes one attempt', async () => {
    stubs.listAttempts.mockResolvedValue([attemptWithBreakdown()])
    renderDashboard()
    await act(async () => {})

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    })
    expect(screen.getByText('Delete?')).toBeInTheDocument()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^Yes/ }))
    })

    expect(stubs.deleteAttemptEverywhere).toHaveBeenCalledWith('attempt-1')
    expect(document.body.textContent).toContain('Attempt deleted')
  })

  it('says when an attempt was only deleted on this device', async () => {
    stubs.deleteAttemptEverywhere.mockResolvedValue(false)
    stubs.listAttempts.mockResolvedValue([attemptWithBreakdown()])
    renderDashboard()
    await act(async () => {})

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^Yes/ }))
    })

    expect(document.body.textContent).toContain('Deleted locally; cloud retry pending')
  })

  it('says when an attempt could not be deleted', async () => {
    stubs.deleteAttemptEverywhere.mockRejectedValue(new Error('offline'))
    stubs.listAttempts.mockResolvedValue([attemptWithBreakdown()])
    renderDashboard()
    await act(async () => {})

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^Yes/ }))
    })

    expect(document.body.textContent).toContain('Could not delete attempt')
  })

  it('leaves an attempt alone when the delete is called off', async () => {
    stubs.listAttempts.mockResolvedValue([attemptWithBreakdown()])
    renderDashboard()
    await act(async () => {})

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^Cancel/ }))
    })

    expect(stubs.deleteAttemptEverywhere).not.toHaveBeenCalled()
    expect(screen.queryByText('Delete?')).toBeNull()
  })

  it('clears the whole history', async () => {
    stubs.listAttempts.mockResolvedValue([attemptWithBreakdown()])
    renderDashboard()
    await act(async () => {})

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Clear all history' }))
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Yes, clear all' }))
    })

    expect(stubs.clearAllAttemptsEverywhere).toHaveBeenCalled()
    expect(document.body.textContent).toContain('All attempts for this account cleared')
  })

  it('says when the history was only cleared on this device', async () => {
    stubs.clearAllAttemptsEverywhere.mockResolvedValue(false)
    stubs.listAttempts.mockResolvedValue([attemptWithBreakdown()])
    renderDashboard()
    await act(async () => {})

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Clear all history' }))
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Yes, clear all' }))
    })

    expect(document.body.textContent).toContain('History cleared on this device')
  })

  it('closes the clear-all prompt once the history is gone', async () => {
    stubs.listAttempts.mockResolvedValue([attemptWithBreakdown()])
    const { container } = renderDashboard()
    await act(async () => {})

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Clear all history' }))
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Yes, clear all' }))
    })

    expect(container.textContent).toContain('No attempts yet')
  })

  it('ranks every type the attempts measured', async () => {
    stubs.listAttempts.mockResolvedValue([
      attemptWithBreakdown({
        id: 'a1',
        breakdown: {
          'read-aloud': stat({ total: 1, correct: 1, maxPoints: 4, earnedPoints: 4 }),
          'describe-image': stat({
            type: 'describe-image',
            label: 'Describe Image',
            total: 4,
            maxPoints: 4,
            earnedPoints: 1,
          }),
          'retell-lecture': stat({
            type: 'retell-lecture',
            label: 'Re-tell Lecture',
            total: 1,
            maxPoints: 0,
            earnedPoints: 0,
          }),
        },
      }),
    ])
    const { container } = renderDashboard()
    await act(async () => {})

    expect(container.textContent).toContain('Read Aloud')
    expect(container.textContent).toContain('Describe Image')
    expect(container.textContent).toContain('Not yet attempted')
    expect(container.textContent).toContain('No evidence yet')
    expect(container.textContent).toContain('1 item across 1 attempt')
  })

  it('counts a type practised twice in the plural', async () => {
    stubs.listAttempts.mockResolvedValue([
      attemptWithBreakdown({ id: 'a1', finishedAt: '2026-01-01T00:00:00.000Z' }),
      attemptWithBreakdown({ id: 'a2', finishedAt: '2026-01-02T00:00:00.000Z' }),
    ])
    const { container } = renderDashboard()
    await act(async () => {})

    expect(container.textContent).toContain('8 items across 2 attempts')
  })

  it('treats a history of drills as its own trend', async () => {
    stubs.listAttempts.mockResolvedValue([
      attemptWithBreakdown({
        id: 'a1',
        mockKind: 'drill',
        overallScore: 40,
        sectionIds: ['reading'],
        availablePoints: 10,
      }),
      attemptWithBreakdown({
        id: 'a2',
        mockKind: 'drill',
        overallScore: 30,
        finishedAt: '2026-01-03T00:00:00.000Z',
        sectionIds: ['reading'],
        availablePoints: 10,
      }),
    ])
    const { container } = renderDashboard()
    await act(async () => {})

    expect(container.textContent).toContain('since first attempt')
    expect(container.textContent).toContain('across 2 attempts')
    expect(container.textContent).not.toContain('since first full mock')
  })

  it('shows a fall in the score', async () => {
    stubs.listAttempts.mockResolvedValue([
      attemptWithBreakdown({
        id: 'a1',
        finishedAt: '2026-01-01T00:00:00.000Z',
        overallScore: 70,
      }),
      attemptWithBreakdown({
        id: 'a2',
        finishedAt: '2026-01-02T00:00:00.000Z',
        overallScore: 30,
      }),
    ])
    const { container } = renderDashboard()
    await act(async () => {})

    expect(container.textContent).toContain('-40')
  })

  it('calls a run of full mocks a full-mock trend', async () => {
    stubs.listAttempts.mockResolvedValue([
      attemptWithBreakdown({
        id: 'a1',
        mockKind: 'full',
        finishedAt: '2026-01-01T00:00:00.000Z',
        overallScore: 60,
      }),
      attemptWithBreakdown({
        id: 'a2',
        mockKind: 'full',
        finishedAt: '2026-01-02T00:00:00.000Z',
        overallScore: 80,
      }),
    ])
    const { container } = renderDashboard()
    await act(async () => {})

    expect(container.textContent).toContain('Overall score trajectory (Full mocks)')
  })

  it('names the section a practice run belongs to', async () => {
    stubs.listAttempts.mockResolvedValue([
      attemptWithBreakdown({
        id: 'a1',
        mockKind: undefined,
        mockTitle: 'Practice Reading',
        sectionIds: ['reading'],
        availablePoints: 10,
      }),
      attemptWithBreakdown({
        id: 'a2',
        mockKind: undefined,
        mockTitle: 'Practice Listening',
        sectionIds: ['listening'],
        availablePoints: 10,
      }),
    ])
    const { container } = renderDashboard()
    await act(async () => {})

    expect(container.textContent).toContain('Section')
  })

  it('bands a very high score and a very low one', async () => {
    stubs.listAttempts.mockResolvedValue([
      attemptWithBreakdown({ id: 'a1', overallScore: 85 }),
      attemptWithBreakdown({
        id: 'a2',
        finishedAt: '2026-01-05T00:00:00.000Z',
        overallScore: 20,
      }),
    ])
    const { container } = renderDashboard()
    await act(async () => {})

    expect(container.textContent).toContain('Best score')
    expect(container.textContent).toContain('20')
  })

  it('does not paint history that arrives after the page has gone', async () => {
    let resolveAttempts!: (value: unknown[]) => void
    stubs.listAttempts.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAttempts = resolve
        }),
    )
    const { unmount } = renderDashboard()
    unmount()
    await act(async () => {})

    // The read is still in flight when the page goes; the row it returns
    // lands on a page that is no longer there.
    resolveAttempts([attemptWithBreakdown()])
    await act(async () => {})

    expect(stubs.listAttempts).toHaveBeenCalled()
  })

  it('leaves out a skill the attempt never scored', async () => {
    stubs.listAttempts.mockResolvedValue([
      attemptWithBreakdown({ skillScores: { reading: 60 } }),
    ])
    renderDashboard()
    await act(async () => {})

    const bars = screen.getAllByRole('progressbar').map((bar) => bar.getAttribute('aria-label'))
    expect(bars).toContain('reading')
    expect(bars).not.toContain('listening')
  })

  it('says it is clearing while the clear is still running', async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    stubs.clearAllAttemptsEverywhere.mockImplementation(() => gate.then(() => true))
    stubs.listAttempts.mockResolvedValue([attemptWithBreakdown()])
    renderDashboard()
    await act(async () => {})

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Clear all history' }))
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Yes, clear all' }))
    })

    // The prompt closed on the click, but the clear itself is still running,
    // so opening it again says what it is doing.
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Clear all history' }))
    })
    expect(screen.getByRole('button', { name: 'Clearing…' })).toBeInTheDocument()

    release()
    await act(async () => {})
    expect(document.body.textContent).toContain('All attempts for this account cleared')
  })
})

describe('Dashboard settings', () => {
  beforeEach(() => {
    stubs.clientReady.value = true
    stubs.listAttempts.mockResolvedValue([])
    stubs.syncCloudToLocal.mockResolvedValue({ pushed: 0, pulled: 0, failed: 0 })
    stubs.validateGroqKey.mockResolvedValue({ ok: true })
    installFetchMock([])
    useAuth.setState({ user: null, token: null, hasLoggedInBefore: false })
    useSettings.getState().reset()
  })

  it('changes the theme', async () => {
    const { container } = renderDashboard()
    await act(async () => {})

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'dark' }))
    })
    expect(useSettings.getState().settings.theme).toBe('dark')
    expect(container).toBeInTheDocument()
  })

  it('changes the text size', async () => {
    const { container } = renderDashboard()
    await act(async () => {})

    const slider = container.querySelector('input[aria-label="Text size"]') as HTMLInputElement
    await act(async () => {
      fireEvent.change(slider, { target: { value: '1.25' } })
    })
    expect(useSettings.getState().settings.textScale).toBe(1.25)
  })

  it('toggles the live word counter', async () => {
    renderDashboard()
    await act(async () => {})

    const toggle = screen.getByRole('switch', { name: 'Live word counter' })
    await act(async () => {
      fireEvent.click(toggle)
    })
    expect(useSettings.getState().settings.showWordCount).toBe(false)
  })

  it('toggles the countdown audio cues', async () => {
    renderDashboard()
    await act(async () => {})

    const toggle = screen.getByRole('switch', { name: 'Countdown audio cues' })
    await act(async () => {
      fireEvent.click(toggle)
    })
    expect(useSettings.getState().settings.countdownBeeps).toBe(false)
  })

  it('turns the AI examiner on and off', async () => {
    renderDashboard()
    await act(async () => {})

    const toggle = screen.getByRole('switch', { name: 'AI Examiner scoring' })
    await act(async () => {
      fireEvent.click(toggle)
    })
    expect(useSettings.getState().settings.aiScoringEnabled).toBe(true)
    expect(screen.getByText('Groq API Key')).toBeInTheDocument()
  })

  it('turns the AI examiner off again', async () => {
    useSettings.getState().set('aiScoringEnabled', true)
    renderDashboard()
    await act(async () => {})

    const toggle = screen.getByRole('switch', { name: 'AI Examiner scoring' })
    await act(async () => {
      fireEvent.click(toggle)
    })

    expect(useSettings.getState().settings.aiScoringEnabled).toBe(false)
    expect(screen.queryByText('Groq API Key')).toBeNull()
  })

  it('takes a Groq key and hides it again', async () => {
    useSettings.getState().set('aiScoringEnabled', true)
    const { container } = renderDashboard()
    await act(async () => {})

    const key = container.querySelector('#groq-api-key') as HTMLInputElement
    expect(key.type).toBe('password')
    await act(async () => {
      fireEvent.change(key, { target: { value: ' gsk_test ' } })
    })
    expect(useSettings.getState().settings.groqApiKey).toBe('gsk_test')

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Show' }))
    })
    expect((container.querySelector('#groq-api-key') as HTMLInputElement).type).toBe('text')
  })

  it('checks a Groq key against the API', async () => {
    useSettings.getState().set('aiScoringEnabled', true)
    useSettings.getState().set('groqApiKey', 'gsk_test')
    const { container } = renderDashboard()
    await act(async () => {})

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Test Connection' }))
    })

    expect(stubs.validateGroqKey).toHaveBeenCalledWith('gsk_test')
    expect(container.textContent).toContain('Valid Groq API key')
  })

  it('reports a Groq key the API refused', async () => {
    stubs.validateGroqKey.mockResolvedValue({ ok: false, error: 'Invalid key (HTTP 401)' })
    useSettings.getState().set('aiScoringEnabled', true)
    useSettings.getState().set('groqApiKey', 'gsk_test')
    const { container } = renderDashboard()
    await act(async () => {})

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Test Connection' }))
    })

    expect(container.textContent).toContain('Invalid key (HTTP 401)')
  })

  it('reports a Groq key the API could not be reached on', async () => {
    stubs.validateGroqKey.mockResolvedValue({ ok: false })
    useSettings.getState().set('aiScoringEnabled', true)
    useSettings.getState().set('groqApiKey', 'gsk_test')
    const { container } = renderDashboard()
    await act(async () => {})

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Test Connection' }))
    })

    expect(container.textContent).toContain('Failed to validate key')
  })

  it('does not call the API without a key', async () => {
    useSettings.getState().set('aiScoringEnabled', true)
    renderDashboard()
    await act(async () => {})

    const button = screen.getByRole('button', { name: 'Test Connection' }) as HTMLButtonElement
    expect(button.disabled).toBe(true)
    expect(stubs.validateGroqKey).not.toHaveBeenCalled()
  })

  it('resets the AI usage counters', async () => {
    useSettings.getState().set('aiScoringEnabled', true)
    useSettings.getState().recordAiUsage({ totalTokens: 10 })
    const { container } = renderDashboard()
    await act(async () => {})

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Reset counters' }))
    })

    expect(useSettings.getState().settings.aiUsage.totalRequests).toBe(0)
    expect(container).toBeInTheDocument()
  })

  it('shows the usage the server reports', async () => {
    useSettings.setState((s) => ({
      settings: {
        ...s.settings,
        aiScoringEnabled: true,
        groqApiKey: 'gsk_test',
        aiUsage: {
          serverRemainingRequests: 900,
          serverLimitRequests: 1000,
          serverResetRequests: 'in 3 hours',
        } as never,
      },
    }))
    const { container } = renderDashboard()
    await act(async () => {})

    expect(container.textContent).toContain('900')
    expect(container.textContent).toContain('Daily quota resets in in 3 hours')
  })

  it('shows the remaining quota when the server has not reported one', async () => {
    useSettings.setState((s) => ({
      settings: {
        ...s.settings,
        aiScoringEnabled: true,
        // A usage record from before the server started reporting a quota:
        // there is no server figure and no count for today either.
        aiUsage: { totalRequests: 4 } as never,
      },
    }))
    const { container } = renderDashboard()
    await act(async () => {})

    expect(container.textContent).toContain('~1000')
  })

  it('does not call the API when the key is revoked before the click lands', async () => {
    useSettings.getState().set('aiScoringEnabled', true)
    useSettings.getState().set('groqApiKey', 'gsk_test')
    renderDashboard()
    await act(async () => {})

    const button = screen.getByRole('button', { name: 'Test Connection' }) as HTMLButtonElement
    expect(button.disabled).toBe(false)

    // The key is revoked in place, so the rendered button is still enabled
    // while the copy of the settings the handler holds no longer has one.
    // That is the race the guard at the top of the handler is there for.
    act(() => {
      useSettings.setState((s) => {
        s.settings.groqApiKey = ''
        return s
      })
    })
    expect(button.disabled).toBe(false)

    await act(async () => {
      fireEvent.click(button)
    })
    expect(stubs.validateGroqKey).not.toHaveBeenCalled()

    // Put the key back and the very same button calls the API again, so the
    // click above did reach the handler.
    act(() => {
      useSettings.getState().set('groqApiKey', 'gsk_test')
    })
    expect(button.disabled).toBe(false)
    await act(async () => {
      fireEvent.click(button)
    })
    expect(stubs.validateGroqKey).toHaveBeenCalledWith('gsk_test')
  })
})
