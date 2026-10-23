import { describe, expect, it, vi, afterEach } from 'vitest'

import './webcrypto'
import {
  onRequestDelete as listDelete,
  onRequestGet as listGet,
  onRequestPost as listPost,
} from '../../functions/api/attempts/index'
import {
  onRequestDelete as itemDelete,
  onRequestGet as itemGet,
} from '../../functions/api/attempts/[id]'
import { createD1Mock } from './d1'
import type { D1Mock } from './d1'
import {
  bearer,
  createSession,
  createToken,
  jsonRequest,
  makeContext,
  makeEnv,
  nowSeconds,
  rawRequest,
  readJson,
  requestWith,
  seedAttempt,
  seedUser,
  withOverrides,
} from './support'
import { makeAttemptRow } from './support'

const ATTEMPTS_URL = 'https://site.test/api/attempts'

afterEach(() => {
  vi.unstubAllGlobals()
})

interface SignedIn {
  mock: D1Mock
  token: string
  userId: string
}

async function signedIn(): Promise<SignedIn> {
  const mock = createD1Mock()
  const { row } = await seedUser(mock, { email: 'user@pte.test', password: 'password123' })
  const token = await createSession(mock, { userId: row.id, email: row.email })
  return { mock, token, userId: row.id }
}

/* ---------------------------------------------------------------------------
   GET /api/attempts
   --------------------------------------------------------------------------- */

