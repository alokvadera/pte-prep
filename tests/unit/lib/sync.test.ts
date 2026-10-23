import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  canPushAttemptToCloud,
  claimGuestAttemptsForCurrentUser,
  clearAllAttemptsEverywhere,
  countGuestAttempts,
  deleteAttemptEverywhere,
  fetchAttemptFromCloud,
  planSyncReconciliation,
  syncAttemptToCloud,
  syncCloudToLocal,
} from '../../../src/lib/sync'
import * as db from '../../../src/db/db'
import { getGuestOwnerId } from '../../../src/lib/guestOwner'
import { useAuth } from '../../../src/store/useAuth'
import { installFetchMock, jsonResponse } from '../../helpers/fetch'
import type { FetchMock, RecordedCall } from '../../helpers/fetch'
import { makeAttempt } from '../../helpers/factories'

/* ---------------------------------------------------------------------------
   The cloud sync.

   The sync module is the seam between the local IndexedDB history and the
   account history on the server. It owns three things that are easy to get
   wrong and therefore worth pinning down here:

   * which records may leave the device (guest history must never be uploaded),
   * which records come down, and which ones are tombstoned so a deleted row
     is not resurrected by the next sync,
   * what happens when the session expires in the middle of a run.

   The auth store is driven directly (`useAuth.setState`), the local history
   is the real IndexedDB, and the server is a fetch stub.
   --------------------------------------------------------------------------- */

const GUEST_OWNER = getGuestOwnerId()
const USER = { id: 'usr_1', email: 'a@b.c', targetScore: 60 }
const IDS_URL = '/api/attempts?ids=1'

function tombstoneKey(ownerId: string): string {
  return `deleted_attempt_ids:${ownerId}`
}

function signIn(): void {
  useAuth.setState({ token: 'tok', user: { ...USER } })
}

function callsTo(mock: FetchMock, method: string, part = '/api/attempts'): RecordedCall[] {
  return mock.calls.filter((call) => call.method === method && call.url.includes(part))
}

/** Runs `change` right after the request whose url matches `matches`. */
function changeSessionAfter(
  mock: FetchMock,
  matches: (url: string) => boolean,
  change: () => void,
): void {
  const original = mock.fetch.getMockImplementation()
  mock.fetch.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
    const res = await (original as any)!(input, init)
    if (matches(String(input))) change()
    return res
  })
}

beforeEach(async () => {
  useAuth.setState({ token: null, user: null })
  await db.clearAttempts()
  await db.writeKv(tombstoneKey(GUEST_OWNER), [])
  await db.writeKv(tombstoneKey(USER.id), [])
})

describe('canPushAttemptToCloud', () => {
  it('is false when nobody is signed in', () => {
    expect(canPushAttemptToCloud({ userId: 'usr_1', ownerId: 'usr_1' }, null)).toBe(false)
    expect(canPushAttemptToCloud({ userId: 'usr_1', ownerId: 'usr_1' }, undefined)).toBe(false)
    expect(canPushAttemptToCloud({ userId: 'usr_1', ownerId: 'usr_1' }, '')).toBe(false)
  })

  it('is true when the record carries the signed-in account id', () => {
    expect(canPushAttemptToCloud({ userId: 'usr_1', ownerId: 'usr_1' }, 'usr_1')).toBe(true)
  })

  it('is false when the record belongs to another account', () => {
    expect(canPushAttemptToCloud({ userId: 'usr_2', ownerId: 'usr_2' }, 'usr_1')).toBe(false)
  })

  it('falls back to the owner id when the record has no user id', () => {
    // The comment above the function claims guest records are never eligible.
    // The code compares the owner id instead, so a record that only carries a
    // matching owner id is accepted.
    expect(canPushAttemptToCloud({ ownerId: 'usr_1' }, 'usr_1')).toBe(true)
    expect(canPushAttemptToCloud({ ownerId: 'usr_2' }, 'usr_1')).toBe(false)
    expect(canPushAttemptToCloud({}, 'usr_1')).toBe(false)
  })
})

describe('planSyncReconciliation', () => {
  it('pulls the ids the cloud has and the device does not', () => {
    expect(planSyncReconciliation(['c1', 'c2'], ['c2'], [])).toEqual({ toPull: ['c1'], toPush: [] })
  })

  it('pushes the ids the device has and the cloud does not', () => {
    expect(planSyncReconciliation(['c1'], ['c1', 'l1'], [])).toEqual({ toPull: [], toPush: ['l1'] })
  })

  it('never pulls or pushes a tombstoned id', () => {
    expect(planSyncReconciliation(['t1'], ['t1'], ['t1'])).toEqual({ toPull: [], toPush: [] })
    expect(planSyncReconciliation(['t1'], [], ['t1'])).toEqual({ toPull: [], toPush: [] })
    expect(planSyncReconciliation([], ['t1'], ['t1'])).toEqual({ toPull: [], toPush: [] })
  })

  it('leaves ids that exist on both sides alone', () => {
    expect(planSyncReconciliation(['a1'], ['a1'], [])).toEqual({ toPull: [], toPush: [] })
  })

  it('accepts any iterable of ids', () => {
    expect(planSyncReconciliation(new Set(['c1']), new Set(['l1']), new Set())).toEqual({
      toPull: ['c1'],
      toPush: ['l1'],
    })
  })
})

