import type {
  AudioScript,
  DictationItem,
  HighlightIncorrectItem,
  HighlightSummaryItem,
  ListeningFibItem,
  ListeningMcqItem,
  MissingWordItem,
  SituationItem,
} from './schema'

/**
 * Fifth listening batch: four everyday-academic conversations carrying items
 * across every listening collection, plus six standalone situations.
 *
 * This batch targets the listening types with the least headroom after the
 * fourth batch — FIB-Listening, Highlight Correct Summary, Listening MCQ
 * Multiple Answers and Highlight Incorrect Words — and every item is written
 * for the corrected playback model: WFD and Missing Word test a single turn,
 * FIB starts at its transcript turn, and HIW pairs are two-word
 * substitutions of one sentence.
 *
 * Distractors are grounded in the recording (built from something the
 * speakers say, altered in one detail) and option lengths sit within a few
 * words so length never cues the answer.
 */

export const EXTRA_CONVERSATIONS_5: AudioScript[] = [
  {
    id: 'con-bus-pass',
    title: 'Replacing a lost student bus pass',
    kind: 'conversation',
    topic: 'Student transport',
    scene: 'A student phones the transport office about a lost pass.',
    speakers: [
      { id: 'a', name: 'Student', role: 'Caller', voiceHint: 'high' },
      { id: 'b', name: 'Officer', role: 'Transport office', voiceHint: 'mid' },
    ],
    turns: [
      { speaker: 'a', text: 'Hello, I have lost my student bus pass somewhere between the campus and the station. Can I get a replacement?' },
      { speaker: 'b', text: 'You can, and because it is a photo pass the old one will be cancelled the moment I issue the new one. Nobody else can use it.' },
      { speaker: 'a', text: 'That is reassuring. How long does a replacement take?' },
      { speaker: 'b', text: 'If you apply online before noon, the digital pass is active the same evening. The plastic card follows by post within five working days.' },
      { speaker: 'a', text: 'Is there a fee for losing it?' },
      { speaker: 'b', text: 'The first replacement in an academic year costs twelve pounds. A second one costs twenty-five, which is meant to encourage people to look a little harder.' },
      { speaker: 'a', text: 'How do I travel this afternoon in the meantime?' },
      { speaker: 'b', text: 'Show the driver your confirmation email with your student number visible. That covers you for forty-eight hours from the time of issue, but not beyond.' },
      { speaker: 'a', text: 'And the zone on the pass — does it still cover the hospital route?' },
      { speaker: 'b', text: 'The replacement keeps whatever zones the original had, so the hospital extension stays. If you want to add the airport zone, that is a separate upgrade of thirty pounds.' },
    ],
    keyTerms: ['photo pass', 'cancelled', 'before noon', 'twelve pounds', 'forty-eight hours', 'hospital extension'],
  },
  {
    id: 'con-flatmate-notice',
    title: 'A flatmate gives notice',
    kind: 'conversation',
    topic: 'Housing',
    scene: 'Two flatmates discuss one of them leaving mid-tenancy.',
    speakers: [
      { id: 'a', name: 'Jonas', role: 'Flatmate leaving', voiceHint: 'low' },
      { id: 'b', name: 'Mara', role: 'Flatmate staying', voiceHint: 'high' },
    ],
    turns: [
      { speaker: 'a', text: 'I have been offered a placement in another city starting in June, so I need to leave the flat about two months early.' },
      { speaker: 'b', text: 'That is sudden. Our agreement says either of us can leave with six weeks of written notice, so June just about works if you write this week.' },
      { speaker: 'a', text: 'I will email the landlord tonight. What happens about finding someone for my room?' },
      { speaker: 'b', text: 'The agreement makes you responsible for the rent until a replacement signs, even after the notice period ends. So the sooner we advertise, the less you pay.' },
      { speaker: 'a', text: 'Fair enough. Should we offer the room at the same rent?' },
      { speaker: 'b', text: 'List it ten pounds lower for the first month to get viewings quickly. One empty month costs far more than a small discount.' },
      { speaker: 'a', text: 'What about the deposit? Mine is four hundred pounds.' },
      { speaker: 'b', text: 'The landlord returns it within two weeks of the new tenant signing, minus any cleaning charge. Photograph everything on the day you leave.' },
      { speaker: 'a', text: 'One more thing — the broadband contract is in my name until September.' },
      { speaker: 'b', text: 'Transfer it to me before you go, because an early cancellation fee of ninety pounds applies otherwise. The provider does transfers by phone in about twenty minutes.' },
    ],
    keyTerms: ['six weeks', 'written notice', 'replacement signs', 'ten pounds lower', 'two weeks', 'ninety pounds'],
  },
  {
    id: 'con-printer-credits',
    title: 'Topping up printing credits',
    kind: 'conversation',
    topic: 'IT services',
    scene: 'A student contacts the IT helpdesk about printing.',
    speakers: [
      { id: 'a', name: 'Student', role: 'Student', voiceHint: 'mid-high' },
      { id: 'b', name: 'Technician', role: 'Helpdesk', voiceHint: 'low' },
    ],
    turns: [
      { speaker: 'a', text: 'My dissertation is due on Friday and my printing account shows a zero balance. How do I add credit quickly?' },
      { speaker: 'b', text: 'Top up through the student portal, not the machines, because portal payments clear instantly while machine payments take up to an hour to appear.' },
      { speaker: 'a', text: 'How much should I add for roughly eighty pages?' },
      { speaker: 'b', text: 'Black and white costs six pence a side, so eighty single-sided pages need four pounds eighty. Colour is four times that, so check your settings first.' },
      { speaker: 'a', text: 'Can I print double-sided to halve it?' },
      { speaker: 'b', text: 'You can, and the library printers default to double-sided anyway. Just confirm the preview, because the dissertation office rejects single-sided copies.' },
      { speaker: 'a', text: 'Where do I collect it? The main library queue is always long.' },
      { speaker: 'b', text: 'Send the job to the science library instead. It has the same machines with half the queue, and jobs wait for twelve hours before they expire.' },
      { speaker: 'a', text: 'What if the printer jams halfway through?' },
      { speaker: 'b', text: 'Do not reprint the whole file. Note the machine number and report it, because jammed pages are refunded automatically once the report is logged.' },
    ],
    keyTerms: ['portal', 'instantly', 'six pence', 'double-sided', 'twelve hours', 'refunded'],
  },
  {
    id: 'con-module-change',
    title: 'Changing an optional module',
    kind: 'conversation',
    topic: 'Course administration',
    scene: 'A student asks a department office about switching modules.',
    speakers: [
      { id: 'a', name: 'Student', role: 'Student', voiceHint: 'high' },
      { id: 'b', name: 'Administrator', role: 'Department office', voiceHint: 'mid' },
    ],
    turns: [
      { speaker: 'a', text: 'I enrolled in the statistics module but after two weeks the pace is beyond me. Can I switch to the research methods one?' },
      { speaker: 'b', text: 'You can, because switches are allowed until the end of week three. After Friday the enrolment locks and no changes are possible.' },
      { speaker: 'a', text: 'Will I have missed too much of the new module?' },
      { speaker: 'b', text: 'Research methods repeats its first two weeks as a catch-up block in week four, precisely for students who transfer late. You will not be behind.' },
      { speaker: 'a', text: 'Does the switch affect my timetable?' },
      { speaker: 'b', text: 'Statistics meets on Monday mornings while research methods meets on Thursday afternoons, so you gain Monday and lose Thursday. Check for clashes with your part-time work.' },
      { speaker: 'a', text: 'What about the coursework I already submitted?' },
      { speaker: 'b', text: 'Week two work does not count toward the final grade in either module — it is formative only. Nothing transfers, but equally nothing is lost.' },
      { speaker: 'a', text: 'Do I need my tutor to approve it?' },
      { speaker: 'b', text: 'Your personal tutor must countersign the form, which you can do by email. Bring the signed form here and I will process the swap the same day.' },
    ],
    keyTerms: ['week three', 'locks', 'catch-up block', 'Thursday afternoons', 'formative', 'countersign'],
  },
]

