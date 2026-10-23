import { describe, expect, it, vi } from 'vitest'

import './webcrypto'
import { onRequestPost as logoutPost } from '../../functions/api/auth/logout'
import { createD1Mock } from './d1'
import { bearer, jsonRequest, makeContext, makeEnv, readJson } from './support'

/*
 * `verifySessionToken` always hands back a session that carries a session id
 * when a database is supplied — it returns `null` rather than a session
 * without one — so the handler's `else if (session.jti)` branch cannot be
 * reached through the real verifier. The handler still has to cope with a
 * session that has none, so the verifier is stubbed here to produce exactly
 * that.
 */
vi.mock('../../functions/lib/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../functions/lib/auth')>()
  return {
    ...actual,
    verifySessionToken: vi.fn(async () => ({ userId: 'usr_1', email: 'user@pte.test' })),
  }
})

describe('POST /api/auth/logout with a session that carries no session id', () => {
  it('answers 200 and revokes nothing', async () => {
    const mock = createD1Mock()
    const ctx = makeContext({
      request: jsonRequest('https://site.test/api/auth/logout', {}, 'POST', bearer('some-token')),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await logoutPost(ctx)

    expect(res.status).toBe(200)
    expect(await readJson(res)).toEqual({ ok: true })
    expect(mock.sessions.size).toBe(0)
  })

  it('still revokes every session when all is requested', async () => {
    const mock = createD1Mock()
    mock.sessions.set('jti_1', { jti: 'jti_1', user_id: 'usr_1', expires_at: 9_999_999_999 })
    const ctx = makeContext({
      request: jsonRequest(
        'https://site.test/api/auth/logout',
        { all: true },
        'POST',
        bearer('some-token'),
      ),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await logoutPost(ctx)

    expect(res.status).toBe(200)
    expect(mock.sessions.size).toBe(0)
  })
})
