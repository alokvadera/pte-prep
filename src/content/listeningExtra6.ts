import type {
  DictationItem,
  HighlightIncorrectItem,
  HighlightSummaryItem,
  ListeningFibItem,
  ListeningMcqItem,
  MissingWordItem,
  SituationItem,
} from './schema'

/**
 * Sixth listening batch: items derived from recordings that already exist
 * in the bank — four lectures and eleven conversations — so every audioId
 * resolves in the AUDIO_INDEX and no item plays in silence.
 *
 * The derivation rules are the ones the rest of the bank follows:
 * - Write from Dictation quotes a turn verbatim, as a substring check.
 * - Select Missing Word targets a counted token; every option shares the
 *   first three letters of the answer, so the choice is confusable.
 * - Highlight Incorrect Words substitutes exactly two words of a real
 *   turn, and the differing indices are computed, never stored by hand.
 * - Fill in the Blanks (Listening) blanks a transcript excerpt, with one
 *   accepted spelling per marker.
 * - Highlight Correct Summary keeps all four options within a few words
 *   of each other, and each distractor alters one checkable detail.
 * - Multiple choice carries one correct option (single) or two (multiple).
 * - Respond to a Situation is standalone, so it needs no audioId.
 */

// ---------------------------------------------------------------------------
// Write from Dictation
// ---------------------------------------------------------------------------

export const EXTRA_DICTATION_6: DictationItem[] = [
  {
    id: 'wfd-601',
    audioId: 'lec-bees',
    turnIndex: 1,
    text: 'Each stressor multiplies the others rather than adding to them.',
  },
  {
    id: 'wfd-602',
    audioId: 'con-bus-pass',
    turnIndex: 5,
    text: 'The first replacement in an academic year costs twelve pounds.',
  },
  {
    id: 'wfd-603',
    audioId: 'lec-shift-work',
    turnIndex: 1,
    text: 'The circadian system controls far more than sleep.',
  },
  {
    id: 'wfd-604',
    audioId: 'con-supervisor-meeting',
    turnIndex: 4,
    text: 'One reviewer will ask why I did not use the longitudinal data.',
  },
  {
    id: 'wfd-605',
    audioId: 'con-flatmate-notice',
    turnIndex: 4,
    text: 'Should we offer the room at the same rent?',
  },
]

// ---------------------------------------------------------------------------
// Select Missing Word
// ---------------------------------------------------------------------------

export const EXTRA_MISSING_WORD_6: MissingWordItem[] = [
  {
    id: 'smw-601',
    audioId: 'con-pharmacy-repeat',
    turnIndex: 5,
    wordIndex: 25,
    options: ['slot', 'sloth', 'slope', 'slow'],
    correct: 0,
  },
  {
    id: 'smw-602',
    audioId: 'lec-seedbank',
    turnIndex: 1,
    wordIndex: 17,
    options: ['storage', 'store', 'storm', 'story'],
    correct: 0,
  },
  {
    id: 'smw-603',
    audioId: 'con-volcano-visit',
    turnIndex: 7,
    wordIndex: 22,
    options: ['refill', 'refund', 'refuge', 'refresh'],
    correct: 0,
  },
  {
    id: 'smw-604',
    audioId: 'con-gym-membership',
    turnIndex: 7,
    wordIndex: 11,
    options: ['begins', 'begin', 'begun', 'begets'],
    correct: 0,
  },
  {
    id: 'smw-605',
    audioId: 'con-archive-visit',
    turnIndex: 7,
    wordIndex: 21,
    options: ['retrieved', 'returned', 'retried', 'retained'],
    correct: 0,
  },
]

// ---------------------------------------------------------------------------
// Highlight Incorrect Words
// ---------------------------------------------------------------------------

/**
 * Same derivation rule as every other batch: the stored indices are the
 * scoring key, so they are computed from the pair rather than written by
 * hand. A mistyped substitution becomes a module-load error instead of an
 * item nobody can answer correctly.
 */
