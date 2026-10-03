import { deleteAttempt, listAttempts, saveAttempt } from '../db/db'
import type { AttemptRecord } from '../domain/types'
import { useAuth } from '../store/useAuth'

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

export async function deleteAttemptEverywhere(id: string): Promise<void> {
  await deleteAttempt(id)
  const token = useAuth.getState().token
  if (!token) return

  try {
    const res = await fetch(`/api/attempts/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.status === 401) {
      useAuth.getState().logout()
    }
  } catch {
    /* offline */
  }
}

export async function syncCloudToLocal(): Promise<{ pushed: number; pulled: number }> {
  const token = useAuth.getState().token
  if (!token) return { pushed: 0, pulled: 0 }

  try {
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

    let pulled = 0
    let pushed = 0

    // Pull missing attempts from cloud into local IndexedDB
    for (const ca of cloudAttempts) {
      if (!localIds.has(ca.id)) {
        await saveAttempt(ca)
        pulled++
      }
    }

    // Push local attempts not yet in cloud
    for (const la of localAttempts) {
      if (!cloudIds.has(la.id)) {
        const ok = await syncAttemptToCloud(la)
        if (ok) pushed++
      }
    }

    return { pushed, pulled }
  } catch {
    return { pushed: 0, pulled: 0 }
  }
}
