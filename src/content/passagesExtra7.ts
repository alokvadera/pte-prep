import type { Passage } from './schema'

export const EXTRA_PASSAGES_7: Passage[] = [
  {
    id: 'ocean-acidification',
    title: 'Ocean Acidification and Marine Carbonates',
    topic: 'Marine biogeochemistry',
    level: 'C1',
    paragraphs: [
      'The chemistry of seawater is governed by an equilibrium between dissolved carbon dioxide, carbonic acid, and carbonate ions. The oceans absorb roughly one quarter of the carbon dioxide released by human activity. When carbon dioxide dissolves, it forms carbonic acid and changes the balance of carbonate ions. This chemical shift lowers aragonite saturation, affecting organisms such as pteropods that build shells from this form of calcium carbonate.',
      'Biological responses differ among species and life stages. Ocean acidification can affect growth, behaviour and shell or skeleton formation, but the size and direction of these effects vary with the organism and its environment. When seawater is undersaturated with respect to a shell mineral, exposed carbonate structures can dissolve; organisms also vary in their ability to regulate internal chemistry. It is misleading to divide marine animals into groups that can or cannot cope with acidification.',
      'Geographical vulnerability varies with latitude and ocean circulation. Cold polar waters can absorb carbon dioxide readily, while upwelling brings deep, carbon-rich water toward the surface in some regions. These conditions can cause the saturation horizon to become shallower, exposing some organisms to corrosive water sooner. Pteropods are important prey in several marine food webs, but their abundance and ecological role vary by region.',
      'Researchers are studying approaches such as adding alkaline minerals to coastal waters, but these interventions remain experimental and their effects are local and difficult to scale. Reducing carbon dioxide emissions addresses the cause of ocean acidification, while field observations and experiments help clarify which species and ecosystems are most vulnerable and how quickly conditions are changing.',
    ],
    keyTerms: [
      'aragonite saturation',
      'aragonite',
      'calcification',
      'carbonate ions',
      'pteropods',
      'buffering',
    ],
    readAloud:
      'Biological responses differ among species and life stages. Ocean acidification can affect growth, behaviour and shell or skeleton formation, but the size and direction of these effects vary with the organism and its environment. When seawater is undersaturated with respect to a shell mineral, exposed carbonate structures can dissolve; organisms also vary in their ability to regulate internal chemistry.',
    repeatSentences: [
      'Cold polar waters can absorb carbon dioxide readily, while upwelling can bring carbon-rich water toward the surface.',
      'Biological responses to ocean acidification vary among species and life stages.',
      'Exposed carbonate structures can dissolve in water undersaturated with respect to their mineral.',
      'Pteropods are important prey in several food webs, though their role varies by region.',
      'Alkalinity additions are being studied, but their effects and scale remain uncertain.',
    ],
    swt: {
      id: 'swt-ocean-acidification',
      summary:
        'The passage explains that human-caused carbon dioxide changes seawater chemistry and can lower aragonite saturation, affecting shell-forming organisms in ways that vary by species, life stage and region. Cold polar waters and upwelling areas can face greater exposure to undersaturated conditions. Alkalinity additions are being studied, while reducing emissions addresses the main cause.',
      excerptLabel: 'Carbonate Chemistry and Vulnerability',
      excerpt: [
        'The chemistry of seawater is governed by an equilibrium between dissolved carbon dioxide, carbonic acid, and carbonate ions. The oceans absorb roughly one quarter of the carbon dioxide released by human activity. When carbon dioxide dissolves, it forms carbonic acid and changes the balance of carbonate ions. This chemical shift lowers aragonite saturation, affecting organisms such as pteropods that build shells from this form of calcium carbonate.',
        'Biological responses differ among species and life stages. Ocean acidification can affect growth, behaviour and shell or skeleton formation, but the size and direction of these effects vary with the organism and its environment. When seawater is undersaturated with respect to a shell mineral, exposed carbonate structures can dissolve; organisms also vary in their ability to regulate internal chemistry.',
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
      text: 'When atmospheric carbon dioxide dissolves in seawater, it forms carbonic acid and ______ available carbonate ions. This chemical shift can lower aragonite ______, which affects shell-forming organisms. Biological responses vary among species and life stages, and exposed carbonate structures can dissolve when water is ______ with respect to their mineral. Cold polar waters can absorb carbon dioxide readily, while upwelling can bring carbon-rich water toward the surface. Coastal alkalinity additions remain an area of ______.',
      bank: [
        'consumes',
        'saturation',
        'undersaturated',
        'research',
        'produces',
        'elevates',
        'saturated',
        'certainty',
      ],
      answers: ['consumes', 'saturation', 'undersaturated', 'research'],
    },
    tableFib: {
      id: 'fibt-ocean-acidification',
      context: [
        'Illustrative teaching data (not measurements from a published study) pair aragonite saturation values with example juvenile shell dissolution rates.',
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
        'Why can some cold polar waters become vulnerable to ocean acidification sooner than warmer waters?',
      options: [
        'Because cold water can absorb carbon dioxide readily, lowering carbonate mineral saturation',
        'Because tropical coral reefs produce synthetic alkaline buffers naturally',
        'Because polar organisms possess higher metabolic turnover and oxygen demand',
        'Because industrial shipping routes are concentrated predominantly in Arctic waters',
      ],
      correct: [
        'Because cold water can absorb carbon dioxide readily, lowering carbonate mineral saturation',
      ],
    },
    mcqMultiple: {
      id: 'mcqm-ocean-acidification',
      question: 'Which two statements about ocean acidification are supported by the passage?',
      options: [
        'Biological effects vary among species and life stages',
        'Exposed carbonate structures can dissolve in water undersaturated for their mineral',
        'All benthic invertebrates lack the ability to regulate internal chemistry',
        'Pteropods form the foundation of every sub-polar food web',
        'Coastal mineral additions have already reversed open-ocean acidification',
      ],
      correct: [
        'Biological effects vary among species and life stages',
        'Exposed carbonate structures can dissolve in water undersaturated for their mineral',
      ],
    },
    asq: [
      {
        id: 'asq-acid-1',
        question: 'Which calcium carbonate form does the passage discuss for pteropod shells?',
        options: ['Aragonite', 'Calcite', 'Gypsum'],
        correct: 'Aragonite',
      },
      {
        id: 'asq-acid-2',
        question:
          'According to the passage, which waters can absorb carbon dioxide more readily due to temperature?',
        options: ['Cold polar waters', 'Tropical oceans', 'Equatorial basins'],
        correct: 'Cold polar waters',
      },
      {
        id: 'asq-acid-3',
        question:
          'How does dissolved carbon dioxide change carbonate-ion availability in seawater?',
        options: ['It lowers availability', 'It increases availability', 'It has no effect'],
        correct: 'It lowers availability',
      },
    ],
  },
  {
    id: 'ancient-metallurgy',
    title: 'The Metallurgy of Bronze Age Trade',
    topic: 'Archaeometallurgy',
    level: 'C1',
    paragraphs: [
      'Bronze metallurgy spread across the Mediterranean and Near East from the fourth millennium BCE. Bronze combines copper with tin, but the proportions vary between objects. Copper was available in several regions, while usable tin deposits were less common, so communities developed long-distance trade networks. The routes and suppliers changed over time, and archaeologists are still working to identify where particular batches of ancient tin originated.',
      'Lead and tin isotope measurements, combined with trace-element analysis, can help researchers compare artefacts with candidate ore deposits. These measurements do not provide an immutable fingerprint: mixing metals and gaps in the reference data can complicate a match. One study of Late Bronze Age tin ingots from the eastern Mediterranean argued that some Israeli ingots were consistent with ore from Cornwall or nearby parts of western Europe, while the ingots from other sites pointed to different possibilities. The source of ancient tin remains an active research question.',
      'Written records from places including Mari and Ugarit show that rulers were concerned with obtaining metals and maintaining trade. Such records illuminate the political importance of exchange, but they do not by themselves identify the geological source of a particular ingot. Disruption to trade could affect access to materials, although the scale and effects would have differed between regions and periods.',
      'Iron objects were known before the end of the Bronze Age, and ironworking expanded unevenly across regions. In parts of the Near East, wider iron use coincided with political changes around the end of the second millennium BCE, but archaeological reviews describe a longer process that began before and continued after the Late Bronze Age collapse. Iron ores are widespread, yet turning ore into useful iron required specialised knowledge and fuel. The transition cannot be explained by a single disruption to tin trade.',
    ],
    keyTerms: [
      'tin provenance',
      'alloy',
      'tin deposits',
      'metallurgy',
      'trade routes',
      'ubiquitous',
    ],
    readAloud:
      'Lead and tin isotope measurements, combined with trace-element analysis, can help researchers compare artefacts with candidate ore deposits. These measurements do not provide an immutable fingerprint: mixing metals and gaps in the reference data can complicate a match. One study of Late Bronze Age tin ingots from the eastern Mediterranean argued that some Israeli ingots were consistent with ore from Cornwall or nearby parts of western Europe, while the ingots from other sites pointed to different possibilities.',
    repeatSentences: [
      'Bronze combines copper with tin, but the proportions vary between objects.',
      'Researchers combine isotope and trace-element measurements to investigate tin provenance.',
      'One study linked some eastern Mediterranean tin ingots with possible western European sources.',
      'Ironworking expanded unevenly and cannot be explained by one disruption to tin trade.',
      'Iron ore is widespread, but producing useful iron required specialised knowledge and fuel.',
    ],
    swt: {
      id: 'swt-ancient-metallurgy',
      summary:
        'The passage describes long-distance tin trade and the continuing difficulty of identifying ancient ore sources. Isotope and trace-element studies suggest that some eastern Mediterranean ingots may have come from western Europe, but other samples point elsewhere and the evidence has limits. Written records show the political importance of metal exchange, while ironworking expanded unevenly over a longer period, so the transition cannot be attributed to the Late Bronze Age collapse alone.',
      excerptLabel: 'Tin Scarcity and Technological Transition',
      excerpt: [
        'Bronze combines copper with tin, but the proportions vary between objects. Copper was available in several regions, while usable tin deposits were less common, so communities developed long-distance trade networks.',
        'Iron objects were known before the end of the Bronze Age, and ironworking expanded unevenly across regions. In parts of the Near East, wider iron use coincided with political changes around the end of the second millennium BCE, but archaeological reviews describe a longer process that began before and continued after the Late Bronze Age collapse. Iron ores are widespread, yet turning ore into useful iron required specialised knowledge and fuel. The transition cannot be explained by a single disruption to tin trade.',
      ],
      keyTerms: [
        'bronze',
        'tin deposits',
        'trade networks',
        'provenance',
        'iron ore',
        'indigenous',
      ],
      minWords: 20,
    },
    dropdown: {
      id: 'fibd-ancient-metallurgy',
      text: 'Bronze combines copper with ______, although the proportions vary. Researchers combine isotope measurements with trace-element analysis to investigate tin ______. The evidence can be complicated by metal mixing and gaps in reference data, so a source match is not always ______. Some eastern Mediterranean ingots have been linked tentatively with western European ______. Ironworking expanded ______ across regions and cannot be explained by one disruption to tin trade.',
      bank: [
        'tin',
        'provenance',
        'certain',
        'ores',
        'unevenly',
        'iron',
        'uniformly',
        'unchanging',
        'charcoal',
      ],
      answers: ['tin', 'provenance', 'certain', 'ores', 'unevenly'],
    },
    tableFib: {
      id: 'fibt-ancient-metallurgy',
      context: [
        'The table summarizes the passage’s claims about ancient tin and iron. Provenance findings are tentative and can differ between samples.',
      ],
      headers: ['Topic', 'Evidence or finding'],
      rows: [
        ['Bronze composition', null],
        ['Tin provenance research', null],
        ['Written records from Mari and Ugarit', null],
        ['Ironworking transition', null],
      ],
      answers: [
        'Copper and tin in varying proportions',
        'Some ingots may point to western European ores, but the question remains open',
        'They show the political importance of metal trade, not the source of each ingot',
        'It was uneven and extended before and after the Late Bronze Age collapse',
      ],
    },
    mcqSingle: {
      id: 'mcqs-ancient-metallurgy',
      question:
        'Which methods can help researchers investigate the possible source of ancient tin?',
      options: [
        'Combining lead and tin isotope measurements with trace-element analysis',
        'Carbon dating of wooden smelting charcoal residues',
        'Deciphering diplomatic records etched onto clay trade tablets',
        'Microscopic examination of crystalline grain boundaries in casting molds',
      ],
      correct: ['Combining lead and tin isotope measurements with trace-element analysis'],
    },
    mcqMultiple: {
      id: 'mcqm-ancient-metallurgy',
      question: 'Which two statements about ironworking are supported by the passage?',
      options: [
        'Iron ores are widespread, but producing useful iron required specialised knowledge and fuel',
        'Ironworking expanded unevenly, with wider use coinciding with political changes in some regions',
        'The collapse of tin trade immediately ended bronze production across the Mediterranean',
        'Ironworking began only after the Late Bronze Age collapse',
        'Iron ore could be turned into tools without specialist knowledge or fuel',
      ],
      correct: [
        'Iron ores are widespread, but producing useful iron required specialised knowledge and fuel',
        'Ironworking expanded unevenly, with wider use coinciding with political changes in some regions',
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
          'What evidence does the passage say researchers combine to investigate tin provenance?',
        options: ['Isotopes and trace elements', 'Tree rings and pollen', 'Carbon dating and DNA'],
        correct: 'Isotopes and trace elements',
      },
      {
        id: 'asq-metal-3',
        question: 'How does the passage describe the spread of ironworking?',
        options: [
          'It expanded unevenly over a longer period',
          'It began everywhere after tin trade ended',
          'It replaced bronze immediately in every region',
        ],
        correct: 'It expanded unevenly over a longer period',
      },
    ],
  },
  {
    id: 'circadian-cognition',
    title: 'Circadian Rhythms and Cognitive Performance',
    topic: 'Chronobiology',
    level: 'C1',
    paragraphs: [
      'Human attention, memory and executive control can vary across the day. The suprachiasmatic nucleus in the hypothalamus helps coordinate circadian rhythms, including rhythms in body temperature, cortisol and melatonin. These rhythms interact with sleep pressure, light exposure and individual schedules, so they do not determine a single best time for every person or every cognitive task.',
      'Studies often find daily patterns in alertness and performance, but the timing and size of these patterns depend on the task and the person’s chronotype. Results from one group or laboratory task should not be treated as a universal schedule for analytical or creative work. Sleep loss and the mismatch between a person’s internal timing and external demands can also affect performance.',
      'People differ in their preferred sleep and activity timing, with morning, intermediate and evening types often used as broad descriptions. Genetic variation contributes to these differences, alongside age, light exposure and behaviour. Evening types generally show later timing of circadian signals such as melatonin onset; this does not mean that melatonin is cleared more slowly or that every evening type has impaired early-morning attention.',
      'During puberty, circadian timing tends to shift later, though the amount varies between individuals. Early school schedules can limit adolescents’ sleep when they conflict with this shift and with the need for sufficient rest. Later start times have improved sleep duration in many studies, while effects on academic and other outcomes depend on the setting and study design. Scheduling should account for sleep and individual variation rather than promise one ideal time for everyone.',
    ],
    keyTerms: [
      'suprachiasmatic nucleus',
      'chronotype',
      'melatonin',
      'core body temperature',
      'sleep pressure',
      'melatonin onset',
    ],
    readAloud:
      'Human attention, memory and executive control can vary across the day. The suprachiasmatic nucleus in the hypothalamus helps coordinate circadian rhythms, including rhythms in body temperature, cortisol and melatonin. These rhythms interact with sleep pressure, light exposure and individual schedules, so they do not determine a single best time for every person or every cognitive task.',
    repeatSentences: [
      'Circadian rhythms interact with sleep pressure, light exposure and individual schedules.',
      'The timing of daily alertness patterns depends on the task and the person’s chronotype.',
      'Evening types generally show later timing of circadian signals such as melatonin onset.',
      'During puberty, circadian timing tends to shift later, with variation between individuals.',
      'Later school start times have improved sleep duration in many studies, while other outcomes vary.',
    ],
    swt: {
      id: 'swt-circadian-cognition',
      summary:
        'The passage explains that circadian rhythms interact with sleep pressure and individual chronotype to shape daily alertness. It cautions that performance patterns vary by task and person, notes that adolescent circadian timing tends to shift later, and describes how early school schedules can restrict sleep. Later starts often improve sleep duration, although effects on other outcomes vary by setting.',
      excerptLabel: 'Chronobiology and Institutional Alignment',
      excerpt: [
        'The suprachiasmatic nucleus in the hypothalamus helps coordinate circadian rhythms, including rhythms in body temperature, cortisol and melatonin. These rhythms interact with sleep pressure, light exposure and individual schedules.',
        'During puberty, circadian timing tends to shift later, though the amount varies between individuals. Early school schedules can limit adolescents’ sleep when they conflict with this shift and with the need for sufficient rest. Later start times have improved sleep duration in many studies, while effects on academic and other outcomes depend on the setting and study design.',
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
      text: 'Circadian rhythms are coordinated in part by the ______ nucleus in the hypothalamus. These rhythms interact with sleep pressure and individual schedules, so there is no single best time for every cognitive ______. During puberty, circadian timing tends to shift ______, although the amount varies. Early school schedules can limit adolescent ______ when they conflict with this shift and the need for sufficient rest.',
      bank: ['suprachiasmatic', 'task', 'later', 'sleep', 'earlier', 'certainty'],
      answers: ['suprachiasmatic', 'task', 'later', 'sleep'],
    },
    tableFib: {
      id: 'fibt-circadian-cognition',
      context: [
        'Illustrative teaching data (not measurements from a published study) compare example daily alertness patterns and melatonin-onset times. Times use the 24-hour clock.',
      ],
      headers: [
        'Chronotype',
        'Peak alertness time',
        'Morning error rate',
        'Evening error rate',
        'Melatonin onset',
      ],
      rows: [
        ['Morning type', '09:30', '6.2%', '18.4%', '20:15'],
        ['Intermediate', '13:00', '11.5%', null, '22:00'],
        ['Evening type', null, '24.8%', '8.1%', '00:30'],
        ['Adolescent group', '16:00', '29.3%', '9.7%', null],
      ],
      answers: ['12.1%', '18:30', '23:45'],
    },
    mcqSingle: {
      id: 'mcqs-circadian-cognition',
      question: 'Why can early school schedules limit adolescent sleep?',
      options: [
        'Because circadian timing tends to shift later during puberty, and the amount varies',
        'Because their pineal gland permanently halts the synthesis of morning cortisol hormones',
        'Because their core body temperature drops below basal metabolic levels during daytime hours',
        'Because evening chronotypes outnumber morning types exclusively among teenage populations',
      ],
      correct: [
        'Because circadian timing tends to shift later during puberty, and the amount varies',
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
        question: 'In which direction does circadian timing tend to shift during puberty?',
        options: ['Later', 'Earlier', 'It does not tend to shift'],
        correct: 'Later',
      },
    ],
  },
  {
    id: 'computational-linguistics',
    title: 'Information Entropy in Natural Language',
    topic: 'Computational linguistics',
    level: 'C1',
    paragraphs: [
      'Speech reflects a balance between the effort required to produce language and the information a listener needs to recover. Information theory describes the unpredictability of a message using Shannon entropy. In context, a familiar phrase may be easier to predict than an unexpected one, but speech production also depends on attention, emphasis, speaking style and the situation.',
      'Researchers have studied whether speakers vary their timing with the information they convey. Some studies find that predictable material can be spoken more quickly or with reduced syllables, and speakers may choose shorter, more familiar wording in some contexts. Less predictable material may receive more time or emphasis. These are tendencies observed in particular tasks and languages, not rules that every speaker follows in every conversation.',
      'A study using speech corpora from seventeen languages reported that languages with faster syllable rates tended to carry less information per syllable, and estimated a mean information rate of about thirty-nine bits per second across its sample. The individual rates varied. This result is evidence of a pattern in the languages studied, not proof that every language or speaker transmits information at one fixed universal rate.',
      'Researchers have explored whether models of speech and text can account for patterns in human communication. Automatically generated language can differ from human speech in its timing, structure and predictability, but these differences depend on the model and task. Information-rate findings may help frame future studies; they do not by themselves establish a design rule for speech synthesis or machine translation.',
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
      'A study using speech corpora from seventeen languages found that faster syllable rates tended to pair with less information per syllable, and estimated a mean information rate of about thirty-nine bits per second across its sample. Individual rates varied, so the result does not establish one fixed universal rate.',
    repeatSentences: [
      'Speech production reflects both the effort of speaking and the information a listener needs to recover.',
      'Some studies find that predictable material can be spoken more quickly or with reduced syllables.',
      'One study of seventeen languages estimated a mean information rate near thirty-nine bits per second.',
      'The individual information rates in that study varied across the languages sampled.',
      'Information-rate findings do not by themselves establish a design rule for speech synthesis.',
    ],
    swt: {
      id: 'swt-computational-linguistics',
      summary:
        'The passage describes research on information rate in speech. A study of seventeen languages found that faster syllable rates tended to pair with less information per syllable and estimated a mean rate near thirty-nine bits per second across its sample. The individual rates varied, so this is evidence of a pattern in the studied languages rather than a fixed universal rate.',
      excerptLabel: 'Entropy and Rate Convergence',
      excerpt: [
        'A study using speech corpora from seventeen languages reported that faster syllable rates tended to pair with less information per syllable. It estimated a mean information rate of about thirty-nine bits per second across its sample, while individual rates varied.',
      ],
      keyTerms: [
        'speaker economy',
        'listener comprehension',
        'information density',
        'Shannon entropy',
        'seventeen languages',
        'bits per second',
      ],
      minWords: 20,
    },
    dropdown: {
      id: 'fibd-computational-linguistics',
      text: 'Information theory uses Shannon entropy to describe the ______ of a message. Some studies find that predictable material can be spoken more quickly or with reduced ______. One study used speech corpora from ______ languages and estimated a mean information rate near thirty-nine bits per second across its sample. Individual rates ______, so the finding does not establish one fixed ______ rate.',
      bank: [
        'unpredictability',
        'syllables',
        'seventeen',
        'varied',
        'universal',
        'phonemes',
        'sentences',
        'uniform',
        'identical',
      ],
      answers: ['unpredictability', 'syllables', 'seventeen', 'varied', 'universal'],
    },
    tableFib: {
      id: 'fibt-computational-linguistics',
      context: [
        'Illustrative teaching data (not measurements from a published study) show how syllable speed and information density can combine to produce similar sample rates.',
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
        'What mean information rate did a study estimate across its sample of seventeen languages?',
      options: [
        'About thirty-nine bits per second, with individual rates varying across the sample',
        'All world languages share an identical inventory of vowel phonemes and consonant clusters',
        'Speakers across all languages pronounce exactly seven syllables per second on average',
        'Grammatical complexity decreases uniformly as geographic vocabulary size expands',
      ],
      correct: [
        'About thirty-nine bits per second, with individual rates varying across the sample',
      ],
    },
    mcqMultiple: {
      id: 'mcqm-computational-linguistics',
      question:
        'Which two adaptations do speakers exhibit when uttering predictable linguistic sequences?',
      options: [
        'They may speak predictable material more quickly or reduce syllables',
        'They may choose shorter, more familiar wording in some contexts',
        'They lengthen vowel durations and insert deliberate acoustic pauses',
        'They switch into phonologically denser grammatical case structures',
        'They maximize acoustic amplitude to eliminate phonetic background noise',
      ],
      correct: [
        'They may speak predictable material more quickly or reduce syllables',
        'They may choose shorter, more familiar wording in some contexts',
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
        question: 'What does the study report about information rates across its language sample?',
        options: [
          'A mean near thirty-nine bits per second, with individual rates varying',
          'Exactly thirty-nine bits per second for every language',
          'A rate that is unrelated to syllable speed',
        ],
        correct: 'A mean near thirty-nine bits per second, with individual rates varying',
      },
      {
        id: 'asq-ling-3',
        question: 'How may speakers deliver less predictable material in some studies?',
        options: ['With more time or emphasis', 'Only with louder speech', 'Without any pauses'],
        correct: 'With more time or emphasis',
      },
    ],
  },
  {
    id: 'satellite-hydrology',
    title: 'Monitoring Aquifers from Space',
    topic: 'Hydrological remote sensing',
    level: 'C1',
    paragraphs: [
      'Groundwater is the largest store of unfrozen freshwater, but monitoring it with wells alone can miss regional trends. The Gravity Recovery and Climate Experiment (GRACE) and its follow-on mission detect changes in Earth’s gravity field caused by shifts in mass, including changes in water stored on and beneath the land. They provide a regional view that complements measurements from wells and other sources; they do not measure individual aquifers directly from orbit.',
      'The GRACE satellites follow one another in orbit and use microwave ranging to track changes in the distance between them. Variations in gravity alter their motion and separation. Researchers use these measurements to estimate changes in total water storage over broad regions, then combine them with information about soil moisture, surface water and snow to estimate groundwater changes. The method is useful at regional scales but cannot identify the pumping rate of a particular well.',
      'Satellite observations have helped researchers identify sustained groundwater losses in several heavily used basins, including parts of northern India, the North China Plain and California’s Central Valley. The rate of loss and the balance between pumping and recharge vary over time and across each basin. In some aquifers, prolonged pumping compacts water-bearing sediments, which can cause land subsidence and permanently reduce the amount of water the aquifer can store.',
      'Satellite gravimetry can reveal where regional water storage is changing, but it cannot show which individual wells are responsible. Ground measurements, pumping records and local knowledge are needed to interpret the signal and guide decisions. Metering and limits on withdrawals are among the tools that water managers may consider, depending on local conditions and policy.',
    ],
    keyTerms: [
      'gravity field',
      'GRACE',
      'orbital perturbations',
      'aquifer depletion',
      'total water storage',
      'subsidence',
    ],
    readAloud:
      'The GRACE satellites follow one another in orbit and use microwave ranging to track changes in the distance between them. Variations in Earth’s gravity field alter their motion and separation. Researchers use these measurements to estimate changes in total water storage over broad regions, then combine them with information about soil moisture, surface water and snow to estimate groundwater changes.',
    repeatSentences: [
      'GRACE detects changes in Earth’s gravity field caused by shifts in mass, including changes in water storage.',
      'Researchers combine satellite estimates with other measurements to infer groundwater changes.',
      'Several heavily used basins have experienced sustained groundwater losses.',
      'In some aquifers, pumping can compact sediments and cause land subsidence.',
      'Ground measurements and local records help interpret regional satellite observations.',
    ],
    swt: {
      id: 'swt-satellite-hydrology',
      summary:
        'The passage explains that GRACE satellites track changes in Earth’s gravity field to estimate broad regional changes in total water storage. Researchers combine those estimates with other data to infer groundwater loss, but the satellites cannot identify individual wells. Ground measurements and local records help interpret the signal, and some heavily pumped aquifers can compact and subside.',
      excerptLabel: 'Orbital Gravimetry and Aquifer Collapse',
      excerpt: [
        'The GRACE satellites follow one another in orbit and use microwave ranging to track changes in the distance between them. Variations in Earth’s gravity field alter their motion and separation. Researchers use these measurements to estimate changes in total water storage over broad regions, then combine them with information about soil moisture, surface water and snow to estimate groundwater changes.',
        'In some aquifers, prolonged pumping compacts water-bearing sediments, which can cause land subsidence and permanently reduce the amount of water the aquifer can store.',
      ],
      keyTerms: [
        'groundwater',
        'gravimetric satellite',
        'orbital trajectories',
        'irrigation',
        'sediment compaction',
        'subsidence',
      ],
      minWords: 20,
    },
    dropdown: {
      id: 'fibd-satellite-hydrology',
      text: 'GRACE missions detect changes in Earth’s ______ field caused by shifts in mass, including water storage. The satellites use microwave ranging to track changes in their ______. Researchers combine these measurements with other data to estimate groundwater changes across broad ______. In some aquifers, prolonged pumping compacts sediments and can cause land ______. Local ground measurements and records help interpret the satellite ______.',
      bank: [
        'gravity',
        'separation',
        'regions',
        'subsidence',
        'signal',
        'magnetic',
        'altitude',
        'oceans',
        'noise',
      ],
      answers: ['gravity', 'separation', 'regions', 'subsidence', 'signal'],
    },
    tableFib: {
      id: 'fibt-satellite-hydrology',
      context: [
        'Illustrative teaching data (not measurements from a published study) show how regional satellite estimates might be paired with ground records across agricultural aquifer basins.',
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
      question:
        'How do twin GRACE satellites contribute to estimates of regional water-storage changes?',
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
        'Compaction of water-bearing sediments can cause land subsidence in some aquifers',
        'Some aquifers can permanently lose part of their water-storage capacity',
        'Sudden elevation in the chemical salinity horizon of deep atmospheric clouds',
        'Immediate expansion of surface river basin discharge during summer seasons',
        'Complete evaporation of unconfined soil moisture within mountain headwaters',
      ],
      correct: [
        'Compaction of water-bearing sediments can cause land subsidence in some aquifers',
        'Some aquifers can permanently lose part of their water-storage capacity',
      ],
    },
    asq: [
      {
        id: 'asq-hydro-1',
        question: 'What does GRACE measure to estimate changes in regional water storage?',
        options: [
          'Changes in Earth’s gravity field',
          'Individual well pumping rates',
          'Aquifer chemistry from orbit',
        ],
        correct: 'Changes in Earth’s gravity field',
      },
      {
        id: 'asq-hydro-2',
        question: 'Which satellite mission is named in the passage?',
        options: ['GRACE mission', 'Voyager probe', 'Hubble telescope'],
        correct: 'GRACE mission',
      },
      {
        id: 'asq-hydro-3',
        question: 'What can happen when prolonged pumping compacts sediments in some aquifers?',
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
      'Many economic models simplify decision-making by assuming that people have consistent preferences and can process available information. Research in psychology and behavioural economics shows that decisions are also shaped by limited attention, habits and context. Choice architecture describes how options are presented, including which option is selected by default. Changing a default can influence behaviour, but the effect depends on the decision, the people involved and the surrounding institutions.',
      'Organ donation is often used to illustrate the possible influence of defaults. Countries with presumed-consent systems, where people are listed as donors unless they object, have often reported higher registration rates than countries using opt-in systems. These comparisons do not establish that the default alone caused the difference: laws, public trust, awareness and registration procedures also vary. Defaults can matter, but their effects should be evaluated in context.',
      'Transparency and ethics remain contested frontiers in behavioral economics. Critics argue that subtle nudges can become paternalistic manipulations when deployed by state authorities without democratic oversight. When decision environments manipulate salience, such as burying subscription cancellation buttons or exploiting hyperbolic discounting through deferred payment options, choice architecture crosses into predatory dark patterns designed to extract surplus rather than promote public welfare.',
      'A regulatory framework can distinguish between a nudge that preserves meaningful choice and a design that obscures or obstructs alternatives. Good practice includes making options clear, keeping opt-out routes accessible and assessing effects with evidence. Choice architecture may help public institutions address challenges such as retirement savings or energy use, but it should be transparent and accountable.',
    ],
    keyTerms: [
      'choice architecture',
      'heuristics',
      'default selection',
      'default',
      'public accountability',
      'dark patterns',
    ],
    readAloud:
      'Many economic models simplify decision-making, while psychology and behavioural economics show that limited attention, habits and context also shape choices. Choice architecture describes how options are presented, including which option is selected by default.',
    repeatSentences: [
      'Research suggests that limited attention, habits and context can shape people’s decisions.',
      'Changing a default can influence behaviour, but its effect depends on the decision and setting.',
      'Countries with presumed-consent donor systems have often reported higher registration rates.',
      'Country comparisons cannot isolate the effect of a donor-registration default by themselves.',
      'Transparent choice architecture should keep alternative options accessible.',
    ],
    swt: {
      id: 'swt-behavioral-nudge',
      summary:
        'The passage explains that how options are presented, including the default, can influence decisions. It uses organ-donation systems to show why country comparisons need caution: laws, trust, awareness and registration procedures also differ. It concludes that choice architecture should preserve meaningful choice, make alternatives accessible and remain transparent and accountable.',
      excerptLabel: 'Defaults and Ethical Architecture',
      excerpt: [
        'Choice architecture describes how options are presented, including which option is selected by default. Changing a default can influence behaviour, but the effect depends on the decision, the people involved and the surrounding institutions.',
        'Countries with presumed-consent systems have often reported higher donor-registration rates than countries using opt-in systems. These comparisons do not establish that the default alone caused the difference, because laws, public trust, awareness and registration procedures also vary.',
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
      text: 'Decision-making can be shaped by limited attention, habits and ______. Choice architecture describes how options are ______, including which is selected by default. Changing a default can influence behaviour, but its effect depends on the decision and surrounding ______. Country comparisons of organ donation systems cannot show that the default alone caused differences in ______ rates. Good practice keeps alternatives clear and ______.',
      bank: [
        'context',
        'presented',
        'institutions',
        'registration',
        'accessible',
        'mandates',
        'certainty',
        'regimes',
        'coercive',
      ],
      answers: ['context', 'presented', 'institutions', 'registration', 'accessible'],
    },
    tableFib: {
      id: 'fibt-behavioral-nudge',
      context: [
        'Illustrative teaching data (not measurements from a published study) compare participation rates before and after example default changes.',
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
      question: 'Why can changing a default influence people’s choices?',
      options: [
        'Because the default is one way options are presented, and presentation can shape decisions',
        'Because defaults carry legal penalties in every public programme',
        'Because all people prefer the same option in every setting',
        'Because an opt-out choice is always impossible to complete',
      ],
      correct: [
        'Because the default is one way options are presented, and presentation can shape decisions',
      ],
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