function derived6(id: string, audioId: string, transcript: string, correctTranscript: string) {
  const shown = transcript.split(/\s+/)
  const actual = correctTranscript.split(/\s+/)
  const diff = shown.reduce<number[]>((acc, w, i) => (w === actual[i] ? acc : [...acc, i]), [])
  if (shown.length !== actual.length || diff.length !== 2) {
    throw new Error(`${id}: expected a two-word substitution, got ${diff.length} differences`)
  }
  return { id, audioId, transcript, correctTranscript, incorrect: diff }
}

export const EXTRA_HIGHLIGHT_INCORRECT_6: HighlightIncorrectItem[] = [
  derived6(
    'hiw-601',
    'con-volcano-visit',
    'Not at the moment. We monitor the tremor continuously and the summit is currently closed. If the wind direction changes, we turn back — we do not wait. In the last three years we have turned back once, and both times it was within an hour of departure.',
    'Not at the moment. We monitor the tremor continuously and the summit is currently open. If the wind direction changes, we turn back — we do not wait. In the last three years we have turned back twice, and both times it was within an hour of departure.',
  ),
  derived6(
    'hiw-602',
    'con-theatre-booking',
    'I can put a hold on rows F to H for twenty seconds while you decide. The total comes to forty-five pounds with the concession applied.',
    'I can put a hold on rows F to H for twenty minutes while you decide. The total comes to fifty-four pounds with the concession applied.',
  ),
  derived6(
    'hiw-603',
    'con-bike-hire',
    'Let me look at the report. The charge was made by the mechanic who inspected the bike, so I can see why it was applied, but I can also see the inspection photographs, and there is some damage visible on the light housing.',
    'Let me look at the report. The charge was raised by the mechanic who inspected the bike, so I can see why it was applied, but I can also see the inspection photographs, and there is no damage visible on the light housing.',
  ),
  derived6(
    'hiw-604',
    'lec-drought',
    'So the priority in a drying climate is glamorous. Measure every abstraction, publish the accounts, and only then build the market on top. A drought plan that begins with prices and ends with meters has the sequence forwards, and the driest years are when backwards plans fail first. Thank you.',
    'So the priority in a drying climate is unglamorous. Measure every abstraction, publish the accounts, and only then build the market on top. A drought plan that begins with prices and ends with meters has the sequence backwards, and the driest years are when backwards plans fail first. Thank you.',
  ),
  derived6(
    'hiw-605',
    'con-printer-credits',
    'Do not reprint the entire file. Note the machine number and report it, because jammed pages are refunded automatically once the report is flagged.',
    'Do not reprint the whole file. Note the machine number and report it, because jammed pages are refunded automatically once the report is logged.',
  ),
]

// ---------------------------------------------------------------------------
// Fill in the Blanks (Listening)
// ---------------------------------------------------------------------------

export const EXTRA_LISTENING_FIB_6: ListeningFibItem[] = [
  {
    id: 'fibl-601',
    audioId: 'con-module-change',
    startTurn: 1,
    text: 'You can, because switches are allowed until the end of week ______ . After Friday the enrolment locks and no changes are possible. Research methods repeats its first two weeks as a catch-up block in week ______ , precisely for students who transfer late. You will not be behind.',
    answers: [['three'], ['four']],
  },
  {
    id: 'fibl-602',
    audioId: 'lec-antibiotics',
    startTurn: 1,
    text: 'The economics are not mysterious. Penicillin-type drugs are cheap to produce and have been for decades, which means that generic manufacturers have no reason to enter a market, and the firms that did supply the active ingredient have been free to exit it when it became unprofitable. What remains is a supply chain with very few ______ , and in a supply chain with few nodes, the loss of one is not a shortage. It is a ______.',
    answers: [['nodes'], ['gap']],
  },
  {
    id: 'fibl-603',
    audioId: 'con-bus-pass',
    startTurn: 3,
    text: 'If you apply online before ______ , the digital pass is active the same evening. The plastic card follows by ______ within five working days. The first replacement in an academic year costs twelve ______ . A second one costs ______ , which is meant to encourage people to look a little harder.',
    answers: [['noon'], ['post'], ['pounds'], ['twenty-five']],
  },
  {
    id: 'fibl-604',
    audioId: 'con-supervisor-meeting',
    startTurn: 1,
    text: 'Freeze the ______ , not the sentences. Fix your headings and the word budget per section now, and allow the wording to move until the results are stable. Answer it in one paragraph before they ask. State the reason — access was ______ in March — give the consequence, and name what you did instead. Reviewers pursue what you appear to hide.',
    answers: [['structure'], ['withdrawn']],
  },
  {
    id: 'fibl-605',
    audioId: 'con-field-station',
    startTurn: 7,
    text: 'The main house has central heating throughout, but the annexe has no ______ — only portable heaters, which we provide. The annexe is cheaper by about thirty per ______ , and most groups take a mix of the two. The deposit is two weeks of the quoted rate. It is ______ , and in practice it has been refunded every year except once, when a room was damaged.',
    answers: [['heating'], ['cent'], ['refundable']],
  },
]

