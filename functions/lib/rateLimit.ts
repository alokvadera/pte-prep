export interface RateLimitResult {
  allowed: boolean
  retryAfter: number
}

let tableReady = false

async function ensureTable(db: D1Database): Promise<void> {
  if (tableReady) return
  try {
    await db.exec(
      'CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, reset_at INTEGER NOT NULL);',
    )
    tableReady = true
  } catch (err) {
    console.warn('[RateLimit] ensureTable notice (table may already exist):', err)
  }
}

export function getClientIp(request: Request): string {
  return request.headers.get('cf-connecting-ip')?.trim() || 'unknown'
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
    // A read-then-write pair lets two concurrent requests at the limit both see
    // `count = limit - 1` and both be allowed. Do the reset/increment decision
    // in one statement so D1 serialises it; the window is started or reset in
    // the same row lock that counts the request.
    const resetAt = now + windowSeconds
    const row = await db
      .prepare(
        `INSERT INTO rate_limits (key, count, reset_at) VALUES (?1, 1, ?2)
         ON CONFLICT(key) DO UPDATE SET
           count = CASE WHEN rate_limits.reset_at <= ?3 THEN 1 ELSE rate_limits.count + 1 END,
           reset_at = CASE WHEN rate_limits.reset_at <= ?3 THEN ?2 ELSE rate_limits.reset_at END
         RETURNING count, reset_at`,
      )
      .bind(key, resetAt, now)
      .first<{ count: number; reset_at: number }>()

    if (!row) {
      console.error('[RateLimit:NO_ROW] Rate limit upsert returned no row, failing closed.')
      return { allowed: false, retryAfter: 60 }
    }

    if (row.count > limit) {
      return { allowed: false, retryAfter: Math.max(1, row.reset_at - now) }
    }

    return { allowed: true, retryAfter: 0 }
  } catch (err) {
    console.error('[RateLimit:DB_ERROR] Rate limit query failed, failing closed for protection:', err)
    return { allowed: false, retryAfter: 60 }
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
