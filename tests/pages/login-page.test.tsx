import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, screen } from '@testing-library/react'
import { renderRoute } from '../helpers/render'
import { installFetchMock } from '../helpers/fetch'
import { useAuth } from '../../src/store/useAuth'

/* ---------------------------------------------------------------------------
   The account page.

   One form serves three jobs — sign in, register, and reset — so almost every
   branch on this page is a question about which job the candidate thinks they
   are doing. The signed-in card, the guest-history import prompt and the
   password change form are the other three pieces of state.
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

const LoginPage = (await import('../../src/pages/LoginPage')).default

const USER = { id: 'usr_1', email: 'a@b.c', targetScore: 60 }

function renderLogin(pathname: string, search = '') {
  return renderRoute(<LoginPage />, pathname, { route: `${pathname}${search}` })
}

function emailField(container: HTMLElement): HTMLInputElement {
  return container.querySelector('#login-email') as HTMLInputElement
}

function passwordField(container: HTMLElement): HTMLInputElement {
  return container.querySelector('#login-password') as HTMLInputElement
}

async function type(container: HTMLElement, email: string, password: string) {
  await act(async () => {
    fireEvent.change(emailField(container), { target: { value: email } })
    fireEvent.change(passwordField(container), { target: { value: password } })
  })
}

describe('LoginPage modes', () => {
  beforeEach(() => {
    useAuth.setState({
      user: null,
      token: null,
      expiresAt: null,
      hasLoggedInBefore: false,
      lastEmail: null,
      loading: false,
      error: null,
    })
    stubs.countGuestAttempts.mockResolvedValue(0)
    stubs.syncCloudToLocal.mockResolvedValue({ pushed: 0, pulled: 0 })
    stubs.claimGuestAttemptsForCurrentUser.mockResolvedValue(0)
    installFetchMock([])
  })

  it('offers the register form to a first-time visitor', () => {
    const { container } = renderLogin('/')
    expect(container.querySelector('#login-confirm-password')).toBeInTheDocument()
  })

  it('offers the sign-in form to a visitor who has been here before', () => {
    useAuth.setState({ hasLoggedInBefore: true })
    const { container } = renderLogin('/')
    expect(container.querySelector('#login-confirm-password')).toBeNull()
    expect(container.querySelector('#login-password')).toBeInTheDocument()
  })

  it('shows the register form on the register route', () => {
    const { container } = renderLogin('/register')
    expect(container.querySelector('#login-confirm-password')).toBeInTheDocument()
  })

  it('shows the sign-in form on the login route', () => {
    const { container } = renderLogin('/login')
    expect(container.querySelector('#login-confirm-password')).toBeNull()
  })

  it('switches mode from the tab strip', () => {
    const { container } = renderLogin('/')
    const tabs = screen.getAllByRole('tab')

    fireEvent.click(tabs[1]!)
    expect(container.querySelector('#login-confirm-password')).toBeInTheDocument()

    fireEvent.click(tabs[0]!)
    expect(container.querySelector('#login-confirm-password')).toBeNull()
  })

  it('switches mode from the links under the form', () => {
    const { container } = renderLogin('/login')

    fireEvent.click(screen.getByRole('button', { name: 'Create one' }))
    expect(container.querySelector('#login-confirm-password')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(container.querySelector('#login-confirm-password')).toBeNull()
  })

  it('moves between the modes with the arrow keys', () => {
    useAuth.setState({ hasLoggedInBefore: true })
    const { container } = renderLogin('/')
    const tablist = screen.getByRole('tablist')

    fireEvent.keyDown(tablist, { key: 'ArrowRight' })
    expect(container.querySelector('#login-confirm-password')).toBeInTheDocument()

    fireEvent.keyDown(tablist, { key: 'ArrowLeft' })
    expect(container.querySelector('#login-confirm-password')).toBeNull()

    fireEvent.keyDown(tablist, { key: 'End' })
    expect(container.querySelector('#login-confirm-password')).toBeInTheDocument()

    fireEvent.keyDown(tablist, { key: 'Home' })
    expect(container.querySelector('#login-confirm-password')).toBeNull()
  })

  it('ignores a key that is not a mode key', () => {
    const { container } = renderLogin('/')
    const tablist = screen.getByRole('tablist')
    fireEvent.keyDown(tablist, { key: 'a' })
    expect(container.querySelector('#login-confirm-password')).toBeInTheDocument()
  })
})

describe('LoginPage sign-in', () => {
  beforeEach(() => {
    useAuth.setState({
      user: null,
      token: null,
      expiresAt: null,
      hasLoggedInBefore: false,
      lastEmail: null,
      loading: false,
      error: null,
    })
    stubs.countGuestAttempts.mockResolvedValue(0)
    stubs.syncCloudToLocal.mockResolvedValue({ pushed: 0, pulled: 0 })
    installFetchMock([])
  })

  it('asks for an email address', async () => {
    const { container } = renderLogin('/login')
    await act(async () => {
      fireEvent.submit(container.querySelector('form') as HTMLFormElement)
    })
    expect(screen.getByRole('alert').textContent).toContain('Please enter your email address.')
  })

  it('asks for a password', async () => {
    const { container } = renderLogin('/login')
    await type(container, 'a@b.c', '')
    await act(async () => {
      fireEvent.submit(container.querySelector('form') as HTMLFormElement)
    })
    expect(screen.getByRole('alert').textContent).toContain('Please enter your password.')
  })

  it('shows the password when asked', async () => {
    const { container } = renderLogin('/login')
    expect(passwordField(container).type).toBe('password')
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Show password' }))
    })
    expect(passwordField(container).type).toBe('text')
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Hide password' }))
    })
    expect(passwordField(container).type).toBe('password')
  })

  it('reports a response the server did not fill in', async () => {
    installFetchMock([{ url: '/api/auth/login', body: {}, status: 200 }])
    const { container } = renderLogin('/login')
    await type(container, 'a@b.c', 'password123')
    await act(async () => {
      fireEvent.submit(container.querySelector('form') as HTMLFormElement)
    })
    expect(useAuth.getState().error).toBe('Invalid email or password')
  })

  it('signs in and syncs', async () => {
    installFetchMock([{ url: '/api/auth/login', body: { token: 'tok', user: USER } }])
    const { container } = renderLogin('/login')
    await type(container, 'a@b.c', 'password123')
    await act(async () => {
      fireEvent.submit(container.querySelector('form') as HTMLFormElement)
    })
    expect(useAuth.getState().token).toBe('tok')
    expect(stubs.syncCloudToLocal).toHaveBeenCalled()
  })

  it('sends the candidate back where they came from', async () => {
    installFetchMock([{ url: '/api/auth/login', body: { token: 'tok', user: USER } }])
    const { container } = renderLogin('/login', '?from=/practice')
    await type(container, 'a@b.c', 'password123')
    await act(async () => {
      fireEvent.submit(container.querySelector('form') as HTMLFormElement)
    })
    expect(useAuth.getState().token).toBe('tok')
    // The token alone proves nothing: the page has to end up where the
    // candidate came from.
    expect(screen.getByTestId('location')).toHaveTextContent('/practice')
  })

  it('ignores a redirect to another site', async () => {
    installFetchMock([{ url: '/api/auth/login', body: { token: 'tok', user: USER } }])
    const { container } = renderLogin('/login', '?from=//evil.example')
    await type(container, 'a@b.c', 'password123')
    await act(async () => {
      fireEvent.submit(container.querySelector('form') as HTMLFormElement)
    })
    expect(useAuth.getState().token).toBe('tok')
    // The whole point of the test: the app must not follow a redirect to
    // another site.
    expect(screen.getByTestId('location')).not.toHaveTextContent('evil.example')
  })

  it('prefills the email of a visitor who has been here before', () => {
    useAuth.setState({ hasLoggedInBefore: true, lastEmail: 'before@example.com' })
    const { container } = renderLogin('/')
    expect(emailField(container).value).toBe('before@example.com')
  })
})

describe('LoginPage registration', () => {
  beforeEach(() => {
    useAuth.setState({
      user: null,
      token: null,
      expiresAt: null,
      hasLoggedInBefore: false,
      lastEmail: null,
      loading: false,
      error: null,
    })
    stubs.countGuestAttempts.mockResolvedValue(0)
    stubs.syncCloudToLocal.mockResolvedValue({ pushed: 0, pulled: 0 })
    installFetchMock([])
  })

  it('asks for a password of at least eight characters', async () => {
    const { container } = renderLogin('/register')
    await type(container, 'a@b.c', 'short')
    await act(async () => {
      fireEvent.change(container.querySelector('#login-confirm-password') as HTMLInputElement, {
        target: { value: 'short' },
      })
    })
    await act(async () => {
      fireEvent.submit(container.querySelector('form') as HTMLFormElement)
    })
    expect(screen.getByRole('alert').textContent).toContain(
      'Password must be at least 8 characters.',
    )
  })

  it('asks for the password twice', async () => {
    const { container } = renderLogin('/register')
    await type(container, 'a@b.c', 'password123')
    await act(async () => {
      fireEvent.change(container.querySelector('#login-confirm-password') as HTMLInputElement, {
        target: { value: 'password124' },
      })
    })
    await act(async () => {
      fireEvent.submit(container.querySelector('form') as HTMLFormElement)
    })
    expect(screen.getByRole('alert').textContent).toContain('Passwords do not match.')
  })

  it('shows the confirmation password when asked', async () => {
    const { container } = renderLogin('/register')
    const confirm = container.querySelector('#login-confirm-password') as HTMLInputElement
    expect(confirm.type).toBe('password')

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Show password' }))
    })
    expect(confirm.type).toBe('text')

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Hide password' }))
    })
    expect(confirm.type).toBe('password')
  })

  it('creates the account and signs in', async () => {
    installFetchMock([{ url: '/api/auth/register', body: { token: 'tok', user: USER } }])
    const { container } = renderLogin('/register')
    await type(container, 'a@b.c', 'password123')
    await act(async () => {
      fireEvent.change(container.querySelector('#login-confirm-password') as HTMLInputElement, {
        target: { value: 'password123' },
      })
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '79' }))
    })
    await act(async () => {
      fireEvent.submit(container.querySelector('form') as HTMLFormElement)
    })
    expect(useAuth.getState().token).toBe('tok')
    expect(stubs.syncCloudToLocal).toHaveBeenCalled()
  })

  it('reports a registration the server refused', async () => {
    installFetchMock([
      { url: '/api/auth/register', body: { error: 'Email already used' }, status: 409 },
    ])
    const { container } = renderLogin('/register')
    await type(container, 'a@b.c', 'password123')
    await act(async () => {
      fireEvent.change(container.querySelector('#login-confirm-password') as HTMLInputElement, {
        target: { value: 'password123' },
      })
    })
    await act(async () => {
      fireEvent.submit(container.querySelector('form') as HTMLFormElement)
    })
    expect(useAuth.getState().error).toBe('Email already used')
  })
})

describe('LoginPage guest import', () => {
  beforeEach(() => {
    useAuth.setState({
      user: null,
      token: null,
      expiresAt: null,
      hasLoggedInBefore: false,
      lastEmail: null,
      loading: false,
      error: null,
    })
    stubs.syncCloudToLocal.mockResolvedValue({ pushed: 0, pulled: 0 })
    installFetchMock([{ url: '/api/auth/login', body: { token: 'tok', user: USER } }])
  })

  it('offers to import guest history once there is some', async () => {
    stubs.countGuestAttempts.mockResolvedValue(2)
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { container } = renderLogin('/login')
    await type(container, 'a@b.c', 'password123')
    await act(async () => {
      fireEvent.submit(container.querySelector('form') as HTMLFormElement)
    })

    expect(confirm).toHaveBeenCalled()
    expect(stubs.claimGuestAttemptsForCurrentUser).toHaveBeenCalled()
    confirm.mockRestore()
  })

  it('keeps the guest history separate when the candidate says no', async () => {
    stubs.countGuestAttempts.mockResolvedValue(1)
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const { container } = renderLogin('/login')
    await type(container, 'a@b.c', 'password123')
    await act(async () => {
      fireEvent.submit(container.querySelector('form') as HTMLFormElement)
    })

    expect(confirm).toHaveBeenCalled()
    expect(stubs.claimGuestAttemptsForCurrentUser).not.toHaveBeenCalled()
    confirm.mockRestore()
  })
})

describe('LoginPage forgot password', () => {
  beforeEach(() => {
    useAuth.setState({
      user: null,
      token: null,
      expiresAt: null,
      hasLoggedInBefore: false,
      lastEmail: null,
      loading: false,
      error: null,
    })
    installFetchMock([])
  })

  it('opens the reset dialog with the email it already knows', async () => {
    const { container } = renderLogin('/login')
    await type(container, 'a@b.c', 'password123')
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Forgot password?' }))
    })

    const input = document.querySelector('#forgot-email') as HTMLInputElement
    expect(input).toBeInTheDocument()
    expect(input.value).toBe('a@b.c')
  })

  it('sends the reset link', async () => {
    const fetchMock = installFetchMock([
      { url: '/api/auth/forgot-password', body: { ok: true, message: 'Check your inbox' } },
    ])
    const { container } = renderLogin('/login')
    await type(container, 'a@b.c', 'password123')
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Forgot password?' }))
    })
    await act(async () => {
      fireEvent.submit(document.querySelector('#forgot-email')!.closest('form') as HTMLFormElement)
    })

    expect(fetchMock.calls.some((c) => c.url === '/api/auth/forgot-password')).toBe(true)
    expect(screen.getByText('Check your inbox')).toBeInTheDocument()
  })

  it('closes the dialog when the link has been sent', async () => {
    installFetchMock([{ url: '/api/auth/forgot-password', body: { ok: true } }])
    const { container } = renderLogin('/login')
    await type(container, 'a@b.c', 'password123')
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Forgot password?' }))
    })
    await act(async () => {
      fireEvent.submit(document.querySelector('#forgot-email')!.closest('form') as HTMLFormElement)
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Done' }))
    })
    expect(document.querySelector('#forgot-email')).toBeNull()
  })

  it('closes the dialog when the candidate changes their mind', async () => {
    const { container } = renderLogin('/login')
    await type(container, 'a@b.c', 'password123')
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Forgot password?' }))
    })
    expect((document.querySelector('dialog') as HTMLDialogElement).open).toBe(true)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    })
    expect((document.querySelector('dialog') as HTMLDialogElement).open).toBe(false)
  })

  it('sends nothing when there is no email to send it to', async () => {
    const fetchMock = installFetchMock([])
    renderLogin('/login')
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Forgot password?' }))
    })
    await act(async () => {
      fireEvent.submit(document.querySelector('#forgot-email')!.closest('form') as HTMLFormElement)
    })
    expect(fetchMock.calls.some((c) => c.url === '/api/auth/forgot-password')).toBe(false)
  })

  it('reports a request the server refused', async () => {
    installFetchMock([
      { url: '/api/auth/forgot-password', body: { error: 'No such account' }, status: 404 },
    ])
    const { container } = renderLogin('/login')
    await type(container, 'a@b.c', 'password123')
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Forgot password?' }))
    })
    await act(async () => {
      fireEvent.submit(document.querySelector('#forgot-email')!.closest('form') as HTMLFormElement)
    })
    expect(screen.getByText('No such account')).toBeInTheDocument()
  })

  it('says something useful when the server refuses without saying why', async () => {
    installFetchMock([{ url: '/api/auth/forgot-password', body: {}, status: 500 }])
    const { container } = renderLogin('/login')
    await type(container, 'a@b.c', 'password123')
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Forgot password?' }))
    })
    await act(async () => {
      fireEvent.submit(document.querySelector('#forgot-email')!.closest('form') as HTMLFormElement)
    })
    expect(screen.getByText('Failed to send reset link. Please try again.')).toBeInTheDocument()
  })

  it('sends the link to an address the candidate types in', async () => {
    const fetchMock = installFetchMock([
      { url: '/api/auth/forgot-password', body: { ok: true, message: 'Sent' } },
    ])
    renderLogin('/login')
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Forgot password?' }))
    })
    const input = document.querySelector('#forgot-email') as HTMLInputElement
    await act(async () => {
      fireEvent.change(input, { target: { value: 'typed@example.com' } })
    })
    await act(async () => {
      fireEvent.submit(input.closest('form') as HTMLFormElement)
    })

    const call = fetchMock.calls.find((c) => c.url === '/api/auth/forgot-password')
    expect(call?.init?.body).toContain('typed@example.com')
  })

  it('reports a request that never reached the server', async () => {
    installFetchMock([{ url: '/api/auth/forgot-password', networkError: true }])
    const { container } = renderLogin('/login')
    await type(container, 'a@b.c', 'password123')
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Forgot password?' }))
    })
    await act(async () => {
      fireEvent.submit(document.querySelector('#forgot-email')!.closest('form') as HTMLFormElement)
    })
    expect(screen.getByText(/Could not connect to authentication service/)).toBeInTheDocument()
  })
})

describe('LoginPage signed in', () => {
  beforeEach(() => {
    useAuth.setState({
      user: USER,
      token: 'tok',
      expiresAt: null,
      hasLoggedInBefore: true,
      lastEmail: 'a@b.c',
      loading: false,
      error: null,
    })
    stubs.countGuestAttempts.mockResolvedValue(0)
    stubs.syncCloudToLocal.mockResolvedValue({ pushed: 0, pulled: 0 })
    installFetchMock([{ url: '/api/auth/me', method: 'PATCH', body: { ok: true } }])
  })

  it('shows the account card instead of the form', () => {
    const { container } = renderLogin('/login')
    expect(container.textContent).toContain('Signed in as')
    expect(container.querySelector('#login-email')).toBeNull()
  })

  it('changes the target score', async () => {
    const fetchMock = installFetchMock([
      { url: '/api/auth/me', method: 'PATCH', body: { ok: true } },
    ])
    renderLogin('/login')
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '79' }))
    })
    expect(fetchMock.calls.some((c) => c.url === '/api/auth/me')).toBe(true)
  })

  it('syncs on demand and says so', async () => {
    renderLogin('/login')
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Sync now' }))
    })
    expect(stubs.syncCloudToLocal).toHaveBeenCalled()
    expect(screen.getByText(/All tests and scores are synced/)).toBeInTheDocument()
  })

  it('reports a sync that failed', async () => {
    stubs.syncCloudToLocal.mockRejectedValueOnce(new Error('offline'))
    const { container } = renderLogin('/login')
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Sync now' }))
    })
    // The failure is remembered, but the signed-in card has no alert of its
    // own — the confirmation line simply never appears.
    expect(container.textContent).not.toContain('All tests and scores are synced')
  })

  it('forgets the sync confirmation after a few seconds', async () => {
    vi.useFakeTimers()
    try {
      const { container } = renderLogin('/login')
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Sync now' }))
      })
      expect(container.textContent).toContain('All tests and scores are synced')

      // A second sync replaces the pending timer rather than stacking one.
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Sync now' }))
      })
      act(() => {
        vi.advanceTimersByTime(3000)
      })
      expect(container.textContent).not.toContain('All tests and scores are synced')
    } finally {
      vi.useRealTimers()
    }
  })

  it('signs the candidate out', async () => {
    const { container } = renderLogin('/login')
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))
    })
    expect(useAuth.getState().user).toBeNull()
    expect(container.querySelector('#login-email')).toBeInTheDocument()
  })

  it('asks for the current password before changing it', async () => {
    const { container } = renderLogin('/login')
    const form = container.querySelector('form') as HTMLFormElement
    await act(async () => {
      fireEvent.submit(form)
    })
    expect(screen.getByText('Current password is required.')).toBeInTheDocument()
  })

  it('asks for a long enough new password', async () => {
    const { container } = renderLogin('/login')
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Current password'), {
        target: { value: 'oldpassword' },
      })
      fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'short' } })
      fireEvent.change(screen.getByLabelText('Confirm new password'), {
        target: { value: 'short' },
      })
    })
    await act(async () => {
      fireEvent.submit(container.querySelector('form') as HTMLFormElement)
    })
    expect(screen.getByText('Password must be at least 8 characters.')).toBeInTheDocument()
  })

  it('asks for the new password twice', async () => {
    const { container } = renderLogin('/login')
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Current password'), {
        target: { value: 'oldpassword' },
      })
      fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'password123' } })
      fireEvent.change(screen.getByLabelText('Confirm new password'), {
        target: { value: 'password124' },
      })
    })
    await act(async () => {
      fireEvent.submit(container.querySelector('form') as HTMLFormElement)
    })
    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument()
  })

  it('changes the password', async () => {
    const { container } = renderLogin('/login')
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Current password'), {
        target: { value: 'oldpassword' },
      })
      fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'password123' } })
      fireEvent.change(screen.getByLabelText('Confirm new password'), {
        target: { value: 'password123' },
      })
    })
    await act(async () => {
      fireEvent.submit(container.querySelector('form') as HTMLFormElement)
    })
    expect(screen.getByText('Password changed. Use it next time you sign in.')).toBeInTheDocument()
  })

  it('reports a password change the server refused', async () => {
    installFetchMock([
      { url: '/api/auth/me', method: 'PATCH', body: { ok: false, error: 'Wrong password' } },
    ])
    const { container } = renderLogin('/login')
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Current password'), {
        target: { value: 'oldpassword' },
      })
      fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'password123' } })
      fireEvent.change(screen.getByLabelText('Confirm new password'), {
        target: { value: 'password123' },
      })
    })
    await act(async () => {
      fireEvent.submit(container.querySelector('form') as HTMLFormElement)
    })
    expect(screen.getByText('Wrong password')).toBeInTheDocument()
  })
})
