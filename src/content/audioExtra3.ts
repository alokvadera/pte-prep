import type { AudioScript, GroupDiscussionItem, RetellItem, SpokenSummaryItem } from './schema'

/**
 * Third audio batch: four lectures and three group discussions with their
 * derived Retell, Summarize Spoken Text and Summarize Group Discussion items.
 *
 * This targets the three thinnest speaking/listening types head-on:
 * - Summarize Spoken Text had 3 items against 1 per test (3 mocks of
 *   headroom); six more take it to 9.
 * - Re-tell Lecture had 9 against 2–3 per test; six more take it to 15.
 * - Summarize Group Discussion had 6 against 2–3 per test; three more take
 *   it to 9.
 *
 * Every script also feeds the Repeat Sentence pool automatically (each
 * sentence of 11–20 words becomes a candidate), so this file adds roughly
 * forty RS candidates as a side effect. Two of the SST items point at
 * earlier lectures that had retell coverage but no summary item, which is
 * exactly how the real test reuses one recording across formats.
 */

export const EXTRA_LECTURES_3: AudioScript[] = [
  {
    id: 'lec-shift-work',
    title: 'Why Night Shifts Harm Health',
    kind: 'lecture',
    topic: 'Occupational health',
    scene: 'A public health lecturer speaking to nursing students.',
    speakers: [{ id: 's1', name: 'Dr Whitfield', role: 'Lecturer', voiceHint: 'mid' }],
    turns: [
      {
        speaker: 's1',
        text: 'Shift work is usually discussed as a problem of tiredness, and tiredness is real, but it is not the mechanism that does the lasting damage. The deeper problem is that the body expects light during the day and darkness at night, and shift work reverses that expectation several times a month.',
      },
      {
        speaker: 's1',
        text: 'The circadian system controls far more than sleep. Insulin sensitivity, blood pressure and the inflammatory response all follow a daily rhythm, and they do so because the relevant organs anticipate when food and activity will arrive. A night-shift nurse eats a full meal at three in the morning, which is precisely when the pancreas is least prepared to handle glucose.',
      },
      {
        speaker: 's1',
        text: 'Studies have reported associations between night work and some metabolic, cardiovascular and cancer outcomes, but findings vary by outcome and study. Exposure measurement and other factors, including smoking, diet and socioeconomic conditions, complicate interpretation. These patterns warrant attention, but they do not show that night work alone caused each outcome.',
      },
      {
        speaker: 's1',
        text: 'Workplace responses are still being studied. Roster design, light exposure and protected opportunities for sleep may affect how workers adapt, but findings depend on the schedule and person. Forward rotation is sometimes recommended as easier to tolerate, though it is not a universal solution. Adequate sleep and recovery time remain important, including on days off.',
      },
      {
        speaker: 's1',
        text: 'Night work remains necessary in many sectors, so the practical question is how to reduce its burdens. Employers can consider roster timing, light exposure and protected sleep opportunities, then evaluate results for their workforce. These measures should account for individual differences and the need for recovery. Thank you.',
      },
    ],
    keyTerms: ['circadian', 'insulin', 'metabolic', 'glucose', 'roster design', 'recovery'],
  },
  {
    id: 'lec-bees',
    title: 'Why Pollinators Are Declining',
    kind: 'lecture',
    topic: 'Ecology',
    scene: 'An ecologist addressing an agriculture seminar.',
    speakers: [{ id: 's1', name: 'Professor Duarte', role: 'Ecologist', voiceHint: 'low' }],
    turns: [
      {
        speaker: 's1',
        text: 'Pollinator decline is often attributed to a single cause, but the proposed explanation can depend on who is speaking. Pesticide manufacturers point to habitat loss, conservation groups point to pesticides, and beekeepers point to disease. Research identifies several pressures that may contribute, although their importance varies across species and places, and no single factor explains every case.',
      },
      {
        speaker: 's1',
        text: 'Interactions among pressures may matter, although their effects vary by species and setting. Some experiments have found that pesticide exposure can affect navigation or foraging, while limited forage can affect colony health. Pathogens may add further pressure. In some cases these effects can compound, but researchers continue to study when stressors interact and how large those effects are.',
      },
      {
        speaker: 's1',
        text: 'This is one reason a single intervention may not address every cause of decline. Changing pesticide use will not by itself restore lost nesting or forage habitat, and habitat measures do not resolve every disease or exposure risk. Some studies examine combined approaches, such as reducing pesticide risk while improving forage, but outcomes depend on local conditions.',
      },
      {
        speaker: 's1',
        text: 'For growers, the practical lesson is to treat pollination as an ecosystem service that depends on local habitat and management. Field margins can support pollinators, but effects on yield and costs vary by crop, landscape and season. Comparing outcomes across farms can help identify which measures are worthwhile. Thank you.',
      },
    ],
    keyTerms: [
      'pesticide exposure',
      'navigation',
      'forage',
      'pathogens',
      'combined approaches',
      'local conditions',
    ],
  },
  {
    id: 'lec-recycling-myth',
    title: 'Why Recycling Rates Mislead',
    kind: 'lecture',
    topic: 'Waste economics',
    scene: 'An economist speaking to a city council workshop.',
    speakers: [{ id: 's1', name: 'Dr Okafor', role: 'Economist', voiceHint: 'mid-high' }],
    turns: [
      {
        speaker: 's1',
        text: 'Cities often report recycling rates because they provide a simple public measure. But a collection rate does not always show how much material is ultimately processed into new products; that depends on local sorting, contamination, markets and material type. The difference between collection and final recovery can be difficult to measure.',
      },
      {
        speaker: 's1',
        text: 'Several factors can contribute to losses after collection. Some lightweight packaging is difficult to recycle in available local systems. Contamination can lower the value of a batch or lead a facility to reject part or all of it, depending on its equipment and contracts. Changes in export markets have also affected where some sorted materials are processed.',
      },
      {
        speaker: 's1',
        text: 'None of this means recycling is pointless. Recovery rates and economics differ across materials and local systems; aluminium, glass and paper products each have distinct processing requirements and markets. A single blended rate can hide these differences. Councils may make better decisions by reporting collection, processing and end-market outcomes by material rather than relying on one headline figure.',
      },
      {
        speaker: 's1',
        text: 'The reform writes itself. Charge producers by the recyclability of what they sell, publish material-specific outcomes rather than one headline figure, and stop counting collection as recovery. Until then, every record recycling rate should be read with the question it avoids: recycled into what. Thank you.',
      },
    ],
    keyTerms: ['contamination', 'material type', 'local markets', 'end-market', 'recyclability'],
  },
  {
    id: 'lec-drought',
    title: 'Who Gets the Water in a Drought',
    kind: 'lecture',
    topic: 'Resource economics',
    scene: 'A water economist lecturing to geography undergraduates.',
    speakers: [{ id: 's1', name: 'Dr Ferreira', role: 'Lecturer', voiceHint: 'mid' }],
    turns: [
      {
        speaker: 's1',
        text: 'Drought is usually described as a natural event, and rainfall failure is natural enough, but allocation rules also shape who faces shortages. In some systems, water rights reflect historical claims and priority rules. The effects differ by jurisdiction; cities, farms, ecosystems and other users may all face restrictions during a drought.',
      },
      {
        speaker: 's1',
        text: 'Water trading has been introduced in some places to let rights holders transfer allocations they do not use. In principle, a farmer may sell water to another user, but whether both sides benefit depends on local prices, rules and impacts on other users. Trading can also be limited by infrastructure, legal objections, transaction costs and concerns about future rights.',
      },
      {
        speaker: 's1',
        text: 'In some basins, measurement and verification can constrain water trading alongside price. When withdrawals are difficult to measure, users may dispute whether a transfer is reliable or sustainable. The role of meters, infrastructure, transaction costs and legal rules varies between basins, so the design and results of water markets need to be assessed locally.',
      },
      {
        speaker: 's1',
        text: 'For water managers, reliable information about withdrawals can help evaluate allocation and trading policies. Monitoring, transparent records and clear rules may support a market where one is appropriate, but they are not the only considerations. Environmental needs, infrastructure and the rights of affected communities also matter. Thank you.',
      },
    ],
    keyTerms: [
      'water rights',
      'infrastructure',
      'measurement',
      'allocation',
      'environmental needs',
    ],
  },
]

