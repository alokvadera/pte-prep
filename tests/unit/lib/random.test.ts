import { describe, expect, it, vi } from 'vitest'
import { hashString, makeRng, pickN, pickOne, randomSeed, shuffle } from '../../../src/lib/random'

/* ---------------------------------------------------------------------------
   Deterministic randomness.

   The practice runs have to be reproducible: the same seed must build the same
   test, so a candidate who reports a bug can be shown the same paper. The
   generator is therefore seeded, and the helpers built on it are pure —
   shuffling copies the list instead of rearranging it in place, because the
   caller's bank is shared.
   --------------------------------------------------------------------------- */

describe('the seeded generator', () => {
  it('produces the same sequence for the same seed', () => {
    const first = makeRng(1234)
    const second = makeRng(1234)
    expect([first(), first(), first()]).toEqual([second(), second(), second()])
  })

  it('produces a different sequence for a different seed', () => {
    expect(makeRng(1)()).not.toBe(makeRng(2)())
  })

  it('keeps every number inside the half-open unit interval', () => {
    const rng = makeRng(7)
    for (let i = 0; i < 100; i++) {
      const value = rng()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })

  it('treats a negative seed as the same unsigned number', () => {
    expect(makeRng(-1)()).toBe(makeRng(4294967295)())
  })
})

describe('string hashing', () => {
  it('gives the same hash for the same string', () => {
    expect(hashString('solar')).toBe(hashString('solar'))
  })

  it('gives different hashes for different strings', () => {
    expect(hashString('solar')).not.toBe(hashString('wind'))
  })

  it('treats differently cased strings as different', () => {
    expect(hashString('solar')).not.toBe(hashString('Solar'))
  })

  it('hashes the empty string to the FNV offset basis', () => {
    expect(hashString('')).toBe(2166136261)
  })

  it('gives a hash that fits in an unsigned 32-bit integer', () => {
    const hash = hashString('a rather longer piece of text')
    expect(Number.isInteger(hash)).toBe(true)
    expect(hash).toBeGreaterThanOrEqual(0)
    expect(hash).toBeLessThan(2 ** 32)
  })
})

describe('shuffling', () => {
  it('leaves the original list untouched', () => {
    const original = [1, 2, 3, 4, 5]
    shuffle(original, makeRng(42))
    expect(original).toEqual([1, 2, 3, 4, 5])
  })

  it('returns a new list', () => {
    const original = [1, 2, 3]
    expect(shuffle(original, makeRng(42))).not.toBe(original)
  })

  it('keeps every element of the list', () => {
    const original = [1, 2, 3, 4, 5]
    expect([...shuffle(original, makeRng(42))].sort()).toEqual([1, 2, 3, 4, 5])
  })

  it('shuffles the same way for the same seed', () => {
    const original = [1, 2, 3, 4, 5]
    expect(shuffle(original, makeRng(42))).toEqual(shuffle(original, makeRng(42)))
  })
})

describe('picking several items', () => {
  it('takes exactly as many items as asked for', () => {
    expect(pickN([1, 2, 3, 4, 5], 3, makeRng(9))).toHaveLength(3)
  })

  it('takes everything when asked for more than the list holds', () => {
    expect(pickN([1, 2, 3], 10, makeRng(9))).toHaveLength(3)
  })

  it('takes nothing when asked for none', () => {
    expect(pickN([1, 2, 3], 0, makeRng(9))).toEqual([])
  })

  it('takes the items from the list it was given', () => {
    const picked = pickN(['a', 'b', 'c', 'd'], 2, makeRng(3))
    expect(picked).toHaveLength(2)
    for (const item of picked) expect(['a', 'b', 'c', 'd']).toContain(item)
  })
})

describe('picking one item', () => {
  it('picks an item from the list', () => {
    expect(['a', 'b', 'c']).toContain(pickOne(['a', 'b', 'c'], makeRng(5)))
  })

  it('throws when the list is empty', () => {
    expect(() => pickOne([], makeRng(5))).toThrow('pickOne on empty array')
  })
})

describe('random seeds', () => {
  it('gives a seed that fits in an unsigned 32-bit integer', () => {
    const seed = randomSeed()
    expect(Number.isInteger(seed)).toBe(true)
    expect(seed).toBeGreaterThanOrEqual(0)
    expect(seed).toBeLessThan(2 ** 32)
  })

  it('mixes the clock with the random source', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1000)
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const first = randomSeed()
    expect(randomSeed()).toBe(first)

    vi.spyOn(Math, 'random').mockReturnValue(0.25)
    expect(randomSeed()).not.toBe(first)
  })
})
