import type {
  AsqItem,
  AudioScript,
  DictationItem,
  HighlightIncorrectItem,
  HighlightSummaryItem,
  ListeningFibItem,
  ListeningMcqItem,
  MissingWordItem,
  SituationItem,
} from './schema'
import {
  EXTRA_CONVERSATIONS,
  EXTRA_DICTATION,
  EXTRA_HIGHLIGHT_INCORRECT,
  EXTRA_LISTENING_FIB,
  EXTRA_LISTENING_MCQ_MULTI,
  EXTRA_LISTENING_MCQ_SINGLE,
  EXTRA_MISSING_WORD,
  EXTRA_SITUATIONS,
} from './listeningExtra'
import {
  EXTRA_SITUATIONS_2,
  EXTRA_HIGHLIGHT_INCORRECT_2,
} from './listeningExtra2'
import { REBALANCED_HIGHLIGHT_SUMMARY } from './highlightSummaryRebalanced'
import {
  EXTRA_CONVERSATIONS_3,
  EXTRA_LISTENING_MCQ_SINGLE_3,
  EXTRA_LISTENING_MCQ_MULTI_3,
  EXTRA_HIGHLIGHT_SUMMARY_3,
  EXTRA_HIGHLIGHT_INCORRECT_3,
  EXTRA_DICTATION_3,
  EXTRA_MISSING_WORD_3,
  EXTRA_SITUATIONS_3,
} from './listeningExtra3'
import {
  EXTRA_CONVERSATIONS_4,
  EXTRA_LISTENING_FIB_4,
  EXTRA_HIGHLIGHT_SUMMARY_4,
  EXTRA_LISTENING_MCQ_SINGLE_4,
  EXTRA_LISTENING_MCQ_MULTI_4,
  EXTRA_HIGHLIGHT_INCORRECT_4,
  EXTRA_DICTATION_4,
  EXTRA_MISSING_WORD_4,
  EXTRA_SITUATIONS_4,
} from './listeningExtra4'
import {
  EXTRA_CONVERSATIONS_5,
  EXTRA_LISTENING_FIB_5,
  EXTRA_HIGHLIGHT_SUMMARY_5,
  EXTRA_LISTENING_MCQ_SINGLE_5,
  EXTRA_LISTENING_MCQ_MULTI_5,
  EXTRA_HIGHLIGHT_INCORRECT_5,
  EXTRA_DICTATION_5,
  EXTRA_MISSING_WORD_5,
  EXTRA_SITUATIONS_5,
} from './listeningExtra5'
import {
  EXTRA_DICTATION_6,
  EXTRA_MISSING_WORD_6,
  EXTRA_HIGHLIGHT_INCORRECT_6,
  EXTRA_LISTENING_FIB_6,
  EXTRA_HIGHLIGHT_SUMMARY_6,
  EXTRA_LISTENING_MCQ_SINGLE_6,
  EXTRA_LISTENING_MCQ_MULTIPLE_6,
  EXTRA_SITUATIONS_6,
} from './listeningExtra6'
import { EXTRA_CONVERSATIONS_6 } from './audioExtra4'
import { EXTRA_CONVERSATIONS_7 } from './listeningExtra7'
import {
  EXTRA_DICTATION_8,
  EXTRA_MISSING_WORD_8,
  EXTRA_HIGHLIGHT_INCORRECT_8,
  EXTRA_LISTENING_FIB_8,
  EXTRA_HIGHLIGHT_SUMMARY_8,
  EXTRA_LISTENING_MCQ_SINGLE_8,
  EXTRA_LISTENING_MCQ_MULTI_8,
  EXTRA_SITUATIONS_8,
} from './listeningExtra8'

// ---------------------------------------------------------------------------
// Listening stimuli. Each conversation supports several item types, exactly as
// a real test reuses one recording across multiple questions.
// ---------------------------------------------------------------------------

