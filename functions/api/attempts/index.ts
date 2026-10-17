import type { Env } from '../../types'
import { extractBearerToken, requireSecret, verifySessionToken } from '../../lib/auth'

interface RawAttemptRow {
  id: string
  user_id: string
  mock_id: string
  mock_title: string
  mode: string
  started_at: string
  finished_at: string
  duration_ms: number
  overall_score: number
  overall_score_60: number
  cefr: string
  earned_points: number
  available_points: number
  skill_scores: string
  breakdown: string
  responses?: string | null
  synced_at: string
}

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
  // them hundreds of times larger than the id list. Without this mode the
  // client could only ever see the newest 100 ids, so anything older looked
  // missing and was re-uploaded on every sync — and a new device could never
  // pull past the first hundred. `?ids=1` returns every id for the account.
  if (new URL(context.request.url).searchParams.get('ids') === '1') {
    const rows = await db
      .prepare('SELECT id FROM attempts WHERE user_id = ? ORDER BY finished_at DESC')
      .bind(session.userId)
      .all<{ id: string }>()
    return new Response(JSON.stringify({ ids: (rows.results ?? []).map((row) => row.id) }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const results = await db
    .prepare(
      `SELECT id, mock_id, mock_title, mode, started_at, finished_at, duration_ms,
              overall_score, overall_score_60, cefr, earned_points, available_points,
              skill_scores, breakdown, responses, synced_at
       FROM attempts
       WHERE user_id = ?
       ORDER BY finished_at DESC
       LIMIT 100`,
    )
    .bind(session.userId)
    .all<RawAttemptRow>()

  const attempts = (results.results ?? []).map((row) => {
    let skillScores = {}
    let breakdown = {}
    let responses: Record<string, unknown> = {}
    let seed = 0
    let mockKind: string | undefined
    let details: unknown[] | undefined
    let sectionIds = ['speaking-writing', 'reading', 'listening']
    let untimed: boolean | undefined
    let timeScale: number | undefined

    try {
      skillScores = JSON.parse(row.skill_scores)
      breakdown = JSON.parse(row.breakdown)
      if (row.responses) {
        const parsed = JSON.parse(row.responses)
        if (parsed && typeof parsed === 'object') {
          if ('responses' in parsed) {
            responses = parsed.responses ?? {}
            seed = Number(parsed.seed ?? 0)
            mockKind = parsed.mockKind ?? undefined
            details = parsed.details ?? undefined
            untimed = parsed.untimed ? true : undefined
            timeScale = typeof parsed.timeScale === 'number' ? parsed.timeScale : undefined
            if (Array.isArray(parsed.sectionIds)) sectionIds = parsed.sectionIds
          } else {
            responses = parsed
          }
        }
      }
    } catch {
      /* ignore corrupted json */
    }

    // Not stored as a column: derive it the way the client does, so pulled
    // copies do not clobber the correct local flag with a blanket true.
    const hasEstimated = Array.isArray(details)
      ? details.some((d) => {
          const item = d as { maxPoints?: unknown; traits?: unknown }
          return typeof item.maxPoints === 'number' && item.maxPoints > 0 && item.traits !== undefined
        })
      : true

    return {
      id: row.id,
      mockId: row.mock_id,
      mockTitle: row.mock_title,
      mockKind,
      details,
      ...(untimed ? { untimed: true } : {}),
      ...(timeScale ? { timeScale } : {}),
      mode: row.mode,
      startedAt: row.started_at,
      finishedAt: row.finished_at,
      durationMs: row.duration_ms,
      overallScore: row.overall_score,
      overallScore60: row.overall_score_60,
      cefr: row.cefr,
      earnedPoints: row.earned_points,
      availablePoints: row.available_points,
      skillScores,
      breakdown,
      syncedAt: row.synced_at,
      seed,
      sectionIds,
      overallIsEstimate: hasEstimated,
      completedItemIds: Object.keys(responses),
      responses,
    }
  })

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

  const cl = context.request.headers.get('content-length')
  if (cl && Number(cl) > 1_000_000) {
    return new Response(JSON.stringify({ error: 'Attempt payload too large' }), {
      status: 413,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let attempt: Record<string, unknown>
  try {
    attempt = (await context.request.json()) as Record<string, unknown>
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

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
  if (attempt.details !== undefined && (!Array.isArray(attempt.details) || attempt.details.length > 200)) {
    return new Response(JSON.stringify({ error: 'Invalid details payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  if (attempt.sectionIds !== undefined && (!Array.isArray(attempt.sectionIds) || attempt.sectionIds.length > 50)) {
    return new Response(JSON.stringify({ error: 'Invalid sectionIds payload' }), {
      status: 400,
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
  const num = (v: unknown, fallback: number): number => {
    const n = typeof v === 'number' ? v : Number(v ?? fallback)
    return Number.isFinite(n) ? n : fallback
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
    const res = await db
      .prepare(
        `INSERT INTO attempts (
          id, user_id, mock_id, mock_title, mode, started_at, finished_at, duration_ms,
          overall_score, overall_score_60, cefr, earned_points, available_points,
          skill_scores, breakdown, responses, synced_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(id) DO UPDATE SET
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
        num(attempt.durationMs, 0),
        num(attempt.overallScore, 10),
        num(attempt.overallScore60, 60),
        str(attempt.cefr, 'A1', 8),
        num(attempt.earnedPoints, 0),
        num(attempt.availablePoints, 0),
        skillScores,
        breakdown,
        responses,
      )
      .run()

    if (res.meta && res.meta.changes === 0) {
      return new Response(JSON.stringify({ error: 'Conflict: attempt belongs to another account' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      })
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

  const res = await db.prepare('DELETE FROM attempts WHERE user_id = ?').bind(session.userId).run()

  return new Response(JSON.stringify({ ok: true, deleted: res.meta?.changes ?? 0 }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
