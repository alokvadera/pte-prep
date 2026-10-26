/* ---------------------------------------------------------------------------
   An in-memory D1.

   The Cloudflare handlers talk to D1 through a small slice of the API:
   `prepare(sql).bind(...args)` and then `first()`, `all()` or `run()`. This
   mock implements that slice over plain Maps, matching the SQL the handlers
   actually send rather than pretending to be a SQL engine.

   The tables mirror `migrations/`: users, attempts, user_sessions,
   password_resets and rate_limits.
   --------------------------------------------------------------------------- */

export interface UserRow {
  id: string
  email: string
  password_hash: string
  password_salt: string
  target_score: number | null
  created_at: string
}

export interface AttemptRow {
  id: string
  user_id: string
  mock_id: string
  mock_title: string
  mode: string
  started_at: string
  finished_at: string
  duration_ms: number
  overall_score: number
  cefr: string
  earned_points: number
  available_points: number
  skill_scores: string
  breakdown: string
  responses: string | null
  synced_at: string
}

export interface SessionRow {
  jti: string
  user_id: string
  expires_at: number
}

export interface ResetRow {
  id: string
  user_id: string
  token_hash: string
  expires_at: string
  created_at: string
  used_at: string | null
}

export interface RateLimitRow {
  key: string
  count: number
  reset_at: number
}

export interface D1Mock {
  db: D1Database
  users: Map<string, UserRow>
  attempts: Map<string, AttemptRow>
  sessions: Map<string, SessionRow>
  resets: Map<string, ResetRow>
  rateLimits: Map<string, RateLimitRow>
}

export interface D1MockOptions {
  users?: UserRow[]
  attempts?: AttemptRow[]
  sessions?: SessionRow[]
  resets?: ResetRow[]
  rateLimits?: RateLimitRow[]
}

const nowIso = (): string => new Date().toISOString()