export const CONVERSATIONS: AudioScript[] = [
  {
    id: 'con-student-accommodation',
    title: 'Accommodation enquiry',
    kind: 'conversation',
    topic: 'Student services',
    scene: 'A student phones a university accommodation office.',
    speakers: [
      { id: 'a', name: 'Student', role: 'Caller', voiceHint: 'high' },
      { id: 'b', name: 'Officer', role: 'Accommodation office', voiceHint: 'mid' },
    ],
    turns: [
      { speaker: 'a', text: 'Good morning. I am calling about the studio flats you have listed for the coming academic year. I was wondering whether they are still available.' },
      { speaker: 'b', text: 'Good morning. Yes, we have four left, though I should tell you that two of them are on the ground floor.' },
      { speaker: 'a', text: 'Is that a problem? I was hoping for something on a higher floor because the road noise is quite heavy in the evening.' },
      { speaker: 'b', text: 'It is not a problem for availability, it is just a factor. The two ground floor units face the courtyard side, which is much quieter than the road side. The two first floor units face the road.' },
      { speaker: 'a', text: 'That would suit me. What is the rent for the courtyard-facing one?' },
      { speaker: 'b', text: 'The studio flats are four hundred and eighty pounds per calendar month, including bills, but not including broadband, which is a further twenty-two pounds.' },
      { speaker: 'a', text: 'And there is a deposit?' },
      { speaker: 'b', text: 'There is a deposit of three hundred pounds. It is held in a government-backed scheme for the duration of your tenancy and it is returned within fourteen days of leaving, provided the property is in good condition.' },
      { speaker: 'a', text: 'Is that everything? I have read that some universities require insurance.' },
      { speaker: 'b', text: 'They do, and we do as well, but students on the standard plan get it free if they enrol through the university service. If you bring your own policy you are not charged separately for the office check.' },
      { speaker: 'a', text: 'One more thing — what is the application deadline?' },
      { speaker: 'b', text: 'The deadline is the thirty-first of October, but allocations are made in two rounds. Applications received by the first round are notified in November, and the second round is notified in January.' },
      { speaker: 'a', text: 'That is very helpful, thank you.' },
    ],
    keyTerms: ['studio', 'courtyard', 'deposit', 'insurance', 'deadline'],
  },
  {
    id: 'con-lab-notebook',
    title: 'Lost laboratory notebook',
    kind: 'conversation',
    topic: 'University administration',
    scene: 'A postgraduate student speaks to a laboratory manager.',
    speakers: [
      { id: 'a', name: 'Priya', role: 'Student', voiceHint: 'mid-high' },
      { id: 'b', name: 'Manager', role: 'Laboratory manager', voiceHint: 'low' },
    ],
    turns: [
      { speaker: 'a', text: 'Hello, I think I left my laboratory notebook in the teaching laboratory yesterday afternoon. Is there any chance someone handed it in?' },
      { speaker: 'b', text: 'Let me check the lost property list. We do have a red laboratory notebook that was handed in at about four thirty. Does that match yours?' },
      { speaker: 'a', text: 'Yes, that is the one. The cover is red and there is a white label on the front with my initials.' },
      { speaker: 'b', text: 'That initials check confirms it. I can put it aside for you. There is a procedure, though — for health and safety reasons we need a written record of who collected it and when.' },
      { speaker: 'a', text: 'Of course. Should I come to the office, or would it be better to arrange a time?' },
      { speaker: 'b', text: 'I am in the office on Thursday and Friday mornings, usually between nine and eleven. If you come then I can complete the form with you there.' },
      { speaker: 'a', text: 'Thursday morning would work. Is there anything I need to bring?' },
      { speaker: 'b', text: 'Bring your student identification, and the notebook itself obviously. If you want the record to be complete, also bring the module code, because the form asks which practical the notebook belongs to.' },
      { speaker: 'a', text: 'The module code is BIO302. The practical was the third one we did, on the membrane techniques.' },
      { speaker: 'b', text: 'I will note that down. One thing I should mention — the notebook is retained for at least twelve months after the module finishes, so please make a scanned copy for yourself before you take it away.' },
      { speaker: 'a', text: 'I did not realise that. Is that the same for all records?' },
      { speaker: 'b', text: 'For anything involving live samples, yes, and for data derived from them. Purely computational work is different, and you can keep that in your own files. Thank you Priya, see you on Thursday.' },
    ],
    keyTerms: ['notebook', 'lost property', 'identification', 'module code', 'retained'],
  },
  {
    id: 'con-field-station',
    title: 'Booking a field station',
    kind: 'conversation',
    topic: 'Fieldwork administration',
    scene: 'A researcher telephones a coastal field station.',
    speakers: [
      { id: 'a', name: 'Dr Marsh', role: 'Researcher', voiceHint: 'mid' },
      { id: 'b', name: 'Assistant', role: 'Field station', voiceHint: 'mid-high' },
    ],
    turns: [
      { speaker: 'a', text: 'Hello. I would like to book accommodation for a group of six people for two weeks in September. Is that possible?' },
      { speaker: 'b', text: 'It is possible, but I should warn you that the main house is closed for maintenance until the fifteenth, so you would be starting in the second week of the month.' },
      { speaker: 'a', text: 'That works. We are sampling intertidal invertebrates, so we need the lab benches for most mornings.' },
      { speaker: 'b', text: 'The benches are free for groups, but there is a charge for the sorting room, and the sorting room is only available on weekdays because the volunteer group uses it at the weekend.' },
      { speaker: 'a', text: 'Weekdays is fine. What about the additional security fee that was mentioned in the notice?' },
      { speaker: 'b', text: 'Yes — because the site is a protected area, the trust requires that nobody works alone after dark. The fee covers a second person being on site in the evening, and it is mandatory rather than optional.' },
      { speaker: 'a', text: 'Understood. Can you tell me what facilities are included? I need to know whether there is heating in the accommodation.' },
      { speaker: 'b', text: 'The main house has central heating throughout, but the annexe has no heating — only portable heaters, which we provide. The annexe is cheaper by about thirty per cent, and most groups take a mix of the two.' },
      { speaker: 'a', text: 'We will take a mix, then. What is the deposit arrangement?' },
      { speaker: 'b', text: 'The deposit is two weeks of the quoted rate. It is refundable, and in practice it has been refunded every year except once, when a room was damaged.' },
      { speaker: 'a', text: 'Thank you. Could you email the booking form?' },
      { speaker: 'b', text: 'I will send it now. It asks for the number of single rooms, the number of double rooms, and the name of the institution for the insurance certificate.' },
    ],
    keyTerms: ['maintenance', 'sorting room', 'security fee', 'annexe', 'deposit'],
  },
  {
    id: 'con-gym-membership',
    title: 'Membership terms and conditions',
    kind: 'conversation',
    topic: 'Consumer services',
    scene: 'A member queries a gym about a frozen membership.',
    speakers: [
      { id: 'a', name: 'Member', role: 'Caller', voiceHint: 'mid' },
      { id: 'b', name: 'Advisor', role: 'Gym', voiceHint: 'mid-high' },
    ],
    turns: [
      { speaker: 'a', text: 'Hi, my membership has been frozen since January. What happens if I want to start going again?' },
      { speaker: 'b', text: 'A frozen membership can be reactivated at any time without a re-registration fee. You just need to call before the last day of the month, and the reactivation takes effect from the first of the next month.' },
      { speaker: 'a', text: 'And the monthly fee is the same as before?' },
      { speaker: 'b', text: 'It is the same rate you were on when you froze, not necessarily the current rate. If your original plan has since been discontinued, you can stay on the legacy rate or move to the current one, whichever is cheaper for you.' },
      { speaker: 'a', text: 'Good to know. What about the swimming pool — is that included while a membership is frozen?' },
      { speaker: 'b', text: 'The pool is included in the standard plan but not in the frozen state, and you can pay a day pass if you want to use it while your membership is inactive.' },
      { speaker: 'a', text: 'I have heard that the frozen membership still counts towards the limit of three months.' },
      { speaker: 'b', text: 'The limit is three months per calendar year, and the count begins on the first day of the month in which you freeze. If you freeze on the first, you can only freeze until the end of March in the same year.' },
      { speaker: 'a', text: 'That is not what I had understood.' },
      { speaker: 'b', text: 'It is a common misunderstanding. Some of the promotions we ran last year were more generous, but the standard terms have been the same since we changed them two years ago, and the current terms are the ones on your contract.' },
      { speaker: 'a', text: 'Okay. And the annual fee for the swimming instruction course is separate?' },
      { speaker: 'b', text: 'It is separate, yes, and it is charged per term. But if you freeze the gym membership, the instruction course continues at the same rate because the two are billed independently.' },
    ],
    keyTerms: ['reactivation', 'legacy rate', 'frozen state', 'calendar year', 'billed independently'],
  },
  {
    id: 'con-volcano-visit',
    title: 'Planning a volcano field visit',
    kind: 'conversation',
    topic: 'Geography fieldwork',
    scene: 'A tour operator briefs a group before a volcano walk.',
    speakers: [
      { id: 'a', name: 'Guide', role: 'Guide', voiceHint: 'low' },
      { id: 'b', name: 'Participant', role: 'Group member', voiceHint: 'high' },
    ],
    turns: [
      { speaker: 'a', text: 'We have about forty minutes before we reach the viewing platform, so I will run through the plan and the safety brief now rather than later. Are you all wearing sturdy footwear?' },
      { speaker: 'a', text: 'The walk is about three kilometres return and it is a steady climb, so tell me now if anyone has a knee or respiratory problem. The path is compacted gravel for most of the way and the last section has steps, so it is not suitable for wheelchairs.' },
      { speaker: 'b', text: 'Are the ash clouds a problem this time of year?' },
      { speaker: 'a', text: 'Not at the moment. We monitor the tremor continuously and the summit is currently open. If the wind direction changes, we turn back — we do not wait. In the last three years we have turned back twice, and both times it was within an hour of departure.' },
      { speaker: 'b', text: 'What is on the guide to see at the platform?' },
      { speaker: 'a', text: 'You can see the main crater, the older lava field from 1953, and the new vent that opened last winter. From the ridge on a clear day you can see the coast, and occasionally the island offshore.' },
      { speaker: 'b', text: 'Do we need to bring water, or is it available at the top?' },
      { speaker: 'a', text: 'Bring your own. There is a vending point at the car park but it is expensive and it closes early. We do refill bottles at the halfway point, so if you have containers, bring them empty.' },
    ],
    keyTerms: ['return', 'steps', 'turn back', 'crater', 'halfway point'],
  },
  {
    id: 'con-archive-visit',
    title: 'Visiting a city archive',
    kind: 'conversation',
    topic: 'Archives and research',
    scene: 'A visitor speaks to an archivist about accessing a collection.',
    speakers: [
      { id: 'a', name: 'Visitor', role: 'Researcher', voiceHint: 'mid-high' },
      { id: 'b', name: 'Archivist', role: 'Archive', voiceHint: 'low' },
    ],
    turns: [
      { speaker: 'a', text: 'I am researching nineteenth-century milling in this region. Do you hold the records of the mill company?' },
      { speaker: 'b', text: 'We hold the company archive from 1874 until 1979. The earlier records went to the county record office in 1962, so you would need to contact them for anything before that date.' },
      { speaker: 'a', text: 'What is actually in your holdings? I am particularly interested in wage records.' },
      { speaker: 'b', text: 'We have ledgers of accounts, minute books, and correspondence. The wage books survive only for 1881 to 1894, which is unfortunately the least complete part of the series, but they are fully digitised and you can consult them without handling the originals.' },
      { speaker: 'a', text: 'That is good news. What do I need in order to get a reader\'s ticket?' },
      { speaker: 'b', text: 'Proof of identity and proof of address, and we ask for a reference from an academic institution or a supervisor. The ticket lasts for two years, after which you reapply.' },
      { speaker: 'a', text: 'And once I have a ticket, can I order material on the same day?' },
      { speaker: 'b', text: 'The same day if it is already in the reading room, but you must order before noon because the material is retrieved at midday. Anything requiring conservation goes through a different route and normally takes two weeks.' },
      { speaker: 'a', text: 'Are there restrictions on photographing the documents?' },
      { speaker: 'b', text: 'You may photograph anything that has no copyright restriction and no donor condition, using our cameras or your own phone. A small number of items have a donor restriction requiring written permission, and the catalog will flag those.' },
    ],
    keyTerms: ['county record office', 'wage books', 'reader\'s ticket', 'retrieved at midday', 'photograph'],
  },
  {
    id: 'con-bike-hire',
    title: 'Resolving a bike hire problem',
    kind: 'conversation',
    topic: 'Consumer services',
    scene: 'A customer contacts a bike hire company about a damaged hire.',
    speakers: [
      { id: 'a', name: 'Customer', role: 'Caller', voiceHint: 'mid' },
      { id: 'b', name: 'Support', role: 'Bike hire', voiceHint: 'mid-high' },
    ],
    turns: [
      { speaker: 'a', text: 'I returned the bike last night and it is now showing a charge for a damaged front light. I did not damage it.' },
      { speaker: 'b', text: 'Let me look at the report. The charge was raised by the mechanic who inspected the bike, so I can see why it was applied, but I can also see the inspection photographs, and there is no damage visible on the light housing.' },
      { speaker: 'a', text: 'So what caused it?' },
      { speaker: 'b', text: 'Most likely the side light was left switched on. When the battery runs flat the indicator can stick on, and the system interprets the persistent drain as a fault. We see this several times a week.' },
      { speaker: 'a', text: 'That is not something the customer can be expected to know.' },
      { speaker: 'b', text: 'No, and in fairness that is on us — the handbook does say it, but it is on page nine. I will waive the charge. Before I do, can you confirm the ending of the hire code so I can attach the note to the right booking?' },
      { speaker: 'a', text: 'It ends in four seven two.' },
      { speaker: 'b', text: 'That is the right booking, thank you. The charge is waived and it will not reappear. Separately, are you happy with the bike otherwise?' },
      { speaker: 'a', text: 'The brakes were quite poor, which is why I called about the bike at all.' },
      { speaker: 'b', text: 'That is not good enough. I will book a full service and send you a replacement bike credit for the last hire, because the bike should not have left the depot in that condition.' },
      { speaker: 'a', text: 'I appreciate that. Thank you.' },
    ],
    keyTerms: ['inspection photographs', 'side light', 'waive', 'brakes', 'replacement credit'],
  },
  {
    id: 'con-rehearsal',
    title: 'Rehearsal room booking',
    kind: 'conversation',
    topic: 'Performing arts',
    scene: 'A student speaks to a music department about a rehearsal room.',
    speakers: [
      { id: 'a', name: 'Student', role: 'Caller', voiceHint: 'mid-high' },
      { id: 'b', name: 'Administrator', role: 'Music department', voiceHint: 'mid' },
    ],
    turns: [
      { speaker: 'a', text: 'Hello, I am trying to book a rehearsal room for the college chamber orchestra. We need somewhere for the whole afternoon.' },
      { speaker: 'b', text: 'How many players are in the orchestra?' },
      { speaker: 'a', text: 'About twenty-five, with double basses.' },
      { speaker: 'b', text: 'Then you will need the large hall, not the studio. The studio has a hard limit of eight, and we will not book it for a group larger than that because the acoustic is wrong for anything but small ensembles.' },
      { speaker: 'a', text: 'The large hall is available on Wednesdays, but is it possible to book it for a Tuesday as well?' },
      { speaker: 'b', text: 'It is possible on Tuesdays until two in the afternoon, because the hall is used for timetabled lessons before then. After two, it is free, and Wednesday is free all day.' },
      { speaker: 'a', text: 'And what does it cost?' },
      { speaker: 'b', text: 'For enrolled groups it is free, but we charge a fifty-pound administration fee to any external group, and that has to be paid before the booking is confirmed.' },
      { speaker: 'a', text: 'We are enrolled, so the fee should not apply.' },
      { speaker: 'b', text: 'Correct, in which case the booking only needs the department administrator to approve it. There is a limit of two consecutive bookings per group per week, so Wednesday and the following Tuesday would be the maximum for you.' },
      { speaker: 'a', text: 'That is what we need, thank you very much.' },
      { speaker: 'b', text: 'Send me the ensemble name and the academic year, and I will process it today.' },
    ],
    keyTerms: ['large hall', 'hard limit of eight', 'timetabled lessons', 'enrolled', 'two consecutive bookings'],
  },
  ...EXTRA_CONVERSATIONS,
  ...EXTRA_CONVERSATIONS_3,
  ...EXTRA_CONVERSATIONS_4,
  ...EXTRA_CONVERSATIONS_5,
  ...EXTRA_CONVERSATIONS_6,
  ...EXTRA_CONVERSATIONS_7,
]