export const EXTRA_DISCUSSIONS_3: AudioScript[] = [
  {
    id: 'gd-ai-tutoring',
    title: 'Should schools buy AI tutors?',
    kind: 'group',
    topic: 'Education technology',
    scene: 'Three speakers debate an AI tutoring contract at a school board meeting.',
    speakers: [
      { id: 's1', name: 'Ms Hartley', role: 'Headteacher', voiceHint: 'high' },
      { id: 's2', name: 'Dev', role: 'Parent governor', voiceHint: 'low' },
      { id: 's3', name: 'Dr Lin', role: 'Learning researcher', voiceHint: 'mid' },
    ],
    turns: [
      {
        speaker: 's1',
        text: 'The proposal is a three-year licence for an AI tutor covering mathematics in years seven to nine. The vendor promises personalised practice for every pupil at a fraction of the cost of a teaching assistant, and the pilot data show test gains of roughly three months. I want us to decide on evidence, not enthusiasm.',
      },
      {
        speaker: 's2',
        text: 'My concern is what the pilot measured. Three months of gain on the tutored items is exactly what drilling produces, and drilling is cheap with or without AI. What I have not seen is any measure of whether pupils can transfer that skill to problems the tutor has not shown them, which is the only outcome worth paying for.',
      },
      {
        speaker: 's3',
        text: 'The transfer point is the right test, and the honest answer is that the evidence is mixed. Tutored practice reliably raises procedural fluency, which matters, but the gains fade unless a teacher connects the drilled skill to new contexts. The tool does not replace the lesson; it changes what the lesson should spend its time on.',
      },
      {
        speaker: 's1',
        text: 'Then the question is staffing, not software. If the tutor covers practice, my teachers gain perhaps four hours a week, and I can defend the purchase only if those hours are timetabled for the transfer work Dr Lin describes rather than absorbed into cover.',
      },
      {
        speaker: 's2',
        text: 'I can support a one-year trial on those terms, with renewal conditional on transfer measures rather than vendor tests. Without that condition we are buying the metric, not the learning.',
      },
      {
        speaker: 's3',
        text: 'So the group agrees the tool drills fluency but does not teach transfer, and the licence is defensible only if teacher time is explicitly redirected. They differ on duration: a full term versus a year before judging.',
      },
    ],
    keyTerms: ['personalised practice', 'transfer', 'procedural fluency', 'timetabled', 'renewal'],
  },
  {
    id: 'gd-night-flights',
    title: 'Should the airport expand night flights?',
    kind: 'group',
    topic: 'Transport and health',
    scene: 'Three residents debate a night-flight proposal at a council hearing.',
    speakers: [
      { id: 's1', name: 'Councillor Bale', role: 'Councillor', voiceHint: 'mid' },
      { id: 's2', name: 'Amara', role: 'Resident', voiceHint: 'high' },
      { id: 's3', name: 'Mr Sørensen', role: 'Freight operator', voiceHint: 'low' },
    ],
    turns: [
      {
        speaker: 's1',
        text: 'The application seeks twelve additional night movements between eleven and six, concentrated in the freight window. The airport argues the jobs depend on it and the noise contour barely changes. Objectors argue the contour averages away the awakenings that matter. Both claims need scrutiny.',
      },
      {
        speaker: 's2',
        text: 'I live under the flight path and the average is indeed the problem. A contour that stays within limits can still mean forty individual awakenings a night for the same households, and the health evidence on fragmented sleep — blood pressure, school performance — tracks events, not averages. Compensation does not buy back an unbroken night.',
      },
      {
        speaker: 's3',
        text: 'From the freight side, the window is not arbitrary. Express cargo connects to morning delivery slots across the region, and moving those flights to daytime means losing the contract to an airport that will take them at night. The jobs figure of four hundred is direct employment, before the firms that depend on next-day delivery.',
      },
      {
        speaker: 's1',
        text: 'So the conflict is genuine: concentrated, event-level harm against dispersed economic benefit. The middle options are a cap on the noisiest aircraft, a quota counted in awakenings rather than movements, or a time-limited permission with a health review. None of those is on the table yet.',
      },
      {
        speaker: 's2',
        text: 'A quota in awakenings would at least measure the right thing. Movements can be met with quieter aircraft; awakenings cannot be gamed without actually waking fewer people.',
      },
      {
        speaker: 's3',
        text: 'Industry could accept an awakening quota tied to fleet renewal, since it rewards the investment we are making anyway. What we cannot accept is a flat refusal that simply moves the same flights — and the same noise — to the next town.',
      },
    ],
    keyTerms: ['night movements', 'awakenings', 'contour', 'quota', 'fleet renewal'],
  },
  {
    id: 'gd-food-labels',
    title: 'Do traffic-light labels change diets?',
    kind: 'group',
    topic: 'Public health',
    scene: 'Three panelists discuss front-of-pack labelling at a nutrition forum.',
    speakers: [
      { id: 's1', name: 'Dr Mensah', role: 'Nutritionist', voiceHint: 'mid' },
      { id: 's2', name: 'Karen', role: 'Retail manager', voiceHint: 'high' },
      { id: 's3', name: 'Jonas', role: 'Consumer advocate', voiceHint: 'low' },
    ],
    turns: [
      {
        speaker: 's1',
        text: 'Traffic-light labels were meant to make the healthy choice the easy choice, and on recognition they succeed: shoppers identify red-rated products in seconds. The question is whether recognition changes behaviour, and the purchasing data say the effect is small and concentrated among shoppers who already read labels.',
      },
      {
        speaker: 's2',
        text: 'From the retail side the reformulation effect matters more than the shopping effect. When a product scores three reds, the manufacturer reformulates to two, because nobody wants the worst panel on the shelf. The label changes the food more than it changes the shopper, and that is arguably the better outcome.',
      },
      {
        speaker: 's3',
        text: 'I would add that reds cluster on the cheapest products, so the label risks becoming a tax on poverty — information the poorest shoppers cannot afford to act on. If reformulation raises the price of the budget range, the label has improved the average product and harmed the shoppers it claimed to help.',
      },
      {
        speaker: 's1',
        text: 'That is the sharpest objection, and it points to the missing policy: labels without price action inform without enabling. The trials that paired labels with subsidies for green-rated staples show the largest behaviour change by far.',
      },
      {
        speaker: 's2',
        text: 'Retailers would accept mandatory labels far more readily than subsidies, which tells you where the cost falls. But I concede the pairing result: information alone moves the already-informed.',
      },
      {
        speaker: 's3',
        text: 'Then we agree the label works through manufacturers first and informed shoppers second, and that without price support it leaves the poorest behind. The disagreement is only about whether that is a reason to strengthen the scheme or to admit its limits.',
      },
    ],
    keyTerms: ['reformulation', 'recognition', 'cluster', 'subsidies', 'enabling'],
  },
]

