import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from '@testing-library/react'
import { renderRoute } from '../helpers/render'
import { installFetchMock } from '../helpers/fetch'
import { makeAttempt } from '../helpers/factories'
import { useAuth } from '../../src/store/useAuth'

/* ---------------------------------------------------------------------------
   The landing page's attempt card.

   The card is the only part of the home page that reads anything: the rest is
   copy. It has three states — nothing yet, a local attempt, and an attempt
   that arrived from the cloud — and the cloud pull may replace the local
   score with nothing at all.
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

// The prerender pass renders before the browser takes over; that is the one
// state in which there is no owner to read history for.
vi.mock('../../src/lib/useClientReady', () => ({
  useClientReady: () => stubs.clientReady.value,
}))

const Home = (await import('../../src/pages/Home')).default

describe('Home attempt card', () => {
  beforeEach(() => {
    stubs.clientReady.value = true
    stubs.listAttempts.mockResolvedValue([])
    stubs.syncCloudToLocal.mockResolvedValue({ pushed: 0, pulled: 0 })
    installFetchMock([])
    useAuth.setState({ user: null, token: null })
  })

  it('reads no history while the page is still the prerendered one', async () => {
    stubs.clientReady.value = false
    const { container } = renderRoute(<Home />, '/')
    await act(async () => {})

    expect(stubs.listAttempts).not.toHaveBeenCalled()
    expect(container.textContent).toContain('--/90')
  })

  it('shows the local attempt when nobody is signed in', async () => {
    stubs.listAttempts.mockResolvedValue([makeAttempt({ overallScore: 55 })])
    const { container } = renderRoute(<Home />, '/')
    await act(async () => {})

    expect(container.textContent).toContain('55/90')
    expect(stubs.syncCloudToLocal).not.toHaveBeenCalled()
  })

  it('shows no score when there is no attempt at all', async () => {
    stubs.listAttempts.mockResolvedValue([])
    const { container } = renderRoute(<Home />, '/')
    await act(async () => {})

    expect(container.textContent).toContain('--/90')
    expect(container.textContent).not.toContain('View latest report')
  })

  it('pulls the cloud and shows the attempt that came back', async () => {
    const local = makeAttempt({ id: 'attempt-local', overallScore: 55 })
    const fresh = makeAttempt({ id: 'attempt-cloud', overallScore: 71 })
    stubs.listAttempts.mockResolvedValueOnce([local]).mockResolvedValueOnce([fresh])
    stubs.syncCloudToLocal.mockResolvedValue({ pushed: 0, pulled: 1 })
    useAuth.setState({ user: { id: 'usr_1', email: 'a@b.c', targetScore: 60 }, token: 'tok' })

    const { container } = renderRoute(<Home />, '/')
    await act(async () => {})

    expect(stubs.syncCloudToLocal).toHaveBeenCalled()
    expect(stubs.listAttempts).toHaveBeenCalledTimes(2)
    expect(container.textContent).toContain('71/90')
    expect(container.textContent).toContain('View latest report')
  })

  it('falls back to no score when the cloud pull brings nothing back', async () => {
    const local = makeAttempt({ id: 'attempt-local', overallScore: 55 })
    stubs.listAttempts.mockResolvedValueOnce([local]).mockResolvedValueOnce([])
    stubs.syncCloudToLocal.mockResolvedValue({ pushed: 0, pulled: 1 })
    useAuth.setState({ user: { id: 'usr_1', email: 'a@b.c', targetScore: 60 }, token: 'tok' })

    const { container } = renderRoute(<Home />, '/')
    await act(async () => {})

    expect(container.textContent).toContain('--/90')
    expect(container.textContent).not.toContain('55/90')
  })

  it('keeps the local score when the cloud has nothing new', async () => {
    stubs.listAttempts.mockResolvedValue([makeAttempt({ overallScore: 55 })])
    stubs.syncCloudToLocal.mockResolvedValue({ pushed: 0, pulled: 0 })
    useAuth.setState({ user: { id: 'usr_1', email: 'a@b.c', targetScore: 60 }, token: 'tok' })

    const { container } = renderRoute(<Home />, '/')
    await act(async () => {})

    expect(stubs.listAttempts).toHaveBeenCalledTimes(1)
    expect(container.textContent).toContain('55/90')
  })

  it('throws the local attempt away when the account changes while it is read', async () => {
    stubs.listAttempts.mockImplementationOnce(async () => {
      // The candidate signs into another account while the read is in flight.
      useAuth.setState({ user: { id: 'usr_2', email: 'd@e.f', targetScore: 60 }, token: 'tok' })
      return [makeAttempt({ overallScore: 55 })]
    })
    useAuth.setState({ user: { id: 'usr_1', email: 'a@b.c', targetScore: 60 }, token: 'tok' })

    const { container } = renderRoute(<Home />, '/')
    await act(async () => {})

    // The score belonged to the account that has just been left behind.
    expect(container.textContent).not.toContain('55/90')
    expect(container.textContent).toContain('--/90')
  })

  it('throws the cloud attempt away when the account changes while it is pulled', async () => {
    const local = makeAttempt({ id: 'attempt-local', overallScore: 55 })
    const fresh = makeAttempt({ id: 'attempt-cloud', overallScore: 71 })
    stubs.listAttempts.mockImplementationOnce(async () => [local])
    stubs.listAttempts.mockImplementationOnce(async () => {
      // The candidate signs into another account while the cloud read runs.
      useAuth.setState({ user: { id: 'usr_2', email: 'd@e.f', targetScore: 60 }, token: 'tok' })
      return [fresh]
    })
    stubs.syncCloudToLocal.mockResolvedValue({ pushed: 0, pulled: 1 })
    useAuth.setState({ user: { id: 'usr_1', email: 'a@b.c', targetScore: 60 }, token: 'tok' })

    const { container } = renderRoute(<Home />, '/')
    await act(async () => {})

    expect(stubs.syncCloudToLocal).toHaveBeenCalled()
    // The pulled attempt belongs to the account that has just been left behind.
    expect(container.textContent).not.toContain('71/90')
  })
})
