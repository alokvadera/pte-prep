import type { Env, UserRecord } from '../../types'
import { createSessionToken, hashPassword, requireSecret } from '../../lib/auth'
import { checkRateLimit, getClientIp, rateLimitExceededResponse } from '../../lib/rateLimit'

interface ExtendedUserRecord extends UserRecord {
  password_hash: string | null
  password_salt: string | null
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const onRequestPost: PagesFunction<Env> = async (context) => {
  let body: { email?: string; password?: string; targetScore?: number }
  try {
    body = (await context.request.json()) as { email?: string; password?: string; targetScore?: number }
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  const targetScore = typeof body.targetScore === 'number' && body.targetScore >= 10 && body.targetScore <= 90
    ? Math.round(body.targetScore)
    : 65

  if (!email || !EMAIL_RE.test(email)) {
    return new Response(JSON.stringify({ error: 'Please enter a valid email address.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!password || password.length < 6) {
    return new Response(JSON.stringify({ error: 'Password must be at least 6 characters long.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (password.length > 128) {
    return new Response(JSON.stringify({ error: 'Password is too long (max 128 characters).' }), {
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

  // Rate limit: 10 registrations per hour per IP, 3 attempts per 10m per email
  const clientIp = getClientIp(context.request)
  const ipCheck = await checkRateLimit(db, `register:ip:${clientIp}`, 10, 3600)
  if (!ipCheck.allowed) {
    return rateLimitExceededResponse(ipCheck.retryAfter)
  }
  const emailCheck = await checkRateLimit(db, `register:ip_email:${clientIp}:${email}`, 3, 600)
  if (!emailCheck.allowed) {
    return rateLimitExceededResponse(emailCheck.retryAfter)
  }

  const existing = await db
    .prepare('SELECT id, email, target_score, password_hash, password_salt FROM users WHERE email = ?')
    .bind(email)
    .first<ExtendedUserRecord>()

  const { hash, salt } = await hashPassword(password)

  if (existing) {
    return new Response(
      JSON.stringify({ error: 'Unable to create account. If you already have an account, please sign in or reset your password.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  // Create new user
  const userId = `usr_${crypto.randomUUID().replace(/-/g, '')}`
  await db
    .prepare(
      'INSERT INTO users (id, email, password_hash, password_salt, target_score) VALUES (?, ?, ?, ?, ?)',
    )
    .bind(userId, email, hash, salt, targetScore)
    .run()

  const token = await createSessionToken({ userId, email }, requireSecret(context.env))

  return new Response(
    JSON.stringify({
      ok: true,
      token,
      user: { id: userId, email, targetScore },
    }),
    { status: 201, headers: { 'Content-Type': 'application/json' } },
  )
}