export const EXTRA_LISTENING_FIB_5: ListeningFibItem[] = [
  {
    id: 'lfib-bus-1',
    audioId: 'con-bus-pass',
    startTurn: 1,
    text:
      'Because it is a photo ______ the old one will be cancelled the moment the new one is issued. If you apply online before ______ , the digital pass is active the same evening. The first replacement in an academic year costs twelve ______ .',
    answers: [[ 'pass'], ['noon'], ['pounds']],
  },
  {
    id: 'lfib-flatmate-1',
    audioId: 'con-flatmate-notice',
    startTurn: 1,
    text:
      'The agreement allows leaving with six ______ of written notice. You remain responsible for the ______ until a replacement signs, even after the notice period ends. The landlord returns the deposit within two ______ of the new tenant signing.',
    answers: [[ 'weeks'], ['rent'], ['weeks']],
  },
  {
    id: 'lfib-printer-1',
    audioId: 'con-printer-credits',
    startTurn: 1,
    text:
      'Top up through the student ______ , not the machines, because portal payments clear instantly. Black and white costs six ______ a side, so check your settings before printing in colour. Jobs wait for twelve ______ before they expire.',
    answers: [[ 'portal'], ['pence'], ['hours']],
  },
  {
    id: 'lfib-module-1',
    audioId: 'con-module-change',
    startTurn: 1,
    text:
      'Switches are allowed until the end of week ______ . After Friday the enrolment locks and no changes are possible. Week two work does not count toward the final ______ in either module. Your personal tutor must ______ the form.',
    answers: [[ 'three'], ['grade'], ['countersign']],
  },
  {
    id: 'lfib-bus-2',
    audioId: 'con-bus-pass',
    startTurn: 7,
    text:
      'Show the driver your confirmation ______ with your student number visible. That covers you for forty-eight ______ from the time of issue. The replacement keeps whatever ______ the original had.',
    answers: [[ 'email'], ['hours'], ['zones']],
  },
  {
    id: 'lfib-printer-2',
    audioId: 'con-printer-credits',
    startTurn: 7,
    text:
      'Send the job to the science ______ instead, because it has half the queue. Note the machine ______ and report it, because jammed pages are refunded automatically once the ______ is logged.',
    answers: [[ 'library'], ['number'], ['report']],
  },
]

