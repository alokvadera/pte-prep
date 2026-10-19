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
  responses: string | null
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

  const id = context.params.id as string
  if (!id || typeof id !== 'string' || !ATTEMPT_ID_RE.test(id)) {
    return new Response(JSON.stringify({ error: 'Invalid attempt ID' }), {
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

  const row = await db
    .prepare(
      `SELECT id, user_id, mock_id, mock_title, mode, started_at, finished_at, duration_ms,
              overall_score, overall_score_60, cefr, earned_points, available_points,
              skill_scores, breakdown, responses, synced_at
       FROM attempts
       WHERE id = ? AND user_id = ?`,
    )
    .bind(id, session.userId)
    .first<RawAttemptRow>()

  if (!row) {
    return new Response(JSON.stringify({ error: 'Attempt not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

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
    /* ignore parse errors */
  }

  // The estimate flag is not stored as a column, so derive it the same way
  // the client does: estimated only when a scored item carries trait scores.
  // Records without details keep the previous default of true.
  const hasEstimated = Array.isArray(details)
    ? details.some((d) => {
        const row = d as { maxPoints?: unknown; traits?: unknown }
        return typeof row.maxPoints === 'number' && row.maxPoints > 0 && row.traits !== undefined
      })
    : true

  return new Response(
    JSON.stringify({
      attempt: {
        id: row.id,
        userId: row.user_id,
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
        responses,
        syncedAt: row.synced_at,
        seed,
        sectionIds,
        overallIsEstimate: hasEstimated,
        completedItemIds: Object.keys(responses),
      },
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  )
}

export const onRequestDelete: PagesFunction<Env> = async (context) => {
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

  const id = context.params.id as string
  if (!id || typeof id !== 'string' || !ATTEMPT_ID_RE.test(id)) {
    return new Response(JSON.stringify({ error: 'Invalid attempt ID' }), {
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

  const res = await db
    .prepare('DELETE FROM attempts WHERE id = ? AND user_id = ?')
    .bind(id, session.userId)
    .run()

  if (res.meta && res.meta.changes === 0) {
    return new Response(JSON.stringify({ error: 'Attempt not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ ok: true, id }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
