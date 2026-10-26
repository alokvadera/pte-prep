import type { Env, UserRecord } from '../../types'
import {
  DUMMY_PASSWORD_HASH,
  DUMMY_PASSWORD_SALT,
  createSessionToken,
  requireSecret,
  resolvePbkdf2Iterations,
  resolveSessionExpiry,
  verifyPassword,
} from '../../lib/auth'
import { checkRateLimit, getClientIp, rateLimitExceededResponse } from '../../lib/rateLimit'

interface ExtendedUserRecord extends UserRecord {
  password_hash: string | null
  password_salt: string | null
}

async function padDuration(startMs: number, targetMs = 250): Promise<void> {
  const elapsed = Date.now() - startMs
  if (elapsed < targetMs) {
    await new Promise((r) => setTimeout(r, targetMs - elapsed))
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const start = Date.now()
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

  // Rate limit: 30 attempts per 10m per IP, 5 attempts per 5m per IP+email, 10 attempts per 5m per email
  const clientIp = getClientIp(context.request)
  const ipCheck = await checkRateLimit(db, `login:ip:${clientIp}`, 30, 600)
  if (!ipCheck.allowed) {
    return rateLimitExceededResponse(ipCheck.retryAfter)
  }
  const emailCheck = await checkRateLimit(db, `login:ip_email:${clientIp}:${rawEmail}`, 5, 300)
  if (!emailCheck.allowed) {
    return rateLimitExceededResponse(emailCheck.retryAfter)
  }
  const emailOnlyCheck = await checkRateLimit(db, `login:email:${rawEmail}`, 10, 300)
  if (!emailOnlyCheck.allowed) {
    return rateLimitExceededResponse(emailOnlyCheck.retryAfter)
  }

  const existing = await db
    .prepare(
      'SELECT id, email, target_score, password_hash, password_salt, created_at, updated_at FROM users WHERE email = ?',
    )
    .bind(rawEmail)
    .first<ExtendedUserRecord>()

  const iterations = resolvePbkdf2Iterations(context.env)

  // Timing equalization: always run real PBKDF2 derivation and pad response duration
  if (!existing || !existing.password_hash) {
    await verifyPassword(password, DUMMY_PASSWORD_HASH, DUMMY_PASSWORD_SALT, iterations)
    await padDuration(start)
    return new Response(JSON.stringify({ error: 'Incorrect email or password.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const valid = await verifyPassword(
    password,
    existing.password_hash,
    existing.password_salt ?? '',
    iterations,
  )
  if (!valid) {
    await padDuration(start)
    return new Response(JSON.stringify({ error: 'Incorrect email or password.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const user = existing

  const expiresIn = resolveSessionExpiry(context.env)
  const token = await createSessionToken(
    { userId: user.id, email: user.email },
    requireSecret(context.env),
    expiresIn,
    db,
  )

  return new Response(
    JSON.stringify({
      token,
      // Absolute expiry of the token above. Without it the client has to guess,
      // and a guess longer than the token's life means it keeps sending a dead
      // bearer token until the first 401 instead of signing out locally.
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