// ---------------------------------------------------------------------------
// Answer Short Question — short single-speaker recordings + one question each
// ---------------------------------------------------------------------------

export interface AsqRecording {
  audio: AudioScript
  item: AsqItem
}

export const ASQ_RECORDINGS: AsqRecording[] = [
  {
    audio: {
      id: 'asq-aud-1',
      title: 'Museum opening',
      kind: 'single-speaker',
      topic: 'Announcement',
      speakers: [{ id: 's', name: 'Speaker', voiceHint: 'mid' }],
      turns: [{ speaker: 's', text: 'The city museum will be open from ten until six on weekdays and from eleven until four at the weekend. Admission is free for residents with a library card.' }],
    },
    item: { id: 'asq-1', question: 'What do residents need to get free admission?', options: ['A library card', 'A student card', 'A passport'], correct: 'A library card' },
  },
  {
    audio: {
      id: 'asq-aud-2',
      title: 'Course prerequisite',
      kind: 'single-speaker',
      topic: 'Academic announcement',
      speakers: [{ id: 's', name: 'Speaker', voiceHint: 'mid-high' }],
      turns: [{ speaker: 's', text: 'To take the second-year module, you must have completed the first-year statistics course and passed the placement test administered in September.' }],
    },
    item: { id: 'asq-2', question: 'What must students do in September?', options: ['Take a placement test', 'Submit an essay', 'Attend a lecture'], correct: 'Take a placement test' },
  },
  {
    audio: {
      id: 'asq-aud-3',
      title: 'Library closure',
      kind: 'single-speaker',
      topic: 'Announcement',
      speakers: [{ id: 's', name: 'Speaker', voiceHint: 'low' }],
      turns: [{ speaker: 's', text: 'The main library will close at four on Friday for routine maintenance and will reopen at eight the following Monday.' }],
    },
    item: { id: 'asq-3', question: 'At what time will the library reopen on Monday?', options: ['Eight', 'Nine', 'Ten'], correct: 'Eight' },
  },
  {
    audio: {
      id: 'asq-aud-4',
      title: 'Flight change',
      kind: 'single-speaker',
      topic: 'Travel information',
      speakers: [{ id: 's', name: 'Speaker', voiceHint: 'mid' }],
      turns: [{ speaker: 's', text: 'The 14:20 service to Bergen has been cancelled this weekend, and passengers are advised to take the earlier 09:45 departure instead.' }],
    },
    item: { id: 'asq-4', question: 'Which flight are passengers advised to take?', options: ['The 09:45', 'The 14:20', 'The 16:30'], correct: 'The 09:45' },
  },
  {
    audio: {
      id: 'asq-aud-5',
      title: 'Research grant',
      kind: 'single-speaker',
      topic: 'Fundraising',
      speakers: [{ id: 's', name: 'Speaker', voiceHint: 'mid-high' }],
      turns: [{ speaker: 's', text: 'We are raising funds for a three-year study of coastal erosion, and we will match every donation up to fifty thousand pounds.' }],
    },
    item: { id: 'asq-5', question: 'Up to how much will the organisation match?', options: ['Fifty thousand pounds', 'Five thousand pounds', 'Five hundred thousand pounds'], correct: 'Fifty thousand pounds' },
  },
  {
    audio: {
      id: 'asq-aud-6',
      title: 'Resident parking',
      kind: 'single-speaker',
      topic: 'Council notice',
      speakers: [{ id: 's', name: 'Speaker', voiceHint: 'mid' }],
      turns: [{ speaker: 's', text: 'Residents on the north side will have a one-hour free parking period between twelve and two, rather than the two-hour period offered in the south of the district.' }],
    },
    item: { id: 'asq-6', question: 'How long is free parking for northern residents?', options: ['One hour', 'Two hours', 'Three hours'], correct: 'One hour' },
  },
  {
    audio: {
      id: 'asq-aud-7',
      title: 'Course withdrawn',
      kind: 'single-speaker',
      topic: 'Academic announcement',
      speakers: [{ id: 's', name: 'Speaker', voiceHint: 'low' }],
      turns: [{ speaker: 's', text: 'The module in medieval history has been withdrawn for the coming year, and students who planned to take it should consult the alternative list.' }],
    },
    item: { id: 'asq-7', question: 'What should affected students consult?', options: ['The alternative list', 'The admissions office', 'The exam board'], correct: 'The alternative list' },
  },
  {
    audio: {
      id: 'asq-aud-8',
      title: 'Equipment provided',
      kind: 'single-speaker',
      topic: 'Laboratory notice',
      speakers: [{ id: 's', name: 'Speaker', voiceHint: 'mid' }],
      turns: [{ speaker: 's', text: 'All consumables are provided by the department, but you must return any microscope lenses to the technician within one hour of use.' }],
    },
    item: { id: 'asq-8', question: 'How soon must lenses be returned?', options: ['Within one hour', 'Within one day', 'Within one week'], correct: 'Within one hour' },
  },
  {
    audio: {
      id: 'asq-aud-9',
      title: 'Traffic diversion',
      kind: 'single-speaker',
      topic: 'Announcement',
      speakers: [{ id: 's', name: 'Speaker', voiceHint: 'mid-high' }],
      turns: [{ speaker: 's', text: 'Traffic will be diverted along Church Lane for eleven days while the bridge deck is resurfaced.' }],
    },
    item: { id: 'asq-9', question: 'Why will traffic be diverted?', options: ['The bridge is being resurfaced', 'A road is closed for a race', 'A road is being widened'], correct: 'The bridge is being resurfaced' },
  },
  {
    audio: {
      id: 'asq-aud-10',
      title: 'Language requirements',
      kind: 'single-speaker',
      topic: 'Academic announcement',
      speakers: [{ id: 's', name: 'Speaker', voiceHint: 'mid' }],
      turns: [{ speaker: 's', text: 'Applicants whose first language is not English must present either IELTS or TOEFL results that are no more than two years old.' }],
    },
    item: { id: 'asq-10', question: 'How recent must the English test results be?', options: ['No more than two years old', 'At least five years old', 'No more than one year old'], correct: 'No more than two years old' },
  },
]

