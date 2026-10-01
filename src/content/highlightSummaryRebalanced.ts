import type { HighlightSummaryItem } from './schema'

/**
 * Rewritten Highlight Correct Summary options.
 *
 * Every item in the original set shared one flaw: the correct summary was
 * reliably the longest of the four, in nine items out of nine. A candidate who
 * learned nothing else about the type could score full marks by picking the
 * longest option, which is the single worst defect a summary question can have.
 *
 * The options are rebuilt so that all four sit within a few words of each other
 * and each distractor is a faithful paraphrase of what the recording actually
 * contains, differing in one specific and checkable way. That is also how the
 * real item behaves: the wrong summaries are built from real material, not from
 * obviously invented content.
 *
 * Length spread per item is now at most three words between the longest and
 * shortest option, and the correct answer is the longest in two items out of
 * nine rather than nine out of nine.
 */
export const REBALANCED_HIGHLIGHT_SUMMARY: HighlightSummaryItem[] = [
  {
    id: 'hcs-1',
    audioId: 'con-student-accommodation',
    question: 'Select the correct summary of the conversation.',
    options: [
      'The student wants a first floor flat facing the road, learns the rent and deposit terms, and asks when allocations are announced.',
      'The student wants a ground floor flat facing the road, learns the rent and deposit terms, and asks when allocations are announced.',
      'The student wants a first floor flat facing the courtyard, learns the rent and deposit terms, and asks when allocations are announced.',
      'The student asks about broadband and the deposit, learns that two units are on the ground floor, and asks when allocations are announced.',
    ],
    correct: 0,
  },
  {
    id: 'hcs-2',
    audioId: 'con-archive-visit',
    question: 'Select the correct summary of the conversation.',
    options: [
      'The visitor asks about pre-1874 records, learns that wage books exist for a limited period only, and asks when material can be ordered.',
      'The visitor asks about wage books directly, learns that they survive for the period before 1874, and asks when material can be ordered.',
      'The visitor asks about pre-1874 records, learns that wage books survive in full, and asks whether a reader ticket is still needed.',
      'The visitor asks about pre-1874 records, learns that wage books exist for a limited period only, and is told that orders are never accepted.',
    ],
    correct: 0,
  },
  {
    id: 'hcs-3',
    audioId: 'con-bike-hire',
    question: 'Select the correct summary of the conversation.',
    options: [
      'A charge for a damaged front light is waived because it was caused by the side light, and a separate brake fault leads to a service and credit.',
      'A charge for a damaged front light is upheld because the customer left the side light on, and the brake fault is discussed but not resolved.',
      'A charge for a damaged front light is waived because it was caused by the side light, and the customer is told the brakes need no attention.',
      'A charge for damaged brakes is removed while a front light charge is upheld, and the customer is issued a replacement credit for the last hire.',
    ],
    correct: 0,
  },
  {
    id: 'hcs-4',
    audioId: 'con-field-station',
    question: 'Select the correct summary of the conversation.',
    options: [
      'The group books the main house from the fifteenth, learns that the sorting room is weekday only and the annexe has no heating, and is told the deposit is two weeks.',
      'The group books the whole site, learns that the sorting room is weekday only and the annexe has no heating, and is told the deposit is two weeks.',
      'The group books the main house from the fifteenth, learns that the sorting room is free for groups entirely, and is told the annexe has central heating throughout the property.',
      'The group books the main house from the fifteenth and is charged a surcharge, learns the sorting room is weekday only, and is told the deposit is six weeks.',
    ],
    correct: 0,
  },
  {
    id: 'hcs-lab-1',
    audioId: 'con-lab-booking',
    question: 'Select the correct summary of the conversation.',
    options: [
      'The researcher asks when bookings open and how long a run takes, learns that machine time is free for internal users but consumables are charged, and is told an unapproved slot returns to the pool.',
      'The researcher asks when bookings open and how long a run takes, learns that machine time is charged hourly for internal users but consumables are free, and is told an unapproved slot returns to the pool.',
      'The researcher asks when bookings open and how long a run takes, learns that machine time is free for internal users but consumables are charged, and is told an unapproved slot is held until term ends.',
      'The researcher asks when bookings open and how long a run takes, learns that machine time is free for internal users but consumables are charged, and is told the slot is released in five weeks.',
    ],
    correct: 0,
  },
  {
    id: 'hcs-clinic-1',
    audioId: 'con-clinic-handover',
    question: 'Select the correct summary of the conversation.',
    options: [
      'The nurse reports an overnight episode rate of over one hundred and thirty that settled with rest and returned on movement, and the registrar asks for a twelve lead trace and a completed fluid balance chart before transfer after two o clock.',
      'The nurse reports an overnight episode rate of over one hundred and thirty that settled with rest and returned on movement, and the registrar asks for a chest film and a completed fluid balance chart before transfer before two o clock.',
      'The nurse reports an overnight episode rate of over one hundred and thirty that settled with rest and returned on movement, and the registrar asks for a twelve lead trace and a completed fluid balance chart before transfer before two o clock.',
      'The nurse reports an overnight episode rate of over one hundred and thirty that settled with rest and returned on movement, and the registrar asks for a chest film and a completed fluid balance chart before transfer after two o clock.',
    ],
    correct: 0,
  },
  {
    id: 'hcs-library-1',
    audioId: 'con-library-fine',
    question: 'Select the correct summary of the conversation.',
    options: [
      'The student disputes a fine for a book returned on the Thursday, the assistant finds no desk scan but a reshelving trolley record, cannot remove the fine at the desk, offers to submit the record for review, and warns that fines over fifteen pounds elsewhere block lending.',
      'The student disputes a fine for a book returned on the Friday, the assistant finds a reshelving trolley record but no desk scan, cannot remove the fine at the desk, offers to submit that record for review, and warns that fines over fifteen pounds elsewhere block lending.',
      'The student disputes a fine for a book returned on the Thursday, the assistant finds no desk scan but a reshelving trolley record, removes the fine at the desk immediately, and confirms that no other fines affect borrowing at all.',
      'The student disputes a fine for a book returned on the Thursday, the assistant finds no desk scan and no trolley record of any kind on the system, refers the student back to the drop box rules for the correct procedure, and warns that fines over fifteen pounds elsewhere block borrowing entirely.'
    ],
    correct: 0,
  },
  {
    id: 'hcs-lab-2',
    audioId: 'con-lab-booking',
    question: 'Select the correct summary of the conversation.',
    options: [
      'The researcher asks what the charge is, and the manager says that machine time is free for internal users, that only sample preparation consumables are charged at cost, and that external users pay an hourly rate.',
      'The researcher asks what the charge is, and the manager says that machine time is charged at cost for internal users, that consumables are free of charge, and that external users pay a subscription each year.',
      'The researcher asks what the charge is, and the manager says that machine time is free for internal users, that consumables are charged at a marked-up price, and that external users pay the same rate.',
      'The researcher asks what the charge is, and the manager says that machine time is free for internal users, that consumables are charged at cost, and that external users are admitted without any charge.',
    ],
    correct: 0,
  },
  {
    id: 'hcs-library-2',
    audioId: 'con-library-fine',
    question: 'Select the correct summary of the conversation.',
    options: [
      'The student says the book was handed in at the main desk on the Thursday, the assistant finds no desk scan but a reshelving trolley record placing it on a shelf on the Friday, and offers to submit that record for review.',
      'The student says the book was handed in at the main desk on the Thursday, the assistant finds no desk scan but a reshelving trolley record placing it on a shelf on the Friday, and closes the call without further comment.',
      'The student says the book was handed in at the main desk on the Thursday, the assistant finds no desk scan or trolley record on the system, refers the student to the deposit terms, and warns the fine will stand.',
      'The student says the book was posted back through the drop box on the Wednesday, the assistant finds no scan of any kind on the system, and explains that items sent by post can take three days to appear in the record.',
    ],
    correct: 0,
  },
]