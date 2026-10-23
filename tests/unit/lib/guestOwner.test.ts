import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getGuestOwnerId } from '../../../src/lib/guestOwner'

/* ---------------------------------------------------------------------------
   The local identity for practice done while signed out.

   Guest attempts live in the same IndexedDB database as account attempts, so
   they need an owner too. The id must be stable across calls in a tab, and
   must survive a reload — otherwise a guest's own history would vanish.
   --------------------------------------------------------------------------- */

const STORAGE_KEY = 'pte-prep-guest-owner'

describe('getGuestOwnerId', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  it('returns a guest-scoped identifier', () => {
    expect(getGuestOwnerId()).toMatch(/^guest:/)
  })

  it('returns the same identifier across calls', () => {
    expect(getGuestOwnerId()).toBe(getGuestOwnerId())
  })

  it('persists the identifier so a reload keeps it', async () => {
    // A fresh module instance, as a page reload would give.
    const first = await import('../../../src/lib/guestOwner')
    const id = first.getGuestOwnerId()
    expect(localStorage.getItem(STORAGE_KEY)).toBe(id)

    vi.resetModules()
    const second = await import('../../../src/lib/guestOwner')
    expect(second.getGuestOwnerId()).toBe(id)
  })

  it('survives a localStorage that throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage disabled')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('private mode')
    })
    expect(() => getGuestOwnerId()).not.toThrow()
    expect(getGuestOwnerId()).toMatch(/^guest:/)
  })

  it('falls back to a timestamp when the platform has no randomUUID', async () => {
    vi.resetModules()
    vi.stubGlobal('crypto', undefined)
    localStorage.clear()

    const { getGuestOwnerId: fresh } = await import('../../../src/lib/guestOwner')
    const id = fresh()

    // The fallback joins a base-36 timestamp and a base-36 random suffix.
    expect(id).toMatch(/^guest:[a-z0-9]+-[a-z0-9]+$/)
  })
})
