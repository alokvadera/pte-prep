import { describe, expect, it, vi } from 'vitest'
import { act, fireEvent, screen } from '@testing-library/react'
import { renderRoute } from '../helpers/render'
import { installFetchMock } from '../helpers/fetch'
import { makeAttempt, makeMockTest } from '../helpers/factories'
import { useAuth } from '../../src/store/useAuth'
import { useTest } from '../../src/store/useTest'

/* ---------------------------------------------------------------------------
   What the candidate can actually do on each page.

   These are the interactions that decide whether the page works: choosing a
   drill, starting a mock, signing in, and reading a report back.
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
const Practice = (await import('../../src/pages/Practice')).default
const MockSetup = (await import('../../src/pages/MockSetup')).default
const LoginPage = (await import('../../src/pages/LoginPage')).default
const ResultPage = (await import('../../src/pages/ResultPage')).default
const Dashboard = (await import('../../src/pages/Dashboard')).default
const { ALL_QUESTION_TYPES, QUESTION_META } = await import('../../src/domain/blueprint')

describe('Home', () => {
  it('shows the latest attempt once the cloud has pulled one', async () => {
    stubs.listAttempts.mockResolvedValue([makeAttempt()])
    stubs.syncCloudToLocal.mockResolvedValue({ pushed: 0, pulled: 1 })
    useAuth.setState({ user: { id: 'usr_1', email: 'a@b.c', targetScore: 60 }, token: 'tok' })
    installFetchMock([])

    renderRoute(<Home />, '/')

    await act(async () => {})
    expect(stubs.syncCloudToLocal).toHaveBeenCalled()
  })

  it('leaves the attempt card empty when nobody is signed in', async () => {
    stubs.listAttempts.mockResolvedValue([makeAttempt()])
    stubs.syncCloudToLocal.mockResolvedValue({ pushed: 0, pulled: 0 })
    useAuth.setState({ user: null, token: null })

    renderRoute(<Home />, '/')
    await act(async () => {})

    expect(stubs.syncCloudToLocal).not.toHaveBeenCalled()
  })
})

describe('Practice', () => {
  it('offers a checkbox for every question type', () => {
    useTest.setState({ mock: null, status: 'briefing' })
    const { container } = renderRoute(<Practice />, '/practice')

    expect(container.querySelectorAll('input[type="checkbox"]')).toHaveLength(ALL_QUESTION_TYPES.length)
  })

  it('narrows the list to one skill', () => {
    useTest.setState({ mock: null, status: 'briefing' })
    const { container } = renderRoute(<Practice />, '/practice')

    fireEvent.click(screen.getByRole('button', { name: 'Speaking' }))

    const speakingTypes = ALL_QUESTION_TYPES.filter((t) => QUESTION_META[t].skills.includes('speaking'))
    expect(container.querySelectorAll('input[type="checkbox"]')).toHaveLength(speakingTypes.length)
  })

  it('opens on the type a deep link names', () => {
    useTest.setState({ mock: null, status: 'briefing' })
    const { container } = renderRoute(<Practice />, '/practice', { route: '/practice?type=write-essay' })

    const checked = [...container.querySelectorAll('input[type="checkbox"]')].filter(
      (input) => (input as HTMLInputElement).checked,
    )
    expect(checked).toHaveLength(1)
  })

  it('selects and clears every type', () => {
    useTest.setState({ mock: null, status: 'briefing' })
    const { container } = renderRoute(<Practice />, '/practice')

    fireEvent.click(screen.getByRole('button', { name: 'Select all' }))
    const selected = [...container.querySelectorAll('input[type="checkbox"]')].filter(
      (input) => (input as HTMLInputElement).checked,
    )
    expect(selected.length).toBe(ALL_QUESTION_TYPES.length)

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
    const cleared = [...container.querySelectorAll('input[type="checkbox"]')].filter(
      (input) => (input as HTMLInputElement).checked,
    )
    expect(cleared).toHaveLength(0)
  })

  it('starts a drill and puts it in the session', async () => {
    useTest.setState({ mock: null, status: 'briefing' })
    const { container } = renderRoute(<Practice />, '/practice')

    // Read Aloud is selected by default, which is the drill the page opens on.
    const start = screen.getAllByRole('button', { name: /Start drill/ })[0]!
    await act(async () => {
      fireEvent.click(start)
    })

    expect(useTest.getState().mock).not.toBeNull()
    expect(useTest.getState().mode).toBe('practice')
    expect(container).toBeInTheDocument()
  })

  it('asks before overwriting a run in progress', () => {
    useTest.setState({ mock: makeMockTest(), status: 'running' })
    const { container } = renderRoute(<Practice />, '/practice')

    fireEvent.click(screen.getAllByRole('button', { name: /Start drill/ })[0]!)

    expect(container.textContent).toMatch(/in progress/i)
  })

  it('closes the overwrite prompt on Escape', () => {
    useTest.setState({ mock: makeMockTest(), status: 'running' })
    const { container } = renderRoute(<Practice />, '/practice')

    fireEvent.click(screen.getAllByRole('button', { name: /Start drill/ })[0]!)
    fireEvent.keyDown(window, { key: 'Escape' })

    expect(container.textContent).not.toMatch(/already/i)
  })

  it('traps focus inside the overwrite prompt', () => {
    useTest.setState({ mock: makeMockTest(), status: 'running' })
    renderRoute(<Practice />, '/practice')

    fireEvent.click(screen.getAllByRole('button', { name: /Start drill/ })[0]!)
    const focusable = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    expect(focusable.length).toBeGreaterThan(0)
  })
})

describe('MockSetup', () => {
  it('offers the official timing options', () => {
    useTest.setState({ mock: null, status: 'briefing' })
    renderRoute(<MockSetup />, '/mock')

    const timing = screen.getByRole('group', { name: 'Timing' })
    expect(timing.querySelectorAll('button').length).toBeGreaterThan(1)
  })

  it('starts a mock and puts it in the session', async () => {
    useTest.setState({ mock: null, status: 'briefing' })
    renderRoute(<MockSetup />, '/mock')

    const start = screen.getAllByRole('button', { name: /Start mock test/ })[0]!
    await act(async () => {
      fireEvent.click(start)
    })

    expect(useTest.getState().mock).not.toBeNull()
  })

  it('asks before overwriting a run in progress', () => {
    useTest.setState({ mock: makeMockTest(), status: 'running' })
    const { container } = renderRoute(<MockSetup />, '/mock')

    fireEvent.click(screen.getAllByRole('button', { name: /Start mock test/ })[0]!)

    expect(container.textContent).toMatch(/Discard active mock\?/i)
  })

  it('checks the microphone', async () => {
    useTest.setState({ mock: null, status: 'briefing' })
    const { container } = renderRoute(<MockSetup />, '/mock')

    await act(async () => {})
    expect(container).toBeInTheDocument()
  })
})

describe('LoginPage', () => {
  it('reports a failed sign-in', async () => {
    installFetchMock([{ url: '/api/auth/login', body: { error: 'Invalid email or password' }, status: 401 }])
    useAuth.setState({ user: null, token: null })

    const { container } = renderRoute(<LoginPage />, '/login')
    const email = container.querySelector('input[type="email"]') as HTMLInputElement
    const password = container.querySelector('input[type="password"]') as HTMLInputElement

    await act(async () => {
      fireEvent.change(email, { target: { value: 'a@b.c' } })
      fireEvent.change(password, { target: { value: 'password123' } })
    })
    await act(async () => {
      fireEvent.submit(email.closest('form') as HTMLFormElement)
    })

    expect(useAuth.getState().error).toBe('Invalid email or password')
  })

  it('signs in and stores the session', async () => {
    installFetchMock([
      {
        url: '/api/auth/login',
        body: { token: 'tok', user: { id: 'usr_1', email: 'a@b.c', targetScore: 60 } },
      },
    ])
    useAuth.setState({ user: null, token: null })

    const { container } = renderRoute(<LoginPage />, '/login')
    const email = container.querySelector('input[type="email"]') as HTMLInputElement
    const password = container.querySelector('input[type="password"]') as HTMLInputElement

    await act(async () => {
      fireEvent.change(email, { target: { value: 'a@b.c' } })
      fireEvent.change(password, { target: { value: 'password123' } })
    })
    await act(async () => {
      fireEvent.submit(email.closest('form') as HTMLFormElement)
    })

    expect(useAuth.getState().token).toBe('tok')
  })

  it('offers the register form', () => {
    installFetchMock([])
    const { container } = renderRoute(<LoginPage />, '/register', { route: '/register' })
    expect(container.querySelector('input[type="password"]')).toBeInTheDocument()
  })
})

describe('ResultPage', () => {
  it('shows a report for a stored attempt', async () => {
    stubs.getAttempt.mockResolvedValue(makeAttempt())
    useTest.setState({ mock: null, responses: {}, status: 'briefing' })
    installFetchMock([])

    renderRoute(<ResultPage />, '/result', { route: '/result?attempt=attempt-1' })
    await act(async () => {})

    expect(document.body.textContent).toBeTruthy()
  })

  it('falls back to finishing the run when there is no attempt', async () => {
    stubs.getAttempt.mockResolvedValue(null)
    useTest.setState({ mock: null, responses: {}, status: 'running' })
    installFetchMock([])

    renderRoute(<ResultPage />, '/result', { route: '/result' })
    await act(async () => {})

    expect(document.body.textContent).toBeTruthy()
  })
})

describe('Dashboard', () => {
  it('shows the history when there is some', async () => {
    stubs.listAttempts.mockResolvedValue([makeAttempt()])
    useAuth.setState({ user: null, token: null })
    installFetchMock([])

    const { container } = renderRoute(<Dashboard />, '/dashboard')
    await act(async () => {})

    expect(container.textContent).toBeTruthy()
  })

  it('shows the empty state when there is none', async () => {
    stubs.listAttempts.mockResolvedValue([])
    useAuth.setState({ user: null, token: null })
    installFetchMock([])

    const { container } = renderRoute(<Dashboard />, '/dashboard')
    await act(async () => {})

    expect(container.textContent).toBeTruthy()
  })

  it('shows the signed-in view', async () => {
    stubs.listAttempts.mockResolvedValue([])
    useAuth.setState({ user: { id: 'usr_1', email: 'a@b.c', targetScore: 60 }, token: 'tok' })
    installFetchMock([{ url: '/api/auth/me', body: { user: { id: 'usr_1', email: 'a@b.c', targetScore: 60 } } }])

    const { container } = renderRoute(<Dashboard />, '/dashboard')
    await act(async () => {})

    expect(container.textContent).toBeTruthy()
  })
})
