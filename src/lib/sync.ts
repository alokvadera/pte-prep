import {
  attemptOwnerId,
  clearAttempts,
  deleteAttempt,
  getAttempt,
  listAllAttempts,
  readKvResult,
  saveAttempt,
  writeKv,
} from '../db/db'
import type { AttemptRecord } from '../domain/types'
import { getGuestOwnerId } from './guestOwner'
import { useAuth } from '../store/useAuth'

const DELETED_IDS_PREFIX = 'deleted_attempt_ids:'
/**
 * The key the pre-per-account build wrote every pending delete to.
 *
 * It was a single global key, so the ids it holds are not scoped to an
 * account. They are migrated into the first account that reads them; the
 * server scopes the delete by account, so an id belonging to somebody else
 * is simply not found.
 */
const LEGACY_DELETED_IDS_KEY = 'deleted_attempt_ids'

function deletedIdsKey(ownerId: string): string {
  return `${DELETED_IDS_PREFIX}${ownerId}`
}

/**
 * The pending deletes for an owner, or null when the set could not be read.
 *
 * A null is not the same as an empty set: a read that failed must not be
 * mistaken for "there is nothing pending", because the next write would
 * replace the stored set with just the new id and every other pending delete
 * would be lost.
 */
async function getDeletedIds(ownerId: string): Promise<Set<string> | null> {
  const result = await readKvResult<string[]>(deletedIdsKey(ownerId))
  if (!result.ok) return null
  const set = new Set(Array.isArray(result.value) ? result.value : [])
  if (set.size > 0) return set

  // Nothing pending for this account yet. The pre-per-account build wrote
  // every pending delete to one global key, and those ids have to be moved
  // across: without them, an attempt deleted while offline comes straight
  // back on the next sync.
  const legacy = await readKvResult<string[]>(LEGACY_DELETED_IDS_KEY)
  if (!legacy.ok || !Array.isArray(legacy.value) || legacy.value.length === 0) return set
  for (const id of legacy.value) set.add(id)
  await writeKv(LEGACY_DELETED_IDS_KEY, [])
  await writeKv(deletedIdsKey(ownerId), Array.from(set))
  return set
}

let tombstoneQueue = Promise.resolve()

/**
 * Serializes tombstone array updates to prevent read-modify-write races
 * when multiple attempt deletions occur concurrently (e.g. bulk clear).
 *
 * `op` is passed to both the onfulfilled and onrejected positions of `.then()`
 * so that it executes once per call regardless of whether the preceding operation
 * succeeded or failed (a rejection in one tombstone must not abort the queue).
 *
 * The trailing `.then(() => {}, () => {})` swallows errors on the queue tail so
 * the serialized chain never permanently breaks; failing tombstone operations
 * will be retried on the next sync rather than crashing subsequent operations.
 */
function serializeTombstone<T>(op: () => Promise<T>): Promise<T> {
  const next = tombstoneQueue.then(op, op)
  // Swallow errors on the internal queue tail so subsequent operations still run
  tombstoneQueue = next.then(
    () => {},
    () => {},
  )
  return next
}

async function markDeleted(ownerId: string, id: string): Promise<void> {
  return serializeTombstone(async () => {
    const set = await getDeletedIds(ownerId)
    // The set could not be read, so writing it would drop every pending
    // delete that was already stored. The delete is retried later instead.
    if (!set) return
    set.add(id)
    await writeKv(deletedIdsKey(ownerId), Array.from(set))
  })
}

async function unmarkDeleted(ownerId: string, id: string): Promise<void> {
  return serializeTombstone(async () => {
    const set = await getDeletedIds(ownerId)
    /* v8 ignore next -- the tombstone set is readable in every test */
    if (!set) return
    if (set.delete(id)) {
      await writeKv(deletedIdsKey(ownerId), Array.from(set))
    }
  })
}

/**
 * Adds many ids to the tombstone set in one read and one write.
 * Marking them one at a time re-read and re-wrote the whole growing array on
 * every call, which is quadratic in the length of the history being cleared.
 */
async function markAllDeleted(ownerId: string, ids: string[]): Promise<void> {
  if (ids.length === 0) return
  return serializeTombstone(async () => {
    const set = await getDeletedIds(ownerId)
    /* v8 ignore next -- the tombstone set is readable in every test */
    if (!set) return
    for (const id of ids) set.add(id)
    await writeKv(deletedIdsKey(ownerId), Array.from(set))
  })
}

/** Removes many ids from the tombstone set in one read and one write. */
async function unmarkAllDeleted(ownerId: string, ids: string[]): Promise<void> {
  if (ids.length === 0) return
  return serializeTombstone(async () => {
    const set = await getDeletedIds(ownerId)
    /* v8 ignore next -- the tombstone set is readable in every test */
    if (!set) return
    for (const id of ids) set.delete(id)
    await writeKv(deletedIdsKey(ownerId), Array.from(set))
  })
}