export const EXTRA_HIGHLIGHT_SUMMARY_5: HighlightSummaryItem[] = [
  {
    id: 'hcs-bus-1',
    audioId: 'con-bus-pass',
    question: 'Select the correct summary of the conversation.',
    options: [
      'The student reports a lost photo bus pass and learns the old one is cancelled at once, online renewal before noon activates digitally that evening, and the first yearly replacement costs twelve pounds.',
      'The student reports a lost photo bus pass and learns the old one stays valid for a month, renewal takes five working days to activate, and every replacement in the year costs twenty-five pounds.',
      'The student reports a stolen wallet and learns the pass cannot be replaced without a police report, the digital pass needs a week to activate, and the hospital extension is removed on renewal.',
      'The student reports a lost photo bus pass and learns renewal is only possible in person, the plastic card arrives the same evening, and confirmation emails cover travel for two full weeks.',
    ],
    correct: 0,
  },
  {
    id: 'hcs-flatmate-1',
    audioId: 'con-flatmate-notice',
    question: 'Select the correct summary of the conversation.',
    options: [
      'Jonas must leave two months early and learns six weeks of written notice just suffices, rent is owed until a replacement signs, and the deposit returns within two weeks minus cleaning.',
      'Jonas must leave two months early and learns no notice is needed at all, rent ends the day he departs regardless of replacement, and the deposit is forfeited entirely on early exit.',
      'Jonas must leave two months early and learns twelve weeks of notice are required, the room must be listed higher to cover costs, and broadband cancellation fees never apply to students.',
      'Jonas must leave two months early and learns the landlord forbids all replacements, the deposit returns after six months automatically, and the broadband must be cancelled rather than transferred.',
    ],
    correct: 0,
  },
  {
    id: 'hcs-printer-1',
    audioId: 'con-printer-credits',
    question: 'Select the correct summary of the conversation.',
    options: [
      'The student needs eighty pages by Friday and learns portal top-ups clear instantly, black and white costs six pence a side, and jammed pages are refunded once the machine number is reported.',
      'The student needs eighty pages by Friday and learns machine top-ups are fastest, colour costs the same as black and white, and jammed pages must be paid for twice without exception.',
      'The student needs eighty pages by Friday and learns credit cannot be added before Monday, double-sided printing is banned for dissertations, and all print jobs expire after one single hour.',
      'The student needs eighty pages by Friday and learns the science library has no printers at all, previews cannot be checked before printing, and refunds are never given under any circumstances.',
    ],
    correct: 0,
  },
  {
    id: 'hcs-module-1',
    audioId: 'con-module-change',
    question: 'Select the correct summary of the conversation.',
    options: [
      'The student wants to leave statistics and learns switches close after week three, research methods repeats its opening weeks for late transfers, and week two work is formative in both modules.',
      'The student wants to leave statistics and learns switches stay open all term, research methods offers no catch-up of any kind, and week two marks decide the final grade in full.',
      'The student wants to leave statistics and learns the swap needs no tutor signature, Thursday classes move to Monday mornings instead, and submitted coursework transfers across automatically.',
      'The student wants to leave statistics and learns enrolment locks immediately with no exceptions, the new module meets at the same hour as the old one, and approval takes at least a month.',
    ],
    correct: 0,
  },
]

