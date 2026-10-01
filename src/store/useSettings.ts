import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

/**
 * The two themes the site ships with. There is deliberately no `system` option:
 * the palette is hand-tuned per theme, and a surface that silently flips to
 * whichever ground the OS happens to be using is not the same product as one
 * you chose. Light and dark are set explicitly and remembered.
 */
export type Theme = 'light' | 'dark'

export interface Settings {
  theme: Theme
  /** Reduce animation and hide decorative motion. */
  reducedMotion: boolean
  /** Show the word counter while writing. */
  showWordCount: boolean
  /** Speak each question prompt aloud automatically. */
  speakPrompts: boolean
  /** Play a beep during countdowns. */
  countdownBeeps: boolean
  /** Font scale multiplier. */
  textScale: number
  /** Default mock length. */
  defaultMode: 'full' | 'section' | 'drill'
  /** How the results page is opened. */
  autoOpenReview: boolean
}

const DEFAULTS: Settings = {
  theme: 'light',
  reducedMotion: false,
  showWordCount: true,
  speakPrompts: false,
  countdownBeeps: true,
  textScale: 1,
  defaultMode: 'full',
  autoOpenReview: true,
}

interface SettingsStore {
  settings: Settings
  hydrated: boolean
  set: <K extends keyof Settings>(key: K, value: Settings[K]) => void
  reset: () => void
  hydrate: () => void
}


/**
 * Persistence storage that is inert outside the browser.
 *
 * `zustand/middleware` touches `localStorage` when the store is created, which
 * would throw during prerendering. This keeps the store module importable on the
 * server while preserving exactly the same behaviour in the browser.
 */
function safeStateStorage() {
  const memory = new Map<string, string>()
  const hasLs = () => typeof window !== 'undefined' && (() => {
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
        /* quota exceeded or private mode */
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

const safeJsonStorage = () => createJSONStorage(() => safeStateStorage())

export const useSettings = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: DEFAULTS,
      hydrated: false,
      set: (key, value) => set((s) => ({ settings: { ...s.settings, [key]: value } })),
      reset: () => set({ settings: DEFAULTS }),
      hydrate: () => set({ hydrated: true }),
    }),
    {
      name: 'pte-prep-settings',
      version: 2,
      storage: safeJsonStorage(),
      /**
       * v1 stored a `system` theme that followed the OS preference. That option
       * no longer exists, so anyone who had it set is moved to the default
       * rather than being left with a value the app cannot render — an
       * unrecognised theme reads as "not dark" and silently paints the light
       * ground.
       *
       * This coerces by value rather than by version number on purpose: it does
       * not care what shape the stored record had in which release, only that
       * the theme it finds is one this build can actually draw.
       */
      migrate: (persisted) => {
        const state = persisted as Partial<SettingsStore> | undefined
        const theme = state?.settings?.theme
        if (theme === undefined || theme === 'light' || theme === 'dark') return persisted as SettingsStore
        return {
          ...state,
          settings: { ...DEFAULTS, ...state?.settings, theme: DEFAULTS.theme },
        } as SettingsStore
      },
      onRehydrateStorage: () => (state) => state?.hydrate(),
    },
  ),
)