// ---------------------------------------------------------------------------
// Highlight Correct Summary
// ---------------------------------------------------------------------------

export const EXTRA_HIGHLIGHT_SUMMARY_6: HighlightSummaryItem[] = [
  {
    id: 'hcs-601',
    audioId: 'con-theatre-booking',
    question: 'Select the correct summary of the conversation.',
    options: [
      'A caller asks about taking a seven year old to the revival, and the box office recommends the Wednesday matinee, which runs under two hours with cut content and no amplified sound in the interval, notes three weeks is needed for the centre of the stalls, and holds rows F to H while the total comes to fifty-four pounds.',
      'A caller asks about taking a seven year old to the revival, and the box office recommends the Friday evening performance, which runs under two hours with cut content and no amplified sound in the interval, notes three weeks is needed for the centre of the stalls, and holds rows F to H while the total comes to fifty-four pounds.',
      'A caller asks about taking a seven year old to the revival, and the box office recommends the Wednesday matinee, which runs under two hours with cut content and no amplified sound in the interval, notes three weeks is needed for the centre of the stalls, and holds rows A to C while the total comes to fifty-four pounds.',
      'A caller asks about taking a seven year old to the revival, and the box office recommends the Wednesday matinee, which runs under two hours with cut content and no amplified sound in the interval, notes one week is needed for the centre of the stalls, and holds rows F to H while the total comes to forty-four pounds.',
    ],
    correct: 0,
  },
  {
    id: 'hcs-602',
    audioId: 'con-printer-credits',
    question: 'Select the correct summary of the conversation.',
    options: [
      'A student with a zero balance is told to top up through the student portal because those payments clear instantly, that eighty single-sided pages cost four pounds eighty, and that a jammed print is refunded once the machine number is reported.',
      'A student with a zero balance is told to top up at the machines because those payments clear instantly, that eighty single-sided pages cost four pounds eighty, and that any jammed print is refunded once the machine number is reported.',
      'A student with a zero balance is told to top up through the student portal because those payments clear instantly, that eighty single-sided pages cost six pounds eighty, and that a jammed print is refunded once the machine number is reported.',
      'A student with a zero balance is told to top up through the student portal because those payments clear within an hour, that eighty single-sided pages cost four pounds eighty, and that a jammed print is refunded once the machine number is reported.',
    ],
    correct: 0,
  },
  {
    id: 'hcs-603',
    audioId: 'lec-bees',
    question: 'Select the correct summary of the lecture.',
    options: [
      'The lecturer argues that pollinator decline has no single cause because pesticide, habitat and disease pressures multiply one another, that single-factor bans disappoint as exposure shifts to substitutes, and that trials show recovery only when reduced exposure is combined with restored habitat.',
      'The lecturer argues that pollinator decline has no single cause because pesticide, habitat and disease pressures multiply one another, that single-factor bans disappoint as exposure shifts to substitutes, and that trials show recovery only when reduced exposure is combined with fresh funding.',
      'The lecturer argues that pollinator decline has no single cause because pesticide, habitat and disease pressures multiply one another, that single-factor bans succeed by removing the worst pesticide entirely, and that trials show recovery only when reduced exposure is combined with restored habitat.',
      'The lecturer argues that pollinator decline has no single cause because pesticide, habitat and disease pressures multiply one another, that single-factor bans disappoint as exposure shifts to substitutes, and that growers should budget pollination as a free service rather than a secured input.',
    ],
    correct: 0,
  },
  {
    id: 'hcs-604',
    audioId: 'con-bus-pass',
    question: 'Select the correct summary of the conversation.',
    options: [
      'A student who lost a photo pass learns the old one is cancelled when the replacement is issued, that applying online before noon activates a digital pass that evening, that the first replacement costs twelve pounds, and that the original zones are kept.',
      'A student who lost a photo pass learns the old one stays valid for a month, that applying online before noon activates a digital pass that evening, that the first replacement costs twelve pounds, and that the original zones are kept.',
      'A student who lost a photo pass learns the old one is cancelled when the replacement is issued, that applying online before noon activates a digital pass that evening, that the first replacement costs twenty-five pounds, and that the original zones are kept.',
      'A student who lost a photo pass learns the old one is cancelled when the replacement is issued, that applying online before noon activates a digital pass that evening, that the first replacement costs twelve pounds, and that the hospital extension is removed.',
    ],
    correct: 0,
  },
  {
    id: 'hcs-605',
    audioId: 'lec-recycling-myth',
    question: 'Select the correct summary of the lecture.',
    options: [
      'The lecturer argues that a rising recycling rate measures what enters the bin rather than what becomes a new product, that the gap comes from packaging, contamination and lost export markets, and that councils should publish separate profitable, break-even and loss-making rates.',
      'The lecturer argues that a rising recycling rate measures what enters the bin rather than what becomes a new product, that the gap comes from packaging, contamination and lost export markets, and that councils should publish a single blended rate to avoid confusion.',
      'The lecturer argues that a rising recycling rate measures what becomes a new product rather than what enters the bin, that the gap comes from packaging, contamination and lost export markets, and that councils should publish separate profitable, break-even and loss-making rates.',
      'The lecturer argues that a rising recycling rate measures what enters the bin rather than what becomes a new product, that the gap comes from packaging, contamination and lost export markets, and that councils should charge households by the weight of their bins.',
    ],
    correct: 0,
  },
]

