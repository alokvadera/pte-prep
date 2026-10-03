import type { Env, UserRecord } from '../../types'
import { createSessionToken, hashPassword, verifyPassword } from '../../lib/auth'

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

  let user: UserRecord

  if (!existing) {
    // If password provided and user doesn't exist, we don't automatically create on login
    // unless no password or user explicitly registers
    if (password) {
      return new Response(JSON.stringify({ error: 'Incorrect email or password.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const id = `usr_${crypto.randomUUID().replace(/-/g, '')}`
    await db
      .prepare('INSERT INTO users (id, email) VALUES (?, ?)')
      .bind(id, rawEmail)
      .run()

    user = {
      id,
      email: rawEmail,
      target_score: 65,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  } else {
    // Existing user
    if (existing.password_hash) {
      if (!password) {
        return new Response(
          JSON.stringify({ error: 'Password is required to sign in to this account.' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } },
        )
      }

      const valid = await verifyPassword(
        password,
        existing.password_hash,
        existing.password_salt ?? '',
      )
      if (!valid) {
        return new Response(JSON.stringify({ error: 'Incorrect email or password.' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    } else if (password) {
      // User existed without password; set it now
      const { hash, salt } = await hashPassword(password)
      await db
        .prepare(
          "UPDATE users SET password_hash = ?, password_salt = ?, updated_at = datetime('now') WHERE id = ?",
        )
        .bind(hash, salt, existing.id)
        .run()
    }

    user = existing
  }

  const token = await createSessionToken(
    { userId: user.id, email: user.email },
    context.env.JWT_SECRET,
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
