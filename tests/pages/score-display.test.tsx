import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from '@testing-library/react'
import { renderRoute } from '../helpers/render'
import { makeAttempt } from '../helpers/factories'
import { cefrLabel } from '../../src/domain/scoring'
import type { AttemptRecord } from '../../src/domain/types'

/* ---------------------------------------------------------------------------
   Does the report tell the truth?

   Every other test in the suite checks that a page renders and that its
   controls work. This one checks the thing a candidate actually reads: that
   the score, the band, the percentage and the weakest skill on the screen are
   the ones the attempt record holds.

   A display bug here is invisible to a render test and expensive for the
   person who sat the mock.
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

const ResultPage = (await import('../../src/pages/ResultPage')).default

/** An attempt whose numbers are all different, so a mix-up cannot hide. */
function anAttempt(overrides: Partial<AttemptRecord> = {}): AttemptRecord {
  return makeAttempt({
    id: 'attempt-1',
    overallScore: 63,
    cefr: 'C1',
    availablePoints: 40,
    earnedPoints: 26,
    skillScores: { reading: 71, listening: 58, speaking: 64, writing: 49 },
    breakdown: {
      'read-aloud': {
        type: 'read-aloud',
        label: 'Read Aloud',
        skill: 'speaking',
        correct: 7,
        partial: 1,
        incorrect: 2,
        total: 10,
        maxPoints: 10,
        earnedPoints: 7.5,
        seconds: 400,
      },
      'fill-in-blanks-listening': {
        type: 'fill-in-blanks-listening',
        label: 'Fill in the Blanks',
        skill: 'listening',
        correct: 3,
        partial: 0,
        incorrect: 1,
        total: 4,
        maxPoints: 4,
        earnedPoints: 3,
        seconds: 120,
      },
    },
    ...overrides,
  })
}

describe('the result report shows the numbers it was given', () => {
  beforeEach(() => {
    stubs.getAttempt.mockResolvedValue(anAttempt())
    stubs.syncAttemptToCloud.mockResolvedValue(true)
  })

  it('shows the overall score the attempt recorded', async () => {
    renderRoute(<ResultPage />, '/result', { route: '/result?attempt=attempt-1' })
    await act(async () => {})

    expect(document.body.textContent).toContain('63')
  })

  it('shows the band the attempt recorded, with its plain-language name', async () => {
    renderRoute(<ResultPage />, '/result', { route: '/result?attempt=attempt-1' })
    await act(async () => {})

    expect(document.body.textContent).toContain(`CEFR C1, ${cefrLabel('C1')}`)
  })

  it('shows the share of the available points the attempt earned', async () => {
    renderRoute(<ResultPage />, '/result', { route: '/result?attempt=attempt-1' })
    await act(async () => {})

    // 26 of 40 points is 65%.
    expect(document.body.textContent).toContain('65%')
    expect(document.body.textContent).not.toContain('66%')
  })

  it('names the weakest and the strongest skill the attempt recorded', async () => {
    renderRoute(<ResultPage />, '/result', { route: '/result?attempt=attempt-1' })
    await act(async () => {})

    // Writing at 49 is the weakest; reading at 71 is the strongest. The
    // sentence is asserted as a whole, because a page that swapped the two
    // would still contain both skill names.
    expect(document.body.textContent).toMatch(/Your weakest area is\s*writing/)
    expect(document.body.textContent).toMatch(/your strongest is\s*reading/)
  })

  it('shows each question type with the points it earned and the points it was worth', async () => {
    renderRoute(<ResultPage />, '/result', { route: '/result?attempt=attempt-1' })
    await act(async () => {})

    expect(document.body.textContent).toContain('7.5 / 10')
    expect(document.body.textContent).toContain('3.0 / 4')
  })

  it('shows no share of the points when the attempt had none to earn', async () => {
    stubs.getAttempt.mockResolvedValue(
      anAttempt({ availablePoints: 0, earnedPoints: 0, skillScores: {}, overallScore: 10, cefr: 'A1' }),
    )

    renderRoute(<ResultPage />, '/result', { route: '/result?attempt=attempt-1' })
    await act(async () => {})

    // No points means no percentage, and no skill to call the weakest.
    expect(document.body.textContent).toContain('CEFR A1')
    expect(document.body.textContent).toContain('Your weakest area is')
  })

  it('does not read a score from a different attempt', async () => {
    const other = anAttempt({ overallScore: 71, cefr: 'C2' })
    stubs.getAttempt.mockResolvedValue(other)

    renderRoute(<ResultPage />, '/result', { route: '/result?attempt=attempt-1' })
    await act(async () => {})

    expect(document.body.textContent).toContain(`CEFR C2, ${cefrLabel('C2')}`)
    expect(document.body.textContent).not.toContain('CEFR C1')
  })
})