export function createD1Mock(options: D1MockOptions = {}): D1Mock {
  const users = new Map<string, UserRow>()
  const attempts = new Map<string, AttemptRow>()
  const sessions = new Map<string, SessionRow>()
  const resets = new Map<string, ResetRow>()
  const rateLimits = new Map<string, RateLimitRow>()

  for (const row of options.users ?? []) users.set(row.id, { ...row })
  for (const row of options.attempts ?? []) attempts.set(row.id, { ...row })
  for (const row of options.sessions ?? []) sessions.set(row.jti, { ...row })
  for (const row of options.resets ?? []) resets.set(row.token_hash, { ...row })
  for (const row of options.rateLimits ?? []) rateLimits.set(row.key, { ...row })

  const ok = (changes: number): D1Result =>
    ({
      success: true,
      meta: {
        changes,
        last_row_id: 0,
        duration: 0,
        rows_read: 0,
        rows_written: changes,
        size_after: 0,
        changed_db: false,
      },
    }) as unknown as D1Result

  function handleRun(sql: string, args: unknown[]): D1Result {
    if (sql.includes('INSERT INTO users')) {
      const id = String(args[0])
      if ([...users.values()].some((u) => u.email === args[1])) {
        throw new Error('SQLITE_CONSTRAINT: UNIQUE constraint failed: users.email')
      }
      users.set(id, {
        id,
        email: String(args[1]),
        password_hash: String(args[2]),
        password_salt: String(args[3]),
        target_score: args[4] === null || args[4] === undefined ? null : Number(args[4]),
        created_at: nowIso(),
      })
      return ok(1)
    }

    if (sql.includes('UPDATE users SET target_score = ?')) {
      const user = users.get(String(args[1]))
      if (!user) return ok(0)
      user.target_score = Number(args[0])
      return ok(1)
    }

    if (sql.includes('UPDATE users SET password_hash = ?')) {
      const user = users.get(String(args[2]))
      if (!user) return ok(0)
      user.password_hash = String(args[0])
      user.password_salt = String(args[1])
      return ok(1)
    }

    if (sql.includes('INSERT INTO user_sessions')) {
      sessions.set(String(args[0]), {
        jti: String(args[0]),
        user_id: String(args[1]),
        expires_at: Number(args[2]),
      })
      return ok(1)
    }

    if (sql.includes('DELETE FROM user_sessions WHERE user_id = ?')) {
      let changes = 0
      for (const [jti, row] of [...sessions]) {
        if (row.user_id === args[0]) {
          sessions.delete(jti)
          changes++
        }
      }
      return ok(changes)
    }

    if (sql.includes('DELETE FROM user_sessions WHERE jti = ?')) {
      const existed = sessions.delete(String(args[0]))
      return ok(existed ? 1 : 0)
    }

    if (sql.includes('DELETE FROM user_sessions WHERE expires_at < ?')) {
      const cutoff = Number(args[0])
      let changes = 0
      for (const [jti, row] of [...sessions]) {
        if (row.expires_at < cutoff) {
          sessions.delete(jti)
          changes++
        }
      }
      return ok(changes)
    }

    if (sql.includes('INSERT INTO attempts')) {
      const id = String(args[0])
      const existing = attempts.get(id)
      if (existing && existing.user_id !== args[1]) {
        // The handler relies on a zero change count to report the conflict.
        return ok(0)
      }
      attempts.set(id, {
        id,
        user_id: String(args[1]),
        mock_id: String(args[2]),
        mock_title: String(args[3]),
        mode: String(args[4]),
        started_at: String(args[5]),
        finished_at: String(args[6]),
        duration_ms: Number(args[7]),
        overall_score: Number(args[8]),
        cefr: String(args[9]),
        earned_points: Number(args[10]),
        available_points: Number(args[11]),
        skill_scores: String(args[12]),
        breakdown: String(args[13]),
        responses: String(args[14]),
        synced_at: nowIso(),
      })
      return ok(1)
    }

    if (sql.includes('DELETE FROM attempts WHERE user_id = ?')) {
      let changes = 0
      for (const [id, row] of [...attempts]) {
        if (row.user_id === args[0]) {
          attempts.delete(id)
          changes++
        }
      }
      return ok(changes)
    }

    if (sql.includes('DELETE FROM attempts WHERE id = ?')) {
      const existed = attempts.delete(String(args[0]))
      return ok(existed ? 1 : 0)
    }

    if (sql.includes('INSERT INTO password_resets')) {
      resets.set(String(args[2]), {
        id: String(args[0]),
        user_id: String(args[1]),
        token_hash: String(args[2]),
        expires_at: String(args[3]),
        created_at: nowIso(),
        used_at: null,
      })
      return ok(1)
    }

    if (
      sql.includes('UPDATE password_resets SET used_at = datetime') &&
      sql.includes('user_id = ?')
    ) {
      // Invalidate every outstanding link for one account.
      let changes = 0
      for (const row of resets.values()) {
        if (row.user_id === args[0] && !row.used_at) {
          row.used_at = nowIso()
          changes++
        }
      }
      return ok(changes)
    }

    if (sql.includes('UPDATE password_resets SET used_at = datetime')) {
      const row = resets.get(String(args[0]))
      if (row && !row.used_at && new Date(row.expires_at).getTime() > Date.now()) {
        row.used_at = nowIso()
        return ok(1)
      }
      return ok(0)
    }

    if (sql.includes('DELETE FROM password_resets') && sql.includes('expires_at')) {
      let changes = 0
      for (const [tokenHash, row] of [...resets]) {
        if (new Date(row.expires_at).getTime() <= Date.now()) {
          resets.delete(tokenHash)
          changes++
        }
      }
      return ok(changes)
    }

    if (sql.includes('DELETE FROM rate_limits WHERE reset_at < ?')) {
      const cutoff = Number(args[0])
      let changes = 0
      for (const [key, row] of [...rateLimits]) {
        if (row.reset_at < cutoff) {
          rateLimits.delete(key)
          changes++
        }
      }
      return ok(changes)
    }

    return ok(1)
  }

  function handleFirst(sql: string, args: unknown[]): unknown {
    if (sql.includes('INSERT INTO rate_limits')) {
      // `?1` is the key, `?2` the reset instant, `?3` the current instant.
      const key = String(args[0])
      const resetAt = Number(args[1])
      const now = Number(args[2])
      const existing = rateLimits.get(key)
      if (!existing) {
        const row: RateLimitRow = { key, count: 1, reset_at: resetAt }
        rateLimits.set(key, row)
        return { count: row.count, reset_at: row.reset_at }
      }
      if (existing.reset_at <= now) {
        existing.count = 1
        existing.reset_at = resetAt
      } else {
        existing.count += 1
      }
      return { count: existing.count, reset_at: existing.reset_at }
    }

    if (sql.includes('FROM rate_limits')) {
      const row = rateLimits.get(String(args[0]))
      return row ? { count: row.count, reset_at: row.reset_at } : null
    }

    if (sql.includes('FROM users WHERE email = ?')) {
      const email = String(args[0])
      for (const user of users.values()) {
        if (user.email === email) return { ...user }
      }
      return null
    }

    if (sql.includes('FROM users WHERE id = ?')) {
      const row = users.get(String(args[0]))
      return row ? { ...row } : null
    }

    if (sql.includes('FROM user_sessions')) {
      // `SELECT jti FROM user_sessions WHERE jti = ? AND user_id = ? AND expires_at > ?`
      const row = sessions.get(String(args[0]))
      if (row && row.user_id === args[1] && row.expires_at > Number(args[2])) {
        return { jti: row.jti }
      }
      return null
    }

    if (sql.includes('FROM password_resets WHERE token_hash = ?')) {
      const row = resets.get(String(args[0]))
      return row ? { ...row } : null
    }

    if (sql.includes('FROM password_resets WHERE user_id = ?')) {
      // The "was a reset sent in the last two minutes" probe.
      const cutoff = Date.now() - 2 * 60 * 1000
      for (const row of resets.values()) {
        if (row.user_id === args[0] && new Date(row.created_at).getTime() > cutoff) {
          return { id: row.id }
        }
      }
      return null
    }

    if (sql.includes('count(*)') && sql.includes('FROM attempts')) {
      // `SELECT count(*) as count FROM attempts WHERE user_id = ?`
      let count = 0
      for (const row of attempts.values()) {
        if (row.user_id === args[0]) count++
      }
      return { count }
    }

    if (sql.includes('FROM attempts') && sql.includes('id = ?')) {
      const row = attempts.get(String(args[0]))
      if (!row) return null
      if (args.length > 1 && row.user_id !== args[1]) return null
      return { ...row }
    }

    return null
  }

  function handleAll(sql: string, args: unknown[]): { results: unknown[] } {
    if (sql.includes('FROM attempts')) {
      const owner = String(args[0])
      const rows = [...attempts.values()]
        .filter((row) => row.user_id === owner)
        .sort((a, b) =>
          a.finished_at < b.finished_at ? 1 : a.finished_at > b.finished_at ? -1 : 0,
        )
      return { results: rows.map((row) => ({ ...row })) }
    }
    return { results: [] }
  }

  const db = {
    exec: async () => undefined,
    batch: async () => [],
    prepare: (sql: string) => {
      let bound: unknown[] = []
      const stmt = {
        bind: (...args: unknown[]) => {
          bound = args
          return stmt
        },
        first: async <T = unknown>() => handleFirst(sql, bound) as T | null,
        all: async <T = unknown>() => handleAll(sql, bound) as { results: T[] },
        run: async () => handleRun(sql, bound),
        raw: async () => [],
      }
      return stmt
    },
  } as unknown as D1Database

  return { db, users, attempts, sessions, resets, rateLimits }
}

/**
 * A D1 whose every query fails. The rate limiter and the session helpers both
 * have to survive this: one fails closed, the other rejects the session.
 */
export function createFailingD1(error: Error = new Error('D1 connection timeout')): D1Database {
  const fail = async (): Promise<never> => {
    throw error
  }
  return {
    exec: fail,
    batch: fail,
    prepare: () => ({
      bind: function bind() {
        return this
      },
      first: fail,
      all: fail,
      run: fail,
      raw: fail,
    }),
  } as unknown as D1Database
}
