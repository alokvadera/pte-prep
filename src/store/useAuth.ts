import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export interface User {
  id: string
  email: string
  targetScore: number
}

interface AuthStore {
  user: User | null
  token: string | null
  expiresAt: number | null
  hasLoggedInBefore: boolean
  lastEmail: string | null
  loading: boolean
  error: string | null
  login: (email: string, password?: string) => Promise<boolean>
  register: (email: string, password: string, targetScore?: number) => Promise<boolean>
  logout: () => void
  setTargetScore: (score: number) => Promise<void>
  setSession: (user: User, token: string, expiresAt?: number) => void
  /** Session-authenticated password change. Requires current password to prevent
      takeover via stolen tokens. Returns true on success, else an error message. */
  changePassword: (currentPassword: string, newPassword: string) => Promise<true | string>
  checkSession: () => Promise<void>
  clearError: () => void
}

type PersistedAuth = Pick<AuthStore, 'user' | 'token' | 'expiresAt' | 'hasLoggedInBefore' | 'lastEmail'>

interface AuthStorage {
  getItem: (name: string) => string | null
  setItem: (name: string, value: string) => void
  removeItem: (name: string) => void
}

function createAuthStorage(): AuthStorage {
  return {
    getItem: (name: string): string | null => {
      try {
        return window.localStorage.getItem(name)
      } catch {
        return null
      }
    },
    setItem: (name: string, value: string): void => {
      try {
        window.localStorage.setItem(name, value)
      } catch {
        /* quota exceeded or private mode */
      }
    },
    removeItem: (name: string): void => {
      try {
        window.localStorage.removeItem(name)
      } catch {
        /* ignore */
      }
    },
  }
}

let targetScoreSeq = 0
let lastConfirmedScore: number | undefined

