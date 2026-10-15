import type { Env, UserRecord } from '../../types'
import { createSessionToken, hashPassword, requireSecret, sha256Hex } from '../../lib/auth'

interface ResetTokenRecord {
  id: string
  user_id: string
  expires_at: string
  used_at: string | null
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  let body: { token?: string; password?: string }
  try {
    body = (await context.request.json()) as { token?: string; password?: string }
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const token = typeof body.token === 'string' ? body.token.trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!token) {
    return new Response(JSON.stringify({ error: 'Reset token is required.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!password || password.length < 8) {
    return new Response(JSON.stringify({ error: 'Password must be at least 8 characters.' }), {
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

  const tokenHash = await sha256Hex(token)

  // Find valid unused token
  const resetRecord = await db
    .prepare('SELECT id, user_id, expires_at, used_at FROM password_resets WHERE token_hash = ?')
    .bind(tokenHash)
    .first<ResetTokenRecord>()

  if (!resetRecord) {
    return new Response(
      JSON.stringify({ error: 'Invalid or expired password reset link. Please request a new one.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  if (resetRecord.used_at) {
    return new Response(
      JSON.stringify({ error: 'This password reset link has already been used. Please request a new one.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const expiresTime = new Date(resetRecord.expires_at).getTime()
  if (isNaN(expiresTime) || expiresTime < Date.now()) {
    return new Response(
      JSON.stringify({ error: 'This password reset link has expired. Please request a new one.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  // Hash new password
  const { hash, salt } = await hashPassword(password)

  // Update user's password
  await db
    .prepare(
      "UPDATE users SET password_hash = ?, password_salt = ?, updated_at = datetime('now') WHERE id = ?",
    )
    .bind(hash, salt, resetRecord.user_id)
    .run()

  // Mark token as used
  await db
    .prepare("UPDATE password_resets SET used_at = datetime('now') WHERE id = ?")
    .bind(resetRecord.id)
    .run()

  // Retrieve user to issue fresh session
  const user = await db
    .prepare('SELECT id, email, target_score FROM users WHERE id = ?')
    .bind(resetRecord.user_id)
    .first<Pick<UserRecord, 'id' | 'email' | 'target_score'>>()

  if (!user) {
    return new Response(JSON.stringify({ ok: true, message: 'Password reset successful.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const sessionToken = await createSessionToken(
    { userId: user.id, email: user.email },
    requireSecret(context.env),
  )

  return new Response(
    JSON.stringify({
      ok: true,
      message: 'Password reset successful.',
      token: sessionToken,
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
