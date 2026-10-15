import type { Env, UserRecord } from '../../types'
import { extractBearerToken, hashPassword, requireSecret, verifySessionToken } from '../../lib/auth'

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
  const user = await db
    .prepare('SELECT id, email, target_score, created_at, updated_at FROM users WHERE id = ?')
    .bind(session.userId)
    .first<UserRecord>()

  if (!user) {
    return new Response(JSON.stringify({ error: 'User not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(
    JSON.stringify({
      user: {
        id: user.id,
        email: user.email,
        targetScore: user.target_score,
      },
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  )
}

export const onRequestPatch: PagesFunction<Env> = async (context) => {
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

  let body: { targetScore?: number; newPassword?: string }
  try {
    body = (await context.request.json()) as { targetScore?: number; newPassword?: string }
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON request' }), {
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
  if (typeof body.targetScore === 'number') {
    const score = Math.max(10, Math.min(90, Math.round(body.targetScore)))
    await db
      .prepare('UPDATE users SET target_score = ?, updated_at = datetime("now") WHERE id = ?')
      .bind(score, session.userId)
      .run()
  }

  // Session-authenticated password change: the valid session is the proof of
  // identity, which covers users who forgot the password on a device where
  // they are still signed in. There is no email infrastructure for a
  // logged-out reset, so that case stays impossible by design.
  if (typeof body.newPassword === 'string') {
    if (body.newPassword.length < 6) {
      return new Response(JSON.stringify({ error: 'Password must be at least 6 characters long.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    if (body.newPassword.length > 128) {
      return new Response(JSON.stringify({ error: 'Password is too long (max 128 characters).' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    const { hash, salt } = await hashPassword(body.newPassword)
    await db
      .prepare('UPDATE users SET password_hash = ?, password_salt = ?, updated_at = datetime("now") WHERE id = ?')
      .bind(hash, salt, session.userId)
      .run()
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
