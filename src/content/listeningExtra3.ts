import type {
  AudioScript,
  DictationItem,
  HighlightIncorrectItem,
  HighlightSummaryItem,
  ListeningMcqItem,
  MissingWordItem,
  SituationItem,
} from './schema'

/**
 * A further batch of listening material: three conversations carrying items
 * across six collections, plus extra situations.
 *
 * Summarize Group Discussion and Write from Dictation sit lowest against their
 * per-test counts, so two group discussions and four dictation items are
 * included here alongside the multiple choice and highlight sets.
 *
 * Distractors follow the pattern the format actually uses: each wrong option is
 * built from something the speakers do say, altered in one specific way, so it
 * has to be rejected by listening rather than by noticing it was invented.
 */
export const EXTRA_CONVERSATIONS_3: AudioScript[] = [
  {
    id: 'con-pharmacy-repeat',
    title: 'Collecting a repeat prescription',
    kind: 'conversation',
    topic: 'Health services',
    scene: 'A patient phones a pharmacy about a repeat prescription.',
    speakers: [
      { id: 'a', name: 'Patient', role: 'Caller', voiceHint: 'high' },
      { id: 'b', name: 'Pharmacist', role: 'Pharmacy', voiceHint: 'mid' },
    ],
    turns: [
      {
        speaker: 'a',
        text: 'I have been on this medication for about two years and my prescription is due this week. Can I collect it as usual?',
      },
      {
        speaker: 'b',
        text: 'I can check that for you. Is this the one for blood pressure, the one beginning with amlodipine?',
      },
      {
        speaker: 'a',
        text: 'That is right. I have had a monthly review by phone for the last year, and nothing has changed.',
      },
      {
        speaker: 'b',
        text: 'Then you are in the annual review group, which means the prescription is due for a review before we can issue another thirty days.',
      },
      {
        speaker: 'a',
        text: 'Does that mean I need to see somebody in person?',
      },
      {
        speaker: 'b',
        text: 'Not necessarily. Most reviews are done by telephone, and the one you are due is routine, so I can book it for a twenty minute slot rather than a full appointment.',
      },
      {
        speaker: 'a',
        text: 'And will I run out before then?',
      },
      {
        speaker: 'b',
        text: 'You have four days of tablets left, so we are fine on that. If you were down to a day or two we could usually supply an emergency supply, but it is not needed here.',
      },
      {
        speaker: 'a',
        text: 'Right. Is there anything I should bring to the call?',
      },
      {
        speaker: 'b',
        text: 'Your blood pressure readings would help, and a list of anything you have bought for a cold since we last spoke. Nothing else is required.',
      },
    ],
    keyTerms: ['annual review', 'telephone', 'days left', 'emergency supply', 'readings', 'prescription'],
  },

  {
    id: 'con-theatre-booking',
    title: 'Booking seats at a repertory theatre',
    kind: 'conversation',
    topic: 'Arts and events',
    scene: 'A caller books seats with a theatre box office.',
    speakers: [
      { id: 'a', name: 'Caller', role: 'Caller', voiceHint: 'high' },
      { id: 'b', name: 'Box office', role: 'Theatre', voiceHint: 'mid' },
    ],
    turns: [
      {
        speaker: 'a',
        text: 'I would like to book tickets for the revival next month. Is there a performance that is suitable for a seven year old?',
      },
      {
        speaker: 'b',
        text: 'The Wednesday matinee is the recommended one for younger audiences. It runs a little under two hours including the interval, and the content has been cut from the original.',
      },
      {
        speaker: 'a',
        text: 'And is the theatre suitable for someone who cannot manage loud sound?',
      },
      {
        speaker: 'b',
        text: 'The main auditorium is fine at that performance, because there is no amplified sound in the interval. The Friday evening version does use it, so I would avoid that one.',
      },
      {
        speaker: 'a',
        text: 'How far ahead do I need to book for a good position?',
      },
      {
        speaker: 'b',
        text: 'About three weeks for the centre of the stalls. Two days before, you can still get seats but they will be at the ends.',
      },
      {
        speaker: 'a',
        text: 'Is there a concession for the child?',
      },
      {
        speaker: 'b',
        text: 'Under twelves are half price on the Wednesday only. Concessions do not apply to the evening performances.',
      },
      {
        speaker: 'a',
        text: 'Two adult and one child for the Wednesday matinee, ideally in the centre.',
      },
      {
        speaker: 'b',
        text: 'I can put a hold on rows F to H for twenty minutes while you decide. The total comes to fifty-four pounds with the concession applied.',
      },
    ],
    keyTerms: ['Wednesday matinee', 'interval', 'amplified sound', 'three weeks', 'concession', 'hold'],
  },

  {
    id: 'con-rental-contract',
    title: 'Reading a tenancy agreement',
    kind: 'conversation',
    topic: 'Housing',
    scene: 'Two people talk through a tenancy agreement.',
    speakers: [
      { id: 'a', name: 'Tenant', role: 'Tenant', voiceHint: 'high' },
      { id: 'b', name: 'Friend', role: 'Friend', voiceHint: 'low' },
    ],
    turns: [
      {
        speaker: 'a',
        text: 'Clause seven says I have to give a month of notice in writing. Does that mean a full calendar month, or thirty days?',
      },
      {
        speaker: 'b',
        text: 'It says one month, and it does not define it, which is the problem. Most agreements of this type mean a full calendar month, which is longer than thirty days.',
      },
      {
        speaker: 'a',
        text: 'How much longer?',
      },
      {
        speaker: 'b',
        text: 'If you serve notice on the thirty-first, a calendar month takes you to the end of the following month, so thirty-two days. If you serve it on the first, it is twenty-eight.',
      },
      {
        speaker: 'a',
        text: 'That is a significant difference. What about the break clause?',
      },
      {
        speaker: 'b',
        text: 'The break clause is in the schedule, not the agreement, and it is conditional: you can only serve notice in the first six months, and only if the rent is not more than thirty days late.',
      },
      {
        speaker: 'a',
        text: 'I was thirty-one days late in the second month.',
      },
      {
        speaker: 'b',
        text: 'Then the break clause is not available to you this year, whatever else is true. That is worth knowing before you plan around it.',
      },
      {
        speaker: 'a',
        text: 'And the deposit? It says protected in a government scheme.',
      },
      {
        speaker: 'b',
        text: 'Check the scheme name against the one on the deposit certificate you were given. They must match, or the deposit is not protected.',
      },
    ],
    keyTerms: ['notice', 'calendar month', 'break clause', 'conditional', 'late', 'deposit scheme'],
  },
]

