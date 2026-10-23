import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  attemptOwnerId,
  clearAttempts,
  deleteAttempt,
  getAttempt,
  listAllAttempts,
  listAttempts,
  readKv,
  saveAttempt,
  writeKv,
} from '../../../src/db/db'
import { makeAttempt } from '../../helpers/factories'

/* ---------------------------------------------------------------------------
   The local attempt history.

   Everything here runs against the real IndexedDB (fake-indexeddb), because the
   module's behaviour depends on Dexie: the ordering by `finishedAt`, the owner
   filters and the key/value store are all implemented on top of it.

   The module creates its database lazily and caches the promise in a module
   level variable, so the store survives between tests in this file. Every test
   therefore starts by clearing the attempts table.
   --------------------------------------------------------------------------- */

describe('attemptOwnerId', () => {
  it('prefers the owner id', () => {
    expect(attemptOwnerId({ ownerId: 'usr_1', userId: 'usr_legacy' }, 'guest:1')).toBe('usr_1')
  })

  it('falls back to the user id for older account records', () => {
    expect(attemptOwnerId({ userId: 'usr_legacy' }, 'guest:1')).toBe('usr_legacy')
  })

  it('falls back to the guest id for records with neither', () => {
    expect(attemptOwnerId({}, 'guest:1')).toBe('guest:1')
  })
})

describe('attempt history', () => {
  beforeEach(async () => {
    // No owner filter: the whole table, so no test can see another's rows.
    await clearAttempts()
  })

  it('saves an attempt and reads it back unchanged', async () => {
    const attempt = makeAttempt({ id: 'a-save', ownerId: 'usr_1', userId: 'usr_1' })
    await saveAttempt(attempt)

    const stored = await getAttempt('a-save')
    expect(stored).toBeDefined()
    expect(stored?.id).toBe('a-save')
    expect(stored?.overallScore).toBe(60)
    expect(stored?.ownerId).toBe('usr_1')
  })

  it('overwrites an attempt with the same id', async () => {
    await saveAttempt(makeAttempt({ id: 'a-over', overallScore: 40, ownerId: 'usr_1' }))
    await saveAttempt(makeAttempt({ id: 'a-over', overallScore: 75, ownerId: 'usr_1' }))

    const stored = await getAttempt('a-over')
    expect(stored?.overallScore).toBe(75)
    expect(await listAllAttempts()).toHaveLength(1)
  })

  it('returns undefined for an attempt that does not exist', async () => {
    expect(await getAttempt('missing')).toBeUndefined()
  })

  it('hides an attempt from an owner that does not match', async () => {
    await saveAttempt(makeAttempt({ id: 'a-owned', ownerId: 'usr_1' }))

    expect(await getAttempt('a-owned', 'usr_1')).toBeDefined()
    expect(await getAttempt('a-owned', 'usr_2')).toBeUndefined()
  })

  it('orders attempts newest first by finishedAt', async () => {
    await saveAttempt(makeAttempt({ id: 'old', finishedAt: '2026-01-01T00:00:00.000Z' }))
    await saveAttempt(makeAttempt({ id: 'new', finishedAt: '2026-03-01T00:00:00.000Z' }))
    await saveAttempt(makeAttempt({ id: 'mid', finishedAt: '2026-02-01T00:00:00.000Z' }))

    expect((await listAllAttempts()).map((a) => a.id)).toEqual(['new', 'mid', 'old'])
  })

  it('returns at most the requested number of attempts', async () => {
    for (let i = 0; i < 4; i++) {
      await saveAttempt(
        makeAttempt({
          id: `a-${i}`,
          finishedAt: `2026-01-0${i + 1}T00:00:00.000Z`,
          ownerId: 'usr_1',
        }),
      )
    }

    const listed = await listAttempts(2, 'usr_1')
    expect(listed).toHaveLength(2)
    expect(listed.map((a) => a.id)).toEqual(['a-3', 'a-2'])
  })

  it('returns every stored attempt from listAllAttempts', async () => {
    for (let i = 0; i < 4; i++) {
      await saveAttempt(
        makeAttempt({
          id: `b-${i}`,
          finishedAt: `2026-01-0${i + 1}T00:00:00.000Z`,
          ownerId: 'usr_1',
        }),
      )
    }

    expect(await listAllAttempts()).toHaveLength(4)
    expect(await listAllAttempts('usr_1')).toHaveLength(4)
  })

  it('excludes attempts owned by somebody else', async () => {
    await saveAttempt(makeAttempt({ id: 'mine', ownerId: 'usr_1' }))
    await saveAttempt(makeAttempt({ id: 'theirs', ownerId: 'usr_2' }))

    const listed = await listAttempts(10, 'usr_1')
    expect(listed.map((a) => a.id)).toEqual(['mine'])
    expect((await listAllAttempts('usr_2')).map((a) => a.id)).toEqual(['theirs'])
  })

  it('scopes records that only carry a user id to that account', async () => {
    await saveAttempt(makeAttempt({ id: 'legacy', userId: 'usr_legacy' }))

    expect((await listAllAttempts('usr_legacy')).map((a) => a.id)).toEqual(['legacy'])
    expect(await listAllAttempts('usr_other')).toEqual([])
  })

  it('deletes a single attempt', async () => {
    await saveAttempt(makeAttempt({ id: 'a-del', ownerId: 'usr_1' }))
    await deleteAttempt('a-del')

    expect(await getAttempt('a-del')).toBeUndefined()
    expect(await listAllAttempts()).toEqual([])
  })

  it('clears the whole store when no owner is given', async () => {
    await saveAttempt(makeAttempt({ id: 'c-1', ownerId: 'usr_1' }))
    await saveAttempt(makeAttempt({ id: 'c-2', ownerId: 'usr_2' }))

    await clearAttempts()

    expect(await listAllAttempts()).toEqual([])
  })

  it('clears only the rows of one owner', async () => {
    await saveAttempt(makeAttempt({ id: 'c-mine', ownerId: 'usr_1' }))
    await saveAttempt(makeAttempt({ id: 'c-theirs', ownerId: 'usr_2' }))

    await clearAttempts('usr_1')

    expect((await listAllAttempts()).map((a) => a.id)).toEqual(['c-theirs'])
  })
})

