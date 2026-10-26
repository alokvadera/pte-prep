import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '../../../src/store/useAuth'
import { hasResponse, secondsRemaining, useTest } from '../../../src/store/useTest'
import type { RunnerStatus } from '../../../src/store/useTest'
import { clearAttempts, getAttempt } from '../../../src/db/db'
import type { AudioAnalysis, MockMode, QuestionType } from '../../../src/domain/types'
import { makeItem, makeMockTest, makeResponse } from '../../helpers/factories'

/* ---------------------------------------------------------------------------
   The active-test store.

   This is the runner: which item is on screen, what has been answered, how
   long is left, and — when the candidate finishes — the attempt record that
   the results page is built from. The clock and the cursor are the parts
   that have to be exactly right: an item that cannot be revisited is a lost
   mark, and a section that never ends is not a mock test.
   --------------------------------------------------------------------------- */

const ITEM_A = makeItem({
  id: 'item-a',
  type: 'multiple-choice-single',
  skills: ['reading'],
  responseKind: 'choice',
  maxPoints: 1,
})
const ITEM_B = makeItem({ id: 'item-b', type: 'read-aloud', skills: ['speaking'], maxPoints: 1 })
const ITEM_C = makeItem({ id: 'item-c', type: 'read-aloud', skills: ['speaking'], maxPoints: 1 })

const TWO_SECTION_MOCK = makeMockTest({
  id: 'mock-two',
  title: 'Two Section Mock',
  kind: 'section',
  sections: [
    {
      id: 'speaking-writing',
      title: 'Speaking & Writing',
      seconds: 300,
      groups: [],
      itemIds: ['item-a', 'item-b'],
    },
    { id: 'reading', title: 'Reading', seconds: 3600, groups: [], itemIds: ['item-c'] },
  ],
  items: { 'item-a': ITEM_A, 'item-b': ITEM_B, 'item-c': ITEM_C },
  answers: {
    'item-a': { correctChoice: 'A' },
    'item-b': { reference: 'The quick brown fox jumps over the lazy dog.' },
    'item-c': { reference: 'A second passage.' },
  },
  totalPoints: 3,
  totalSeconds: 3900,
})

function makeAudio(durationMs: number | undefined): AudioAnalysis {
  return {
    durationMs: durationMs as number,
    wordsPerMinute: 120,
    speechRatio: 0.8,
    pauseCount: 0,
    meanPitchHz: 180,
    energyVariance: 0.3,
    reliable: true,
  }
}

