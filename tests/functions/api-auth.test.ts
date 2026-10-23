import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest'

import './webcrypto'
import { onRequestPost as loginPost } from '../../functions/api/auth/login'
import { onRequestPost as logoutPost } from '../../functions/api/auth/logout'
import { onRequestPost as registerPost } from '../../functions/api/auth/register'
import { onRequestGet as meGet, onRequestPatch as mePatch } from '../../functions/api/auth/me'
import { onRequestPost as forgotPost } from '../../functions/api/auth/forgot-password'
import { onRequestPost as resetPost } from '../../functions/api/auth/reset-password'
import { sha256Hex } from '../../functions/lib/auth'
import { createD1Mock } from './d1'
import type { D1Mock } from './d1'
import {
  bearer,
  createSession,
  jsonRequest,
  makeContext,
  makeEnv,
  nowSeconds,
  rawRequest,
  readJson,
  seedReset,
  seedUser,
  sleep,
  withOverrides,
} from './support'

const LOGIN_URL = 'https://site.test/api/auth/login'
const IP = '203.0.113.5'
const IP_HEADERS = { 'cf-connecting-ip': IP }

afterEach(() => {
  vi.unstubAllGlobals()
})

/* ---------------------------------------------------------------------------
   POST /api/auth/login
   --------------------------------------------------------------------------- */

