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
 * Fourth listening batch: four everyday-academic conversations carrying items
 * across every listening collection, plus six standalone situations.
 *
 * Realism follows the PTE listening formula: each conversation turns on
 * checkable specifics — numbers, deadlines, conditions, exceptions — and
 * every distractor is built from something the speakers actually say, altered
 * in one detail, so it must be rejected by listening rather than by invention.
 * Option lengths are kept within a few words so length never cues the answer.
 */

export const EXTRA_CONVERSATIONS_4: AudioScript[] = [
  {
    id: 'con-dental-appointment',
    title: 'Booking an emergency dental slot',
    kind: 'conversation',
    topic: 'Health services',
    scene: 'A patient phones a dental practice about a broken tooth.',
    speakers: [
      { id: 'a', name: 'Patient', role: 'Caller', voiceHint: 'high' },
      { id: 'b', name: 'Receptionist', role: 'Dental practice', voiceHint: 'mid' },
    ],
    turns: [
      { speaker: 'a', text: 'Hello, I have broken a molar on a seed and part of it is quite sharp. Is there any chance of being seen today?' },
      { speaker: 'b', text: 'We keep two emergency slots each day, and the morning one has just been taken, so I can offer you half past three this afternoon.' },
      { speaker: 'a', text: 'That would be a relief. Will it be my usual dentist?' },
      { speaker: 'b', text: 'Emergency slots are covered by the duty dentist, which today is Dr Patel. Your records will be on screen, so nothing is lost by seeing someone different.' },
      { speaker: 'a', text: 'And what should I do about the sharp edge until then?' },
      { speaker: 'b', text: 'The pharmacist can sell you a temporary filling kit, and covering the edge with dental wax usually stops it catching. Avoid chewing on that side and keep the area clean with warm salty water.' },
      { speaker: 'a', text: 'Is there a charge for an emergency appointment?' },
      { speaker: 'b', text: 'The examination is forty-five pounds, and any treatment is charged separately. If you are in the practice plan, the examination is included but the treatment is discounted rather than free.' },
      { speaker: 'a', text: 'I am in the plan, so that helps. Where should I go when I arrive?' },
      { speaker: 'b', text: 'Report to the first-floor reception, not the ground floor, because the duty surgery is upstairs. Bring your plan card so we can apply the discount without a second visit.' },
    ],
    keyTerms: ['emergency slot', 'duty dentist', 'dental wax', 'practice plan', 'first floor'],
  },
  {
    id: 'con-internship-interview',
    title: 'Preparing for an internship interview',
    kind: 'conversation',
    topic: 'Careers advice',
    scene: 'A student meets a careers adviser before an interview.',
    speakers: [
      { id: 'a', name: 'Student', role: 'Student', voiceHint: 'high' },
      { id: 'b', name: 'Adviser', role: 'Careers adviser', voiceHint: 'low' },
    ],
    turns: [
      { speaker: 'a', text: 'I have an interview on Thursday for a six-week marketing internship, and I have never done one before. Where should I start?' },
      { speaker: 'b', text: 'Start with the job description, not the company history. Circle every verb — analyse, draft, present — because the questions will ask for a time you did each one.' },
      { speaker: 'a', text: 'Most of my experience is a student society newsletter. Is that usable?' },
      { speaker: 'b', text: 'It is ideal, provided you quantify it. Saying you grew readership by thirty per cent in a term beats saying you wrote articles, because the number proves the claim.' },
      { speaker: 'a', text: 'What about weaknesses? Every guide says to prepare one.' },
      { speaker: 'b', text: 'Choose a real one you have already addressed, and name the system you built. I used to miss deadlines, so I now time-block the calendar each Sunday is honest and shows a fix.' },
      { speaker: 'a', text: 'Should I bring anything to the room?' },
      { speaker: 'b', text: 'Bring one page: three bullet examples with numbers, and two questions about the team. Questions about the rota and the supervisor signal that you picture yourself in the role.' },
      { speaker: 'a', text: 'And after the interview?' },
      { speaker: 'b', text: 'Send a short email the same evening naming one thing you discussed. Panels decide on Friday mornings, so Thursday night is your last chance to be remembered accurately.' },
    ],
    keyTerms: ['job description', 'quantify', 'time-block', 'bullet examples', 'same evening'],
  },
  {
    id: 'con-parking-permit',
    title: 'Applying for a residents parking permit',
    kind: 'conversation',
    topic: 'Council services',
    scene: 'A resident phones the council about a parking permit.',
    speakers: [
      { id: 'a', name: 'Resident', role: 'Caller', voiceHint: 'mid-high' },
      { id: 'b', name: 'Officer', role: 'Council officer', voiceHint: 'mid' },
    ],
    turns: [
      { speaker: 'a', text: 'I have moved into a flat on Alder Street and I need a residents permit. Can I apply before my council tax bill arrives?' },
      { speaker: 'b', text: 'You can, because the tenancy agreement counts as proof of address for the first month. After that we ask for the bill or a utility statement.' },
      { speaker: 'a', text: 'The flat has no allocated bay. Does the permit guarantee a space?' },
      { speaker: 'b', text: 'It guarantees the right to park in the zone, not a particular bay. Alder Street sits in Zone C, which covers twelve streets, and pressure is highest after six in the evening.' },
      { speaker: 'a', text: 'How much does it cost, and how long does it last?' },
      { speaker: 'b', text: 'The first permit is ninety pounds for twelve months from the date of issue, not the calendar year. A second permit for the same household is one hundred and forty pounds.' },
      { speaker: 'a', text: 'My car is registered at my parents address. Is that a problem?' },
      { speaker: 'b', text: 'The registration must show the Alder Street address before we issue the permit. Update the logbook first, because we check it against the national database automatically.' },
      { speaker: 'a', text: 'How do visitors park in the meantime?' },
      { speaker: 'b', text: 'You can buy books of scratch cards, five for twelve pounds, each valid for one day. They cannot be used on match days when the stadium restriction applies.' },
    ],
    keyTerms: ['tenancy agreement', 'Zone C', 'twelve months', 'logbook', 'scratch cards'],
  },
  {
    id: 'con-supervisor-meeting',
    title: 'Planning a dissertation chapter',
    kind: 'conversation',
    topic: 'Academic supervision',
    scene: 'A postgraduate meets her supervisor to plan a chapter.',
    speakers: [
      { id: 'a', name: 'Mara', role: 'Postgraduate', voiceHint: 'high' },
      { id: 'b', name: 'Supervisor', role: 'Supervisor', voiceHint: 'low' },
    ],
    turns: [
      { speaker: 'a', text: 'I have drafted the methods chapter at six thousand words, but the results keep pulling me back into rewriting it. Should I freeze the methods first?' },
      { speaker: 'b', text: 'Freeze the structure, not the sentences. Fix your headings and the word budget per section now, and allow the wording to move until the results are stable.' },
      { speaker: 'a', text: 'My budget gives two thousand words to sampling and one thousand to analysis. Does that sound right?' },
      { speaker: 'b', text: 'It is backwards for this project. Your sampling is standard, so five hundred words with a citation does the work. The analysis is novel, so it earns the two thousand.' },
      { speaker: 'a', text: 'One reviewer will ask why I did not use the longitudinal data. How do I handle that?' },
      { speaker: 'b', text: 'Answer it in one paragraph before they ask. State the reason — access was withdrawn in March — give the consequence, and name what you did instead. Reviewers pursue what you appear to hide.' },
      { speaker: 'a', text: 'When do you want the next draft?' },
      { speaker: 'b', text: 'Send the frozen structure by Friday with the word budgets in the margin. I will return it with comments within a week, and we will lock the full draft the week after.' },
      { speaker: 'a', text: 'That sequence helps. I will stop polishing sentences I am about to move.' },
      { speaker: 'b', text: 'Exactly. A chapter is finished in the order structure, evidence, wording — never the reverse.' },
    ],
    keyTerms: ['freeze structure', 'word budget', 'longitudinal', 'withdrawn', 'by Friday'],
  },
]

