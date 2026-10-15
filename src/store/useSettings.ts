import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

/**
 * The two themes the site ships with. There is deliberately no `system` option:
 * the palette is hand-tuned per theme, and a surface that silently flips to
 * whichever ground the OS happens to be using is not the same product as one
 * you chose. Light and dark are set explicitly and remembered.
 */
export type Theme = 'light' | 'dark'

export interface AiUsageMetrics {
  totalRequests: number
  promptTokens: number
  completionTokens: number
  totalTokens: number
  whisperRequests: number
  whisperSeconds: number
  lastUsedAt: string | null
  todayDate: string
  requestsToday: number
  serverRemainingRequests?: number
  serverLimitRequests?: number
  serverResetRequests?: string
}

export const DEFAULT_AI_USAGE: AiUsageMetrics = {
  totalRequests: 0,
  promptTokens: 0,
  completionTokens: 0,
  totalTokens: 0,
  whisperRequests: 0,
  whisperSeconds: 0,
  lastUsedAt: null,
  todayDate: new Date().toISOString().slice(0, 10),
  requestsToday: 0,
}

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
  /** Optional user-provided Groq API Key for AI Examiner scoring & Whisper STT. */
  groqApiKey: string
  /** Whether AI scoring is enabled. */
  aiScoringEnabled: boolean
  /** Cumulative LLM & Whisper speech usage metrics. */
  aiUsage: AiUsageMetrics
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
  groqApiKey: '',
  aiScoringEnabled: false,
  aiUsage: DEFAULT_AI_USAGE,
}

interface SettingsStore {
  settings: Settings
  hydrated: boolean
  set: <K extends keyof Settings>(key: K, value: Settings[K]) => void
  recordAiUsage: (metrics: {
    promptTokens?: number
    completionTokens?: number
    totalTokens?: number
    whisperSeconds?: number
    remainingRequests?: number
    limitRequests?: number
    resetRequests?: string
  }) => void
  resetAiUsage: () => void
  reset: () => void
  hydrate: () => void
}


import { safeStateStorage } from '../lib/storage'

const safeJsonStorage = () => createJSONStorage(() => safeStateStorage())

export const useSettings = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: DEFAULTS,
      hydrated: false,
      set: (key, value) => set((s) => ({ settings: { ...s.settings, [key]: value } })),
      recordAiUsage: (metrics) =>
        set((s) => {
          const prev = s.settings.aiUsage ?? DEFAULT_AI_USAGE
          const isLlm = (metrics.totalTokens ?? 0) > 0 || (metrics.promptTokens ?? 0) > 0
          const isWhisper = (metrics.whisperSeconds ?? 0) > 0
          const today = new Date().toISOString().slice(0, 10)
          const isNewDay = prev.todayDate !== today
          const requestsToday = (isNewDay ? 0 : (prev.requestsToday ?? 0)) + (isLlm ? 1 : 0)

          return {
            settings: {
              ...s.settings,
              aiUsage: {
                totalRequests: prev.totalRequests + (isLlm ? 1 : 0),
                promptTokens: prev.promptTokens + (metrics.promptTokens ?? 0),
                completionTokens: prev.completionTokens + (metrics.completionTokens ?? 0),
                totalTokens: prev.totalTokens + (metrics.totalTokens ?? 0),
                whisperRequests: prev.whisperRequests + (isWhisper ? 1 : 0),
                whisperSeconds: Math.round((prev.whisperSeconds + (metrics.whisperSeconds ?? 0)) * 10) / 10,
                lastUsedAt: new Date().toISOString(),
                todayDate: today,
                requestsToday,
                serverRemainingRequests: metrics.remainingRequests ?? prev.serverRemainingRequests,
                serverLimitRequests: metrics.limitRequests ?? prev.serverLimitRequests,
                serverResetRequests: metrics.resetRequests ?? prev.serverResetRequests,
              },
            },
          }
        }),
      resetAiUsage: () =>
        set((s) => ({
          settings: {
            ...s.settings,
            aiUsage: DEFAULT_AI_USAGE,
          },
        })),
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
        const validTheme = theme === 'light' || theme === 'dark' ? theme : DEFAULTS.theme
        return {
          ...state,
          settings: {
            ...DEFAULTS,
            ...state?.settings,
            theme: validTheme,
            aiUsage: { ...DEFAULT_AI_USAGE, ...state?.settings?.aiUsage },
          },
        } as SettingsStore
      },
      onRehydrateStorage: () => (state) => state?.hydrate(),
    },
  ),
)
