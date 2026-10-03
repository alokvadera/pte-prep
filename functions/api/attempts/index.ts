import type { Env } from '../../types'
import { extractBearerToken, verifySessionToken } from '../../lib/auth'

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

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const token = extractBearerToken(context.request)
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const session = await verifySessionToken(token, context.env.JWT_SECRET)
  if (!session) {
    return new Response(JSON.stringify({ error: 'Invalid or expired session' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const db = context.env.DB
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
            if (Array.isArray(parsed.sectionIds)) sectionIds = parsed.sectionIds
          } else {
            responses = parsed
          }
        }
      }
    } catch {
      /* ignore corrupted json */
    }

    return {
      id: row.id,
      mockId: row.mock_id,
      mockTitle: row.mock_title,
      mockKind,
      details,
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
      overallIsEstimate: true,
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

  const session = await verifySessionToken(token, context.env.JWT_SECRET)
  if (!session) {
    return new Response(JSON.stringify({ error: 'Invalid or expired session' }), {
      status: 401,
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

  const id = typeof attempt.id === 'string' ? attempt.id : null
  if (!id) {
    return new Response(JSON.stringify({ error: 'Attempt ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const db = context.env.DB
  const skillScores = JSON.stringify(attempt.skillScores ?? {})
  const breakdown = JSON.stringify(attempt.breakdown ?? {})
  const responses = JSON.stringify({
    responses: attempt.responses ?? {},
    seed: attempt.seed ?? 0,
    mockKind: attempt.mockKind ?? null,
    sectionIds: attempt.sectionIds ?? null,
    details: attempt.details ?? null,
  })

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
        synced_at = datetime('now')`,
    )
    .bind(
      id,
      session.userId,
      attempt.mockId ?? 'mock',
      attempt.mockTitle ?? 'PTE Mock Test',
      attempt.mode ?? 'full',
      attempt.startedAt ?? new Date().toISOString(),
      attempt.finishedAt ?? new Date().toISOString(),
      Number(attempt.durationMs ?? 0),
      Number(attempt.overallScore ?? 10),
      Number(attempt.overallScore60 ?? 60),
      attempt.cefr ?? 'A1',
      Number(attempt.earnedPoints ?? 0),
      Number(attempt.availablePoints ?? 0),
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
