import { describe, expect, it, vi } from 'vitest'
import { HIGHLIGHT_INCORRECT, MISSING_WORD } from '../../../src/content/listening'
import type { HighlightIncorrectItem } from '../../../src/content/schema'

/* ---------------------------------------------------------------------------
   The Highlight Incorrect Words items are built from a pair of transcripts:
   the one the candidate reads, and the one the recording actually says. The
   two indices the item is scored against are derived from that pair rather
   than written down by hand, because a mistyped index produces an item that
   cannot be answered correctly at all.

   The derivation also refuses to build an item that is not a substitution. An
   insertion would shift every later index, and a pair that differs in more
   or fewer than two places is not the two-word error the type asks for.
   --------------------------------------------------------------------------- */

/** The two transcripts of a well-formed item, and the indices they imply. */
function derivedIndices(item: HighlightIncorrectItem): number[] {
  const shown = item.transcript.split(/\s+/)
  const actual = item.correctTranscript.split(/\s+/)
  return shown.reduce<number[]>(
    (acc, word, index) => (word === actual[index] ? acc : [...acc, index]),
    [],
  )
}

describe('highlight incorrect words items', () => {
  it('ships a bank of items', () => {
    expect(HIGHLIGHT_INCORRECT.length).toBeGreaterThan(4)
  })

  it('derives the scored indices from the transcript pair', () => {
    for (const item of HIGHLIGHT_INCORRECT) {
      expect(derivedIndices(item)).toEqual(item.incorrect)
    }
  })

  it('targets exactly two words in every item', () => {
    expect(HIGHLIGHT_INCORRECT.every((item) => item.incorrect.length === 2)).toBe(true)
  })

  it('keeps the two transcripts the same length in every item', () => {
    expect(
      HIGHLIGHT_INCORRECT.every(
        (item) =>
          item.transcript.split(/\s+/).length === item.correctTranscript.split(/\s+/).length,
      ),
    ).toBe(true)
  })

  it('points every scored index at a token that really is in the transcript', () => {
    expect(
      HIGHLIGHT_INCORRECT.every((item) =>
        item.incorrect.every((index) => index < item.transcript.split(/\s+/).length),
      ),
    ).toBe(true)
  })

  it('gives every item a unique id', () => {
    expect(new Set(HIGHLIGHT_INCORRECT.map((item) => item.id)).size).toBe(
      HIGHLIGHT_INCORRECT.length,
    )
  })
})

describe('select missing word items', () => {
  it('ships a bank of items', () => {
    expect(MISSING_WORD.length).toBeGreaterThan(4)
  })

  it('gives every item at least three near-homophone options', () => {
    expect(MISSING_WORD.every((item) => item.options.length >= 3)).toBe(true)
  })

  it('points every item at one of its own options', () => {
    expect(MISSING_WORD.every((item) => item.options[item.correct] !== undefined)).toBe(true)
  })
})

/* ---------------------------------------------------------------------------
   The two refusals inside the builder.

   The builder that derives the scored indices is private to the content
   module and is called with four fixed, hand-checked transcript pairs, so the
   bank as shipped can never trip its own validation. The validation is still
   worth having — a mistyped pair would otherwise ship an unanswerable item —
   so it is exercised here by rebuilding the module with one of those pairs
   made malformed.

   The pairs are literals inside the module, so the only way to change what
   the builder sees is to change how it splits a string. The patch below is
   surgical: it alters the split of one named transcript and leaves every
   other string in the module alone, and it is removed again as soon as the
   module has been evaluated.
   --------------------------------------------------------------------------- */

/** The first transcript pair, as the module spells it. */
const HIW1_SHOWN =
  'The studio flats are four hundred and eighty pounds per calendar month, including bills, but not including broadband, which is a further twenty-two pounds.'

/** The second transcript pair, as the module spells it. */
const HIW2_SHOWN =
  'The benches are free for groups, but there is a charge for the sorting room, and the sorting room is only available on weekdays because the volunteer group uses it at the weekend.'

type SplitFn = (this: string, separator: string | RegExp, limit?: number) => string[]

/**
 * Rebuild the listening module with `patch` applied to the way a transcript
 * is split into words.
 */
async function rebuildWithSplit(
  patch: (text: string, words: string[]) => string[],
): Promise<unknown> {
  const original = String.prototype.split as unknown as SplitFn
  String.prototype.split = function (
    this: string,
    separator: string | RegExp,
    limit?: number,
  ): string[] {
    const words = original.call(this, separator, limit)
    return patch(this, words)
  } as unknown as typeof String.prototype.split
  try {
    vi.resetModules()
    return await import('../../../src/content/listening')
  } finally {
    String.prototype.split = original as unknown as typeof String.prototype.split
    vi.resetModules()
  }
}

describe('a transcript pair that is not a substitution', () => {
  it('refuses to build an item that inserts a word', async () => {
    const built = rebuildWithSplit((text, words) =>
      text === HIW1_SHOWN ? words.slice(0, -1) : words,
    )
    await expect(built).rejects.toThrow(/hiw-1: transcript must substitute words, not insert them/)
  })

  it('names the two lengths in the refusal', async () => {
    const built = rebuildWithSplit((text, words) =>
      text === HIW1_SHOWN ? words.slice(0, -1) : words,
    )
    await expect(built).rejects.toThrow(/\(23 vs 24\)/)
  })
})

describe('a transcript pair that differs in the wrong number of places', () => {
  it('refuses to build an item that differs in three places', async () => {
    const built = rebuildWithSplit((text, words) =>
      text === HIW2_SHOWN ? words.map((word, index) => (index === 10 ? 'fee' : word)) : words,
    )
    await expect(built).rejects.toThrow(/hiw-2: expected exactly two differing words, found 3/)
  })

  it('still builds the real bank once the patch is removed', async () => {
    const fresh = await import('../../../src/content/listening')
    expect(fresh.HIGHLIGHT_INCORRECT.every((item) => item.incorrect.length === 2)).toBe(true)
  })
})
