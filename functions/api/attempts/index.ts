import type { Env } from '../../types'
import { extractBearerToken, requireSecret, verifySessionToken } from '../../lib/auth'
import { checkRateLimit, rateLimitExceededResponse } from '../../lib/rateLimit'
import { mapRawAttemptRow, type RawAttemptRow } from '../../lib/attempts'

const ATTEMPT_ID_RE = /^[A-Za-z0-9_-]{8,64}$/

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const token = extractBearerToken(context.request)
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const session = await verifySessionToken(token, requireSecret(context.env), context.env.DB)
  if (!session) {
    return new Response(JSON.stringify({ error: 'Invalid or expired session' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const db = context.env.DB
  if (!db) {
    return new Response(JSON.stringify({ error: 'Database binding unavailable' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  // The sync client needs to know which attempts exist, not what is inside
  // them: every row below carries its full responses, which makes a page of
  // them hundreds of times larger than the id list. `?ids=1` is paginated so
  // every account, however long its history, can be reconciled without
  // re-uploading rows that merely fell past a hard limit. Older clients that
  // send no limit still receive one 1,000-row page and can keep working.
  const url = new URL(context.request.url)
  if (url.searchParams.get('ids') === '1') {
    const rawLimit = Number(url.searchParams.get('limit') ?? '1000')
    const rawOffset = Number(url.searchParams.get('offset') ?? '0')
    const limit = Number.isFinite(rawLimit)
      ? Math.min(2000, Math.max(1, Math.floor(rawLimit)))
      : 1000
    const offset = Number.isFinite(rawOffset) ? Math.max(0, Math.floor(rawOffset)) : 0

    // Fetch one extra row so `hasMore` is exact without a second count query.
    const rows = await db
      .prepare(
        'SELECT id FROM attempts WHERE user_id = ? ORDER BY finished_at DESC, id DESC LIMIT ? OFFSET ?',
      )
      .bind(session.userId, limit + 1, offset)
      .all<{ id: string }>()
    const allRows = rows.results ?? []
    const page = allRows.slice(0, limit)
    return new Response(
      JSON.stringify({
        ids: page.map((row) => row.id),
        hasMore: allRows.length > limit,
        nextOffset: offset + page.length,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }

  const results = await db
    .prepare(
      `SELECT id, mock_id, mock_title, mode, started_at, finished_at, duration_ms,
              overall_score, cefr, earned_points, available_points,
              skill_scores, breakdown, responses, synced_at
       FROM attempts
       WHERE user_id = ?
       ORDER BY finished_at DESC
       LIMIT 100`,
    )
    .bind(session.userId)
    .all<RawAttemptRow>()

  const attempts = (results.results ?? []).map(mapRawAttemptRow)

  return new Response(JSON.stringify({ attempts }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const token = extractBearerToken(context.request)
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const session = await verifySessionToken(token, requireSecret(context.env), context.env.DB)
  if (!session) {
    return new Response(JSON.stringify({ error: 'Invalid or expired session' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const db = context.env.DB
  if (!db) {
    return new Response(JSON.stringify({ error: 'Database binding unavailable' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Writes are rate limited per account. The client pushes one attempt per
  // finished test, and a first sign-in replays the whole local history in one
  // go, so the ceiling leaves room for that burst while still stopping an
  // unbounded number of rows.
  const limited = await checkRateLimit(db, `post-attempt:${session.userId}`, 120, 60)
  if (!limited.allowed) {
    return rateLimitExceededResponse(limited.retryAfter)
  }

  const cl = context.request.headers.get('content-length')
  if (cl && Number(cl) > 1_000_000) {
    return new Response(JSON.stringify({ error: 'Attempt payload too large' }), {
      status: 413,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Enforce the byte limit while streaming. Content-Length may be absent or
  // untrusted, and `request.text()` would buffer an unbounded body before the
  // limit could be checked.
  let raw: string
  try {
    const reader = context.request.body?.getReader()
    if (!reader) raw = ''
    else {
      const decoder = new TextDecoder()
      let bytes = 0
      raw = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        bytes += value.byteLength
        if (bytes > 1_000_000) {
          await reader.cancel().catch(() => {})
          return new Response(JSON.stringify({ error: 'Attempt payload too large' }), {
            status: 413,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        raw += decoder.decode(value, { stream: true })
      }
      raw += decoder.decode()
    }
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw) as unknown
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  if (!isPlainObject(parsed)) {
    return new Response(JSON.stringify({ error: 'Invalid attempt payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  const attempt = parsed

  // Validate or generate attempt id
  const rawId = attempt.id
  const id = typeof rawId === 'string' && rawId.length > 0 ? rawId : `att-${crypto.randomUUID()}`
  if (!ATTEMPT_ID_RE.test(id)) {
    return new Response(JSON.stringify({ error: 'Invalid attempt ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Validate nested payload shapes
  if (attempt.skillScores !== undefined && !isPlainObject(attempt.skillScores)) {
    return new Response(JSON.stringify({ error: 'Invalid skillScores payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  if (attempt.breakdown !== undefined && !isPlainObject(attempt.breakdown)) {
    return new Response(JSON.stringify({ error: 'Invalid breakdown payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  if (attempt.responses !== undefined && !isPlainObject(attempt.responses)) {
    return new Response(JSON.stringify({ error: 'Invalid responses payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  if (
    attempt.details !== undefined &&
    (!Array.isArray(attempt.details) || attempt.details.length > 200)
  ) {
    return new Response(JSON.stringify({ error: 'Invalid details payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  if (
    attempt.sectionIds !== undefined &&
    (!Array.isArray(attempt.sectionIds) || attempt.sectionIds.length > 50)
  ) {
    return new Response(JSON.stringify({ error: 'Invalid sectionIds payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const num = (v: unknown, fallback: number, min = -Infinity, max = Infinity): number => {
    const n = typeof v === 'number' ? v : Number(v ?? fallback)
    if (!Number.isFinite(n)) return fallback
    return Math.min(max, Math.max(min, n))
  }
  const str = (v: unknown, fallback: string, max = 120): string =>
    typeof v === 'string' && v.length > 0 ? v.slice(0, max) : fallback

  const skillScores = JSON.stringify(attempt.skillScores ?? {})
  const breakdown = JSON.stringify(attempt.breakdown ?? {})
  const responses = JSON.stringify({
    responses: attempt.responses ?? {},
    seed: attempt.seed ?? 0,
    mockKind: attempt.mockKind ?? null,
    sectionIds: attempt.sectionIds ?? null,
    details: attempt.details ?? null,
    untimed: attempt.untimed ? true : null,
    timeScale: typeof attempt.timeScale === 'number' ? attempt.timeScale : null,
  })
  if (skillScores.length + breakdown.length + responses.length > 400_000) {
    return new Response(JSON.stringify({ error: 'Attempt payload too large' }), {
      status: 413,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const countRow = await db
      .prepare('SELECT count(*) as count FROM attempts WHERE user_id = ?')
      .bind(session.userId)
      .first<{ count: number }>()
    if (countRow && countRow.count >= 2000) {
      const exists = await db
        .prepare('SELECT id FROM attempts WHERE id = ? AND user_id = ?')
        .bind(id, session.userId)
        .first()
      if (!exists) {
        return new Response(
          JSON.stringify({ error: 'Attempt limit reached for this account (max 2,000).' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          },
        )
      }
    }

    const res = await db
      .prepare(
        `INSERT INTO attempts (
          id, user_id, mock_id, mock_title, mode, started_at, finished_at, duration_ms,
          overall_score, cefr, earned_points, available_points,
          skill_scores, breakdown, responses, synced_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(id) DO UPDATE SET
          mock_id = excluded.mock_id,
          mock_title = excluded.mock_title,
          mode = excluded.mode,
          started_at = excluded.started_at,
          finished_at = excluded.finished_at,
          duration_ms = excluded.duration_ms,
          overall_score = excluded.overall_score,
          cefr = excluded.cefr,
          earned_points = excluded.earned_points,
          available_points = excluded.available_points,
          skill_scores = excluded.skill_scores,
          breakdown = excluded.breakdown,
          responses = excluded.responses,
          synced_at = datetime('now')
        WHERE attempts.user_id = excluded.user_id`,
      )
      .bind(
        id,
        session.userId,
        str(attempt.mockId, 'mock', 64),
        str(attempt.mockTitle, 'PTE Mock Test', 120),
        str(attempt.mode, 'full', 24),
        str(attempt.startedAt, new Date().toISOString(), 32),
        str(attempt.finishedAt, new Date().toISOString(), 32),
        num(attempt.durationMs, 0, 0, 86_400_000),
        num(attempt.overallScore, 10, 10, 90),
        str(attempt.cefr, 'A1', 8),
        num(attempt.earnedPoints, 0, 0, 5000),
        num(attempt.availablePoints, 0, 0, 5000),
        skillScores,
        breakdown,
        responses,
      )
      .run()

    if (res.meta && res.meta.changes === 0) {
      return new Response(
        JSON.stringify({ error: 'Conflict: attempt belongs to another account' }),
        {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('SQLITE_CONSTRAINT') || message.includes('constraint')) {
      return new Response(JSON.stringify({ error: 'Conflict' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    throw err
  }

  return new Response(JSON.stringify({ ok: true, id }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

/**
 * Delete every attempt belonging to the signed-in account.
 *
 * Clearing history used to be sent as one DELETE per attempt, which for a long
 * history meant hundreds of sequential round trips. It also could not finish:
 * the list endpoint returns only the newest 100 rows, so attempts the client
 * could not see were never deleted and were pulled back down by a later sync.
 * One statement removes all of them, whatever the history length.
 */
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const token = extractBearerToken(context.request)
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const db = context.env.DB
  if (!db) {
    return new Response(JSON.stringify({ error: 'Database binding unavailable' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const session = await verifySessionToken(token, requireSecret(context.env), db)
  if (!session) {
    return new Response(JSON.stringify({ error: 'Invalid or expired session' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const limited = await checkRateLimit(db, `del-attempts:${session.userId}`, 5, 60)
  if (!limited.allowed) {
    return rateLimitExceededResponse(limited.retryAfter)
  }

  const res = await db.prepare('DELETE FROM attempts WHERE user_id = ?').bind(session.userId).run()

  return new Response(JSON.stringify({ ok: true, deleted: res.meta?.changes ?? 0 }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
