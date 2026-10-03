import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  email: string
  targetScore: number
}

interface AuthStore {
  user: User | null
  token: string | null
  hasLoggedInBefore: boolean
  lastEmail: string | null
  loading: boolean
  error: string | null
  login: (email: string, password?: string) => Promise<boolean>
  register: (email: string, password: string, targetScore?: number) => Promise<boolean>
  logout: () => void
  setTargetScore: (score: number) => Promise<void>
  /** Session-authenticated reset for users who forgot the password on a
      signed-in device. Returns true on success, else an error message. */
  changePassword: (newPassword: string) => Promise<true | string>
  checkSession: () => Promise<void>
  clearError: () => void
}

export const useAuth = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
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
          const data = (await res.json()) as { error?: string; token?: string; user?: User }
          if (!res.ok || !data.token || !data.user) {
            set({ loading: false, error: data.error ?? 'Invalid email or password' })
            return false
          }
          set({
            user: data.user,
            token: data.token,
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
          const data = (await res.json()) as { error?: string; token?: string; user?: User }
          if (!res.ok || !data.token || !data.user) {
            set({ loading: false, error: data.error ?? 'Registration failed' })
            return false
          }
          set({
            user: data.user,
            token: data.token,
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
        set({ user: null, token: null, error: null })
      },

      changePassword: async (newPassword: string) => {
        const { token } = get()
        if (!token) return 'You are not signed in.'
        if (newPassword.length < 6) return 'Password must be at least 6 characters long.'
        try {
          const res = await fetch('/api/auth/me', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ newPassword }),
          })
          if (!res.ok) {
            const data = (await res.json().catch(() => null)) as { error?: string } | null
            return data?.error ?? 'Could not change the password.'
          }
          return true
        } catch {
          return 'Could not connect to authentication service.'
        }
      },

      clearError: () => {
        set({ error: null })
      },

      setTargetScore: async (score: number) => {
        const { token, user } = get()
        if (!token || !user) return
        const previous = user.targetScore
        const updated = { ...user, targetScore: score }
        set({ user: updated })
        try {
          const res = await fetch('/api/auth/me', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ targetScore: score }),
          })
          if (!res.ok) set({ user: { ...updated, targetScore: previous } })
        } catch {
          set({ user: { ...updated, targetScore: previous } })
        }
      },

      checkSession: async () => {
        const { token } = get()
        if (!token) return
        try {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (res.ok) {
            const data = (await res.json()) as { user?: User }
            if (data.user) {
              set({
                user: data.user,
                hasLoggedInBefore: true,
                lastEmail: data.user.email,
              })
            }
          } else if (res.status === 401) {
            set({ user: null, token: null })
          }
        } catch {
          /* offline or network error, preserve cached token */
        }
      },
    }),
    {
      name: 'pte-prep-auth',
      partialize: (s) => ({
        user: s.user,
        token: s.token,
        hasLoggedInBefore: Boolean(s.hasLoggedInBefore || s.user || s.token),
        lastEmail: s.lastEmail ?? s.user?.email ?? null,
      }),
      merge: (persistedState, currentState) => {
        const p = (persistedState as Partial<AuthStore>) || {}
        const hasPrev = Boolean(p.hasLoggedInBefore || p.user || p.token)
        return {
          ...currentState,
          ...p,
          hasLoggedInBefore: hasPrev,
          lastEmail: p.lastEmail ?? p.user?.email ?? null,
        }
      },
    },
  ),
)