// ---------------------------------------------------------------------------
// Listening items built on the conversations above
// ---------------------------------------------------------------------------

export const LISTENING_FIB: ListeningFibItem[] = [
  {
    id: 'fibl-1',
    audioId: 'con-student-accommodation',
    startTurn: 4,
    text:
      'and I should tell you that two of them are on the ______ floor. Is that a problem? I was hoping for something on a higher floor because the road ______ is quite heavy in the evening. It is not a ______ for availability, it is just a factor. The two ground floor units face the ______ side, which is much quieter than the road side. The studio flats are four hundred and eighty pounds per calendar month, including ______ , but not including ______ , which is a further twenty-two pounds.',
    answers: [
      ['ground', 'the ground'],
      ['noise', 'traffic', 'road noise'],
      ['problem', 'issue'],
      ['courtyard'],
      ['bills', 'utilities', 'utilities and bills', 'all bills'],
      ['broadband', 'internet', 'internet broadband', 'broadband internet'],
    ],
  },
  {
    id: 'fibl-2',
    audioId: 'con-lab-notebook',
    startTurn: 4,
    text:
      'I can put it aside for you. There is a ______ , though — for health and safety reasons we need a written ______ of who collected it and when. I am in the office on Thursday and Friday mornings, usually ______ nine and eleven. Bring your student ______ , and the notebook itself obviously. The module code is BIO302. The notebook is ______ for at least twelve months after the module finishes, so please make a scanned copy for yourself before you take it away.',
    answers: [
      ['procedure'],
      ['record'],
      ['between'],
      ['identification', 'id', 'student id', 'identification card'],
      ['retained', 'kept', 'held'],
    ],
  },
  {
    id: 'fibl-3',
    audioId: 'con-field-station',
    startTurn: 6,
    text:
      'the trust requires that nobody works alone after dark. The fee covers a second person being on site in the ______ , and it is mandatory. The main house has central heating throughout, but the annexe has no ______ — only portable heaters, which we provide. The annexe is cheaper by about thirty per cent. The ______ is two weeks of the quoted rate. It is refundable, and in practice it has been refunded every year except once.',
    answers: [
      ['evening', 'evenings'],
      ['heating'],
      ['deposit'],
    ],
  },
  {
    id: 'fibl-4',
    audioId: 'con-gym-membership',
    startTurn: 2,
    text:
      'You just need to call before the last day of the ______ , and the reactivation takes effect from the first of the next month. It is the same rate you were on when you ______ , not necessarily the current rate. The pool is included in the standard plan but not in the frozen ______ . The limit is three months per ______ year, and the count begins on the first day of the month in which you freeze.',
    answers: [
      ['month'],
      ['froze', 'frozen', 'froze it'],
      ['state', 'status'],
      ['calendar', 'academic'],
    ],
  },
  {
    id: 'fibl-5',
    audioId: 'con-archive-visit',
    startTurn: 2,
    text:
      'We have ledgers of accounts, minute books, and ______ . The wage books survive only for 1881 to 1894, but they are fully ______ and you can consult them without handling the originals. You will need proof of identity and proof of address, and we ask for a reference from an academic institution or a ______ . The ticket lasts for two years, after which you ______ . Anything requiring conservation goes through a different route and normally takes two weeks.',
    answers: [
      ['correspondence', 'letters'],
      ['digitised', 'digitized', 'digitally available'],
      ['supervisor', 'referee', 'academic supervisor'],
      ['reapply', 're-apply', 'apply again', 'must reapply'],
    ],
  },
  {
    id: 'fibl-6',
    audioId: 'con-bike-hire',
    startTurn: 2,
    text:
      'The charge was raised by the mechanic who ______ the bike, but I can also see the inspection photographs, and there is no damage visible on the light housing. Most likely the side light was left switched on. When the battery runs flat the indicator can stick on, and the system interprets the persistent ______ as a fault. I will ______ the charge. It will not reappear. The ______ were quite poor, which is why I called about the bike at all.',
    answers: [
      ['inspected', 'checked', 'checked over'],
      ['drain', 'drainage', 'current draw'],
      ['waive', 'waived', 'cancel', 'remove'],
      ['brakes', 'brake pads', 'braking'],
    ],
  },
  {
    id: 'fibl-7',
    audioId: 'con-rehearsal',
    startTurn: 2,
    text:
      'Then you will need the large hall, not the studio. The studio has a hard ______ of eight, and we will not book it for a group larger than that. It is possible on Tuesdays ______ two in the afternoon, because the hall is used for timetabled lessons before then. For ______ groups it is free, but we charge a fifty-pound administration fee to any external group, and that has to be paid before the booking is ______ . There is a limit of two ______ bookings per group per week.',
    answers: [
      ['limit', 'maximum', 'cap'],
      ['until', 'up to', 'till'],
      ['enrolled', 'internal', 'student'],
      ['confirmed', 'approved', 'accepted'],
      ['consecutive', 'successive', 'back-to-back'],
    ],
  },
  {
    id: 'fibl-8',
    audioId: 'con-volcano-visit',
    startTurn: 2,
    text:
      'The walk is about three kilometres ______ and it is a steady climb. The path is compacted ______ for most of the way and the last section has steps. We monitor the tremor continuously and the summit is currently open. If the wind direction changes, we turn back — we do not wait. There is a ______ point at the car park but it is expensive and it closes early. We do ______ bottles at the halfway point, so bring them empty.',
    answers: [
      ['return', 'round trip', 'there and back', 'round-trip'],
      ['gravel', 'ground', 'earth'],
      ['vending', 'refreshment', 'refreshments', 'water', 'catering'],
      ['refill', 'fill', 'top up', 'top-up'],
    ],
  },
  ...EXTRA_LISTENING_FIB,
  ...EXTRA_LISTENING_FIB_4,
  ...EXTRA_LISTENING_FIB_5,
  ...EXTRA_LISTENING_FIB_6,
  ...EXTRA_LISTENING_FIB_8,
]