export const EXTRA_LISTENING_FIB_4: ListeningFibItem[] = [
  {
    id: 'lfib-dental-1',
    audioId: 'con-dental-appointment',
    startTurn: 1,
    text:
      'We keep two emergency ______ each day, and the morning one has just been taken. Emergency slots are covered by the ______ dentist, and your records will be on screen. Covering the edge with dental ______ usually stops it catching. The examination is forty-five ______ .',
    answers: [[ 'slots'], ['duty'], ['wax'], ['pounds']],
  },
  {
    id: 'lfib-internship-1',
    audioId: 'con-internship-interview',
    startTurn: 1,
    text:
      'Start with the job ______ , not the company history. Saying you grew readership by thirty per ______ in a term beats saying you wrote articles. Choose a real weakness you have already ______ , and name the system you built. Panels decide on Friday ______ , so Thursday night matters.',
    answers: [[ 'description'], ['cent'], ['addressed'], ['mornings']],
  },
  {
    id: 'lfib-permit-1',
    audioId: 'con-parking-permit',
    startTurn: 1,
    text:
      'The tenancy ______ counts as proof of address for the first month. The permit guarantees the right to park in the ______ , not a particular bay. The first permit is ninety pounds for twelve ______ from the date of issue. Update the ______ first, because we check it automatically.',
    answers: [[ 'agreement'], ['zone'], ['months'], ['logbook']],
  },
  {
    id: 'lfib-supervisor-1',
    audioId: 'con-supervisor-meeting',
    startTurn: 1,
    text:
      'Freeze the ______ , not the sentences, and fix your headings and the word ______ per section now. Your sampling is standard, so five hundred words with a ______ does the work. State the reason access was ______ in March, and name what you did instead.',
    answers: [[ 'structure'], ['budget'], ['citation'], ['withdrawn']],
  },
  {
    id: 'lfib-dental-2',
    audioId: 'con-dental-appointment',
    startTurn: 7,
    text:
      'If you are in the practice ______ , the examination is included but the treatment is ______ rather than free. Report to the first-floor ______ , not the ground floor, because the duty surgery is upstairs.',
    answers: [[ 'plan'], ['discounted'], ['reception']],
  },
  {
    id: 'lfib-permit-2',
    audioId: 'con-parking-permit',
    startTurn: 8,
    text:
      'You can buy books of scratch ______ , five for twelve pounds, each valid for one ______ . They cannot be used on match ______ when the stadium restriction applies.',
    answers: [[ 'cards'], ['day'], ['days']],
  },
]

