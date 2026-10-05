import type { Env, UserRecord } from '../../types'
import { createSessionToken, hashPassword, requireSecret, verifyPassword } from '../../lib/auth'

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

  const existing = await db
    .prepare(
      'SELECT id, email, target_score, password_hash, password_salt, created_at, updated_at FROM users WHERE email = ?',
    )
    .bind(rawEmail)
    .first<ExtendedUserRecord>()

  // Passwordless sign-in is removed: a login with no password is a 401, and a
  // login for an unknown email is a 401. Accounts can only be created through
  // /api/auth/register, which always sets a password.

  let user: UserRecord

  if (!existing) {
    return new Response(JSON.stringify({ error: 'Incorrect email or password.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!password) {
    return new Response(
      JSON.stringify({ error: 'Password is required to sign in to this account.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  // Existing user
  if (!existing.password_hash) {
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
