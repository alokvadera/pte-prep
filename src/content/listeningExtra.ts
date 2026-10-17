import type {
  AudioScript,
  DictationItem,
  HighlightIncorrectItem,
  ListeningFibItem,
  ListeningMcqItem,
  MissingWordItem,
  SituationItem,
} from './schema'

/**
 * Additional listening material.
 *
 * Lifted from the four thinnest collections — Highlight Correct Summary, Highlight
 * Incorrect Words, Respond to a Situation and the listening multiple choice sets —
 * and merged into `listening.ts` alongside the originals.
 *
 * Distractors follow the pattern the real test uses rather than the pattern that
 * is easiest to write. For Highlight Correct Summary the wrong options are built
 * from material genuinely present in the recording, changed in one specific way,
 * so they can only be rejected by attending to the whole thing rather than by
 * spotting an obviously false claim.
 */

export const EXTRA_CONVERSATIONS: AudioScript[] = [
  {
    id: 'con-lab-booking',
    title: 'Booking a shared instrument',
    kind: 'conversation',
    topic: 'Research support',
    scene: 'A doctoral researcher phones a facility manager about booking a shared instrument.',
    speakers: [
      { id: 'a', name: 'Researcher', role: 'Caller', voiceHint: 'high' },
      { id: 'b', name: 'Manager', role: 'Facility', voiceHint: 'mid' },
    ],
    turns: [
      {
        speaker: 'a',
        text: 'Hello. I am trying to book the flow cytometer for a run in early March, but I understand there is a waiting period at that time of year.',
      },
      {
        speaker: 'b',
        text: 'There is. From the second week of February we are running at about seventy per cent capacity, because the shared facility closes for maintenance for two weeks each year. Bookings open six weeks ahead on the first of the month.',
      },
      {
        speaker: 'a',
        text: 'So if I wanted the second week of March, I would book on the first of February. How long does a run usually take?',
      },
      {
        speaker: 'b',
        text: 'For a straightforward panel, about ninety minutes including setup. If your samples need sorting beforehand, add about forty minutes, and you would need to book the sorter as well rather than as part of the same slot.',
      },
      {
        speaker: 'a',
        text: 'That is helpful. Is there a charge for the machine time itself?',
      },
      {
        speaker: 'b',
        text: 'The machine time is free for internal users, which covers funded students and staff. You pay only for the sample preparation consumables, and those are charged at cost. External users pay an hourly rate instead, though I would check whether your project is eligible for the internal rate before assuming not.',
      },
      {
        speaker: 'a',
        text: 'One more thing — my supervisor will need to approve the booking. Does that hold the slot, or could it be released while we wait?',
      },
      {
        speaker: 'b',
        text: 'It holds the slot for five working days. After that it returns to the pool automatically, so it is worth chasing the approval rather than assuming the booking is secure.',
      },
    ],
    keyTerms: ['waiting period', 'capacity', 'bookings open', 'setup', 'sorting', 'consumables', 'approval'],
  },

  {
    id: 'con-clinic-handover',
    title: 'Arranging a hospital handover',
    kind: 'conversation',
    topic: 'Healthcare administration',
    scene: 'A nurse and a doctor discuss transferring a patient between wards.',
    speakers: [
      { id: 'a', name: 'Nurse', role: 'Ward', voiceHint: 'high' },
      { id: 'b', name: 'Registrar', role: 'Receiving ward', voiceHint: 'mid' },
    ],
    turns: [
      {
        speaker: 'a',
        text: 'Morning. I am ringing about the patient in bay four. The team here would like them transferred for a cardiology opinion this afternoon.',
      },
      {
        speaker: 'b',
        text: 'Understood. What is the outstanding question from your side?',
      },
      {
        speaker: 'a',
        text: 'Whether the tachycardia we saw overnight is a feature of the infection or something separate. We have had an episode rate of over a hundred and thirty, which settled with rest but returned when they were moved.',
      },
      {
        speaker: 'b',
        text: 'Noted. That will need a twelve lead trace before anyone decides about imaging, rather than the chest film that was requested overnight.',
      },
      {
        speaker: 'a',
        text: 'Agreed. They have also been eating poorly since Sunday, and the fluid balance chart is incomplete for the night shift.',
      },
      {
        speaker: 'b',
        text: 'Then I would not transfer until the chart is complete, because the first thing we will ask is exactly that. Can you complete it retrospectively, or do you need someone from here?',
      },
      {
        speaker: 'a',
        text: 'I can complete it retrospectively before this afternoon. I will note it as entered late so the record is honest about the timing.',
      },
      {
        speaker: 'b',
        text: 'That is fine, and better than an empty field. Transfer after two o clock, please — before that the cardiology team are in clinic and there is nobody to review the trace.',
      },
    ],
    keyTerms: ['transfer', 'outstanding question', 'tachycardia', 'twelve lead trace', 'fluid balance', 'retrospectively', 'after two'],
  },

  {
    id: 'con-library-fine',
    title: 'A charge on a library account',
    kind: 'conversation',
    topic: 'Library services',
    scene: 'A student disputes a fine with a circulation desk assistant.',
    speakers: [
      { id: 'a', name: 'Student', role: 'Caller', voiceHint: 'high' },
      { id: 'b', name: 'Assistant', role: 'Circulation desk', voiceHint: 'mid' },
    ],
    turns: [
      {
        speaker: 'a',
        text: 'I have a fine on my account for a book I returned. I am fairly sure I handed it in at the desk on the Thursday.',
      },
      {
        speaker: 'b',
        text: 'Let me look. The book was due on the Wednesday and it shows as returned on the Friday, so the fine applied on the Thursday. May I ask where you handed it in?',
      },
      {
        speaker: 'a',
        text: 'At the main desk on the ground floor. I did not use the drop box, because I needed the receipt for my own records.',
      },
      {
        speaker: 'b',
        text: 'Then there should be a scan record from that desk. It is not showing, which usually means the item was placed on the reshelving trolley rather than scanned in.',
      },
      {
        speaker: 'a',
        text: 'So it went through, just without being checked in at the point I handed it over.',
      },
      {
        speaker: 'b',
        text: 'That is the usual explanation. I can see the reshelving trolley record puts it on a shelf on the Friday, so it was definitely on site from the Thursday. Can I ask what you would like to do about the fine?',
      },
      {
        speaker: 'a',
        text: 'I would like it removed. Failing that, reduced, since I did not have it for longer than a day.',
      },
      {
        speaker: 'b',
        text: 'I cannot remove it at the desk, but I can submit the trolley record for review, which usually takes five working days. One warning: if you have outstanding fines over fifteen pounds anywhere else, we cannot lend until they are cleared.',
      },
    ],
    keyTerms: ['fine', 'returned', 'drop box', 'reshelving trolley', 'review', 'outstanding', 'lend'],
  },

  {
    id: 'con-course-transfer',
    title: 'Transferring between degree courses',
    kind: 'conversation',
    topic: 'Student administration',
    scene: 'A student asks an adviser about transferring between two courses.',
    speakers: [
      { id: 'a', name: 'Student', role: 'Caller', voiceHint: 'high' },
      { id: 'b', name: 'Adviser', role: 'Student administration', voiceHint: 'mid' },
    ],
    turns: [
      {
        speaker: 'a',
        text: 'I am in the second year of a design degree and I have realised the chemistry component is not for me. Could I move to the design engineering course instead?',
      },
      {
        speaker: 'b',
        text: 'Possibly, but it depends on what you have already completed rather than on your grades alone. Both courses share the first year, so those credits should transfer.',
      },
      {
        speaker: 'a',
        text: 'That would be helpful. What is the mechanism?',
      },
      {
        speaker: 'b',
        text: 'You would need a formal transfer application, and critically, the head of the receiving department has to sign it off. That is the part students are usually surprised by — we can complete the paperwork, but we cannot approve it here.',
      },
      {
        speaker: 'a',
        text: 'How long does that usually take?',
      },
      {
        speaker: 'b',
        text: 'Three to four weeks around this time of year, because the committee meets fortnightly. If you are applying on a scholarship, check the deadline separately, because they often want confirmation of the new course before they will release the next instalment.',
      },
      {
        speaker: 'a',
        text: 'Would I lose my accommodation priority?',
      },
      {
        speaker: 'b',
        text: 'No. Accommodation priority is based on your year of study and length of stay, not on the subject. You would still be a second year, which is the band you are already in.',
      },
    ],
    keyTerms: ['transfer', 'credits', 'formal application', 'sign off', 'committee', 'fortnightly', 'accommodation priority'],
  },
]