export const EXTRA_HIGHLIGHT_SUMMARY_4: HighlightSummaryItem[] = [
  {
    id: 'hcs-dental-1',
    audioId: 'con-dental-appointment',
    question: 'Select the correct summary of the conversation.',
    options: [
      'The patient reports a broken molar and takes the half past three emergency slot with the duty dentist, is told to cover the edge with wax, and learns the plan covers the examination with treatment discounted.',
      'The patient reports a broken molar and takes the morning emergency slot with their usual dentist, is told to pull the sharp fragment out, and learns the plan covers both examination and treatment in full.',
      'The patient reports a broken molar and is told no slot is free today, is advised to buy a filling kit and wait until Monday, and learns emergency examinations always cost forty-five pounds extra.',
      'The patient reports a broken molar and takes the half past three slot with the duty dentist, is told to chew on the sore side, and learns the ground floor reception handles all emergency arrivals.',
    ],
    correct: 0,
  },
  {
    id: 'hcs-internship-1',
    audioId: 'con-internship-interview',
    question: 'Select the correct summary of the conversation.',
    options: [
      'The student prepares for a Thursday marketing interview, is told to mine the job description for verbs and quantify society experience, and to send a same-evening email because panels decide on Friday mornings.',
      'The student prepares for a Thursday marketing interview, is told to memorise the company history and hide all weaknesses, and to wait a week before contacting the panel after the decision.',
      'The student prepares for a Thursday finance interview, is told the newsletter is unusable and numbers do not matter, and to bring nothing while asking only about salary and holidays.',
      'The student prepares for a Thursday marketing interview, is told to circle company history and avoid examples with numbers, and to phone the panel on Friday morning before they meet.',
    ],
    correct: 0,
  },
  {
    id: 'hcs-permit-1',
    audioId: 'con-parking-permit',
    question: 'Select the correct summary of the conversation.',
    options: [
      'The resident asks about a Zone C permit and learns the tenancy covers month one, the first permit costs ninety pounds yearly, the logbook must show Alder Street, and scratch cards cover visitors except match days.',
      'The resident asks about a Zone C permit and learns a council tax bill is mandatory from day one, the permit guarantees a fixed bay, and visitors may park free anywhere in the zone at all times.',
      'The resident asks about a Zone C permit and learns the first permit costs one hundred and forty pounds monthly, the car may stay registered elsewhere, and scratch cards work even during stadium restrictions.',
      'The resident asks about a Zone C permit and learns Alder Street has allocated bays for every flat, pressure peaks before noon, and the second household permit is cheaper than the first one.',
    ],
    correct: 0,
  },
  {
    id: 'hcs-supervisor-1',
    audioId: 'con-supervisor-meeting',
    question: 'Select the correct summary of the conversation.',
    options: [
      'The student brings a six-thousand-word methods draft and is told to freeze headings with word budgets, to cut sampling to five hundred words, to pre-empt the longitudinal question, and to send the structure by Friday.',
      'The student brings a six-thousand-word methods draft and is told to polish every sentence first, to expand sampling to two thousand words, to ignore the longitudinal question, and to send the full draft immediately.',
      'The student brings a six-thousand-word results draft and is told to freeze all wording now, to delete the analysis section entirely, and to wait a month before sending anything further.',
      'The student brings a six-thousand-word methods draft and is told to double the sampling section, to hide the withdrawn data access, and to submit the chapter without any word budgets at all.',
    ],
    correct: 0,
  },
]