// ---------------------------------------------------------------------------
// Listening Multiple Choice — single answer
// ---------------------------------------------------------------------------

export const EXTRA_LISTENING_MCQ_SINGLE_6: ListeningMcqItem[] = [
  {
    id: 'lmcqs-601',
    audioId: 'con-pharmacy-repeat',
    question: 'How many days of tablets does the patient have left?',
    options: ['Four days', 'Two days', 'Seven days', 'Ten days'],
    correct: ['Four days'],
  },
  {
    id: 'lmcqs-602',
    audioId: 'con-theatre-booking',
    question: 'What does the box office say about the Friday evening performance?',
    options: [
      'It uses amplified sound in the interval',
      'It runs for under two hours only',
      'It is half price for under-twelves',
      'It is the recommended one for children',
    ],
    correct: ['It uses amplified sound in the interval'],
  },
  {
    id: 'lmcqs-603',
    audioId: 'con-parking-permit',
    question: 'When does the council ask for the council tax bill or a utility statement?',
    options: [
      'After the first month',
      'From the day of application',
      'After six months',
      'Only at renewal time',
    ],
    correct: ['After the first month'],
  },
  {
    id: 'lmcqs-604',
    audioId: 'lec-shift-work',
    question: 'According to the lecturer, what do forward-rotating rosters allow?',
    options: [
      'The clock to adjust in its preferred direction',
      'Nurses to eat at any hour',
      'The total hours slept to fall',
      'The inflammatory response to disappear',
    ],
    correct: ['The clock to adjust in its preferred direction'],
  },
  {
    id: 'lmcqs-605',
    audioId: 'con-module-change',
    question: 'What does the administrator say about the week two work in either module?',
    options: [
      'It is formative only and does not count',
      'It counts fully toward the final grade',
      'It transfers automatically to the new module',
      'It must be resubmitted after the switch',
    ],
    correct: ['It is formative only and does not count'],
  },
]