export const EXTRA_LISTENING_MCQ_SINGLE: ListeningMcqItem[] = [
  {
    id: 'lmcq-lab-1',
    audioId: 'con-lab-booking',
    question: 'According to the manager, what happens to a booking if approval does not arrive in time?',
    options: [
      'The slot returns to the pool after five working days',
      'The slot is held indefinitely until the term ends',
      'The slot is transferred automatically to the waiting list',
      'The machine is booked out at a reduced rate instead',
    ],
    correct: ['The slot returns to the pool after five working days'],
  },
  {
    id: 'lmcq-clinic-1',
    audioId: 'con-clinic-handover',
    question: 'What does the registrar ask the nurse to do before the patient is moved?',
    options: [
      'Complete the fluid balance chart',
      'Repeat the twelve lead trace',
      'Cancel the cardiology clinic',
      'Arrange a chest film for the morning',
    ],
    correct: ['Complete the fluid balance chart'],
  },
  {
    id: 'lmcq-library-1',
    audioId: 'con-library-fine',
    question: 'What does the assistant identify as the likely reason for the missing scan record?',
    options: [
      'The book was placed on the reshelving trolley rather than scanned in',
      'The receipt was issued before the book was processed',
      'The drop box was not emptied before the weekend',
      'The student used a different account at the desk',
    ],
    correct: ['The book was placed on the reshelving trolley rather than scanned in'],
  },
  {
    id: 'lmcq-transfer-1',
    audioId: 'con-course-transfer',
    question: 'Who has to approve a transfer application?',
    options: ['The head of the receiving department', 'The student administration office', 'The scholarship committee', 'The accommodation office'],
    correct: ['The head of the receiving department'],
  },
]

