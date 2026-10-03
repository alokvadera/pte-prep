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
  responses: string | null
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

  const id = context.params.id as string
  const db = context.env.DB

  const row = await db
    .prepare(
      `SELECT * FROM attempts WHERE id = ? AND user_id = ?`,
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
  let responses = {}
  try {
    skillScores = JSON.parse(row.skill_scores)
    breakdown = JSON.parse(row.breakdown)
    if (row.responses) responses = JSON.parse(row.responses)
  } catch {
    /* ignore parse errors */
  }

  return new Response(
    JSON.stringify({
      attempt: {
        id: row.id,
        mockId: row.mock_id,
        mockTitle: row.mock_title,
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
        seed: 0,
        sectionIds: ['speaking-writing', 'reading', 'listening'],
        overallIsEstimate: true,
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

  const session = await verifySessionToken(token, context.env.JWT_SECRET)
  if (!session) {
    return new Response(JSON.stringify({ error: 'Invalid or expired session' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const id = context.params.id as string
  const db = context.env.DB

  await db
    .prepare('DELETE FROM attempts WHERE id = ? AND user_id = ?')
    .bind(id, session.userId)
    .run()

  return new Response(JSON.stringify({ ok: true, id }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
