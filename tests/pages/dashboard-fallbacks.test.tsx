import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from '@testing-library/react'
import { renderRoute } from '../helpers/render'
import { installFetchMock } from '../helpers/fetch'
import { makeAttempt } from '../helpers/factories'
import { useAuth } from '../../src/store/useAuth'
import { useSettings } from '../../src/store/useSettings'
import type { AttemptRecord, TypeStat } from '../../src/domain/types'

/* ---------------------------------------------------------------------------
   The dashboard against a blueprint that does not know every type.

   The page ends its by-type panel with a drill for the weakest type it has
   measured, and falls back to the type's own name when the blueprint has no
   short label for it. With the real blueprint — which gives every type a
   short label — that fallback is invisible, so the blueprint is mocked here to
   one that is missing one.
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
  validateGroqKey: vi.fn(async () => ({ ok: true })),
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
  useClientReady: () => true,
}))

vi.mock('../../src/domain/blueprint', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/domain/blueprint')>()
  const readAloud = actual.QUESTION_META['read-aloud']
  return {
    ...actual,
    QUESTION_META: {
      ...actual.QUESTION_META,
      // A type the blueprint knows, but has no short label for.
      'read-aloud': { ...readAloud, short: undefined } as unknown as typeof readAloud,
    },
  }
})

const Dashboard = (await import('../../src/pages/Dashboard')).default

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

describe('Dashboard against a blueprint without a short label', () => {
  beforeEach(() => {
    stubs.listAttempts.mockResolvedValue([])
    stubs.syncCloudToLocal.mockResolvedValue({ pushed: 0, pulled: 0 })
    installFetchMock([])
    useAuth.setState({ user: null, token: null, hasLoggedInBefore: false })
    useSettings.getState().reset()
  })

  it('names the weakest type when the blueprint has no short label for it', async () => {
    stubs.listAttempts.mockResolvedValue([attemptWithBreakdown()])
    const { container } = renderDashboard()
    await act(async () => {})

    expect(container.textContent).toContain('Drill weakest type (read aloud)')
  })
})