export const EXTRA_LISTENING_MCQ_SINGLE_4: ListeningMcqItem[] = [
  {
    id: 'lmcq-dental-1',
    audioId: 'con-dental-appointment',
    question: 'Who will see the patient this afternoon?',
    options: [
      'The duty dentist on shift',
      'The patient’s usual dentist',
      'A locum from another practice',
      'The practice hygienist instead',
    ],
    correct: ['The duty dentist on shift'],
  },
  {
    id: 'lmcq-dental-2',
    audioId: 'con-dental-appointment',
    question: 'What does the receptionist say about the plan discount?',
    options: [
      'Examinations are included; treatment is discounted',
      'Both examination and treatment are fully free',
      'Only treatment is covered, not examinations',
      'The plan gives no emergency discount',
    ],
    correct: ['Examinations are included; treatment is discounted'],
  },
  {
    id: 'lmcq-internship-1',
    audioId: 'con-internship-interview',
    question: 'What should the student do with newsletter experience?',
    options: [
      'State the readership growth as a number',
      'Describe the articles in great detail',
      'Leave it off the interview answers',
      'Present it as professional employment',
    ],
    correct: ['State the readership growth as a number'],
  },
  {
    id: 'lmcq-permit-1',
    audioId: 'con-parking-permit',
    question: 'What must the resident do before the permit is issued?',
    options: [
      'Show the car registered at Alder Street',
      'Pay for a full calendar year upfront',
      'Buy a book of scratch cards first',
      'Secure an allocated bay in writing',
    ],
    correct: ['Show the car registered at Alder Street'],
  },
  {
    id: 'lmcq-supervisor-1',
    audioId: 'con-supervisor-meeting',
    question: 'How should the word budget be split?',
    options: [
      'Brief sampling note; long analysis section',
      'Long sampling section; brief analysis note',
      'Equal words for every single section',
      'No budget; write until it feels done',
    ],
    correct: ['Brief sampling note; long analysis section'],
  },
  {
    id: 'lmcq-supervisor-2',
    audioId: 'con-supervisor-meeting',
    question: 'How should the missing longitudinal data be handled?',
    options: [
      'State the withdrawal and the substitute openly',
      'Omit any mention and hope nobody asks',
      'Blame the previous research assistant',
      'Promise to collect it before submission',
    ],
    correct: ['State the withdrawal and the substitute openly'],
  },
]