describe('syncAttemptToCloud', () => {
  it('does nothing without a token', async () => {
    const mock = installFetchMock()
    useAuth.setState({ token: null, user: { ...USER } })

    expect(await syncAttemptToCloud(makeAttempt({ userId: 'usr_1', ownerId: 'usr_1' }))).toBe('failed')
    expect(mock.calls).toHaveLength(0)
  })

  it('does nothing without a user', async () => {
    const mock = installFetchMock()
    useAuth.setState({ token: 'tok', user: null })

    expect(await syncAttemptToCloud(makeAttempt({ userId: 'usr_1', ownerId: 'usr_1' }))).toBe('failed')
    expect(mock.calls).toHaveLength(0)
  })

  it('refuses a record that belongs to another account', async () => {
    const mock = installFetchMock()
    signIn()

    expect(await syncAttemptToCloud(makeAttempt({ userId: 'usr_2', ownerId: 'usr_2' }))).toBe('failed')
    expect(mock.calls).toHaveLength(0)
  })

  it('posts the record to the cloud with a bearer token', async () => {
    const mock = installFetchMock([
      { url: '/api/attempts', method: 'POST', status: 200, body: { ok: true } },
    ])
    signIn()

    expect(await syncAttemptToCloud(makeAttempt({ id: 'a1', userId: 'usr_1', ownerId: 'usr_1' }))).toBe(
      'pushed',
    )

    const posted = callsTo(mock, 'POST')
    expect(posted).toHaveLength(1)
    expect(posted[0]?.url).toBe('/api/attempts')
    const headers = posted[0]?.init?.headers as Record<string, string>
    expect(headers.Authorization).toBe('Bearer tok')
    expect(headers['Content-Type']).toBe('application/json')
    expect(JSON.parse(String(posted[0]?.init?.body))).toMatchObject({ id: 'a1' })
  })

  it('reports a retryable failure when the cloud rejects the record', async () => {
    installFetchMock([{ url: '/api/attempts', method: 'POST', status: 500 }])
    signIn()

    // A server that is unwell is worth retrying, so it is reported apart
    // from a failure that will never clear on its own.
    expect(await syncAttemptToCloud(makeAttempt({ userId: 'usr_1', ownerId: 'usr_1' }))).toBe(
      'retry-later',
    )
  })

  it('reports a conflict when the id already belongs to another account', async () => {
    installFetchMock([{ url: '/api/attempts', method: 'POST', status: 409 }])
    signIn()

    expect(await syncAttemptToCloud(makeAttempt({ userId: 'usr_1', ownerId: 'usr_1' }))).toBe('conflict')
  })

  it('signs the user out when the cloud answers 401', async () => {
    installFetchMock([{ url: '/api/attempts', method: 'POST', status: 401 }])
    signIn()

    expect(await syncAttemptToCloud(makeAttempt({ userId: 'usr_1', ownerId: 'usr_1' }))).toBe('failed')
    expect(useAuth.getState().token).toBeNull()
    expect(useAuth.getState().user).toBeNull()
  })

  it('reports a retryable failure when the request cannot be sent at all', async () => {
    installFetchMock([{ url: '/api/attempts', method: 'POST', networkError: true }])
    signIn()

    expect(await syncAttemptToCloud(makeAttempt({ userId: 'usr_1', ownerId: 'usr_1' }))).toBe(
      'retry-later',
    )
  })
})

