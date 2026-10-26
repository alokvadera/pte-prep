import { describe, expect, it } from 'vitest'
import { ALL_QUESTION_TYPES, QUESTION_META } from '../../../src/domain/blueprint'
import {
  BANK_CAPACITY,
  getManifest,
  MANIFEST_CAPACITY,
  manifestBankCapacity,
  manifestCapacityByType,
  TOTAL_CAPACITY,
  typesForSkill,
} from '../../../src/content/manifest'
import type { QuestionType, Skill } from '../../../src/domain/types'

/* ---------------------------------------------------------------------------
   The content manifest.

   The manifest is the cheap stand-in for the real content bank: it lets the
   practice and mock-setup screens show how many items of each type exist
   without shipping ten thousand lines of question text. If a figure here is
   wrong, the screen lies to the candidate, so the totals have to add up and
   every type in the blueprint has to be present.
   --------------------------------------------------------------------------- */

describe('MANIFEST_CAPACITY', () => {
  it('covers every question type in the blueprint', () => {
    expect(Object.keys(MANIFEST_CAPACITY).sort()).toEqual([...ALL_QUESTION_TYPES].sort())
  })

  it('gives every type a positive count', () => {
    for (const [type, count] of Object.entries(MANIFEST_CAPACITY)) {
      expect(count, type).toBeGreaterThan(0)
      expect(Number.isInteger(count), type).toBe(true)
    }
  })

  it('adds up to the published total', () => {
    const sum = Object.values(MANIFEST_CAPACITY).reduce((a, b) => a + b, 0)
    expect(TOTAL_CAPACITY).toBe(sum)
    expect(TOTAL_CAPACITY).toBe(1456)
  })
})

describe('manifestCapacityByType', () => {
  it('mirrors the manifest', () => {
    expect(manifestCapacityByType()).toEqual(MANIFEST_CAPACITY)
  })

  it('returns a copy, so a caller cannot corrupt the manifest', () => {
    const copy = manifestCapacityByType()
    expect(copy).not.toBe(MANIFEST_CAPACITY)
    copy['read-aloud'] = 0
    expect(MANIFEST_CAPACITY['read-aloud']).toBe(206)
  })
})

describe('manifestBankCapacity', () => {
  it('reports the headline capacity', () => {
    expect(manifestBankCapacity()).toBe(BANK_CAPACITY)
    expect(manifestBankCapacity()).toBe(1200)
  })

  it('is smaller than the raw item total', () => {
    // The bank weights a passage by seven item types, so the number of
    // buildable items is lower than the sum of every type's capacity.
    expect(BANK_CAPACITY).toBeLessThan(TOTAL_CAPACITY)
  })
})

describe('getManifest', () => {
  it('returns one entry per question type', () => {
    const manifest = getManifest()
    expect(manifest).toHaveLength(ALL_QUESTION_TYPES.length)
    expect(manifest.map((entry) => entry.type)).toEqual(ALL_QUESTION_TYPES)
  })

  it('copies the blueprint metadata onto every entry', () => {
    for (const entry of getManifest()) {
      const meta = QUESTION_META[entry.type]
      expect(entry.section).toBe(meta.section)
      expect(entry.skills).toEqual(meta.skills)
      expect(entry.label).toBe(meta.label)
      expect(entry.short).toBe(meta.short)
      expect(entry.perTest).toBe(meta.perTest)
      expect(entry.scoring).toBe(meta.scoring)
    }
  })

  it('reports the capacity of each type', () => {
    for (const entry of getManifest()) {
      expect(entry.count).toBe(MANIFEST_CAPACITY[entry.type])
    }
  })

  it('handles every question type the blueprint defines', () => {
    const types = getManifest().map((entry) => entry.type)
    for (const type of ALL_QUESTION_TYPES) {
      expect(types).toContain(type)
    }
  })
})

describe('typesForSkill', () => {
  it('returns the types that score a given skill', () => {
    const speaking = typesForSkill('speaking')
    expect(speaking).toContain('read-aloud')
    expect(speaking).toContain('repeat-sentence')
    expect(speaking).toContain('respond-to-situation')
    // Write Essay scores writing only.
    expect(speaking).not.toContain('write-essay')
    expect(typesForSkill('writing')).toContain('write-essay')
  })

  it('includes the integrated types in both of their skills', () => {
    expect(typesForSkill('listening')).toContain('retell-lecture')
    expect(typesForSkill('speaking')).toContain('retell-lecture')
    expect(typesForSkill('reading')).toContain('summarize-written-text')
    expect(typesForSkill('writing')).toContain('summarize-written-text')
  })

  it('scores every skill with at least one type', () => {
    const everySkill: Skill[] = ['reading', 'listening', 'speaking', 'writing']
    for (const skill of everySkill) {
      expect(typesForSkill(skill).length, skill).toBeGreaterThan(0)
    }
  })

  it('only ever returns real question types', () => {
    const known = new Set<string>(ALL_QUESTION_TYPES)
    for (const skill of ['reading', 'listening', 'speaking', 'writing'] as Skill[]) {
      for (const type of typesForSkill(skill)) {
        expect(known.has(type), type).toBe(true)
      }
    }
  })

  it('covers every type at least once', () => {
    const covered = new Set<QuestionType>(
      (['reading', 'listening', 'speaking', 'writing'] as Skill[]).flatMap(typesForSkill),
    )
    expect(covered.size).toBe(ALL_QUESTION_TYPES.length)
  })
})
