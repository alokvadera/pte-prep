import type { AudioScript, GroupDiscussionItem, RetellItem, SpokenSummaryItem } from './schema'

export const EXTRA_LECTURES_6: AudioScript[] = [
  {
    id: 'lec-climate-tipping',
    title: 'Tipping Points and Planetary Boundaries',
    kind: 'lecture',
    topic: 'Earth systems science',
    scene: 'An earth systems scientist lecturing at a climatology symposium.',
    speakers: [{ id: 's1', name: 'Dr Thorne', role: 'Climatologist', voiceHint: 'low' }],
    turns: [
      {
        speaker: 's1',
        text: 'When we model climate change, we often default to linear assumptions: increase greenhouse gas emissions by a given increment, and global mean surface temperatures rise proportionately. The real climate system, however, is densely populated with non-linear feedback loops known as tipping elements.',
      },
      {
        speaker: 's1',
        text: 'A tipping element is a large-scale component of the Earth system that can be committed to a qualitative state change by a small, localized perturbation. Consider the West Antarctic ice sheet. Once marine ice sheet instability is triggered, warm circumpolar deep water melts the ice shelves from below, causing the grounding line to retreat down reverse-sloping bedrock. Above a critical temperature anomaly, collapse becomes self-sustaining and irreversible on human timescales.',
      },
      {
        speaker: 's1',
        text: 'The second dangerous feature is cascading interactions between tipping elements. The loss of Arctic summer sea ice reduces surface albedo, which accelerates regional warming over the Greenland ice sheet. Freshwater discharge from melting Greenland glaciers slows the Atlantic Meridional Overturning Circulation. A weakened circulation shifts the tropical rain belt southward, precipitating severe drought across the Amazon basin and turning the rainforest from a carbon sink into a net carbon source.',
      },
      {
        speaker: 's1',
        text: 'These coupled dynamics imply that planetary boundaries cannot be evaluated in isolation. A risk threshold that appears safe when assessing a single component becomes untenable once trans-system cascades are accounted for. The fundamental challenge for planetary policy is not merely determining where the tipping thresholds lie, but acknowledging that we may cross the commitment point decades before the catastrophic physical transition becomes visually apparent. Thank you.',
      },
    ],
    keyTerms: [
      'linear assumptions',
      'tipping elements',
      'ice sheet instability',
      'cascading interactions',
      'albedo',
      'planetary boundaries',
    ],
  },
  {
    id: 'lec-quantum-computing',
    title: 'The Reality of Quantum Decoherence',
    kind: 'lecture',
    topic: 'Applied physics',
    scene: 'A theoretical physicist delivering an engineering faculty colloquium.',
    speakers: [{ id: 's1', name: 'Professor Vance', role: 'Physicist', voiceHint: 'mid' }],
    turns: [
      {
        speaker: 's1',
        text: 'Popular discussions of quantum computation typically focus on the exponential power of quantum superposition and entanglement. If a classical register of n bits can represent only one state at a time, a quantum register of n qubits can theoretically exist in a linear superposition of two to the power of n states simultaneously. What is less frequently advertised is that quantum information is extraordinarily fragile.',
      },
      {
        speaker: 's1',
        text: 'The fundamental engineering barrier is environmental decoherence. A quantum bit is not an abstract mathematical vector; it is a physical entity, such as a superconducting Josephson junction or a trapped ytterbium ion. The moment that physical system interacts with stray electromagnetic fields, thermal phonons, or cosmic radiation, the delicate relative phases between its probability amplitudes randomize. Quantum coherence collapses into classical thermodynamic noise within microseconds.',
      },
      {
        speaker: 's1',
        text: 'To preserve quantum states long enough to execute deep algorithmic circuits, researchers must implement quantum error correction. In classical computing, a bit flip is corrected by simple majority voting with three physical bits. In quantum computing, the no-cloning theorem strictly forbids copying an unknown quantum state, and direct projective measurement destroys the very superposition you wish to protect.',
      },
      {
        speaker: 's1',
        text: 'The solution is topological code architecture, such as the surface code, which entangles hundreds or thousands of noisy physical qubits to encode a single, fault-tolerant logical qubit. Until the ratio of physical qubits to logical qubits drops by orders of magnitude, useful fault-tolerant quantum computation remains a formidable materials science endeavor rather than a mere scaling exercise. Thank you.',
      },
    ],
    keyTerms: [
      'superposition',
      'qubits',
      'environmental decoherence',
      'quantum error correction',
      'no-cloning theorem',
      'logical qubit',
    ],
  },
  {
    id: 'lec-linguistic-diversity',
    title: 'Why Languages Die and What Dies With Them',
    kind: 'lecture',
    topic: 'Anthropological linguistics',
    scene: 'A field linguist addressing an academic conference on cultural conservation.',
    speakers: [{ id: 's1', name: 'Dr Aris', role: 'Linguist', voiceHint: 'mid-high' }],
    turns: [
      {
        speaker: 's1',
        text: 'Of the approximately seven thousand languages currently spoken on Earth, historical linguists estimate that over half will fall silent before the close of this century. This linguistic attrition is not a natural evolutionary pruning; it is the consequence of aggressive state assimilation policies, demographic displacement, and digital hegemony that privileges a tiny handful of dominant global tongues.',
      },
      {
        speaker: 's1',
        text: 'When an indigenous language disappears, the loss extends far beyond vocabulary and phonetics. Languages encapsulate millennia of accumulated empirical ethnobotanical and ecological knowledge that exists nowhere else. In the Amazonian basin and the northern Australian territories, traditional languages contain nuanced classifications for pharmaceutical plants, microclimate shifts, and animal migration patterns that modern taxonomies fail to capture.',
      },
      {
        speaker: 's1',
        text: 'Furthermore, grammatical diversity reveals the cognitive versatility of the human mind. Languages with evidential morphology require speakers to conjugate verbs with affixes indicating how they acquired their knowledge—whether through direct sensory perception, inference, hearsay, or dream. In speakers of these languages, cognitive habits of epistemic verification and source attribution are embedded into the grammar itself.',
      },
      {
        speaker: 's1',
        text: 'Linguistic revitalization is therefore not an exercise in sentimental antiquarianism; it is an urgent defense of human cognitive and environmental heritage. When communities record oral corpora, revitalize intergenerational transmission, and digitize ancestral grammars, they preserve alternative ways of conceptualizing human existence within a fragile biosphere. Thank you.',
      },
    ],
    keyTerms: [
      'linguistic attrition',
      'ethnobotanical knowledge',
      'evidential morphology',
      'epistemic verification',
      'revitalization',
      'cognitive heritage',
    ],
  },
]

