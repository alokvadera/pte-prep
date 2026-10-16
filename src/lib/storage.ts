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
      if (!hasLs()) return memory.get(name) ?? null
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
      } catch (err) {
        /* quota exceeded or private browsing mode */
        console.warn('[storage] localStorage setItem failed:', err)
      }
    },
    removeItem: (name: string): void => {
      memory.delete(name)
      if (!hasLs()) return
      try {
        window.localStorage.removeItem(name)
      } catch (err) {
        /* ignore */
        console.warn('[storage] localStorage removeItem failed:', err)
      }
    },
  }
}

export function throttledStateStorage(delayMs = 1000): SafeStorage {
  const base = safeStateStorage()
  const pending = new Map<string, { value: string; timer: ReturnType<typeof setTimeout> }>()

  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      for (const [name, p] of pending) {
        clearTimeout(p.timer)
        base.setItem(name, p.value)
      }
      pending.clear()
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
