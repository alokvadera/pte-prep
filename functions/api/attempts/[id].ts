import type { Env } from '../../types'
import { extractBearerToken, requireSecret, verifySessionToken } from '../../lib/auth'
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
              overall_score, cefr, earned_points, available_points,
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

  return new Response(
    JSON.stringify({
      attempt: mapRawAttemptRow(row),
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