export const EXTRA_GROUP_DISCUSSIONS_5: AudioScript[] = [
  {
    id: 'gd-space-exploration',
    title: 'Should public funds subsidize deep space exploration?',
    kind: 'group',
    topic: 'Science policy',
    scene: 'A roundtable debate on the allocation of government science expenditure.',
    speakers: [
      { id: 'a', name: 'Chair', role: 'Moderator', voiceHint: 'mid' },
      { id: 'b', name: 'Dr Solano', role: 'Astrophysicist', voiceHint: 'mid-high' },
      { id: 'c', name: "Mr O'Connor", role: 'Public economist', voiceHint: 'low' },
      { id: 'd', name: 'Ms Lindqvist', role: 'Climate activist', voiceHint: 'high' },
    ],
    turns: [
      {
        speaker: 'a',
        text: 'Welcome everyone. Today we are debating whether national governments should continue funding multi-billion dollar robotic and crewed deep space missions while terrestrial climate emergencies remain underfunded. Dr Solano, please outline the case for space expenditure.',
      },
      {
        speaker: 'b',
        text: 'Thank you. The common framing of space exploration versus Earth stewardship is fundamentally mistaken. The very tools we use to diagnose terrestrial climate change—satellite remote sensing, atmospheric spectroscopic sensors, solar radiation monitoring—were developed directly through space mission investments. Furthermore, deep space research drives fundamental breakthroughs in materials science, closed-loop water purification, and autonomous robotics that directly benefit terrestrial sustainability.',
      },
      {
        speaker: 'c',
        text: 'I must challenge the economic efficiency of that argument. Serendipitous technological spin-offs certainly occur, but in public economics, funding mission A in hopes of generating accidental benefits for mission B is an extraordinarily inefficient allocation of scarce public capital. If your goal is solar efficiency or water purification, investing directly in terrestrial environmental R&D delivers five to ten times the return on investment compared to subsidizing lunar landers.',
      },
      {
        speaker: 'd',
        text: 'I agree with the economist regarding opportunity costs, but my primary concern is narrative escapism. Promoting deep space colonisation fosters a dangerous psychological delusion that Earth is a disposable cradle from which humanity can migrate once we exhaust our planetary boundaries. There is no viable second home in our solar system; every dollar spent romanticizing Mars colonization weakens public commitment to protecting our singular biosphere.',
      },
      {
        speaker: 'b',
        text: 'No credible scientist promotes planetary abandonment as policy. Space science is about understanding fundamental cosmic physics and protecting humanity against long-term existential threats, such as near-Earth asteroid impacts. A civilization that ceases to look beyond its horizon stagnates intellectually and technologically.',
      },
      {
        speaker: 'd',
        text: 'We are not opposing pure astrophysics or satellite monitoring; we are challenging vanity crewed exploration budgets that consume billions for geopolitical prestige while vulnerable human populations face unprecedented heat and drought crises today.',
      },
    ],
    keyTerms: [
      'space exploration',
      'satellite monitoring',
      'terrestrial sustainability',
      'opportunity costs',
      'narrative escapism',
      'allocation of capital',
    ],
  },
  {
    id: 'gd-renewable-subsidies',
    title: 'Should feed-in tariffs be phased out for mature renewables?',
    kind: 'group',
    topic: 'Energy economics',
    scene: 'An energy regulator panel reviewing wholesale power subsidies.',
    speakers: [
      { id: 'a', name: 'Chair', role: 'Moderator', voiceHint: 'mid' },
      { id: 'b', name: 'Mr Brandt', role: 'Grid systems engineer', voiceHint: 'low' },
      { id: 'c', name: 'Ms Tanaka', role: 'Solar developer', voiceHint: 'mid-high' },
      { id: 'd', name: 'Dr Meyer', role: 'Consumer advocacy economist', voiceHint: 'high' },
    ],
    turns: [
      {
        speaker: 'a',
        text: 'The question for our panel is whether feed-in tariffs and guaranteed wholesale price floors for mature wind and solar installations should be phased out in favor of merchant market competition. Mr Brandt, what is the grid operator perspective?',
      },
      {
        speaker: 'b',
        text: 'From an engineering standpoint, fixed feed-in tariffs have become counterproductive. They incentivize developers to inject electricity during hours of maximum solar irradiance regardless of actual grid demand, resulting in negative wholesale prices and severe curtailment waste. We need market pricing to force developers to co-locate battery storage and dispatch power when the grid actually needs it.',
      },
      {
        speaker: 'c',
        text: 'I understand the engineering pressure, but abruptly eliminating revenue certainty will freeze project financing. Wind and solar projects are capital-intensive with zero marginal fuel costs. Banks lend against predictable long-term contracts; if you expose developers entirely to volatile merchant spot markets, financing costs will skyrocket, slowing down the pace of national decarbonization just when we need to accelerate.',
      },
      {
        speaker: 'd',
        text: 'As consumer representatives, we cannot ignore who pays for those guaranteed tariffs. Surcharges on domestic electricity bills have risen by forty percent over the past decade to fund legacy subsidies for commercial developers who are now generating record returns. When wind and solar are the cheapest forms of generation on the planet, continuing public subsidies transfers wealth from low-income households to renewable infrastructure funds.',
      },
      {
        speaker: 'c',
        text: 'The answer is not a sudden cliff edge, but transitioning to two-sided contracts for difference. That protects consumers when market prices are high by clawing back developer profits, while protecting developers against market collapse.',
      },
      {
        speaker: 'b',
        text: 'Contracts for difference work well, provided they incorporate locational marginal pricing and storage incentives so that intermittent generation does not overwhelm transmission bottlenecks.',
      },
    ],
    keyTerms: [
      'feed-in tariffs',
      'grid demand',
      'curtailment',
      'contracts for difference',
      'financing certainty',
      'consumer surcharges',
    ],
  },
  {
    id: 'gd-remote-education',
    title: 'Is fully remote higher education pedagogically sound?',
    kind: 'group',
    topic: 'Higher education policy',
    scene: 'A university senate committee evaluating post-pandemic degree programs.',
    speakers: [
      { id: 'a', name: 'Chair', role: 'Moderator', voiceHint: 'mid' },
      { id: 'b', name: 'Professor Kim', role: 'Academic dean', voiceHint: 'mid-high' },
      { id: 'c', name: 'Mr Evans', role: 'Adult distance student', voiceHint: 'low' },
      { id: 'd', name: 'Dr Gallagher', role: 'Educational psychologist', voiceHint: 'high' },
    ],
    turns: [
      {
        speaker: 'a',
        text: 'Our committee is evaluating whether our university should expand fully asynchronous remote degree programs across our humanities and social sciences faculties. Professor Kim, would you begin?',
      },
      {
        speaker: 'b',
        text: 'Thank you. The institutional appeal of asynchronous remote degrees is obvious: it scales effortlessly, removes geographical barriers, and diversifies university revenue without requiring physical capital investment. The pedagogical question, however, is whether asynchronous delivery can foster the rigorous discursive debate and critical inquiry that define university education.',
      },
      {
        speaker: 'c',
        text: 'From the perspective of working professionals and parents, remote education is not a secondary substitute; it is the only avenue available. I work full-time in healthcare; commuting to a physical campus for daytime seminars is impossible. Remote learning allowed me to complete my degree at my own pace with recorded lectures and digital discussion boards. Denying fully remote pathways effectively excludes mature and low-income students.',
      },
      {
        speaker: 'd',
        text: 'We must examine student retention and cognitive outcomes. Across national studies, completion rates for fully online undergraduate degrees are nearly thirty percentage points lower than in-person programs. Higher education is deeply relational; the informal peer collaboration, spontaneous mentorship, and socio-emotional accountability of a campus environment cannot be replicated by pre-recorded videos and automated quizzes.',
      },
      {
        speaker: 'b',
        text: 'Dr Gallagher highlights the exact tension. Remote delivery democratizes access for highly disciplined adult learners like Mr Evans, but it often fails younger undergraduates who require structured interpersonal support.',
      },
      {
        speaker: 'c',
        text: 'Then the solution is hybrid flexibility and better structured asynchronous mentorship, not abandoning remote degrees altogether and forcing everyone back into the nineteenth-century lecture hall.',
      },
    ],
    keyTerms: [
      'remote education',
      'pedagogical soundness',
      'accessibility',
      'retention rates',
      'relational learning',
      'asynchronous delivery',
    ],
  },
]

