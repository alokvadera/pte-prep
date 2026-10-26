import type { Passage } from './schema'

export const EXTRA_PASSAGES_7: Passage[] = [
  {
    id: 'ocean-acidification',
    title: 'Ocean Acidification and Marine Carbonates',
    topic: 'Marine biogeochemistry',
    level: 'C1',
    paragraphs: [
      'The chemistry of seawater is governed by an equilibrium between dissolved carbon dioxide, carbonic acid, and carbonate ions. As anthropogenic emissions increase atmospheric concentrations, the oceans absorb roughly one quarter of the surplus gas. When carbon dioxide dissolves, it forms carbonic acid, which rapidly dissociates and consumes free carbonate ions. This chemical shift lowers the saturation horizon of aragonite, the mineral form of calcium carbonate required by calcifying organisms.',
      'The biological impact is not uniform across marine taxa. Organisms with high metabolic turnover, such as pelagic fish, can compensate for internal acid-base imbalances across their gills, though at substantial energy expense. In contrast, benthic invertebrates such as pteropods, bivalves, and reef-building corals lack active proton transport systems capable of overcoming the diminished saturation state. Their shell dissolution accelerates whenever saturation falls below unity, forcing them to allocate scarce metabolic energy to calcification rather than growth.',
      'Geographical vulnerability varies with latitude and ocean circulation patterns. Cold polar waters absorb carbon dioxide more efficiently than tropical waters, while natural upwelling along eastern boundary currents brings deep, carbon-rich water to the surface. Arctic marine ecosystems are therefore crossing critical chemical thresholds decades ahead of temperate seas, threatening keystone pteropod populations that form the foundation of sub-polar trophic webs.',
      'Mitigation strategies focused exclusively on coastal buffering offer strictly localized relief. Distributing alkaline minerals, such as olivine or slaked lime, can temporarily raise local pH levels in enclosed bays and hatcheries, but the logistical scale required to affect open-ocean saturation states remains physically impractical. Long-term preservation of marine calcifiers depends fundamentally on stabilizing atmospheric carbon emissions before oceanic carbonate chemistry crosses irreversible thresholds.',
    ],
    keyTerms: [
      'saturation horizon',
      'aragonite',
      'calcification',
      'carbonate ions',
      'pteropods',
      'buffering',
    ],
    readAloud:
      'The biological impact is not uniform across marine taxa. Organisms with high metabolic turnover, such as pelagic fish, can compensate for internal acid-base imbalances across their gills, though at substantial energy expense. In contrast, benthic invertebrates such as pteropods, bivalves, and reef-building corals lack active proton transport systems capable of overcoming the diminished saturation state.',
    repeatSentences: [
      'Cold polar waters absorb carbon dioxide much more efficiently than warmer tropical oceans.',
      'Shell dissolution accelerates whenever the mineral saturation state falls below critical thresholds.',
      'Marine organisms must divert vital metabolic energy away from growth to sustain shell formation.',
      'Long-term preservation of coral reefs depends upon immediate stabilization of global carbon emissions.',
      'Coastal alkaline buffering remains an impractical solution for open ocean acidification challenges.',
    ],
    swt: {
      id: 'swt-ocean-acidification',
      summary:
        'The passage explains that dissolved anthropogenic carbon dioxide consumes marine carbonate ions and lowers aragonite saturation, disproportionately threatening benthic calcifiers in cold polar waters despite local buffering interventions.',
      excerptLabel: 'Carbonate Chemistry and Vulnerability',
      excerpt: [
        'The chemistry of seawater is governed by an equilibrium between dissolved carbon dioxide, carbonic acid, and carbonate ions. When carbon dioxide dissolves, it forms carbonic acid, which rapidly dissociates and consumes free carbonate ions. This chemical shift lowers the saturation horizon of aragonite, the mineral form of calcium carbonate required by calcifying organisms.',
        'In contrast, benthic invertebrates such as pteropods, bivalves, and reef-building corals lack active proton transport systems capable of overcoming the diminished saturation state. Their shell dissolution accelerates whenever saturation falls below unity, forcing them to allocate scarce metabolic energy to calcification rather than growth.',
      ],
      keyTerms: [
        'carbon dioxide',
        'carbonate ions',
        'aragonite saturation',
        'pteropods',
        'calcification',
        'dissolution',
      ],
      minWords: 20,
    },
    dropdown: {
      id: 'fibd-ocean-acidification',
      text: 'When atmospheric carbon dioxide dissolves in seawater, it forms carbonic acid and ______ available carbonate ions. This chemical transition lowers the aragonite ______ horizon, directly impeding shell synthesis in marine organisms. While pelagic fish can maintain internal equilibrium, benthic invertebrates ______ active proton transport mechanisms. Consequently, shell dissolution ______ whenever mineral saturation drops below unity. Although mineral buffering provides temporary relief in bays, open ocean mitigation remains ______ on a global scale.',
      bank: [
        'consumes',
        'saturation',
        'lack',
        'accelerates',
        'impractical',
        'produces',
        'elevates',
        'surplus',
        'abundant',
      ],
      answers: ['consumes', 'saturation', 'lack', 'accelerates', 'impractical'],
    },
    tableFib: {
      id: 'fibt-ocean-acidification',
      context: [
        'Marine biologists monitored calcification rates and saturation states across four marine regions. The table summarizes aragonite saturation states alongside observed juvenile shell dissolution percentages.',
      ],
      headers: [
        'Region',
        'Water temperature',
        'Aragonite state',
        'Dissolution rate',
        'Vulnerability',
      ],
      rows: [
        ['Arctic Ocean', 'Cold (<2°C)', '0.95', '68%', 'Critical'],
        ['Eastern Pacific Upwelling', 'Temperate (11°C)', '1.15', null, 'High'],
        ['Coral Triangle', 'Warm (>26°C)', null, '12%', 'Moderate'],
        ['North Atlantic Basin', 'Temperate (8°C)', '1.40', '24%', null],
      ],
      answers: ['42%', '2.80', 'Moderate'],
    },
    mcqSingle: {
      id: 'mcqs-ocean-acidification',
      question:
        'Why do polar marine ecosystems experience acidification impacts sooner than tropical waters?',
      options: [
        'Because cold water absorbs carbon dioxide more efficiently from the atmosphere',
        'Because tropical coral reefs produce synthetic alkaline buffers naturally',
        'Because polar organisms possess higher metabolic turnover and oxygen demand',
        'Because industrial shipping routes are concentrated predominantly in Arctic waters',
      ],
      correct: ['Because cold water absorbs carbon dioxide more efficiently from the atmosphere'],
    },
    mcqMultiple: {
      id: 'mcqm-ocean-acidification',
      question: 'Which two consequences for benthic invertebrates are described in the passage?',
      options: [
        'They accelerate shell dissolution when aragonite saturation drops below unity',
        'They divert limited metabolic energy toward calcification rather than growth',
        'They rapidly evolve proton transport systems across their gills',
        'They migrate immediately toward deep carbon-rich upwelling currents',
        'They absorb dissolved olivine minerals to construct synthetic protective coatings',
      ],
      correct: [
        'They accelerate shell dissolution when aragonite saturation drops below unity',
        'They divert limited metabolic energy toward calcification rather than growth',
      ],
    },
    asq: [
      {
        id: 'asq-acid-1',
        question: 'Which mineral form of calcium carbonate is required by marine calcifiers?',
        options: ['Aragonite', 'Calcite', 'Gypsum'],
        correct: 'Aragonite',
      },
      {
        id: 'asq-acid-2',
        question: 'Which marine region absorbs carbon dioxide more efficiently due to temperature?',
        options: ['Cold polar waters', 'Tropical oceans', 'Equatorial basins'],
        correct: 'Cold polar waters',
      },
      {
        id: 'asq-acid-3',
        question: 'What do calcifying organisms consume when neutralizing dissolved carbonic acid?',
        options: ['Carbonate ions', 'Magnesium salts', 'Nitrogen compounds'],
        correct: 'Carbonate ions',
      },
    ],
  },
  {
    id: 'ancient-metallurgy',
    title: 'The Metallurgy of Bronze Age Trade',
    topic: 'Archaeometallurgy',
    level: 'C1',
    paragraphs: [
      'The emergence of bronze metallurgy in the fourth millennium BCE transformed Mediterranean and Near Eastern political geography. Bronze, an alloy typically comprising nine parts copper and one part tin, required materials that rarely co-occurred in regional deposits. While copper was relatively abundant in Cyprus, the Levant, and Anatolia, tin deposits were exceedingly scarce, forcing early civilizations to establish long-distance supply networks spanning thousands of kilometers across continental barriers.',
      'Lead isotope analysis has revolutionized our understanding of these ancient supply chains. Because lead occurs as a trace element in copper and tin ores, its isotopic ratio acts as an immutable geographical fingerprint that survives smelting and casting intact. Recent analyses of ingots salvaged from Late Bronze Age shipwrecks confirm that Mediterranean workshops sourced tin from distant regions, including the Zagros Mountains of central Asia and potentially as far as Cornwall in southwestern Britain.',
      'The dependence on distant tin created an acute structural vulnerability for Bronze Age states. Royal correspondence from the palace archives of Mari and Ugarit reveals that imperial administrative centers dedicated disproportionate diplomatic and military resources to securing mineral trade routes. When prolonged political instability, pirate raids, or harvest failures disrupted maritime transit lines, regional metal production ceased almost instantaneously, precipitating economic paralysis.',
      'This systemic vulnerability ultimately accelerated the transition to iron working during the twelfth century BCE collapse. Unlike tin, iron ore was geographically ubiquitous, present in virtually every Mediterranean hillside and valley. Although iron demanded higher furnace temperatures and labor-intensive forging rather than simple casting, the collapse of transnational tin networks forced communities to develop indigenous iron smelting technologies out of sheer economic necessity.',
    ],
    keyTerms: [
      'lead isotope analysis',
      'alloy',
      'tin deposits',
      'metallurgy',
      'trade routes',
      'ubiquitous',
    ],
    readAloud:
      'The dependence on distant tin created an acute structural vulnerability for Bronze Age states. Royal correspondence from the palace archives of Mari and Ugarit reveals that imperial administrative centers dedicated disproportionate diplomatic and military resources to securing mineral trade routes. When prolonged political instability, pirate raids, or harvest failures disrupted maritime transit lines, regional metal production ceased almost instantaneously.',
    repeatSentences: [
      'Bronze production required alloy components that rarely occurred together in regional ore deposits.',
      'Lead isotope analysis provides an immutable geological fingerprint for identifying ancient metal sources.',
      'Ancient imperial palaces dedicated substantial diplomatic resources toward securing vital maritime mineral routes.',
      'The collapse of transnational trade routes accelerated the widespread adoption of domestic iron technologies.',
      'Geographical distribution of iron ore made domestic tool production accessible to local communities.',
    ],
    swt: {
      id: 'swt-ancient-metallurgy',
      summary:
        'The passage demonstrates that Bronze Age civilizations relied on precarious long-distance trade networks to source scarce tin, creating an acute structural vulnerability that ultimately drove the adoption of ubiquitous local iron ores during societal collapse.',
      excerptLabel: 'Tin Scarcity and Technological Transition',
      excerpt: [
        'While copper was relatively abundant in Cyprus, the Levant, and Anatolia, tin deposits were exceedingly scarce, forcing early civilizations to establish long-distance supply networks spanning thousands of kilometers across continental barriers.',
        'This systemic vulnerability ultimately accelerated the transition to iron working during the twelfth century BCE collapse. Unlike tin, iron ore was geographically ubiquitous, present in virtually every Mediterranean hillside and valley, forcing communities to develop indigenous iron smelting technologies out of sheer economic necessity.',
      ],
      keyTerms: [
        'bronze',
        'tin deposits',
        'trade networks',
        'structural vulnerability',
        'iron ore',
        'indigenous',
      ],
      minWords: 20,
    },
    dropdown: {
      id: 'fibd-ancient-metallurgy',
      text: 'Bronze metallurgy transformed early civilization by requiring an alloy of copper and ______ tin. Lead isotope ratios provide an immutable ______ that enables archaeologists to trace the geographical origin of metal ingots. Royal correspondence illustrates that states committed vast resources toward ______ vulnerable maritime supply lines. When systemic collapse severed trade routes, metal production stalled ______ . This crisis stimulated the development of iron working, whose raw ore was geographically ______ throughout the Mediterranean basin.',
      bank: [
        'scarce',
        'fingerprint',
        'securing',
        'instantaneously',
        'ubiquitous',
        'abundant',
        'decorative',
        'slowly',
        'valueless',
      ],
      answers: ['scarce', 'fingerprint', 'securing', 'instantaneously', 'ubiquitous'],
    },
    tableFib: {
      id: 'fibt-ancient-metallurgy',
      context: [
        'Archaeometallurgists analyzed recovered metal ingots from four Eastern Mediterranean excavation sites to determine provenance and composition.',
      ],
      headers: [
        'Excavation site',
        'Primary metal',
        'Tin concentration',
        'Ore origin',
        'Dating period',
      ],
      rows: [
        ['Uluburun Shipwreck', 'Copper oxhide', '10.2%', 'Cyprus / Troodos', 'Late Bronze Age'],
        ['Cape Gelidonya', 'Tin ingots', null, 'Central Asia / Cornwall', 'Late Bronze Age'],
        ['Mari Royal Palace', null, '9.5%', 'Anatolia', 'Middle Bronze Age'],
        ['Ugarit Harbor', 'Iron tools', '0.1%', 'Local deposits', null],
      ],
      answers: ['98.4%', 'Bronze weapons', 'Early Iron Age'],
    },
    mcqSingle: {
      id: 'mcqs-ancient-metallurgy',
      question:
        'What archaeological method enables researchers to pinpoint the geographical origin of ancient bronze components?',
      options: [
        'Lead isotope analysis of trace elements within smelted ores',
        'Carbon dating of wooden smelting charcoal residues',
        'Deciphering diplomatic records etched onto clay trade tablets',
        'Microscopic examination of crystalline grain boundaries in casting molds',
      ],
      correct: ['Lead isotope analysis of trace elements within smelted ores'],
    },
    mcqMultiple: {
      id: 'mcqm-ancient-metallurgy',
      question:
        'Which two factors encouraged ancient societies to transition from bronze to iron technology?',
      options: [
        'The widespread geographical presence of iron ore across local Mediterranean landscapes',
        'The catastrophic disruption of long-distance transnational tin trade networks',
        'The significantly lower furnace temperatures required to cast molten iron weapons',
        'The total depletion of copper reserves located across Cypriot mining centers',
        'The discovery of pre-alloyed bronze deposits requiring no manual smelting',
      ],
      correct: [
        'The widespread geographical presence of iron ore across local Mediterranean landscapes',
        'The catastrophic disruption of long-distance transnational tin trade networks',
      ],
    },
    asq: [
      {
        id: 'asq-metal-1',
        question: 'Which scarce component was combined with copper to manufacture ancient bronze?',
        options: ['Tin', 'Zinc', 'Lead'],
        correct: 'Tin',
      },
      {
        id: 'asq-metal-2',
        question:
          'What trace element provides an immutable isotopic fingerprint for metal provenance?',
        options: ['Lead', 'Silver', 'Gold'],
        correct: 'Lead',
      },
      {
        id: 'asq-metal-3',
        question:
          'Which metal ore was ubiquitous and replaced bronze during societal trade collapse?',
        options: ['Iron ore', 'Platinum', 'Aluminum'],
        correct: 'Iron ore',
      },
    ],
  },
  {
    id: 'circadian-cognition',
    title: 'Circadian Rhythms and Cognitive Performance',
    topic: 'Chronobiology',
    level: 'C1',
    paragraphs: [
      'Human cognitive architecture does not operate at a constant physiological baseline across the solar day. Instead, attention, working memory capacity, and executive control fluctuate under the guidance of the suprachiasmatic nucleus, the master circadian pacemaker located within the hypothalamus. By regulating core body temperature, cortisol secretion, and pineal melatonin synthesis, this central clock coordinates optimal windows for information processing and metabolic conservation.',
      'The temporal coordination of cognitive faculties reveals distinct evolutionary specializations. Tasks requiring analytical reasoning, sustained vigilance, and inhibitory control typically peak during the late morning, coinciding with rising core body temperature and elevated cortisol levels. Conversely, divergent thinking, creative problem-solving, and subjective risk tolerance show enhanced fluidity during the late afternoon or early evening, when homeostatic sleep pressure begins to loosen rigid prefrontal cognitive control.',
      'Chronotypic variation introduces substantial individual differences into this daily cycle. Genetic polymorphisms in core circadian clock genes, such as CLOCK and PER3, divide populations into distinct chronotypes: morning types, intermediate types, and evening types. While morning types exhibit peak cognitive alertness shortly after waking, evening types experience delayed melatonin clearance, leaving them in a state of cognitive inertia during early morning hours that severely impairs attention on standardized testing.',
      'The modern institutional environment remains overwhelmingly misaligned with these biological realities. Compulsory early school start times for adolescents, whose circadian phase undergoes a biologically driven two-hour delay during puberty, enforce chronic sleep restriction and cognitive deficit. Aligning instructional schedules, work shifts, and high-stakes assessments with chronotypic profiles produces measurable improvements in academic achievement, emotional stability, and workplace safety.',
    ],
    keyTerms: [
      'suprachiasmatic nucleus',
      'chronotype',
      'melatonin',
      'core body temperature',
      'cognitive inertia',
      'prefrontal control',
    ],
    readAloud:
      'Human cognitive architecture does not operate at a constant physiological baseline across the solar day. Instead, attention, working memory capacity, and executive control fluctuate under the guidance of the suprachiasmatic nucleus, the master circadian pacemaker located within the hypothalamus. By regulating core body temperature, cortisol secretion, and pineal melatonin synthesis, this central clock coordinates optimal windows for information processing.',
    repeatSentences: [
      'Human cognitive architecture fluctuates continuously under the strict control of central biological clocks.',
      'Core body temperature reaches its diurnal peak alongside optimal performance in analytical tasks.',
      'Individual variation in circadian clock genes produces distinct morning and evening cognitive chronotypes.',
      'Adolescent biological clocks experience a natural two hour delay during the onset of puberty.',
      'Aligning examination schedules with natural chronotypic rhythms significantly enhances overall academic outcomes.',
    ],
    swt: {
      id: 'swt-circadian-cognition',
      summary:
        'The passage explains that executive cognition fluctuates with the circadian clock, body temperature, and hormone rhythms, arguing that institutional schedules mismatch adolescent chronotypes and cause chronic impairment.',
      excerptLabel: 'Chronobiology and Institutional Alignment',
      excerpt: [
        'By regulating core body temperature, cortisol secretion, and pineal melatonin synthesis, this central clock coordinates optimal windows for information processing and metabolic conservation.',
        'Compulsory early school start times for adolescents, whose circadian phase undergoes a biologically driven two-hour delay during puberty, enforce chronic sleep restriction and cognitive deficit. Aligning instructional schedules, work shifts, and high-stakes assessments with chronotypic profiles produces measurable improvements in academic achievement.',
      ],
      keyTerms: [
        'circadian clock',
        'core body temperature',
        'cortisol',
        'chronotypes',
        'adolescents',
        'academic achievement',
      ],
      minWords: 20,
    },
    dropdown: {
      id: 'fibd-circadian-cognition',
      text: 'Cognitive abilities vary continuously under the regulation of the ______ nucleus in the hypothalamus. While analytical vigilance peaks in the late morning alongside rising core ______ , creative reasoning often flourishes as prefrontal control diminishes. Genetic ______ in clock genes create distinct chronotypes, with evening types suffering persistent cognitive ______ during early morning tasks. Because adolescent biology delays the circadian phase by two hours, early school schedules create chronic cognitive ______ .',
      bank: [
        'suprachiasmatic',
        'temperature',
        'polymorphisms',
        'inertia',
        'deficit',
        'subconscious',
        'pressure',
        'uniformity',
        'expansion',
      ],
      answers: ['suprachiasmatic', 'temperature', 'polymorphisms', 'inertia', 'deficit'],
    },
    tableFib: {
      id: 'fibt-circadian-cognition',
      context: [
        'Neuroscientists evaluated cognitive processing speeds and working memory errors across three chronotypes during standardized testing sessions.',
      ],
      headers: [
        'Chronotype',
        'Peak alertness time',
        'Morning error rate',
        'Evening error rate',
        'Melatonin onset',
      ],
      rows: [
        ['Morning type (Lark)', '09:30 AM', '6.2%', '18.4%', '20:15 PM'],
        ['Intermediate', '13:00 PM', '11.5%', null, '22:00 PM'],
        ['Evening type (Owl)', null, '24.8%', '8.1%', '00:30 AM'],
        ['Adolescent group', '16:00 PM', '29.3%', '9.7%', null],
      ],
      answers: ['12.1%', '18:30 PM', '23:45 PM'],
    },
    mcqSingle: {
      id: 'mcqs-circadian-cognition',
      question:
        'Why do adolescents suffer disproportionately from early educational start times according to the text?',
      options: [
        'Because their circadian clock naturally shifts forward by approximately two hours during puberty',
        'Because their pineal gland permanently halts the synthesis of morning cortisol hormones',
        'Because their core body temperature drops below basal metabolic levels during daytime hours',
        'Because evening chronotypes outnumber morning types exclusively among teenage populations',
      ],
      correct: [
        'Because their circadian clock naturally shifts forward by approximately two hours during puberty',
      ],
    },
    mcqMultiple: {
      id: 'mcqm-circadian-cognition',
      question:
        'Which two physiological variables coordinate daily cognitive windows according to the passage?',
      options: [
        'Core body temperature regulation directed by the hypothalamus',
        'Pineal melatonin synthesis and systemic cortisol hormone secretion',
        'Continuous glucose consumption across active muscle tissue',
        'Static atmospheric pressure variations throughout the seasonal cycle',
        'Permanent epigenetic restructuring within prefrontal cortical neurons',
      ],
      correct: [
        'Core body temperature regulation directed by the hypothalamus',
        'Pineal melatonin synthesis and systemic cortisol hormone secretion',
      ],
    },
    asq: [
      {
        id: 'asq-circ-1',
        question: 'Which hypothalamic pacemaker governs human biological circadian rhythms?',
        options: ['Suprachiasmatic nucleus', 'Cerebral cortex', 'Hippocampus'],
        correct: 'Suprachiasmatic nucleus',
      },
      {
        id: 'asq-circ-2',
        question: 'What hormone synthesized by the pineal gland regulates the onset of sleep?',
        options: ['Melatonin', 'Adrenaline', 'Thyroxine'],
        correct: 'Melatonin',
      },
      {
        id: 'asq-circ-3',
        question:
          'By how many hours does the adolescent biological clock naturally shift during puberty?',
        options: ['Two hours', 'Four hours', 'Six hours'],
        correct: 'Two hours',
      },
    ],
  },
  {
    id: 'computational-linguistics',
    title: 'Information Entropy in Natural Language',
    topic: 'Computational linguistics',
    level: 'C1',
    paragraphs: [
      'Language evolution balances two competing evolutionary constraints: speaker economy and listener comprehension. If speakers minimized physical articulation effort entirely, speech would collapse into an ambiguous series of indistinct phonemes. Conversely, if listeners maximized acoustic clarity without regard for speaker effort, every word would require redundant syllabic elaboration. Natural language resolves this tension through smooth information density, modulating entropy so that information is transmitted at a near-constant rate across time.',
      'Information theory formalizes this balance through Shannon entropy, which quantifies the surprisal or unpredictability of linguistic units in context. In predictable linguistic environments, where succeeding words are easily inferred from preceding syntax, speakers naturally articulate faster, elide unstressed syllables, and select shorter lexical substitutes. In contrast, when conveying semantically surprising or rare information, speakers slow their speech tempo, lengthen vowel durations, and insert brief acoustic pauses to prevent channel saturation.',
      'Cross-linguistic computational corpora confirm that this principle holds regardless of surface grammar or phonological inventory. While languages differ radically in their syllable transmission rates—Spanish speakers, for instance, pronounce significantly more syllables per second than Mandarin speakers—their net information transmission rates converge remarkably at approximately thirty-nine bits per second. Languages with simpler syllabic inventories compensate with higher syllable speeds, while phonologically denser languages communicate fewer syllables at higher informational density.',
      'These findings carry immediate implications for automated language processing and machine translation. Artificial generation models that emit uniform syntactic structures frequently violate human expectations of communicative entropy, producing prose that human raters judge as either artificially verbose or cognitively exhausting. Mimicking the dynamic ebb and flow of natural linguistic surprisal represents a crucial frontier for natural speech synthesis.',
    ],
    keyTerms: [
      'information entropy',
      'Shannon entropy',
      'surprisal',
      'information density',
      'phonological inventory',
      'rate convergence',
    ],
    readAloud:
      'Language evolution balances two competing evolutionary constraints: speaker economy and listener comprehension. If speakers minimized physical articulation effort entirely, speech would collapse into an ambiguous series of indistinct phonemes. Conversely, if listeners maximized acoustic clarity without regard for speaker effort, every word would require redundant syllabic elaboration. Natural language resolves this tension through smooth information density.',
    repeatSentences: [
      'Language evolution successfully balances communicative efficiency for speakers with acoustic clarity for listeners.',
      'Predictable words in familiar contexts are systematically articulated faster with shorter vowel lengths.',
      'Cross linguistic studies demonstrate that human languages transmit information at remarkably consistent rates.',
      'Languages with compact syllable structures compensate by speaking significantly more syllables each second.',
      'Dynamic modulation of information surprisal remains essential for producing authentic automated speech synthesis.',
    ],
    swt: {
      id: 'swt-computational-linguistics',
      summary:
        'The passage demonstrates that natural language balances speaker economy and listener comprehension through information density and Shannon entropy, achieving net rate convergence near thirty-nine bits per second.',
      excerptLabel: 'Entropy and Rate Convergence',
      excerpt: [
        'Natural language resolves this tension through smooth information density, modulating entropy so that information is transmitted at a near-constant rate across time.',
        'While languages differ radically in their syllable transmission rates—Spanish speakers, for instance, pronounce significantly more syllables per second than Mandarin speakers—their net information transmission rates converge remarkably at approximately thirty-nine bits per second.',
      ],
      keyTerms: [
        'speaker economy',
        'listener comprehension',
        'information density',
        'Shannon entropy',
        'bits per second',
        'convergence',
      ],
      minWords: 20,
    },
    dropdown: {
      id: 'fibd-computational-linguistics',
      text: 'Human communication resolves the conflict between speaker economy and listener comprehension through uniform information ______ . In highly predictable environments, speakers naturally ______ unstressed vowels and accelerate speech tempo. Surprising lexical choices prompt speakers to insert pauses to avoid ______ listener comprehension. Although syllable speeds vary between languages, net information transmission rates ______ at approximately thirty-nine bits per second. Modern synthesis models must replicate this dynamic ______ to sound authentic.',
      bank: [
        'density',
        'elide',
        'saturating',
        'converge',
        'surprisal',
        'expansion',
        'exaggerate',
        'diverge',
        'stagnation',
      ],
      answers: ['density', 'elide', 'saturating', 'converge', 'surprisal'],
    },
    tableFib: {
      id: 'fibt-computational-linguistics',
      context: [
        'Linguists measured syllabic transmission speeds and informational density across four distinct language families to evaluate net transmission rates.',
      ],
      headers: [
        'Language',
        'Family',
        'Syllables / second',
        'Density (bits/syl)',
        'Net rate (bits/sec)',
      ],
      rows: [
        ['Spanish', 'Indo-European (Romance)', '7.82', '5.02', '39.2'],
        ['Japanese', 'Japonic', null, '4.91', '39.1'],
        ['Mandarin', 'Sino-Tibetan', '5.18', null, '39.4'],
        ['English', 'Indo-European (Germanic)', '6.19', '6.35', null],
      ],
      answers: ['7.96', '7.61', '39.3'],
    },
    mcqSingle: {
      id: 'mcqs-computational-linguistics',
      question:
        'What remarkable constant was discovered when comparing information transmission across different world languages?',
      options: [
        'Net informational transfer converges near thirty-nine bits per second regardless of language',
        'All world languages share an identical inventory of vowel phonemes and consonant clusters',
        'Speakers across all languages pronounce exactly seven syllables per second on average',
        'Grammatical complexity decreases uniformly as geographic vocabulary size expands',
      ],
      correct: [
        'Net informational transfer converges near thirty-nine bits per second regardless of language',
      ],
    },
    mcqMultiple: {
      id: 'mcqm-computational-linguistics',
      question:
        'Which two adaptations do speakers exhibit when uttering predictable linguistic sequences?',
      options: [
        'They accelerate their physical articulation tempo and elide unstressed syllables',
        'They select shorter lexical substitutions to economize communicative effort',
        'They lengthen vowel durations and insert deliberate acoustic pauses',
        'They switch into phonologically denser grammatical case structures',
        'They maximize acoustic amplitude to eliminate phonetic background noise',
      ],
      correct: [
        'They accelerate their physical articulation tempo and elide unstressed syllables',
        'They select shorter lexical substitutions to economize communicative effort',
      ],
    },
    asq: [
      {
        id: 'asq-ling-1',
        question: 'What mathematical metric quantifies the unpredictability of linguistic units?',
        options: ['Shannon entropy', 'Euclidean distance', 'Gaussian variance'],
        correct: 'Shannon entropy',
      },
      {
        id: 'asq-ling-2',
        question:
          'At approximately how many bits per second do human languages converge in transmission?',
        options: ['Thirty-nine bits', 'Sixty bits', 'Twelve bits'],
        correct: 'Thirty-nine bits',
      },
      {
        id: 'asq-ling-3',
        question: 'What do speakers lengthen when conveying rare or surprising information?',
        options: ['Vowel durations', 'Consonant stops', 'Sentence lengths'],
        correct: 'Vowel durations',
      },
    ],
  },
  {
    id: 'satellite-hydrology',
    title: 'Monitoring Aquifers from Space',
    topic: 'Hydrological remote sensing',
    level: 'C1',
    paragraphs: [
      "Subsurface groundwater represents over ninety-seven percent of the planet's liquid freshwater, yet monitoring its depletion has historically relied on fragmented monitoring wells that fail to capture regional trends. The deployment of gravimetric satellite missions, notably the Gravity Recovery and Climate Experiment (GRACE), revolutionized hydrogeology by allowing scientists to weigh freshwater mass shifts directly from orbit, bypassing terrestrial sensor networks entirely.",
      'The measurement technique exploits minute perturbations in satellite orbital trajectories. Twin satellites orbit hundreds of kilometers above the Earth in identical orbits, maintaining continuous microwave ranging measurements of the separation distance between them. As the leading spacecraft flies over a massive underground water body, the localized gravitational anomaly tugs it forward; as the trailing satellite approaches, it experiences the same gravitational acceleration, allowing ground systems to calculate terrestrial water mass variations with sub-centimeter accuracy.',
      "GRACE data have revealed alarming deficits in global food-producing basins. In northern India, the North China Plain, and California's Central Valley, groundwater abstraction for agricultural irrigation consistently outpaces natural seasonal recharge. Because subterranean aquifers occupy porous rock matrices, persistent over-extraction causes structural pore collapse, leading to irreversible land subsidence and permanently reducing the geological storage capacity of the aquifer.",
      'The policy challenge lies in converting orbital observations into localized enforcement mechanisms. While satellite gravimetry accurately measures depletion at regional scales of several hundred square kilometers, it cannot resolve which individual agricultural boreholes are responsible for excessive pumping. Effective groundwater governance therefore requires coupling spaceborne gravimetry with localized smart-metering regulations and volumetric allocation caps.',
    ],
    keyTerms: [
      'gravimetric satellite',
      'GRACE',
      'orbital perturbations',
      'aquifer depletion',
      'pore collapse',
      'subsidence',
    ],
    readAloud:
      'The measurement technique exploits minute perturbations in satellite orbital trajectories. Twin satellites orbit hundreds of kilometers above the Earth in identical orbits, maintaining continuous microwave ranging measurements of the separation distance between them. As the leading spacecraft flies over a massive underground water body, the localized gravitational anomaly tugs it forward; as the trailing satellite approaches, it experiences the same gravitational acceleration.',
    repeatSentences: [
      'Subsurface groundwater represents more than ninety percent of all accessible freshwater on earth.',
      'Twin gravimetric satellites monitor subtle orbital variations to measure underground water mass changes.',
      'Agricultural over extraction consistently outpaces natural seasonal recharge across global food production basins.',
      'Excessive groundwater pumping causes structural pore collapse and irreversible terrestrial land subsidence.',
      'Spaceborne gravimetric monitoring must be paired with local metering systems to enforce usage regulations.',
    ],
    swt: {
      id: 'swt-satellite-hydrology',
      summary:
        'The passage explains how gravimetric satellites monitor orbital trajectories to detect global groundwater depletion, warning that agricultural irrigation causes permanent pore collapse and land subsidence.',
      excerptLabel: 'Orbital Gravimetry and Aquifer Collapse',
      excerpt: [
        'Twin satellites orbit hundreds of kilometers above the Earth in identical orbits, maintaining continuous microwave ranging measurements of the separation distance between them. As the leading spacecraft flies over a massive underground water body, the localized gravitational anomaly tugs it forward.',
        "In northern India, the North China Plain, and California's Central Valley, groundwater abstraction for agricultural irrigation consistently outpaces natural seasonal recharge. Because subterranean aquifers occupy porous rock matrices, persistent over-extraction causes structural pore collapse, leading to irreversible land subsidence and permanently reducing the geological storage capacity of the aquifer.",
      ],
      keyTerms: [
        'groundwater',
        'gravimetric satellite',
        'orbital trajectories',
        'irrigation',
        'pore collapse',
        'subsidence',
      ],
      minWords: 20,
    },
    dropdown: {
      id: 'fibd-satellite-hydrology',
      text: 'Groundwater reserves constitute the vast majority of liquid freshwater, yet terrestrial monitoring wells remain ______ . Spaceborne gravimetry measures subtle orbital ______ between twin satellites as they traverse gravitational anomalies. Satellite observations prove that agricultural abstraction consistently ______ natural recharge in major river plains. When subterranean water is depleted, surrounding rock matrices undergo pore ______ , producing irreversible surface subsidence. Because satellite data are regional, local governance requires ______ metering on individual boreholes.',
      bank: [
        'fragmented',
        'perturbations',
        'outpaces',
        'collapse',
        'mandated',
        'uniform',
        'accelerations',
        'supplements',
        'elasticity',
      ],
      answers: ['fragmented', 'perturbations', 'outpaces', 'collapse', 'mandated'],
    },
    tableFib: {
      id: 'fibt-satellite-hydrology',
      context: [
        'Hydrologists synthesized GRACE satellite gravimetry with ground borehole records across four major agricultural aquifer basins.',
      ],
      headers: [
        'Aquifer basin',
        'Primary crop use',
        'Annual loss (km³)',
        'Recharge rate',
        'Subsidence (cm/yr)',
      ],
      rows: [
        ['Northwest India', 'Wheat & rice', '17.7', 'Very low', '2.8'],
        ['Central Valley (California)', 'Fruit & nuts', null, 'Moderate', '4.5'],
        ['North China Plain', 'Cereals', '8.3', null, '5.2'],
        ['Ogallala (High Plains)', 'Corn & livestock', '6.1', 'Low', null],
      ],
      answers: ['3.1', 'Low', '1.4'],
    },
    mcqSingle: {
      id: 'mcqs-satellite-hydrology',
      question: 'How do twin GRACE satellites measure subterranean water mass changes from space?',
      options: [
        'By tracking minute changes in distance between spacecraft caused by local gravity',
        'By reflecting optical laser pulses off underground water tables through porous bedrock',
        'By measuring acoustic resonance echoes reverberating through subterranean aquifers',
        'By capturing thermal infrared radiation emitted by agricultural irrigation channels',
      ],
      correct: [
        'By tracking minute changes in distance between spacecraft caused by local gravity',
      ],
    },
    mcqMultiple: {
      id: 'mcqm-satellite-hydrology',
      question:
        'Which two consequences of excessive groundwater pumping are identified in the passage?',
      options: [
        'Irreversible structural collapse of porous rock matrices leading to surface subsidence',
        'Permanent reduction in the subterranean geological storage capacity of the aquifer',
        'Sudden elevation in the chemical salinity horizon of deep atmospheric clouds',
        'Immediate expansion of surface river basin discharge during summer seasons',
        'Complete evaporation of unconfined soil moisture within mountain headwaters',
      ],
      correct: [
        'Irreversible structural collapse of porous rock matrices leading to surface subsidence',
        'Permanent reduction in the subterranean geological storage capacity of the aquifer',
      ],
    },
    asq: [
      {
        id: 'asq-hydro-1',
        question:
          'What percentage of global liquid freshwater is stored as subterranean groundwater?',
        options: ['Over ninety-seven percent', 'Fifty percent', 'Ten percent'],
        correct: 'Over ninety-seven percent',
      },
      {
        id: 'asq-hydro-2',
        question: 'Which satellite mission revolutionized orbital groundwater mass monitoring?',
        options: ['GRACE mission', 'Voyager probe', 'Hubble telescope'],
        correct: 'GRACE mission',
      },
      {
        id: 'asq-hydro-3',
        question:
          'What geological consequence results from pore collapse after groundwater over-extraction?',
        options: ['Land subsidence', 'Volcanic eruption', 'Fault shearing'],
        correct: 'Land subsidence',
      },
    ],
  },
  {
    id: 'behavioral-nudge',
    title: 'Choice Architecture in Public Policy',
    topic: 'Behavioral economics',
    level: 'C1',
    paragraphs: [
      'Traditional neoclassical economics posited an agent endowed with complete information, consistent preferences, and unlimited computational capacity. Decades of empirical psychology have dismantled this model, demonstrating that human decision-making relies heavily on cognitive heuristics that produce predictable behavioral biases. Rather than attempting to reshape cognition through costly incentives or punitive mandates, behavioral public policy alters the choice architecture—the physical or digital presentation of options—to guide individuals toward welfare-enhancing outcomes.',
      'The most potent tool in choice architecture is default selection. Because decision-makers exhibit status quo bias and perceive active opting out as cognitively taxing, defaults exert an extraordinary influence on participation rates. In organ donation policy, countries operating presumed-consent regimes—where individuals are registered donors unless they formally object—achieve donor registration rates exceeding ninety percent, whereas opt-in systems rarely surpass fifteen percent despite identical underlying public support.',
      'Transparency and ethics remain contested frontiers in behavioral economics. Critics argue that subtle nudges can become paternalistic manipulations when deployed by state authorities without democratic oversight. When decision environments manipulate salience, such as burying subscription cancellation buttons or exploiting hyperbolic discounting through deferred payment options, choice architecture crosses into predatory dark patterns designed to extract surplus rather than promote public welfare.',
      'A mature regulatory framework therefore distinguishes between asymmetric paternalism and exploitative coercion. A legitimate nudge preserves complete freedom of choice by ensuring that alternative pathways remain frictionless, transparent, and immediate to execute. When designed with public accountability and empirical testing, choice architecture offers public institutions a cost-effective mechanism for addressing complex challenges, from retirement savings accumulation to energy conservation.',
    ],
    keyTerms: [
      'choice architecture',
      'heuristics',
      'default selection',
      'status quo bias',
      'asymmetric paternalism',
      'dark patterns',
    ],
    readAloud:
      'Traditional neoclassical economics posited an agent endowed with complete information, consistent preferences, and unlimited computational capacity. Decades of empirical psychology have dismantled this model, demonstrating that human decision-making relies heavily on cognitive heuristics that produce predictable behavioral biases. Rather than attempting to reshape cognition through costly incentives or punitive mandates, behavioral public policy alters the choice architecture.',
    repeatSentences: [
      'Human decision making relies heavily upon cognitive heuristics that generate systematic behavioral biases.',
      'Default options exert a powerful influence upon human participation rates across public programs.',
      'Presumed consent frameworks achieve donor registration rates exceeding ninety percent in European nations.',
      'Ethical choice architecture must ensure alternative options remain completely frictionless and transparent.',
      'Behavioral public policy provides cost effective interventions for complex social and economic challenges.',
    ],
    swt: {
      id: 'swt-behavioral-nudge',
      summary:
        'The passage explains that choice architecture steers human behavior through default selection and status quo bias, arguing that policy nudges require transparency and freedom of choice to prevent coercive paternalism.',
      excerptLabel: 'Defaults and Ethical Architecture',
      excerpt: [
        'Rather than attempting to reshape cognition through costly incentives or punitive mandates, behavioral public policy alters the choice architecture—the physical or digital presentation of options—to guide individuals toward welfare-enhancing outcomes.',
        'A legitimate nudge preserves complete freedom of choice by ensuring that alternative pathways remain frictionless, transparent, and immediate to execute. When designed with public accountability and empirical testing, choice architecture offers public institutions a cost-effective mechanism for addressing complex challenges.',
      ],
      keyTerms: [
        'choice architecture',
        'default selection',
        'status quo bias',
        'paternalism',
        'freedom of choice',
        'transparency',
      ],
      minWords: 20,
    },
    dropdown: {
      id: 'fibd-behavioral-nudge',
      text: 'Neoclassical economics assumed rational agents, but empirical psychology reveals reliance on cognitive ______ . Rather than enforcing punitive mandates, public policy can adjust choice ______ to guide decision-making. Default settings leverage the status quo ______ , driving organ donor registration above ninety percent in presumed-consent systems. When environments obscure costs, choice architecture degenerates into predatory dark ______ . Legitimate nudges must keep alternative pathways completely ______ and transparent.',
      bank: [
        'heuristics',
        'architecture',
        'bias',
        'patterns',
        'frictionless',
        'mandates',
        'certainty',
        'regimes',
        'coercive',
      ],
      answers: ['heuristics', 'architecture', 'bias', 'patterns', 'frictionless'],
    },
    tableFib: {
      id: 'fibt-behavioral-nudge',
      context: [
        'Policy analysts assessed public participation rates across four social welfare programs before and after introducing default choice architecture.',
      ],
      headers: [
        'Policy domain',
        'Nudge mechanism',
        'Pre-nudge rate',
        'Post-nudge rate',
        'Implementation cost',
      ],
      rows: [
        ['Organ donation', 'Presumed consent default', '14.2%', '91.8%', 'Low'],
        ['Retirement plan enrollment', 'Automatic workplace opt-in', '38.0%', null, 'Negligible'],
        ['Green energy tariff', 'Eco-default with opt-out', null, '78.5%', 'Low'],
        ['Generic prescription choice', 'Prescriber prompt default', '45.1%', '82.3%', null],
      ],
      answers: ['86.4%', '9.1%', 'Minimal'],
    },
    mcqSingle: {
      id: 'mcqs-behavioral-nudge',
      question:
        'Why do default options achieve exceptionally high participation rates according to behavioral economics?',
      options: [
        'Because people exhibit status quo bias and find opting out cognitively taxing',
        'Because neoclassical economics proves that defaults carry legal penal sanctions',
        'Because governments offer substantial monetary incentives to accept default choices',
        'Because decision-makers lack the cognitive capacity to read alternative options',
      ],
      correct: ['Because people exhibit status quo bias and find opting out cognitively taxing'],
    },
    mcqMultiple: {
      id: 'mcqm-behavioral-nudge',
      question:
        'Which two criteria distinguish an ethical policy nudge from predatory manipulation?',
      options: [
        'Alternative decision pathways remain completely frictionless and immediate to execute',
        'The option architecture maintains transparent design subject to public accountability',
        'The policy mandates criminal penalties for refusing the designated default choice',
        'The framework completely eliminates all alternative options from the decision screen',
        'The intervention requires personal financial fees to register an active opt-out',
      ],
      correct: [
        'Alternative decision pathways remain completely frictionless and immediate to execute',
        'The option architecture maintains transparent design subject to public accountability',
      ],
    },
    asq: [
      {
        id: 'asq-nudge-1',
        question:
          'What term describes the deliberate physical or digital presentation of decision choices?',
        options: ['Choice architecture', 'Punitive mandate', 'Fiscal incentive'],
        correct: 'Choice architecture',
      },
      {
        id: 'asq-nudge-2',
        question: 'Which behavioral bias causes individuals to stick with pre-selected options?',
        options: ['Status quo bias', 'Confirmation bias', 'Hindsight bias'],
        correct: 'Status quo bias',
      },
      {
        id: 'asq-nudge-3',
        question:
          'What donor registration system presumes consent unless an individual actively objects?',
        options: ['Presumed-consent regime', 'Voluntary opt-in', 'Mandatory draft'],
        correct: 'Presumed-consent regime',
      },
    ],
  },
]
