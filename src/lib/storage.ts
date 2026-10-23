/**
 * SSR-safe, in-memory resilient StateStorage implementation for Zustand and local stores.
 *
 * `localStorage` touches the DOM when a store is instantiated, which throws
 * during prerendering / SSR. This memory-backed wrapper keeps stores importable
 * on the server while operating normally in browser environments (including private mode).
 */
export interface SafeStorage {
  getItem: (name: string) => string | null
  setItem: (name: string, value: string) => void
  removeItem: (name: string) => void
}

export function safeStateStorage(): SafeStorage {
  const memory = new Map<string, string>()
  // Keys whose localStorage write failed (quota exhausted, private mode). For
  // those the in-memory copy is the current value, so reads have to prefer it:
  // reading localStorage back would return the value from before the failure.
  const unsynced = new Set<string>()
  const hasLs = (): boolean =>
    typeof window !== 'undefined' &&
    (() => {
      try {
        return window.localStorage !== null
      } catch {
        return false
      }
    })()

  return {
    getItem: (name: string): string | null => {
      if (unsynced.has(name) || !hasLs()) return memory.get(name) ?? null
      try {
        return window.localStorage.getItem(name)
      } catch {
        return memory.get(name) ?? null
      }
    },
    setItem: (name: string, value: string): void => {
      memory.set(name, value)
      if (!hasLs()) return
      try {
        window.localStorage.setItem(name, value)
        unsynced.delete(name)
      } catch (err) {
        /* quota exceeded or private browsing mode */
        unsynced.add(name)
        console.warn('[storage] localStorage setItem failed:', err)
      }
    },
    removeItem: (name: string): void => {
      memory.delete(name)
      if (!hasLs()) return
      try {
        window.localStorage.removeItem(name)
        unsynced.delete(name)
      } catch (err) {
        /* ignore */
        unsynced.add(name)
        console.warn('[storage] localStorage removeItem failed:', err)
      }
    },
  }
}

export function throttledStateStorage(delayMs = 1000): SafeStorage {
  const base = safeStateStorage()
  const pending = new Map<string, { value: string; timer: ReturnType<typeof setTimeout> }>()

  // Throttling exists to avoid hammering localStorage. Off the browser there
  // is no localStorage to throttle, and a pending timer would keep a Node
  // process alive, so writes go straight through instead.
  const canThrottle = typeof window !== 'undefined'

  function flushPending(): void {
    for (const [name, p] of pending) {
      clearTimeout(p.timer)
      base.setItem(name, p.value)
    }
    pending.clear()
  }

  if (canThrottle) {
    // `beforeunload` alone is not enough: mobile Safari does not fire it when a
    // tab is closed or swiped away, so the newest throttled state could be
    // dropped. The page-lifecycle events below are the ones browsers guarantee.
    window.addEventListener('beforeunload', flushPending)
    window.addEventListener('pagehide', flushPending)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flushPending()
    })
  }

  return {
    getItem: (name: string): string | null => {
      const p = pending.get(name)
      if (p) return p.value
      return base.getItem(name)
    },
    setItem: (name: string, value: string): void => {
      const existing = pending.get(name)
      if (existing) clearTimeout(existing.timer)
      if (!canThrottle) {
        base.setItem(name, value)
        return
      }
      const timer = setTimeout(() => {
        pending.delete(name)
        base.setItem(name, value)
      }, delayMs)
      pending.set(name, { value, timer })
    },
    removeItem: (name: string): void => {
      const existing = pending.get(name)
      if (existing) {
        clearTimeout(existing.timer)
        pending.delete(name)
      }
      base.removeItem(name)
    },
  }
}