describe('fetchAttemptFromCloud', () => {
  it('does nothing without a token', async () => {
    const mock = installFetchMock()
    useAuth.setState({ token: null, user: { ...USER } })

    expect(await fetchAttemptFromCloud('c1')).toBeNull()
    expect(mock.calls).toHaveLength(0)
  })

  it('does nothing without a user', async () => {
    const mock = installFetchMock()
    useAuth.setState({ token: 'tok', user: null })

    expect(await fetchAttemptFromCloud('c1')).toBeNull()
    expect(mock.calls).toHaveLength(0)
  })

  it('downloads the record and stores it under the signed-in account', async () => {
    const cloud = makeAttempt({ id: 'c1', mockTitle: 'Cloud mock' })
    const mock = installFetchMock([{ url: '/api/attempts/c1', body: { attempt: cloud } }])
    signIn()

    const result = await fetchAttemptFromCloud('c1')
    expect(result?.id).toBe('c1')
    expect(result?.userId).toBe('usr_1')
    expect(result?.ownerId).toBe('usr_1')

    const stored = await db.getAttempt('c1')
    expect(stored?.userId).toBe('usr_1')
    expect(stored?.ownerId).toBe('usr_1')

    const requested = callsTo(mock, 'GET', '/api/attempts/c1')
    expect(requested).toHaveLength(1)
    const headers = requested[0]?.init?.headers as Record<string, string>
    expect(headers.Authorization).toBe('Bearer tok')
  })

  it('signs the user out when the cloud answers 401', async () => {
    installFetchMock([{ url: '/api/attempts/c1', status: 401 }])
    signIn()

    expect(await fetchAttemptFromCloud('c1')).toBeNull()
    expect(useAuth.getState().token).toBeNull()
    expect(await db.getAttempt('c1')).toBeUndefined()
  })

  it('returns null when the cloud answers with an error', async () => {
    installFetchMock([{ url: '/api/attempts/c1', status: 500 }])
    signIn()

    expect(await fetchAttemptFromCloud('c1')).toBeNull()
    expect(await db.getAttempt('c1')).toBeUndefined()
  })

  it('returns null when the body carries no attempt', async () => {
    installFetchMock([{ url: '/api/attempts/c1', body: { error: 'not found' } }])
    signIn()

    expect(await fetchAttemptFromCloud('c1')).toBeNull()
    expect(await db.getAttempt('c1')).toBeUndefined()
  })

  it('refuses a record that belongs to another account', async () => {
    const foreign = makeAttempt({ id: 'c1', userId: 'usr_2', ownerId: 'usr_2' })
    installFetchMock([{ url: '/api/attempts/c1', body: { attempt: foreign } }])
    signIn()

    expect(await fetchAttemptFromCloud('c1')).toBeNull()
    expect(await db.getAttempt('c1')).toBeUndefined()
  })

  it('refuses to write when the session changed while the request was in flight', async () => {
    const cloud = makeAttempt({ id: 'c1' })
    const mock = installFetchMock([{ url: '/api/attempts/c1', body: { attempt: cloud } }])
    signIn()
    changeSessionAfter(mock, (url) => url.includes('/api/attempts/c1'), () => {
      useAuth.setState({ token: 'another-token' })
    })

    expect(await fetchAttemptFromCloud('c1')).toBeNull()
    expect(await db.getAttempt('c1')).toBeUndefined()
  })

  it('returns null when the request cannot be sent at all', async () => {
    installFetchMock([{ url: '/api/attempts/c1', networkError: true }])
    signIn()

    expect(await fetchAttemptFromCloud('c1')).toBeNull()
  })
})

