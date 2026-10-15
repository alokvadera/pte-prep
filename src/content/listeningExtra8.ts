import type {
  DictationItem,
  HighlightIncorrectItem,
  HighlightSummaryItem,
  ListeningFibItem,
  ListeningMcqItem,
  MissingWordItem,
  SituationItem,
} from './schema'

// ---------------------------------------------------------------------------
// Eighth listening batch: expanding question bank coverage across all types
// ---------------------------------------------------------------------------

export const EXTRA_DICTATION_8: DictationItem[] = [
  {
    id: 'wfd-701',
    audioId: 'con-workplace-training',
    turnIndex: 3,
    text: 'Move the deadline to Wednesday and tell the client today. A one-day move is inside the tolerance in the contract, and I will confirm it in writing so it is on record.',
  },
  {
    id: 'wfd-702',
    audioId: 'con-workplace-training',
    turnIndex: 7,
    text: 'It goes to the central training budget this year, so your project keeps its contingency. Book through the portal and send me the confirmation, and I will note the new deadline on the tracker.',
  },
  {
    id: 'wfd-703',
    audioId: 'con-rail-connection',
    turnIndex: 1,
    text: 'It is, but the pass covers the standard route only. The coastal express also needs a reservation, and reservations are ten pounds per person.',
  },
  {
    id: 'wfd-704',
    audioId: 'con-rail-connection',
    turnIndex: 5,
    text: 'The next service is forty minutes later and the pass covers it, but only on the same day. Miss the last one and the morning replacement is not included.',
  },
  {
    id: 'wfd-705',
    audioId: 'con-shop-exchange',
    turnIndex: 1,
    text: 'Without a receipt I can offer an exchange or a gift card at the current selling price, not the price paid, and only within the twenty-eight-day window.',
  },
  {
    id: 'wfd-706',
    audioId: 'con-shop-exchange',
    turnIndex: 7,
    text: 'Then I issue a gift card for forty pounds, which never expires. Take the navy today and the gift receipt I give you allows thirty days of returns, so you are covered either way.',
  },
  {
    id: 'wfd-707',
    audioId: 'con-street-party',
    turnIndex: 1,
    text: 'An application at least six weeks ahead. Because that is a busy summer Saturday the bar is higher: we ask for a traffic management plan and public liability insurance.',
  },
  {
    id: 'wfd-708',
    audioId: 'con-street-party',
    turnIndex: 7,
    text: 'Sixty pounds for the closure order and nothing for the notice. Pay online, and the order and the road signs arrive ten days before, provided the insurance certificate reaches us by then.',
  },
]

export const EXTRA_MISSING_WORD_8: MissingWordItem[] = [
  {
    id: 'smw-701',
    audioId: 'con-workplace-training',
    turnIndex: 7,
    wordIndex: 14,
    options: ['portal', 'portion', 'portrait', 'postage'],
    correct: 0,
  },
  {
    id: 'smw-702',
    audioId: 'con-rail-connection',
    turnIndex: 3,
    wordIndex: 26,
    options: ['platform', 'plastic', 'plateau', 'plausible'],
    correct: 0,
  },
  {
    id: 'smw-703',
    audioId: 'con-shop-exchange',
    turnIndex: 5,
    wordIndex: 22,
    options: ['difference', 'difficult', 'diffusion', 'different'],
    correct: 0,
  },
  {
    id: 'smw-704',
    audioId: 'con-street-party',
    turnIndex: 5,
    wordIndex: 10,
    options: ['marshals', 'markets', 'margins', 'marbles'],
    correct: 0,
  },
  {
    id: 'smw-705',
    audioId: 'con-workplace-training',
    turnIndex: 1,
    wordIndex: 13,
    options: ['standard', 'standing', 'standoff', 'stanza'],
    correct: 0,
  },
  {
    id: 'smw-706',
    audioId: 'con-street-party',
    turnIndex: 7,
    wordIndex: 26,
    options: ['certificate', 'certainty', 'certified', 'cervical'],
    correct: 0,
  },
]

function derived8(id: string, audioId: string, transcript: string, correctTranscript: string): HighlightIncorrectItem {
  const shown = transcript.split(/\s+/)
  const actual = correctTranscript.split(/\s+/)
  const diff = shown.reduce<number[]>((acc, w, i) => (w === actual[i] ? acc : [...acc, i]), [])
  if (shown.length !== actual.length || diff.length !== 2) {
    throw new Error(`${id}: expected a two-word substitution, got ${diff.length} differences`)
  }
  return { id, audioId, transcript, correctTranscript, incorrect: diff }
}

