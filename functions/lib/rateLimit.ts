export interface RateLimitResult {
  allowed: boolean
  retryAfter: number
}

let tableReady = false

async function ensureTable(db: D1Database): Promise<void> {
  if (tableReady) return
  tableReady = true
  try {
    await db.exec(
      'CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, reset_at INTEGER NOT NULL);',
    )
  } catch (err) {
    console.warn('[RateLimit] ensureTable notice (table may already exist):', err)
  }
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  )
}

export async function checkRateLimit(
  db: D1Database,
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  await ensureTable(db)
  const now = Math.floor(Date.now() / 1000)

  // Opportunistic cleanup: 5% chance to prune expired rate limit keys
  if (Math.random() < 0.05) {
    db.prepare('DELETE FROM rate_limits WHERE reset_at < ?')
      .bind(now)
      .run()
      .catch((err) => console.warn('[RateLimit] Cleanup failed:', err))
  }

  try {
    const row = await db
      .prepare('SELECT count, reset_at FROM rate_limits WHERE key = ?')
      .bind(key)
      .first<{ count: number; reset_at: number }>()

    if (!row || now >= row.reset_at) {
      const resetAt = now + windowSeconds
      await db
        .prepare(
          'INSERT INTO rate_limits (key, count, reset_at) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET count = 1, reset_at = excluded.reset_at',
        )
        .bind(key, resetAt)
        .run()
      return { allowed: true, retryAfter: 0 }
    }

    if (row.count >= limit) {
      return { allowed: false, retryAfter: Math.max(1, row.reset_at - now) }
    }

    await db
      .prepare('UPDATE rate_limits SET count = count + 1 WHERE key = ?')
      .bind(key)
      .run()

    return { allowed: true, retryAfter: 0 }
  } catch (err) {
    console.error('[RateLimit:DB_ERROR] Rate limit query failed, falling open to preserve user access:', err)
    return { allowed: true, retryAfter: 0 }
  }
}

export function rateLimitExceededResponse(retryAfter: number): Response {
  return new Response(
    JSON.stringify({ error: 'Too many requests. Please wait a moment and try again.' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
      },
    },
  )
}