describe('deleteAttemptEverywhere', () => {
  it('deletes a record that only exists in the cloud', async () => {
    // The local copy can be evicted, or pulled by another device. The cloud
    // delete is what actually removes it, so the local lookup is not the gate:
    // without this, a record that is not on this device could never be deleted.
    const mock = installFetchMock([
      { url: '/api/attempts/missing', method: 'DELETE', status: 404 },
    ])
    signIn()

    expect(await deleteAttemptEverywhere('missing')).toBe(true)
    expect(callsTo(mock, 'DELETE', '/api/attempts/missing')).toHaveLength(1)
  })

  it('reports failure when the record belongs to another account', async () => {
    await db.saveAttempt(makeAttempt({ id: 'a1', ownerId: 'usr_2', userId: 'usr_2' }))
    const mock = installFetchMock()
    signIn()

    expect(await deleteAttemptEverywhere('a1')).toBe(false)
    expect(callsTo(mock, 'DELETE')).toHaveLength(0)
    expect(await db.getAttempt('a1')).toBeDefined()
  })

  it('moves the pending deletes off the key the old build wrote them to', async () => {
    // The pre-per-account build wrote every pending delete to one global key.
    // Without migrating them, an attempt deleted while offline comes straight
    // back on the next sync.
    await db.writeKv('deleted_attempt_ids', ['att-old-1', 'att-old-2'])
    installFetchMock([{ url: '/api/attempts/a1', method: 'DELETE', status: 200 }])
    signIn()

    await deleteAttemptEverywhere('a1')

    expect(await db.readKv<string[]>(tombstoneKey(USER.id), [])).toEqual(
      expect.arrayContaining(['att-old-1', 'att-old-2']),
    )
    // The old key is cleared, so the migration happens once.
    expect(await db.readKv<string[]>('deleted_attempt_ids', [])).toEqual([])
  })

  it('removes the record locally and in the cloud for a signed-in user', async () => {
    await db.saveAttempt(makeAttempt({ id: 'a1', ownerId: 'usr_1', userId: 'usr_1' }))
    const mock = installFetchMock([{ url: '/api/attempts/a1', method: 'DELETE', status: 200 }])
    signIn()

    expect(await deleteAttemptEverywhere('a1')).toBe(true)
    expect(await db.getAttempt('a1')).toBeUndefined()

    const deleted = callsTo(mock, 'DELETE', '/api/attempts/a1')
    expect(deleted).toHaveLength(1)
    const headers = deleted[0]?.init?.headers as Record<string, string>
    expect(headers.Authorization).toBe('Bearer tok')
    // The tombstone is dropped again once the cloud confirmed the delete.
    expect(await db.readKv<string[]>(tombstoneKey(USER.id), [])).toEqual([])
  })

  it('treats a 404 from the cloud as a successful delete', async () => {
    await db.saveAttempt(makeAttempt({ id: 'a1', ownerId: 'usr_1', userId: 'usr_1' }))
    installFetchMock([{ url: '/api/attempts/a1', method: 'DELETE', status: 404 }])
    signIn()

    expect(await deleteAttemptEverywhere('a1')).toBe(true)
    expect(await db.readKv<string[]>(tombstoneKey(USER.id), [])).toEqual([])
  })

  it('keeps the tombstone when the cloud delete fails', async () => {
    await db.saveAttempt(makeAttempt({ id: 'a1', ownerId: 'usr_1', userId: 'usr_1' }))
    installFetchMock([{ url: '/api/attempts/a1', method: 'DELETE', status: 500 }])
    signIn()

    expect(await deleteAttemptEverywhere('a1')).toBe(false)
    expect(await db.readKv<string[]>(tombstoneKey(USER.id), [])).toEqual(['a1'])
  })

  it('keeps the tombstone when the cloud cannot be reached', async () => {
    await db.saveAttempt(makeAttempt({ id: 'a1', ownerId: 'usr_1', userId: 'usr_1' }))
    installFetchMock([{ url: '/api/attempts/a1', method: 'DELETE', networkError: true }])
    signIn()

    expect(await deleteAttemptEverywhere('a1')).toBe(false)
    expect(await db.readKv<string[]>(tombstoneKey(USER.id), [])).toEqual(['a1'])
  })

  it('signs the user out when the cloud answers 401', async () => {
    await db.saveAttempt(makeAttempt({ id: 'a1', ownerId: 'usr_1', userId: 'usr_1' }))
    installFetchMock([{ url: '/api/attempts/a1', method: 'DELETE', status: 401 }])
    signIn()

    expect(await deleteAttemptEverywhere('a1')).toBe(false)
    expect(useAuth.getState().token).toBeNull()
    expect(useAuth.getState().user).toBeNull()
  })

  it('keeps the tombstone queue usable when the key/value store fails', async () => {
    // The pending deletes could not be read, so the tombstone is not written
    // rather than the stored set being replaced with a single id. The delete
    // still goes through, and the queue still works afterwards.
    const spy = vi.spyOn(db, 'readKvResult').mockResolvedValueOnce({ ok: false })
    await db.saveAttempt(makeAttempt({ id: 'a1', ownerId: 'usr_1', userId: 'usr_1' }))
    signIn()

    installFetchMock([{ url: '/api/attempts/a1', method: 'DELETE', status: 200 }])
    expect(await deleteAttemptEverywhere('a1')).toBe(true)
    spy.mockRestore()

    // The next tombstone operation still runs.
    installFetchMock([{ url: '/api/attempts/a1', method: 'DELETE', status: 200 }])
    expect(await deleteAttemptEverywhere('a1')).toBe(true)
  })

  it('deletes only the local record when nobody is signed in', async () => {
    await db.saveAttempt(makeAttempt({ id: 'g1', ownerId: GUEST_OWNER }))
    const mock = installFetchMock()

    expect(await deleteAttemptEverywhere('g1')).toBe(true)
    expect(await db.getAttempt('g1')).toBeUndefined()
    expect(callsTo(mock, 'DELETE')).toHaveLength(0)
  })

  it('skips the tombstone rewrite when the id was already dropped', async () => {
    await db.saveAttempt(makeAttempt({ id: 'a1', ownerId: 'usr_1', userId: 'usr_1' }))
    const mock = installFetchMock([{ url: '/api/attempts/a1', method: 'DELETE', status: 200 }])
    signIn()
    const original = mock.fetch.getMockImplementation()
    mock.fetch.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const res = await (original as any)!(input, init)
      // The tombstone list was emptied while the request was in flight.
      await db.writeKv(tombstoneKey(USER.id), [])
      return res
    })

    expect(await deleteAttemptEverywhere('a1')).toBe(true)
    expect(await db.readKv<string[]>(tombstoneKey(USER.id), [])).toEqual([])
  })
})