export const EXTRA_HIGHLIGHT_INCORRECT_8: HighlightIncorrectItem[] = [
  derived8(
    'hiw-701',
    'con-workplace-training',
    'The course runs on Thursday and Friday mornings, and it is a condition of the new safety standard, so I would rather you went than missed it.',
    'The course runs on Thursday and Friday afternoons, and it is a condition of the new quality standard, so I would rather you went than missed it.',
  ),
  derived8(
    'hiw-702',
    'con-workplace-training',
    'It goes to the central training budget this term, so your project keeps its contingency. Book through the website and send me the confirmation, and I will note the new deadline on the tracker.',
    'It goes to the central training budget this year, so your project keeps its contingency. Book through the portal and send me the confirmation, and I will note the new deadline on the tracker.',
  ),
  derived8(
    'hiw-703',
    'con-rail-connection',
    'It is, but the pass covers the standard route only. The coastal express also needs a booking, and reservations are ten euros per person.',
    'It is, but the pass covers the standard route only. The coastal express also needs a reservation, and reservations are ten pounds per person.',
  ),
  derived8(
    'hiw-704',
    'con-rail-connection',
    'The next service is fifty minutes later and the ticket covers it, but only on the same day. Miss the last one and the morning replacement is not included.',
    'The next service is forty minutes later and the pass covers it, but only on the same day. Miss the last one and the morning replacement is not included.',
  ),
  derived8(
    'hiw-705',
    'con-shop-exchange',
    'Without a invoice I can offer an exchange or a gift voucher at the current selling price, not the price paid, and only within the twenty-eight-day window.',
    'Without a receipt I can offer an exchange or a gift card at the current selling price, not the price paid, and only within the twenty-eight-day window.',
  ),
  derived8(
    'hiw-706',
    'con-shop-exchange',
    'The grey was in the sale at forty pounds and the navy is full price at fifty-five, so you would give the remainder of fifteen pounds.',
    'The grey was in the sale at forty pounds and the navy is full price at fifty-five, so you would pay the difference of fifteen pounds.',
  ),
  derived8(
    'hiw-707',
    'con-street-party',
    'An application at least eight weeks ahead. Because that is a busy summer Saturday the bar is higher: we demand for a traffic management plan and public liability insurance.',
    'An application at least six weeks ahead. Because that is a busy summer Saturday the bar is higher: we ask for a traffic management plan and public liability insurance.',
  ),
  derived8(
    'hiw-708',
    'con-street-party',
    'Ninety pounds for the closure order and nothing for the notice. Pay online, and the permit and the road signs arrive ten days before, provided the insurance certificate reaches us by then.',
    'Sixty pounds for the closure order and nothing for the notice. Pay online, and the order and the road signs arrive ten days before, provided the insurance certificate reaches us by then.',
  ),
]

export const EXTRA_LISTENING_FIB_8: ListeningFibItem[] = [
  {
    id: 'fibl-701',
    audioId: 'con-workplace-training',
    startTurn: 1,
    text:
      'The course runs on Thursday and Friday afternoons, and it is a ______ of the new quality standard, so I would rather you went than missed it. Move the deadline to Wednesday and tell the client today. A one-day move is inside the ______ in the contract, and I will confirm it in writing so it is on record.',
    answers: [['condition'], ['tolerance']],
  },
  {
    id: 'fibl-702',
    audioId: 'con-workplace-training',
    startTurn: 5,
    text:
      'If it does, you leave at your normal hour and the second session is ______ . The assessment can be completed within a ______ of the course, and the trainer signs it off. It goes to the central training budget this year, so your project keeps its contingency.',
    answers: [['recorded'], ['week']],
  },
  {
    id: 'fibl-703',
    audioId: 'con-rail-connection',
    startTurn: 1,
    text:
      'It is, but the pass covers the standard route only. The coastal express also needs a ______ , and reservations are ten pounds per person. Normally it is, because the platform change takes about five minutes. But there is engineering work near the junction this weekend, so the connection moves to platform ______ and you should allow fifteen.',
    answers: [['reservation'], ['four']],
  },
  {
    id: 'fibl-704',
    audioId: 'con-rail-connection',
    startTurn: 5,
    text:
      'The next service is forty minutes later and the pass covers it, but only on the ______ day. Miss the last one and the morning replacement is not included. You can. The seven-ten arrives before the ______ starts, and because it is within the pass validity you pay only the reservation.',
    answers: [['same'], ['closure']],
  },
  {
    id: 'fibl-705',
    audioId: 'con-shop-exchange',
    startTurn: 1,
    text:
      'Without a receipt I can offer an exchange or a gift card at the current ______ price, not the price paid, and only within the twenty-eight-day window. It does run small, so a large is the ______ move. We have the large in navy in stock, but not in the grey you are exchanging.',
    answers: [['selling'], ['sensible']],
  },
  {
    id: 'fibl-706',
    audioId: 'con-street-party',
    startTurn: 1,
    text:
      'An application at least six weeks ahead. Because that is a busy summer Saturday the bar is higher: we ask for a traffic management plan and public ______ insurance. Then we keep an access gap in the closure, held clear by ______ you appoint, and we ask you to give every resident a notice seven days ahead.',
    answers: [['liability'], ['marshals']],
  },
]