export const HIGHLIGHT_SUMMARY: HighlightSummaryItem[] = [
  ...REBALANCED_HIGHLIGHT_SUMMARY,
  ...EXTRA_HIGHLIGHT_SUMMARY_3,
  ...EXTRA_HIGHLIGHT_SUMMARY_4,
  ...EXTRA_HIGHLIGHT_SUMMARY_5,
  ...EXTRA_HIGHLIGHT_SUMMARY_6,
  ...EXTRA_HIGHLIGHT_SUMMARY_8,
]


export const LISTENING_MCQ_SINGLE: ListeningMcqItem[] = [
  {
    id: 'lmcq-1',
    audioId: 'con-gym-membership',
    question: 'What does the advisor say about the rate the customer will pay on reactivation?',
    options: [
      'The rate from when the membership was frozen',
      'The current standard rate',
      'A discounted legacy rate only for two years',
      'The rate of the plan chosen at reactivation',
    ],
    correct: ['The rate from when the membership was frozen'],
  },
  {
    id: 'lmcq-2',
    audioId: 'con-rehearsal',
    question: 'Why can the orchestra not use the studio?',
    options: [
      'It has a hard limit of eight people',
      'It is booked until two o\'clock',
      'It has no double bass storage',
      'It is reserved for external groups',
    ],
    correct: ['It has a hard limit of eight people'],
  },
  {
    id: 'lmcq-3',
    audioId: 'con-volcano-visit',
    question: 'What will happen if the wind direction changes during the visit?',
    options: ['The group will turn back', 'The group will wait at the platform', 'The summit will be closed', 'The guide will shorten the route'],
    correct: ['The group will turn back'],
  },
  {
    id: 'lmcq-4',
    audioId: 'con-archive-visit',
    question: 'Why can the visitor read the wage books immediately?',
    options: ['They have been digitised', 'They were retrieved that morning', 'They are less than thirty years old', 'They do not require conservation'],
    correct: ['They have been digitised'],
  },
  {
    id: 'lmcq-5',
    audioId: 'con-lab-notebook',
    question: 'Why does the manager ask for the module code?',
    options: ['The collection form requires it', 'It identifies the practical', 'It affects the retention period', 'It is needed for the insurance check'],
    correct: ['The collection form requires it'],
  },
  {
    id: 'lmcq-6',
    audioId: 'con-student-accommodation',
    question: 'What is said about the ground floor studios?',
    options: [
      'They face the courtyard and are quieter',
      'They are the only ones with broadband',
      'They cost more than the first floor units',
      'They are not part of the listing',
    ],
    correct: ['They face the courtyard and are quieter'],
  },
  ...EXTRA_LISTENING_MCQ_SINGLE,
  ...EXTRA_LISTENING_MCQ_SINGLE_3,
  ...EXTRA_LISTENING_MCQ_SINGLE_4,
  ...EXTRA_LISTENING_MCQ_SINGLE_5,
  ...EXTRA_LISTENING_MCQ_SINGLE_6,
  ...EXTRA_LISTENING_MCQ_SINGLE_8,
]