describe('GET /api/attempts', () => {
  it('rejects an unauthenticated request', async () => {
    const mock = createD1Mock()
    const ctx = makeContext({
      request: requestWith(ATTEMPTS_URL, { method: 'GET' }),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await listGet(ctx)

    expect(res.status).toBe(401)
    expect(await readJson(res)).toEqual({ error: 'Unauthorized' })
  })

  it('rejects an invalid session', async () => {
    const mock = createD1Mock()
    const ctx = makeContext({
      request: requestWith(ATTEMPTS_URL, {
        method: 'GET',
        headers: bearer('not-a-session-token'),
      }),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await listGet(ctx)

    expect(res.status).toBe(401)
    expect(await readJson(res)).toEqual({ error: 'Invalid or expired session' })
  })

  it('returns an empty list when the account has no attempts', async () => {
    const { mock, token } = await signedIn()
    const ctx = makeContext({
      request: requestWith(ATTEMPTS_URL, { method: 'GET', headers: bearer(token) }),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await listGet(ctx)

    expect(res.status).toBe(200)
    expect(await readJson(res)).toEqual({ attempts: [] })
  })

  it('returns the id list when ids=1 is asked for', async () => {
    const { mock, token, userId } = await signedIn()
    seedAttempt(
      mock,
      makeAttemptRow({ id: 'attempt_0001', user_id: userId, finished_at: '2024-01-03T00:00:00.000Z' }),
    )
    seedAttempt(
      mock,
      makeAttemptRow({ id: 'attempt_0002', user_id: userId, finished_at: '2024-01-02T00:00:00.000Z' }),
    )
    seedAttempt(
      mock,
      makeAttemptRow({ id: 'attempt_0003', user_id: userId, finished_at: '2024-01-01T00:00:00.000Z' }),
    )
    const ctx = makeContext({
      request: requestWith(`${ATTEMPTS_URL}?ids=1`, { method: 'GET', headers: bearer(token) }),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await listGet(ctx)

    expect(res.status).toBe(200)
    expect(await readJson(res)).toEqual({
      ids: ['attempt_0001', 'attempt_0002', 'attempt_0003'],
      hasMore: false,
      nextOffset: 3,
    })
  })

  it('reports that there is more when the page is full', async () => {
    const { mock, token, userId } = await signedIn()
    seedAttempt(
      mock,
      makeAttemptRow({ id: 'attempt_0001', user_id: userId, finished_at: '2024-01-03T00:00:00.000Z' }),
    )
    seedAttempt(
      mock,
      makeAttemptRow({ id: 'attempt_0002', user_id: userId, finished_at: '2024-01-02T00:00:00.000Z' }),
    )
    seedAttempt(
      mock,
      makeAttemptRow({ id: 'attempt_0003', user_id: userId, finished_at: '2024-01-01T00:00:00.000Z' }),
    )
    const ctx = makeContext({
      request: requestWith(`${ATTEMPTS_URL}?ids=1&limit=2`, {
        method: 'GET',
        headers: bearer(token),
      }),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await listGet(ctx)

    expect(await readJson(res)).toEqual({
      ids: ['attempt_0001', 'attempt_0002'],
      hasMore: true,
      nextOffset: 2,
    })
  })

  it('clamps the page size to at least one and at most two thousand', async () => {
    const { mock, token, userId } = await signedIn()
    seedAttempt(mock, makeAttemptRow({ id: 'attempt_0001', user_id: userId }))
    seedAttempt(mock, makeAttemptRow({ id: 'attempt_0002', user_id: userId }))

    const tooSmall = await listGet(
      makeContext({
        request: requestWith(`${ATTEMPTS_URL}?ids=1&limit=0`, { method: 'GET', headers: bearer(token) }),
        env: makeEnv({ DB: mock.db }),
      }),
    )
    const small = (await readJson(tooSmall)) as { ids: string[]; hasMore: boolean }
    expect(small.ids).toHaveLength(1)
    expect(small.hasMore).toBe(true)

    const tooBig = await listGet(
      makeContext({
        request: requestWith(`${ATTEMPTS_URL}?ids=1&limit=9999`, {
          method: 'GET',
          headers: bearer(token),
        }),
        env: makeEnv({ DB: mock.db }),
      }),
    )
    const big = (await readJson(tooBig)) as { ids: string[]; hasMore: boolean }
    expect(big.ids).toHaveLength(2)
    expect(big.hasMore).toBe(false)
  })

  it('falls back to a thousand rows for a page size that is not a number', async () => {
    const { mock, token, userId } = await signedIn()
    seedAttempt(mock, makeAttemptRow({ id: 'attempt_0001', user_id: userId }))
    const ctx = makeContext({
      request: requestWith(`${ATTEMPTS_URL}?ids=1&limit=many`, {
        method: 'GET',
        headers: bearer(token),
      }),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await listGet(ctx)
    const body = (await readJson(res)) as { ids: string[] }

    expect(body.ids).toEqual(['attempt_0001'])
  })

  it('clamps a negative offset to zero and ignores one that is not a number', async () => {
    const { mock, token, userId } = await signedIn()
    seedAttempt(mock, makeAttemptRow({ id: 'attempt_0001', user_id: userId }))

    const negative = await listGet(
      makeContext({
        request: requestWith(`${ATTEMPTS_URL}?ids=1&offset=-5`, {
          method: 'GET',
          headers: bearer(token),
        }),
        env: makeEnv({ DB: mock.db }),
      }),
    )
    expect((await readJson(negative)) as { nextOffset: number }).toEqual(
      expect.objectContaining({ nextOffset: 1 }),
    )

    const notANumber = await listGet(
      makeContext({
        request: requestWith(`${ATTEMPTS_URL}?ids=1&offset=later`, {
          method: 'GET',
          headers: bearer(token),
        }),
        env: makeEnv({ DB: mock.db }),
      }),
    )
    expect((await readJson(notANumber)) as { nextOffset: number }).toEqual(
      expect.objectContaining({ nextOffset: 1 }),
    )
  })

  it('returns an empty id list when the query returns no rows at all', async () => {
    const { mock, token } = await signedIn()
    const db = withOverrides(mock.db, [
      {
        match: (sql) => sql.includes('FROM attempts'),
        all: async () => ({}) as { results: unknown[] },
      },
    ])
    const ctx = makeContext({
      request: requestWith(`${ATTEMPTS_URL}?ids=1`, { method: 'GET', headers: bearer(token) }),
      env: makeEnv({ DB: db }),
    })

    const res = await listGet(ctx)

    expect(await readJson(res)).toEqual({ ids: [], hasMore: false, nextOffset: 0 })
  })

  it('returns the full attempt list', async () => {
    const { mock, token, userId } = await signedIn()
    seedAttempt(
      mock,
      makeAttemptRow({
        id: 'attempt_0001',
        user_id: userId,
        skill_scores: '{"reading": 30}',
        breakdown: '{"listening": 20}',
      }),
    )
    const ctx = makeContext({
      request: requestWith(ATTEMPTS_URL, { method: 'GET', headers: bearer(token) }),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await listGet(ctx)

    expect(res.status).toBe(200)
    const body = (await readJson(res)) as { attempts: Record<string, unknown>[] }
    expect(body.attempts).toHaveLength(1)
    expect(body.attempts[0]).toMatchObject({
      id: 'attempt_0001',
      userId: userId,
      mockId: 'mock-1',
      mockTitle: 'Mock Test 1',
      mode: 'full',
      durationMs: 3_600_000,
      overallScore: 68,
      overallScore60: 50,
      cefr: 'B2',
      earnedPoints: 45,
      availablePoints: 60,
      skillScores: { reading: 30 },
      breakdown: { listening: 20 },
      seed: 0,
      sectionIds: ['speaking-writing', 'reading', 'listening'],
      overallIsEstimate: true,
      completedItemIds: [],
      responses: {},
    })
  })

  it('unwraps the stored responses payload', async () => {
    const { mock, token, userId } = await signedIn()
    seedAttempt(
      mock,
      makeAttemptRow({
        id: 'attempt_0001',
        user_id: userId,
        responses: JSON.stringify({
          responses: { 'item-1': { answer: 'yes' } },
          seed: 7,
          mockKind: 'academic',
          details: [{ maxPoints: 3, traits: { clarity: 2 } }],
          untimed: true,
          timeScale: 1.5,
          sectionIds: ['reading'],
        }),
      }),
    )
    const ctx = makeContext({
      request: requestWith(ATTEMPTS_URL, { method: 'GET', headers: bearer(token) }),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await listGet(ctx)
    const body = (await readJson(res)) as { attempts: Record<string, unknown>[] }

    expect(body.attempts[0]).toMatchObject({
      mockKind: 'academic',
      untimed: true,
      timeScale: 1.5,
      seed: 7,
      sectionIds: ['reading'],
      overallIsEstimate: true,
      completedItemIds: ['item-1'],
      responses: { 'item-1': { answer: 'yes' } },
    })
    expect(body.attempts[0]?.details).toEqual([{ maxPoints: 3, traits: { clarity: 2 } }])
  })

  it('treats a responses payload without the wrapper as the responses themselves', async () => {
    const { mock, token, userId } = await signedIn()
    seedAttempt(
      mock,
      makeAttemptRow({
        id: 'attempt_0001',
        user_id: userId,
        responses: JSON.stringify({ 'item-1': { answer: 'yes' } }),
      }),
    )
    const ctx = makeContext({
      request: requestWith(ATTEMPTS_URL, { method: 'GET', headers: bearer(token) }),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await listGet(ctx)
    const body = (await readJson(res)) as { attempts: Record<string, unknown>[] }

    expect(body.attempts[0]?.responses).toEqual({ 'item-1': { answer: 'yes' } })
    expect(body.attempts[0]?.completedItemIds).toEqual(['item-1'])
  })

  it('marks an attempt as not estimated when no scored item carries traits', async () => {
    const { mock, token, userId } = await signedIn()
    seedAttempt(
      mock,
      makeAttemptRow({
        id: 'attempt_0001',
        user_id: userId,
        responses: JSON.stringify({ responses: {}, details: [{ maxPoints: 3 }] }),
      }),
    )
    const ctx = makeContext({
      request: requestWith(ATTEMPTS_URL, { method: 'GET', headers: bearer(token) }),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await listGet(ctx)
    const body = (await readJson(res)) as { attempts: Record<string, unknown>[] }

    expect(body.attempts[0]?.overallIsEstimate).toBe(false)
  })

  it('ignores corrupted json', async () => {
    const { mock, token, userId } = await signedIn()
    seedAttempt(
      mock,
      makeAttemptRow({
        id: 'attempt_0001',
        user_id: userId,
        skill_scores: '{not json',
        breakdown: '{also not json',
      }),
    )
    const ctx = makeContext({
      request: requestWith(ATTEMPTS_URL, { method: 'GET', headers: bearer(token) }),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await listGet(ctx)
    const body = (await readJson(res)) as { attempts: Record<string, unknown>[] }

    expect(body.attempts[0]?.skillScores).toEqual({})
    expect(body.attempts[0]?.breakdown).toEqual({})
  })

  it('ignores a responses payload that is not an object', async () => {
    const { mock, token, userId } = await signedIn()
    seedAttempt(
      mock,
      makeAttemptRow({ id: 'attempt_0001', user_id: userId, responses: 'null' }),
    )
    const ctx = makeContext({
      request: requestWith(ATTEMPTS_URL, { method: 'GET', headers: bearer(token) }),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await listGet(ctx)
    const body = (await readJson(res)) as { attempts: Record<string, unknown>[] }

    expect(body.attempts[0]?.responses).toEqual({})
    expect(body.attempts[0]?.completedItemIds).toEqual([])
  })

  it('falls back to the empty values when the stored responses carry none', async () => {
    const { mock, token, userId } = await signedIn()
    seedAttempt(
      mock,
      makeAttemptRow({
        id: 'attempt_0001',
        user_id: userId,
        responses: JSON.stringify({ responses: null, details: null }),
      }),
    )
    const ctx = makeContext({
      request: requestWith(ATTEMPTS_URL, { method: 'GET', headers: bearer(token) }),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await listGet(ctx)
    const body = (await readJson(res)) as { attempts: Record<string, unknown>[] }

    expect(body.attempts[0]?.responses).toEqual({})
    expect(body.attempts[0]?.details).toBeUndefined()
  })

  it('returns an empty list when the query returns no rows at all', async () => {
    const { mock, token } = await signedIn()
    const db = withOverrides(mock.db, [
      {
        match: (sql) => sql.includes('FROM attempts'),
        all: async () => ({}) as { results: unknown[] },
      },
    ])
    const ctx = makeContext({
      request: requestWith(ATTEMPTS_URL, { method: 'GET', headers: bearer(token) }),
      env: makeEnv({ DB: db }),
    })

    const res = await listGet(ctx)

    expect(await readJson(res)).toEqual({ attempts: [] })
  })

  it('answers 500 when there is no database binding', async () => {
    const token = await createToken({ userId: 'usr_1', email: 'user@pte.test' })
    const ctx = makeContext({
      request: requestWith(ATTEMPTS_URL, { method: 'GET', headers: bearer(token) }),
      env: makeEnv({ DB: undefined }),
    })

    const res = await listGet(ctx)

    expect(res.status).toBe(500)
    expect(await readJson(res)).toEqual({ error: 'Database binding unavailable' })
  })
})

/* ---------------------------------------------------------------------------
   POST /api/attempts
   --------------------------------------------------------------------------- */

describe('POST /api/attempts', () => {
  it('rejects an unauthenticated request', async () => {
    const mock = createD1Mock()
    const ctx = makeContext({
      request: jsonRequest(ATTEMPTS_URL, {}),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await listPost(ctx)

    expect(res.status).toBe(401)
    expect(await readJson(res)).toEqual({ error: 'Unauthorized' })
  })

  it('rejects an invalid session', async () => {
    const mock = createD1Mock()
    const ctx = makeContext({
      request: jsonRequest(ATTEMPTS_URL, {}, 'POST', bearer('not-a-session-token')),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await listPost(ctx)

    expect(res.status).toBe(401)
    expect(await readJson(res)).toEqual({ error: 'Invalid or expired session' })
  })

  it('rejects a malformed JSON payload', async () => {
    const { mock, token } = await signedIn()
    const ctx = makeContext({
      request: rawRequest(ATTEMPTS_URL, 'not json', 'POST', bearer(token)),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await listPost(ctx)

    expect(res.status).toBe(400)
    expect(await readJson(res)).toEqual({ error: 'Invalid JSON payload' })
  })

  it('rejects an invalid attempt id', async () => {
    const { mock, token } = await signedIn()
    const ctx = makeContext({
      request: jsonRequest(ATTEMPTS_URL, { id: 'short' }, 'POST', bearer(token)),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await listPost(ctx)

    expect(res.status).toBe(400)
    expect(await readJson(res)).toEqual({ error: 'Invalid attempt ID' })
  })

  it('rejects an attempt id with characters outside the allowed set', async () => {
    const { mock, token } = await signedIn()
    const ctx = makeContext({
      request: jsonRequest(ATTEMPTS_URL, { id: 'not a valid id!' }, 'POST', bearer(token)),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await listPost(ctx)

    expect(res.status).toBe(400)
    expect(await readJson(res)).toEqual({ error: 'Invalid attempt ID' })
  })

  it('rejects a payload that is too large', async () => {
    const { mock, token } = await signedIn()
    const ctx = makeContext({
      request: requestWith(ATTEMPTS_URL, {
        method: 'POST',
        headers: { ...bearer(token), 'content-length': '1000001' },
        body: JSON.stringify({ id: 'attempt_0001' }),
      }),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await listPost(ctx)

    expect(res.status).toBe(413)
    expect(await readJson(res)).toEqual({ error: 'Attempt payload too large' })
  })

  it('rejects a payload that is too large without a content-length header', async () => {
    const { mock, token } = await signedIn()
    // Chunked transfer encoding carries no content-length, so the body is
    // measured as well.
    const ctx = makeContext({
      request: {
        headers: new Headers({ ...bearer(token) }),
        text: async () => 'x'.repeat(1_000_001),
      } as unknown as Request,
      env: makeEnv({ DB: mock.db }),
    })

    const res = await listPost(ctx)

    expect(res.status).toBe(413)
    expect(await readJson(res)).toEqual({ error: 'Attempt payload too large' })
  })

  it('answers 400 when the request body cannot be read', async () => {
    const { mock, token } = await signedIn()
    const ctx = makeContext({
      request: {
        headers: new Headers({ ...bearer(token) }),
        text: async () => {
          throw new Error('the connection dropped')
        },
      } as unknown as Request,
      env: makeEnv({ DB: mock.db }),
    })

    const res = await listPost(ctx)

    expect(res.status).toBe(400)
    expect(await readJson(res)).toEqual({ error: 'Invalid request body' })
  })

  it('refuses a write from an account that is over the limit', async () => {
    const { mock, token, userId } = await signedIn()
    // The account is already at the ceiling, so the next write is refused.
    const key = `post-attempt:${userId}`
    mock.rateLimits.set(key, {
      key,
      count: 120,
      reset_at: Math.floor(Date.now() / 1000) + 60,
    })
    const ctx = makeContext({
      request: requestWith(ATTEMPTS_URL, {
        method: 'POST',
        headers: { ...bearer(token), 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'attempt_0001' }),
      }),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await listPost(ctx)

    expect(res.status).toBe(429)
    expect(res.headers.get('Retry-After')).toBeTruthy()
  })

  it('rejects a payload whose contents are too large', async () => {
    const { mock, token } = await signedIn()
    const ctx = makeContext({
      request: jsonRequest(
        ATTEMPTS_URL,
        { id: 'attempt_0001', skillScores: { big: 'x'.repeat(400_000) } },
        'POST',
        bearer(token),
      ),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await listPost(ctx)

    expect(res.status).toBe(413)
    expect(await readJson(res)).toEqual({ error: 'Attempt payload too large' })
  })

  it('stores an attempt', async () => {
    const { mock, token, userId } = await signedIn()
    const ctx = makeContext({
      request: jsonRequest(
        ATTEMPTS_URL,
        {
          id: 'attempt_0001',
          mockId: 'mock-9',
          mockTitle: 'Mock Test 9',
          mode: 'listening',
          startedAt: '2024-02-01T10:00:00.000Z',
          finishedAt: '2024-02-01T11:00:00.000Z',
          durationMs: 3_600_000,
          overallScore: 71,
          overallScore60: 52,
          cefr: 'B2',
          earnedPoints: 47,
          availablePoints: 60,
          skillScores: { reading: 30 },
          breakdown: { listening: 20 },
          responses: { 'item-1': { answer: 'yes' } },
          seed: 12,
          mockKind: 'academic',
          sectionIds: ['reading'],
          details: [{ maxPoints: 3, traits: {} }],
          untimed: true,
          timeScale: 1.5,
        },
        'POST',
        bearer(token),
      ),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await listPost(ctx)

    expect(res.status).toBe(200)
    expect(await readJson(res)).toEqual({ ok: true, id: 'attempt_0001' })

    const row = mock.attempts.get('attempt_0001')
    expect(row?.user_id).toBe(userId)
    expect(row?.mock_id).toBe('mock-9')
    expect(row?.mock_title).toBe('Mock Test 9')
    expect(row?.mode).toBe('listening')
    expect(row?.overall_score).toBe(71)
    expect(row?.overall_score_60).toBe(52)
    expect(row?.cefr).toBe('B2')
    expect(JSON.parse(row?.skill_scores ?? '{}')).toEqual({ reading: 30 })
    expect(JSON.parse(row?.breakdown ?? '{}')).toEqual({ listening: 20 })
    const stored = JSON.parse(row?.responses ?? '{}') as Record<string, unknown>
    expect(stored.responses).toEqual({ 'item-1': { answer: 'yes' } })
    expect(stored.seed).toBe(12)
    expect(stored.mockKind).toBe('academic')
    expect(stored.sectionIds).toEqual(['reading'])
    expect(stored.untimed).toBe(true)
    expect(stored.timeScale).toBe(1.5)
  })

  it('fills in the defaults for an empty attempt', async () => {
    const { mock, token } = await signedIn()
    const ctx = makeContext({
      request: jsonRequest(ATTEMPTS_URL, {}, 'POST', bearer(token)),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await listPost(ctx)

    expect(res.status).toBe(200)
    const body = await readJson(res)
    expect(body.ok).toBe(true)
    expect(typeof body.id).toBe('string')
    expect(body.id as string).toMatch(/^att-[0-9a-f-]{36}$/)

    const row = mock.attempts.get(body.id as string)
    expect(row?.mock_id).toBe('mock')
    expect(row?.mock_title).toBe('PTE Mock Test')
    expect(row?.mode).toBe('full')
    expect(row?.cefr).toBe('A1')
    expect(row?.duration_ms).toBe(0)
    expect(row?.overall_score).toBe(10)
    expect(row?.overall_score_60).toBe(60)
    expect(row?.earned_points).toBe(0)
    expect(row?.available_points).toBe(0)
  })

  it('truncates an over long mock title', async () => {
    const { mock, token } = await signedIn()
    const ctx = makeContext({
      request: jsonRequest(
        ATTEMPTS_URL,
        { id: 'attempt_0001', mockTitle: 'x'.repeat(200) },
        'POST',
        bearer(token),
      ),
      env: makeEnv({ DB: mock.db }),
    })

    await listPost(ctx)

    expect(mock.attempts.get('attempt_0001')?.mock_title).toHaveLength(120)
  })

  it('coerces numeric strings and rejects values that are not numbers', async () => {
    const { mock, token } = await signedIn()
    const ctx = makeContext({
      request: jsonRequest(
        ATTEMPTS_URL,
        {
          id: 'attempt_0001',
          durationMs: '4200',
          overallScore: 'not a score',
          earnedPoints: '',
        },
        'POST',
        bearer(token),
      ),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await listPost(ctx)

    expect(res.status).toBe(200)
    const row = mock.attempts.get('attempt_0001')
    expect(row?.duration_ms).toBe(4200)
    expect(row?.overall_score).toBe(10)
    expect(row?.earned_points).toBe(0)
  })

  it('rejects a skill scores payload that is not an object', async () => {
    const { mock, token } = await signedIn()
    const ctx = makeContext({
      request: jsonRequest(
        ATTEMPTS_URL,
        { id: 'attempt_0001', skillScores: ['reading'] },
        'POST',
        bearer(token),
      ),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await listPost(ctx)

    expect(res.status).toBe(400)
    expect(await readJson(res)).toEqual({ error: 'Invalid skillScores payload' })
  })

  it('rejects a breakdown payload that is not an object', async () => {
    const { mock, token } = await signedIn()
    const ctx = makeContext({
      request: jsonRequest(
        ATTEMPTS_URL,
        { id: 'attempt_0001', breakdown: 'reading' },
        'POST',
        bearer(token),
      ),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await listPost(ctx)

    expect(res.status).toBe(400)
    expect(await readJson(res)).toEqual({ error: 'Invalid breakdown payload' })
  })

  it('rejects a responses payload that is not an object', async () => {
    const { mock, token } = await signedIn()
    const ctx = makeContext({
      request: jsonRequest(
        ATTEMPTS_URL,
        { id: 'attempt_0001', responses: ['item-1'] },
        'POST',
        bearer(token),
      ),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await listPost(ctx)

    expect(res.status).toBe(400)
    expect(await readJson(res)).toEqual({ error: 'Invalid responses payload' })
  })

  it('rejects a details payload that is not an array', async () => {
    const { mock, token } = await signedIn()
    const ctx = makeContext({
      request: jsonRequest(
        ATTEMPTS_URL,
        { id: 'attempt_0001', details: { maxPoints: 3 } },
        'POST',
        bearer(token),
      ),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await listPost(ctx)

    expect(res.status).toBe(400)
    expect(await readJson(res)).toEqual({ error: 'Invalid details payload' })
  })

  it('rejects a details payload with more than two hundred items', async () => {
    const { mock, token } = await signedIn()
    const ctx = makeContext({
      request: jsonRequest(
        ATTEMPTS_URL,
        { id: 'attempt_0001', details: Array.from({ length: 201 }, () => ({ maxPoints: 1 })) },
        'POST',
        bearer(token),
      ),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await listPost(ctx)

    expect(res.status).toBe(400)
    expect(await readJson(res)).toEqual({ error: 'Invalid details payload' })
  })

  it('rejects a section ids payload that is not an array', async () => {
    const { mock, token } = await signedIn()
    const ctx = makeContext({
      request: jsonRequest(
        ATTEMPTS_URL,
        { id: 'attempt_0001', sectionIds: 'reading' },
        'POST',
        bearer(token),
      ),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await listPost(ctx)

    expect(res.status).toBe(400)
    expect(await readJson(res)).toEqual({ error: 'Invalid sectionIds payload' })
  })

  it('rejects a section ids payload with more than fifty items', async () => {
    const { mock, token } = await signedIn()
    const ctx = makeContext({
      request: jsonRequest(
        ATTEMPTS_URL,
        { id: 'attempt_0001', sectionIds: Array.from({ length: 51 }, () => 'reading') },
        'POST',
        bearer(token),
      ),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await listPost(ctx)

    expect(res.status).toBe(400)
    expect(await readJson(res)).toEqual({ error: 'Invalid sectionIds payload' })
  })

  it('answers 409 when the attempt belongs to another account', async () => {
    const { mock, token } = await signedIn()
    seedAttempt(mock, makeAttemptRow({ id: 'attempt_0001', user_id: 'usr_someone_else' }))
    const ctx = makeContext({
      request: jsonRequest(ATTEMPTS_URL, { id: 'attempt_0001' }, 'POST', bearer(token)),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await listPost(ctx)

    expect(res.status).toBe(409)
    expect(await readJson(res)).toEqual({
      error: 'Conflict: attempt belongs to another account',
    })
  })

  it('answers 409 when the insert violates a constraint', async () => {
    const { mock, token } = await signedIn()
    const db = withOverrides(mock.db, [
      {
        match: (sql) => sql.includes('INSERT INTO attempts'),
        run: async () => {
          throw new Error('SQLITE_CONSTRAINT: UNIQUE constraint failed: attempts.id')
        },
      },
    ])
    const ctx = makeContext({
      request: jsonRequest(ATTEMPTS_URL, { id: 'attempt_0001' }, 'POST', bearer(token)),
      env: makeEnv({ DB: db }),
    })

    const res = await listPost(ctx)

    expect(res.status).toBe(409)
    expect(await readJson(res)).toEqual({ error: 'Conflict' })
  })

  it('rethrows an unexpected database error', async () => {
    const { mock, token } = await signedIn()
    const db = withOverrides(mock.db, [
      {
        match: (sql) => sql.includes('INSERT INTO attempts'),
        run: async () => {
          throw new Error('disk full')
        },
      },
    ])
    const ctx = makeContext({
      request: jsonRequest(ATTEMPTS_URL, { id: 'attempt_0001' }, 'POST', bearer(token)),
      env: makeEnv({ DB: db }),
    })

    await expect(listPost(ctx)).rejects.toThrow('disk full')
  })

  it('rethrows a database error that is not an error object', async () => {
    const { mock, token } = await signedIn()
    const db = withOverrides(mock.db, [
      {
        match: (sql) => sql.includes('INSERT INTO attempts'),
        run: async () => {
          throw 'the disk is on fire'
        },
      },
    ])
    const ctx = makeContext({
      request: jsonRequest(ATTEMPTS_URL, { id: 'attempt_0001' }, 'POST', bearer(token)),
      env: makeEnv({ DB: db }),
    })

    await expect(listPost(ctx)).rejects.toBe('the disk is on fire')
  })

  it('answers 500 when there is no database binding', async () => {
    const token = await createToken({ userId: 'usr_1', email: 'user@pte.test' })
    const ctx = makeContext({
      request: jsonRequest(ATTEMPTS_URL, { id: 'attempt_0001' }, 'POST', bearer(token)),
      env: makeEnv({ DB: undefined }),
    })

    const res = await listPost(ctx)

    expect(res.status).toBe(500)
    expect(await readJson(res)).toEqual({ error: 'Database binding unavailable' })
  })
})

/* ---------------------------------------------------------------------------
   DELETE /api/attempts
   --------------------------------------------------------------------------- */

describe('DELETE /api/attempts', () => {
  it('rejects an unauthenticated request', async () => {
    const mock = createD1Mock()
    const ctx = makeContext({
      request: requestWith(ATTEMPTS_URL, { method: 'DELETE' }),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await listDelete(ctx)

    expect(res.status).toBe(401)
    expect(await readJson(res)).toEqual({ error: 'Unauthorized' })
  })

  it('clears the account history and leaves other accounts alone', async () => {
    const { mock, token, userId } = await signedIn()
    seedAttempt(mock, makeAttemptRow({ id: 'attempt_0001', user_id: userId }))
    seedAttempt(mock, makeAttemptRow({ id: 'attempt_0002', user_id: userId }))
    seedAttempt(mock, makeAttemptRow({ id: 'attempt_0003', user_id: 'usr_someone_else' }))
    const ctx = makeContext({
      request: requestWith(ATTEMPTS_URL, { method: 'DELETE', headers: bearer(token) }),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await listDelete(ctx)

    expect(res.status).toBe(200)
    expect(await readJson(res)).toEqual({ ok: true, deleted: 2 })
    expect(mock.attempts.has('attempt_0001')).toBe(false)
    expect(mock.attempts.has('attempt_0002')).toBe(false)
    expect(mock.attempts.has('attempt_0003')).toBe(true)
  })

  it('rejects an invalid session', async () => {
    const mock = createD1Mock()
    const ctx = makeContext({
      request: requestWith(ATTEMPTS_URL, {
        method: 'DELETE',
        headers: bearer('not-a-session-token'),
      }),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await listDelete(ctx)

    expect(res.status).toBe(401)
    expect(await readJson(res)).toEqual({ error: 'Invalid or expired session' })
  })

  it('reports no deleted rows when the database does not report a change count', async () => {
    const { mock, token, userId } = await signedIn()
    seedAttempt(mock, makeAttemptRow({ id: 'attempt_0001', user_id: userId }))
    const db = withOverrides(mock.db, [
      {
        match: (sql) => sql.includes('DELETE FROM attempts WHERE user_id = ?'),
        run: async () => ({ success: true }) as unknown as D1Result,
      },
    ])
    const ctx = makeContext({
      request: requestWith(ATTEMPTS_URL, { method: 'DELETE', headers: bearer(token) }),
      env: makeEnv({ DB: db }),
    })

    const res = await listDelete(ctx)

    expect(res.status).toBe(200)
    expect(await readJson(res)).toEqual({ ok: true, deleted: 0 })
  })

  it('answers 429 when the delete limit is exhausted', async () => {
    const { mock, token, userId } = await signedIn()
    mock.rateLimits.set(`del-attempts:${userId}`, {
      key: `del-attempts:${userId}`,
      count: 5,
      reset_at: nowSeconds() + 60,
    })
    const ctx = makeContext({
      request: requestWith(ATTEMPTS_URL, { method: 'DELETE', headers: bearer(token) }),
      env: makeEnv({ DB: mock.db }),
    })

    const res = await listDelete(ctx)

    expect(res.status).toBe(429)
  })

  it('answers 500 when there is no database binding', async () => {
    const ctx = makeContext({
      request: requestWith(ATTEMPTS_URL, { method: 'DELETE', headers: bearer('token') }),
      env: makeEnv({ DB: undefined }),
    })

    const res = await listDelete(ctx)

    expect(res.status).toBe(500)
    expect(await readJson(res)).toEqual({ error: 'Database binding unavailable' })
  })
})

/* ---------------------------------------------------------------------------
   GET /api/attempts/:id
   --------------------------------------------------------------------------- */

describe('GET /api/attempts/:id', () => {
  const ITEM_URL = 'https://site.test/api/attempts/attempt_0001'

  it('rejects an unauthenticated request', async () => {
    const mock = createD1Mock()
    const ctx = makeContext({
      request: requestWith(ITEM_URL, { method: 'GET' }),
      env: makeEnv({ DB: mock.db }),
      params: { id: 'attempt_0001' },
    })

    const res = await itemGet(ctx)

    expect(res.status).toBe(401)
    expect(await readJson(res)).toEqual({ error: 'Unauthorized' })
  })

  it('rejects an invalid attempt id', async () => {
    const { mock, token } = await signedIn()
    const ctx = makeContext({
      request: requestWith(ITEM_URL, { method: 'GET', headers: bearer(token) }),
      env: makeEnv({ DB: mock.db }),
      params: { id: 'short' },
    })

    const res = await itemGet(ctx)

    expect(res.status).toBe(400)
    expect(await readJson(res)).toEqual({ error: 'Invalid attempt ID' })
  })

  it('returns a stored attempt', async () => {
    const { mock, token, userId } = await signedIn()
    seedAttempt(
      mock,
      makeAttemptRow({
        id: 'attempt_0001',
        user_id: userId,
        skill_scores: '{"reading": 30}',
        breakdown: '{"listening": 20}',
        responses: JSON.stringify({
          responses: { 'item-1': { answer: 'yes' } },
          seed: 4,
          mockKind: 'academic',
          details: [{ maxPoints: 3, traits: {} }],
          untimed: true,
          timeScale: 2,
          sectionIds: ['reading'],
        }),
      }),
    )
    const ctx = makeContext({
      request: requestWith(ITEM_URL, { method: 'GET', headers: bearer(token) }),
      env: makeEnv({ DB: mock.db }),
      params: { id: 'attempt_0001' },
    })

    const res = await itemGet(ctx)

    expect(res.status).toBe(200)
    const body = (await readJson(res)) as { attempt: Record<string, unknown> }
    expect(body.attempt).toMatchObject({
      id: 'attempt_0001',
      userId: userId,
      mockId: 'mock-1',
      mockTitle: 'Mock Test 1',
      mode: 'full',
      durationMs: 3_600_000,
      overallScore: 68,
      overallScore60: 50,
      cefr: 'B2',
      earnedPoints: 45,
      availablePoints: 60,
      skillScores: { reading: 30 },
      breakdown: { listening: 20 },
      mockKind: 'academic',
      untimed: true,
      timeScale: 2,
      seed: 4,
      sectionIds: ['reading'],
      overallIsEstimate: true,
      completedItemIds: ['item-1'],
      responses: { 'item-1': { answer: 'yes' } },
    })
  })

  it('falls back to the empty values when the stored responses carry none', async () => {
    const { mock, token, userId } = await signedIn()
    seedAttempt(
      mock,
      makeAttemptRow({
        id: 'attempt_0001',
        user_id: userId,
        responses: JSON.stringify({
          responses: null,
          seed: null,
          mockKind: null,
          details: null,
          untimed: false,
          timeScale: null,
          sectionIds: 'reading',
        }),
      }),
    )
    const ctx = makeContext({
      request: requestWith(ITEM_URL, { method: 'GET', headers: bearer(token) }),
      env: makeEnv({ DB: mock.db }),
      params: { id: 'attempt_0001' },
    })

    const res = await itemGet(ctx)
    const body = (await readJson(res)) as { attempt: Record<string, unknown> }

    expect(body.attempt).toMatchObject({
      responses: {},
      seed: 0,
      sectionIds: ['speaking-writing', 'reading', 'listening'],
      overallIsEstimate: true,
      completedItemIds: [],
    })
    expect(body.attempt.untimed).toBeUndefined()
    expect(body.attempt.timeScale).toBeUndefined()
    expect(body.attempt.mockKind).toBeUndefined()
    expect(body.attempt.details).toBeUndefined()
  })

  it('treats a responses payload without the wrapper as the responses themselves', async () => {
    const { mock, token, userId } = await signedIn()
    seedAttempt(
      mock,
      makeAttemptRow({
        id: 'attempt_0001',
        user_id: userId,
        responses: JSON.stringify({ 'item-1': { answer: 'yes' } }),
      }),
    )
    const ctx = makeContext({
      request: requestWith(ITEM_URL, { method: 'GET', headers: bearer(token) }),
      env: makeEnv({ DB: mock.db }),
      params: { id: 'attempt_0001' },
    })

    const res = await itemGet(ctx)
    const body = (await readJson(res)) as { attempt: Record<string, unknown> }

    expect(body.attempt.responses).toEqual({ 'item-1': { answer: 'yes' } })
    expect(body.attempt.completedItemIds).toEqual(['item-1'])
  })

  it('ignores a responses payload that is not an object', async () => {
    const { mock, token, userId } = await signedIn()
    seedAttempt(mock, makeAttemptRow({ id: 'attempt_0001', user_id: userId, responses: 'null' }))
    const ctx = makeContext({
      request: requestWith(ITEM_URL, { method: 'GET', headers: bearer(token) }),
      env: makeEnv({ DB: mock.db }),
      params: { id: 'attempt_0001' },
    })

    const res = await itemGet(ctx)
    const body = (await readJson(res)) as { attempt: Record<string, unknown> }

    expect(body.attempt.responses).toEqual({})
    expect(body.attempt.completedItemIds).toEqual([])
  })

  it('ignores an attempt that stores no responses at all', async () => {
    const { mock, token, userId } = await signedIn()
    seedAttempt(mock, makeAttemptRow({ id: 'attempt_0001', user_id: userId, responses: null }))
    const ctx = makeContext({
      request: requestWith(ITEM_URL, { method: 'GET', headers: bearer(token) }),
      env: makeEnv({ DB: mock.db }),
      params: { id: 'attempt_0001' },
    })

    const res = await itemGet(ctx)
    const body = (await readJson(res)) as { attempt: Record<string, unknown> }

    expect(body.attempt.responses).toEqual({})
    expect(body.attempt.overallIsEstimate).toBe(true)
  })

  it('answers 404 when the attempt does not exist', async () => {
    const { mock, token } = await signedIn()
    const ctx = makeContext({
      request: requestWith(ITEM_URL, { method: 'GET', headers: bearer(token) }),
      env: makeEnv({ DB: mock.db }),
      params: { id: 'attempt_0001' },
    })

    const res = await itemGet(ctx)

    expect(res.status).toBe(404)
    expect(await readJson(res)).toEqual({ error: 'Attempt not found' })
  })

  it('answers 404 when the attempt belongs to another account', async () => {
    const { mock, token } = await signedIn()
    seedAttempt(mock, makeAttemptRow({ id: 'attempt_0001', user_id: 'usr_someone_else' }))
    const ctx = makeContext({
      request: requestWith(ITEM_URL, { method: 'GET', headers: bearer(token) }),
      env: makeEnv({ DB: mock.db }),
      params: { id: 'attempt_0001' },
    })

    const res = await itemGet(ctx)

    expect(res.status).toBe(404)
  })

  it('rejects an invalid session', async () => {
    const mock = createD1Mock()
    const ctx = makeContext({
      request: requestWith(ITEM_URL, {
        method: 'GET',
        headers: bearer('not-a-session-token'),
      }),
      env: makeEnv({ DB: mock.db }),
      params: { id: 'attempt_0001' },
    })

    const res = await itemGet(ctx)

    expect(res.status).toBe(401)
    expect(await readJson(res)).toEqual({ error: 'Invalid or expired session' })
  })

  it('answers 500 when there is no database binding', async () => {
    const token = await createToken({ userId: 'usr_1', email: 'user@pte.test' })
    const ctx = makeContext({
      request: requestWith(ITEM_URL, { method: 'GET', headers: bearer(token) }),
      env: makeEnv({ DB: undefined }),
      params: { id: 'attempt_0001' },
    })

    const res = await itemGet(ctx)

    expect(res.status).toBe(500)
    expect(await readJson(res)).toEqual({ error: 'Database binding unavailable' })
  })
})

/* ---------------------------------------------------------------------------
   DELETE /api/attempts/:id
   --------------------------------------------------------------------------- */

describe('DELETE /api/attempts/:id', () => {
  const ITEM_URL = 'https://site.test/api/attempts/attempt_0001'

  it('rejects an unauthenticated request', async () => {
    const mock = createD1Mock()
    const ctx = makeContext({
      request: requestWith(ITEM_URL, { method: 'DELETE' }),
      env: makeEnv({ DB: mock.db }),
      params: { id: 'attempt_0001' },
    })

    const res = await itemDelete(ctx)

    expect(res.status).toBe(401)
    expect(await readJson(res)).toEqual({ error: 'Unauthorized' })
  })

  it('rejects an invalid attempt id', async () => {
    const { mock, token } = await signedIn()
    const ctx = makeContext({
      request: requestWith(ITEM_URL, { method: 'DELETE', headers: bearer(token) }),
      env: makeEnv({ DB: mock.db }),
      params: { id: 'short' },
    })

    const res = await itemDelete(ctx)

    expect(res.status).toBe(400)
    expect(await readJson(res)).toEqual({ error: 'Invalid attempt ID' })
  })

  it('removes the attempt', async () => {
    const { mock, token, userId } = await signedIn()
    seedAttempt(mock, makeAttemptRow({ id: 'attempt_0001', user_id: userId }))
    const ctx = makeContext({
      request: requestWith(ITEM_URL, { method: 'DELETE', headers: bearer(token) }),
      env: makeEnv({ DB: mock.db }),
      params: { id: 'attempt_0001' },
    })

    const res = await itemDelete(ctx)

    expect(res.status).toBe(200)
    expect(await readJson(res)).toEqual({ ok: true, id: 'attempt_0001' })
    expect(mock.attempts.has('attempt_0001')).toBe(false)
  })

  it('answers 404 when the attempt does not exist', async () => {
    const { mock, token } = await signedIn()
    const ctx = makeContext({
      request: requestWith(ITEM_URL, { method: 'DELETE', headers: bearer(token) }),
      env: makeEnv({ DB: mock.db }),
      params: { id: 'attempt_0001' },
    })

    const res = await itemDelete(ctx)

    expect(res.status).toBe(404)
    expect(await readJson(res)).toEqual({ error: 'Attempt not found' })
  })

  it('rejects an invalid session', async () => {
    const mock = createD1Mock()
    const ctx = makeContext({
      request: requestWith(ITEM_URL, {
        method: 'DELETE',
        headers: bearer('not-a-session-token'),
      }),
      env: makeEnv({ DB: mock.db }),
      params: { id: 'attempt_0001' },
    })

    const res = await itemDelete(ctx)

    expect(res.status).toBe(401)
    expect(await readJson(res)).toEqual({ error: 'Invalid or expired session' })
  })

  it('answers 500 when there is no database binding', async () => {
    const token = await createToken({ userId: 'usr_1', email: 'user@pte.test' })
    const ctx = makeContext({
      request: requestWith(ITEM_URL, { method: 'DELETE', headers: bearer(token) }),
      env: makeEnv({ DB: undefined }),
      params: { id: 'attempt_0001' },
    })

    const res = await itemDelete(ctx)

    expect(res.status).toBe(500)
    expect(await readJson(res)).toEqual({ error: 'Database binding unavailable' })
  })
})