export const EXTRA_HIGHLIGHT_SUMMARY_8: HighlightSummaryItem[] = [
  {
    id: 'hcs-701',
    audioId: 'con-workplace-training',
    question: 'Which statement best summarises the conversation between the employee and manager?',
    options: [
      'The manager approves attending the training course and instructs the employee to bring the client deadline forward to Wednesday, with course costs covered by the central budget.',
      'The employee is advised to decline the training session because the client project deadline on Friday cannot be modified under any contractual terms.',
      'The manager agrees to fund the course from the project contingency budget provided the employee works overtime on Thursday evening to finish the client report.',
      'The client agrees to postpone the delivery date by two weeks while the employee completes the assessment and awaits evaluation from the central trainer.',
    ],
    correct: 0,
  },
  {
    id: 'hcs-702',
    audioId: 'con-rail-connection',
    question: 'Which statement best summarises the advice given by the railway ticket clerk?',
    options: [
      'The seven-day pass is valid for the coastal express with a ten-pound reservation, and catching the seven-ten service avoids junction engineering delays on platform four.',
      'The rail pass has expired for the coastal route and requires purchasing a full-fare forty-pound replacement ticket before the weekend engineering closure.',
      'Passengers must allow forty minutes for all platform transfers at the junction because coastal services have been cancelled indefinitely due to track repairs.',
      'The coastal express operates without reservations on Saturday, and missed connections are automatically transferred to morning replacement coaches free of charge.',
    ],
    correct: 0,
  },
  {
    id: 'hcs-703',
    audioId: 'con-shop-exchange',
    question: 'Which statement best summarises the shop assistant\'s resolution of the jacket exchange?',
    options: [
      'Without a receipt, the customer can exchange the small grey sale jacket for a full-price navy large by paying the fifteen-pound difference, or receive a forty-pound gift card.',
      'The store refuses to accept the jacket because the original purchase receipt was not retained by the customer within the strict fourteen-day returns limit.',
      'The assistant offers an immediate cash refund of fifty-five pounds because the navy size large is currently unavailable in the central warehouse stock.',
      'The customer is given an exchange for a large grey jacket without paying any price differential because the manufacturer manufactured undersized garments.',
    ],
    correct: 0,
  },
  {
    id: 'hcs-704',
    audioId: 'con-street-party',
    question: 'Which statement best summarises the requirements for organizing the street party?',
    options: [
      'The council permits the five-week closure on Willow Lane because it is not a bus route, charging sixty pounds and requiring marshals to preserve disabled driveway access.',
      'The road closure application is rejected because all street party notices must be submitted at least twelve weeks prior to any residential event.',
      'The resident must pay ninety pounds for municipal signs and hire commercial traffic police to divert bus routes around the surrounding residential neighborhood.',
      'The party can proceed without council approval provided all forty guests sign a public liability waiver and distribute printed leaflets on the day of the event.',
    ],
    correct: 0,
  },
  {
    id: 'hcs-705',
    audioId: 'lec-climate-tipping',
    question: 'Which statement best summarises the main thesis of the climatology lecture?',
    options: [
      'Earth systems feature interconnected tipping elements that can trigger irreversible state changes through non-linear cascades, meaning planetary boundaries cannot be evaluated in isolation.',
      'Global climate change behaves as a purely linear system where greenhouse gas reductions produce immediate and proportional reductions in surface temperatures.',
      'The West Antarctic ice sheet has fully recovered from circumpolar deep water warming due to negative albedo feedback loops in polar waters.',
      'The Atlantic Meridional Overturning Circulation is strengthening rapidly, preventing tropical rain belt shifts and protecting the Amazon basin from future drought.',
    ],
    correct: 0,
  },
  {
    id: 'hcs-706',
    audioId: 'lec-quantum-computing',
    question: 'Which statement best summarises the speaker\'s argument concerning quantum computing?',
    options: [
      'Environmental decoherence rapidly destroys fragile quantum superposition, requiring fault-tolerant surface codes with thousands of physical qubits per logical qubit rather than simple classical cloning.',
      'Quantum computation has surpassed classical supercomputing because the no-cloning theorem allows instant and error-free duplication of delicate qubit amplitudes.',
      'Thermal phonons and stray electromagnetic fields improve the coherence lifetime of superconducting Josephson junctions during deep circuit execution.',
      'Quantum registers require only three physical qubits per bit to achieve complete fault tolerance through standard majority voting error correction.',
    ],
    correct: 0,
  },
]