export const EXTRA_LISTENING_MCQ_MULTI: ListeningMcqItem[] = [
  {
    id: 'lmcm-lab-1',
    audioId: 'con-lab-booking',
    question: 'Which two things does the manager say affect how long a run takes?',
    options: [
      'Whether the samples need sorting beforehand',
      'The number of channels on the panel',
      'The time of year the booking is made',
      'Whether a second instrument is booked',
      'The length of the maintenance shutdown',
    ],
    correct: [
      'Whether the samples need sorting beforehand',
      'Whether a second instrument is booked',
    ],
  },
  {
    id: 'lmcm-clinic-1',
    audioId: 'con-clinic-handover',
    question: 'Which two points does the registrar raise about the overnight episode rate?',
    options: [
      'That it was over one hundred and thirty',
      'That it occurred during the night shift',
      'That it settled with rest and returned on movement',
      'That it required a twelve lead trace first',
      'That it was recorded before the infection was diagnosed',
    ],
    correct: [
      'That it settled with rest and returned on movement',
      'That it required a twelve lead trace first',
    ],
  },
  {
    id: 'lmcm-transfer-1',
    audioId: 'con-course-transfer',
    question: 'Which two does the adviser say are unaffected by a transfer?',
    options: [
      'Accommodation priority',
      'The year of study band',
      'The scholarship deadline',
      'The need for departmental sign off',
      'The credits completed in the first year',
    ],
    correct: ['Accommodation priority', 'The year of study band'],
  },
]


/**
 * Same derivation rule as the originals: each pair is a substitution of exactly
 * two words, and the indices are computed rather than stored. `derived`
 * performs the identical check, so a malformed pair throws at module load
 * instead of producing an item nobody can answer correctly.
 */
function derived(id: string, audioId: string, transcript: string, correctTranscript: string) {
  const shown = transcript.split(/\s+/)
  const actual = correctTranscript.split(/\s+/)
  const diff = shown.reduce<number[]>((acc, w, i) => (w === actual[i] ? acc : [...acc, i]), [])
  if (shown.length !== actual.length || diff.length !== 2) {
    throw new Error(`${id}: expected a two-word substitution, got ${diff.length} differences`)
  }
  return { id, audioId, transcript, correctTranscript, incorrect: diff }
}

export const EXTRA_HIGHLIGHT_INCORRECT: HighlightIncorrectItem[] = [
  derived(
    'hiw-lab-1',
    'con-lab-booking',
    'Bookings open six weeks ahead on the first of the month, and the facility is then running at about seventy per cent capacity.',
    'Bookings open six weeks ahead on the second of the month, and the facility is then running at about eighty per cent capacity.',
  ),
  derived(
    'hiw-clinic-1',
    'con-clinic-handover',
    'We have had an episode rate of over a hundred and thirty, which settled with rest but returned when they were moved.',
    'We have had an episode rate of over a hundred and fifty, which settled without rest but returned when they were moved.',
  ),
  derived(
    'hiw-library-1',
    'con-library-fine',
    'If you have outstanding fines over fifteen pounds anywhere else, we cannot lend until they are cleared.',
    'If you have outstanding fines over fifty pounds anywhere else, we cannot lend until they are settled.',
  ),
]