describe('useTest', () => {
  beforeEach(async () => {
    localStorage.clear()
    useAuth.setState({ user: null, token: null })
    useTest.setState({
      mock: null,
      mode: 'exam' as MockMode,
      status: 'briefing' as RunnerStatus,
      sectionIndex: 0,
      itemIndex: 0,
      responses: {},
      sectionEndsAt: null,
      startedAt: null,
      elapsedMs: 0,
      attemptId: null,
      ownerId: null,
      timeExpired: false,
    })
    await clearAttempts()
  })

  describe('start', () => {
    it('stores the mock and resets the session', () => {
      useTest.getState().setResponse('item-a', { choice: 'A' })

      useTest.getState().start(TWO_SECTION_MOCK, 'practice')

      const state = useTest.getState()
      expect(state.mock?.id).toBe('mock-two')
      expect(state.mode).toBe('practice')
      expect(state.status).toBe('briefing')
      expect(state.sectionIndex).toBe(0)
      expect(state.itemIndex).toBe(0)
      expect(state.responses).toEqual({})
      expect(state.sectionEndsAt).toBeNull()
      expect(state.elapsedMs).toBe(0)
      expect(state.timeExpired).toBe(false)
      expect(state.startedAt).not.toBeNull()
      expect(state.attemptId).toMatch(/^att-/)
    })

    it('stamps the signed-in account as the owner', () => {
      useAuth.setState({ user: { id: 'usr_1', email: 'a@b.c', targetScore: 60 } })

      useTest.getState().start(TWO_SECTION_MOCK, 'exam')

      expect(useTest.getState().ownerId).toBe('usr_1')
    })

    it('stamps a device guest id when nobody is signed in', () => {
      useAuth.setState({ user: null })

      useTest.getState().start(TWO_SECTION_MOCK, 'exam')

      expect(useTest.getState().ownerId).toMatch(/^guest:/)
    })

    it('makes an attempt id without randomUUID when the browser has none', () => {
      vi.stubGlobal('crypto', undefined)
      vi.spyOn(Math, 'random').mockReturnValue(0.5)

      useTest.getState().start(TWO_SECTION_MOCK, 'exam')

      expect(useTest.getState().attemptId).toMatch(/^att-[a-z0-9]+-[a-z0-9]+$/)
    })
  })

  describe('restore', () => {
    it('does nothing without a mock', () => {
      useTest.getState().restore()

      expect(useTest.getState().status).toBe('briefing')
    })

    it('leaves a finished test alone', () => {
      useTest.setState({ mock: TWO_SECTION_MOCK, status: 'finished' })

      useTest.getState().restore()

      expect(useTest.getState().status).toBe('finished')
    })

    it('leaves a break alone', () => {
      useTest.setState({ mock: TWO_SECTION_MOCK, status: 'break' })

      useTest.getState().restore()

      expect(useTest.getState().status).toBe('break')
    })

    it('leaves a briefing alone, because starting the section starts the clock', () => {
      useTest.setState({ mock: TWO_SECTION_MOCK, status: 'briefing' })

      useTest.getState().restore()

      expect(useTest.getState().status).toBe('briefing')
    })

    it('resumes an untimed test', () => {
      useTest.setState({ mock: { ...TWO_SECTION_MOCK, untimed: true }, status: 'running' })

      useTest.getState().restore()

      expect(useTest.getState().status).toBe('running')
    })

    it('does nothing when the section clock is missing', () => {
      useTest.setState({ mock: TWO_SECTION_MOCK, status: 'running', sectionEndsAt: null })

      useTest.getState().restore()

      expect(useTest.getState().status).toBe('running')
      expect(useTest.getState().timeExpired).toBe(false)
    })

    it('flags the test as expired when the clock has run out', () => {
      useTest.setState({
        mock: TWO_SECTION_MOCK,
        status: 'running',
        sectionEndsAt: Date.now() - 1,
      })

      useTest.getState().restore()

      expect(useTest.getState().timeExpired).toBe(true)
      expect(useTest.getState().status).toBe('running')
    })

    it('resumes a running test', () => {
      useTest.setState({
        mock: TWO_SECTION_MOCK,
        status: 'running',
        sectionEndsAt: Date.now() + 60_000,
      })

      useTest.getState().restore()

      expect(useTest.getState().status).toBe('running')
      expect(useTest.getState().timeExpired).toBe(false)
    })

    it('rehydrates a persisted mock from localStorage', async () => {
      const payload = {
        mock: TWO_SECTION_MOCK,
        mode: 'exam',
        status: 'running',
        sectionIndex: 0,
        itemIndex: 0,
        responses: { 'item-a': { choice: 'A' } },
        sectionEndsAt: Date.now() + 60_000,
        startedAt: '2026-01-01T00:00:00.000Z',
        attemptId: 'att-stored',
        ownerId: 'usr_1',
      }
      useTest.persist.clearStorage()
      localStorage.setItem('pte-prep-active-test', JSON.stringify({ state: payload, version: 1 }))

      await useTest.persist.rehydrate()

      expect(useTest.getState().mock?.id).toBe('mock-two')
      expect(useTest.getState().responses['item-a']?.choice).toBe('A')
      expect(useTest.getState().attemptId).toBe('att-stored')

      useTest.getState().restore()

      expect(useTest.getState().status).toBe('running')
    })
  })

  describe('setStatus', () => {
    it('moves between the runner states', () => {
      useTest.getState().setStatus('running')
      expect(useTest.getState().status).toBe('running')

      useTest.getState().setStatus('break')
      expect(useTest.getState().status).toBe('break')

      useTest.getState().setStatus('finished')
      expect(useTest.getState().status).toBe('finished')

      useTest.getState().setStatus('briefing')
      expect(useTest.getState().status).toBe('briefing')
    })
  })

  describe('goTo', () => {
    it('moves to a given section and item', () => {
      useTest.setState({ mock: TWO_SECTION_MOCK })

      useTest.getState().goTo(1, 0)

      expect(useTest.getState().sectionIndex).toBe(1)
      expect(useTest.getState().itemIndex).toBe(0)
    })

    it('allows going back in a normal test', () => {
      useTest.setState({ mock: TWO_SECTION_MOCK, sectionIndex: 1, itemIndex: 0 })

      useTest.getState().goTo(0, 1)

      expect(useTest.getState().sectionIndex).toBe(0)
      expect(useTest.getState().itemIndex).toBe(1)
    })

    it('refuses to go back to an earlier section in a forward-only test', () => {
      useTest.setState({
        mock: { ...TWO_SECTION_MOCK, forwardOnly: true },
        sectionIndex: 1,
        itemIndex: 0,
      })

      useTest.getState().goTo(0, 0)

      expect(useTest.getState().sectionIndex).toBe(1)
      expect(useTest.getState().itemIndex).toBe(0)
    })

    it('refuses to go back within a section in a forward-only test', () => {
      useTest.setState({
        mock: { ...TWO_SECTION_MOCK, forwardOnly: true },
        sectionIndex: 0,
        itemIndex: 1,
      })

      useTest.getState().goTo(0, 0)

      expect(useTest.getState().itemIndex).toBe(1)
    })

    it('allows moving forward inside a section in a forward-only test', () => {
      useTest.setState({
        mock: { ...TWO_SECTION_MOCK, forwardOnly: true },
        sectionIndex: 0,
        itemIndex: 0,
      })

      useTest.getState().goTo(0, 1)

      expect(useTest.getState().sectionIndex).toBe(0)
      expect(useTest.getState().itemIndex).toBe(1)
    })

    it('clears the expired flag when it moves', () => {
      useTest.setState({ mock: TWO_SECTION_MOCK, timeExpired: true })

      useTest.getState().goTo(0, 1)

      expect(useTest.getState().timeExpired).toBe(false)
    })
  })

  describe('next', () => {
    it('moves to the next item of the section', () => {
      useTest.setState({ mock: TWO_SECTION_MOCK, sectionIndex: 0, itemIndex: 0 })

      useTest.getState().next()

      expect(useTest.getState().itemIndex).toBe(1)
      expect(useTest.getState().status).toBe('briefing')
    })

    it('moves to the break at the end of a section', () => {
      useTest.setState({ mock: TWO_SECTION_MOCK, sectionIndex: 0, itemIndex: 1 })

      useTest.getState().next()

      expect(useTest.getState().status).toBe('break')
      expect(useTest.getState().sectionIndex).toBe(1)
      expect(useTest.getState().itemIndex).toBe(0)
    })

    it('finishes after the last item of the last section', () => {
      useTest.setState({ mock: TWO_SECTION_MOCK, sectionIndex: 1, itemIndex: 0 })

      useTest.getState().next()

      expect(useTest.getState().status).toBe('finished')
      expect(useTest.getState().sectionIndex).toBe(1)
    })

    it('does nothing without a mock', () => {
      useTest.getState().next()

      expect(useTest.getState().status).toBe('briefing')
      expect(useTest.getState().itemIndex).toBe(0)
    })

    it('does nothing when the section is missing', () => {
      useTest.setState({ mock: TWO_SECTION_MOCK, sectionIndex: 5 })

      useTest.getState().next()

      expect(useTest.getState().status).toBe('briefing')
    })
  })

  describe('prev', () => {
    it('moves back one item', () => {
      useTest.setState({ mock: TWO_SECTION_MOCK, itemIndex: 1 })

      useTest.getState().prev()

      expect(useTest.getState().itemIndex).toBe(0)
    })

    it('does nothing at the first item', () => {
      useTest.setState({ mock: TWO_SECTION_MOCK, itemIndex: 0 })

      useTest.getState().prev()

      expect(useTest.getState().itemIndex).toBe(0)
    })

    it('does nothing in a forward-only test', () => {
      useTest.setState({ mock: { ...TWO_SECTION_MOCK, forwardOnly: true }, itemIndex: 1 })

      useTest.getState().prev()

      expect(useTest.getState().itemIndex).toBe(1)
    })
  })

  describe('responses', () => {
    it('stores a partial response', () => {
      useTest.getState().setResponse('item-a', { choice: 'A' })

      expect(useTest.getState().responses['item-a']).toEqual({ choice: 'A' })
    })

    it('merges into a response that is already there', () => {
      useTest.getState().setResponse('item-a', { choice: 'A' })

      useTest.getState().setResponse('item-a', { flagged: true, secondsOnItem: 12 })

      expect(useTest.getState().responses['item-a']).toEqual({
        choice: 'A',
        flagged: true,
        secondsOnItem: 12,
      })
    })

    it('clears a response', () => {
      useTest.getState().setResponse('item-a', { choice: 'A' })

      useTest.getState().clearResponse('item-a')

      expect(useTest.getState().responses['item-a']).toBeUndefined()
      expect(Object.keys(useTest.getState().responses)).toHaveLength(0)
    })

    it('toggles the flagged flag on and off', () => {
      useTest.getState().toggleFlag('item-a')
      expect(useTest.getState().responses['item-a']?.flagged).toBe(true)

      useTest.getState().toggleFlag('item-a')
      expect(useTest.getState().responses['item-a']?.flagged).toBe(false)
    })

    it('keeps the rest of a response when the flag is toggled', () => {
      useTest.getState().setResponse('item-a', { choice: 'A' })

      useTest.getState().toggleFlag('item-a')

      expect(useTest.getState().responses['item-a']).toEqual({ choice: 'A', flagged: true })
    })
  })

  describe('the section clock', () => {
    it('beginSection sets the clock for the section', () => {
      useTest.setState({ mock: TWO_SECTION_MOCK })
      const before = Date.now()

      useTest.getState().beginSection(0)

      const state = useTest.getState()
      expect(state.sectionIndex).toBe(0)
      expect(state.itemIndex).toBe(0)
      expect(state.status).toBe('running')
      expect(state.timeExpired).toBe(false)
      expect(state.sectionEndsAt).not.toBeNull()
      expect(state.sectionEndsAt!).toBeGreaterThan(before + 300_000 - 100)
      expect(state.sectionEndsAt!).toBeLessThanOrEqual(Date.now() + 300_000)
    })

    it('beginSection leaves an untimed test without a clock', () => {
      useTest.setState({ mock: { ...TWO_SECTION_MOCK, untimed: true } })

      useTest.getState().beginSection(0)

      expect(useTest.getState().sectionEndsAt).toBeNull()
      expect(useTest.getState().status).toBe('running')
    })

    it('beginSection does nothing for a section that does not exist', () => {
      useTest.setState({ mock: TWO_SECTION_MOCK, status: 'briefing' })

      useTest.getState().beginSection(7)

      expect(useTest.getState().status).toBe('briefing')
      expect(useTest.getState().sectionEndsAt).toBeNull()
    })

    it('beginSection keeps the start time the test already has', () => {
      useTest.setState({ mock: TWO_SECTION_MOCK, startedAt: '2026-01-01T00:00:00.000Z' })

      useTest.getState().beginSection(0)

      expect(useTest.getState().startedAt).toBe('2026-01-01T00:00:00.000Z')
    })

    it('beginSection stamps a start time when the test has none', () => {
      useTest.setState({ mock: TWO_SECTION_MOCK, startedAt: null })

      useTest.getState().beginSection(0)

      expect(useTest.getState().startedAt).not.toBeNull()
    })

    it('expireSection flags the time as expired', () => {
      useTest.getState().expireSection()

      expect(useTest.getState().timeExpired).toBe(true)
    })

    it('extendSection adds time back', () => {
      useTest.setState({ sectionEndsAt: 1_000_000, timeExpired: true })

      useTest.getState().extendSection(60)

      expect(useTest.getState().sectionEndsAt).toBe(1_060_000)
      expect(useTest.getState().timeExpired).toBe(false)
    })

    it('extendSection does nothing when there is no clock to extend', () => {
      useTest.setState({ sectionEndsAt: null, timeExpired: true })

      useTest.getState().extendSection(60)

      expect(useTest.getState().sectionEndsAt).toBeNull()
      expect(useTest.getState().timeExpired).toBe(true)
    })

    it('tick records how long the test has been running', () => {
      useTest.setState({ startedAt: new Date(Date.now() - 5_000).toISOString(), elapsedMs: 0 })

      useTest.getState().tick()

      const { elapsedMs } = useTest.getState()
      expect(elapsedMs).toBeGreaterThanOrEqual(5_000)
      expect(elapsedMs).toBeLessThan(15_000)
    })

    it('tick does nothing before the test has started', () => {
      useTest.setState({ startedAt: null, elapsedMs: 0 })

      useTest.getState().tick()

      expect(useTest.getState().elapsedMs).toBe(0)
    })
  })

  describe('finish', () => {
    it('builds the attempt from the mock and the responses', async () => {
      useTest.getState().start(TWO_SECTION_MOCK, 'exam')
      useTest.getState().setResponse('item-a', { choice: 'A' })

      const attempt = await useTest.getState().finish()

      expect(attempt).not.toBeNull()
      expect(attempt!.id).toBe(useTest.getState().attemptId)
      expect(attempt!.mockId).toBe('mock-two')
      expect(attempt!.mockTitle).toBe('Two Section Mock')
      expect(attempt!.mockKind).toBe('section')
      expect(attempt!.mode).toBe('exam')
      expect(attempt!.seed).toBe(42)
      expect(attempt!.sectionIds).toEqual(['speaking-writing', 'reading'])
      expect(attempt!.responses).toEqual({ 'item-a': { choice: 'A' } })
      expect(attempt!.availablePoints).toBe(3)
      expect(attempt!.earnedPoints).toBe(1)
      expect(attempt!.skillScores).toEqual({ reading: 90, speaking: 10 })
      expect(attempt!.overallScore).toBe(39)
      expect(attempt!.cefr).toBe('A2')
      expect(attempt!.overallIsEstimate).toBe(true)
      expect(attempt!.timeScale).toBe(1)
      expect(attempt!.completedItemIds).toEqual(['item-a'])
      expect(attempt!.details).toHaveLength(3)
      expect(attempt!.breakdown['multiple-choice-single']?.correct).toBe(1)
      expect(attempt!.breakdown['read-aloud']?.incorrect).toBe(2)
      expect(attempt!.untimed).toBeUndefined()
      expect(attempt!.forwardOnly).toBeUndefined()
      expect(attempt!.durationMs).toBeGreaterThanOrEqual(0)
      expect(attempt!.finishedAt).not.toBeNull()
    })

    it('saves the attempt to IndexedDB', async () => {
      useTest.getState().start(TWO_SECTION_MOCK, 'exam')
      useTest.getState().setResponse('item-a', { choice: 'A' })

      const attempt = await useTest.getState().finish()

      const stored = await getAttempt(attempt!.id)
      expect(stored?.mockId).toBe('mock-two')
      expect(stored?.responses['item-a']).toEqual({ choice: 'A' })
    })

    it('returns null without a mock', async () => {
      const attempt = await useTest.getState().finish()

      expect(attempt).toBeNull()
    })

    it('marks the session as finished', async () => {
      useTest.getState().start(TWO_SECTION_MOCK, 'exam')

      const attempt = await useTest.getState().finish()

      expect(useTest.getState().status).toBe('finished')
      expect(useTest.getState().attemptId).toBe(attempt!.id)
    })

    it('records the signed-in account as the owner of the attempt', async () => {
      useAuth.setState({ user: { id: 'usr_1', email: 'a@b.c', targetScore: 60 } })
      useTest.getState().start(TWO_SECTION_MOCK, 'exam')

      const attempt = await useTest.getState().finish()

      expect(attempt!.ownerId).toBe('usr_1')
      expect(attempt!.userId).toBe('usr_1')
    })

    it('records a guest attempt without a user id', async () => {
      useAuth.setState({ user: null })
      useTest.getState().start(TWO_SECTION_MOCK, 'exam')

      const attempt = await useTest.getState().finish()

      expect(attempt!.ownerId).toMatch(/^guest:/)
      expect(attempt!.userId).toBeUndefined()
    })

    it('flags an untimed run', async () => {
      useTest.getState().start({ ...TWO_SECTION_MOCK, untimed: true }, 'practice')

      const attempt = await useTest.getState().finish()

      expect(attempt!.untimed).toBe(true)
      expect(attempt!.mode).toBe('practice')
    })

    it('flags a forward-only run', async () => {
      useTest.getState().start({ ...TWO_SECTION_MOCK, forwardOnly: true }, 'exam')

      const attempt = await useTest.getState().finish()

      expect(attempt!.forwardOnly).toBe(true)
    })

    it('makes an attempt id when the session has none', async () => {
      useTest.setState({ mock: TWO_SECTION_MOCK, attemptId: null })

      const attempt = await useTest.getState().finish()

      expect(attempt!.id).toMatch(/^att-/)
      expect(useTest.getState().attemptId).toBe(attempt!.id)
    })

    it('makes an attempt id without randomUUID when the browser has none', async () => {
      vi.stubGlobal('crypto', undefined)
      vi.spyOn(Math, 'random').mockReturnValue(0.5)
      useTest.setState({ mock: TWO_SECTION_MOCK, attemptId: null })

      const attempt = await useTest.getState().finish()

      expect(attempt!.id).toMatch(/^att-[a-z0-9]+-[a-z0-9]+$/)
    })

    it('falls back to the raw type for an item whose question type is unknown', async () => {
      const mock = makeMockTest({
        id: 'mock-unknown',
        title: 'Unknown Type Mock',
        kind: 'section',
        sections: [
          {
            id: 'speaking-writing',
            title: 'Speaking & Writing',
            seconds: 300,
            groups: [],
            itemIds: ['item-x'],
          },
        ],
        items: {
          'item-x': makeItem({ id: 'item-x', type: 'not-a-real-type' as unknown as QuestionType }),
        },
        answers: {},
        totalPoints: 1,
        totalSeconds: 300,
      })
      useTest.getState().start(mock, 'exam')

      const attempt = await useTest.getState().finish()

      expect(attempt).not.toBeNull()
      expect(attempt!.availablePoints).toBe(0)
      expect(attempt!.details).toHaveLength(0)
    })
  })

  describe('exit', () => {
    it('clears the session', () => {
      useTest.getState().start(TWO_SECTION_MOCK, 'exam')
      useTest.getState().setResponse('item-a', { choice: 'A' })

      useTest.getState().exit()

      const state = useTest.getState()
      expect(state.mock).toBeNull()
      expect(state.status).toBe('briefing')
      expect(state.sectionIndex).toBe(0)
      expect(state.itemIndex).toBe(0)
      expect(state.responses).toEqual({})
      expect(state.sectionEndsAt).toBeNull()
      expect(state.startedAt).toBeNull()
      expect(state.elapsedMs).toBe(0)
      expect(state.attemptId).toBeNull()
      expect(state.ownerId).toBeNull()
      expect(state.timeExpired).toBe(false)
    })
  })

  describe('hasResponse', () => {
    it('is false when there is no response at all', () => {
      expect(hasResponse(undefined)).toBe(false)
    })

    it('is false for an empty response', () => {
      expect(hasResponse(makeResponse())).toBe(false)
    })

    it('is true for a single choice', () => {
      expect(hasResponse(makeResponse({ choice: 'A' }))).toBe(true)
    })

    it('is true for multiple choices', () => {
      expect(hasResponse(makeResponse({ choices: ['A', 'B'] }))).toBe(true)
    })

    it('is false for an empty choice list', () => {
      expect(hasResponse(makeResponse({ choices: [] }))).toBe(false)
    })

    it('is true for a filled blank', () => {
      expect(hasResponse(makeResponse({ blanks: ['', 'answer'] }))).toBe(true)
    })

    it('is false for blanks that are all empty', () => {
      expect(hasResponse(makeResponse({ blanks: ['', '   '] }))).toBe(false)
    })

    it('is true for an order', () => {
      expect(hasResponse(makeResponse({ order: ['b', 'a'] }))).toBe(true)
    })

    it('is false for an empty order', () => {
      expect(hasResponse(makeResponse({ order: [] }))).toBe(false)
    })

    it('is true for highlighted tokens', () => {
      expect(hasResponse(makeResponse({ highlighted: [1, 2] }))).toBe(true)
    })

    it('is false for an empty highlight list', () => {
      expect(hasResponse(makeResponse({ highlighted: [] }))).toBe(false)
    })

    it('is true for text', () => {
      expect(hasResponse(makeResponse({ text: 'My answer' }))).toBe(true)
    })

    it('is false for whitespace-only text', () => {
      expect(hasResponse(makeResponse({ text: '   ' }))).toBe(false)
    })

    it('is true for a transcript', () => {
      expect(hasResponse(makeResponse({ transcript: 'Spoken answer' }))).toBe(true)
    })

    it('is false for an empty transcript', () => {
      expect(hasResponse(makeResponse({ transcript: '  ' }))).toBe(false)
    })

    it('is true for a recording longer than half a second', () => {
      expect(hasResponse(makeResponse({ audio: makeAudio(800) }))).toBe(true)
    })

    it('is false for a recording of half a second or less', () => {
      expect(hasResponse(makeResponse({ audio: makeAudio(500) }))).toBe(false)
      expect(hasResponse(makeResponse({ audio: makeAudio(200) }))).toBe(false)
    })

    it('is true for a recording whose length was never measured', () => {
      expect(hasResponse(makeResponse({ audio: makeAudio(undefined) }))).toBe(true)
    })
  })

  describe('secondsRemaining', () => {
    it('is zero when there is no end time', () => {
      expect(secondsRemaining(null)).toBe(0)
    })

    it('counts the seconds that are left', () => {
      expect(secondsRemaining(Date.now() + 65_000)).toBe(65)
    })

    it('rounds a part-second remainder up', () => {
      expect(secondsRemaining(Date.now() + 65_400)).toBe(66)
    })

    it('never goes below zero', () => {
      expect(secondsRemaining(Date.now() - 5_000)).toBe(0)
    })
  })
})