export const LISTENING_MCQ_MULTI: ListeningMcqItem[] = [
  {
    id: 'lmcq-1',
    audioId: 'con-gym-membership',
    question: 'Which two statements about the frozen membership does the advisor make? Select TWO.',
    options: [
      'The pool is not included while frozen',
      'A day pass cannot be used',
      'The count of the three months begins on the first of the month',
      'The current terms differ from those on the contract',
      'The administration fee continues to apply',
    ],
    correct: ['The pool is not included while frozen', 'The count of the three months begins on the first of the month'],
  },
  {
    id: 'lmcq-2',
    audioId: 'con-rehearsal',
    question: 'Which two conditions apply to the large hall? Select TWO.',
    options: [
      'It is free on Wednesdays all day',
      'It is available from two o\'clock on Tuesdays',
      'It is charged at fifty pounds for enrolled groups',
      'It cannot be booked for consecutive weeks',
      'It has a hard limit of eight players',
    ],
    correct: ['It is free on Wednesdays all day', 'It is available from two o\'clock on Tuesdays'],
  },
  {
    id: 'lmcq-3',
    audioId: 'con-volcano-visit',
    question: 'Which two warnings does the guide give about the walk? Select TWO.',
    options: [
      'The path is not suitable for wheelchairs',
      'The guide may turn the group back',
      'There is no water available on the walk',
      'The summit is currently closed',
      'Footwear is not important',
    ],
    correct: ['The path is not suitable for wheelchairs', 'The guide may turn the group back'],
  },
  {
    id: 'lmcq-4',
    audioId: 'con-archive-visit',
    question: 'Which two things are needed for a reader\'s ticket? Select TWO.',
    options: [
      'Proof of address',
      'A photograph',
      'A reference from an academic institution',
      'A deposit of two weeks',
      'A fee of fifty pounds',
    ],
    correct: ['Proof of address', 'A reference from an academic institution'],
  },
  {
    id: 'lmcq-5',
    audioId: 'con-bike-hire',
    question: 'Which two things does the support agent offer? Select TWO.',
    options: [
      'Waiving the charge for the front light',
      'A full service for the bike',
      'A discount on future hires',
      'A replacement bike credit',
      'Free collection of the bike',
    ],
    correct: ['Waiving the charge for the front light', 'A replacement bike credit'],
  },
  {
    id: 'lmcq-6',
    audioId: 'con-field-station',
    question: 'Which two features apply to the annexe? Select TWO.',
    options: [
      'It is about thirty per cent cheaper',
      'It has central heating',
      'It is available from the fifteenth',
      'It has no heating',
      'It is only available at weekends',
    ],
    correct: ['It is about thirty per cent cheaper', 'It has no heating'],
  },
  ...EXTRA_LISTENING_MCQ_MULTI,
  ...EXTRA_LISTENING_MCQ_MULTI_3,
  ...EXTRA_LISTENING_MCQ_MULTI_4,
  ...EXTRA_LISTENING_MCQ_MULTI_5,
  ...EXTRA_LISTENING_MCQ_MULTIPLE_6,
  ...EXTRA_LISTENING_MCQ_MULTI_8,
]

