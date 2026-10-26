import type {
  AnswerKey,
  AttemptRecord,
  Item,
  ItemResponse,
  MockTest,
  QuestionType,
  SectionId,
  Skill,
} from '../../src/domain/types'

/* ---------------------------------------------------------------------------
   Builders for the domain objects the tests need in a known shape.
   Every field has a sensible default, so a test only states what it is
   actually about.
   --------------------------------------------------------------------------- */

export function makeItem(overrides: Partial<Item> = {}): Item {
  const type: QuestionType = overrides.type ?? 'read-aloud'
  return {
    id: 'item-1',
    type,
    section: 'speaking-writing',
    groupId: 'group-1',
    skills: ['speaking'],
    responseKind: 'audio',
    prompt: 'Read the text aloud.',
    targetText: 'The quick brown fox jumps over the lazy dog.',
    maxPoints: 1,
    seconds: 40,
    ...overrides,
  }
}

export function makeAnswerKey(overrides: Partial<AnswerKey> = {}): AnswerKey {
  return { correctChoice: 'A', ...overrides }
}

export function makeResponse(overrides: Partial<ItemResponse> = {}): ItemResponse {
  return { ...overrides }
}

export function makeMockTest(overrides: Partial<MockTest> = {}): MockTest {
  const items = overrides.items ?? {
    'item-1': makeItem(),
  }
  const answers = overrides.answers ?? {
    'item-1': makeAnswerKey(),
  }
  return {
    id: 'mock-1',
    seed: 42,
    title: 'PTE Mock Test',
    kind: 'full',
    createdAt: '2026-01-01T00:00:00.000Z',
    sections: [
      {
        id: 'speaking-writing' as SectionId,
        title: 'Speaking & Writing',
        seconds: 300,
        groups: [],
        itemIds: ['item-1'],
      },
    ],
    items,
    answers,
    totalPoints: 1,
    totalSeconds: 300,
    timeScale: 1,
    ...overrides,
  }
}

export function makeAttempt(overrides: Partial<AttemptRecord> = {}): AttemptRecord {
  return {
    id: 'attempt-1',
    mockId: 'mock-1',
    mockTitle: 'PTE Mock Test',
    mode: 'exam',
    startedAt: '2026-01-01T00:00:00.000Z',
    finishedAt: '2026-01-01T01:00:00.000Z',
    durationMs: 3_600_000,
    seed: 42,
    sectionIds: ['speaking-writing', 'reading', 'listening'],
    responses: {},
    availablePoints: 90,
    earnedPoints: 60,
    skillScores: { listening: 60, reading: 60, speaking: 60, writing: 60 } as Partial<Record<Skill, number>>,
    overallIsEstimate: true,
    overallScore: 60,
    cefr: 'B2',
    completedItemIds: [],
    breakdown: {},
    ...overrides,
  }
}
