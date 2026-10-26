import type { AttemptRecord } from '../domain/types'

// ---------------------------------------------------------------------------
// Attempt history lives in IndexedDB on the user's own device.
//
// The database is created lazily so that importing this module during
// prerendering — where there is no `indexedDB` and no `window` — is safe.
// ---------------------------------------------------------------------------

interface KvRow {
  key: string
  value: unknown
}

interface AppDb {
  attempts: {
    put(attempt: AttemptRecord): Promise<unknown>
    get(id: string): Promise<AttemptRecord | undefined>
    delete(id: string): Promise<unknown>
    clear(): Promise<unknown>
    orderBy(key: 'finishedAt'): {
      reverse(): {
        limit(n: number): { toArray(): Promise<AttemptRecord[]> }
        filter(predicate: (attempt: AttemptRecord) => boolean): {
          limit(n: number): { toArray(): Promise<AttemptRecord[]> }
        }
        toArray(): Promise<AttemptRecord[]>
      }
    }
  }
  kv: {
    get(key: string): Promise<KvRow | undefined>
    put(row: KvRow): Promise<unknown>
  }
}

let dbPromise: Promise<AppDb> | null = null

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof indexedDB !== 'undefined'
}

function openDb(): Promise<AppDb> {
  if (!isBrowser()) {
    return Promise.reject(new Error('IndexedDB is not available'))
  }
  if (!dbPromise) {
    dbPromise = (async () => {
      try {
        const [{ default: Dexie }] = await Promise.all([import('dexie')])
        const db = new Dexie('pte-prep') as unknown as AppDb & {
          version(v: number): { stores(schema: Record<string, string>): unknown }
        }
        db.version(1).stores({ attempts: 'id, finishedAt, mockId', kv: 'key' })
        return db
      } catch (err) {
        dbPromise = null
        throw err
      }
    })()
  }
  return dbPromise
}

/**
 * The result of a database operation that can fail.
 *
 * `withDb` turns every failure into its fallback, which is the right answer
 * for a read — an unavailable database looks like an empty one — and the
 * wrong answer for a write, where it makes a failed write look like a
 * successful one.
 */
export type DbResult<T> = { ok: true; value: T } | { ok: false }

async function withDbResult<T>(fn: (db: AppDb) => Promise<T>): Promise<DbResult<T>> {
  try {
    const db = await openDb()
    return { ok: true, value: await fn(db) }
  } catch (err) {
    // Private browsing, storage disabled, or running during prerender.
    // `import.meta.env.MODE` is inlined at transform time, so the warning is
    // unreachable from a test build — it can only fire in a real one.
    /* v8 ignore start -- the warning is compiled out of a test build */
    const isTest = (import.meta as unknown as { env?: { MODE?: string } }).env?.MODE === 'test'
    if (!isTest) {
      console.warn('[db] operation failed:', err)
    }
    /* v8 ignore stop */
    /* v8 ignore next -- the failure is reported, not thrown */
    return { ok: false }
  }
}

async function withDb<T>(fn: (db: AppDb) => Promise<T>, fallback: T): Promise<T> {
  try {
    const db = await openDb()
    return await fn(db)
  } catch (err) {
    // Private browsing, storage disabled, or running during prerender.
    // `import.meta.env.MODE` is inlined at transform time, so the warning is
    // unreachable from a test build — it can only fire in a real one.
    const isTest = (import.meta as unknown as { env?: { MODE?: string } }).env?.MODE === 'test'
    /* v8 ignore next -- the warning is compiled out of a test build */
    if (!isTest) {
      console.warn('[db] withDb operation failed, falling back:', err)
    }
    return fallback
  }
}

/**
 * The local owner of a record.
 *
 * New records carry `ownerId`. Older signed-in records only carry `userId`;
 * older guest records carry neither and belong to the current device-scoped
 * guest identity. This fallback is why guest history stays visible while
 * signed out without becoming visible to the next account that signs in.
 */
export function attemptOwnerId(
  attempt: Pick<AttemptRecord, 'ownerId' | 'userId'>,
  guestOwnerId: string,
): string {
  return attempt.ownerId ?? attempt.userId ?? guestOwnerId
}