describe('clearAllAttemptsEverywhere', () => {
  it('clears the local history and the cloud history in one request', async () => {
    await db.saveAttempt(makeAttempt({ id: 'l1', ownerId: 'usr_1', userId: 'usr_1' }))
    await db.saveAttempt(makeAttempt({ id: 'l2', ownerId: 'usr_1', userId: 'usr_1' }))
    const mock = installFetchMock([
      { url: IDS_URL, body: { ids: ['c1', 'c2'], hasMore: false } },
      { url: '/api/attempts', method: 'DELETE', status: 200 },
    ])
    signIn()

    expect(await clearAllAttemptsEverywhere()).toBe(true)
    expect(await db.listAllAttempts()).toEqual([])

    expect(callsTo(mock, 'DELETE')).toHaveLength(1)
    expect(callsTo(mock, 'DELETE')[0]?.url).toBe('/api/attempts')

    const listed = callsTo(mock, 'GET', 'ids=1')
    expect(listed).toHaveLength(1)
    expect(listed[0]?.url).toBe('/api/attempts?ids=1&limit=1000&offset=0')

    // Nothing is left to replay, so the tombstones are dropped again.
    expect(await db.readKv<string[]>(tombstoneKey(USER.id), [])).toEqual([])
  })

  it('keeps the tombstones when the cloud delete fails', async () => {
    await db.saveAttempt(makeAttempt({ id: 'l1', ownerId: 'usr_1', userId: 'usr_1' }))
    installFetchMock([
      { url: IDS_URL, body: { ids: ['c1'], hasMore: false } },
      { url: '/api/attempts', method: 'DELETE', status: 500 },
    ])
    signIn()

    expect(await clearAllAttemptsEverywhere()).toBe(false)
    expect(await db.listAllAttempts()).toEqual([])
    expect(await db.readKv<string[]>(tombstoneKey(USER.id), [])).toEqual(['l1', 'c1'])
  })

  it('follows the pagination of the id listing', async () => {
    installFetchMock([
      { url: IDS_URL, body: { ids: ['c1'], hasMore: true, nextOffset: 1 }, once: true },
      { url: IDS_URL, body: { ids: ['c2'], hasMore: false }, once: true },
      { url: '/api/attempts', method: 'DELETE', status: 500 },
    ])
    signIn()

    expect(await clearAllAttemptsEverywhere()).toBe(false)
    expect(await db.readKv<string[]>(tombstoneKey(USER.id), [])).toEqual(['c1', 'c2'])
  })

  it('signs the user out when the id listing is rejected', async () => {
    await db.saveAttempt(makeAttempt({ id: 'l1', ownerId: 'usr_1', userId: 'usr_1' }))
    installFetchMock([{ url: IDS_URL, status: 401 }])
    signIn()

    expect(await clearAllAttemptsEverywhere()).toBe(false)
    expect(useAuth.getState().token).toBeNull()
    expect(useAuth.getState().user).toBeNull()
    expect(await db.listAllAttempts()).toEqual([])
  })

  it('signs the user out when the bulk delete is rejected', async () => {
    installFetchMock([
      { url: IDS_URL, body: { ids: ['c1'], hasMore: false } },
      { url: '/api/attempts', method: 'DELETE', status: 401 },
    ])
    signIn()

    expect(await clearAllAttemptsEverywhere()).toBe(false)
    expect(useAuth.getState().token).toBeNull()
    expect(await db.readKv<string[]>(tombstoneKey(USER.id), [])).toEqual(['c1'])
  })

  it('clears the local history only when nobody is signed in', async () => {
    await db.saveAttempt(makeAttempt({ id: 'g1', ownerId: GUEST_OWNER }))
    const mock = installFetchMock()

    expect(await clearAllAttemptsEverywhere()).toBe(true)
    expect(await db.listAllAttempts()).toEqual([])
    expect(mock.calls).toHaveLength(0)
  })

  it('leaves the tombstone list alone when there is nothing to clear', async () => {
    const mock = installFetchMock([
      { url: IDS_URL, body: { ids: [], hasMore: false } },
      { url: '/api/attempts', method: 'DELETE', status: 200 },
    ])
    signIn()

    expect(await clearAllAttemptsEverywhere()).toBe(true)
    expect(callsTo(mock, 'DELETE')).toHaveLength(1)
    expect(await db.readKv<string[]>(tombstoneKey(USER.id), [])).toEqual([])
  })

  it('falls back to the local ids when the cloud listing fails', async () => {
    await db.saveAttempt(makeAttempt({ id: 'l1', ownerId: 'usr_1', userId: 'usr_1' }))
    installFetchMock([
      { url: IDS_URL, status: 500 },
      { url: '/api/attempts', method: 'DELETE', status: 500 },
    ])
    signIn()

    expect(await clearAllAttemptsEverywhere()).toBe(false)
    expect(await db.readKv<string[]>(tombstoneKey(USER.id), [])).toEqual(['l1'])
  })
})

