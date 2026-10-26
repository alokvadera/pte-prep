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
        text: 'Climate models track gradual responses to greenhouse gas emissions, but the Earth system also contains components that may change rapidly after crossing a threshold. Researchers call these tipping elements, although the location and timing of many thresholds remain uncertain.',
      },
      {
        speaker: 's1',
        text: 'A tipping element is a large-scale part of the Earth system that may undergo substantial change once warming crosses a threshold. The West Antarctic ice sheet is one concern: warm ocean water can thin ice shelves from below, allowing the grounding line to retreat over bedrock that slopes inland. The extent and pace of future retreat are uncertain, and the process could continue for centuries even if warming stopped.',
      },
      {
        speaker: 's1',
        text: 'A further concern is that changes in one component may affect others. Sea ice loss reduces the amount of sunlight reflected back to space, while freshwater from Greenland melt may influence North Atlantic circulation. Researchers are studying these links, but the size, timing and downstream effects are not settled; they do not support a simple prediction of a particular Amazon drought.',
      },
      {
        speaker: 's1',
        text: 'These possible interactions are one reason Earth-system risks should be studied together. A threshold estimate for one component may change when other processes are included, and some consequences can unfold long after the initial warming. The policy challenge is to reduce risk while being clear about which pathways are well established and which remain uncertain. Thank you.',
      },
    ],
    keyTerms: [
      'threshold',
      'tipping elements',
      'West Antarctic ice sheet',
      'grounding line',
      'North Atlantic circulation',
      'uncertain',
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
        text: 'Popular discussions of quantum computing often say that n qubits can represent amplitudes across two to the power of n basis states. That does not mean a machine can read out all those answers at once: useful algorithms rely on interference to make some outcomes more likely than others. The information is also fragile and must be protected from noise.',
      },
      {
        speaker: 's1',
        text: 'A major engineering challenge is environmental decoherence. A qubit is stored in a physical system, such as a superconducting circuit or a trapped ion. Interactions with the environment can disturb the relative phases that make a quantum state useful. How quickly this happens depends on the hardware and operating conditions, so coherence times vary across systems.',
      },
      {
        speaker: 's1',
        text: 'Researchers use quantum error correction to protect information during long computations. Unlike a classical repetition code, a quantum code cannot make independent copies of an unknown state: the no-cloning theorem rules that out. Instead, a code distributes information across several physical qubits and measures error syndromes without directly measuring the encoded logical state.',
      },
      {
        speaker: 's1',
        text: 'The surface code is one leading approach, but it is not the only code family. Its physical-qubit overhead depends on the target error rate, the hardware and the computation being protected; other codes may trade connectivity or decoding complexity for lower overhead. Experiments have demonstrated small logical qubits, while large-scale fault-tolerant computation remains an engineering challenge. Thank you.',
      },
    ],
    keyTerms: [
      'interference',
      'qubits',
      'environmental decoherence',
      'quantum error correction',
      'no-cloning theorem',
      'surface code',
      'logical qubits',
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
        text: 'Roughly seven thousand languages are spoken today, though counts depend on how languages and dialects are distinguished. Projections differ: some warn that many languages may disappear or become endangered this century. Language shift can follow from schooling and public services being offered in dominant languages, displacement, economic pressure and reduced opportunities to use a language across generations; digital access is one factor among many.',
      },
      {
        speaker: 's1',
        text: 'When a language is no longer passed on, communities can lose access to knowledge expressed through it, including local names for plants, animals and places. Such knowledge is not automatically unique to one language, and it can also be recorded or shared in other ways. Documentation and community-led revitalisation can support its continued use alongside the language itself.',
      },
      {
        speaker: 's1',
        text: 'Some languages mark the source of information grammatically, for example whether a speaker witnessed an event or learned of it indirectly. These evidential systems are useful for studying how languages express knowledge, but they do not force speakers to verify claims or determine how those speakers think.',
      },
      {
        speaker: 's1',
        text: 'Language revitalisation can help communities maintain intergenerational ties, cultural practices and knowledge expressed through their language. Recording, teaching and creating digital resources can all contribute, when communities choose those approaches. The work is most effective when speakers guide it and have opportunities to use the language in everyday life. Thank you.',
      },
    ],
    keyTerms: [
      'language shift',
      'intergenerational',
      'local names',
      'evidential systems',
      'information source',
      'community-led revitalisation',
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
        text: 'Thank you. Space exploration and Earth stewardship are not necessarily opposites. Satellite programmes provide remote-sensing data used to study climate, and space research can also produce technologies with uses on Earth. Those benefits do not prove that every mission is worthwhile, but they should be included when comparing the costs and public value of different programmes.',
      },
      {
        speaker: 'c',
        text: 'I must challenge the economic efficiency of that argument. Useful spin-offs can occur, but they are difficult to predict and should not be assumed to justify a mission. If the goal is better solar efficiency or water purification, direct investment in those areas may be a more reliable way to pursue it. Public budgets have opportunity costs, so each programme needs to be assessed on its expected benefits.',
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
      'satellite programmes',
      'remote-sensing data',
      'opportunity costs',
      'narrative escapism',
      'crewed exploration',
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
        text: 'From an engineering standpoint, fixed feed-in tariffs can create challenges when payments do not reflect where and when electricity is most valuable. High renewable output can coincide with low demand, contributing to low or negative wholesale prices and curtailment in some markets. Better locational and time-based signals, alongside storage and transmission, can help align generation with grid needs.',
      },
      {
        speaker: 'c',
        text: 'I understand the engineering pressure, but abruptly eliminating revenue certainty will freeze project financing. Wind and solar projects are capital-intensive with zero marginal fuel costs. Banks lend against predictable long-term contracts; if you expose developers entirely to volatile merchant spot markets, financing costs will skyrocket, slowing down the pace of national decarbonization just when we need to accelerate.',
      },
      {
        speaker: 'd',
        text: 'As consumer representatives, we cannot ignore who pays for those guaranteed tariffs. The effect on household bills varies by market and by programme design, and support can benefit consumers as well as developers. I still worry that poorly targeted subsidies may place a disproportionate burden on lower-income households, especially when payments continue after a technology has become more competitive.',
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
        text: 'We must examine student retention and learning outcomes. Some comparisons find lower completion rates in online programmes, but the size of the gap varies with student population, course design and support. Higher education is also relational: peer collaboration and mentorship can be harder to sustain in a fully asynchronous course, so recorded lectures and automated quizzes need to be paired with meaningful interaction.',
      },
      {
        speaker: 'b',
        text: 'Dr Gallagher highlights the tension. Remote delivery can widen access for some adult learners, while students may differ in how much structure and interaction they need. Course design and support can affect those experiences.',
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
      'threshold changes alongside gradual climate responses',
      'West Antarctic ice sheet instability',
      'possible links among sea ice, Greenland and ocean circulation',
      'pathways and timing remain uncertain',
    ],
    reference:
      'The lecture explains that climate change includes gradual responses as well as possible threshold changes in Earth-system components. It uses the West Antarctic ice sheet as an example and describes possible links among sea ice, Greenland melt and ocean circulation, while stressing that the scale and timing of these effects remain uncertain. The speaker argues that connected risks should be studied together.',
    keyTerms: [
      'threshold',
      'tipping elements',
      'West Antarctic ice sheet',
      'grounding line',
      'North Atlantic circulation',
      'uncertain',
    ],
    minWords: 30,
  },
  {
    id: 'rtl-quantum-computing',
    audioId: 'lec-quantum-computing',
    skeleton: [
      'amplitudes across basis states, with algorithmic limits',
      'environmental noise disturbs quantum states',
      'error syndromes protect encoded information',
      'surface code is one approach; overhead varies',
    ],
    reference:
      'The lecture explains that qubits can represent amplitudes across many basis states, but measurement does not reveal every answer and useful algorithms rely on interference. Environmental noise can disturb quantum states. Because unknown quantum states cannot simply be copied, error-correction codes distribute information across physical qubits and detect error syndromes. The surface code is one approach, and its overhead varies with hardware and the task.',
    keyTerms: [
      'interference',
      'qubits',
      'decoherence',
      'noise',
      'no-cloning',
      'error correction',
      'surface code',
      'logical qubits',
    ],
    minWords: 30,
  },
  {
    id: 'rtl-linguistic-diversity',
    audioId: 'lec-linguistic-diversity',
    skeleton: [
      'language-loss projections vary; causes include social and policy pressures',
      'language can carry local ecological knowledge',
      'evidential grammar marks information sources',
      'community-led revitalization and everyday use',
    ],
    reference:
      'The lecture describes concern that many of the world’s languages may disappear or become endangered, while noting that projections vary. Language shift can reflect policy, displacement and reduced opportunities for intergenerational use. Languages may carry local ecological knowledge, and some mark information sources grammatically. The speaker supports community-led documentation and revitalisation that creates opportunities for everyday use.',
    keyTerms: [
      'languages',
      'language shift',
      'intergenerational',
      'local ecological knowledge',
      'information source',
      'community-led revitalisation',
      'everyday use',
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
      'The panel debates public spending on space exploration alongside climate priorities. The astrophysicist points to climate data from satellite programmes and possible technology spin-offs, while the economist argues that expected benefits should be compared with direct investment in terrestrial research. The activist questions crewed exploration budgets and warns that talk of colonising other planets can distract from protecting Earth. They disagree on how to weigh scientific value, opportunity cost and public priorities.',
    keyTerms: [
      'space exploration',
      'satellite programmes',
      'remote-sensing data',
      'spin-offs',
      'opportunity costs',
      'crew exploration',
    ],
    minWords: 40,
  },
  {
    id: 'sgd-renewable-subsidies',
    audioId: 'gd-renewable-subsidies',
    question:
      "Listen to the discussion and summarise it in between 40 and 90 seconds. Report the group's overall stance, the main points each speaker made, and where they disagreed.",
    reference:
      'The panel discusses whether to change support for mature renewable projects. The engineer says payment design should reflect when and where electricity is valuable; the developer argues predictable contracts help secure financing; and the consumer economist worries that poorly targeted support can burden households. They discuss two-sided contracts for difference, storage and better grid signals as possible parts of a transition.',
    keyTerms: [
      'feed-in tariffs',
      'curtailment',
      'revenue certainty',
      'household bills',
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
      'The panel examines fully asynchronous degree programmes. The dean notes their potential to widen access and scale provision; the distance learner describes remote study as necessary alongside full-time work; and the psychologist says online completion comparisons vary but that asynchronous courses need meaningful interaction and support. They favour flexibility and structured mentorship over abandoning remote study.',
    keyTerms: [
      'remote degrees',
      'asynchronous',
      'accessibility',
      'completion rates',
      'course design',
      'interaction',
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
      'The lecture explains that antibiotic exposure can select for resistant bacteria, while resistance can also spread through mutation, horizontal gene transfer and movement among people, animals and the environment. The mechanisms and rates vary. Because the antibacterial development pipeline does not meet all public-health needs, the speaker argues for continued research, careful prescribing, infection prevention, surveillance and stewardship across human and animal health.',
    keyTerms: [
      'antibiotic resistance',
      'selection pressure',
      'mutations',
      'horizontal transfer',
      'development pipeline',
      'infection prevention',
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
      'The lecture explains that the Silk Roads were connected land and sea routes, with merchants often travelling in stages. Costly overland freight favoured compact, high-value goods. The Cape route gave European merchants a more direct link to Indian Ocean trade and shifted some commercial patterns, but did not end the wider networks. Political conditions, demand and transport costs all affected route use.',
    keyTerms: [
      'Silk Road',
      'intermediaries',
      'compact goods',
      'maritime networks',
      'Cape route',
      'Indian Ocean trade',
      'route use',
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
      'The lecture explains that climate change includes gradual responses as well as possible threshold changes in Earth-system components. It uses the West Antarctic ice sheet as an example and describes possible links among sea ice, Greenland melt and ocean circulation, while stressing that the scale and timing of these effects remain uncertain. The speaker argues that connected risks should be studied together.',
    keyTerms: [
      'threshold',
      'tipping elements',
      'West Antarctic ice sheet',
      'sea ice',
      'North Atlantic circulation',
      'uncertain',
    ],
    minWords: 30,
  },
  {
    id: 'sst-quantum-computing',
    audioId: 'lec-quantum-computing',
    question:
      'Listen to the recording and write a summary of 50 to 70 words. Include the main idea and the most important supporting details.',
    reference:
      'The speaker explains that qubits can represent amplitudes across many basis states, but measurement does not reveal every answer and useful algorithms rely on interference. Environmental noise can disturb quantum states. Because unknown quantum states cannot simply be copied, error-correction codes distribute information across physical qubits and detect error syndromes. The surface code is one approach, and its overhead varies with hardware and the task.',
    keyTerms: [
      'qubits',
      'decoherence',
      'interference',
      'no-cloning theorem',
      'error syndromes',
      'surface code',
      'logical qubits',
    ],
    minWords: 30,
  },
  {
    id: 'sst-linguistic-diversity',
    audioId: 'lec-linguistic-diversity',
    question:
      'Listen to the recording and write a summary of 50 to 70 words. Include the main idea and the most important supporting details.',
    reference:
      'The lecture describes concern that many languages may disappear or become endangered, while noting that projections vary. Language shift can reflect policy, displacement and reduced opportunities for intergenerational use. Languages may carry local ecological knowledge, and some mark information sources grammatically. The speaker supports community-led documentation and revitalisation that creates opportunities for everyday use.',
    keyTerms: [
      'languages',
      'language shift',
      'intergenerational',
      'local ecological knowledge',
      'information source',
      'community-led revitalisation',
    ],
    minWords: 30,
  },
]