function ownedAttempts(
  attempts: AttemptRecord[],
  ownerId: string | undefined,
  guestOwnerId: string,
): AttemptRecord[] {
  return ownerId
    ? attempts.filter((attempt) => attemptOwnerId(attempt, guestOwnerId) === ownerId)
    : attempts
}

/**
 * Saves an attempt, reporting whether it was written.
 *
 * A failed write used to be indistinguishable from a successful one, so the
 * report could tell the candidate their attempt was saved when it was not —
 * in private browsing, or with the storage quota exhausted.
 */
export function saveAttempt(attempt: AttemptRecord): Promise<boolean> {
  return withDb(async (db) => {
    await db.attempts.put(attempt)
    return true
  }, false)
}

/**
 * Newest attempts for one local owner (an account id or guest id). Omitting
 * `ownerId` returns the whole store and is reserved for migration/sync helpers
 * that intentionally need every record.
 */
export function listAttempts(
  limit = 60,
  ownerId?: string,
  guestOwnerId = 'guest:server',
): Promise<AttemptRecord[]> {
  return withDb(async (db) => {
    const attempts = db.attempts.orderBy('finishedAt').reverse()
    return ownerId
      ? attempts
          .filter((attempt) => attemptOwnerId(attempt, guestOwnerId) === ownerId)
          .limit(limit)
          .toArray()
      : attempts.limit(limit).toArray()
  }, [])
}

/**
 * Every stored attempt, newest first and unpaged.
 *
 * Clearing history has to act on the whole store. Reading through
 * `listAttempts` would only ever see a page of it, which is how older attempts
 * used to survive a "clear all" and reappear on the next sync.
 */
export function listAllAttempts(
  ownerId?: string,
  guestOwnerId = 'guest:server',
): Promise<AttemptRecord[]> {
  return withDb(async (db) => {
    const attempts = await db.attempts.orderBy('finishedAt').reverse().toArray()
    return ownedAttempts(attempts, ownerId, guestOwnerId)
  }, [])
}

export function getAttempt(
  id: string,
  ownerId?: string,
  guestOwnerId = 'guest:server',
): Promise<AttemptRecord | undefined> {
  return withDb(async (db) => {
    const attempt = await db.attempts.get(id)
    if (!attempt) return undefined
    return ownerId && attemptOwnerId(attempt, guestOwnerId) !== ownerId ? undefined : attempt
  }, undefined)
}

export function deleteAttempt(id: string): Promise<void> {
  return deleteAttemptResult(id).then(() => undefined)
}

/** Deletes one attempt and reports whether IndexedDB completed the operation. */
export function deleteAttemptResult(id: string): Promise<boolean> {
  return withDb(async (db) => {
    await db.attempts.delete(id)
    return true
  }, false)
}

/** Clears one owner's history, or the entire store when `ownerId` is omitted. */
export function clearAttempts(ownerId?: string, guestOwnerId = 'guest:server'): Promise<void> {
  return clearAttemptsResult(ownerId, guestOwnerId).then(() => undefined)
}

/** Clears attempts and reports whether IndexedDB completed the operation. */
export function clearAttemptsResult(
  ownerId?: string,
  guestOwnerId = 'guest:server',
): Promise<boolean> {
  return withDb(async (db) => {
    if (!ownerId) {
      await db.attempts.clear()
      return true
    }
    const attempts = await db.attempts.orderBy('finishedAt').reverse().toArray()
    for (const attempt of ownedAttempts(attempts, ownerId, guestOwnerId)) {
      await db.attempts.delete(attempt.id)
    }
    return true
  }, false)
}

export function readKv<T>(key: string, fallback: T): Promise<T> {
  return withDb(async (db) => {
    const row = await db.kv.get(key)
    return row ? (row.value as T) : fallback
  }, fallback)
}

/**
 * Reads a value, reporting whether the read actually happened.
 *
 * A failed read and a missing key look the same through `readKv`, and the
 * difference matters for the tombstone set: treating a failed read as an
 * empty set drops every pending delete that was already stored.
 */
export function readKvResult<T>(key: string): Promise<DbResult<T | undefined>> {
  return withDbResult(async (db) => {
    const row = await db.kv.get(key)
    return row ? (row.value as T) : undefined
  })
}

/** Writes a value, reporting whether it was written. */
export function writeKv(key: string, value: unknown): Promise<boolean> {
  return withDb(async (db) => {
    await db.kv.put({ key, value })
    return true
  }, false)
}