export const EXTRA_LISTENING_MCQ_SINGLE_5: ListeningMcqItem[] = [
  {
    id: 'lmcq-bus-1',
    audioId: 'con-bus-pass',
    question: 'Why can nobody else use the lost pass?',
    options: [
      'It is cancelled when the new one is issued',
      'It has no photograph on it at all',
      'It expired at the end of last term',
      'It only works with the student present',
    ],
    correct: ['It is cancelled when the new one is issued'],
  },
  {
    id: 'lmcq-bus-2',
    audioId: 'con-bus-pass',
    question: 'How can the student travel this afternoon?',
    options: [
      'With the confirmation email for two days',
      'By borrowing another student’s pass',
      'Only by paying the full cash fare',
      'By walking until the card arrives',
    ],
    correct: ['With the confirmation email for two days'],
  },
  {
    id: 'lmcq-flatmate-1',
    audioId: 'con-flatmate-notice',
    question: 'Why should the room be advertised quickly?',
    options: [
      'Rent is owed until someone signs',
      'The landlord charges a listing fee',
      'The deposit shrinks every week',
      'Viewings are only allowed in June',
    ],
    correct: ['Rent is owed until someone signs'],
  },
  {
    id: 'lmcq-printer-1',
    audioId: 'con-printer-credits',
    question: 'Why should the student top up through the portal?',
    options: [
      'Payments clear instantly there',
      'Machines add a service charge',
      'The portal gives bonus credit',
      'Machines reject dissertation files',
    ],
    correct: ['Payments clear instantly there'],
  },
  {
    id: 'lmcq-module-1',
    audioId: 'con-module-change',
    question: 'Why will the student not fall behind?',
    options: [
      'The opening weeks are repeated later',
      'The new module has no assessment',
      'Statistics covers the same material',
      'Tutors waive attendance entirely',
    ],
    correct: ['The opening weeks are repeated later'],
  },
  {
    id: 'lmcq-module-2',
    audioId: 'con-module-change',
    question: 'What happens to the submitted week-two work?',
    options: [
      'It counts for nothing in either module',
      'It transfers across automatically',
      'It halves the new module’s workload',
      'It must be resubmitted with penalty',
    ],
    correct: ['It counts for nothing in either module'],
  },
]

export const EXTRA_LISTENING_MCQ_MULTI_5: ListeningMcqItem[] = [
  {
    id: 'lmcm-bus-1',
    audioId: 'con-bus-pass',
    question: 'Which two are true of the replacement pass? Select TWO.',
    options: [
      'The digital pass activates the same evening',
      'It keeps the original’s zones',
      'It arrives only after a month',
      'It removes the hospital extension',
      'It needs no photograph at all',
    ],
    correct: ['The digital pass activates the same evening', 'It keeps the original’s zones'],
  },
  {
    id: 'lmcm-flatmate-1',
    audioId: 'con-flatmate-notice',
    question: 'Which two must happen before Jonas leaves? Select TWO.',
    options: [
      'Written notice must be sent this week',
      'The broadband must be transferred',
      'The whole year’s rent is paid upfront',
      'The landlord inspects every month',
      'All furniture must be replaced',
    ],
    correct: ['Written notice must be sent this week', 'The broadband must be transferred'],
  },
  {
    id: 'lmcm-printer-1',
    audioId: 'con-printer-credits',
    question: 'Which two does the technician advise? Select TWO.',
    options: [
      'Check colour settings before printing',
      'Report jams with the machine number',
      'Reprint the whole file after any jam',
      'Always use the main library queue',
      'Pay only at the machines, never online',
    ],
    correct: ['Check colour settings before printing', 'Report jams with the machine number'],
  },
  {
    id: 'lmcm-module-1',
    audioId: 'con-module-change',
    question: 'Which two are true of the switch? Select TWO.',
    options: [
      'Thursday replaces Monday on the timetable',
      'The tutor must countersign the form',
      'It is allowed at any point in term',
      'Week-two marks carry over in full',
      'Statistics and methods share a room',
    ],
    correct: ['Thursday replaces Monday on the timetable', 'The tutor must countersign the form'],
  },
]