export const EXTRA_RETELL_ITEMS_6: RetellItem[] = [
  {
    id: 'rtl-climate-tipping',
    audioId: 'lec-climate-tipping',
    skeleton: [
      'linear assumptions vs tipping elements',
      'West Antarctic ice sheet instability',
      'cascading interactions between arctic and amazon',
      'planetary boundaries cannot be isolated',
    ],
    reference:
      'Climate change operates through non-linear feedback loops known as tipping elements rather than simple linear trends. A qualitative shift in one component, such as West Antarctic ice sheet instability, can become self-sustaining. Furthermore, tipping elements cascade: Arctic sea ice loss accelerates Greenland melting, slowing the Atlantic circulation and triggering Amazon drought. Planetary boundaries cannot be evaluated in isolation.',
    keyTerms: [
      'linear',
      'tipping elements',
      'feedback loops',
      'ice sheet',
      'cascade',
      'cascading',
      'boundaries',
    ],
    minWords: 30,
  },
  {
    id: 'rtl-quantum-computing',
    audioId: 'lec-quantum-computing',
    skeleton: [
      'superposition and qubit power',
      'environmental decoherence destroys coherence',
      'quantum error correction cannot copy states',
      'topological surface code architecture',
    ],
    reference:
      'While quantum superposition enables exponential representation across qubits, quantum states are exceptionally fragile and collapse under environmental decoherence into thermodynamic noise. Because the no-cloning theorem prevents copying quantum states, simple classical redundancy fails. Quantum error correction must implement topological codes that entangle thousands of physical qubits to form a single fault-tolerant logical qubit.',
    keyTerms: [
      'superposition',
      'qubits',
      'decoherence',
      'noise',
      'no-cloning',
      'error correction',
      'logical qubit',
    ],
    minWords: 30,
  },
  {
    id: 'rtl-linguistic-diversity',
    audioId: 'lec-linguistic-diversity',
    skeleton: [
      'half of world languages dying this century',
      'loss of empirical ethnobotanical knowledge',
      'evidential morphology and epistemic verification',
      'revitalization preserves cognitive diversity',
    ],
    reference:
      'Over half of all human languages are projected to disappear by the end of the century due to state assimilation and digital hegemony. Language death extinguishes unique empirical ethnobotanical and ecological knowledge, as well as distinct cognitive habits like evidential morphology that embed epistemic verification into grammar. Language revitalization preserves irreplaceable human cognitive and environmental heritage.',
    keyTerms: [
      'languages',
      'disappear',
      'ethnobotanical',
      'knowledge',
      'evidential',
      'morphology',
      'revitalization',
      'heritage',
    ],
    minWords: 30,
  },
]

