import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { saveAttempt } from '../db/db'
import { QUESTION_META } from '../domain/blueprint'
import { buildReport } from '../domain/scoring'
import type {
  AttemptRecord,
  ItemResponse,
  MockMode,
  MockTest,
  QuestionType,
  SectionId,
  Skill,
} from '../domain/types'
import { throttledStateStorage } from '../lib/storage'
import { getGuestOwnerId } from '../lib/guestOwner'
import { useAuth } from './useAuth'

export type RunnerStatus = 'briefing' | 'running' | 'break' | 'finished'

interface TestStore {
  mock: MockTest | null
  mode: MockMode
  status: RunnerStatus
  sectionIndex: number
  /** Index into the current section's itemIds. */
  itemIndex: number
  responses: Record<string, ItemResponse>
  /** Wall-clock ms when the current section's clock runs out. */
  sectionEndsAt: number | null
  startedAt: string | null
  elapsedMs: number
  attemptId: string | null
  /** Account id, or device-scoped guest id, that started this test. */
  ownerId: string | null
  /** Bumped to ask the runner to advance; used for auto-advance on time-out. */
  timeExpired: boolean
  /** True when the last attempt could not be written to this device. */
  saveFailed: boolean

  start: (mock: MockTest, mode: MockMode) => void
  restore: () => void
  setStatus: (status: RunnerStatus) => void
  goTo: (sectionIndex: number, itemIndex: number) => void
  next: () => void
  prev: () => void
  setResponse: (itemId: string, patch: Partial<ItemResponse>) => void
  clearResponse: (itemId: string) => void
  toggleFlag: (itemId: string) => void
  beginSection: (index: number) => void
  expireSection: () => void
  extendSection: (seconds: number) => void
  tick: () => void
  finish: () => Promise<AttemptRecord | null>
  exit: () => void
}

function flatItems(mock: MockTest): string[] {
  return mock.sections.flatMap((s) => s.itemIds)
}

const safeJsonStorage = () => createJSONStorage(() => throttledStateStorage(1000))

