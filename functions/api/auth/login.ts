import type { Env, UserRecord } from '../../types'
import { createSessionToken } from '../../lib/auth'

export const onRequestPost: PagesFunction<Env> = async (context) => {
  let body: { email?: string }
  try {
    body = (await context.request.json()) as { email?: string }
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const rawEmail = (body.email ?? '').trim().toLowerCase()
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

  // Look up or create user
  const existing = await db
    .prepare('SELECT id, email, target_score, created_at, updated_at FROM users WHERE email = ?')
    .bind(rawEmail)
    .first<UserRecord>()

  let user: UserRecord
  if (existing) {
    user = existing
  } else {
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