describe('countGuestAttempts', () => {
  it('counts the records the guest owns', async () => {
    await db.saveAttempt(makeAttempt({ id: 'g1', ownerId: GUEST_OWNER }))
    await db.saveAttempt(makeAttempt({ id: 'g2' }))

    expect(await countGuestAttempts()).toBe(2)
  })

  it('ignores account records and records owned by another guest', async () => {
    await db.saveAttempt(makeAttempt({ id: 'u1', ownerId: 'usr_1', userId: 'usr_1' }))
    await db.saveAttempt(makeAttempt({ id: 'g3', ownerId: 'guest:other-device' }))

    expect(await countGuestAttempts()).toBe(0)
  })
})

describe('claimGuestAttemptsForCurrentUser', () => {
  it('does nothing when nobody is signed in', async () => {
    await db.saveAttempt(makeAttempt({ id: 'g1', ownerId: GUEST_OWNER }))

    expect(await claimGuestAttemptsForCurrentUser()).toBe(0)
    const stored = await db.getAttempt('g1')
    expect(stored?.userId).toBeUndefined()
  })

  it('moves the guest records to the signed-in account', async () => {
    await db.saveAttempt(makeAttempt({ id: 'g1', ownerId: GUEST_OWNER }))
    await db.saveAttempt(makeAttempt({ id: 'g2' }))
    await db.saveAttempt(makeAttempt({ id: 'u1', ownerId: 'usr_1', userId: 'usr_1' }))
    signIn()

    expect(await claimGuestAttemptsForCurrentUser()).toBe(2)

    const claimed = await db.getAttempt('g1')
    expect(claimed?.userId).toBe('usr_1')
    expect(claimed?.ownerId).toBe('usr_1')

    const untouched = await db.getAttempt('u1')
    expect(untouched?.userId).toBe('usr_1')
    expect(await countGuestAttempts()).toBe(0)
  })
})

