import { clearAttempts, deleteAttempt, listAllAttempts, listAttempts, readKv, saveAttempt, writeKv } from '../db/db'
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

  const ids = new Set((await listAllAttempts()).map((a) => a.id))

  if (token) {
    try {
      const res = await fetch('/api/attempts', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = (await res.json()) as { attempts?: AttemptRecord[] }
        for (const a of data.attempts ?? []) ids.add(a.id)
      }
    } catch {
      /* offline: the local tombstones still replay on the next sync */
    }
  }

  for (const id of ids) {
    await deleteAttemptEverywhere(id)
  }
  await clearAttempts()
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

    const res = await fetch('/api/attempts', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.status === 401) {
      useAuth.getState().logout()
      return { pushed: 0, pulled: 0 }
    }
    if (!res.ok) return { pushed: 0, pulled: 0 }

    const data = (await res.json()) as { attempts?: AttemptRecord[] }
    const cloudAttempts = data.attempts ?? []
    const cloudIds = new Set(cloudAttempts.map((a) => a.id))

    const localAttempts = await listAttempts(100)
    const localIds = new Set(localAttempts.map((a) => a.id))

    const activeTombstones = await getDeletedIds()

    let pulled = 0
    let pushed = 0

    // Pull missing attempts from cloud into local IndexedDB (skip tombstoned attempts)
    for (const ca of cloudAttempts) {
      if (!localIds.has(ca.id) && !activeTombstones.has(ca.id)) {
        await saveAttempt(ca)
        pulled++
      }
    }

    // Push local attempts not yet in cloud (skip tombstoned attempts)
    for (const la of localAttempts) {
      if (!cloudIds.has(la.id) && !activeTombstones.has(la.id)) {
        const ok = await syncAttemptToCloud(la)
        if (ok) pushed++
      }
    }

    return { pushed, pulled }
  } catch {
    return { pushed: 0, pulled: 0 }
  }
}