export const EXTRA_RETELL_ITEMS_3: RetellItem[] = [
  {
    id: 'rtl-shift-work',
    audioId: 'lec-shift-work',
    skeleton: [
      'tiredness is real but not the mechanism',
      'organs anticipate timing of food and activity',
      'health studies report associations but findings vary',
      'roster, light and sleep responses depend on context',
      'adequate sleep and recovery remain important',
    ],
    reference:
      'Night work harms health not primarily through tiredness but through circadian disruption, because organs anticipate when food and activity arrive and a meal at three in the morning meets a pancreas unprepared for glucose. Long-term night workers show higher metabolic and cardiovascular risk rising with years of exposure even after controlling for lifestyle. Forward-rotating rosters, bright light on shift with darkness after, and stable sleep schedules mitigate the harm, so rosters should be designed like drug doses with attention to timing and recovery.',
    keyTerms: ['circadian', 'glucose', 'metabolic', 'cardiovascular', 'roster design', 'recovery'],
    minWords: 30,
  },
  {
    id: 'rtl-bees',
    audioId: 'lec-bees',
    skeleton: [
      'single-cause blame depends on the speaker',
      'multiple pressures may interact, with effects varying by context',
      'single interventions may not address every cause',
      'combined measures can be studied, with local outcomes varying',
      'pollination depends on local habitat and management',
    ],
    reference:
      'The lecture describes pollinator pressures including pesticides, habitat loss and disease, whose effects can vary and sometimes interact. Some experiments find that pesticide exposure affects navigation or foraging, while limited forage and pathogens may add further pressure. A single intervention may not address all causes, so combined measures such as reducing pesticide risk and improving forage are studied. Effects on pollination and crop yields depend on local conditions.',
    keyTerms: [
      'pesticide exposure',
      'navigation',
      'forage',
      'pathogens',
      'combined measures',
      'local conditions',
    ],
    minWords: 30,
  },
  {
    id: 'rtl-recycling-myth',
    audioId: 'lec-recycling-myth',
    skeleton: [
      'rate measures bin entry, not new products',
      'sorting, contamination, markets and material type affect outcomes',
      'recovery and economics vary by material and local system',
      'report collection, processing and end-market results by material',
      'consider producer charges linked to recyclability',
    ],
    reference:
      'The speaker explains that collection rates do not necessarily show how much material becomes new products. Sorting, contamination, local markets and material type can affect outcomes. Since recovery and economics vary across materials and systems, one blended rate may hide useful differences. Councils could report collection, processing and end-market outcomes by material and consider producer charges linked to recyclability.',
    keyTerms: [
      'collection rates',
      'contamination',
      'local markets',
      'material type',
      'end-market',
      'recyclability',
    ],
    minWords: 30,
  },
  {
    id: 'rtl-drought',
    audioId: 'lec-drought',
    skeleton: [
      'allocation rules as well as rainfall shape shortages',
      'historical rights and effects differ by jurisdiction',
      'infrastructure, legal rules, costs and measurement affect trading',
      'market design requires local assessment',
    ],
    reference:
      'Allocation rules as well as rainfall shape who faces shortages in a drought. Some systems use historical water rights and priority rules, but effects differ by jurisdiction and users. Water trading may help move unused allocations, yet infrastructure, legal rules, transaction costs and measurement can all affect whether trades occur. Market design and results therefore need local assessment.',
    keyTerms: [
      'historical',
      'shortages',
      'infrastructure',
      'legal rules',
      'measurement',
      'jurisdiction',
    ],
    minWords: 30,
  },
  {
    id: 'rtl-ai-tutoring',
    audioId: 'gd-ai-tutoring',
    skeleton: [
      'vendor promises personalised practice plus pilot gains',
      'gains may be drilling without transfer',
      'tool changes what lessons should cover',
      'purchase defensible only if hours retimetabled',
      'renewal on transfer measures',
    ],
    reference:
      'The board debates a three-year AI tutor licence promising personalised practice with three months of pilot gains, but the parent governor argues drilling gains without transfer to unseen problems are worthless. The researcher agrees the tool raises procedural fluency while transfer needs teacher-led connection to new contexts. The headteacher will defend the purchase only if freed teacher hours are timetabled for that transfer work, and renewal should depend on transfer measures rather than vendor tests.',
    keyTerms: ['licence', 'drilling', 'transfer', 'fluency', 'timetabled', 'renewal'],
    minWords: 30,
  },
  {
    id: 'rtl-night-flights',
    audioId: 'gd-night-flights',
    skeleton: [
      'twelve extra movements in the freight window',
      'averages hide event-level awakenings',
      'window tied to morning delivery contracts',
      'quota in awakenings, not movements',
      'fleet renewal as common ground',
    ],
    reference:
      'The airport seeks twelve extra night movements for freight while residents argue noise contours average away the forty nightly awakenings that the health evidence actually tracks. The operator says the window serves morning delivery contracts that would move to another airport with the jobs. The middle ground is a cap on the noisiest aircraft or a quota counted in awakenings rather than movements with a health review, which industry could accept tied to fleet renewal.',
    keyTerms: ['movements', 'awakenings', 'contour', 'quota', 'contracts', 'renewal'],
    minWords: 30,
  },
]