export const EXTRA_LISTENING_MCQ_MULTI_4: ListeningMcqItem[] = [
  {
    id: 'lmcm-dental-1',
    audioId: 'con-dental-appointment',
    question: 'Which two self-care steps does the receptionist advise? Select TWO.',
    options: [
      'Cover the edge with dental wax',
      'Rinse with warm salty water',
      'Pull the loose fragment out',
      'Chew firmly on the sore side',
      'Apply heat directly to the gum',
    ],
    correct: ['Cover the edge with dental wax', 'Rinse with warm salty water'],
  },
  {
    id: 'lmcm-internship-1',
    audioId: 'con-internship-interview',
    question: 'Which two should the one-page sheet contain? Select TWO.',
    options: [
      'Three bullet examples with numbers',
      'Two questions about the team',
      'A full transcript of all marks',
      'Copies of every certificate earned',
      'A list of salary expectations',
    ],
    correct: ['Three bullet examples with numbers', 'Two questions about the team'],
  },
  {
    id: 'lmcm-permit-1',
    audioId: 'con-parking-permit',
    question: 'Which two are true of the Zone C permit? Select TWO.',
    options: [
      'It covers twelve streets, not one bay',
      'The tenancy counts as proof for month one',
      'It guarantees a reserved bay outside the flat',
      'It runs by calendar year for everyone',
      'It allows free parking on match days',
    ],
    correct: ['It covers twelve streets, not one bay', 'The tenancy counts as proof for month one'],
  },
  {
    id: 'lmcm-supervisor-1',
    audioId: 'con-supervisor-meeting',
    question: 'Which two steps lock the chapter plan? Select TWO.',
    options: [
      'Fix headings with word budgets first',
      'Send the structure with budgets by Friday',
      'Polish every sentence before planning',
      'Hide the withdrawn data from reviewers',
      'Double the sampling section length',
    ],
    correct: ['Fix headings with word budgets first', 'Send the structure with budgets by Friday'],
  },
]

/** Same derivation rule as the other batches: a two-word substitution. */
function derived4(id: string, audioId: string, transcript: string, correctTranscript: string) {
  const shown = transcript.split(/\s+/)
  const actual = correctTranscript.split(/\s+/)
  const diff = shown.reduce<number[]>((acc, w, i) => (w === actual[i] ? acc : [...acc, i]), [])
  if (shown.length !== actual.length || diff.length !== 2) {
    throw new Error(`${id}: expected a two-word substitution, got ${diff.length} differences`)
  }
  return { id, audioId, transcript, correctTranscript, incorrect: diff }
}