describe('POST /api/auth/login', () => {
  it('rejects a malformed JSON body', async () => {
    const mock = createD1Mock()
    const ctx = makeContext({
      request: rawRequest(LOGIN_URL, '{not json'),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await loginPost(ctx)

    expect(res.status).toBe(400)
    expect(await readJson(res)).toEqual({ error: 'Invalid JSON request' })
  })

  it('rejects a missing email', async () => {
    const mock = createD1Mock()
    const ctx = makeContext({
      request: jsonRequest(LOGIN_URL, { password: 'password123' }),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await loginPost(ctx)

    expect(res.status).toBe(400)
    expect(await readJson(res)).toEqual({ error: 'Please enter a valid email address' })
  })

  it('rejects a bad email format', async () => {
    const mock = createD1Mock()
    const ctx = makeContext({
      request: jsonRequest(LOGIN_URL, { email: 'not-an-email', password: 'password123' }),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await loginPost(ctx)

    expect(res.status).toBe(400)
    expect(await readJson(res)).toEqual({ error: 'Please enter a valid email address' })
  })

  it('rejects a wrong password with 401', async () => {
    const mock = createD1Mock()
    await seedUser(mock, { email: 'user@pte.test', password: 'password123' })
    const ctx = makeContext({
      request: jsonRequest(LOGIN_URL, { email: 'user@pte.test', password: 'wrong-password' }),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await loginPost(ctx)

    expect(res.status).toBe(401)
    expect(await readJson(res)).toEqual({ error: 'Incorrect email or password.' })
  })

  it('rejects an unknown account with the same 401', async () => {
    const mock = createD1Mock()
    const ctx = makeContext({
      request: jsonRequest(LOGIN_URL, { email: 'nobody@pte.test', password: 'password123' }),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await loginPost(ctx)

    expect(res.status).toBe(401)
    expect(await readJson(res)).toEqual({ error: 'Incorrect email or password.' })
  })

  it('rejects an account whose password hash is missing', async () => {
    const mock = createD1Mock()
    await seedUser(mock, { email: 'user@pte.test', password: 'password123' })
    const row = mock.users.get('usr_user_pte_test')!
    row.password_hash = ''
    const ctx = makeContext({
      request: jsonRequest(LOGIN_URL, { email: 'user@pte.test', password: 'password123' }),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await loginPost(ctx)

    expect(res.status).toBe(401)
    expect(await readJson(res)).toEqual({ error: 'Incorrect email or password.' })
  })

  it('rejects a password that is not a string', async () => {
    const mock = createD1Mock()
    await seedUser(mock, { email: 'user@pte.test', password: 'password123' })
    const ctx = makeContext({
      request: jsonRequest(LOGIN_URL, { email: 'user@pte.test', password: 12_345_678 }),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await loginPost(ctx)

    expect(res.status).toBe(401)
  })

  it('rejects an account whose password salt is missing', async () => {
    const mock = createD1Mock()
    await seedUser(mock, { email: 'user@pte.test', password: 'password123' })
    const row = mock.users.get('usr_user_pte_test')!
    row.password_salt = null as unknown as string
    const ctx = makeContext({
      request: jsonRequest(LOGIN_URL, { email: 'user@pte.test', password: 'password123' }),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await loginPost(ctx)

    expect(res.status).toBe(401)
    expect(await readJson(res)).toEqual({ error: 'Incorrect email or password.' })
  })

  it('does not pad a response that was already slow enough', async () => {
    const mock = createD1Mock()
    const db = withOverrides(mock.db, [
      {
        match: (sql) => sql.includes('FROM users WHERE email = ?'),
        first: async () => {
          await sleep(300)
          return null
        },
      },
    ])
    const ctx = makeContext({
      request: jsonRequest(LOGIN_URL, { email: 'user@pte.test', password: 'password123' }),
      env: makeEnv({ DB: db }),
    })

    const res = await loginPost(ctx)

    expect(res.status).toBe(401)
  })

  it('succeeds with 200 and returns a bearer token and the user', async () => {
    const mock = createD1Mock()
    const { row } = await seedUser(mock, {
      email: 'user@pte.test',
      password: 'password123',
      targetScore: 72,
    })
    const ctx = makeContext({
      request: jsonRequest(LOGIN_URL, { email: 'user@pte.test', password: 'password123' }),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await loginPost(ctx)

    expect(res.status).toBe(200)
    const body = await readJson(res)
    expect(typeof body.token).toBe('string')
    expect((body.token as string).split('.')).toHaveLength(2)
    expect(body.user).toEqual({ id: row.id, email: 'user@pte.test', targetScore: 72 })
    expect(typeof body.expiresAt).toBe('number')
    expect(mock.sessions.size).toBe(1)
  })

  it('answers 500 when there is no database binding', async () => {
    const ctx = makeContext({
      request: jsonRequest(LOGIN_URL, { email: 'user@pte.test', password: 'password123' }),
      env: makeEnv({ DB: undefined }),
    })

    const res = await loginPost(ctx)

    expect(res.status).toBe(500)
    expect(await readJson(res)).toEqual({ error: 'Database binding unavailable' })
  })

  it('answers 429 when the per ip limit is exhausted', async () => {
    const mock = createD1Mock({
      rateLimits: [{ key: `login:ip:${IP}`, count: 30, reset_at: nowSeconds() + 600 }],
    })
    const ctx = makeContext({
      request: jsonRequest(
        LOGIN_URL,
        { email: 'user@pte.test', password: 'password123' },
        'POST',
        IP_HEADERS,
      ),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await loginPost(ctx)

    expect(res.status).toBe(429)
    expect(res.headers.get('Retry-After')).toBeTruthy()
  })

  it('answers 429 when the per ip and email limit is exhausted', async () => {
    const mock = createD1Mock({
      rateLimits: [
        { key: `login:ip_email:${IP}:user@pte.test`, count: 5, reset_at: nowSeconds() + 300 },
      ],
    })
    const ctx = makeContext({
      request: jsonRequest(
        LOGIN_URL,
        { email: 'user@pte.test', password: 'password123' },
        'POST',
        IP_HEADERS,
      ),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await loginPost(ctx)

    expect(res.status).toBe(429)
  })

  it('answers 429 when the per email limit is exhausted', async () => {
    const mock = createD1Mock({
      rateLimits: [{ key: 'login:email:user@pte.test', count: 10, reset_at: nowSeconds() + 300 }],
    })
    const ctx = makeContext({
      request: jsonRequest(
        LOGIN_URL,
        { email: 'user@pte.test', password: 'password123' },
        'POST',
        IP_HEADERS,
      ),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await loginPost(ctx)

    expect(res.status).toBe(429)
  })
})

/* ---------------------------------------------------------------------------
   POST /api/auth/register
   --------------------------------------------------------------------------- */

describe('POST /api/auth/register', () => {
  const REGISTER_URL = 'https://site.test/api/auth/register'

  it('rejects a malformed JSON payload', async () => {
    const mock = createD1Mock()
    const ctx = makeContext({
      request: rawRequest(REGISTER_URL, 'not json at all'),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await registerPost(ctx)

    expect(res.status).toBe(400)
    expect(await readJson(res)).toEqual({ error: 'Invalid JSON payload' })
  })

  it('rejects a malformed email', async () => {
    const mock = createD1Mock()
    const ctx = makeContext({
      request: jsonRequest(REGISTER_URL, { email: 'nope', password: 'password123' }),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await registerPost(ctx)

    expect(res.status).toBe(400)
    expect(await readJson(res)).toEqual({ error: 'Please enter a valid email address.' })
  })

  it('rejects an email that is not a string', async () => {
    const mock = createD1Mock()
    const ctx = makeContext({
      request: jsonRequest(REGISTER_URL, { email: 42, password: 'password123' }),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await registerPost(ctx)

    expect(res.status).toBe(400)
    expect(await readJson(res)).toEqual({ error: 'Please enter a valid email address.' })
  })

  it('rejects a password that is not a string', async () => {
    const mock = createD1Mock()
    const ctx = makeContext({
      request: jsonRequest(REGISTER_URL, { email: 'user@pte.test', password: 12_345_678 }),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await registerPost(ctx)

    expect(res.status).toBe(400)
    expect(await readJson(res)).toEqual({ error: 'Password must be at least 8 characters.' })
  })

  it('rejects a short password', async () => {
    const mock = createD1Mock()
    const ctx = makeContext({
      request: jsonRequest(REGISTER_URL, { email: 'user@pte.test', password: 'short' }),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await registerPost(ctx)

    expect(res.status).toBe(400)
    expect(await readJson(res)).toEqual({ error: 'Password must be at least 8 characters.' })
  })

  it('rejects a password that is too long', async () => {
    const mock = createD1Mock()
    const ctx = makeContext({
      request: jsonRequest(REGISTER_URL, { email: 'user@pte.test', password: 'x'.repeat(129) }),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await registerPost(ctx)

    expect(res.status).toBe(400)
    expect(await readJson(res)).toEqual({ error: 'Password is too long (max 128 characters).' })
  })

  it('rejects a duplicate email with 400', async () => {
    const mock = createD1Mock()
    await seedUser(mock, { email: 'user@pte.test', password: 'password123' })
    const ctx = makeContext({
      request: jsonRequest(REGISTER_URL, { email: 'user@pte.test', password: 'password123' }),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await registerPost(ctx)

    expect(res.status).toBe(400)
    expect(await readJson(res)).toEqual({
      error:
        'Unable to create account. If you already have an account, please sign in or reset your password.',
    })
  })

  it('creates the account with 201 and returns a token', async () => {
    const mock = createD1Mock()
    const ctx = makeContext({
      request: jsonRequest(REGISTER_URL, { email: 'User@PTE.test', password: 'password123' }),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await registerPost(ctx)

    expect(res.status).toBe(201)
    const body = await readJson(res)
    expect(body.ok).toBe(true)
    expect(typeof body.token).toBe('string')
    expect((body.token as string).split('.')).toHaveLength(2)
    expect(body.user).toEqual({
      id: body.user && (body.user as Record<string, unknown>).id,
      email: 'user@pte.test',
      targetScore: 65,
    })
    expect(mock.users.size).toBe(1)
    const stored = [...mock.users.values()][0]!
    expect(stored.email).toBe('user@pte.test')
    expect(stored.password_hash).toBeTruthy()
    expect(stored.password_salt).toBeTruthy()
    expect(mock.sessions.size).toBe(1)
  })

  it('stores the requested target score', async () => {
    const mock = createD1Mock()
    const ctx = makeContext({
      request: jsonRequest(REGISTER_URL, {
        email: 'user@pte.test',
        password: 'password123',
        targetScore: 75,
      }),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await registerPost(ctx)

    expect(res.status).toBe(201)
    const body = await readJson(res)
    expect((body.user as Record<string, unknown>).targetScore).toBe(75)
    expect([...mock.users.values()][0]!.target_score).toBe(75)
  })

  it('falls back to the default target score for an out of range value', async () => {
    const mock = createD1Mock()
    const ctx = makeContext({
      request: jsonRequest(REGISTER_URL, {
        email: 'user@pte.test',
        password: 'password123',
        targetScore: 95,
      }),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await registerPost(ctx)

    expect(res.status).toBe(201)
    const body = await readJson(res)
    expect((body.user as Record<string, unknown>).targetScore).toBe(65)
  })

  it('falls back to the default target score for a value that is not a number', async () => {
    const mock = createD1Mock()
    const ctx = makeContext({
      request: jsonRequest(REGISTER_URL, {
        email: 'user@pte.test',
        password: 'password123',
        targetScore: '75',
      }),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await registerPost(ctx)

    expect(res.status).toBe(201)
    const body = await readJson(res)
    expect((body.user as Record<string, unknown>).targetScore).toBe(65)
  })

  it('answers 500 when there is no database binding', async () => {
    const ctx = makeContext({
      request: jsonRequest(REGISTER_URL, { email: 'user@pte.test', password: 'password123' }),
      env: makeEnv({ DB: undefined }),
    })

    const res = await registerPost(ctx)

    expect(res.status).toBe(500)
    expect(await readJson(res)).toEqual({ error: 'Database binding unavailable' })
  })

  it('answers 429 when the per ip limit is exhausted', async () => {
    const mock = createD1Mock({
      rateLimits: [{ key: `register:ip:${IP}`, count: 10, reset_at: nowSeconds() + 3600 }],
    })
    const ctx = makeContext({
      request: jsonRequest(
        REGISTER_URL,
        { email: 'user@pte.test', password: 'password123' },
        'POST',
        IP_HEADERS,
      ),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await registerPost(ctx)

    expect(res.status).toBe(429)
  })

  it('answers 429 when the per ip and email limit is exhausted', async () => {
    const mock = createD1Mock({
      rateLimits: [
        { key: `register:ip_email:${IP}:user@pte.test`, count: 3, reset_at: nowSeconds() + 600 },
      ],
    })
    const ctx = makeContext({
      request: jsonRequest(
        REGISTER_URL,
        { email: 'user@pte.test', password: 'password123' },
        'POST',
        IP_HEADERS,
      ),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await registerPost(ctx)

    expect(res.status).toBe(429)
  })

  it('answers 429 when the per email limit is exhausted', async () => {
    const mock = createD1Mock({
      rateLimits: [{ key: 'register:email:user@pte.test', count: 5, reset_at: nowSeconds() + 600 }],
    })
    const ctx = makeContext({
      request: jsonRequest(
        REGISTER_URL,
        { email: 'user@pte.test', password: 'password123' },
        'POST',
        IP_HEADERS,
      ),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await registerPost(ctx)

    expect(res.status).toBe(429)
  })

  it('answers 400 when the insert violates a unique constraint', async () => {
    const mock = createD1Mock()
    const db = withOverrides(mock.db, [
      {
        match: (sql) => sql.includes('INSERT INTO users'),
        run: async () => {
          throw new Error('SQLITE_CONSTRAINT: UNIQUE constraint failed: users.email')
        },
      },
    ])
    const ctx = makeContext({
      request: jsonRequest(REGISTER_URL, { email: 'user@pte.test', password: 'password123' }),
      env: makeEnv({ DB: db }),
    })

    const res = await registerPost(ctx)

    expect(res.status).toBe(400)
    expect(await readJson(res)).toEqual({
      error:
        'Unable to create account. If you already have an account, please sign in or reset your password.',
    })
  })

  it('answers 400 when the insert fails without an error object', async () => {
    const mock = createD1Mock()
    const db = withOverrides(mock.db, [
      {
        match: (sql) => sql.includes('INSERT INTO users'),
        run: async () => {
          throw 'SQLITE_CONSTRAINT'
        },
      },
    ])
    const ctx = makeContext({
      request: jsonRequest(REGISTER_URL, { email: 'user@pte.test', password: 'password123' }),
      env: makeEnv({ DB: db }),
    })

    const res = await registerPost(ctx)

    expect(res.status).toBe(400)
  })

  it('rethrows an unexpected database error', async () => {
    const mock = createD1Mock()
    const db = withOverrides(mock.db, [
      {
        match: (sql) => sql.includes('INSERT INTO users'),
        run: async () => {
          throw new Error('disk full')
        },
      },
    ])
    const ctx = makeContext({
      request: jsonRequest(REGISTER_URL, { email: 'user@pte.test', password: 'password123' }),
      env: makeEnv({ DB: db }),
    })

    await expect(registerPost(ctx)).rejects.toThrow('disk full')
  })
})

/* ---------------------------------------------------------------------------
   POST /api/auth/logout
   --------------------------------------------------------------------------- */

describe('POST /api/auth/logout', () => {
  const LOGOUT_URL = 'https://site.test/api/auth/logout'

  it('returns 200 when there is no token', async () => {
    const mock = createD1Mock()
    const ctx = makeContext({
      request: jsonRequest(LOGOUT_URL, {}),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await logoutPost(ctx)

    expect(res.status).toBe(200)
    expect(await readJson(res)).toEqual({ ok: true })
  })

  it('revokes the session when there is one', async () => {
    const mock = createD1Mock()
    const token = await createSession(mock, { userId: 'usr_1', email: 'user@pte.test' })
    expect(mock.sessions.size).toBe(1)

    const ctx = makeContext({
      request: jsonRequest(LOGOUT_URL, {}, 'POST', bearer(token)),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await logoutPost(ctx)

    expect(res.status).toBe(200)
    expect(await readJson(res)).toEqual({ ok: true })
    expect(mock.sessions.size).toBe(0)
  })

  it('revokes every session of the account when all is true', async () => {
    const mock = createD1Mock()
    await createSession(mock, { userId: 'usr_1', email: 'user@pte.test' })
    await createSession(mock, { userId: 'usr_1', email: 'user@pte.test' })
    const token = [...mock.sessions.keys()][0]!
    const bearerToken = await createSession(mock, { userId: 'usr_1', email: 'user@pte.test' })
    expect(mock.sessions.size).toBe(3)

    const ctx = makeContext({
      request: jsonRequest(LOGOUT_URL, { all: true }, 'POST', bearer(bearerToken)),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await logoutPost(ctx)

    expect(res.status).toBe(200)
    expect(mock.sessions.size).toBe(0)
    expect(token).toBeTruthy()
  })

  it('keeps the other sessions when all is not requested', async () => {
    const mock = createD1Mock()
    const token = await createSession(mock, { userId: 'usr_1', email: 'user@pte.test' })
    await createSession(mock, { userId: 'usr_1', email: 'user@pte.test' })
    expect(mock.sessions.size).toBe(2)

    const ctx = makeContext({
      request: jsonRequest(LOGOUT_URL, {}, 'POST', bearer(token)),
      env: makeEnv({ DB: mock.db }),
    })

    await logoutPost(ctx)

    expect(mock.sessions.size).toBe(1)
  })

  it('treats an unreadable body as a single session sign-out', async () => {
    const mock = createD1Mock()
    const token = await createSession(mock, { userId: 'usr_1', email: 'user@pte.test' })

    const ctx = makeContext({
      request: rawRequest(LOGOUT_URL, 'not json', 'POST', bearer(token)),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await logoutPost(ctx)

    expect(res.status).toBe(200)
    expect(mock.sessions.size).toBe(0)
  })

  it('treats a null body as a single session sign-out', async () => {
    const mock = createD1Mock()
    const token = await createSession(mock, { userId: 'usr_1', email: 'user@pte.test' })
    await createSession(mock, { userId: 'usr_1', email: 'user@pte.test' })

    const ctx = makeContext({
      request: jsonRequest(LOGOUT_URL, null, 'POST', bearer(token)),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await logoutPost(ctx)

    expect(res.status).toBe(200)
    expect(mock.sessions.size).toBe(1)
  })

  it('answers 200 for a token that is no longer valid', async () => {
    const mock = createD1Mock()
    const ctx = makeContext({
      request: jsonRequest(LOGOUT_URL, {}, 'POST', bearer('not-a-session-token')),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await logoutPost(ctx)

    expect(res.status).toBe(200)
    expect(await readJson(res)).toEqual({ ok: true })
  })

  it('answers 200 and logs when the session cannot be verified', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const mock = createD1Mock()
    const token = await createSession(mock, { userId: 'usr_1', email: 'user@pte.test' })
    const ctx = makeContext({
      request: jsonRequest(LOGOUT_URL, {}, 'POST', bearer(token)),
      env: makeEnv({ DB: mock.db, JWT_SECRET: 'too-short' }),
    })

    const res = await logoutPost(ctx)

    expect(res.status).toBe(200)
    expect(await readJson(res)).toEqual({ ok: true })
    expect(warn).toHaveBeenCalled()
    expect(mock.sessions.size).toBe(1)
  })

  it('answers 500 when there is no database binding', async () => {
    const ctx = makeContext({
      request: jsonRequest(LOGOUT_URL, {}),
      env: makeEnv({ DB: undefined }),
    })

    const res = await logoutPost(ctx)

    expect(res.status).toBe(500)
    expect(await readJson(res)).toEqual({ error: 'Database binding unavailable' })
  })

  it('answers 429 when the per ip limit is exhausted', async () => {
    const mock = createD1Mock({
      rateLimits: [{ key: `logout:ip:${IP}`, count: 30, reset_at: nowSeconds() + 600 }],
    })
    const ctx = makeContext({
      request: jsonRequest(LOGOUT_URL, {}, 'POST', IP_HEADERS),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await logoutPost(ctx)

    expect(res.status).toBe(429)
  })
})

/* ---------------------------------------------------------------------------
   GET and PATCH /api/auth/me
   --------------------------------------------------------------------------- */

describe('GET /api/auth/me', () => {
  const ME_URL = 'https://site.test/api/auth/me'

  it('rejects an unauthenticated request', async () => {
    const mock = createD1Mock()
    const ctx = makeContext({
      request: jsonRequest(ME_URL, {}, 'GET'),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await meGet(ctx)

    expect(res.status).toBe(401)
    expect(await readJson(res)).toEqual({ error: 'Unauthorized' })
  })

  it('returns the profile for an authenticated user', async () => {
    const mock = createD1Mock()
    const { row } = await seedUser(mock, {
      email: 'user@pte.test',
      password: 'password123',
      targetScore: 68,
    })
    const token = await createSession(mock, { userId: row.id, email: row.email })
    const ctx = makeContext({
      request: jsonRequest(ME_URL, {}, 'GET', bearer(token)),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await meGet(ctx)

    expect(res.status).toBe(200)
    const body = await readJson(res)
    expect(body.user).toEqual({ id: row.id, email: 'user@pte.test', targetScore: 68 })
    expect(typeof body.expiresAt).toBe('number')
  })

  it('rejects an invalid session', async () => {
    const mock = createD1Mock()
    const ctx = makeContext({
      request: jsonRequest(ME_URL, {}, 'GET', bearer('not-a-session-token')),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await meGet(ctx)

    expect(res.status).toBe(401)
    expect(await readJson(res)).toEqual({ error: 'Invalid or expired session' })
  })

  it('answers 404 when the user row is gone', async () => {
    const mock = createD1Mock()
    const token = await createSession(mock, { userId: 'usr_gone', email: 'user@pte.test' })
    const ctx = makeContext({
      request: jsonRequest(ME_URL, {}, 'GET', bearer(token)),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await meGet(ctx)

    expect(res.status).toBe(404)
    expect(await readJson(res)).toEqual({ error: 'User not found' })
  })

  it('answers 500 when there is no database binding', async () => {
    const ctx = makeContext({
      request: jsonRequest(ME_URL, {}, 'GET', bearer('token')),
      env: makeEnv({ DB: undefined }),
    })

    const res = await meGet(ctx)

    expect(res.status).toBe(500)
    expect(await readJson(res)).toEqual({ error: 'Database binding unavailable' })
  })
})

describe('PATCH /api/auth/me', () => {
  const ME_URL = 'https://site.test/api/auth/me'

  async function signedIn(mock: D1Mock): Promise<{ token: string; userId: string }> {
    const { row } = await seedUser(mock, { email: 'user@pte.test', password: 'password123' })
    const token = await createSession(mock, { userId: row.id, email: row.email })
    return { token, userId: row.id }
  }

  it('rejects an unauthenticated request', async () => {
    const mock = createD1Mock()
    const ctx = makeContext({
      request: jsonRequest(ME_URL, { targetScore: 70 }, 'PATCH'),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await mePatch(ctx)

    expect(res.status).toBe(401)
    expect(await readJson(res)).toEqual({ error: 'Unauthorized' })
  })

  it('updates the target score', async () => {
    const mock = createD1Mock()
    const { token, userId } = await signedIn(mock)
    const ctx = makeContext({
      request: jsonRequest(ME_URL, { targetScore: 75 }, 'PATCH', bearer(token)),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await mePatch(ctx)

    expect(res.status).toBe(200)
    expect(await readJson(res)).toEqual({ ok: true })
    expect(mock.users.get(userId)?.target_score).toBe(75)
  })

  it('clamps and rounds the target score', async () => {
    const mock = createD1Mock()
    const { token, userId } = await signedIn(mock)
    const ctx = makeContext({
      request: jsonRequest(ME_URL, { targetScore: 95.4 }, 'PATCH', bearer(token)),
      env: makeEnv({ DB: mock.db }),
    })

    await mePatch(ctx)

    expect(mock.users.get(userId)?.target_score).toBe(90)
  })

  it('rejects a target score that is not a finite number', async () => {
    const mock = createD1Mock()
    const { token } = await signedIn(mock)
    const ctx = makeContext({
      request: jsonRequest(ME_URL, { targetScore: 'high' }, 'PATCH', bearer(token)),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await mePatch(ctx)

    expect(res.status).toBe(400)
    expect(await readJson(res)).toEqual({ error: 'Target score must be a finite number.' })
  })

  it('rejects a malformed JSON body', async () => {
    const mock = createD1Mock()
    const { token } = await signedIn(mock)
    const ctx = makeContext({
      request: rawRequest(ME_URL, 'not json', 'PATCH', bearer(token)),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await mePatch(ctx)

    expect(res.status).toBe(400)
    expect(await readJson(res)).toEqual({ error: 'Invalid JSON request' })
  })

  it('requires the current password to change the password', async () => {
    const mock = createD1Mock()
    const { token } = await signedIn(mock)
    const ctx = makeContext({
      request: jsonRequest(ME_URL, { newPassword: 'newpassword123' }, 'PATCH', bearer(token)),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await mePatch(ctx)

    expect(res.status).toBe(400)
    expect(await readJson(res)).toEqual({ error: 'Current password is required.' })
  })

  it('rejects an incorrect current password', async () => {
    const mock = createD1Mock()
    const { token } = await signedIn(mock)
    const ctx = makeContext({
      request: jsonRequest(
        ME_URL,
        { newPassword: 'newpassword123', currentPassword: 'wrong-password' },
        'PATCH',
        bearer(token),
      ),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await mePatch(ctx)

    expect(res.status).toBe(400)
    expect(await readJson(res)).toEqual({ error: 'Current password is incorrect.' })
  })

  it('rejects a new password that is too short', async () => {
    const mock = createD1Mock()
    const { token } = await signedIn(mock)
    const ctx = makeContext({
      request: jsonRequest(
        ME_URL,
        { newPassword: 'short', currentPassword: 'password123' },
        'PATCH',
        bearer(token),
      ),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await mePatch(ctx)

    expect(res.status).toBe(400)
    expect(await readJson(res)).toEqual({ error: 'Password must be at least 8 characters.' })
  })

  it('rejects a new password that is too long', async () => {
    const mock = createD1Mock()
    const { token } = await signedIn(mock)
    const ctx = makeContext({
      request: jsonRequest(
        ME_URL,
        { newPassword: 'x'.repeat(129), currentPassword: 'password123' },
        'PATCH',
        bearer(token),
      ),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await mePatch(ctx)

    expect(res.status).toBe(400)
    expect(await readJson(res)).toEqual({ error: 'Password is too long (max 128 characters).' })
  })

  it('changes the password, revokes the old sessions and returns a new token', async () => {
    const mock = createD1Mock()
    const { token, userId } = await signedIn(mock)
    const oldHash = mock.users.get(userId)?.password_hash
    const ctx = makeContext({
      request: jsonRequest(
        ME_URL,
        { newPassword: 'newpassword123', currentPassword: 'password123' },
        'PATCH',
        bearer(token),
      ),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await mePatch(ctx)

    expect(res.status).toBe(200)
    const body = await readJson(res)
    expect(body.ok).toBe(true)
    expect(typeof body.token).toBe('string')
    expect((body.token as string).split('.')).toHaveLength(2)
    expect(typeof body.expiresAt).toBe('number')
    expect(mock.users.get(userId)?.password_hash).not.toBe(oldHash)
    expect(mock.sessions.size).toBe(1)
  })

  it('answers 404 when the user row is gone', async () => {
    const mock = createD1Mock()
    const token = await createSession(mock, { userId: 'usr_gone', email: 'user@pte.test' })
    const ctx = makeContext({
      request: jsonRequest(
        ME_URL,
        { newPassword: 'newpassword123', currentPassword: 'password123' },
        'PATCH',
        bearer(token),
      ),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await mePatch(ctx)

    expect(res.status).toBe(404)
    expect(await readJson(res)).toEqual({ error: 'User not found' })
  })

  it('answers 429 when the password change limit is exhausted', async () => {
    const mock = createD1Mock()
    const { token, userId } = await signedIn(mock)
    mock.rateLimits.set(`pwchange:${userId}`, {
      key: `pwchange:${userId}`,
      count: 5,
      reset_at: nowSeconds() + 300,
    })
    const ctx = makeContext({
      request: jsonRequest(
        ME_URL,
        { newPassword: 'newpassword123', currentPassword: 'password123' },
        'PATCH',
        bearer(token),
      ),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await mePatch(ctx)

    expect(res.status).toBe(429)
  })

  it('answers 500 when there is no database binding', async () => {
    const ctx = makeContext({
      request: jsonRequest(ME_URL, { targetScore: 70 }, 'PATCH', bearer('token')),
      env: makeEnv({ DB: undefined }),
    })

    const res = await mePatch(ctx)

    expect(res.status).toBe(500)
    expect(await readJson(res)).toEqual({ error: 'Database binding unavailable' })
  })

  it('rejects an invalid session', async () => {
    const mock = createD1Mock()
    const ctx = makeContext({
      request: jsonRequest(ME_URL, { targetScore: 70 }, 'PATCH', bearer('not-a-session-token')),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await mePatch(ctx)

    expect(res.status).toBe(401)
    expect(await readJson(res)).toEqual({ error: 'Invalid or expired session' })
  })
})

/* ---------------------------------------------------------------------------
   POST /api/auth/forgot-password
   --------------------------------------------------------------------------- */

describe('POST /api/auth/forgot-password', () => {
  const FORGOT_URL = 'https://site.test/api/auth/forgot-password'
  const GENERIC = {
    ok: true,
    message: 'If an account exists with that email, we have sent password reset instructions.',
  }

  function stubBrevo(ok = true): void {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (): Promise<Response> =>
        ok
          ? new Response(JSON.stringify({ messageId: 'msg_1' }), { status: 201 })
          : new Response(JSON.stringify({ message: 'Brevo is down' }), { status: 500 }),
      ),
    )
  }

  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  })

  it('rejects a malformed JSON body', async () => {
    const mock = createD1Mock()
    const ctx = makeContext({
      request: rawRequest(FORGOT_URL, 'not json'),
      env: makeEnv({ DB: mock.db, BREVO_API_KEY: 'key', BREVO_SENDER_EMAIL: 'no-reply@pte.test' }),
    })

    const res = await forgotPost(ctx)

    expect(res.status).toBe(400)
    expect(await readJson(res)).toEqual({ error: 'Invalid JSON request' })
  })

  it('rejects an invalid email with 400', async () => {
    const mock = createD1Mock()
    const ctx = makeContext({
      request: jsonRequest(FORGOT_URL, { email: 'nope' }),
      env: makeEnv({ DB: mock.db, BREVO_API_KEY: 'key', BREVO_SENDER_EMAIL: 'no-reply@pte.test' }),
    })

    const res = await forgotPost(ctx)

    expect(res.status).toBe(400)
    expect(await readJson(res)).toEqual({ error: 'Please enter a valid email address' })
  })

  it('rejects a request with no email at all', async () => {
    const mock = createD1Mock()
    const ctx = makeContext({
      request: jsonRequest(FORGOT_URL, { password: 'password123' }),
      env: makeEnv({ DB: mock.db, BREVO_API_KEY: 'key', BREVO_SENDER_EMAIL: 'no-reply@pte.test' }),
    })

    const res = await forgotPost(ctx)

    expect(res.status).toBe(400)
    expect(await readJson(res)).toEqual({ error: 'Please enter a valid email address' })
  })

  it('does not pad a response that was already slow enough', async () => {
    stubBrevo()
    const mock = createD1Mock()
    const db = withOverrides(mock.db, [
      {
        match: (sql) => sql.includes('FROM users WHERE email = ?'),
        first: async () => {
          await sleep(400)
          return null
        },
      },
    ])
    const ctx = makeContext({
      request: jsonRequest(FORGOT_URL, { email: 'nobody@pte.test' }),
      env: makeEnv({ DB: db, BREVO_API_KEY: 'key', BREVO_SENDER_EMAIL: 'no-reply@pte.test' }),
    })

    const res = await forgotPost(ctx)

    expect(res.status).toBe(200)
    expect(await readJson(res)).toEqual(GENERIC)
  })

  it('returns 500 when there is no database binding', async () => {
    const ctx = makeContext({
      request: jsonRequest(FORGOT_URL, { email: 'user@pte.test' }),
      env: makeEnv({ DB: undefined, BREVO_API_KEY: 'key', BREVO_SENDER_EMAIL: 'no-reply@pte.test' }),
    })

    const res = await forgotPost(ctx)

    expect(res.status).toBe(500)
    expect(await readJson(res)).toEqual({ error: 'Database binding unavailable' })
  })

  it('returns 503 when the email service is not configured', async () => {
    const mock = createD1Mock()
    const ctx = makeContext({
      request: jsonRequest(FORGOT_URL, { email: 'user@pte.test' }),
      env: makeEnv({ DB: mock.db, BREVO_API_KEY: undefined, BREVO_SENDER_EMAIL: undefined }),
    })

    const res = await forgotPost(ctx)

    expect(res.status).toBe(503)
    expect(await readJson(res)).toEqual({ error: 'Email service is currently unavailable.' })
  })

  it('returns a generic 200 and stores a reset token when the account exists', async () => {
    stubBrevo()
    const mock = createD1Mock()
    const { row } = await seedUser(mock, { email: 'user@pte.test', password: 'password123' })
    const ctx = makeContext({
      request: jsonRequest(FORGOT_URL, { email: 'user@pte.test' }),
      env: makeEnv({
        DB: mock.db,
        BREVO_API_KEY: 'key',
        BREVO_SENDER_EMAIL: 'no-reply@pte.test',
        BREVO_SENDER_NAME: 'PTE Prep Team',
      }),
    })

    const res = await forgotPost(ctx)

    expect(res.status).toBe(200)
    expect(await readJson(res)).toEqual(GENERIC)
    expect(mock.resets.size).toBe(1)
    const reset = [...mock.resets.values()][0]!
    expect(reset.user_id).toBe(row.id)
    expect(reset.token_hash).toMatch(/^[0-9a-f]{64}$/)
    expect(reset.used_at).toBeNull()
  })

  it('returns the same generic 200 when the account does not exist', async () => {
    stubBrevo()
    const mock = createD1Mock()
    const ctx = makeContext({
      request: jsonRequest(FORGOT_URL, { email: 'nobody@pte.test' }),
      env: makeEnv({ DB: mock.db, BREVO_API_KEY: 'key', BREVO_SENDER_EMAIL: 'no-reply@pte.test' }),
    })

    const res = await forgotPost(ctx)

    expect(res.status).toBe(200)
    expect(await readJson(res)).toEqual(GENERIC)
    expect(mock.resets.size).toBe(0)
  })

  it('does not reveal whether the account exists', async () => {
    stubBrevo()
    const mock = createD1Mock()
    await seedUser(mock, { email: 'user@pte.test', password: 'password123' })

    const known = await forgotPost(
      makeContext({
        request: jsonRequest(FORGOT_URL, { email: 'user@pte.test' }),
        env: makeEnv({ DB: mock.db, BREVO_API_KEY: 'key', BREVO_SENDER_EMAIL: 'no-reply@pte.test' }),
      }),
    )
    const unknown = await forgotPost(
      makeContext({
        request: jsonRequest(FORGOT_URL, { email: 'nobody@pte.test' }),
        env: makeEnv({ DB: mock.db, BREVO_API_KEY: 'key', BREVO_SENDER_EMAIL: 'no-reply@pte.test' }),
      }),
    )

    expect(known.status).toBe(unknown.status)
    expect(await readJson(known)).toEqual(await readJson(unknown))
  })

  it('does not send a second email inside the throttle window', async () => {
    stubBrevo()
    const mock = createD1Mock()
    const { row } = await seedUser(mock, { email: 'user@pte.test', password: 'password123' })
    seedReset(mock, {
      id: 'rst_1',
      user_id: row.id,
      token_hash: 'a'.repeat(64),
      expires_at: new Date(Date.now() + 60_000).toISOString(),
      created_at: new Date().toISOString(),
      used_at: null,
    })
    const ctx = makeContext({
      request: jsonRequest(FORGOT_URL, { email: 'user@pte.test' }),
      env: makeEnv({ DB: mock.db, BREVO_API_KEY: 'key', BREVO_SENDER_EMAIL: 'no-reply@pte.test' }),
    })

    const res = await forgotPost(ctx)

    expect(res.status).toBe(200)
    expect(await readJson(res)).toEqual(GENERIC)
    expect(mock.resets.size).toBe(1)
    expect(fetch).toHaveBeenCalledTimes(0)
  })

  it('returns 503 when the email cannot be delivered', async () => {
    stubBrevo(false)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const mock = createD1Mock()
    await seedUser(mock, { email: 'user@pte.test', password: 'password123' })
    const ctx = makeContext({
      request: jsonRequest(FORGOT_URL, { email: 'user@pte.test' }),
      env: makeEnv({ DB: mock.db, BREVO_API_KEY: 'key', BREVO_SENDER_EMAIL: 'no-reply@pte.test' }),
    })

    const res = await forgotPost(ctx)

    expect(res.status).toBe(503)
    expect(await readJson(res)).toEqual({
      error: 'Email delivery failed. Please try again later.',
    })
  })

  it('builds the reset link from SITE_ORIGIN when it is set', async () => {
    const fetchMock = vi.fn(
      async (..._args: unknown[]): Promise<Response> =>
        new Response(JSON.stringify({ messageId: 'msg_1' }), { status: 201 }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const mock = createD1Mock()
    await seedUser(mock, { email: 'user@pte.test', password: 'password123' })
    const ctx = makeContext({
      request: jsonRequest(FORGOT_URL, { email: 'user@pte.test' }),
      env: makeEnv({
        DB: mock.db,
        BREVO_API_KEY: 'key',
        BREVO_SENDER_EMAIL: 'no-reply@pte.test',
        SITE_ORIGIN: 'https://pte-prep.pages.dev',
      }),
    })

    await forgotPost(ctx)

    const call = fetchMock.mock.calls[0]
    const init = call?.[1] as { body?: string } | undefined
    expect(init?.body).toContain('https://pte-prep.pages.dev/reset-password?token=')
  })

  it('builds the reset link from the request origin when SITE_ORIGIN is not set', async () => {
    const fetchMock = vi.fn(
      async (..._args: unknown[]): Promise<Response> =>
        new Response(JSON.stringify({ messageId: 'msg_1' }), { status: 201 }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const mock = createD1Mock()
    await seedUser(mock, { email: 'user@pte.test', password: 'password123' })
    const ctx = makeContext({
      request: jsonRequest(FORGOT_URL, { email: 'user@pte.test' }),
      env: makeEnv({ DB: mock.db, BREVO_API_KEY: 'key', BREVO_SENDER_EMAIL: 'no-reply@pte.test' }),
    })

    await forgotPost(ctx)

    const call = fetchMock.mock.calls[0]
    const init = call?.[1] as { body?: string } | undefined
    expect(init?.body).toContain('https://site.test/reset-password?token=')
  })

  it('answers 429 when the per ip limit is exhausted', async () => {
    stubBrevo()
    const mock = createD1Mock({
      rateLimits: [{ key: `forgot-password:ip:${IP}`, count: 10, reset_at: nowSeconds() + 600 }],
    })
    const ctx = makeContext({
      request: jsonRequest(FORGOT_URL, { email: 'user@pte.test' }, 'POST', IP_HEADERS),
      env: makeEnv({ DB: mock.db, BREVO_API_KEY: 'key', BREVO_SENDER_EMAIL: 'no-reply@pte.test' }),
    })

    const res = await forgotPost(ctx)

    expect(res.status).toBe(429)
  })

  it('answers 429 when the per email limit is exhausted', async () => {
    stubBrevo()
    const mock = createD1Mock({
      rateLimits: [
        { key: 'forgot-password:email:user@pte.test', count: 3, reset_at: nowSeconds() + 600 },
      ],
    })
    const ctx = makeContext({
      request: jsonRequest(FORGOT_URL, { email: 'user@pte.test' }, 'POST', IP_HEADERS),
      env: makeEnv({ DB: mock.db, BREVO_API_KEY: 'key', BREVO_SENDER_EMAIL: 'no-reply@pte.test' }),
    })

    const res = await forgotPost(ctx)

    expect(res.status).toBe(429)
  })
})

/* ---------------------------------------------------------------------------
   POST /api/auth/reset-password
   --------------------------------------------------------------------------- */

describe('POST /api/auth/reset-password', () => {
  const RESET_URL = 'https://site.test/api/auth/reset-password'
  const RAW_TOKEN = 'r'.repeat(64)

  async function seedResetToken(mock: D1Mock, userId: string): Promise<void> {
    seedReset(mock, {
      id: 'rst_1',
      user_id: userId,
      token_hash: await sha256Hex(RAW_TOKEN),
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      used_at: null,
    })
  }

  it('rejects a malformed JSON body', async () => {
    const mock = createD1Mock()
    const ctx = makeContext({
      request: rawRequest(RESET_URL, 'not json'),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await resetPost(ctx)

    expect(res.status).toBe(400)
    expect(await readJson(res)).toEqual({ error: 'Invalid JSON request' })
  })

  it('rejects a missing token', async () => {
    const mock = createD1Mock()
    const ctx = makeContext({
      request: jsonRequest(RESET_URL, { password: 'newpassword123' }),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await resetPost(ctx)

    expect(res.status).toBe(400)
    expect(await readJson(res)).toEqual({ error: 'Reset token is invalid or missing.' })
  })

  it('rejects a token that is too short', async () => {
    const mock = createD1Mock()
    const ctx = makeContext({
      request: jsonRequest(RESET_URL, { token: 'short', password: 'newpassword123' }),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await resetPost(ctx)

    expect(res.status).toBe(400)
    expect(await readJson(res)).toEqual({ error: 'Reset token is invalid or missing.' })
  })

  it('rejects a token that is too long', async () => {
    const mock = createD1Mock()
    const ctx = makeContext({
      request: jsonRequest(RESET_URL, { token: 'x'.repeat(129), password: 'newpassword123' }),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await resetPost(ctx)

    expect(res.status).toBe(400)
    expect(await readJson(res)).toEqual({ error: 'Reset token is invalid or missing.' })
  })

  it('rejects a password that is too short', async () => {
    const mock = createD1Mock()
    const ctx = makeContext({
      request: jsonRequest(RESET_URL, { token: RAW_TOKEN, password: 'short' }),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await resetPost(ctx)

    expect(res.status).toBe(400)
    expect(await readJson(res)).toEqual({
      error: 'Password must be between 8 and 128 characters.',
    })
  })

  it('rejects a password that is too long', async () => {
    const mock = createD1Mock()
    const ctx = makeContext({
      request: jsonRequest(RESET_URL, { token: RAW_TOKEN, password: 'x'.repeat(129) }),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await resetPost(ctx)

    expect(res.status).toBe(400)
    expect(await readJson(res)).toEqual({
      error: 'Password must be between 8 and 128 characters.',
    })
  })

  it('rejects a password that is not a string', async () => {
    const mock = createD1Mock()
    const ctx = makeContext({
      request: jsonRequest(RESET_URL, { token: RAW_TOKEN, password: 12_345_678 }),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await resetPost(ctx)

    expect(res.status).toBe(400)
    expect(await readJson(res)).toEqual({
      error: 'Password must be between 8 and 128 characters.',
    })
  })

  it('rejects a token that is not in the database', async () => {
    const mock = createD1Mock()
    const ctx = makeContext({
      request: jsonRequest(RESET_URL, { token: RAW_TOKEN, password: 'newpassword123' }),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await resetPost(ctx)

    expect(res.status).toBe(400)
    expect(await readJson(res)).toEqual({
      error: 'Invalid or expired password reset link. Please request a new one.',
    })
  })

  it('succeeds with a fresh session token when the token is valid', async () => {
    const mock = createD1Mock()
    const { row } = await seedUser(mock, { email: 'user@pte.test', password: 'password123' })
    await seedResetToken(mock, row.id)
    const oldHash = mock.users.get(row.id)?.password_hash
    const ctx = makeContext({
      request: jsonRequest(RESET_URL, { token: RAW_TOKEN, password: 'newpassword123' }),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await resetPost(ctx)

    expect(res.status).toBe(200)
    const body = await readJson(res)
    expect(body.ok).toBe(true)
    expect(body.message).toBe('Password reset successful.')
    expect(typeof body.token).toBe('string')
    expect((body.token as string).split('.')).toHaveLength(2)
    expect(body.user).toEqual({ id: row.id, email: 'user@pte.test', targetScore: 65 })
    expect(mock.users.get(row.id)?.password_hash).not.toBe(oldHash)
    expect(mock.sessions.size).toBe(1)
  })

  it('answers 200 without a token when the user row has gone', async () => {
    const mock = createD1Mock()
    await seedResetToken(mock, 'usr_ghost')
    const ctx = makeContext({
      request: jsonRequest(RESET_URL, { token: RAW_TOKEN, password: 'newpassword123' }),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await resetPost(ctx)

    expect(res.status).toBe(200)
    expect(await readJson(res)).toEqual({
      ok: true,
      message: 'Password reset successful.',
    })
  })

  it('answers 400 when the claimed token cannot be read back', async () => {
    const mock = createD1Mock()
    const { row } = await seedUser(mock, { email: 'user@pte.test', password: 'password123' })
    await seedResetToken(mock, row.id)
    const db = withOverrides(mock.db, [
      {
        match: (sql) => sql.includes('FROM password_resets WHERE token_hash = ?'),
        first: async () => null,
      },
    ])
    const ctx = makeContext({
      request: jsonRequest(RESET_URL, { token: RAW_TOKEN, password: 'newpassword123' }),
      env: makeEnv({ DB: db }),
    })

    const res = await resetPost(ctx)

    expect(res.status).toBe(400)
    expect(await readJson(res)).toEqual({
      error: 'Invalid or expired password reset link. Please request a new one.',
    })
  })

  it('answers 500 when there is no database binding', async () => {
    const ctx = makeContext({
      request: jsonRequest(RESET_URL, { token: RAW_TOKEN, password: 'newpassword123' }),
      env: makeEnv({ DB: undefined }),
    })

    const res = await resetPost(ctx)

    expect(res.status).toBe(500)
    expect(await readJson(res)).toEqual({ error: 'Database binding unavailable' })
  })

  it('answers 429 when the per ip limit is exhausted', async () => {
    const mock = createD1Mock({
      rateLimits: [{ key: `reset-password:ip:${IP}`, count: 10, reset_at: nowSeconds() + 600 }],
    })
    const ctx = makeContext({
      request: jsonRequest(RESET_URL, { token: RAW_TOKEN, password: 'newpassword123' }, 'POST', IP_HEADERS),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await resetPost(ctx)

    expect(res.status).toBe(429)
  })
})
