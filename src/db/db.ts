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
    orderBy(key: 'finishedAt'): { reverse(): { limit(n: number): { toArray(): Promise<AttemptRecord[]> } } }
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
      const [{ default: Dexie }] = await Promise.all([import('dexie')])
      const db = new Dexie('pte-prep') as unknown as AppDb & {
        version(v: number): { stores(schema: Record<string, string>): unknown }
      }
      db.version(1).stores({ attempts: 'id, finishedAt, mockId', kv: 'key' })
      return db
    })()
  }
  return dbPromise
}

async function withDb<T>(fn: (db: AppDb) => Promise<T>, fallback: T): Promise<T> {
  try {
    const db = await openDb()
    return await fn(db)
  } catch {
    // Private browsing, storage disabled, or running during prerender.
    return fallback
  }
}

export function saveAttempt(attempt: AttemptRecord): Promise<void> {
  return withDb(async (db) => {
    await db.attempts.put(attempt)
  }, undefined)
}

export function listAttempts(limit = 60): Promise<AttemptRecord[]> {
  return withDb(async (db) => db.attempts.orderBy('finishedAt').reverse().limit(limit).toArray(), [])
}

export function getAttempt(id: string): Promise<AttemptRecord | undefined> {
  return withDb(async (db) => db.attempts.get(id), undefined)
}

export function deleteAttempt(id: string): Promise<void> {
  return withDb(async (db) => {
    await db.attempts.delete(id)
  }, undefined)
}

export function clearAttempts(): Promise<void> {
  return withDb(async (db) => {
    await db.attempts.clear()
  }, undefined)
}

export function readKv<T>(key: string, fallback: T): Promise<T> {
  return withDb(async (db) => {
    const row = await db.kv.get(key)
    return row ? (row.value as T) : fallback
  }, fallback)
}

export function writeKv(key: string, value: unknown): Promise<void> {
  return withDb(async (db) => {
    await db.kv.put({ key, value })
  }, undefined)
}