export const EXTRA_HIGHLIGHT_INCORRECT_4: HighlightIncorrectItem[] = [
  derived4(
    'hiw-dental-1',
    'con-dental-appointment',
    'Report to the ground reception, not the first floor, because the duty surgery is upstairs.',
    'Report to the first reception, not the ground floor, because the duty surgery is upstairs.',
  ),
  derived4(
    'hiw-internship-1',
    'con-internship-interview',
    'Panels decide on Monday mornings, so Thursday night is your final chance to be remembered accurately.',
    'Panels decide on Friday mornings, so Thursday night is your last chance to be remembered accurately.',
  ),
  derived4(
    'hiw-permit-1',
    'con-parking-permit',
    'The first permit is ninety pounds for twelve weeks from the date of payment, not the calendar year.',
    'The first permit is ninety pounds for twelve months from the date of issue, not the calendar year.',
  ),
  derived4(
    'hiw-supervisor-1',
    'con-supervisor-meeting',
    'A chapter is finished in the order evidence, structure, wording — never the reverse.',
    'A chapter is finished in the order structure, evidence, wording — never the reverse.',
  ),
]

export const EXTRA_DICTATION_4: DictationItem[] = [
  { id: 'wfd-dental-1', audioId: 'con-dental-appointment', turnIndex: 1, text: 'We keep two emergency slots each day, and the morning one has just been taken, so I can offer you half past three this afternoon.' },
  { id: 'wfd-dental-2', audioId: 'con-dental-appointment', turnIndex: 5, text: 'The pharmacist can sell you a temporary filling kit, and covering the edge with dental wax usually stops it catching.' },
  { id: 'wfd-internship-1', audioId: 'con-internship-interview', turnIndex: 3, text: 'It is ideal, provided you quantify it. Saying you grew readership by thirty per cent in a term beats saying you wrote articles, because the number proves the claim.' },
  { id: 'wfd-permit-1', audioId: 'con-parking-permit', turnIndex: 5, text: 'The first permit is ninety pounds for twelve months from the date of issue, not the calendar year. A second permit for the same household is one hundred and forty pounds.' },
  { id: 'wfd-supervisor-1', audioId: 'con-supervisor-meeting', turnIndex: 1, text: 'Freeze the structure, not the sentences. Fix your headings and the word budget per section now, and allow the wording to move until the results are stable.' },
  { id: 'wfd-supervisor-2', audioId: 'con-supervisor-meeting', turnIndex: 9, text: 'Exactly. A chapter is finished in the order structure, evidence, wording — never the reverse.' },
]

export const EXTRA_MISSING_WORD_4: MissingWordItem[] = [
  { id: 'smw-dental-1', audioId: 'con-dental-appointment', turnIndex: 1, wordIndex: 4, options: ['slot', 'slots', 'slotted', 'sloth'], correct: 0 },
  { id: 'smw-dental-2', audioId: 'con-dental-appointment', turnIndex: 7, wordIndex: 9, options: ['plan', 'planes', 'planned', 'plank'], correct: 0 },
  { id: 'smw-internship-1', audioId: 'con-internship-interview', turnIndex: 1, wordIndex: 8, options: ['verb', 'verbs', 'verbal', 'verse'], correct: 0 },
  { id: 'smw-permit-1', audioId: 'con-parking-permit', turnIndex: 3, wordIndex: 5, options: ['zone', 'zones', 'zoned', 'zonal'], correct: 0 },
  { id: 'smw-supervisor-1', audioId: 'con-supervisor-meeting', turnIndex: 3, wordIndex: 6, options: ['cite', 'cites', 'cited', 'city'], correct: 0 },
  { id: 'smw-supervisor-2', audioId: 'con-supervisor-meeting', turnIndex: 5, wordIndex: 4, options: ['state', 'states', 'stated', 'stately'], correct: 0 },
]