export const useAuth = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      expiresAt: null,
      hasLoggedInBefore: false,
      lastEmail: null,
      loading: false,
      error: null,

      login: async (email: string, password?: string) => {
        set({ loading: true, error: null })
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          })
          const data = (await res.json()) as {
            error?: string
            token?: string
            expiresAt?: number
            user?: User
          }
          if (!res.ok || !data.token || !data.user) {
            set({ loading: false, error: data.error ?? 'Invalid email or password' })
            return false
          }
          const expiresAt = typeof data.expiresAt === 'number' && data.expiresAt > 0 ? data.expiresAt : Date.now() + 30 * 24 * 60 * 60 * 1000
          set({
            user: data.user,
            token: data.token,
            expiresAt,
            hasLoggedInBefore: true,
            lastEmail: data.user.email,
            loading: false,
            error: null,
          })
          return true
        } catch {
          set({ loading: false, error: 'Could not connect to authentication service' })
          return false
        }
      },

      register: async (email: string, password: string, targetScore = 65) => {
        set({ loading: true, error: null })
        try {
          const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, targetScore }),
          })
          const data = (await res.json()) as {
            error?: string
            token?: string
            expiresAt?: number
            user?: User
          }
          if (!res.ok || !data.token || !data.user) {
            set({ loading: false, error: data.error ?? 'Registration failed' })
            return false
          }
          const expiresAt = typeof data.expiresAt === 'number' && data.expiresAt > 0 ? data.expiresAt : Date.now() + 30 * 24 * 60 * 60 * 1000
          set({
            user: data.user,
            token: data.token,
            expiresAt,
            hasLoggedInBefore: true,
            lastEmail: data.user.email,
            loading: false,
            error: null,
          })
          return true
        } catch {
          set({ loading: false, error: 'Could not connect to authentication service' })
          return false
        }
      },

      logout: () => {
        lastConfirmedScore = undefined
        targetScoreSeq = 0
        set({
          user: null,
          token: null,
          expiresAt: null,
          error: null,
        })
      },

      setSession: (user: User, token: string, expiresAt?: number) => {
        const exp = typeof expiresAt === 'number' && expiresAt > 0 ? expiresAt : Date.now() + 30 * 24 * 60 * 60 * 1000
        set({
          user,
          token,
          expiresAt: exp,
          hasLoggedInBefore: true,
          lastEmail: user.email,
          loading: false,
          error: null,
        })
      },

      changePassword: async (currentPassword: string, newPassword: string) => {
        const { token } = get()
        if (!token) return 'You are not signed in.'
        if (!currentPassword) return 'Current password is required.'
        if (newPassword.length < 8) return 'Password must be at least 8 characters.'
        try {
          const res = await fetch('/api/auth/me', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ currentPassword, newPassword }),
          })
          const data = (await res.json().catch(() => null)) as {
            ok?: boolean
            error?: string
            token?: string
            expiresAt?: number
          } | null
          if (!res.ok || !data?.ok) {
            return data?.error ?? 'Could not change the password.'
          }
          if (data.token) {
            set((s) => ({
              token: data.token!,
              expiresAt: data.expiresAt ?? (s.expiresAt ? s.expiresAt : Date.now() + 30 * 24 * 60 * 60 * 1000),
            }))
          }
          return true
        } catch {
          return 'Could not connect to authentication service.'
        }
      },

      setTargetScore: async (score: number) => {
        const { token, user } = get()
        if (!token || !user) return
        if (lastConfirmedScore === undefined) {
          lastConfirmedScore = user.targetScore
        }
        const rollbackScore = lastConfirmedScore
        const seq = ++targetScoreSeq
        set({ user: { ...user, targetScore: score } })
        try {
          const res = await fetch('/api/auth/me', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ targetScore: score }),
          })
          if (res.ok) {
            if (seq === targetScoreSeq) {
              lastConfirmedScore = undefined
            }
          } else if (seq === targetScoreSeq) {
            lastConfirmedScore = undefined
            const current = get().user
            if (current) set({ user: { ...current, targetScore: rollbackScore } })
          }
        } catch {
          if (seq === targetScoreSeq) {
            lastConfirmedScore = undefined
            const current = get().user
            if (current) set({ user: { ...current, targetScore: rollbackScore } })
          }
        }
      },

      checkSession: async () => {
        const { token, expiresAt } = get()
        if (!token) return
        // If the stored token is expired or about to expire (<5 min), drop it
        // locally instead of reaching the edge with a dead bearer token.
        if (expiresAt !== null && Date.now() >= expiresAt - 5 * 60 * 1000) {
          set({ user: null, token: null, expiresAt: null })
          return
        }
        try {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (res.ok) {
            const data = (await res.json()) as { user?: User; expiresAt?: number }
            if (data.user) {
              const freshExpiresAt =
                typeof data.expiresAt === 'number' && data.expiresAt > 0 ? data.expiresAt : Date.now() + 30 * 24 * 60 * 60 * 1000
              set({
                user: data.user,
                hasLoggedInBefore: true,
                lastEmail: data.user.email,
                expiresAt: freshExpiresAt,
              })
            }
          } else if (res.status === 401) {
            set({ user: null, token: null, expiresAt: null })
          }
        } catch {
          /* offline or network error, preserve cached token */
        }
      },

      clearError: () => {
        set({ error: null })
      },
    }),
    {
      name: 'pte-prep-auth',
      partialize: (s): PersistedAuth => ({
        user: s.user,
        token: s.token,
        expiresAt: s.expiresAt,
        hasLoggedInBefore: Boolean(s.hasLoggedInBefore || s.user || s.token),
        lastEmail: s.lastEmail ?? s.user?.email ?? null,
      }),
      storage: createJSONStorage(() => createAuthStorage()),
      merge: (persistedState, currentState) => {
        const p = persistedState as Partial<PersistedAuth> | null | undefined
        const hasPrev = Boolean(p?.hasLoggedInBefore || p?.user || p?.token || p?.expiresAt)
        return {
          ...currentState,
          ...p,
          hasLoggedInBefore: hasPrev,
          lastEmail: p?.lastEmail ?? p?.user?.email ?? null,
          expiresAt: typeof p?.expiresAt === 'number' ? p.expiresAt : currentState.expiresAt,
        }
      },
    },
  ),
)