export const EXTRA_LISTENING_MCQ_SINGLE_8: ListeningMcqItem[] = [
  {
    id: 'lmcqs-701',
    audioId: 'con-workplace-training',
    question: 'Why does the manager insist that the employee attend the training course?',
    options: [
      'It is a mandatory condition of the new quality standard',
      'The client specifically requested that the employee be trained',
      'The project has excess contingency funds that must be spent',
      'The training course will not be offered again this academic year',
    ],
    correct: ['It is a mandatory condition of the new quality standard'],
  },
  {
    id: 'lmcqs-702',
    audioId: 'con-rail-connection',
    question: 'What complication affects the passenger\'s transfer at the junction?',
    options: [
      'Engineering work moves the connection to platform four and requires fifteen minutes',
      'The coastal train line has been permanently decommissioned for maintenance',
      'The connection platform cannot be reached without an additional luggage ticket',
      'The passenger\'s seven-day rail pass is restricted to weekday departures only',
    ],
    correct: ['Engineering work moves the connection to platform four and requires fifteen minutes'],
  },
  {
    id: 'lmcqs-703',
    audioId: 'con-shop-exchange',
    question: 'Why must the customer pay fifteen pounds when exchanging the jacket?',
    options: [
      'The exchanged grey jacket was on sale for forty pounds while the navy jacket is fifty-five',
      'The store charges a fifteen-pound administrative penalty for missing purchase receipts',
      'The larger size jacket contains more material and carries an elevated base price',
      'The exchange window had expired, incurring an overdue transaction processing surcharge',
    ],
    correct: ['The exchanged grey jacket was on sale for forty pounds while the navy jacket is fifty-five'],
  },
  {
    id: 'lmcqs-704',
    audioId: 'con-street-party',
    question: 'Under what condition is the late street party application accepted?',
    options: [
      'The street is not situated along a scheduled public bus route',
      'All forty attending neighbors provide written identity verification',
      'The resident agrees to purchase commercial fireworks insurance from the council',
      'The gathering finishes before six o clock in the evening',
    ],
    correct: ['The street is not situated along a scheduled public bus route'],
  },
  {
    id: 'lmcqs-705',
    audioId: 'lec-climate-tipping',
    question: 'What mechanism causes the grounding line of the West Antarctic ice sheet to retreat?',
    options: [
      'Warm circumpolar deep water melts ice shelves from beneath along reverse-sloping bedrock',
      'Intense surface solar radiation evaporates terrestrial snow cover during polar winters',
      'Sudden volcanic eruptions beneath marine volcanic calderas boil subglacial meltwater',
      'Atmospheric ozone depletion alters the directional speed of westerly trade winds',
    ],
    correct: ['Warm circumpolar deep water melts ice shelves from beneath along reverse-sloping bedrock'],
  },
  {
    id: 'lmcqs-706',
    audioId: 'lec-quantum-computing',
    question: 'Why cannot quantum computing use simple classical bit-duplication for error correction?',
    options: [
      'The no-cloning theorem strictly forbids copying an unknown quantum state',
      'Superconducting qubits operate at room temperatures where thermal noise is absent',
      'Quantum gates are too fast to execute majority voting calculations',
      'Classical error correction codes require negative electrical voltage supplies',
    ],
    correct: ['The no-cloning theorem strictly forbids copying an unknown quantum state'],
  },
]

