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
        text: 'The epidemiology is consistent across industries. Long-term night workers show higher rates of metabolic syndrome, cardiovascular events and certain cancers, and the risk rises with years of exposure rather than with age alone. Critically, the pattern persists after controlling for smoking, diet and socioeconomic status, which rules out the simplest confounding explanations.',
      },
      {
        speaker: 's1',
        text: 'What mitigates the harm is also fairly clear. Forward-rotating rosters, which move morning to afternoon to night rather than backwards, allow the clock to adjust in its preferred direction. Bright light during the shift and darkness afterwards anchor the rhythm, and keeping the same sleep schedule on days off matters more than the total hours slept.',
      },
      {
        speaker: 's1',
        text: 'So the conclusion is not that night work should end, which would close every hospital at sunset. It is that rosters are a health intervention with measurable effects, and they should be designed the way drug doses are designed: with attention to timing, direction and recovery. Thank you.',
      },
    ],
    keyTerms: ['circadian', 'insulin', 'metabolic syndrome', 'forward-rotating', 'anchor'],
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
        text: 'Pollinator decline is usually blamed on a single cause, and the blamed cause depends on who is speaking. Pesticide manufacturers point to habitat loss, conservation groups point to pesticides, and beekeepers point to disease. The monitoring data suggest all three are correct and none is sufficient on its own.',
      },
      {
        speaker: 's1',
        text: 'The interaction matters more than any single pressure. A bee exposed to a sub-lethal pesticide dose does not die, but its navigation degrades, so it brings back less food. A colony short of diverse forage rears fewer workers, so the loss of one forager matters more. A pathogen arriving in that weakened colony spreads faster than it would in a strong one. Each stressor multiplies the others rather than adding to them.',
      },
      {
        speaker: 's1',
        text: 'This is why single-factor bans disappoint. Removing one neonicotinoid from one crop shifts exposure to a substitute applied elsewhere, while the forage gap that made the colony vulnerable remains exactly as it was. The trials that show genuine recovery all combine reduced exposure with restored habitat: flower strips beside the treated field, not instead of treating it.',
      },
      {
        speaker: 's1',
        text: 'The practical upshot for growers is that pollination should be budgeted like irrigation: as an input to be secured rather than a service assumed to be free. Fields with managed margins consistently out-yield comparable fields without them, and the margin costs less than a single season of hired hives. Thank you.',
      },
    ],
    keyTerms: ['sub-lethal', 'forage', 'neonicotinoid', 'flower strips', 'multiplies'],
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
        text: 'Cities celebrate rising recycling rates, and the celebration is understandable, because the rate is the number the public sees. But the rate measures what enters the recycling bin, not what becomes a new product, and the gap between the two has been widening for a decade.',
      },
      {
        speaker: 's1',
        text: 'The gap has three sources. First, lightweight packaging counts fully toward the rate while being the least recyclable material collected. Second, contamination — one food-soiled item in a bale — can condemn the entire bale to landfill or incineration. Third, export markets for sorted material have narrowed, so bales that once shipped abroad now wait for domestic buyers that do not exist.',
      },
      {
        speaker: 's1',
        text: 'None of this means recycling is pointless. Aluminium, glass and clean cardboard recycle efficiently and at a clear profit, and those streams subsidise the rest of the system. What it means is that a single blended rate conceals which materials justify collection and which are collected for appearance. A council that published three rates — profitable, break-even and loss-making — would make better decisions than one celebrating a single rising number.',
      },
      {
        speaker: 's1',
        text: 'The reform writes itself. Charge producers by the recyclability of what they sell, publish material-specific outcomes rather than one headline figure, and stop counting collection as recovery. Until then, every record recycling rate should be read with the question it avoids: recycled into what. Thank you.',
      },
    ],
    keyTerms: ['contamination', 'bale', 'export markets', 'break-even', 'recyclability'],
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
        text: 'Drought is usually described as a natural event, and rainfall failure is natural enough, but who goes short is decided by rules written long before the dry year. Water rights in most systems are historical: the earliest claimants take their full share first, and later users — typically cities — absorb the entire shortfall.',
      },
      {
        speaker: 's1',
        text: 'Markets were introduced to soften this rigidity by letting holders sell what they do not use. In principle a farmer growing a low-value crop can sell a season of water to a city and both sides gain. In practice the trades that occur are the easy ones between neighbours, while the large transfers that would matter most are blocked by conveyance limits, legal objections and the fear that selling once means losing the right forever.',
      },
      {
        speaker: 's1',
        text: 'The evidence from the driest basins is that the binding constraint is rarely price. It is trust in measurement: nobody trades what cannot be metered, and unmetered groundwater beside a metered river makes every trade disputable. Basins that metered extraction first and traded second saw active markets; basins that did it the other way round saw litigation instead.',
      },
      {
        speaker: 's1',
        text: 'So the priority in a drying climate is unglamorous. Measure every abstraction, publish the accounts, and only then build the market on top. A drought plan that begins with prices and ends with meters has the sequence backwards, and the driest years are when backwards plans fail first. Thank you.',
      },
    ],
    keyTerms: ['water rights', 'conveyance', 'metered', 'abstraction', 'litigation'],
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
      'risk rises with years of exposure',
      'forward rotation and light anchor the rhythm',
      'rosters are a health intervention',
    ],
    reference:
      'Night work harms health not primarily through tiredness but through circadian disruption, because organs anticipate when food and activity arrive and a meal at three in the morning meets a pancreas unprepared for glucose. Long-term night workers show higher metabolic and cardiovascular risk rising with years of exposure even after controlling for lifestyle. Forward-rotating rosters, bright light on shift with darkness after, and stable sleep schedules mitigate the harm, so rosters should be designed like drug doses with attention to timing and recovery.',
    keyTerms: ['circadian', 'glucose', 'exposure', 'forward-rotating', 'anchor', 'rosters'],
    minWords: 30,
  },
  {
    id: 'rtl-bees',
    audioId: 'lec-bees',
    skeleton: [
      'single-cause blame depends on the speaker',
      'stressors multiply rather than add',
      'single-factor bans disappoint',
      'recovery needs exposure cut plus habitat',
      'budget pollination like irrigation',
    ],
    reference:
      'Pollinator decline has no single cause: pesticides, habitat loss and disease each contribute, and they multiply rather than add, since a sub-lethal dose impairs navigation, poor forage makes each forager loss matter more, and pathogens spread faster in weakened colonies. Single-factor bans disappoint because exposure shifts to substitutes while the forage gap remains. Trials showing recovery combine reduced exposure with flower strips beside treated fields, so growers should budget pollination as a secured input like irrigation.',
    keyTerms: ['sub-lethal', 'forage', 'multiply', 'bans', 'flower strips', 'budget'],
    minWords: 30,
  },
  {
    id: 'rtl-recycling-myth',
    audioId: 'lec-recycling-myth',
    skeleton: [
      'rate measures bin entry, not new products',
      'three sources of the gap',
      'profitable streams subsidise the rest',
      'publish three rates, not one',
      'charge by recyclability',
    ],
    reference:
      'Celebrated recycling rates measure what enters the bin rather than what becomes a new product, and the gap comes from lightweight packaging counting fully, contamination condemning whole bales, and narrowed export markets with no domestic buyers. Aluminium, glass and clean cardboard recycle profitably and subsidise the rest, so a single blended rate conceals which materials justify collection. Councils should publish profitable, break-even and loss-making rates separately and charge producers by recyclability.',
    keyTerms: ['bin', 'contamination', 'bales', 'subsidise', 'blended', 'recyclability'],
    minWords: 30,
  },
  {
    id: 'rtl-drought',
    audioId: 'lec-drought',
    skeleton: [
      'shortage is decided by historical rules',
      'markets trade the easy volumes only',
      'binding constraint is trust in measurement',
      'meter first, trade second',
      'prices before meters is backwards',
    ],
    reference:
      'Who goes short in a drought is decided by historical water rights where early claimants take their full share and cities absorb the shortfall. Markets let holders sell unused water, but only easy trades between neighbours occur while large transfers are blocked by conveyance limits and fear of losing rights. The binding constraint is trust in measurement: basins that metered extraction before trading saw active markets while others saw litigation. Measure every abstraction and publish accounts before building the market.',
    keyTerms: ['historical', 'shortfall', 'conveyance', 'metered', 'litigation', 'sequence'],
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
      'The speaker argues night work harms health through circadian disruption rather than tiredness, since organs anticipate food timing and glucose at 3am meets an unprepared pancreas. Long-term night workers face higher metabolic and cardiovascular risk with exposure years. Forward rotation, bright light on shift with darkness after, and stable sleep schedules reduce harm, so rosters should be designed like drug doses.',
    keyTerms: ['circadian', 'glucose', 'exposure', 'forward-rotating', 'light', 'rosters'],
    minWords: 30,
  },
  {
    id: 'sst-bees',
    audioId: 'lec-bees',
    question:
      'Listen to the recording and write a summary of 50 to 70 words. Include the main idea and the most important supporting details. You have ten seconds during the recording to prepare your answer.',
    reference:
      'The speaker says pollinator decline has no single cause and stressors multiply: sub-lethal pesticides impair navigation, poor forage magnifies each loss, and pathogens spread faster in weak colonies. Single-factor bans disappoint as exposure shifts elsewhere. Recovery in trials combines lower exposure with flower strips beside treated fields, so growers should budget pollination as a secured input like irrigation.',
    keyTerms: ['multiply', 'navigation', 'forage', 'bans', 'flower strips', 'budget'],
    minWords: 30,
  },
  {
    id: 'sst-recycling-myth',
    audioId: 'lec-recycling-myth',
    question:
      'Listen to the recording and write a summary of 50 to 70 words. Include the main idea and the most important supporting details. You have ten seconds during the recording to prepare your answer.',
    reference:
      'The speaker argues recycling rates measure bin entry rather than new products, with the gap from lightweight packaging, contamination condemning whole bales, and lost export markets. Aluminium, glass and clean cardboard profitably subsidise the rest. Councils should publish three material-specific rates and charge producers by recyclability instead of celebrating one blended figure.',
    keyTerms: ['bin', 'contamination', 'bales', 'subsidise', 'blended', 'recyclability'],
    minWords: 30,
  },
  {
    id: 'sst-drought',
    audioId: 'lec-drought',
    question:
      'Listen to the recording and write a summary of 50 to 70 words. Include the main idea and the most important supporting details. You have ten seconds during the recording to prepare your answer.',
    reference:
      'The speaker says drought shortage is decided by historical water rights with cities absorbing shortfalls, and markets trade only easy neighbour volumes while large transfers stall on conveyance and rights fears. The binding constraint is metered trust: metered basins trade while unmetered ones litigate. Priorities should be measuring abstraction, publishing accounts, then building markets.',
    keyTerms: ['historical', 'shortfall', 'conveyance', 'metered', 'litigate', 'sequence'],
    minWords: 30,
  },
  {
    id: 'sst-deep-learning',
    audioId: 'lec-deep-learning',
    question:
      'Listen to the recording and write a summary of 50 to 70 words. Include the main idea and the most important supporting details. You have ten seconds during the recording to prepare your answer.',
    reference:
      'The speaker argues deep networks generalise because natural data are highly redundant, so imperfect fitting must prefer the simplest consistent explanation, and because overparameterised models land in flat basins with many equivalent solutions. Deliberately reducing dataset redundancy should therefore shrink the gap between training and test accuracy, as experiments confirm.',
    keyTerms: ['redundant', 'simplest', 'basin', 'flat', 'accuracy', 'parameters'],
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
