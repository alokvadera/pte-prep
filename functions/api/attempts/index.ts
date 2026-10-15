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

  const session = await verifySessionToken(token, requireSecret(context.env))
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

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const token = extractBearerToken(context.request)
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const session = await verifySessionToken(token, requireSecret(context.env))
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

  // The client generates the attempt id (att-<uuid>) when the test finishes and
  // reuses it for retries and sync. Using it as the primary key makes pushes
  // idempotent and lets sync converge; a fresh server id every POST would
  // create a duplicate on every retry. Ownership is enforced below so one user
  // cannot overwrite another user's row by guessing its id.
  const id = typeof attempt.id === 'string' ? attempt.id : 'attempt'
  if (!ATTEMPT_ID_RE.test(id)) {
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

  const existing = await db
    .prepare('SELECT user_id FROM attempts WHERE id = ?')
    .bind(id)
    .first<{ user_id: string }>()
  if (existing && existing.user_id !== session.userId) {
    return new Response(JSON.stringify({ error: 'Attempt not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const idForWrite = id

  await db
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
      idForWrite,
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

  return new Response(JSON.stringify({ ok: true, id }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