export const EXTRA_LISTENING_MCQ_MULTI_8: ListeningMcqItem[] = [
  {
    id: 'lmcqm-701',
    audioId: 'con-workplace-training',
    question: 'Which two agreements do the manager and employee make regarding deadlines and costs?',
    options: [
      'The client report deadline is moved earlier to Wednesday',
      'The training course fee will be funded from the central training budget',
      'The employee will skip the second afternoon of the training course',
      'The project contingency budget will pay for the assessment marking',
      'The client will be asked to accept a brief summary rather than full findings',
    ],
    correct: [
      'The client report deadline is moved earlier to Wednesday',
      'The training course fee will be funded from the central training budget',
    ],
  },
  {
    id: 'lmcqm-702',
    audioId: 'con-rail-connection',
    question: 'Which two pieces of information does the clerk provide about tickets and schedules?',
    options: [
      'The coastal express requires an advance reservation costing ten pounds',
      'The seven-ten service departs before the junction engineering closure begins',
      'The seven-day rail pass covers replacement morning hotel accommodations',
      'The platform transfer at the junction normally takes twenty-five minutes',
      'Missed coastal connections can be used on any subsequent day of the week',
    ],
    correct: [
      'The coastal express requires an advance reservation costing ten pounds',
      'The seven-ten service departs before the junction engineering closure begins',
    ],
  },
  {
    id: 'lmcqm-703',
    audioId: 'con-shop-exchange',
    question: 'Which two terms apply to returning an item without a receipt at the store?',
    options: [
      'The item value is calculated at the current selling price rather than the price paid',
      'The customer must initiate the exchange within a twenty-eight-day window',
      'The customer can only choose store credit that expires within thirty days',
      'Items purchased during sale promotions cannot be exchanged for alternative colors',
      'The replacement garment must be identical in size to the item being returned',
    ],
    correct: [
      'The item value is calculated at the current selling price rather than the price paid',
      'The customer must initiate the exchange within a twenty-eight-day window',
    ],
  },
  {
    id: 'lmcqm-704',
    audioId: 'con-street-party',
    question: 'Which two requirements are specified by the council officer for the street party?',
    options: [
      'Appointed marshals must keep an access gap clear for a resident with a blue badge',
      'The organizers must pay sixty pounds for the formal road closure order',
      'The organizers must hire commercial cleaning contractors following the party',
      'Residents must submit personal petitions signed by every homeowner on the street',
      'The road signs must be collected from the council depot twenty days before the event',
    ],
    correct: [
      'Appointed marshals must keep an access gap clear for a resident with a blue badge',
      'The organizers must pay sixty pounds for the formal road closure order',
    ],
  },
  {
    id: 'lmcqm-705',
    audioId: 'lec-climate-tipping',
    question: 'Which two cascading climate interactions are highlighted by the speaker?',
    options: [
      'Arctic summer sea ice loss reduces albedo and accelerates Greenland ice sheet melting',
      'Freshwater discharge from Greenland slows the Atlantic Meridional Overturning Circulation',
      'Amazon rainforest drought immediately increases Antarctic sea ice thickness',
      'Linear surface temperature warming suppresses circumpolar deep ocean currents',
      'Tropical monsoons shift northward into the Mediterranean basin during summer months',
    ],
    correct: [
      'Arctic summer sea ice loss reduces albedo and accelerates Greenland ice sheet melting',
      'Freshwater discharge from Greenland slows the Atlantic Meridional Overturning Circulation',
    ],
  },
  {
    id: 'lmcqm-706',
    audioId: 'lec-quantum-computing',
    question: 'Which two physical causes of quantum decoherence are named by the lecturer?',
    options: [
      'Stray environmental electromagnetic fields and thermal phonons in the substrate',
      'Cosmic radiation interacting with superconducting physical qubit circuits',
      'Exponential representation of basis states across classical register bits',
      'Excessive numbers of fault-tolerant logical qubits in topological surface codes',
      'Instantaneous projective measurements commanded by software compilers',
    ],
    correct: [
      'Stray environmental electromagnetic fields and thermal phonons in the substrate',
      'Cosmic radiation interacting with superconducting physical qubit circuits',
    ],
  },
]

