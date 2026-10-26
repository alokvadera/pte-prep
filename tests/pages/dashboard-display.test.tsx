import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from '@testing-library/react'
import { renderRoute } from '../helpers/render'
import { makeAttempt } from '../helpers/factories'
import type { AttemptRecord } from '../../src/domain/types'

/* ---------------------------------------------------------------------------
   Does the dashboard tell the truth?

   The dashboard is the first thing a candidate sees after a mock. It shows
   their latest score, the band it sits in, how the score has moved and which
   question type to drill next. A display bug there tells someone the wrong
   thing about their own performance, and a wrong "drill this next" costs
   them a practice session.
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

const Dashboard = (await import('../../src/pages/Dashboard')).default

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
    },
    ...overrides,
  })
}

/**
 * Three attempts on three days, practising two question types at two very
 * different accuracies.
 *
 * The order matters: the dashboard sorts by date before it picks the latest
 * attempt, and the weakness ranking is what decides which type it recommends
 * drilling next. A fixture with one attempt cannot tell those apart.
 */
function threeAttempts(): AttemptRecord[] {
  return [
    anAttempt({
      id: 'attempt-2',
      finishedAt: '2026-03-02T00:00:00.000Z',
      overallScore: 58,
      cefr: 'B2',
      breakdown: {
        'read-aloud': {
          type: 'read-aloud',
          label: 'Read Aloud',
          skill: 'speaking',
          correct: 8,
          partial: 0,
          incorrect: 2,
          total: 10,
          maxPoints: 10,
          earnedPoints: 8,
          seconds: 380,
        },
        'write-essay': {
          type: 'write-essay',
          label: 'Write Essay',
          skill: 'writing',
          correct: 4,
          partial: 0,
          incorrect: 6,
          total: 10,
          maxPoints: 10,
          earnedPoints: 4,
          seconds: 1200,
        },
      },
    }),
    anAttempt({
      id: 'attempt-3',
      finishedAt: '2026-03-03T00:00:00.000Z',
      overallScore: 71,
      cefr: 'C2',
      breakdown: {
        'read-aloud': {
          type: 'read-aloud',
          label: 'Read Aloud',
          skill: 'speaking',
          correct: 7,
          partial: 0,
          incorrect: 3,
          total: 10,
          maxPoints: 10,
          earnedPoints: 7,
          seconds: 410,
        },
        'write-essay': {
          type: 'write-essay',
          label: 'Write Essay',
          skill: 'writing',
          correct: 8,
          partial: 0,
          incorrect: 2,
          total: 10,
          maxPoints: 10,
          earnedPoints: 8,
          seconds: 1100,
        },
      },
    }),
    anAttempt({
      id: 'attempt-1',
      finishedAt: '2026-03-01T00:00:00.000Z',
      overallScore: 49,
      cefr: 'B1',
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
          seconds: 360,
        },
        'write-essay': {
          type: 'write-essay',
          label: 'Write Essay',
          skill: 'writing',
          correct: 1,
          partial: 0,
          incorrect: 9,
          total: 10,
          maxPoints: 10,
          earnedPoints: 1,
          seconds: 1300,
        },
      },
    }),
  ]
}

async function renderDashboard() {
  renderRoute(<Dashboard />, '/dashboard')
  await act(async () => {})
  return document.body.textContent ?? ''
}

describe('the dashboard shows the numbers it was given', () => {
  beforeEach(() => {
    // Deliberately out of date order: the dashboard has to sort them itself.
    stubs.listAttempts.mockResolvedValue(threeAttempts())
    stubs.syncCloudToLocal.mockResolvedValue({ pushed: 0, pulled: 0 })
  })

  it('shows the score of the most recent attempt, not the first one', async () => {
    const text = await renderDashboard()
    // The newest attempt scored 71; the oldest scored 49.
    expect(text).toContain('71')
    expect(text).toContain('CEFR C2')
  })

  it('shows the band the most recent attempt recorded', async () => {
    const text = await renderDashboard()
    expect(text).toContain('CEFR C2')
  })

  it('names the question type to drill next, as the weakness analysis found it', async () => {
    const text = await renderDashboard()
    // The recommendation is a real sentence, not just a type name: a page that
    // recommended the wrong type would still contain the right one elsewhere.
    // Write Essay averaged far less than Read Aloud across the three
    // attempts, so it is the one worth drilling. "WE" is its short name.
    expect(text).toMatch(/Drill weakest type \(\s*WE\s*\)/)
    expect(text).not.toMatch(/Drill weakest type \(\s*RA\s*\)/)
  })

  it('does not show a score it was never given', async () => {
    stubs.listAttempts.mockResolvedValue([anAttempt({ overallScore: 58, cefr: 'B2' })])

    const text = await renderDashboard()
    expect(text).toContain('CEFR B2')
    expect(text).not.toContain('CEFR C1')
  })

  it('shows the empty state when there is no history at all', async () => {
    stubs.listAttempts.mockResolvedValue([])

    const text = await renderDashboard()
    expect(text).toMatch(/Complete your first timed simulation/)
  })
})