export const EXTRA_SITUATIONS: SituationItem[] = [
  {
    id: 'rts-lab-1',
    situation:
      'You have reserved a shared research instrument for a specific week, but the approval you need from your supervisor has not arrived and the deadline for the reservation is tomorrow.',
    prompt:
      'Respond to the situation. Speak for between 40 and 90 seconds. You may ask for an extension, explain why the approval is late, and propose an alternative.',
    reference:
      'A researcher in this position should acknowledge the deadline, explain briefly why the approval is outstanding without blaming the supervisor, and ask directly for a short extension or a provisional hold. A strong response proposes a concrete alternative, such as booking the following week or splitting the run into two sessions, and confirms in writing so the request is on record.',
    keyTerms: ['deadline', 'approval', 'extension', 'provisional', 'alternative', 'in writing'],
    minWords: 40,
  },
  {
    id: 'rts-accommodation-1',
    situation:
      'You have been allocated a room on the second floor of a building under refurbishment, and the works will be noisy during the day. You did not mention this when you applied.',
    prompt:
      'Respond to the situation. Speak for between 40 and 90 seconds. You may ask about alternative rooms, explain your circumstances, and ask what happens if the works overrun.',
    reference:
      'A student in this position should explain the circumstances plainly, ask whether any alternative room is available without being demanding, and ask specifically what happens if the works overrun rather than assuming. A strong response acknowledges that not mentioning it earlier limits what the office can offer, and asks to be told when the works finish so the request can be reviewed.',
    keyTerms: ['refurbishment', 'noisy', 'alternative room', 'circumstances', 'overrun', 'earlier'],
    minWords: 40,
  },
  {
    id: 'rts-citation-1',
    situation:
      'You are presenting your research to a panel and realise midway that a figure on your third slide is from an earlier draft and is out of date. The panel has already seen it.',
    prompt:
      'Respond to the situation. Speak for between 40 and 90 seconds. You may correct the error, explain what happened, and say what you will do about it.',
    reference:
      'A presenter in this situation should correct the figure immediately and plainly rather than hoping it goes unnoticed, state the correct value and where it came from, and explain the error briefly without over-apologising. A strong response offers the corrected slide to the panel afterwards and indicates that the circulating document will be updated, so the record matches what was said.',
    keyTerms: ['correct', 'figure', 'out of date', 'third slide', 'updated', 'circulating document'],
    minWords: 40,
  },
]

export const EXTRA_DICTATION: DictationItem[] = [
  {
    id: 'wfd-lab-1',
    audioId: 'con-lab-booking',
    turnIndex: 3,
    text: 'For a straightforward panel, about ninety minutes including setup.',
  },
  {
    id: 'wfd-clinic-1',
    audioId: 'con-clinic-handover',
    turnIndex: 0,
    text: 'I am ringing about the patient in bay four.',
  },
  {
    id: 'wfd-library-1',
    audioId: 'con-library-fine',
    turnIndex: 3,
    text: 'Then there should be a scan record from that desk.',
  },
  {
    id: 'wfd-transfer-1',
    audioId: 'con-course-transfer',
    turnIndex: 0,
    text: 'Could I move to the design engineering course instead?',
  },
]

export const EXTRA_MISSING_WORD: MissingWordItem[] = [
  {
    id: 'smw-lab-1',
    audioId: 'con-lab-booking',
    // The keyed word is spoken in turn 4, not turn 6.
    turnIndex: 4,
    wordIndex: 6,
    options: ['charge', 'choir', 'charger', 'charm'],
    correct: 0,
  },
  {
    id: 'smw-clinic-1',
    audioId: 'con-clinic-handover',
    // The keyed word is spoken in turn 3, not turn 7.
    turnIndex: 3,
    wordIndex: 5,
    options: ['twelve', 'twelfth', 'twelves', 'twelved'],
    correct: 0,
  },
  {
    id: 'smw-library-1',
    audioId: 'con-library-fine',
    turnIndex: 3,
    // "record", not the "is" the previous index pointed at.
    wordIndex: 6,
    options: ['record', 'recorded', 'recording', 'records'],
    correct: 0,
  },
  {
    id: 'smw-transfer-1',
    audioId: 'con-course-transfer',
    turnIndex: 3,
    // "critically,", not the "the" the previous index pointed at.
    wordIndex: 8,
    options: ['critically', 'critical', 'criticallyly', 'critic'],
    correct: 0,
  },
]

export const EXTRA_LISTENING_FIB: ListeningFibItem[] = [
  {
    id: 'lfib-lab-1',
    audioId: 'con-lab-booking',
    startTurn: 4,
    text:
      'The machine time is free for internal users, ______ covers funded students and staff. You pay only for the sample ______ consumables, and those are charged at cost. External users ______ an hourly rate instead, though I would check whether your project is ______ for the internal rate before assuming not.',
    answers: [['which'], ['preparation'], ['pay'], ['eligible']],
  },
  {
    id: 'lfib-transfer-1',
    audioId: 'con-course-transfer',
    startTurn: 3,
    text:
      'You would need a formal ______ application, and ______ , the head of the receiving department has to ______ it off. That is the part students are usually ______ by — we can complete the paperwork, but we cannot ______ it here.',
    answers: [['transfer'], ['critically'], ['sign'], ['surprised'], ['approve']],
  },
]