export const EXTRA_LISTENING_MCQ_SINGLE_3: ListeningMcqItem[] = [
  {
    id: 'lmcq-pharmacy-1',
    audioId: 'con-pharmacy-repeat',
    question: 'What does the pharmacist say about the prescription?',
    options: [
      'It cannot be issued until the annual review is done',
      'It is due for a repeat check in six months',
      'It has been renewed for another year already',
      'It has been moved to a different pharmacy',
    ],
    correct: ['It cannot be issued until the annual review is done'],
  },
  {
    id: 'lmcq-theatre-1',
    audioId: 'con-theatre-booking',
    question: 'What does the box office say about the Wednesday matinee?',
    options: [
      'It runs under two hours with content cut from the original',
      'It is longer than the evening performance',
      'It has no interval at all',
      'It is recommended for older audiences only',
    ],
    correct: ['It runs under two hours with content cut from the original'],
  },
  {
    id: 'lmcq-rental-1',
    audioId: 'con-rental-contract',
    question: 'According to the friend, how long is a full calendar month?',
    options: ['Thirty days exactly', 'Between twenty eight and thirty two days', 'Always thirty one days', 'Six weeks'],
    correct: ['Between twenty eight and thirty two days'],
  },
]

export const EXTRA_LISTENING_MCQ_MULTI_3: ListeningMcqItem[] = [
  {
    id: 'lmcm-pharmacy-1',
    audioId: 'con-pharmacy-repeat',
    question: 'Which two things does the pharmacist ask the patient to have ready for the review?',
    options: [
      'Their blood pressure readings',
      'A list of anything bought for a cold',
      'Their previous prescription slip',
      'A confirmation of their home address',
      'Their insurance number',
    ],
    correct: ['Their blood pressure readings', 'A list of anything bought for a cold'],
  },
  {
    id: 'lmcm-rental-1',
    audioId: 'con-rental-contract',
    question: 'Which two conditions does the break clause impose?',
    options: [
      'Notice may be served only in the first six months',
      'Rent must not be more than thirty days late',
      'Notice must be given in person',
      'The deposit must be protected',
      'The rent must be paid quarterly',
    ],
    correct: ['Notice may be served only in the first six months', 'Rent must not be more than thirty days late'],
  },
]

