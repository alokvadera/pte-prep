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
      } catch {
        /* quota exceeded or private browsing mode */
      }
    },
    removeItem: (name: string): void => {
      memory.delete(name)
      if (!hasLs()) return
      try {
        window.localStorage.removeItem(name)
      } catch {
        /* ignore */
      }
    },
  }
}
