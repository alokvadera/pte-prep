import { describe, expect, it, vi } from 'vitest'

/* ---------------------------------------------------------------------------
   The data-integrity guards in the extra listening banks.

   Each batch of Highlight Incorrect Words items derives the two indices it is
   scored against from a pair of transcripts, and refuses to build an item that
   is not a two-word substitution: an insertion would shift every later index,
   and a pair that differs in the wrong number of places is not the error the
   type asks for.

   The pairs are literals inside the module, so the shipped bank can never trip
   its own validation. The validation is still worth having — a mistyped pair
   would ship an unanswerable item — so it is exercised here by rebuilding each
   module with one transcript made malformed.
   --------------------------------------------------------------------------- */

type SplitFn = (this: string, separator: string | RegExp, limit?: number) => string[]

/**
 * Rebuilds a content module with one named transcript split into one word
 * fewer, which turns a two-word substitution into an insertion.
 */
async function rebuildWithShortenedTranscript(
  modulePath: string,
  transcript: string,
): Promise<unknown> {
  const original = String.prototype.split as unknown as SplitFn
  String.prototype.split = function (
    this: string,
    separator: string | RegExp,
    limit?: number,
  ): string[] {
    const words = original.call(this, separator, limit)
    if (this === transcript) return words.slice(0, -1)
    return words
  } as unknown as typeof String.prototype.split
  try {
    vi.resetModules()
    return await import(modulePath)
  } finally {
    String.prototype.split = original as unknown as typeof String.prototype.split
    vi.resetModules()
  }
}

/** The first transcript of each batch, exactly as the module spells it. */
const MODULES: Array<[string, string, string]> = [
  [
    'listeningExtra',
    '../../../src/content/listeningExtra',
    'Bookings open six weeks ahead on the first of the month, and the facility is then running at about seventy per cent capacity.',
  ],
  [
    'listeningExtra2',
    '../../../src/content/listeningExtra2',
    'Transfer after two o clock, please, because before that the cardiology team are in clinic and there is nobody to review the trace.',
  ],
  [
    'listeningExtra3',
    '../../../src/content/listeningExtra3',
    'Then you are in the monthly review group, which means the prescription is due for a check before we issue it.',
  ],
  [
    'listeningExtra4',
    '../../../src/content/listeningExtra4',
    'Report to the ground reception, not the first floor, because the duty surgery is upstairs.',
  ],
  [
    'listeningExtra5',
    '../../../src/content/listeningExtra5',
    'The plastic card follows by email within three working days of the application.',
  ],
  [
    'listeningExtra6',
    '../../../src/content/listeningExtra6',
    'Do not reprint the entire file. Note the machine number and report it, because jammed pages are refunded automatically once the report is flagged.',
  ],
  [
    'listeningExtra8',
    '../../../src/content/listeningExtra8',
    'Ninety pounds for the closure order and nothing for the notice. Pay online, and the permit and the road signs arrive ten days before, provided the insurance certificate reaches us by then.',
  ],
]

describe.each(MODULES)('the %s bank', (_name, modulePath, transcript) => {
  it('refuses to build an item that is not a two-word substitution', async () => {
    const built = rebuildWithShortenedTranscript(modulePath, transcript)
    await expect(built).rejects.toThrow(/expected a two-word substitution/)
  })

  it('names the item it refused', async () => {
    const built = rebuildWithShortenedTranscript(modulePath, transcript)
    await expect(built).rejects.toThrow(/^hiw-/)
  })
})