export const EXTRA_SPOKEN_SUMMARY_ITEMS_3: SpokenSummaryItem[] = [
  {
    id: 'sst-shift-work',
    audioId: 'lec-shift-work',
    question:
      'Listen to the recording and write a summary of 50 to 70 words. Include the main idea and the most important supporting details. You have ten seconds during the recording to prepare your answer.',
    reference:
      'The lecture describes circadian disruption as one concern associated with night work. Studies have reported links with some metabolic, cardiovascular and cancer outcomes, but findings vary and are complicated by exposure measurement and other factors. Roster design, light exposure and protected sleep may affect adaptation, though responses depend on the person and schedule. Adequate sleep and recovery time remain important.',
    keyTerms: [
      'circadian',
      'night work',
      'metabolic',
      'cardiovascular',
      'roster design',
      'recovery',
    ],
    minWords: 30,
  },
  {
    id: 'sst-bees',
    audioId: 'lec-bees',
    question:
      'Listen to the recording and write a summary of 50 to 70 words. Include the main idea and the most important supporting details. You have ten seconds during the recording to prepare your answer.',
    reference:
      'The lecture describes pollinator pressures including pesticides, habitat loss and disease, whose effects can vary and sometimes interact. Some experiments find that pesticide exposure affects navigation or foraging, while limited forage and pathogens may add further pressure. A single intervention may not address all causes, so combined measures such as reducing pesticide risk and improving forage are studied. Effects on pollination and crop yields depend on local conditions.',
    keyTerms: [
      'pesticide exposure',
      'navigation',
      'forage',
      'pathogens',
      'combined measures',
      'local conditions',
    ],
    minWords: 30,
  },
  {
    id: 'sst-recycling-myth',
    audioId: 'lec-recycling-myth',
    question:
      'Listen to the recording and write a summary of 50 to 70 words. Include the main idea and the most important supporting details. You have ten seconds during the recording to prepare your answer.',
    reference:
      'The speaker explains that collection rates do not necessarily show how much material becomes new products. Sorting, contamination, local markets and material type can affect outcomes. Since recovery and economics vary across materials and systems, one blended rate may hide useful differences. Councils could report collection, processing and end-market outcomes by material and consider producer charges linked to recyclability.',
    keyTerms: [
      'collection rates',
      'contamination',
      'local markets',
      'material type',
      'end-market',
      'recyclability',
    ],
    minWords: 30,
  },
  {
    id: 'sst-drought',
    audioId: 'lec-drought',
    question:
      'Listen to the recording and write a summary of 50 to 70 words. Include the main idea and the most important supporting details. You have ten seconds during the recording to prepare your answer.',
    reference:
      'The speaker explains that allocation rules, as well as rainfall, shape who faces drought shortages. Historical water rights and priority rules operate in some systems, while effects differ by jurisdiction. Trading unused allocations may help, but infrastructure, legal rules, costs and measurement affect whether trades occur. Water market design should therefore be assessed locally.',
    keyTerms: [
      'historical',
      'shortages',
      'infrastructure',
      'legal rules',
      'measurement',
      'jurisdiction',
    ],
    minWords: 30,
  },
  {
    id: 'sst-deep-learning',
    audioId: 'lec-deep-learning',
    question:
      'Listen to the recording and write a summary of 50 to 70 words. Include the main idea and the most important supporting details. You have ten seconds during the recording to prepare your answer.',
    reference:
      'The speaker presents data redundancy and the shape of the loss landscape as two ideas for studying why overparameterised neural networks generalise. Repeated patterns may help models learn features that recur in new examples, while many parameter settings can achieve similar training loss. Whether flat regions explain generalisation remains debated, and researchers would need controlled experiments to test how changing data redundancy affects the training and test accuracy gap.',
    keyTerms: ['redundant', 'loss landscape', 'flat', 'generalisation', 'accuracy', 'parameters'],
    minWords: 30,
  },
  {
    id: 'sst-memory',
    audioId: 'lec-memory',
    question:
      'Listen to the recording and write a summary of 50 to 70 words. Include the main idea and the most important supporting details. You have ten seconds during the recording to prepare your answer.',
    reference:
      'The speaker rejects memory as recording with playback, showing retrieval reconstructs from semantic candidates so errors are related intrusions rising with list size. Confidence comes from the same unreliable process, so confident eyewitnesses can be wrong. Repeated consistent retelling rewrites memory, aiding accuracy while also consolidating errors from non-suggestive interviews.',
    keyTerms: [
      'reconstruction',
      'intrusion',
      'confidence',
      'consistency',
      'rewrites',
      'interviews',
    ],
    minWords: 30,
  },
]