export const EXTRA_GROUP_DISCUSSION_ITEMS_5: GroupDiscussionItem[] = [
  {
    id: 'sgd-space-exploration',
    audioId: 'gd-space-exploration',
    question:
      "Listen to the discussion and summarise it in between 40 and 90 seconds. Report the group's overall stance, the main points each speaker made, and where they disagreed.",
    reference:
      'The panel debates public spending on deep space missions versus climate needs. The astrophysicist argues space research invented vital terrestrial climate sensors and robotics, the economist asserts that indirect spin-offs are an inefficient allocation of capital compared to direct green investment, and the activist warns that space exploration promotes dangerous narrative escapism while wasting billions on prestige vanity projects.',
    keyTerms: [
      'space missions',
      'climate sensors',
      'spin-offs',
      'allocation of capital',
      'escapism',
      'prestige',
    ],
    minWords: 40,
  },
  {
    id: 'sgd-renewable-subsidies',
    audioId: 'gd-renewable-subsidies',
    question:
      "Listen to the discussion and summarise it in between 40 and 90 seconds. Report the group's overall stance, the main points each speaker made, and where they disagreed.",
    reference:
      'The panel evaluates whether to phase out feed-in tariffs for mature renewables. The grid engineer argues fixed tariffs encourage overgeneration and grid curtailment, the solar developer contends revenue certainty is essential for project financing, and the consumer economist notes consumer surcharges on bills unfairly transfer wealth to profitable funds. They consider two-sided contracts for difference with storage incentives as a compromise.',
    keyTerms: [
      'feed-in tariffs',
      'curtailment',
      'revenue certainty',
      'consumer surcharges',
      'contracts for difference',
      'storage',
    ],
    minWords: 40,
  },
  {
    id: 'sgd-remote-education',
    audioId: 'gd-remote-education',
    question:
      "Listen to the discussion and summarise it in between 40 and 90 seconds. Report the group's overall stance, the main points each speaker made, and where they disagreed.",
    reference:
      'The panel examines the pedagogical soundness of fully remote asynchronous degree programs. The dean notes institutional scalability, the distance learner defends remote study for educational accessibility, and the psychologist highlights low retention rates and the loss of interpersonal accountability on campus. They propose hybrid flexibility and structured mentorship rather than total abandonment.',
    keyTerms: [
      'remote degrees',
      'asynchronous',
      'accessibility',
      'retention rates',
      'interpersonal accountability',
      'mentorship',
    ],
    minWords: 40,
  },
]

