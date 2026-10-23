import { afterEach, describe, expect, it, vi } from 'vitest'

/* ---------------------------------------------------------------------------
   The fallback path of the attempt database.

   `withDb` swallows a failure to open IndexedDB and returns the caller's
   fallback instead — which is what keeps the app usable in private browsing
   and during prerendering. Outside a test build it also warns, because a
   silent fallback in production is indistinguishable from an empty history.
   --------------------------------------------------------------------------- */

describe('the attempt database fallback', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('returns the fallback rather than throwing', async () => {
    vi.stubGlobal('indexedDB', undefined)
    vi.resetModules()

    const db = await import('../../../src/db/db')

    await expect(db.listAttempts(10)).resolves.toEqual([])
    await expect(db.listAllAttempts()).resolves.toEqual([])
    await expect(db.getAttempt('missing')).resolves.toBeUndefined()
    await expect(db.readKv('missing', 'fallback')).resolves.toBe('fallback')
    await expect(db.deleteAttempt('missing')).resolves.toBeUndefined()
    await expect(db.clearAttempts()).resolves.toBeUndefined()
    await expect(db.writeKv('key', 'value')).resolves.toBe(false)
  })
})