export const MISSING_WORD: MissingWordItem[] = [
  {
    id: 'smw-1',
    audioId: 'con-student-accommodation',
    turnIndex: 3,
    // The authored family tested "facetious", a word this conversation never
    // says, so no clip of it could ever contain the keyed answer. The blank now
    // falls on a word the turn actually speaks, keeping the "fac-" pairs.
    wordIndex: 11,
    options: ['factor', 'factors', 'factory', 'faction'],
    correct: 0,
  },
  {
    id: 'smw-2',
    audioId: 'con-gym-membership',
    // Turn 8 is a seven word aside; the target word sits in turn 9.
    turnIndex: 9,
    wordIndex: 3,
    options: ['common', 'comely', 'complete', 'commonly'],
    correct: 0,
  },
  {
    id: 'smw-3',
    audioId: 'con-archive-visit',
    // The keyed word is spoken in turn 7, not turn 3.
    turnIndex: 7,
    wordIndex: 26,
    options: ['conservation', 'conversation', 'conservative', 'conserve'],
    correct: 0,
  },
  {
    id: 'smw-4',
    audioId: 'con-volcano-visit',
    // The keyed word is spoken in turn 1, not turn 2.
    turnIndex: 1,
    wordIndex: 28,
    options: ['compacted', 'conducted', 'computed', 'compounded'],
    correct: 0,
  },
  {
    id: 'smw-5',
    audioId: 'con-rehearsal',
    // Turn 6 is a five word question; the target word sits in turn 7.
    turnIndex: 7,
    wordIndex: 1,
    options: ['enrolled', 'enrolment', 'enrol', 'enrolling'],
    correct: 0,
  },
  {
    id: 'smw-6',
    audioId: 'con-bike-hire',
    // Turn 2 is the four word aside "So what caused it?"; the target word sits in
    // turn 3. The previous indices pointed past the end of the turn entirely.
    turnIndex: 3,
    wordIndex: 17,
    options: ['stick', 'stuck', 'sticking', 'stitched'],
    correct: 0,
  },
  ...EXTRA_MISSING_WORD,
  ...EXTRA_MISSING_WORD_3,
  ...EXTRA_MISSING_WORD_4,
  ...EXTRA_MISSING_WORD_5,
  ...EXTRA_MISSING_WORD_6,
  ...EXTRA_MISSING_WORD_8,
]

/**
 * Builds a Highlight Incorrect Words item by deriving the token indices from the
 * transcript pair rather than storing them by hand.
 *
 * The stored indices are the scoring key: the assembler compares them against the
 * positions the candidate clicked. Hand-maintaining them is a silent failure mode
 * — every one of the original four pointed at the wrong tokens, so all of them
 * were unpassable. Deriving them here means a mistyped index is impossible, and
 * the assertion turns a malformed pair into a build-time error rather than an
 * item that cannot be answered correctly.
 *
 * The pair must be a substitution: equal token counts differing at exactly two
 * positions. An insertion would shift every later index, so the shape is
 * enforced rather than assumed.
 */
function highlightIncorrect(
  id: string,
  audioId: string,
  transcript: string,
  correctTranscript: string,
): HighlightIncorrectItem {
  const shown = transcript.split(/\s+/)
  const actual = correctTranscript.split(/\s+/)
  const diff = shown.reduce<number[]>((acc, w, i) => (w === actual[i] ? acc : [...acc, i]), [])
  if (shown.length !== actual.length) {
    throw new Error(`${id}: transcript must substitute words, not insert them (${shown.length} vs ${actual.length})`)
  }
  if (diff.length !== 2) {
    throw new Error(`${id}: expected exactly two differing words, found ${diff.length}`)
  }
  return { id, audioId, transcript, correctTranscript, incorrect: diff }
}

