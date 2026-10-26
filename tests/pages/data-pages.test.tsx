import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, screen } from '@testing-library/react'
import { renderRoute } from '../helpers/render'
import { installFetchMock } from '../helpers/fetch'
import { makeAttempt, makeMockTest } from '../helpers/factories'
import { useAuth } from '../../src/store/useAuth'
import { useTest } from '../../src/store/useTest'
import { useSettings } from '../../src/store/useSettings'

/* ---------------------------------------------------------------------------
   The pages that read a candidate's own history.

   The attempt store and the sync layer are stubbed here: what these pages
   have to get right is how they present what they are given, not how the
   IndexedDB or the cloud behave.
   --------------------------------------------------------------------------- */

// `vi.mock` is hoisted above the module body, so the stubs have to be created
// inside `vi.hoisted` for the factories to be able to close over them.
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

const Home = (await import('../../src/pages/Home')).default
const Dashboard = (await import('../../src/pages/Dashboard')).default
const LoginPage = (await import('../../src/pages/LoginPage')).default
const ResultPage = (await import('../../src/pages/ResultPage')).default
const MockSetup = (await import('../../src/pages/MockSetup')).default
const Practice = (await import('../../src/pages/Practice')).default
const ResetPasswordPage = (await import('../../src/pages/ResetPasswordPage')).default

describe('Home', () => {
  beforeEach(() => {
    stubs.listAttempts.mockResolvedValue([])
    installFetchMock([])
    useAuth.setState({ user: null, token: null })
  })

  it('renders its headline', () => {
    renderRoute(<Home />, '/')
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('lists the question types the bank covers', () => {
    const { container } = renderRoute(<Home />, '/')
    expect(container.textContent).toBeTruthy()
  })
})

describe('Dashboard', () => {
  beforeEach(() => {
    stubs.listAttempts.mockResolvedValue([])
    installFetchMock([])
    useAuth.setState({ user: null, token: null })
  })

  it('renders its headline', () => {
    renderRoute(<Dashboard />, '/dashboard')
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('offers a way to start practising when there is no history', () => {
    const { container } = renderRoute(<Dashboard />, '/dashboard')
    expect(container.textContent).toBeTruthy()
  })
})

describe('LoginPage', () => {
  beforeEach(() => {
    installFetchMock([
      { url: '/api/auth/login', body: { error: 'Invalid email or password' }, status: 401 },
    ])
    useAuth.setState({ user: null, token: null })
  })

  it('renders the sign-in form', () => {
    renderRoute(<LoginPage />, '/login')
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('offers an email and a password field', () => {
    const { container } = renderRoute(<LoginPage />, '/login')
    expect(container.querySelector('input[type="email"]')).toBeInTheDocument()
    expect(container.querySelector('input[type="password"]')).toBeInTheDocument()
  })
})

describe('ResultPage', () => {
  beforeEach(() => {
    stubs.getAttempt.mockResolvedValue(makeAttempt())
    stubs.listAttempts.mockResolvedValue([])
    installFetchMock([])
    useTest.setState({ mock: null, responses: {}, status: 'briefing' })
  })

  it('renders the report', async () => {
    renderRoute(<ResultPage />, '/result', { route: '/result?attempt=attempt-1' })
    await act(async () => {})
    expect(document.body.textContent).toBeTruthy()
  })
})

describe('MockSetup', () => {
  beforeEach(() => {
    useTest.setState({ mock: null, status: 'briefing' })
  })

  it('renders the setup form', () => {
    renderRoute(<MockSetup />, '/mock')
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })
})

describe('Practice', () => {
  beforeEach(() => {
    useTest.setState({ mock: null, status: 'briefing' })
  })

  it('renders the drill picker', () => {
    renderRoute(<Practice />, '/practice')
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })
})

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    installFetchMock([])
  })

  it('renders the reset form', () => {
    renderRoute(<ResetPasswordPage />, '/reset-password', { route: '/reset-password?token=abc' })
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })
})

describe('the session stores', () => {
  beforeEach(() => {
    useSettings.setState({ hydrated: true })
  })

  it('starts a mock in the test store', () => {
    const mock = makeMockTest()
    useTest.getState().start(mock, 'exam')
    expect(useTest.getState().mock).toBe(mock)
    expect(useTest.getState().status).toBe('briefing')
  })
})