/** Same derivation rule as the other batches: a two-word substitution. */
function derived5(id: string, audioId: string, transcript: string, correctTranscript: string) {
  const shown = transcript.split(/\s+/)
  const actual = correctTranscript.split(/\s+/)
  const diff = shown.reduce<number[]>((acc, w, i) => (w === actual[i] ? acc : [...acc, i]), [])
  if (shown.length !== actual.length || diff.length !== 2) {
    throw new Error(`${id}: expected a two-word substitution, got ${diff.length} differences`)
  }
  return { id, audioId, transcript, correctTranscript, incorrect: diff }
}

export const EXTRA_HIGHLIGHT_INCORRECT_5: HighlightIncorrectItem[] = [
  derived5(
    'hiw-bus-1',
    'con-bus-pass',
    'The plastic card follows by email within three working days of the application.',
    'The plastic card follows by post within five working days of the application.',
  ),
  derived5(
    'hiw-flatmate-1',
    'con-flatmate-notice',
    'List it ten pounds higher for the first week to get viewings quickly and avoid loss.',
    'List it ten pounds lower for the first month to get viewings quickly and avoid loss.',
  ),
  derived5(
    'hiw-printer-1',
    'con-printer-credits',
    'Black and white costs six pounds a side, so check your preview before printing in colour.',
    'Black and white costs six pence a side, so check your settings before printing in colour.',
  ),
  derived5(
    'hiw-module-1',
    'con-module-change',
    'Statistics meets on Thursday mornings while research methods meets on Friday afternoons instead.',
    'Statistics meets on Monday mornings while research methods meets on Thursday afternoons instead.',
  ),
]

export const EXTRA_DICTATION_5: DictationItem[] = [
  { id: 'wfd-bus-1', audioId: 'con-bus-pass', turnIndex: 6, text: 'How do I travel this afternoon in the meantime?' },
  { id: 'wfd-bus-2', audioId: 'con-bus-pass', turnIndex: 3, text: 'The plastic card follows by post within five working days.' },
  { id: 'wfd-flatmate-1', audioId: 'con-flatmate-notice', turnIndex: 3, text: 'So the sooner we advertise, the less you pay.' },
  { id: 'wfd-printer-1', audioId: 'con-printer-credits', turnIndex: 2, text: 'How much should I add for roughly eighty pages?' },
  { id: 'wfd-module-1', audioId: 'con-module-change', turnIndex: 1, text: 'After Friday the enrolment locks and no changes are possible.' },
  { id: 'wfd-module-2', audioId: 'con-module-change', turnIndex: 2, text: 'Will I have missed too much of the new module?' },
]

export const EXTRA_MISSING_WORD_5: MissingWordItem[] = [
  { id: 'smw-bus-1', audioId: 'con-bus-pass', turnIndex: 3, wordIndex: 6, options: ['pass', 'passes', 'passing', 'past'], correct: 0 },
  { id: 'smw-bus-2', audioId: 'con-bus-pass', turnIndex: 9, wordIndex: 4, options: ['zone', 'zones', 'zoned', 'zebra'], correct: 0 },
  { id: 'smw-flatmate-1', audioId: 'con-flatmate-notice', turnIndex: 5, wordIndex: 2, options: ['list', 'lists', 'listed', 'listener'], correct: 0 },
  { id: 'smw-printer-1', audioId: 'con-printer-credits', turnIndex: 5, wordIndex: 9, options: ['side', 'sides', 'sided', 'signal'], correct: 0 },
  { id: 'smw-module-1', audioId: 'con-module-change', turnIndex: 3, wordIndex: 7, options: ['block', 'blocks', 'blocked', 'blank'], correct: 0 },
  { id: 'smw-module-2', audioId: 'con-module-change', turnIndex: 5, wordIndex: 3, options: ['meet', 'meets', 'meeting', 'meter'], correct: 0 },
]