// ---------------------------------------------------------------------------
// Listening Multiple Choice — multiple answers
// ---------------------------------------------------------------------------

export const EXTRA_LISTENING_MCQ_MULTIPLE_6: ListeningMcqItem[] = [
  {
    id: 'lmcqm-601',
    audioId: 'con-flatmate-notice',
    question: 'Which two costs does Jonas face if he leaves in June? Select TWO.',
    options: [
      'Rent until a replacement tenant signs',
      'An early cancellation fee on the broadband contract',
      'A re-listing fee charged by the landlord',
      'A penalty for giving less than six weeks of notice',
      'The full remaining rent until September regardless',
    ],
    correct: [
      'Rent until a replacement tenant signs',
      'An early cancellation fee on the broadband contract',
    ],
  },
  {
    id: 'lmcqm-602',
    audioId: 'con-dental-appointment',
    question: 'Which two statements about the emergency appointment are true? Select TWO.',
    options: [
      'The morning emergency slot has already been taken',
      "The afternoon slot offered is four o'clock",
      'The patient will be seen by her usual dentist',
      'The examination and all treatment are free for plan members',
      'The duty dentist today is Dr Patel',
    ],
    correct: [
      'The morning emergency slot has already been taken',
      'The duty dentist today is Dr Patel',
    ],
  },
  {
    id: 'lmcqm-603',
    audioId: 'con-bike-hire',
    question:
      'Which two facts does the support agent establish about the front-light charge? Select TWO.',
    options: [
      'The charge was raised by the mechanic who inspected the bike',
      'No damage is visible on the light housing in the photographs',
      'The customer had reported the light broken before returning it',
      'The charge will remain on the account for a year',
      'The mechanic confirmed the light was damaged on return',
    ],
    correct: [
      'The charge was raised by the mechanic who inspected the bike',
      'No damage is visible on the light housing in the photographs',
    ],
  },
  {
    id: 'lmcqm-604',
    audioId: 'lec-antibiotic',
    question: 'Which two routes by which resistance arises does the lecturer describe? Select TWO.',
    options: [
      'A chromosomal mutation that already confers partial resistance',
      'Horizontal transfer of DNA taken up from the environment',
      'Overuse of hand sanitiser in hospital wards',
      'A spontaneous loss of the bacterial cell wall',
      'Vaccination of the patient population',
    ],
    correct: [
      'A chromosomal mutation that already confers partial resistance',
      'Horizontal transfer of DNA taken up from the environment',
    ],
  },
  {
    id: 'lmcqm-605',
    audioId: 'con-archive-visit',
    question:
      'Which two conditions allow the visitor to order material on the same day? Select TWO.',
    options: [
      'The item is already in the reading room',
      'The order is placed before noon',
      'The item has been fully digitised',
      'The visitor holds a reference from an academic institution',
      'The order is placed before the reading room closes',
    ],
    correct: ['The item is already in the reading room', 'The order is placed before noon'],
  },
]

// ---------------------------------------------------------------------------
// Respond to a Situation
// ---------------------------------------------------------------------------

