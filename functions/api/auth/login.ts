import type { Env, UserRecord } from '../../types'
import { DUMMY_PASSWORD_HASH, DUMMY_PASSWORD_SALT, createSessionToken, requireSecret, verifyPassword } from '../../lib/auth'
import { checkRateLimit, getClientIp, rateLimitExceededResponse } from '../../lib/rateLimit'

interface ExtendedUserRecord extends UserRecord {
  password_hash: string | null
  password_salt: string | null
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  let body: { email?: string; password?: string }
  try {
    body = (await context.request.json()) as { email?: string; password?: string }
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const rawEmail = (body.email ?? '').trim().toLowerCase()
  const password = typeof body.password === 'string' ? body.password : ''

  if (!rawEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
    return new Response(JSON.stringify({ error: 'Please enter a valid email address' }), {
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

  // Rate limit: 30 attempts per 10m per IP, 5 attempts per 5m per email
  const clientIp = getClientIp(context.request)
  const ipCheck = await checkRateLimit(db, `login:ip:${clientIp}`, 30, 600)
  if (!ipCheck.allowed) {
    return rateLimitExceededResponse(ipCheck.retryAfter)
  }
  const emailCheck = await checkRateLimit(db, `login:email:${rawEmail}`, 5, 300)
  if (!emailCheck.allowed) {
    return rateLimitExceededResponse(emailCheck.retryAfter)
  }

  const existing = await db
    .prepare(
      'SELECT id, email, target_score, password_hash, password_salt, created_at, updated_at FROM users WHERE email = ?',
    )
    .bind(rawEmail)
    .first<ExtendedUserRecord>()

  // Timing equalization: always run real 100k-iteration PBKDF2 derivation
  if (!existing || !existing.password_hash) {
    await verifyPassword(password, DUMMY_PASSWORD_HASH, DUMMY_PASSWORD_SALT)
    return new Response(JSON.stringify({ error: 'Incorrect email or password.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const valid = await verifyPassword(password, existing.password_hash, existing.password_salt ?? '')
  if (!valid) {
    return new Response(JSON.stringify({ error: 'Incorrect email or password.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  user = existing

  const token = await createSessionToken(
    { userId: user.id, email: user.email },
    requireSecret(context.env),
  )

  return new Response(
    JSON.stringify({
      token,
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