describe('key/value store', () => {
  it('returns the fallback when the key is absent', async () => {
    expect(await readKv('never-written', 'fallback')).toBe('fallback')
    expect(await readKv('never-written', [])).toEqual([])
  })

  it('round-trips a written value', async () => {
    await writeKv('round-trip', { count: 3, ids: ['a', 'b'] })

    expect(await readKv('round-trip', null)).toEqual({ count: 3, ids: ['a', 'b'] })
  })

  it('overwrites a value when the same key is written again', async () => {
    await writeKv('overwrite', ['first'])
    await writeKv('overwrite', ['second'])

    expect(await readKv('overwrite', [])).toEqual(['second'])
  })

  it('hands back the stored value verbatim, even when it is not the expected shape', async () => {
    // The store does not validate: a corrupted value comes back as it was
    // written, and it is the caller's job to fall back.
    await writeKv('corrupted', 'not-a-list')

    expect(await readKv('corrupted', 'fallback')).toBe('not-a-list')
  })
})

describe('storage fallbacks', () => {
  afterEach(() => {
    vi.doUnmock('dexie')
    vi.resetModules()
  })

  it('returns the fallbacks instead of throwing when IndexedDB is unavailable', async () => {
    vi.stubGlobal('indexedDB', undefined)
    vi.resetModules()
    const fresh = await import('../../../src/db/db')

    expect(await fresh.listAttempts()).toEqual([])
    expect(await fresh.listAllAttempts()).toEqual([])
    expect(await fresh.getAttempt('a1')).toBeUndefined()
    expect(await fresh.readKv('any-key', 'fallback')).toBe('fallback')
    await expect(fresh.saveAttempt(makeAttempt({ id: 'a1' }))).resolves.toBe(false)
    await expect(fresh.deleteAttempt('a1')).resolves.toBeUndefined()
    await expect(fresh.clearAttempts()).resolves.toBeUndefined()
    await expect(fresh.clearAttempts('usr_1')).resolves.toBeUndefined()
    await expect(fresh.writeKv('any-key', [1])).resolves.toBe(false)
  })

  it('returns the fallbacks when the database cannot be opened', async () => {
    vi.doMock('dexie', () => ({
      default: class BrokenDexie {
        constructor() {
          throw new Error('IndexedDB is not available')
        }
      },
    }))
    vi.resetModules()
    const fresh = await import('../../../src/db/db')

    expect(await fresh.listAttempts()).toEqual([])
    expect(await fresh.listAllAttempts()).toEqual([])
    expect(await fresh.getAttempt('a1')).toBeUndefined()
    expect(await fresh.readKv('any-key', 'fallback')).toBe('fallback')
  })
})