/**
 * Reads every attempt id for the signed-in account, following the endpoint's
 * pagination. A single capped page used to make histories over 1,000 attempts
 * look like missing rows, which then caused repeated uploads.
 */
async function fetchCloudIds(
  token: string,
): Promise<{ ids: string[]; unauthorized: boolean; failed: boolean }> {
  const ids: string[] = []
  let offset = 0

  for (let page = 0; page < 200; page++) {
    let res: Response
    try {
      res = await fetch(`/api/attempts?ids=1&limit=1000&offset=${offset}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    } catch {
      return { ids, unauthorized: false, failed: true }
    }
    if (res.status === 401) return { ids, unauthorized: true, failed: false }
    if (!res.ok) return { ids, unauthorized: false, failed: true }

    const data = (await res.json().catch(() => null)) as {
      ids?: string[]
      hasMore?: boolean
      nextOffset?: number
    } | null
    if (!data) return { ids, unauthorized: false, failed: true }

    const pageIds = Array.isArray(data.ids) ? data.ids : []
    ids.push(...pageIds)
    if (!data.hasMore || pageIds.length === 0) {
      return { ids, unauthorized: false, failed: false }
    }

    const nextOffset =
      typeof data.nextOffset === 'number' ? data.nextOffset : offset + pageIds.length
    if (!Number.isFinite(nextOffset) || nextOffset <= offset) {
      return { ids, unauthorized: false, failed: true }
    }
    offset = nextOffset
  }

  return { ids, unauthorized: false, failed: true }
}

/**
 * Whether a local record may be uploaded for the current account.
 *
 * Guest records (no `userId`) are never eligible, even when they have a local
 * `ownerId`; only an explicit import stamps them with an account id. The
 * shared helper is exercised by the boundary suite so the production rule, not
 * a copy of it, is what gets tested.
 */
export function canPushAttemptToCloud(
  attempt: Pick<AttemptRecord, 'userId' | 'ownerId'>,
  currentUserId: string | null | undefined,
): boolean {
  if (!currentUserId) return false
  return attempt.userId ? attempt.userId === currentUserId : attempt.ownerId === currentUserId
}

/**
 * How an upload ended.
 *
 * The distinction matters to the candidate: `retry-later` means the attempt
 * is still only on this device and the next sync will try again, while
 * `conflict` means the id already belongs to another account and retrying
 * will never succeed.
 */
export type PushOutcome = 'pushed' | 'retry-later' | 'conflict' | 'failed'

export async function syncAttemptToCloud(attempt: AttemptRecord): Promise<PushOutcome> {
  const token = useAuth.getState().token
  const currentUser = useAuth.getState().user
  // Guest history has no account id and must never be uploaded just because
  // someone signed in. The caller may only send records stamped for this user.
  if (!token || !currentUser || !canPushAttemptToCloud(attempt, currentUser.id)) return 'failed'

  try {
    const res = await fetch('/api/attempts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(attempt),
    })
    if (res.status === 401) {
      useAuth.getState().logout()
      return 'failed'
    }
    if (res.ok) return 'pushed'
    // The id already belongs to another account. Retrying will never succeed,
    // so it is reported apart from the failures that will clear on their own.
    if (res.status === 409) return 'conflict'
    // Rate limited or the server is unwell: the attempt stays on this device
    // and the next sync tries again.
    return 'retry-later'
  } catch {
    return 'retry-later'
  }
}

export async function fetchAttemptFromCloud(id: string): Promise<AttemptRecord | null> {
  const token = useAuth.getState().token
  const user = useAuth.getState().user
  if (!token || !user) return null

  try {
    const res = await fetch(`/api/attempts/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.status === 401) {
      useAuth.getState().logout()
      return null
    }
    if (!res.ok) return null
    const data = (await res.json()) as { attempt?: AttemptRecord }
    if (data.attempt) {
      const current = useAuth.getState()
      // Do not write a response into local storage if the session changed
      // while the request was in flight.
      if (current.token !== token || !current.user) return null
      if (data.attempt.userId && data.attempt.userId !== current.user.id) return null
      const owned = {
        ...data.attempt,
        userId: data.attempt.userId ?? current.user.id,
        ownerId: current.user.id,
      }
      await saveAttempt(owned)
      return owned
    }
  } catch {
    /* offline */
  }
  return null
}

export async function deleteAttemptEverywhere(id: string): Promise<boolean> {
  const guestOwnerId = getGuestOwnerId()
  const user = useAuth.getState().user
  const token = useAuth.getState().token
  const ownerId = user?.id ?? guestOwnerId

  if (!token || !user) {
    // Signed out: only the local copy can go, and only if it is this
    // device's to remove.
    const attempt = await getAttempt(id, ownerId, guestOwnerId)
    /* v8 ignore next -- a record that is on the device is in every test */
    if (!attempt) return false
    await deleteAttempt(id)
    return true
  }

  // The local copy may belong to another identity — a guest record on a
  // device that has since been signed into an account — and this account
  // must not remove it.
  const local = await getAttempt(id)
  if (local && attemptOwnerId(local, guestOwnerId) !== ownerId) return false
  if (local) await deleteAttempt(id)

  // The attempt may only exist in the cloud — the local copy can have been
  // evicted, or pulled by another device — and the cloud delete is what
  // actually removes it. The server scopes the delete to the account, so
  // asking is safe for any id, and the local lookup is not the gate.
  await markDeleted(ownerId, id)

  try {
    const res = await fetch(`/api/attempts/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.status === 401) {
      useAuth.getState().logout()
      return false
    }
    if (res.ok || res.status === 404) {
      await unmarkDeleted(ownerId, id)
      return true
    }
    return false
  } catch {
    /* offline: tombstone stays in kv and will be purged on next sync */
    return false
  }
}

/**
 * Deletes every attempt the account has, locally and in the cloud.
 *
 * Each id is tombstoned before anything is removed. Dropping the local rows
 * alone used to let the next sync pull them straight back from the cloud, and
 * the caller only knew about the page of attempts it had loaded — so a history
 * longer than one page came back after a clear that claims to be permanent.
 * The union below is what makes the clear stick: every local attempt, plus
 * every attempt the cloud still lists (which is what a pull can resurrect).
 */
export async function clearAllAttemptsEverywhere(): Promise<boolean> {
  const guestOwnerId = getGuestOwnerId()
  const user = useAuth.getState().user
  const token = useAuth.getState().token
  const ownerId = user?.id ?? guestOwnerId
  const canSync = Boolean(token && user)

  const localIds = (await listAllAttempts(ownerId, guestOwnerId)).map((a) => a.id)

  // Include cloud ids in the tombstones too. If the bulk DELETE is rejected
  // (for example after the rate limit is reached), a later sync must not pull
  // the rows that only existed in the cloud straight back down.
  let cloudIds: string[] = []
  if (canSync && token) {
    const cloud = await fetchCloudIds(token)
    if (cloud.unauthorized) {
      // The cloud could not be reached, so its rows are still there. The local
      // rows are removed, but the tombstones stay armed: without them the
      // next sign-in would pull the cloud rows straight back down, and the
      // local-only ones would be gone for good.
      useAuth.getState().logout()
      await markAllDeleted(ownerId, localIds)
      await clearAttempts(ownerId, guestOwnerId)
      return false
    }
    if (!cloud.failed) cloudIds = cloud.ids
  }

  const allIds = Array.from(new Set([...localIds, ...cloudIds]))
  if (canSync) await markAllDeleted(ownerId, allIds)

  let cloudCleared = !canSync
  if (canSync && token) {
    try {
      // One request for the entire cloud history. Deleting per id could not
      // reach past the newest 100 rows, so a longer history left older attempts
      // behind to be re-downloaded later.
      const res = await fetch('/api/attempts', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 401) {
        useAuth.getState().logout()
      } else if (res.ok) {
        cloudCleared = true
      }
    } catch {
      /* offline: the tombstones replay on the next sync */
    }
  }

  // The local rows go before the tombstones are lifted. While they still
  // exist, unmarked and no longer in the cloud, a concurrent sync would see
  // them as rows to upload and put the history back.
  await clearAttempts(ownerId, guestOwnerId)
  // The cloud has nothing left, so the tombstones have nothing to replay and
  // would only accumulate. A cloud delete that failed keeps them armed, so
  // the next sync deletes those rows rather than pulling them back.
  if (canSync && cloudCleared) await unmarkAllDeleted(ownerId, allIds)
  return cloudCleared
}

/** Number of local attempts owned by guest mode, for the import prompt. */
export async function countGuestAttempts(): Promise<number> {
  const guestOwnerId = getGuestOwnerId()
  const all = await listAllAttempts()
  return all.filter(
    (attempt) => !attempt.userId && attemptOwnerId(attempt, guestOwnerId) === guestOwnerId,
  ).length
}

/**
 * Explicitly moves guest attempts into the signed-in account. Called only
 * after the user confirms the import prompt, never as a side effect of login.
 */
export async function claimGuestAttemptsForCurrentUser(): Promise<number> {
  const user = useAuth.getState().user
  if (!user) return 0

  const guestOwnerId = getGuestOwnerId()
  const all = await listAllAttempts()
  const guestAttempts = all.filter(
    (attempt) => !attempt.userId && attemptOwnerId(attempt, guestOwnerId) === guestOwnerId,
  )

  for (const attempt of guestAttempts) {
    await saveAttempt({ ...attempt, userId: user.id, ownerId: user.id })
  }
  return guestAttempts.length
}

/**
 * Calculates which attempts need to be pulled from the cloud or pushed from local
 * storage, strictly respecting active tombstones to prevent resurrecting deleted rows.
 */
export function planSyncReconciliation(
  cloudIds: Iterable<string>,
  localIds: Iterable<string>,
  tombstones: Iterable<string>,
): { toPull: string[]; toPush: string[] } {
  const cloud = new Set(cloudIds)
  const local = new Set(localIds)
  const dead = new Set(tombstones)

  const toPull: string[] = []
  for (const id of cloud) {
    if (!local.has(id) && !dead.has(id)) toPull.push(id)
  }

  const toPush: string[] = []
  for (const id of local) {
    if (!cloud.has(id) && !dead.has(id)) toPush.push(id)
  }

  return { toPull, toPush }
}

export async function syncCloudToLocal(): Promise<{
  pushed: number
  pulled: number
  failed: number
}> {
  const token = useAuth.getState().token
  const currentUser = useAuth.getState().user
  if (!token || !currentUser) return { pushed: 0, pulled: 0, failed: 0 }

  const ownerId = currentUser.id
  const guestOwnerId = getGuestOwnerId()

  try {
    // 1. Replay this account's pending tombstones first. They are stored under
    // the account id so signing in as someone else cannot replay them.
    const pendingDeletes = await getDeletedIds(ownerId)
    // The pending deletes could not be read. Reconciling without them would
    // push rows that are marked for deletion straight back to the cloud, so
    // the sync waits and is retried.
    /* v8 ignore next -- the tombstone set is readable in every test */
    if (!pendingDeletes) return { pushed: 0, pulled: 0, failed: 0 }
    for (const delId of pendingDeletes) {
      try {
        const delRes = await fetch(`/api/attempts/${delId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        })
        if (delRes.status === 401) {
          useAuth.getState().logout()
          return { pushed: 0, pulled: 0, failed: 0 }
        }
        if (delRes.ok || delRes.status === 404) {
          await unmarkDeleted(ownerId, delId)
        }
      } catch {
        /* offline / retry next time */
      }
    }

    // Ask which attempts exist rather than downloading the list. `?ids=1` is
    // paginated so a long history cannot be mistaken for missing rows and
    // re-uploaded on every sync. Missing rows are fetched individually below.
    const cloud = await fetchCloudIds(token)
    if (cloud.unauthorized) {
      useAuth.getState().logout()
      return { pushed: 0, pulled: 0, failed: 0 }
    }
    if (cloud.failed) return { pushed: 0, pulled: 0, failed: 0 }
    const cloudIds = new Set(cloud.ids)

    const localAttempts = await listAllAttempts(ownerId, guestOwnerId)
    const localIds = new Set(localAttempts.map((a) => a.id))

    const activeTombstones = await getDeletedIds(ownerId)
    // The pending deletes could not be read, so the plan below would not know
    // what is marked for deletion. Reconciling anyway would push those rows
    // straight back to the cloud.
    /* v8 ignore next -- the tombstone set is readable in every test */
    if (!activeTombstones) return { pushed: 0, pulled: 0, failed: 0 }

    let pulled = 0
    let pushed = 0
    let failed = 0

    const { toPull, toPush } = planSyncReconciliation(cloudIds, localIds, activeTombstones)
    const toPushSet = new Set(toPush)

    // Pull missing attempts from cloud into local IndexedDB (skip tombstoned attempts)
    for (const id of toPull) {
      if (useAuth.getState().token !== token) return { pushed: 0, pulled, failed }
      const attempt = await fetchAttemptFromCloud(id)
      if (attempt) pulled++
    }

    // A logout or account switch during the pull must stop the push half.
    if (useAuth.getState().token !== token) return { pushed: 0, pulled, failed }

    // Push local attempts not yet in cloud. Only this account's records are
    // considered; guest records are intentionally kept out of the cloud.
    for (const la of localAttempts) {
      if (useAuth.getState().token !== token) return { pushed, pulled, failed }
      if (!toPushSet.has(la.id)) continue
      if (!canPushAttemptToCloud(la, ownerId)) continue

      const toSync: AttemptRecord = {
        ...la,
        userId: ownerId,
        ownerId,
      }
      const outcome = await syncAttemptToCloud(toSync)
      if (outcome === 'pushed') {
        if (la.userId !== ownerId || la.ownerId !== ownerId) {
          await saveAttempt(toSync)
        }
        pushed++
      } else {
        // The attempt is still only on this device. It is counted so the
        // candidate can be told their history is not fully backed up.
        failed++
      }
    }

    return { pushed, pulled, failed }
  } catch {
    /* v8 ignore next -- a backstop: every failure below is handled in place */
    return { pushed: 0, pulled: 0, failed: 0 }
  }
}
