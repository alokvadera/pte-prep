import { clearAttempts, deleteAttempt, listAllAttempts, readKv, saveAttempt, writeKv } from '../db/db'
import type { AttemptRecord } from '../domain/types'
import { useAuth } from '../store/useAuth'

const DELETED_IDS_KEY = 'deleted_attempt_ids'

async function getDeletedIds(): Promise<Set<string>> {
  const list = await readKv<string[]>(DELETED_IDS_KEY, [])
  return new Set(Array.isArray(list) ? list : [])
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
  tombstoneQueue = next.then(() => {}, () => {})
  return next
}

async function markDeleted(id: string): Promise<void> {
  return serializeTombstone(async () => {
    const set = await getDeletedIds()
    set.add(id)
    await writeKv(DELETED_IDS_KEY, Array.from(set))
  })
}

async function unmarkDeleted(id: string): Promise<void> {
  return serializeTombstone(async () => {
    const set = await getDeletedIds()
    if (set.delete(id)) {
      await writeKv(DELETED_IDS_KEY, Array.from(set))
    }
  })
}

/**
 * Adds many ids to the tombstone set in one read and one write.
 * Marking them one at a time re-read and re-wrote the whole growing array on
 * every call, which is quadratic in the length of the history being cleared.
 */
async function markAllDeleted(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  return serializeTombstone(async () => {
    const set = await getDeletedIds()
    for (const id of ids) set.add(id)
    await writeKv(DELETED_IDS_KEY, Array.from(set))
  })
}

/** Removes many ids from the tombstone set in one read and one write. */
async function unmarkAllDeleted(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  return serializeTombstone(async () => {
    const set = await getDeletedIds()
    for (const id of ids) set.delete(id)
    await writeKv(DELETED_IDS_KEY, Array.from(set))
  })
}

export async function syncAttemptToCloud(attempt: AttemptRecord): Promise<boolean> {
  const token = useAuth.getState().token
  if (!token) return false

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
      return false
    }
    return res.ok
  } catch {
    return false
  }
}

export async function fetchAttemptFromCloud(id: string): Promise<AttemptRecord | null> {
  const token = useAuth.getState().token
  if (!token) return null

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
      await saveAttempt(data.attempt)
      return data.attempt
    }
  } catch {
    /* offline */
  }
  return null
}

export async function deleteAttemptEverywhere(id: string): Promise<boolean> {
  await markDeleted(id)
  await deleteAttempt(id)

  const token = useAuth.getState().token
  if (!token) return true

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
      await unmarkDeleted(id)
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
export async function clearAllAttemptsEverywhere(): Promise<void> {
  const token = useAuth.getState().token
  const localIds = (await listAllAttempts()).map((a) => a.id)

  // Tombstone the whole local set first, in a single write. If the request
  // below fails or the page closes mid-way, the tombstones replay on the next
  // sync instead of the cloud pushing the rows back down.
  await markAllDeleted(localIds)

  if (token) {
    try {
      // One request for the entire cloud history. Deleting per id could not
      // reach past the newest 100 rows, so a longer history left older attempts
      // behind to be re-downloaded later.
      const res = await fetch('/api/attempts', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        // The cloud has nothing left, so the tombstones have nothing to replay
        // and would only accumulate.
        await unmarkAllDeleted(localIds)
      }
    } catch {
      /* offline: the tombstones replay on the next sync */
    }
  }

  await clearAttempts()
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

export async function syncCloudToLocal(): Promise<{ pushed: number; pulled: number }> {
  const token = useAuth.getState().token
  if (!token) return { pushed: 0, pulled: 0 }

  try {
    // 1. Replay any pending tombstones to cloud first
    const pendingDeletes = await getDeletedIds()
    for (const delId of pendingDeletes) {
      try {
        const delRes = await fetch(`/api/attempts/${delId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        })
        if (delRes.status === 401) {
          useAuth.getState().logout()
          return { pushed: 0, pulled: 0 }
        }
        if (delRes.ok || delRes.status === 404) {
          await unmarkDeleted(delId)
        }
      } catch {
        /* offline / retry next time */
      }
    }

    // Ask which attempts exist rather than downloading the list. The list
    // endpoint pages at the newest 100 rows, so using it here meant attempts
    // older than that were never seen: they looked missing locally, were
    // re-uploaded on every sync, and a new device could not pull them at all.
    // Missing rows are fetched individually below.
    const res = await fetch('/api/attempts?ids=1', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.status === 401) {
      useAuth.getState().logout()
      return { pushed: 0, pulled: 0 }
    }
    if (!res.ok) return { pushed: 0, pulled: 0 }

    const data = (await res.json()) as { ids?: string[] }
    const cloudIds = new Set(Array.isArray(data.ids) ? data.ids : [])

    const localAttempts = await listAllAttempts()
    const localIds = new Set(localAttempts.map((a) => a.id))

    const activeTombstones = await getDeletedIds()

    let pulled = 0
    let pushed = 0

    const { toPull, toPush } = planSyncReconciliation(cloudIds, localIds, activeTombstones)
    const toPushSet = new Set(toPush)

    // Pull missing attempts from cloud into local IndexedDB (skip tombstoned attempts)
    for (const id of toPull) {
      const attempt = await fetchAttemptFromCloud(id)
      if (attempt) pulled++
    }

    // Push local attempts not yet in cloud (skip tombstoned attempts)
    for (const la of localAttempts) {
      if (toPushSet.has(la.id)) {
        const ok = await syncAttemptToCloud(la)
        if (ok) pushed++
      }
    }

    return { pushed, pulled }
  } catch {
    return { pushed: 0, pulled: 0 }
  }
}