describe('syncCloudToLocal', () => {
  it('does nothing without a session', async () => {
    const mock = installFetchMock()

    expect(await syncCloudToLocal()).toEqual({ pushed: 0, pulled: 0, failed: 0 })
    expect(mock.calls).toHaveLength(0)
  })

  it('pulls the attempts the device is missing', async () => {
    installFetchMock([
      { url: IDS_URL, body: { ids: ['c1', 'c2'], hasMore: false } },
      { url: '/api/attempts/c1', body: { attempt: makeAttempt({ id: 'c1' }) } },
      { url: '/api/attempts/c2', body: { attempt: makeAttempt({ id: 'c2' }) } },
    ])
    signIn()

    expect(await syncCloudToLocal()).toEqual({ pushed: 0, pulled: 2, failed: 0 })
    expect((await db.getAttempt('c1'))?.ownerId).toBe('usr_1')
    expect((await db.getAttempt('c2'))?.ownerId).toBe('usr_1')
  })

  it('pushes the local attempts the cloud does not have', async () => {
    await db.saveAttempt(makeAttempt({ id: 'l1', ownerId: 'usr_1', userId: 'usr_1' }))
    const mock = installFetchMock([
      { url: IDS_URL, body: { ids: [], hasMore: false } },
      { url: '/api/attempts', method: 'POST', status: 200, body: { ok: true } },
    ])
    signIn()

    expect(await syncCloudToLocal()).toEqual({ pushed: 1, pulled: 0, failed: 0 })
    expect(callsTo(mock, 'POST')).toHaveLength(1)
  })

  it('stamps and stores a local record that only carries the owner id', async () => {
    await db.saveAttempt(makeAttempt({ id: 'l1', ownerId: 'usr_1' }))
    installFetchMock([
      { url: IDS_URL, body: { ids: [], hasMore: false } },
      { url: '/api/attempts', method: 'POST', status: 200, body: { ok: true } },
    ])
    signIn()

    expect(await syncCloudToLocal()).toEqual({ pushed: 1, pulled: 0, failed: 0 })
    const stored = await db.getAttempt('l1')
    expect(stored?.userId).toBe('usr_1')
    expect(stored?.ownerId).toBe('usr_1')
  })

  it('leaves a local record of another account alone', async () => {
    // The record is owned by this account but carries another account id, so
    // it must not be uploaded.
    await db.saveAttempt(makeAttempt({ id: 'l1', ownerId: 'usr_1', userId: 'usr_2' }))
    const mock = installFetchMock([{ url: IDS_URL, body: { ids: [], hasMore: false } }])
    signIn()

    expect(await syncCloudToLocal()).toEqual({ pushed: 0, pulled: 0, failed: 0 })
    expect(callsTo(mock, 'POST')).toHaveLength(0)
  })

  it('leaves a record the cloud already has alone', async () => {
    await db.saveAttempt(makeAttempt({ id: 'l1', ownerId: 'usr_1', userId: 'usr_1' }))
    const mock = installFetchMock([{ url: IDS_URL, body: { ids: ['l1'], hasMore: false } }])
    signIn()

    expect(await syncCloudToLocal()).toEqual({ pushed: 0, pulled: 0, failed: 0 })
    expect(callsTo(mock, 'POST')).toHaveLength(0)
  })

  it('replays the pending tombstones before anything else', async () => {
    await db.writeKv(tombstoneKey(USER.id), ['t1'])
    const mock = installFetchMock([
      { url: '/api/attempts/t1', method: 'DELETE', status: 200 },
      { url: IDS_URL, body: { ids: [], hasMore: false } },
    ])
    signIn()

    expect(await syncCloudToLocal()).toEqual({ pushed: 0, pulled: 0, failed: 0 })
    expect(callsTo(mock, 'DELETE', '/api/attempts/t1')).toHaveLength(1)
    expect(await db.readKv<string[]>(tombstoneKey(USER.id), [])).toEqual([])
    // The tombstone replay happens before the id listing.
    expect(mock.calls[0]?.url).toBe('/api/attempts/t1')
  })

  it('keeps a tombstone whose replay failed', async () => {
    await db.writeKv(tombstoneKey(USER.id), ['t1'])
    installFetchMock([
      { url: '/api/attempts/t1', method: 'DELETE', status: 500 },
      { url: IDS_URL, body: { ids: [], hasMore: false } },
    ])
    signIn()

    expect(await syncCloudToLocal()).toEqual({ pushed: 0, pulled: 0, failed: 0 })
    expect(await db.readKv<string[]>(tombstoneKey(USER.id), [])).toEqual(['t1'])
  })

  it('signs the user out when a tombstone replay is rejected', async () => {
    await db.writeKv(tombstoneKey(USER.id), ['t1'])
    installFetchMock([{ url: '/api/attempts/t1', method: 'DELETE', status: 401 }])
    signIn()

    expect(await syncCloudToLocal()).toEqual({ pushed: 0, pulled: 0, failed: 0 })
    expect(useAuth.getState().token).toBeNull()
    expect(useAuth.getState().user).toBeNull()
  })

  it('counts an upload the cloud refused as a failure, not a push', async () => {
    await db.saveAttempt(makeAttempt({ id: 'l1', ownerId: 'usr_1', userId: 'usr_1' }))
    installFetchMock([
      { url: IDS_URL, body: { ids: [], hasMore: false } },
      { url: '/api/attempts', method: 'POST', status: 500 },
    ])
    signIn()

    // The attempt is still only on this device, so it is counted as a
    // failure the candidate can be told about — not as a push.
    expect(await syncCloudToLocal()).toEqual({ pushed: 0, pulled: 0, failed: 1 })
  })

  it('treats a listing without ids as an empty cloud', async () => {
    installFetchMock([{ url: IDS_URL, body: { hasMore: false } }])
    signIn()

    expect(await syncCloudToLocal()).toEqual({ pushed: 0, pulled: 0, failed: 0 })
  })

  it('continues the listing by the page size when the cloud does not say where to resume', async () => {
    const mock = installFetchMock([
      { url: IDS_URL, body: { ids: ['c1'], hasMore: true }, once: true },
      { url: IDS_URL, body: { ids: [], hasMore: false }, once: true },
    ])
    signIn()

    expect(await syncCloudToLocal()).toEqual({ pushed: 0, pulled: 0, failed: 0 })
    expect(callsTo(mock, 'GET', 'ids=1')[1]?.url).toBe('/api/attempts?ids=1&limit=1000&offset=1')
  })

  it('follows the pagination of the id listing', async () => {
    installFetchMock([
      { url: IDS_URL, body: { ids: ['c1'], hasMore: true, nextOffset: 1 }, once: true },
      { url: IDS_URL, body: { ids: ['c2'], hasMore: false }, once: true },
      { url: '/api/attempts/c1', body: { attempt: makeAttempt({ id: 'c1' }) } },
      { url: '/api/attempts/c2', body: { attempt: makeAttempt({ id: 'c2' }) } },
    ])
    signIn()

    expect(await syncCloudToLocal()).toEqual({ pushed: 0, pulled: 2, failed: 0 })
  })

  it('signs the user out when the id listing is rejected', async () => {
    installFetchMock([{ url: IDS_URL, status: 401 }])
    signIn()

    expect(await syncCloudToLocal()).toEqual({ pushed: 0, pulled: 0, failed: 0 })
    expect(useAuth.getState().token).toBeNull()
    expect(useAuth.getState().user).toBeNull()
  })

  it('gives up when the id listing fails', async () => {
    installFetchMock([{ url: IDS_URL, status: 500 }])
    signIn()

    expect(await syncCloudToLocal()).toEqual({ pushed: 0, pulled: 0, failed: 0 })
  })

  it('gives up when the id listing cannot be sent', async () => {
    installFetchMock([{ url: IDS_URL, networkError: true }])
    signIn()

    expect(await syncCloudToLocal()).toEqual({ pushed: 0, pulled: 0, failed: 0 })
  })

  it('gives up when the id listing cannot be parsed', async () => {
    installFetchMock([{ url: IDS_URL, status: 200 }])
    signIn()

    expect(await syncCloudToLocal()).toEqual({ pushed: 0, pulled: 0, failed: 0 })
  })

  it('gives up when the id listing never finishes', async () => {
    const mock = installFetchMock([])
    mock.fetch.mockImplementation(async () => jsonResponse({ ids: ['c1'], hasMore: true, nextOffset: 1 }))
    signIn()

    expect(await syncCloudToLocal()).toEqual({ pushed: 0, pulled: 0, failed: 0 })
  })

  it('stops the push half when the session changed during the pull', async () => {
    await db.saveAttempt(makeAttempt({ id: 'l1', ownerId: 'usr_1', userId: 'usr_1' }))
    const mock = installFetchMock([
      { url: IDS_URL, body: { ids: ['c1'], hasMore: false } },
      { url: '/api/attempts/c1', body: { attempt: makeAttempt({ id: 'c1' }) } },
    ])
    signIn()
    changeSessionAfter(
      mock,
      (url) => url.includes('/api/attempts/c1'),
      () => {
        useAuth.setState({ token: 'another-token' })
      },
    )

    // The pulled record is refused as well, because the session no longer
    // matches the one the request was made with.
    expect(await syncCloudToLocal()).toEqual({ pushed: 0, pulled: 0, failed: 0 })
    expect(await db.getAttempt('c1')).toBeUndefined()
  })

  it('stops the upload loop when the session changes between uploads', async () => {
    await db.saveAttempt(
      makeAttempt({ id: 'l1', ownerId: 'usr_1', userId: 'usr_1', finishedAt: '2026-01-01T00:00:00.000Z' }),
    )
    await db.saveAttempt(
      makeAttempt({ id: 'l2', ownerId: 'usr_1', userId: 'usr_1', finishedAt: '2026-02-01T00:00:00.000Z' }),
    )
    const mock = installFetchMock([
      { url: IDS_URL, body: { ids: [], hasMore: false } },
      { url: '/api/attempts', method: 'POST', status: 200, body: { ok: true } },
    ])
    signIn()
    changeSessionAfter(
      mock,
      (url) => url === '/api/attempts',
      () => {
        useAuth.setState({ token: 'another-token' })
      },
    )

    expect(await syncCloudToLocal()).toEqual({ pushed: 1, pulled: 0, failed: 0 })
    expect(callsTo(mock, 'POST')).toHaveLength(1)
  })

  it('stops the pull when the session changed before it started', async () => {
    const mock = installFetchMock([
      { url: IDS_URL, body: { ids: ['c1'], hasMore: false } },
      { url: '/api/attempts/c1', body: { attempt: makeAttempt({ id: 'c1' }) } },
    ])
    signIn()
    changeSessionAfter(
      mock,
      (url) => url.includes('ids=1'),
      () => {
        useAuth.setState({ token: 'another-token' })
      },
    )

    expect(await syncCloudToLocal()).toEqual({ pushed: 0, pulled: 0, failed: 0 })
  })

  it('gives up when the run fails as a whole', async () => {
    const spy = vi.spyOn(db, 'readKv').mockRejectedValueOnce(new Error('kv offline'))
    installFetchMock()
    signIn()

    expect(await syncCloudToLocal()).toEqual({ pushed: 0, pulled: 0, failed: 0 })
    spy.mockRestore()
  })

  it('treats a corrupted tombstone list as an empty one', async () => {
    await db.writeKv(tombstoneKey(USER.id), 'not-a-list')
    installFetchMock([{ url: IDS_URL, body: { ids: [], hasMore: false } }])
    signIn()

    expect(await syncCloudToLocal()).toEqual({ pushed: 0, pulled: 0, failed: 0 })
  })
})