export const EXTRA_SITUATIONS_4: SituationItem[] = [
  {
    id: 'rts-dental-1',
    situation:
      'You missed a dental appointment this morning because your bus broke down, and the practice charges for missed appointments.',
    prompt:
      'Respond to the situation. Speak for between 40 and 90 seconds. You may apologise, explain what happened, and ask what can be arranged.',
    reference:
      'A patient in this position should apologise briefly without over-explaining, state the bus breakdown and the time it caused, and ask directly whether the charge can be waived this once or reduced. A strong response proposes a concrete remedy by asking for the next available slot and confirming how the practice wishes to be notified of lateness in future.',
    keyTerms: ['apologise', 'bus', 'breakdown', 'waived', 'slot', 'notified'],
    minWords: 40,
  },
  {
    id: 'rts-internship-1',
    situation:
      'You have been offered two summer internships with overlapping dates, and you must decline one without closing the door to next year.',
    prompt:
      'Respond to the situation. Speak for between 40 and 90 seconds. You may thank them, explain your choice, and keep the relationship open.',
    reference:
      'A candidate in this position should thank the employer for the offer, explain the clash of dates plainly, and state which opportunity has been accepted and why. A strong response asks whether a later placement or next-year application would be welcome, and closes by confirming the decision in writing the same day so the place can be reallocated.',
    keyTerms: ['thank', 'clash', 'accepted', 'placement', 'writing', 'reallocated'],
    minWords: 40,
  },
  {
    id: 'rts-permit-1',
    situation:
      'You received a parking fine on a street where you believed your new permit was valid, and you have fourteen days to appeal.',
    prompt:
      'Respond to the situation. Speak for between 40 and 90 seconds. You may explain the misunderstanding, state your evidence, and say what outcome you seek.',
    reference:
      'A resident in this position should state the date and street of the fine, explain that the permit zone was misunderstood, and attach the permit and tenancy agreement as evidence. A strong response asks specifically for the fine to be cancelled on first-offence grounds and confirms the correct zone boundary so the error is not repeated.',
    keyTerms: ['fine', 'street', 'permit', 'evidence', 'cancelled', 'boundary'],
    minWords: 40,
  },
  {
    id: 'rts-supervisor-1',
    situation:
      'Your supervisor has returned your draft with a request for major restructuring two weeks before submission, and you disagree with part of the advice.',
    prompt:
      'Respond to the situation. Speak for between 40 and 90 seconds. You may acknowledge the feedback, raise your concern, and propose a way forward.',
    reference:
      'A student in this position should thank the supervisor for the rapid return, accept the structural points that clearly help, and raise the disagreement with evidence rather than preference. A strong response proposes a compromise draft addressing the agreed changes first, asks for a short meeting before rewriting everything, and confirms the revised deadline in writing.',
    keyTerms: ['feedback', 'disagreement', 'evidence', 'compromise', 'meeting', 'deadline'],
    minWords: 40,
  },
  {
    id: 'rts-neighbour-1',
    situation:
      'Your neighbour’s late-night music is affecting your exam preparation, and previous polite requests have not worked.',
    prompt:
      'Respond to the situation. Speak for between 40 and 90 seconds. You may describe the impact, restate your request, and suggest a compromise.',
    reference:
      'A neighbour in this position should describe the specific disturbance and its effect on exam preparation without accusation, restate the earlier requests and their dates, and propose a concrete compromise such as agreed quiet hours on weeknights. A strong response asks what arrangement would work for both sides and notes the landlord or mediation route only as a last resort.',
    keyTerms: ['disturbance', 'exam', 'requests', 'compromise', 'hours', 'mediation'],
    minWords: 40,
  },
  {
    id: 'rts-library-1',
    situation:
      'You borrowed a laptop from the university library and the screen cracked while it was in your bag on the bus.',
    prompt:
      'Respond to the situation. Speak for between 40 and 90 seconds. You may explain what happened, accept responsibility, and ask about repair or replacement.',
    reference:
      'A borrower in this position should report the damage promptly, explain exactly when and how the crack occurred, and accept responsibility rather than minimising it. A strong response asks about the repair process, the cost liability under the loan terms, and whether a replacement can be issued while the repair is assessed.',
    keyTerms: ['damage', 'crack', 'responsibility', 'repair', 'liability', 'replacement'],
    minWords: 40,
  },
]