export const EXTRA_SITUATIONS_6: SituationItem[] = [
  {
    id: 'rts-601',
    situation:
      'You are a student. You submitted your essay through the online portal an hour before the deadline, but the portal shows it as missing and your tutor has emailed to ask whether you intend to submit.',
    prompt:
      'Respond to the situation. Speak for between 40 and 90 seconds. You may explain what happened, ask what evidence is needed, and say what you will do.',
    reference:
      "A student in this position should reply to the tutor promptly and calmly, state the time of submission and any confirmation number, and ask specifically what the portal shows on the tutor's side. A strong response offers to forward the submission receipt and the email confirmation, asks for a short extension if the file is genuinely missing, and follows up in writing so there is a record of the attempt.",
    keyTerms: ['portal', 'submission', 'confirmation', 'receipt', 'extension', 'record'],
    minWords: 40,
  },
  {
    id: 'rts-602',
    situation:
      'You booked a table for six at a restaurant to celebrate a birthday. On arrival you are told the booking was made for the wrong date, and the restaurant is fully booked for the next two hours.',
    prompt:
      'Respond to the situation. Speak for between 40 and 90 seconds. You may explain the occasion, ask what can be done, and say what you would accept.',
    reference:
      'A customer in this position should stay calm, show the booking confirmation, and ask the staff member to check whether any table can be freed up within a reasonable wait. A strong response asks what the restaurant can offer meanwhile, such as a drink at the bar, states plainly that the booking was made in good faith, and asks whether a later sitting or a takeaway option is possible if no table can be found.',
    keyTerms: ['booking', 'confirmation', 'wait', 'bar', 'sitting', 'good faith'],
    minWords: 40,
  },
  {
    id: 'rts-603',
    situation:
      'You work in a small office. The printer has run out of toner on the morning of a client presentation, and the replacement cartridge will not arrive until the following day.',
    prompt:
      'Respond to the situation. Speak for between 40 and 90 seconds. You may describe the problem, propose a solution, and say what you need from others.',
    reference:
      'An employee in this position should state the problem and the deadline plainly, then propose a concrete workaround, such as printing the handouts at a nearby copy shop or emailing the slides to the client in advance. A strong response asks a colleague to confirm which pages are essential, offers to pick up the printed copies personally, and notes the toner order so the office is not caught short again.',
    keyTerms: ['toner', 'deadline', 'workaround', 'copy shop', 'slides', 'colleague'],
    minWords: 40,
  },
  {
    id: 'rts-604',
    situation:
      'You are a volunteer at a community event. A visitor has lost their child in the crowd, is upset, and the event has just started its main performance.',
    prompt:
      'Respond to the situation. Speak for between 40 and 90 seconds. You may reassure the visitor, say what you will do, and ask for the information you need.',
    reference:
      "A volunteer in this position should stay calm and reassuring, ask for the child's name, age and what they were wearing, and tell the visitor exactly what will happen next. A strong response asks a colleague to alert the entrance and first-aid points, stays with the parent rather than leaving them alone, and avoids promising a timeframe you cannot control while making clear the search has already begun.",
    keyTerms: ['child', 'reassuring', 'wearing', 'entrance', 'first-aid', 'search'],
    minWords: 40,
  },
  {
    id: 'rts-605',
    situation:
      'You are a tenant. The heating in your flat stopped working during a cold spell, and the landlord has not replied to your message from two days ago.',
    prompt:
      'Respond to the situation. Speak for between 40 and 90 seconds. You may describe the problem, restate your request, and say what you will do next.',
    reference:
      'A tenant in this position should send a written message that states when the heating failed, the temperature inside the flat, and the date of the earlier message, and asks for a specific appointment time. A strong response asks whether an emergency repair can be authorised, offers access times that suit the landlord, and says clearly that the request is being treated as urgent because of the cold spell.',
    keyTerms: ['heating', 'cold spell', 'written message', 'appointment', 'urgent', 'access'],
    minWords: 40,
  },
  {
    id: 'rts-606',
    situation:
      "You ordered supplies for a workshop a month ago. The delivery arrived incomplete, the invoice charges you for the full order, and the supplier's phone line is engaged every time you call.",
    prompt:
      'Respond to the situation. Speak for between 40 and 90 seconds. You may explain the problem, state what you want, and say how you will follow up.',
    reference:
      'A customer in this position should put the complaint in writing, attach the delivery note showing what was missing and the invoice showing what was charged, and ask for either the missing items or a corrected invoice. A strong response gives a deadline for a reply, says the payment of the disputed amount is on hold until the invoice is corrected, and notes that the matter will be escalated through the card issuer if the supplier does not respond.',
    keyTerms: ['delivery note', 'invoice', 'writing', 'corrected', 'deadline', 'escalated'],
    minWords: 40,
  },
]