export const EXTRA_GROUP_DISCUSSION_ITEMS_3: GroupDiscussionItem[] = [
  {
    id: 'sgd-ai-tutoring',
    audioId: 'gd-ai-tutoring',
    question:
      "Listen to the discussion and summarise it in between 40 and 90 seconds. Report the group's overall stance, the main points each speaker made, and where they disagreed.",
    reference:
      'The group agrees the AI tutor drills procedural fluency but does not teach transfer, and that the licence stands or falls on redirecting teacher time. The headteacher presents a three-year proposal with three months of pilot gains and will defend it only if freed hours are timetabled for transfer work. The parent demands renewal conditional on transfer measures not vendor tests, and the researcher supplies the mechanism: fluency from the tool, connection from the teacher. They split on trial length before judging.',
    keyTerms: ['fluency', 'transfer', 'licence', 'timetabled', 'renewal', 'mechanism'],
    minWords: 40,
  },
  {
    id: 'sgd-night-flights',
    audioId: 'gd-night-flights',
    question:
      "Listen to the discussion and summarise it in between 40 and 90 seconds. Report the group's overall stance, the main points each speaker made, and where they disagreed.",
    reference:
      'The hearing accepts the conflict as genuine between event-level sleep harm and dispersed freight jobs. The resident argues contours average away forty nightly awakenings that the health evidence tracks, and compensation cannot restore unbroken sleep. The operator ties the window to morning delivery contracts worth four hundred direct jobs. The councillor offers the middle: noisiest-aircraft caps, an awakening-counted quota rewarding fleet renewal, or time-limited permission with review.',
    keyTerms: ['awakenings', 'contour', 'contracts', 'quota', 'renewal', 'review'],
    minWords: 40,
  },
  {
    id: 'sgd-food-labels',
    audioId: 'gd-food-labels',
    question:
      "Listen to the discussion and summarise it in between 40 and 90 seconds. Report the group's overall stance, the main points each speaker made, and where they disagreed.",
    reference:
      'The forum agrees traffic-light labels work through manufacturers first and informed shoppers second, and that without price support the poorest are left behind. The nutritionist shows recognition succeeds but behaviour change stays small and concentrated. The retailer argues reformulation from three reds to two changes food more than shoppers. The advocate warns reds cluster on the cheapest products, so pairing labels with green-staple subsidies is the missing policy.',
    keyTerms: ['reformulation', 'recognition', 'cluster', 'subsidies', 'enabling', 'behaviour'],
    minWords: 40,
  },
]