export const EXTRA_SPOKEN_SUMMARY_ITEMS_5: SpokenSummaryItem[] = [
  {
    id: 'sst-antibiotic',
    audioId: 'lec-antibiotic',
    question:
      'Listen to the recording and write a summary of 50 to 70 words. Include the main idea and the most important supporting details.',
    reference:
      'The lecture explains that antibiotic resistance is an inevitable biological consequence of selection pressure. Bacteria develop resistance through genetic mutations, plasmid horizontal gene transfer, and environmental reservoirs. Because antibiotic discovery has stalled and finite classes of treatment remain, overprescribing imposes severe external costs, requiring strict global stewardship until novel antimicrobial treatments are developed.',
    keyTerms: [
      'antibiotic resistance',
      'selection pressure',
      'mutations',
      'horizontal transfer',
      'finite classes',
      'stewardship',
    ],
    minWords: 30,
  },
  {
    id: 'sst-handwriting',
    audioId: 'lc-handwriting',
    question:
      'Listen to the recording and write a summary of 50 to 70 words. Include the main idea and the most important supporting details.',
    reference:
      'The speaker argues that removing cursive handwriting from schools is a costly mistake. Cursive engages a continuous motor program that reinforces grapheme segmentation and phonics boundaries. Furthermore, cursive provides superior handwriting speed in high-stakes examinations, preventing students from falling behind, provided instructors teach proper stroke form systematically.',
    keyTerms: [
      'cursive handwriting',
      'motor program',
      'segmentation',
      'grapheme',
      'writing speed',
      'examinations',
    ],
    minWords: 30,
  },
  {
    id: 'sst-sleep',
    audioId: 'lec-sleep',
    question:
      'Listen to the recording and write a summary of 50 to 70 words. Include the main idea and the most important supporting details.',
    reference:
      'The lecture challenges traditional theories that sleep functions primarily for cellular restoration or memory consolidation. Observing that octopuses sleep despite lacking vertebrate brain structures suggests sleep is fundamentally an energy-saving strategy. Organisms temporarily reduce the metabolic expense of continuous readiness, accepting vulnerability whenever ecological and safety conditions permit.',
    keyTerms: [
      'sleep function',
      'cellular restoration',
      'octopuses',
      'metabolic expense',
      'readiness',
      'vulnerability',
    ],
    minWords: 30,
  },
  {
    id: 'sst-habits',
    audioId: 'lec-habits',
    question:
      'Listen to the recording and write a summary of 50 to 70 words. Include the main idea and the most important supporting details.',
    reference:
      'The lecture explains why behavioral habits resist conscious change. Habit loops become automated through repetition and are triggered by environmental cues rather than conscious intention. Effective behavior modification therefore requires restructuring environmental cues and habits rather than relying upon conscious willpower.',
    keyTerms: ['habits', 'routine', 'automatic', 'environmental cues', 'willpower', 'context'],
    minWords: 30,
  },
  {
    id: 'sst-price-signals',
    audioId: 'lec-price-signals',
    question:
      'Listen to the recording and write a summary of 50 to 70 words. Include the main idea and the most important supporting details.',
    reference:
      'The speaker explains that market price signals coordinate complex economic activity by condensing dispersed knowledge into a single metric. Price movements signal changing scarcity, guiding decentralized production and aligning incentives without centralized bureaucratic command. Distorting price signals through externalities leads to resource misallocation and supply shortages.',
    keyTerms: [
      'price signals',
      'scarcity',
      'dispersed knowledge',
      'incentives',
      'externality',
      'coordinates',
    ],
    minWords: 30,
  },
  {
    id: 'sst-silk-road',
    audioId: 'lec-silk-road',
    question:
      'Listen to the recording and write a summary of 50 to 70 words. Include the main idea and the most important supporting details.',
    reference:
      'The lecture examines why overland Silk Road routes faded during the late medieval era. The network of caravan routes was outcompeted by maritime shipping, which lowered the cost of moving cargo. When ocean transit emerged as a cheaper substitute, overland trade collapsed under high fixed costs.',
    keyTerms: [
      'Silk Road',
      'caravan',
      'overland trade',
      'maritime shipping',
      'substitute',
      'fixed costs',
    ],
    minWords: 30,
  },
  {
    id: 'sst-precedent',
    audioId: 'lec-precedent',
    question:
      'Listen to the recording and write a summary of 50 to 70 words. Include the main idea and the most important supporting details.',
    reference:
      'The speaker explores the legal doctrine of judicial precedent in common law systems. Precedent provides commercial predictability, treats equivalent legal disputes consistently, and constrains judicial discretion. However, rigid adherence risks perpetuating outdated societal norms, requiring appellate courts to balance legal stability with flexible doctrinal evolution.',
    keyTerms: [
      'judicial precedent',
      'common law',
      'predictability',
      'judicial discretion',
      'legal stability',
      'evolution',
    ],
    minWords: 30,
  },
  {
    id: 'sst-climate-tipping',
    audioId: 'lec-climate-tipping',
    question:
      'Listen to the recording and write a summary of 50 to 70 words. Include the main idea and the most important supporting details.',
    reference:
      'The lecture explains that climate change involves non-linear tipping elements rather than gradual trends. Critical thresholds, such as West Antarctic ice sheet instability, trigger irreversible state changes. Furthermore, cascading feedback loops connect polar ice melt, Atlantic circulation, and Amazon rainforest dieback, demonstrating that planetary boundaries cannot be managed in isolation.',
    keyTerms: [
      'climate change',
      'tipping elements',
      'ice sheet instability',
      'cascading feedback',
      'Atlantic circulation',
      'planetary boundaries',
    ],
    minWords: 30,
  },
  {
    id: 'sst-quantum-computing',
    audioId: 'lec-quantum-computing',
    question:
      'Listen to the recording and write a summary of 50 to 70 words. Include the main idea and the most important supporting details.',
    reference:
      'The speaker explains that quantum computation is severely constrained by environmental decoherence, which collapses fragile superposition into thermodynamic noise within microseconds. Because the no-cloning theorem prevents copying quantum states, simple classical redundancy fails. Fault-tolerant computation requires topological error correction codes that entangle thousands of physical qubits per logical qubit.',
    keyTerms: [
      'quantum computing',
      'decoherence',
      'superposition',
      'no-cloning theorem',
      'error correction',
      'logical qubit',
    ],
    minWords: 30,
  },
  {
    id: 'sst-linguistic-diversity',
    audioId: 'lec-linguistic-diversity',
    question:
      'Listen to the recording and write a summary of 50 to 70 words. Include the main idea and the most important supporting details.',
    reference:
      'The lecture warns that language extinction threatens over half of world languages this century due to state assimilation and digital dominance. Language loss obliterates irreplaceable ethnobotanical knowledge and diverse cognitive structures, such as evidential morphology that embeds source verification into speech. Revitalizing indigenous languages is vital for preserving human intellectual and ecological heritage.',
    keyTerms: [
      'language extinction',
      'ethnobotanical knowledge',
      'evidential morphology',
      'source verification',
      'revitalization',
      'heritage',
    ],
    minWords: 30,
  },
]