export const useTest = create<TestStore>()(
  persist(
    (set, get) => ({
      mock: null,
      mode: 'exam',
      status: 'briefing',
      sectionIndex: 0,
      itemIndex: 0,
      responses: {},
      sectionEndsAt: null,
      startedAt: null,
      elapsedMs: 0,
      attemptId: null,
      ownerId: null,
      timeExpired: false,
      saveFailed: false,

      start: (mock, mode) => {
        set({
          ownerId: useAuth.getState().user?.id ?? getGuestOwnerId(),
          mock,
          mode,
          status: 'briefing',
          sectionIndex: 0,
          itemIndex: 0,
          responses: {},
          sectionEndsAt: null,
          startedAt: new Date().toISOString(),
          elapsedMs: 0,
          attemptId:
            typeof crypto !== 'undefined' && 'randomUUID' in crypto
              ? `att-${crypto.randomUUID()}`
              : `att-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`,
          timeExpired: false,
          saveFailed: false,
        })
      },

      /**
       * Re-enters a test that was interrupted by a reload. A test that was only
       * at the briefing stage still has to be started deliberately, because
       * starting the section is what starts the clock.
       */
      restore: () => {
        const { status, sectionEndsAt, mock } = get()
        if (!mock) return
        if (status === 'finished' || status === 'break' || status === 'briefing') return
        if (mock.untimed) {
          set({ status: 'running' })
          return
        }
        if (sectionEndsAt === null) return
        if (Date.now() >= sectionEndsAt) set({ timeExpired: true })
        else set({ status: 'running' })
      },

      setStatus: (status) => set({ status }),

      goTo: (sectionIndex, itemIndex) => {
        const { mock, sectionIndex: curSec, itemIndex: curItem } = get()
        if (mock?.forwardOnly) {
          if (sectionIndex < curSec || (sectionIndex === curSec && itemIndex < curItem)) return
        }
        set({ sectionIndex, itemIndex, timeExpired: false })
      },

      next: () => {
        const { mock, sectionIndex, itemIndex } = get()
        if (!mock) return
        const section = mock.sections[sectionIndex]
        if (!section) return
        if (itemIndex + 1 < section.itemIds.length) {
          set({ itemIndex: itemIndex + 1, timeExpired: false })
          return
        }
        if (sectionIndex + 1 < mock.sections.length) {
          set({ status: 'break', sectionIndex: sectionIndex + 1, itemIndex: 0 })
          return
        }
        set({ status: 'finished' })
      },

      prev: () => {
        const { itemIndex, mock } = get()
        if (mock?.forwardOnly) return
        if (itemIndex > 0) {
          set({ itemIndex: itemIndex - 1, timeExpired: false })
        }
      },

      setResponse: (itemId, patch) =>
        set((s) => ({
          responses: { ...s.responses, [itemId]: { ...(s.responses[itemId] ?? {}), ...patch } },
        })),

      clearResponse: (itemId) =>
        set((s) => {
          const next = { ...s.responses }
          delete next[itemId]
          return { responses: next }
        }),

      toggleFlag: (itemId) =>
        set((s) => ({
          responses: {
            ...s.responses,
            [itemId]: { ...(s.responses[itemId] ?? {}), flagged: !s.responses[itemId]?.flagged },
          },
        })),

      beginSection: (index) => {
        const { mock, startedAt } = get()
        const section = mock?.sections[index]
        if (!section) return
        set({
          sectionIndex: index,
          itemIndex: 0,
          status: 'running',
          timeExpired: false,
          sectionEndsAt: mock.untimed ? null : Date.now() + section.seconds * 1000,
          startedAt: startedAt ?? new Date().toISOString(),
        })
      },

      expireSection: () => set({ timeExpired: true }),

      /**
       * SC 2.2.1. A practice mock is not an essential time limit, so the
       * candidate is warned and offered a one-press extension rather than
       * being left to fail the section.
       */
      extendSection: (seconds) =>
        set((st) =>
          st.sectionEndsAt === null
            ? {}
            : { sectionEndsAt: st.sectionEndsAt + seconds * 1000, timeExpired: false },
        ),

      tick: () => {
        const { startedAt } = get()
        if (!startedAt) return
        set({ elapsedMs: Date.now() - new Date(startedAt).getTime() })
      },

      finish: async () => {
        const { mock, responses, startedAt, elapsedMs, mode, attemptId, ownerId } = get()
        if (!mock) return null

        const items = flatItems(mock)
          .map((id) => mock.items[id])
          .filter((i): i is NonNullable<typeof i> => Boolean(i))

        const metaById: Record<string, { skills: Skill[]; type: QuestionType; label: string }> = {}
        for (const item of items) {
          metaById[item.id] = {
            skills: item.skills,
            type: item.type,
            label: QUESTION_META[item.type]?.label ?? item.type,
          }
        }

        const report = buildReport(items, mock.answers, responses, metaById)

        const hasEstimated = report.details.some((d) => d.maxPoints > 0 && d.traits !== undefined)

        // The per-type counts the run actually used. A half or quick mock is
        // not the full blueprint, and the report is rebuilt from the seed when
        // it is reloaded, so the counts have to travel with the record.
        const counts: Partial<Record<QuestionType, number>> = {}
        for (const item of items) {
          counts[item.type] = (counts[item.type] ?? 0) + 1
        }

        const effectiveOwnerId =
          ownerId && ownerId.startsWith('guest:') && useAuth.getState().user?.id
            ? useAuth.getState().user!.id
            : ownerId

        const attempt: AttemptRecord = {
          id:
            attemptId ??
            (typeof crypto !== 'undefined' && 'randomUUID' in crypto
              ? `att-${crypto.randomUUID()}`
              : `att-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`),
          // Stamp the owner that started the test, or the newly signed-in
          // account if a guest authenticated while taking the test. A stale tab cannot
          // silently move one registered account's work into another registered account.
          ...(effectiveOwnerId && !effectiveOwnerId.startsWith('guest:')
            ? { userId: effectiveOwnerId }
            : {}),
          ...(effectiveOwnerId ? { ownerId: effectiveOwnerId } : {}),
          mockId: mock.id,
          mockTitle: mock.title,
          mockKind: mock.kind,
          counts,
          mode,
          startedAt: startedAt ?? new Date().toISOString(),
          finishedAt: new Date().toISOString(),
          durationMs: startedAt ? Date.now() - new Date(startedAt).getTime() : elapsedMs,
          seed: mock.seed,
          sectionIds: mock.sections.map((s) => s.id) as SectionId[],
          responses,
          availablePoints: report.availablePoints,
          earnedPoints: report.earnedPoints,
          skillScores: report.skills,
          overallIsEstimate: hasEstimated,
          timeScale: mock.timeScale,
          ...(mock.untimed ? { untimed: true } : {}),
          ...(mock.forwardOnly ? { forwardOnly: true } : {}),
          overallScore: report.overall,
          cefr: report.cefr,
          completedItemIds: items.filter((i) => hasResponse(responses[i.id])).map((i) => i.id),
          breakdown: report.breakdown,
          details: report.details,
        }

        set({ status: 'finished', attemptId: attempt.id, ownerId: effectiveOwnerId })
        // The attempt is returned either way — the report renders from memory
        // even when the write failed — but the candidate is told their result
        // was not saved. A failed write used to be indistinguishable from a
        // successful one, so the report claimed to be kept when it was not.
        const saved = await saveAttempt(attempt)
        if (!saved) {
          set({ saveFailed: true })
        }
        return attempt
      },

      exit: () =>
        set({
          mock: null,
          status: 'briefing',
          sectionIndex: 0,
          itemIndex: 0,
          responses: {},
          sectionEndsAt: null,
          startedAt: null,
          elapsedMs: 0,
          attemptId: null,
          ownerId: null,
          timeExpired: false,
          saveFailed: false,
        }),
    }),
    {
      name: 'pte-prep-active-test',
      version: 1,
      storage: safeJsonStorage(),
      partialize: (s) => ({
        mock: s.mock,
        mode: s.mode,
        status: s.status,
        sectionIndex: s.sectionIndex,
        itemIndex: s.itemIndex,
        responses: s.responses,
        sectionEndsAt: s.sectionEndsAt,
        startedAt: s.startedAt,
        attemptId: s.attemptId,
        ownerId: s.ownerId,
      }),
    },
  ),
)

export function hasResponse(r: ItemResponse | undefined): boolean {
  if (!r) return false
  if (r.choice) return true
  if (r.choices && r.choices.length > 0) return true
  if (r.blanks && r.blanks.some((b) => b && b.trim().length > 0)) return true
  if (r.order && r.order.length > 0) return true
  if (r.highlighted && r.highlighted.length > 0) return true
  if (r.text && r.text.trim().length > 0) return true
  if (r.transcript && r.transcript.trim().length > 0) return true
  if (r.audio && (r.audio.durationMs !== undefined ? r.audio.durationMs > 500 : true)) return true
  return false
}

/** Seconds left in the current section, floored at zero. */
export function secondsRemaining(endsAt: number | null): number {
  if (endsAt === null) return 0
  return Math.max(0, Math.ceil((endsAt - Date.now()) / 1000))
}
