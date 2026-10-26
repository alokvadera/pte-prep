import type { Env, UserRecord } from '../../types'
import {
  createSessionToken,
  hashPassword,
  requireSecret,
  resolvePbkdf2Iterations,
  resolveSessionExpiry,
  revokeAllUserSessions,
  sha256Hex,
} from '../../lib/auth'
import { checkRateLimit, getClientIp, rateLimitExceededResponse } from '../../lib/rateLimit'

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

  if (!token || token.length < 16 || token.length > 128) {
    return new Response(JSON.stringify({ error: 'Reset token is invalid or missing.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!password || password.length < 8 || password.length > 128) {
    return new Response(JSON.stringify({ error: 'Password must be between 8 and 128 characters.' }), {
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

  // Rate limit: 10 attempts per 10 minutes per IP
  const clientIp = getClientIp(context.request)
  const ipCheck = await checkRateLimit(db, `reset-password:ip:${clientIp}`, 10, 600)
  if (!ipCheck.allowed) {
    return rateLimitExceededResponse(ipCheck.retryAfter)
  }

  const tokenHash = await sha256Hex(token)

  // Atomically claim the token first to prevent race condition replay and eliminate TOCTOU window
  const claimRes = await db
    .prepare(
      "UPDATE password_resets SET used_at = datetime('now') WHERE token_hash = ? AND used_at IS NULL AND datetime(expires_at) > datetime('now')",
    )
    .bind(tokenHash)
    .run()

  if (claimRes.meta.changes === 0) {
    return new Response(
      JSON.stringify({ error: 'Invalid or expired password reset link. Please request a new one.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  // Find user_id associated with token
  const resetRecord = await db
    .prepare('SELECT user_id FROM password_resets WHERE token_hash = ?')
    .bind(tokenHash)
    .first<{ user_id: string }>()

  if (!resetRecord) {
    return new Response(
      JSON.stringify({ error: 'Invalid or expired password reset link. Please request a new one.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  // Revoke all existing sessions for this user before issuing a fresh session
  await revokeAllUserSessions(db, resetRecord.user_id)

  // Invalidate any other outstanding reset links for this account
  await db
    .prepare("UPDATE password_resets SET used_at = datetime('now') WHERE user_id = ? AND used_at IS NULL")
    .bind(resetRecord.user_id)
    .run()
    .catch((err) => console.warn('[Auth] Could not invalidate outstanding reset links:', err))

  // Hash new password
  const iterations = resolvePbkdf2Iterations(context.env)
  const { hash, salt } = await hashPassword(password, iterations)

  // Update user's password
  await db
    .prepare(
      "UPDATE users SET password_hash = ?, password_salt = ?, updated_at = datetime('now') WHERE id = ?",
    )
    .bind(hash, salt, resetRecord.user_id)
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

  const expiresIn = resolveSessionExpiry(context.env)
  const sessionToken = await createSessionToken(
    { userId: user.id, email: user.email },
    requireSecret(context.env),
    expiresIn,
    db,
  )

  return new Response(
    JSON.stringify({
      ok: true,
      message: 'Password reset successful.',
      token: sessionToken,
      expiresAt: Date.now() + expiresIn * 1000,
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