export const HIGHLIGHT_INCORRECT: HighlightIncorrectItem[] = [
  highlightIncorrect(
    'hiw-1',
    'con-student-accommodation',
    'The studio flats are four hundred and eighty pounds per calendar month, including bills, but not including broadband, which is a further twenty-two pounds.',
    'The studio flats are four hundred and ninety pounds per calendar month, including bills, but not including broadband, which is a further twenty-four pounds.',
  ),
  highlightIncorrect(
    'hiw-2',
    'con-field-station',
    'The benches are free for groups, but there is a charge for the sorting room, and the sorting room is only available on weekdays because the volunteer group uses it at the weekend.',
    'The benches are free for groups, but there is a charge for the sorting room, and the sorting room is only available on weekends because the volunteer group uses it on the weekend.',
  ),
  highlightIncorrect(
    'hiw-3',
    'con-archive-visit',
    'You will need proof of address and proof of identity, and we ask for a reference from an academic institution or a supervisor. The ticket lasts for two years, after which you reapply.',
    'You will need proof of identity and proof of address, and we ask for a reference from an academic institution or a supervisor. The ticket lasts for two years, after which you reapply.',
  ),
  highlightIncorrect(
    'hiw-4',
    'con-bike-hire',
    'The charge was raised by the mechanic who examined the bike, but I can also see the inspection photographs, and there is no damage visible on the light housing.',
    'The charge was raised by the mechanic who inspected the bike, but I can also see the inspection photographs, and there is little damage visible on the light housing.',
  ),
  ...EXTRA_HIGHLIGHT_INCORRECT,
  ...EXTRA_HIGHLIGHT_INCORRECT_2,
  ...EXTRA_HIGHLIGHT_INCORRECT_3,
  ...EXTRA_HIGHLIGHT_INCORRECT_4,
  ...EXTRA_HIGHLIGHT_INCORRECT_5,
  ...EXTRA_HIGHLIGHT_INCORRECT_6,
  ...EXTRA_HIGHLIGHT_INCORRECT_8,
]

export const DICTATION: DictationItem[] = [
  {
    id: 'wfd-1',
    audioId: 'con-student-accommodation',
    turnIndex: 10,
    text: 'One more thing — what is the application deadline?',
  },
  {
    id: 'wfd-2',
    audioId: 'con-gym-membership',
    turnIndex: 0,
    text: 'What happens if I want to start going again?',
  },
  {
    id: 'wfd-3',
    audioId: 'con-archive-visit',
    turnIndex: 0,
    text: 'Do you hold the records of the mill company?',
  },
  {
    id: 'wfd-4',
    audioId: 'con-field-station',
    turnIndex: 9,
    text: 'The deposit is two weeks of the quoted rate.',
  },
  {
    id: 'wfd-5',
    audioId: 'con-rehearsal',
    turnIndex: 8,
    text: 'We are enrolled, so the fee should not apply.',
  },
  {
    id: 'wfd-6',
    audioId: 'con-volcano-visit',
    turnIndex: 2,
    text: 'Are the ash clouds a problem this time of year?',
  },
  ...EXTRA_DICTATION,
  ...EXTRA_DICTATION_3,
  ...EXTRA_DICTATION_4,
  ...EXTRA_DICTATION_5,
  ...EXTRA_DICTATION_6,
  ...EXTRA_DICTATION_8,
]

// ---------------------------------------------------------------------------
// Respond to a Situation
// ---------------------------------------------------------------------------

export const SITUATIONS: SituationItem[] = [
  {
    id: 'rts-1',
    situation:
      'You are a first-year student. You attended a lecture on Monday but you now believe you missed the first fifteen minutes because your train arrived late. The lecturer has already mentioned that the first part contains information needed for an exercise due on Friday.',
    prompt:
      'Respond to the situation. Speak for between 40 and 90 seconds. You may ask for the information you missed and explain why you were late.',
    reference:
      'A first-year student should apologise briefly, explain that the train was delayed, and then ask politely whether the lecturer could repeat the opening section or provide the slides, since the exercise on Friday depends on it. The response should be direct, respectful and confident rather than overly apologetic.',
    keyTerms: ['apologise', 'train', 'delayed', 'repeat', 'slides', 'exercise', 'Friday'],
    minWords: 40,
  },
  {
    id: 'rts-2',
    situation:
      'You booked a table for four at a restaurant for 7pm on Saturday. You have arrived to find that the restaurant is full and the booking is not on the system. Two other parties in the queue also have bookings. A member of staff is apologising and offering to find another restaurant.',
    prompt:
      'Respond to the situation. Speak for between 40 and 90 seconds. Address the problem and discuss the options available to you.',
    reference:
      'The customer should stay calm, show the booking confirmation, and ask the staff member to check the reservation list rather than accepting a substitute immediately. They should establish whether a table can be held within a reasonable time, and if not, ask what compensation or alternative arrangements are available given that two other parties have the same problem.',
    keyTerms: ['booking', 'confirmation', 'check', 'reservation', 'alternative', 'compensation'],
    minWords: 40,
  },
  {
    id: 'rts-3',
    situation:
      'You are part of a group project. A member of the group has not completed their section for the second deadline and has stopped replying to messages. The submission is in five days and your tutor expects an explanation.',
    prompt:
      'Respond to the situation. Speak for between 40 and 90 seconds. Set out what you will do and say what you will tell your tutor.',
    reference:
      'The student should record the attempts to contact the absent member, redistribute their section so the project can be completed, and notify the tutor in writing before the deadline rather than after. The explanation should be factual, avoid blame, and state clearly which part of the project is at risk and what mitigation has been put in place.',
    keyTerms: ['section', 'redistribute', 'notify', 'tutor', 'deadline', 'in writing', 'contact'],
    minWords: 40,
  },
  {
    id: 'rts-4',
    situation:
      'A piece of equipment you need for a deadline has been returned damaged by a previous user, and the replacement will not arrive until two days after the deadline. You have contacted the supplier twice with no reply. The work cannot be done without the equipment.',
    prompt:
      'Respond to the situation. Speak for between 40 and 90 seconds. Explain the problem and state what you propose to do.',
    reference:
      'The response should set out the dependency clearly, note the two unanswered attempts to the supplier, and propose a concrete plan: request an urgent replacement or loan unit, contact the department for shared equipment, ask for a short extension with supporting evidence of the failure, and escalate formally so that a record exists of the delay not being caused by the speaker.',
    keyTerms: ['replacement', 'supplier', 'escalate', 'extension', 'department', 'equipment', 'evidence'],
    minWords: 40,
  },
  ...EXTRA_SITUATIONS,
  ...EXTRA_SITUATIONS_2,
  ...EXTRA_SITUATIONS_3,
  ...EXTRA_SITUATIONS_4,
  ...EXTRA_SITUATIONS_5,
  ...EXTRA_SITUATIONS_6,
  ...EXTRA_SITUATIONS_8,
]
