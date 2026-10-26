import { beforeEach, describe, expect, it } from 'vitest'
import { createDefaultAiUsage, DEFAULT_AI_USAGE, useSettings } from '../../../src/store/useSettings'
import type { AiUsageMetrics, Settings } from '../../../src/store/useSettings'

/* ---------------------------------------------------------------------------
   The preferences store.

   Two things live here. The first is the small set of preferences the user
   picks — theme, motion, text size — which have to survive a reload. The
   second is the AI usage ledger, which has to keep counting correctly across
   days, because it is what the rate-limit warning is computed from.
   --------------------------------------------------------------------------- */

const EXPECTED_DEFAULTS: Omit<Settings, 'aiUsage'> = {
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
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Replaces the usage ledger with a known one. */
function setAiUsage(usage: Partial<AiUsageMetrics>): void {
  const { settings } = useSettings.getState()
  useSettings.setState({
    settings: { ...settings, aiUsage: { ...createDefaultAiUsage(), ...usage } },
  })
}

describe('useSettings', () => {
  beforeEach(() => {
    localStorage.clear()
    useSettings.getState().reset()
    useSettings.setState({ hydrated: false })
  })

  describe('defaults', () => {
    it('starts from the documented defaults', () => {
      const { settings } = useSettings.getState()
      expect(settings).toEqual({ ...EXPECTED_DEFAULTS, aiUsage: DEFAULT_AI_USAGE })
    })

    it('describes a usage ledger that has counted nothing yet', () => {
      expect(DEFAULT_AI_USAGE).toEqual({
        totalRequests: 0,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        whisperRequests: 0,
        whisperSeconds: 0,
        lastUsedAt: null,
        todayDate: today(),
        requestsToday: 0,
      })
    })

    it('builds a fresh usage ledger on every call', () => {
      const usage = createDefaultAiUsage()
      expect(usage).not.toBe(DEFAULT_AI_USAGE)
      expect(usage).toEqual(DEFAULT_AI_USAGE)
      expect(usage.todayDate).toBe(today())
    })
  })

  describe('set', () => {
    it('updates a single setting and leaves the others alone', () => {
      useSettings.getState().set('theme', 'dark')

      const { settings } = useSettings.getState()
      expect(settings.theme).toBe('dark')
      expect(settings.textScale).toBe(1)
      expect(settings.showWordCount).toBe(true)
    })

    it('accepts every kind of preference', () => {
      useSettings.getState().set('textScale', 1.25)
      useSettings.getState().set('reducedMotion', true)
      useSettings.getState().set('speakPrompts', true)
      useSettings.getState().set('countdownBeeps', false)
      useSettings.getState().set('showWordCount', false)
      useSettings.getState().set('defaultMode', 'section')
      useSettings.getState().set('autoOpenReview', false)
      useSettings.getState().set('groqApiKey', 'gsk_secret')
      useSettings.getState().set('aiScoringEnabled', true)

      const { settings } = useSettings.getState()
      expect(settings.textScale).toBe(1.25)
      expect(settings.reducedMotion).toBe(true)
      expect(settings.speakPrompts).toBe(true)
      expect(settings.countdownBeeps).toBe(false)
      expect(settings.showWordCount).toBe(false)
      expect(settings.defaultMode).toBe('section')
      expect(settings.autoOpenReview).toBe(false)
      expect(settings.groqApiKey).toBe('gsk_secret')
      expect(settings.aiScoringEnabled).toBe(true)
    })
  })

  describe('reset', () => {
    it('restores every default', () => {
      useSettings.getState().set('theme', 'dark')
      useSettings.getState().set('textScale', 2)
      useSettings.getState().set('groqApiKey', 'gsk_secret')
      useSettings.getState().recordAiUsage({ promptTokens: 10, totalTokens: 10 })

      useSettings.getState().reset()

      expect(useSettings.getState().settings).toEqual({
        ...EXPECTED_DEFAULTS,
        aiUsage: DEFAULT_AI_USAGE,
      })
    })
  })

  describe('hydrate', () => {
    it('marks the store as hydrated', () => {
      expect(useSettings.getState().hydrated).toBe(false)

      useSettings.getState().hydrate()

      expect(useSettings.getState().hydrated).toBe(true)
    })
  })

  describe('recordAiUsage', () => {
    it('counts an LLM request and accumulates its tokens', () => {
      useSettings.getState().recordAiUsage({
        promptTokens: 10,
        completionTokens: 5,
        totalTokens: 15,
      })

      const { aiUsage } = useSettings.getState().settings
      expect(aiUsage.totalRequests).toBe(1)
      expect(aiUsage.promptTokens).toBe(10)
      expect(aiUsage.completionTokens).toBe(5)
      expect(aiUsage.totalTokens).toBe(15)
      expect(aiUsage.requestsToday).toBe(1)
      expect(aiUsage.todayDate).toBe(today())
      expect(aiUsage.lastUsedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)
    })

    it('counts a call that only reports prompt tokens', () => {
      useSettings.getState().recordAiUsage({ promptTokens: 3 })

      const { aiUsage } = useSettings.getState().settings
      expect(aiUsage.totalRequests).toBe(1)
      expect(aiUsage.requestsToday).toBe(1)
    })

    it('does not count a call that reports no tokens at all', () => {
      useSettings.getState().recordAiUsage({})

      const { aiUsage } = useSettings.getState().settings
      expect(aiUsage.totalRequests).toBe(0)
      expect(aiUsage.requestsToday).toBe(0)
      expect(aiUsage.lastUsedAt).not.toBeNull()
    })

    it('counts a whisper call separately from an LLM call', () => {
      useSettings.getState().recordAiUsage({ whisperSeconds: 2.4 })

      const { aiUsage } = useSettings.getState().settings
      expect(aiUsage.whisperRequests).toBe(1)
      expect(aiUsage.whisperSeconds).toBe(2.4)
      expect(aiUsage.totalRequests).toBe(0)
      expect(aiUsage.requestsToday).toBe(0)
    })

    it('accumulates across calls', () => {
      useSettings
        .getState()
        .recordAiUsage({ promptTokens: 10, completionTokens: 4, totalTokens: 14 })
      useSettings.getState().recordAiUsage({ promptTokens: 5, completionTokens: 1, totalTokens: 6 })
      useSettings.getState().recordAiUsage({ whisperSeconds: 1.5 })

      const { aiUsage } = useSettings.getState().settings
      expect(aiUsage.totalRequests).toBe(2)
      expect(aiUsage.promptTokens).toBe(15)
      expect(aiUsage.completionTokens).toBe(5)
      expect(aiUsage.totalTokens).toBe(20)
      expect(aiUsage.whisperRequests).toBe(1)
      expect(aiUsage.whisperSeconds).toBe(1.5)
      expect(aiUsage.requestsToday).toBe(2)
    })

    it('rounds the whisper seconds to a tenth of a second', () => {
      useSettings.getState().recordAiUsage({ whisperSeconds: 2.44 })
      expect(useSettings.getState().settings.aiUsage.whisperSeconds).toBe(2.4)

      useSettings.getState().recordAiUsage({ whisperSeconds: 2.44 })
      expect(useSettings.getState().settings.aiUsage.whisperSeconds).toBe(4.8)
    })

    it('restarts the daily counter on a new day', () => {
      setAiUsage({ todayDate: '2000-01-01', requestsToday: 5, totalRequests: 3 })

      useSettings.getState().recordAiUsage({ totalTokens: 10 })

      const { aiUsage } = useSettings.getState().settings
      expect(aiUsage.requestsToday).toBe(1)
      expect(aiUsage.totalRequests).toBe(4)
      expect(aiUsage.todayDate).toBe(today())
    })

    it('keeps counting on the same day', () => {
      setAiUsage({ todayDate: today(), requestsToday: 5, totalRequests: 3 })

      useSettings.getState().recordAiUsage({ totalTokens: 10 })

      const { aiUsage } = useSettings.getState().settings
      expect(aiUsage.requestsToday).toBe(6)
      expect(aiUsage.totalRequests).toBe(4)
    })

    it('treats a missing usage ledger as an empty one', () => {
      const { settings } = useSettings.getState()
      useSettings.setState({
        settings: { ...settings, aiUsage: undefined as unknown as AiUsageMetrics },
      })

      useSettings.getState().recordAiUsage({ totalTokens: 4 })

      const { aiUsage } = useSettings.getState().settings
      expect(aiUsage.totalRequests).toBe(1)
      expect(aiUsage.totalTokens).toBe(4)
    })

    it('treats a missing daily counter as zero', () => {
      const { settings } = useSettings.getState()
      useSettings.setState({
        settings: {
          ...settings,
          aiUsage: {
            totalRequests: 0,
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
            whisperRequests: 0,
            whisperSeconds: 0,
            lastUsedAt: null,
            todayDate: today(),
          } as AiUsageMetrics,
        },
      })

      useSettings.getState().recordAiUsage({ totalTokens: 4 })

      expect(useSettings.getState().settings.aiUsage.requestsToday).toBe(1)
    })

    it('stores the rate-limit counters the server reports', () => {
      useSettings.getState().recordAiUsage({
        totalTokens: 10,
        remainingRequests: 7,
        limitRequests: 20,
        resetRequests: '2026-01-01T00:00:00.000Z',
      })

      const { aiUsage } = useSettings.getState().settings
      expect(aiUsage.serverRemainingRequests).toBe(7)
      expect(aiUsage.serverLimitRequests).toBe(20)
      expect(aiUsage.serverResetRequests).toBe('2026-01-01T00:00:00.000Z')
    })

    it('keeps the previous rate-limit counters when the response omits them', () => {
      useSettings.getState().recordAiUsage({
        totalTokens: 10,
        remainingRequests: 7,
        limitRequests: 20,
        resetRequests: '2026-01-01T00:00:00.000Z',
      })

      useSettings.getState().recordAiUsage({ totalTokens: 10 })

      const { aiUsage } = useSettings.getState().settings
      expect(aiUsage.serverRemainingRequests).toBe(7)
      expect(aiUsage.serverLimitRequests).toBe(20)
      expect(aiUsage.serverResetRequests).toBe('2026-01-01T00:00:00.000Z')
    })
  })

  describe('resetAiUsage', () => {
    it('zeroes the usage ledger', () => {
      useSettings
        .getState()
        .recordAiUsage({ promptTokens: 10, completionTokens: 5, totalTokens: 15 })
      useSettings.getState().recordAiUsage({ whisperSeconds: 3.2 })

      useSettings.getState().resetAiUsage()

      expect(useSettings.getState().settings.aiUsage).toEqual(createDefaultAiUsage())
    })

    it('leaves the other settings alone', () => {
      useSettings.getState().set('theme', 'dark')
      useSettings.getState().recordAiUsage({ totalTokens: 15 })

      useSettings.getState().resetAiUsage()

      const { settings } = useSettings.getState()
      expect(settings.theme).toBe('dark')
      expect(settings.aiUsage.totalRequests).toBe(0)
    })
  })

  describe('persistence', () => {
    it('writes the theme to localStorage', () => {
      useSettings.getState().set('theme', 'dark')

      const raw = localStorage.getItem('pte-prep-settings')
      expect(raw).not.toBeNull()
      const parsed = JSON.parse(raw ?? '{}') as {
        state: { settings: { theme: string } }
        version: number
      }
      expect(parsed.version).toBe(2)
      expect(parsed.state.settings.theme).toBe('dark')
    })

    it('hydrates a stored record', async () => {
      localStorage.setItem(
        'pte-prep-settings',
        JSON.stringify({
          state: { settings: { theme: 'dark', textScale: 1.25 }, hydrated: true },
          version: 2,
        }),
      )

      await useSettings.persist.rehydrate()

      expect(useSettings.getState().settings.theme).toBe('dark')
      expect(useSettings.getState().settings.textScale).toBe(1.25)
      expect(useSettings.getState().hydrated).toBe(true)
    })

    it('moves a v1 record with an unknown theme back to the default', async () => {
      localStorage.setItem(
        'pte-prep-settings',
        JSON.stringify({ state: { settings: { theme: 'system' } }, version: 1 }),
      )

      await useSettings.persist.rehydrate()

      expect(useSettings.getState().settings.theme).toBe('light')
    })

    it('keeps a valid dark theme from v1', async () => {
      localStorage.setItem(
        'pte-prep-settings',
        JSON.stringify({ state: { settings: { theme: 'dark' } }, version: 1 }),
      )

      await useSettings.persist.rehydrate()

      expect(useSettings.getState().settings.theme).toBe('dark')
    })

    it('keeps a valid light theme from v1', async () => {
      localStorage.setItem(
        'pte-prep-settings',
        JSON.stringify({ state: { settings: { theme: 'light' } }, version: 1 }),
      )

      await useSettings.persist.rehydrate()

      expect(useSettings.getState().settings.theme).toBe('light')
    })

    it('fills in the settings a v1 record did not have', async () => {
      localStorage.setItem(
        'pte-prep-settings',
        JSON.stringify({ state: { settings: { theme: 'dark' } }, version: 1 }),
      )

      await useSettings.persist.rehydrate()

      const { settings } = useSettings.getState()
      expect(settings.textScale).toBe(1)
      expect(settings.showWordCount).toBe(true)
      expect(settings.defaultMode).toBe('full')
    })

    it('merges a partial usage ledger with the defaults', async () => {
      localStorage.setItem(
        'pte-prep-settings',
        JSON.stringify({
          state: { settings: { theme: 'light', aiUsage: { totalRequests: 3 } } },
          version: 1,
        }),
      )

      await useSettings.persist.rehydrate()

      const { aiUsage } = useSettings.getState().settings
      expect(aiUsage.totalRequests).toBe(3)
      expect(aiUsage.promptTokens).toBe(0)
      expect(aiUsage.requestsToday).toBe(0)
    })

    it('ignores a v1 record that has no settings at all', async () => {
      localStorage.setItem('pte-prep-settings', JSON.stringify({ state: {}, version: 1 }))

      await useSettings.persist.rehydrate()

      const { settings } = useSettings.getState()
      expect(settings.theme).toBe('light')
      expect(settings.textScale).toBe(1)
    })

    it('ignores a v1 record that has no state at all', async () => {
      localStorage.setItem('pte-prep-settings', JSON.stringify({ version: 1 }))

      await useSettings.persist.rehydrate()

      const { settings } = useSettings.getState()
      expect(settings.theme).toBe('light')
      expect(settings.textScale).toBe(1)
    })

    it('survives a corrupt persisted record', async () => {
      useSettings.getState().set('theme', 'dark')
      localStorage.setItem('pte-prep-settings', 'not json at all')

      await useSettings.persist.rehydrate()

      expect(useSettings.getState().settings.theme).toBe('dark')
    })
  })
})