export const EXTRA_SITUATIONS_8: SituationItem[] = [
  {
    id: 'rts-31',
    situation:
      'You are presenting at a departmental research symposium. Ten minutes into your twenty-minute presentation, the projection system turns off and cannot be rebooted immediately. You have printed handout summaries with you.',
    prompt:
      'Respond to the situation. Speak for between 40 and 90 seconds. Address the audience, explain how you will proceed, and keep the session on time.',
    reference:
      'The presenter should remain calm, acknowledge the technical failure without panic, and immediately pivot to the printed handouts. They should invite the audience to refer to the key data tables on page two, summarize the core findings verbally with confidence, and adhere strictly to the remaining ten-minute time limit to respect subsequent speakers.',
    keyTerms: ['technical failure', 'handouts', 'pivot', 'core findings', 'verbally', 'time limit', 'respect'],
    minWords: 40,
  },
  {
    id: 'rts-32',
    situation:
      'Your landlord has notified you that the apartment rent will increase by thirty percent next month due to general inflation, despite a tenancy agreement stating annual increases are capped at five percent.',
    prompt:
      'Respond to the situation. Speak for between 40 and 90 seconds. State your position, refer to the lease agreement, and propose a lawful resolution.',
    reference:
      'The tenant should respond firmly and professionally, citing the specific clause in the signed tenancy agreement that limits rent adjustments to five percent. They should politely reject the thirty percent increase as legally invalid under the contract, offer to pay the legitimate five percent revised amount on schedule, and request written confirmation of the corrected invoice.',
    keyTerms: ['tenancy agreement', 'clause', 'capped', 'reject', 'contract', 'five percent', 'written confirmation'],
    minWords: 40,
  },
  {
    id: 'rts-33',
    situation:
      'You ordered specialized laboratory chemical reagents for an experiment scheduled for tomorrow morning. The courier has just delivered the wrong catalog item, and customer support claims redelivery takes five business days.',
    prompt:
      'Respond to the situation. Speak for between 40 and 90 seconds. Explain the urgency, highlight their shipping error, and negotiate an express same-day solution.',
    reference:
      'The researcher should clearly state that the error was on the vendor side, noting the catalog number mismatch. They should emphasize that the scheduled experiment is time-critical with perishable biological samples, and firmly request an urgent courier dispatch for same-day delivery or authorization to collect the correct reagent from a local depot at the supplier expense.',
    keyTerms: ['shipping error', 'catalog number', 'time-critical', 'perishable', 'urgent courier', 'same-day', 'depot'],
    minWords: 40,
  },
  {
    id: 'rts-34',
    situation:
      'You discover that a teammate on a shared academic paper has copied two paragraphs verbatim from an online source without proper quotation marks or citation. Submission is in twenty-four hours.',
    prompt:
      'Respond to the situation. Speak for between 40 and 90 seconds. Address the ethical concern directly, set out what must be changed, and protect the team integrity.',
    reference:
      'The student should confront the teammate constructively and immediately, explaining that uncredited verbatim text violates academic integrity and constitutes plagiarism. They should insist that they rewrite the copied paragraphs into original wording with appropriate scholarly citations before submission, offering to help paraphrase the text tonight to meet the deadline safely.',
    keyTerms: ['plagiarism', 'uncredited', 'citations', 'academic integrity', 'rewrite', 'paraphrase', 'submission'],
    minWords: 40,
  },
  {
    id: 'rts-35',
    situation:
      'You arrive at the airport check-in desk for an international flight and are informed that the airline overbooked the economy cabin. The gate agent asks you to volunteer to take a flight the following morning.',
    prompt:
      'Respond to the situation. Speak for between 40 and 90 seconds. Assess the offer, request required compensation, hotel lodging, and meal vouchers.',
    reference:
      'The passenger should assess whether their travel schedule allows a delay. If willing to volunteer, they should clearly negotiate statutory cash compensation for involuntary bumping, a confirmed booking on the morning flight in business class, and complimentary hotel accommodations with transportation and meal vouchers before surrendering their boarding pass.',
    keyTerms: ['overbooked', 'volunteer', 'compensation', 'hotel accommodation', 'vouchers', 'confirmed booking'],
    minWords: 40,
  },
  {
    id: 'rts-36',
    situation:
      'A library database subscription that your postgraduate dissertation relies upon has been abruptly terminated by the university due to budget cuts halfway through your final semester.',
    prompt:
      'Respond to the situation. Speak for between 40 and 90 seconds. Address the department head and university librarian, explaining the critical academic dependency.',
    reference:
      'The postgraduate should write a formal appeal detailing how their approved dissertation methodology depends directly on the cancelled database. They should propose pragmatic temporary solutions, such as requesting individual inter-library loan access, departmental discretionary funding for access tokens, or a letter of support for a research deadline extension.',
    keyTerms: ['database', 'dissertation', 'dependency', 'appeal', 'inter-library loan', 'access tokens', 'extension'],
    minWords: 40,
  },
]
