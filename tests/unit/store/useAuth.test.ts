import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '../../../src/store/useAuth'
import { useSettings } from '../../../src/store/useSettings'
import { installFetchMock } from '../../helpers/fetch'
import type { RecordedCall } from '../../helpers/fetch'

/* ---------------------------------------------------------------------------
   The session store.

   Everything here happens in the browser: a bearer token in localStorage, a
   profile that the settings screens read, and a handful of calls to the edge
   that can fail in three different ways (a rejection, a malformed body, no
   network at all). The store must never leave the UI believing it is signed
   in when it is not, and it must never throw — a failed sign-in is a message
   on the form, not a crashed app.
   --------------------------------------------------------------------------- */

const USER = { id: 'usr_1', email: 'learner@example.com', targetScore: 60 }
const OTHER_USER = { id: 'usr_2', email: 'other@example.com', targetScore: 70 }
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

function bodyOf(call: RecordedCall | undefined): Record<string, unknown> {
  return JSON.parse(String(call?.init?.body ?? '{}')) as Record<string, unknown>
}

function headersOf(call: RecordedCall | undefined): Record<string, string> {
  return { ...((call?.init?.headers ?? {}) as Record<string, string>) }
}

/** Lets the fire-and-forget request in `logout` settle. */
function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

describe('useAuth', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuth.setState({
      user: null,
      token: null,
      expiresAt: null,
      hasLoggedInBefore: false,
      lastEmail: null,
      loading: false,
      error: null,
    })
    // `logout` also clears the module-level target-score bookkeeping, so the
    // rollback target of one test cannot leak into the next.
    useAuth.getState().logout()
  })

  describe('login', () => {
    it('posts to /api/auth/login and stores the session', async () => {
      const mock = installFetchMock([
        {
          method: 'POST',
          url: '/api/auth/login',
          body: { token: 'tok_123', expiresAt: 1_800_000_000_000, user: USER },
        },
      ])

      const ok = await useAuth.getState().login('learner@example.com', 'hunter2')

      expect(ok).toBe(true)
      expect(mock.calls).toHaveLength(1)
      expect(mock.calls[0]!.url).toBe('/api/auth/login')
      expect(mock.calls[0]!.method).toBe('POST')
      expect(bodyOf(mock.calls[0]!)).toEqual({
        email: 'learner@example.com',
        password: 'hunter2',
      })

      const state = useAuth.getState()
      expect(state.user).toEqual(USER)
      expect(state.token).toBe('tok_123')
      expect(state.expiresAt).toBe(1_800_000_000_000)
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
    })

    it('remembers the last email so the login form can prefill it', async () => {
      installFetchMock([
        { method: 'POST', url: '/api/auth/login', body: { token: 'tok_123', user: USER } },
      ])

      await useAuth.getState().login('learner@example.com', 'hunter2')

      expect(useAuth.getState().lastEmail).toBe('learner@example.com')
      expect(useAuth.getState().hasLoggedInBefore).toBe(true)
    })

    it('falls back to a seven-day expiry when the API sends none', async () => {
      installFetchMock([
        { method: 'POST', url: '/api/auth/login', body: { token: 'tok_123', user: USER } },
      ])

      const before = Date.now()
      await useAuth.getState().login('learner@example.com', 'hunter2')

      const { expiresAt } = useAuth.getState()
      expect(expiresAt).not.toBeNull()
      expect(expiresAt!).toBeGreaterThan(before + SEVEN_DAYS_MS - 1_000)
      expect(expiresAt!).toBeLessThanOrEqual(Date.now() + SEVEN_DAYS_MS)
    })

    it('falls back to a seven-day expiry when the API sends a nonsensical one', async () => {
      installFetchMock([
        {
          method: 'POST',
          url: '/api/auth/login',
          body: { token: 'tok_123', expiresAt: 0, user: USER },
        },
      ])

      await useAuth.getState().login('learner@example.com', 'hunter2')

      expect(useAuth.getState().expiresAt).toBeGreaterThan(Date.now() + SEVEN_DAYS_MS - 1_000)
    })

    it('returns false and records the message when the response is not ok', async () => {
      installFetchMock([
        {
          method: 'POST',
          url: '/api/auth/login',
          status: 401,
          body: { error: 'No account for that address' },
        },
      ])

      const ok = await useAuth.getState().login('learner@example.com', 'wrong')

      expect(ok).toBe(false)
      expect(useAuth.getState().error).toBe('No account for that address')
      expect(useAuth.getState().user).toBeNull()
      expect(useAuth.getState().token).toBeNull()
      expect(useAuth.getState().loading).toBe(false)
    })

    it('falls back to a generic message when the failure carries no error', async () => {
      installFetchMock([{ method: 'POST', url: '/api/auth/login', status: 500, body: {} }])

      const ok = await useAuth.getState().login('learner@example.com', 'wrong')

      expect(ok).toBe(false)
      expect(useAuth.getState().error).toBe('Invalid email or password')
    })

    it('refuses a response that carries no token or no user', async () => {
      installFetchMock([{ method: 'POST', url: '/api/auth/login', body: { user: USER } }])

      const ok = await useAuth.getState().login('learner@example.com', 'hunter2')

      expect(ok).toBe(false)
      expect(useAuth.getState().error).toBe('Invalid email or password')
      expect(useAuth.getState().token).toBeNull()
    })

    it('handles a malformed JSON response', async () => {
      const mock = installFetchMock([{ method: 'POST', url: '/api/auth/login' }])
      mock.fetch.mockImplementationOnce(
        async () => new Response('not json at all', { status: 200 }),
      )

      const ok = await useAuth.getState().login('learner@example.com', 'hunter2')

      expect(ok).toBe(false)
      expect(useAuth.getState().error).toBe('Could not connect to authentication service')
      expect(useAuth.getState().loading).toBe(false)
    })

    it('reports a network failure', async () => {
      installFetchMock([{ method: 'POST', url: '/api/auth/login', networkError: true }])

      const ok = await useAuth.getState().login('learner@example.com', 'hunter2')

      expect(ok).toBe(false)
      expect(useAuth.getState().error).toBe('Could not connect to authentication service')
    })

    it('sends the request even when the email is blank and surfaces the server error', async () => {
      const mock = installFetchMock([
        {
          method: 'POST',
          url: '/api/auth/login',
          status: 400,
          body: { error: 'Email is required' },
        },
      ])

      const ok = await useAuth.getState().login('', '')

      // The store does not validate the form; the API is the authority on
      // what a valid credential is, and its message is what the user reads.
      expect(mock.calls).toHaveLength(1)
      expect(bodyOf(mock.calls[0]!)).toEqual({ email: '', password: '' })
      expect(ok).toBe(false)
      expect(useAuth.getState().error).toBe('Email is required')
    })
  })

  describe('register', () => {
    it('posts to /api/auth/register and stores the session', async () => {
      const mock = installFetchMock([
        {
          method: 'POST',
          url: '/api/auth/register',
          body: { token: 'tok_new', expiresAt: 1_800_000_000_000, user: OTHER_USER },
        },
      ])

      const ok = await useAuth.getState().register('other@example.com', 'hunter2', 72)

      expect(ok).toBe(true)
      expect(mock.calls[0]!.url).toBe('/api/auth/register')
      expect(mock.calls[0]!.method).toBe('POST')
      expect(bodyOf(mock.calls[0]!)).toEqual({
        email: 'other@example.com',
        password: 'hunter2',
        targetScore: 72,
      })

      const state = useAuth.getState()
      expect(state.user).toEqual(OTHER_USER)
      expect(state.token).toBe('tok_new')
      expect(state.expiresAt).toBe(1_800_000_000_000)
      expect(state.hasLoggedInBefore).toBe(true)
      expect(state.lastEmail).toBe('other@example.com')
      expect(state.error).toBeNull()
    })

    it('defaults the target score to 65', async () => {
      const mock = installFetchMock([
        { method: 'POST', url: '/api/auth/register', body: { token: 'tok_new', user: OTHER_USER } },
      ])

      await useAuth.getState().register('other@example.com', 'hunter2')

      expect(bodyOf(mock.calls[0]!)['targetScore']).toBe(65)
    })

    it('falls back to a seven-day expiry when the API sends none', async () => {
      installFetchMock([
        { method: 'POST', url: '/api/auth/register', body: { token: 'tok_new', user: OTHER_USER } },
      ])

      await useAuth.getState().register('other@example.com', 'hunter2')

      expect(useAuth.getState().expiresAt).toBeGreaterThan(Date.now() + SEVEN_DAYS_MS - 1_000)
    })

    it('returns false and records the message when the response is not ok', async () => {
      installFetchMock([
        {
          method: 'POST',
          url: '/api/auth/register',
          status: 409,
          body: { error: 'That address is already registered' },
        },
      ])

      const ok = await useAuth.getState().register('other@example.com', 'hunter2')

      expect(ok).toBe(false)
      expect(useAuth.getState().error).toBe('That address is already registered')
      expect(useAuth.getState().user).toBeNull()
      expect(useAuth.getState().loading).toBe(false)
    })

    it('falls back to a generic message when the failure carries no error', async () => {
      installFetchMock([{ method: 'POST', url: '/api/auth/register', status: 500, body: {} }])

      const ok = await useAuth.getState().register('other@example.com', 'hunter2')

      expect(ok).toBe(false)
      expect(useAuth.getState().error).toBe('Registration failed')
    })

    it('refuses a response that carries no user', async () => {
      installFetchMock([{ method: 'POST', url: '/api/auth/register', body: { token: 'tok_new' } }])

      const ok = await useAuth.getState().register('other@example.com', 'hunter2')

      expect(ok).toBe(false)
      expect(useAuth.getState().error).toBe('Registration failed')
    })

    it('reports a network failure', async () => {
      installFetchMock([{ method: 'POST', url: '/api/auth/register', networkError: true }])

      const ok = await useAuth.getState().register('other@example.com', 'hunter2')

      expect(ok).toBe(false)
      expect(useAuth.getState().error).toBe('Could not connect to authentication service')
    })
  })

  describe('logout', () => {
    it('clears the session and revokes the token on the server', async () => {
      const mock = installFetchMock([{ method: 'POST', url: '/api/auth/logout', body: {} }])
      useAuth.setState({ user: USER, token: 'tok_123', expiresAt: 1_800_000_000_000 })

      useAuth.getState().logout()
      await flush()

      const state = useAuth.getState()
      expect(state.user).toBeNull()
      expect(state.token).toBeNull()
      expect(state.expiresAt).toBeNull()
      expect(state.lastEmail).toBeNull()
      expect(state.error).toBeNull()

      expect(mock.calls).toHaveLength(1)
      expect(mock.calls[0]!.url).toBe('/api/auth/logout')
      expect(mock.calls[0]!.method).toBe('POST')
      expect(headersOf(mock.calls[0]!)['Authorization']).toBe('Bearer tok_123')
    })

    it('does not call the server when there is no token', () => {
      const mock = installFetchMock([{ method: 'POST', url: '/api/auth/logout', body: {} }])

      useAuth.getState().logout()

      expect(mock.calls).toHaveLength(0)
      expect(useAuth.getState().token).toBeNull()
    })

    it('clears the stored API key and the AI usage counters', () => {
      installFetchMock([{ method: 'POST', url: '/api/auth/logout', body: {} }])
      useSettings.getState().set('groqApiKey', 'gsk_secret')
      useSettings.getState().set('aiScoringEnabled', true)
      useSettings
        .getState()
        .recordAiUsage({ promptTokens: 10, completionTokens: 5, totalTokens: 15 })

      useAuth.getState().logout()

      const { settings } = useSettings.getState()
      expect(settings.groqApiKey).toBe('')
      expect(settings.aiScoringEnabled).toBe(false)
      expect(settings.aiUsage.totalRequests).toBe(0)
      expect(settings.aiUsage.totalTokens).toBe(0)
    })

    it('warns when the server refuses the revocation', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      installFetchMock([{ method: 'POST', url: '/api/auth/logout', status: 500, body: {} }])
      useAuth.setState({ user: USER, token: 'tok_123' })

      useAuth.getState().logout()
      await flush()

      expect(warn).toHaveBeenCalledWith('[auth] Session revocation returned', 500)
    })

    it('warns when the revocation cannot reach the server', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      installFetchMock([{ method: 'POST', url: '/api/auth/logout', networkError: true }])
      useAuth.setState({ user: USER, token: 'tok_123' })

      useAuth.getState().logout()
      await flush()

      expect(warn).toHaveBeenCalledWith('[auth] Session revocation failed:', expect.anything())
    })
  })

  describe('setSession', () => {
    it('sets the user, the token and the expiry', () => {
      useAuth.getState().setSession(USER, 'tok_abc', 1_800_000_000_000)

      const state = useAuth.getState()
      expect(state.user).toEqual(USER)
      expect(state.token).toBe('tok_abc')
      expect(state.expiresAt).toBe(1_800_000_000_000)
      expect(state.hasLoggedInBefore).toBe(true)
      expect(state.lastEmail).toBe('learner@example.com')
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
    })

    it('falls back to a seven-day expiry when none is given', () => {
      const before = Date.now()
      useAuth.getState().setSession(USER, 'tok_abc')

      expect(useAuth.getState().expiresAt).toBeGreaterThan(before + SEVEN_DAYS_MS - 1_000)
    })

    it('falls back to a seven-day expiry when the expiry is nonsensical', () => {
      useAuth.getState().setSession(USER, 'tok_abc', -5)

      expect(useAuth.getState().expiresAt).toBeGreaterThan(Date.now() + SEVEN_DAYS_MS - 1_000)
    })
  })

  describe('changePassword', () => {
    beforeEach(() => {
      useAuth.setState({ user: USER, token: 'tok_123', expiresAt: 1_800_000_000_000 })
    })

    it('refuses without a session', async () => {
      const mock = installFetchMock([{ method: 'PATCH', url: '/api/auth/me', body: { ok: true } }])
      useAuth.setState({ token: null })

      const result = await useAuth.getState().changePassword('old', 'newpassword')

      expect(result).toBe('You are not signed in.')
      expect(mock.calls).toHaveLength(0)
    })

    it('refuses without the current password', async () => {
      const mock = installFetchMock([{ method: 'PATCH', url: '/api/auth/me', body: { ok: true } }])

      const result = await useAuth.getState().changePassword('', 'newpassword')

      expect(result).toBe('Current password is required.')
      expect(mock.calls).toHaveLength(0)
    })

    it('refuses a new password shorter than eight characters', async () => {
      const mock = installFetchMock([{ method: 'PATCH', url: '/api/auth/me', body: { ok: true } }])

      const result = await useAuth.getState().changePassword('oldpassword', 'short')

      expect(result).toBe('Password must be at least 8 characters.')
      expect(mock.calls).toHaveLength(0)
    })

    it('patches the profile with the bearer token and returns true', async () => {
      const mock = installFetchMock([{ method: 'PATCH', url: '/api/auth/me', body: { ok: true } }])

      const result = await useAuth.getState().changePassword('oldpassword', 'newpassword')

      expect(result).toBe(true)
      expect(mock.calls).toHaveLength(1)
      expect(mock.calls[0]!.method).toBe('PATCH')
      expect(headersOf(mock.calls[0]!)['Authorization']).toBe('Bearer tok_123')
      expect(bodyOf(mock.calls[0]!)).toEqual({
        currentPassword: 'oldpassword',
        newPassword: 'newpassword',
      })
    })

    it('returns the message the server sent', async () => {
      installFetchMock([
        {
          method: 'PATCH',
          url: '/api/auth/me',
          status: 400,
          body: { ok: false, error: 'That current password is wrong' },
        },
      ])

      const result = await useAuth.getState().changePassword('oldpassword', 'newpassword')

      expect(result).toBe('That current password is wrong')
    })

    it('falls back to a generic message when the server sends none', async () => {
      installFetchMock([{ method: 'PATCH', url: '/api/auth/me', status: 400, body: { ok: false } }])

      const result = await useAuth.getState().changePassword('oldpassword', 'newpassword')

      expect(result).toBe('Could not change the password.')
    })

    it('falls back to a generic message when the body is malformed', async () => {
      const mock = installFetchMock([{ method: 'PATCH', url: '/api/auth/me' }])
      mock.fetch.mockImplementationOnce(async () => new Response('not json', { status: 200 }))

      const result = await useAuth.getState().changePassword('oldpassword', 'newpassword')

      expect(result).toBe('Could not change the password.')
    })

    it('reports a network failure', async () => {
      installFetchMock([{ method: 'PATCH', url: '/api/auth/me', networkError: true }])

      const result = await useAuth.getState().changePassword('oldpassword', 'newpassword')

      expect(result).toBe('Could not connect to authentication service.')
    })

    it('rotates the token when the server issues a new one', async () => {
      installFetchMock([
        {
          method: 'PATCH',
          url: '/api/auth/me',
          body: { ok: true, token: 'tok_new', expiresAt: 1_900_000_000_000 },
        },
      ])

      const result = await useAuth.getState().changePassword('oldpassword', 'newpassword')

      expect(result).toBe(true)
      expect(useAuth.getState().token).toBe('tok_new')
      expect(useAuth.getState().expiresAt).toBe(1_900_000_000_000)
    })

    it('keeps the current expiry when the server does not send one', async () => {
      installFetchMock([
        { method: 'PATCH', url: '/api/auth/me', body: { ok: true, token: 'tok_new' } },
      ])

      await useAuth.getState().changePassword('oldpassword', 'newpassword')

      expect(useAuth.getState().token).toBe('tok_new')
      expect(useAuth.getState().expiresAt).toBe(1_800_000_000_000)
    })

    it('falls back to a seven-day expiry when there is no stored expiry', async () => {
      useAuth.setState({ expiresAt: null })
      installFetchMock([
        { method: 'PATCH', url: '/api/auth/me', body: { ok: true, token: 'tok_new' } },
      ])

      await useAuth.getState().changePassword('oldpassword', 'newpassword')

      expect(useAuth.getState().expiresAt).toBeGreaterThan(Date.now() + SEVEN_DAYS_MS - 1_000)
    })

    it('leaves the token alone when the server does not rotate it', async () => {
      installFetchMock([{ method: 'PATCH', url: '/api/auth/me', body: { ok: true } }])

      await useAuth.getState().changePassword('oldpassword', 'newpassword')

      expect(useAuth.getState().token).toBe('tok_123')
    })
  })

  describe('setTargetScore', () => {
    beforeEach(() => {
      useAuth.setState({ user: USER, token: 'tok_123' })
    })

    it('patches the profile and updates the stored user', async () => {
      const mock = installFetchMock([{ method: 'PATCH', url: '/api/auth/me', body: { ok: true } }])

      await useAuth.getState().setTargetScore(72)

      expect(mock.calls).toHaveLength(1)
      expect(mock.calls[0]!.method).toBe('PATCH')
      expect(bodyOf(mock.calls[0]!)).toEqual({ targetScore: 72 })
      expect(useAuth.getState().user?.targetScore).toBe(72)
    })

    it('does nothing without a session', async () => {
      const mock = installFetchMock([{ method: 'PATCH', url: '/api/auth/me', body: { ok: true } }])
      useAuth.setState({ token: null, user: null })

      await useAuth.getState().setTargetScore(72)

      expect(mock.calls).toHaveLength(0)
    })

    it('does nothing when the token is there but the user is not', async () => {
      const mock = installFetchMock([{ method: 'PATCH', url: '/api/auth/me', body: { ok: true } }])
      useAuth.setState({ user: null })

      await useAuth.getState().setTargetScore(72)

      expect(mock.calls).toHaveLength(0)
    })

    it('rolls the score back when the server rejects the change', async () => {
      installFetchMock([
        { method: 'PATCH', url: '/api/auth/me', status: 500, body: { error: 'nope' } },
      ])
      useAuth.setState({ user: { ...USER, targetScore: 65 } })

      await useAuth.getState().setTargetScore(72)

      expect(useAuth.getState().user?.targetScore).toBe(65)
    })

    it('rolls the score back when the request cannot be made', async () => {
      installFetchMock([{ method: 'PATCH', url: '/api/auth/me', networkError: true }])
      useAuth.setState({ user: { ...USER, targetScore: 65 } })

      await useAuth.getState().setTargetScore(72)

      expect(useAuth.getState().user?.targetScore).toBe(65)
    })

    it('does not roll the score back when the user is gone', async () => {
      const mock = installFetchMock([
        { method: 'PATCH', url: '/api/auth/me', status: 500, body: { error: 'nope' } },
      ])
      const resolvers: Array<(response: Response) => void> = []
      mock.fetch.mockImplementation(
        () => new Promise<Response>((resolve) => resolvers.push(resolve)),
      )
      useAuth.setState({ user: { ...USER, targetScore: 65 } })

      const pending = useAuth.getState().setTargetScore(72)
      useAuth.setState({ user: null })
      resolvers[0]!(new Response('{}', { status: 500 }))
      await pending

      expect(useAuth.getState().user).toBeNull()
    })

    it('keeps the newer score when a later change supersedes an earlier one', async () => {
      const mock = installFetchMock([{ method: 'PATCH', url: '/api/auth/me', body: { ok: true } }])
      const resolvers: Array<(response: Response) => void> = []
      mock.fetch.mockImplementation(
        () => new Promise<Response>((resolve) => resolvers.push(resolve)),
      )

      const first = useAuth.getState().setTargetScore(70)
      const second = useAuth.getState().setTargetScore(80)

      // The second request settles first; the first one then fails and must
      // not roll the score back over the value the user can already see.
      resolvers[1]!(new Response('{}', { status: 200 }))
      resolvers[0]!(new Response('{}', { status: 500 }))
      await Promise.all([first, second])

      expect(useAuth.getState().user?.targetScore).toBe(80)
    })

    it('ignores the confirmation of a change that was already superseded', async () => {
      const mock = installFetchMock([{ method: 'PATCH', url: '/api/auth/me', body: { ok: true } }])
      const resolvers: Array<(response: Response) => void> = []
      mock.fetch.mockImplementation(
        () => new Promise<Response>((resolve) => resolvers.push(resolve)),
      )

      const first = useAuth.getState().setTargetScore(70)
      const second = useAuth.getState().setTargetScore(80)

      // The older request confirms first: its confirmation belongs to a score
      // the user has already moved on from.
      resolvers[0]!(new Response('{}', { status: 200 }))
      resolvers[1]!(new Response('{}', { status: 200 }))
      await Promise.all([first, second])

      expect(useAuth.getState().user?.targetScore).toBe(80)
    })

    it('ignores a failure of a change that was already superseded', async () => {
      const mock = installFetchMock([{ method: 'PATCH', url: '/api/auth/me', body: { ok: true } }])
      const resolvers: Array<(response: Response) => void> = []
      const rejecters: Array<(reason: Error) => void> = []
      mock.fetch.mockImplementation(
        () =>
          new Promise<Response>((resolve, reject) => {
            resolvers.push(resolve)
            rejecters.push(reject)
          }),
      )

      const first = useAuth.getState().setTargetScore(70)
      const second = useAuth.getState().setTargetScore(80)

      rejecters[0]!(new TypeError('Failed to fetch'))
      resolvers[1]!(new Response('{}', { status: 200 }))
      await Promise.all([first, second])

      expect(useAuth.getState().user?.targetScore).toBe(80)
    })

    it('does not roll the score back when a failed request finds no user', async () => {
      const mock = installFetchMock([{ method: 'PATCH', url: '/api/auth/me', body: { ok: true } }])
      const rejecters: Array<(reason: Error) => void> = []
      mock.fetch.mockImplementation(
        () =>
          new Promise<Response>((_resolve, reject) => {
            rejecters.push(reject)
          }),
      )

      const pending = useAuth.getState().setTargetScore(72)
      useAuth.setState({ user: null })
      rejecters[0]!(new TypeError('Failed to fetch'))
      await pending

      expect(useAuth.getState().user).toBeNull()
    })
  })

  describe('checkSession', () => {
    it('returns without a request when there is no token', async () => {
      const mock = installFetchMock([{ method: 'GET', url: '/api/auth/me', body: { user: USER } }])

      await useAuth.getState().checkSession()

      expect(mock.calls).toHaveLength(0)
      expect(useAuth.getState().user).toBeNull()
    })

    it('drops an expired session without a request', async () => {
      const mock = installFetchMock([
        { method: 'GET', url: '/api/auth/me', body: { user: USER } },
        { method: 'POST', url: '/api/auth/logout', body: {} },
      ])
      useAuth.setState({ user: USER, token: 'tok_123', expiresAt: Date.now() - 1_000 })

      await useAuth.getState().checkSession()

      // The dead token is dropped locally; the profile is never fetched.
      expect(mock.calls.map((c) => c.url)).not.toContain('/api/auth/me')
      expect(useAuth.getState().token).toBeNull()
      expect(useAuth.getState().user).toBeNull()
    })

    it('drops a session that is about to expire without a request', async () => {
      const mock = installFetchMock([
        { method: 'GET', url: '/api/auth/me', body: { user: USER } },
        { method: 'POST', url: '/api/auth/logout', body: {} },
      ])
      useAuth.setState({
        user: USER,
        token: 'tok_123',
        expiresAt: Date.now() + 4 * 60 * 1000,
      })

      await useAuth.getState().checkSession()

      expect(mock.calls.map((c) => c.url)).not.toContain('/api/auth/me')
      expect(useAuth.getState().token).toBeNull()
    })

    it('refreshes the stored user from the API', async () => {
      const mock = installFetchMock([
        {
          method: 'GET',
          url: '/api/auth/me',
          body: { user: OTHER_USER, expiresAt: 1_800_000_000_000 },
        },
      ])
      useAuth.setState({ user: USER, token: 'tok_123', expiresAt: Date.now() + 60 * 60 * 1000 })

      await useAuth.getState().checkSession()

      expect(mock.calls).toHaveLength(1)
      expect(headersOf(mock.calls[0]!)['Authorization']).toBe('Bearer tok_123')
      const state = useAuth.getState()
      expect(state.user).toEqual(OTHER_USER)
      expect(state.expiresAt).toBe(1_800_000_000_000)
      expect(state.hasLoggedInBefore).toBe(true)
      expect(state.lastEmail).toBe('other@example.com')
      expect(state.token).toBe('tok_123')
    })

    it('falls back to a seven-day expiry when the API sends none', async () => {
      installFetchMock([{ method: 'GET', url: '/api/auth/me', body: { user: OTHER_USER } }])
      useAuth.setState({ user: USER, token: 'tok_123', expiresAt: Date.now() + 60 * 60 * 1000 })

      await useAuth.getState().checkSession()

      expect(useAuth.getState().expiresAt).toBeGreaterThan(Date.now() + SEVEN_DAYS_MS - 1_000)
    })

    it('falls back to a seven-day expiry when the API sends a nonsensical one', async () => {
      installFetchMock([
        { method: 'GET', url: '/api/auth/me', body: { user: OTHER_USER, expiresAt: 0 } },
      ])
      useAuth.setState({ user: USER, token: 'tok_123', expiresAt: Date.now() + 60 * 60 * 1000 })

      await useAuth.getState().checkSession()

      expect(useAuth.getState().expiresAt).toBeGreaterThan(Date.now() + SEVEN_DAYS_MS - 1_000)
    })

    it('leaves the user alone when the API sends no user', async () => {
      installFetchMock([{ method: 'GET', url: '/api/auth/me', body: {} }])
      useAuth.setState({ user: USER, token: 'tok_123', expiresAt: Date.now() + 60 * 60 * 1000 })

      await useAuth.getState().checkSession()

      expect(useAuth.getState().user).toEqual(USER)
      expect(useAuth.getState().token).toBe('tok_123')
    })

    it('signs the user out when the API answers 401', async () => {
      const mock = installFetchMock([
        { method: 'GET', url: '/api/auth/me', status: 401, body: { error: 'expired' } },
        { method: 'POST', url: '/api/auth/logout', body: {} },
      ])
      useAuth.setState({ user: USER, token: 'tok_123', expiresAt: Date.now() + 60 * 60 * 1000 })

      await useAuth.getState().checkSession()
      await flush()

      expect(useAuth.getState().token).toBeNull()
      expect(useAuth.getState().user).toBeNull()
      expect(mock.calls.map((c) => c.url)).toContain('/api/auth/logout')
    })

    it('keeps the session when the API answers with a server error', async () => {
      installFetchMock([{ method: 'GET', url: '/api/auth/me', status: 500, body: {} }])
      useAuth.setState({ user: USER, token: 'tok_123', expiresAt: Date.now() + 60 * 60 * 1000 })

      await useAuth.getState().checkSession()

      expect(useAuth.getState().token).toBe('tok_123')
      expect(useAuth.getState().user).toEqual(USER)
    })

    it('keeps the session when the network is down', async () => {
      installFetchMock([{ method: 'GET', url: '/api/auth/me', networkError: true }])
      useAuth.setState({ user: USER, token: 'tok_123', expiresAt: Date.now() + 60 * 60 * 1000 })

      await useAuth.getState().checkSession()

      expect(useAuth.getState().token).toBe('tok_123')
      expect(useAuth.getState().user).toEqual(USER)
    })

    it('ignores a response that arrives after the session was replaced', async () => {
      const mock = installFetchMock([
        { method: 'GET', url: '/api/auth/me', body: { user: OTHER_USER } },
      ])
      const resolvers: Array<(response: Response) => void> = []
      mock.fetch.mockImplementation(
        () => new Promise<Response>((resolve) => resolvers.push(resolve)),
      )
      useAuth.setState({ user: USER, token: 'tok_123', expiresAt: Date.now() + 60 * 60 * 1000 })

      const pending = useAuth.getState().checkSession()
      useAuth.setState({ token: 'tok_new' })
      resolvers[0]!(
        new Response(JSON.stringify({ user: OTHER_USER }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      await pending

      expect(useAuth.getState().user).toEqual(USER)
      expect(useAuth.getState().token).toBe('tok_new')
    })

    it('ignores a 401 that arrives after the session was replaced', async () => {
      const mock = installFetchMock([{ method: 'GET', url: '/api/auth/me', status: 401, body: {} }])
      const resolvers: Array<(response: Response) => void> = []
      mock.fetch.mockImplementation(
        () => new Promise<Response>((resolve) => resolvers.push(resolve)),
      )
      useAuth.setState({ user: USER, token: 'tok_123', expiresAt: Date.now() + 60 * 60 * 1000 })

      const pending = useAuth.getState().checkSession()
      useAuth.setState({ token: 'tok_new' })
      resolvers[0]!(new Response('{}', { status: 401 }))
      await pending

      expect(useAuth.getState().token).toBe('tok_new')
      expect(useAuth.getState().user).toEqual(USER)
    })

    it('does not sign out a session that was replaced while the response was read', async () => {
      const mock = installFetchMock([{ method: 'GET', url: '/api/auth/me', status: 401, body: {} }])
      // The token is swapped while the response is being inspected, so the 401
      // belongs to the session that has just been replaced.
      mock.fetch.mockImplementation(
        async () =>
          ({
            get ok() {
              useAuth.setState({ token: 'tok_new' })
              return false
            },
            status: 401,
            json: async () => ({}),
          }) as unknown as Response,
      )
      useAuth.setState({ user: USER, token: 'tok_123', expiresAt: Date.now() + 60 * 60 * 1000 })

      await useAuth.getState().checkSession()

      expect(useAuth.getState().token).toBe('tok_new')
      expect(useAuth.getState().user).toEqual(USER)
    })

    it('ignores a user that arrives after the token was replaced mid-response', async () => {
      const mock = installFetchMock([
        { method: 'GET', url: '/api/auth/me', body: { user: OTHER_USER } },
      ])
      let resolveJson: ((value: unknown) => void) | undefined
      mock.fetch.mockImplementation(
        async () =>
          ({
            ok: true,
            status: 200,
            json: () =>
              new Promise((resolve) => {
                resolveJson = resolve
              }),
          }) as unknown as Response,
      )
      useAuth.setState({ user: USER, token: 'tok_123', expiresAt: Date.now() + 60 * 60 * 1000 })

      const pending = useAuth.getState().checkSession()
      await flush()
      useAuth.setState({ token: 'tok_new' })
      resolveJson?.({ user: OTHER_USER })
      await pending

      expect(useAuth.getState().user).toEqual(USER)
      expect(useAuth.getState().token).toBe('tok_new')
    })
  })

  describe('clearError', () => {
    it('clears the error message', () => {
      useAuth.setState({ error: 'Something went wrong' })

      useAuth.getState().clearError()

      expect(useAuth.getState().error).toBeNull()
    })
  })

  describe('persistence', () => {
    it('writes the session to localStorage', async () => {
      installFetchMock([
        { method: 'POST', url: '/api/auth/login', body: { token: 'tok_123', user: USER } },
      ])

      await useAuth.getState().login('learner@example.com', 'hunter2')

      const raw = localStorage.getItem('pte-prep-auth')
      expect(raw).not.toBeNull()
      const parsed = JSON.parse(raw ?? '{}') as {
        state: {
          user: { email: string } | null
          token: string | null
          hasLoggedInBefore: boolean
          lastEmail: string | null
        }
        version: number
      }
      expect(parsed.version).toBe(0)
      expect(parsed.state.token).toBe('tok_123')
      expect(parsed.state.user?.email).toBe('learner@example.com')
      expect(parsed.state.hasLoggedInBefore).toBe(true)
      expect(parsed.state.lastEmail).toBe('learner@example.com')
    })

    it('hydrates a stored session', async () => {
      localStorage.setItem(
        'pte-prep-auth',
        JSON.stringify({
          state: {
            user: USER,
            token: 'tok_stored',
            expiresAt: 1_800_000_000_000,
            hasLoggedInBefore: true,
            lastEmail: 'learner@example.com',
          },
          version: 0,
        }),
      )

      await useAuth.persist.rehydrate()

      const state = useAuth.getState()
      expect(state.user).toEqual(USER)
      expect(state.token).toBe('tok_stored')
      expect(state.expiresAt).toBe(1_800_000_000_000)
      expect(state.hasLoggedInBefore).toBe(true)
      expect(state.lastEmail).toBe('learner@example.com')
    })

    it('forgets a stored session that has no user and no token', async () => {
      useAuth.setState({ expiresAt: 999 })
      localStorage.setItem(
        'pte-prep-auth',
        JSON.stringify({
          state: {
            user: null,
            token: null,
            expiresAt: null,
            hasLoggedInBefore: false,
            lastEmail: null,
          },
          version: 0,
        }),
      )

      await useAuth.persist.rehydrate()

      const state = useAuth.getState()
      expect(state.hasLoggedInBefore).toBe(false)
      expect(state.lastEmail).toBeNull()
      expect(state.user).toBeNull()
      expect(state.token).toBeNull()
      // A stored expiry that is not a number is ignored; the live one stands.
      expect(state.expiresAt).toBe(999)
    })

    it('takes the last email from the stored user when none was stored', async () => {
      localStorage.setItem(
        'pte-prep-auth',
        JSON.stringify({
          state: {
            user: USER,
            token: 'tok_stored',
            expiresAt: null,
            hasLoggedInBefore: true,
            lastEmail: null,
          },
          version: 0,
        }),
      )

      await useAuth.persist.rehydrate()

      expect(useAuth.getState().lastEmail).toBe('learner@example.com')
      expect(useAuth.getState().hasLoggedInBefore).toBe(true)
    })
  })
})