export const EXTRA_HIGHLIGHT_SUMMARY_3: HighlightSummaryItem[] = [
  {
    id: 'hcs-pharmacy-1',
    audioId: 'con-pharmacy-repeat',
    question: 'Select the correct summary of the conversation.',
    options: [
      'The patient asks about a repeat prescription, the pharmacist confirms it is due an annual review before another thirty days can be issued, explains the review will be by telephone, confirms four days of tablets are left so no emergency supply is needed, and asks for readings and a list of cold remedies.',
      'The patient asks about a repeat prescription, the pharmacist issues another thirty days immediately, explains the review will need a full appointment in person, and notes that only two days of tablets remain so an emergency supply is required.',
      'The patient asks whether the medication can be changed, the pharmacist says it cannot be changed without a full appointment in person, and asks the patient to collect the prescription from the counter during opening hours.',
      'The patient asks for an emergency supply, the pharmacist says it is not needed because four days of tablets are left, and books a full appointment at the surgery for the following week instead.',
    ],
    correct: 0,
  },
  {
    id: 'hcs-rental-1',
    audioId: 'con-rental-contract',
    question: 'Select the correct summary of the conversation.',
    options: [
      'The tenant asks what a month of notice means and whether the break clause is available, and the friend explains that a calendar month runs to thirty two days at worst and that having been thirty one days late makes the break clause unavailable this year.',
      'The tenant asks what a month of notice means and whether the break clause is available, and the friend explains that notice always runs for thirty days and that being thirty one days late still allows the break clause to be used.',
      'The tenant asks about the deposit and the break clause, and the friend confirms the break clause is available in the first six months provided the rent is current, and that the deposit is protected in the scheme named on the certificate.',
      'The tenant asks whether the agreement can be ended early, and the friend explains that a full calendar month of notice is required in every case, and that the deposit scheme name must match the certificate exactly.',
    ],
    correct: 0,
  },
]

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

export const EXTRA_HIGHLIGHT_INCORRECT_3: HighlightIncorrectItem[] = [
  derived(
    'hiw-pharmacy-1',
    'con-pharmacy-repeat',
    'Then you are in the monthly review group, which means the prescription is due for a check before we issue it.',
    'Then you are in the annual review group, which means the prescription is due for a review before we issue it.',
  ),
  derived(
    'hiw-theatre-1',
    'con-theatre-booking',
    'About three weeks for the centre of the stalls, and two days before you can still get seats behind.',
    'About three months for the rear of the stalls, and two days before you can still get seats behind.',
  ),
  derived(
    'hiw-rental-1',
    'con-rental-contract',
    'The break clause is in the schedule, and it is conditional on when notice can be served.',
    'The break clause is in the agreement, and it is conditional on how notice can be served.',
  ),
]

export const EXTRA_DICTATION_3: DictationItem[] = [
  { id: 'wfd-pharmacy-1', audioId: 'con-pharmacy-repeat', turnIndex: 2, text: 'That is right. I have had a monthly review by phone for the last year, and nothing has changed.' },
  { id: 'wfd-theatre-1', audioId: 'con-theatre-booking', turnIndex: 2, text: 'And is the theatre suitable for someone who cannot manage loud sound?' },
  { id: 'wfd-rental-1', audioId: 'con-rental-contract', turnIndex: 3, text: 'If you serve notice on the thirty-first, a calendar month takes you to the end of the following month, so thirty-two days.' },
  { id: 'wfd-rental-2', audioId: 'con-rental-contract', turnIndex: 7, text: 'Then the break clause is not available to you this year, whatever else is true.' },
]

export const EXTRA_MISSING_WORD_3: MissingWordItem[] = [
  { id: 'smw-pharmacy-1', audioId: 'con-pharmacy-repeat', turnIndex: 5, wordIndex: 7, options: ['usually', 'unusual', 'usuallyly', 'user'], correct: 0 },
  { id: 'smw-theatre-1', audioId: 'con-theatre-booking', turnIndex: 5, wordIndex: 6, options: ['ahead', 'head', 'aheadly', 'heade'], correct: 0 },
  { id: 'smw-rental-1', audioId: 'con-rental-contract', turnIndex: 1, wordIndex: 10, options: ['define', 'refine', 'defined', 'defining'], correct: 0 },
]

export const EXTRA_SITUATIONS_3: SituationItem[] = [
  {
    id: 'rts-rental-1',
    situation:
      'You have signed a tenancy agreement and, a week later, you have been offered a place on a course that requires you to move city.',
    prompt:
      'Respond to the situation. Speak for between 40 and 90 seconds. You may explain the situation, ask what happens to the agreement, and say what you would prefer to do.',
    reference:
      'A tenant in this position should state the new situation plainly and the date by which they would need to leave. A strong response asks specifically what the notice period requires, whether serving it now would still be within the term, and what would happen to the deposit, rather than assuming the agreement simply ends. It should also ask when the notice must be served to avoid being committed to a further term.',
    keyTerms: ['notice period', 'serving', 'deposit', 'term', 'date', 'prefer'],
    minWords: 40,
  },
  {
    id: 'rts-theatre-1',
    situation:
      'You have bought four tickets for a performance and, two days before, the person you were going with can no longer come.',
    prompt:
      'Respond to the situation. Speak for between 40 and 90 seconds. You may explain what has happened, ask about transferring the ticket, and say what you would like to arrange.',
    reference:
      'A customer in this position should explain the change briefly and ask the specific question, which is whether the unused ticket can be transferred to someone else or whether it can be resold through the box office. A strong response asks about both routes in one exchange, notes the conditions attached to each if they are stated, and confirms whether a refund would apply if neither is possible.',
    keyTerms: ['transferred', 'resold', 'refund', 'unused', 'conditions', 'exchange'],
    minWords: 40,
  },
]