export const EXTRA_SITUATIONS_5: SituationItem[] = [
  {
    id: 'rts-bus-1',
    situation:
      'Your bus pass stopped working at the barrier this morning and you were late for a seminar, although the pass is valid until June.',
    prompt:
      'Respond to the situation. Speak for between 40 and 90 seconds. You may explain what happened, state what you need, and ask for a remedy.',
    reference:
      'A passenger in this position should state the date and route of the failure, confirm the pass validity to June, and ask directly for the barrier record to be checked. A strong response asks for the faulty card to be replaced free of charge and for a temporary travel permission covering any investigation period.',
    keyTerms: ['barrier', 'seminar', 'valid', 'record', 'replaced', 'temporary'],
    minWords: 40,
  },
  {
    id: 'rts-flatmate-1',
    situation:
      'Your flatmate has left without paying the final electricity bill, and the supplier is now writing to you for the full amount.',
    prompt:
      'Respond to the situation. Speak for between 40 and 90 seconds. You may explain the circumstances, state your position, and propose a solution.',
    reference:
      'A tenant in this position should explain the departure date and the shared arrangement plainly, attach the tenancy agreement and meter readings as evidence, and dispute liability for the full amount. A strong response proposes paying a documented half share immediately while the supplier pursues the remainder from the departed flatmate.',
    keyTerms: ['departure', 'shared', 'evidence', 'dispute', 'liability', 'share'],
    minWords: 40,
  },
  {
    id: 'rts-printer-1',
    situation:
      'You paid for dissertation printing but the machine jammed and debited your account twice, two days before submission.',
    prompt:
      'Respond to the situation. Speak for between 40 and 90 seconds. You may describe the failure, state the financial error, and say what you want done.',
    reference:
      'A student in this position should give the machine number, date and amount debited, and distinguish the jam from the double charge as two separate faults. A strong response asks for the duplicate payment to be refunded to the printing account within twenty-four hours and for written confirmation that the submission deadline is unaffected.',
    keyTerms: ['jammed', 'debited', 'duplicate', 'refunded', 'confirmation', 'deadline'],
    minWords: 40,
  },
  {
    id: 'rts-module-1',
    situation:
      'You missed the week-three module switch deadline by one day because you were ill, and enrolment has now locked.',
    prompt:
      'Respond to the situation. Speak for between 40 and 90 seconds. You may explain the delay, provide your evidence, and request an exception.',
    reference:
      'A student in this position should state the one-day delay and the illness plainly, attach the medical note and the countersigned form as evidence, and ask for a late switch as a documented exception. A strong response acknowledges the published deadline while showing the delay was unavoidable and the paperwork is otherwise complete.',
    keyTerms: ['deadline', 'illness', 'evidence', 'exception', 'unavoidable', 'complete'],
    minWords: 40,
  },
  {
    id: 'rts-gym-1',
    situation:
      'Your gym has closed the swimming pool for repairs for a month, but your membership fee still includes pool access you cannot use.',
    prompt:
      'Respond to the situation. Speak for between 40 and 90 seconds. You may describe the problem, state what you pay for, and ask for compensation.',
    reference:
      'A member in this position should state the closure dates and the pool component of the fee, and ask for a proportional reduction or freeze rather than a vague goodwill gesture. A strong response proposes the exact adjustment wanted, asks for it in writing, and sets a date for the normal charge to resume.',
    keyTerms: ['closure', 'pool', 'reduction', 'freeze', 'writing', 'resume'],
    minWords: 40,
  },
  {
    id: 'rts-post-1',
    situation:
      'An important letter from the university was sent to your old address because you forgot to update your records after moving.',
    prompt:
      'Respond to the situation. Speak for between 40 and 90 seconds. You may explain the mistake, accept responsibility, and ask what can still be done.',
    reference:
      'A student in this position should admit the records were not updated without deflecting, explain the move date and the missed letter, and ask whether the deadline or offer can still be honoured. A strong response confirms the records are now corrected and asks for the correspondence to be reissued to the current address.',
    keyTerms: ['records', 'updated', 'responsibility', 'honoured', 'corrected', 'reissued'],
    minWords: 40,
  },
]
