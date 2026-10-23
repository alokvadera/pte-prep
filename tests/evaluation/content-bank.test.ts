import { describe, expect, it } from 'vitest'
import { ALL_QUESTION_TYPES, MOCK_BLUEPRINT } from '../../src/domain/blueprint'
import { bankCapacity, capacityByType } from '../../src/content/bank'

describe('content bank', () => {
  const capacity = capacityByType()

  it('holds at least one item for every question type', () => {
    const empty = ALL_QUESTION_TYPES.filter((type) => (capacity[type] ?? 0) <= 0)
    expect(empty).toEqual([])
  })

  it('reports a total capacity across every type', () => {
    expect(bankCapacity()).toBeGreaterThan(0)
  })

  it('holds enough repeat sentences for a full mock', () => {
    expect(capacity['repeat-sentence'] ?? 0).toBeGreaterThanOrEqual(MOCK_BLUEPRINT['repeat-sentence'])
  })

  it('holds enough read-aloud passages for a full mock', () => {
    expect(capacity['read-aloud'] ?? 0).toBeGreaterThanOrEqual(MOCK_BLUEPRINT['read-aloud'])
  })
})
