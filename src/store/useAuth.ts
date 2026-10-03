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
  loading: boolean
  error: string | null
  login: (email: string, password?: string) => Promise<boolean>
  register: (email: string, password: string, targetScore?: number) => Promise<boolean>
  logout: () => void
  setTargetScore: (score: number) => Promise<void>
  checkSession: () => Promise<void>
  clearError: () => void
}

export const useAuth = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
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
          set({ user: data.user, token: data.token, loading: false, error: null })
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
          set({ user: data.user, token: data.token, loading: false, error: null })
          return true
        } catch {
          set({ loading: false, error: 'Could not connect to authentication service' })
          return false
        }
      },

      logout: () => {
        set({ user: null, token: null, error: null })
      },

      clearError: () => {
        set({ error: null })
      },

      setTargetScore: async (score: number) => {
        const { token, user } = get()
        if (!token || !user) return
        const updated = { ...user, targetScore: score }
        set({ user: updated })
        try {
          await fetch('/api/auth/me', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ targetScore: score }),
          })
        } catch {
          /* ignore network error, keep optimistic state */
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
            if (data.user) set({ user: data.user })
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
      partialize: (s) => ({ user: s.user, token: s.token }),
    },
  ),
)
