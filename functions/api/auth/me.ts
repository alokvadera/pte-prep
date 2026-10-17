import type { Env, UserRecord } from '../../types'
import {
  createSessionToken,
  extractBearerToken,
  hashPassword,
  requireSecret,
  resolvePbkdf2Iterations,
  resolveSessionExpiry,
  revokeAllUserSessions,
  verifyPassword,
  verifySessionToken,
} from '../../lib/auth'

export const onRequestGet: PagesFunction<Env> = async (context) => {
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
      // The verified token carries the authoritative expiry (`exp`, seconds).
      // Echoing it lets a returning client replace a guessed expiry with the
      // real one instead of discovering it through a 401.
      expiresAt: session.exp * 1000,
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

  let body: { targetScore?: number; newPassword?: string; currentPassword?: string }
  try {
    body = (await context.request.json()) as { targetScore?: number; newPassword?: string; currentPassword?: string }
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (body.targetScore !== undefined) {
    if (typeof body.targetScore !== 'number' || !Number.isFinite(body.targetScore)) {
      return new Response(JSON.stringify({ error: 'Target score must be a finite number.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    const score = Math.max(10, Math.min(90, Math.round(body.targetScore)))
    await db
      .prepare('UPDATE users SET target_score = ?, updated_at = datetime("now") WHERE id = ?')
      .bind(score, session.userId)
      .run()
  }

  // Password change requires verifying the current password to prevent
  // account takeover via stolen tokens. Logged-out resets are handled via
  // email at /api/auth/forgot-password.
  if (typeof body.newPassword === 'string') {
    if (typeof body.currentPassword !== 'string' || !body.currentPassword) {
      return new Response(JSON.stringify({ error: 'Current password is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    const userRec = await db
      .prepare('SELECT password_hash, password_salt FROM users WHERE id = ?')
      .bind(session.userId)
      .first<{ password_hash: string; password_salt: string }>()
    if (!userRec) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    const iterations = resolvePbkdf2Iterations(context.env)
    const valid = await verifyPassword(body.currentPassword, userRec.password_hash, userRec.password_salt, iterations)
    if (!valid) {
      return new Response(JSON.stringify({ error: 'Current password is incorrect.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    if (body.newPassword.length < 8) {
      return new Response(JSON.stringify({ error: 'Password must be at least 8 characters.' }), {
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
    const { hash, salt } = await hashPassword(body.newPassword, iterations)
    await db
      .prepare('UPDATE users SET password_hash = ?, password_salt = ?, updated_at = datetime("now") WHERE id = ?')
      .bind(hash, salt, session.userId)
      .run()

    // Revoke all existing sessions so that any stolen tokens lose access
    await revokeAllUserSessions(db, session.userId)

    const secret = requireSecret(context.env)
    const expiresIn = resolveSessionExpiry(context.env)
    const newToken = await createSessionToken(
      { userId: session.userId, email: session.email },
      secret,
      expiresIn,
      db,
    )

    return new Response(
      JSON.stringify({
        ok: true,
        token: newToken,
        expiresAt: Date.now() + expiresIn * 1000,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
