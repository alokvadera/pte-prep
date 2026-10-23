import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { safeStateStorage } from '../lib/storage'
import { useSettings } from './useSettings'

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

/**
 * Fallback session lifetime when the API does not return `expiresAt`.
 * Mirrors the server's DEFAULT_SESSION_EXPIRY_SECONDS (7 days): guessing longer
 * than the real token life keeps sending a dead bearer token until a 401,
 * whereas guessing shorter only means an unnecessary re-login.
 */
const SESSION_FALLBACK_MS = 7 * 24 * 60 * 60 * 1000

let targetScoreSeq = 0
/** The last target score known to be on the server. */
let lastConfirmedScore: number | undefined
/** The score on screen before the current batch of updates began. */
let pendingScoreBaseline: number | undefined

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
          const expiresAt = typeof data.expiresAt === 'number' && data.expiresAt > 0 ? data.expiresAt : Date.now() + SESSION_FALLBACK_MS
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
          const expiresAt = typeof data.expiresAt === 'number' && data.expiresAt > 0 ? data.expiresAt : Date.now() + SESSION_FALLBACK_MS
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
        pendingScoreBaseline = undefined
        targetScoreSeq = 0
        const { token } = get()
        // Drop the local session first so a slow or failed request cannot leave
        // the user appearing signed in, then revoke it on the server.
        set({
          user: null,
          token: null,
          expiresAt: null,
          lastEmail: null,
          error: null,
        })
        // Attempts and active tests stay on the device but are scoped to the
        // account or guest owner that created them. Deleting them here lost
        // unsynced work; leaving them unscoped let the next account see it.
        // Only secrets and per-account telemetry are removed on teardown.
        const settings = useSettings.getState()
        settings.set('groqApiKey', '')
        settings.set('aiScoringEnabled', false)
        settings.resetAiUsage()
        if (token && typeof window !== 'undefined') {
          void fetch('/api/auth/logout', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((res) => {
              if (!res.ok) console.warn('[auth] Session revocation returned', res.status)
            })
            .catch((err) => console.warn('[auth] Session revocation failed:', err))
        }
      },

      setSession: (user: User, token: string, expiresAt?: number) => {
        const exp = typeof expiresAt === 'number' && expiresAt > 0 ? expiresAt : Date.now() + SESSION_FALLBACK_MS
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
              expiresAt: data.expiresAt ?? s.expiresAt ?? Date.now() + SESSION_FALLBACK_MS,
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
        const seq = ++targetScoreSeq
        // The value to restore if the newest request fails. A score the server
        // has already confirmed wins; otherwise it is the score that was on
        // screen before this batch of updates began. Without this, two
        // overlapping updates could roll the display back to a value the
        // server had already moved past.
        if (pendingScoreBaseline === undefined) {
          pendingScoreBaseline = lastConfirmedScore ?? user.targetScore
        }
        const rollbackScore = lastConfirmedScore ?? pendingScoreBaseline
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
            // The server accepted this value, so it is the one a later
            // failure should fall back to.
            lastConfirmedScore = score
            pendingScoreBaseline = undefined
          } else if (seq === targetScoreSeq) {
            const current = get().user
            if (current) set({ user: { ...current, targetScore: rollbackScore } })
            lastConfirmedScore = rollbackScore
            pendingScoreBaseline = undefined
          }
        } catch {
          if (seq === targetScoreSeq) {
            const current = get().user
            if (current) set({ user: { ...current, targetScore: rollbackScore } })
            lastConfirmedScore = rollbackScore
            pendingScoreBaseline = undefined
          }
        }
      },

      checkSession: async () => {
        const { token, expiresAt } = get()
        if (!token) return
        // If the stored token is expired or about to expire (<5 min), drop it
        // locally instead of reaching the edge with a dead bearer token.
        if (expiresAt !== null && Date.now() >= expiresAt - 5 * 60 * 1000) {
          get().logout()
          return
        }
        try {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (get().token !== token) return
          if (res.ok) {
            const data = (await res.json()) as { user?: User; expiresAt?: number }
            if (get().token !== token) return
            if (data.user) {
              const freshExpiresAt =
                typeof data.expiresAt === 'number' && data.expiresAt > 0 ? data.expiresAt : Date.now() + SESSION_FALLBACK_MS
              set({
                user: data.user,
                hasLoggedInBefore: true,
                lastEmail: data.user.email,
                expiresAt: freshExpiresAt,
              })
            }
          } else if (res.status === 401) {
            if (get().token !== token) return
            get().logout()
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
      storage: createJSONStorage(() => safeStateStorage()),
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
