import type { HighlightIncorrectItem, HighlightSummaryItem, SituationItem } from './schema'

/**
 * Final top-up for the listening types still sitting below twice their per-test
 * count: Respond to a Situation, Highlight Correct Summary and Highlight
 * Incorrect Words. Each is attached to an existing script, so no new audio is
 * needed and the collections stay aligned with what can actually be played.
 */

/** Same derivation rule as the originals: a two-word substitution, indices computed. */
function derived(id: string, audioId: string, transcript: string, correctTranscript: string) {
  const shown = transcript.split(/\s+/)
  const actual = correctTranscript.split(/\s+/)
  const diff = shown.reduce<number[]>((acc, w, i) => (w === actual[i] ? acc : [...acc, i]), [])
  if (shown.length !== actual.length || diff.length !== 2) {
    throw new Error(`${id}: expected a two-word substitution, got ${diff.length} differences`)
  }
  return { id, audioId, transcript, correctTranscript, incorrect: diff }
}

export const EXTRA_SITUATIONS_2: SituationItem[] = [
  {
    id: 'rts-clinic-1',
    situation:
      'You have been asked to cover a colleague’s shift the evening before an assessment you are sitting the next morning, and you have already begun revising.',
    prompt:
      'Respond to the situation. Speak for between 40 and 90 seconds. You may ask for the time back, explain your circumstances, and propose a compromise.',
    reference:
      'A student in this position should not simply accept or refuse. A strong response states the assessment and the revision already done, asks whether the shift could be swapped with someone else rather than handed on, and offers a partial commitment such as the first three hours. It should acknowledge the colleague directly rather than complaining about the request, and confirm the arrangement in writing.',
    keyTerms: ['assessment', 'revising', 'swap', 'partial', 'colleague', 'confirm'],
    minWords: 40,
  },
  {
    id: 'rts-transfer-1',
    situation:
      'You have applied to transfer onto a different course and have been told the application may take four weeks. You have been offered a place on a short course that starts next week and would mean paying again later.',
    prompt:
      'Respond to the situation. Speak for between 40 and 90 seconds. You may ask about deadlines, explain your circumstances, and say what you would prefer to do.',
    reference:
      'A student in this position should give the office the information they need to act, which is the transfer application date and the acceptance deadline for the short course. A strong response asks whether the four weeks can be shortened or whether the short place can be held, explains that paying twice is the obstacle rather than the study itself, and asks for the answer in writing so it can be weighed against the deadline.',
    keyTerms: ['four weeks', 'deadline', 'pay again', 'shorten', 'in writing', 'application'],
    minWords: 40,
  },
  {
    id: 'rts-loan-1',
    situation:
      'The amount you were quoted for a repair is more than half the value of the item, and the manufacturer has confirmed the part is available but at that price.',
    prompt:
      'Respond to the situation. Speak for between 40 and 90 seconds. You may explain what you have found, ask what options exist, and say what you would like to happen.',
    reference:
      'A customer in this position should state the comparison plainly — the repair cost against the replacement value — rather than only the cost, because that is the fact the provider needs. A strong response asks what access to a cheaper part would require, whether the item can be made safe to use in the meantime, and for the quotation in writing, without accepting or refusing outright.',
    keyTerms: ['repair cost', 'replacement value', 'cheaper part', 'safe to use', 'in writing', 'quotation'],
    minWords: 40,
  },
]


export const EXTRA_HIGHLIGHT_INCORRECT_2: HighlightIncorrectItem[] = [
  derived(
    'hiw-clinic-2',
    'con-clinic-handover',
    'Transfer after two o clock, please, because before that the cardiology team are in clinic and there is nobody to review the trace.',
    'Transfer after four o clock, please, because before that the cardiology team are in clinic and there is nobody to review the record.',
  ),
  derived(
    'hiw-transfer-1',
    'con-course-transfer',
    'Accommodation priority is based on your year of study and length of stay, not on the subject of your course.',
    'Accommodation priority is based on your year of study and length of stay, not on the length of the course.',
  ),
  derived(
    'hiw-library-2',
    'con-library-fine',
    'I can see the trolley record puts it on a shelf on the Friday, so it was definitely on site from the Thursday onwards.',
    'I can see the trolley record puts it on a shelf on the Tuesday, so it was definitely on site from the Wednesday onwards.',
  ),
]