import type { Passage } from './schema'

/**
 * Two further passages, added to lift Fill in the Blanks (Dropdown) and
 * Fill in the Blanks (Table), the two types still sitting at the bottom of the
 * coverage table. Each passage feeds five reading item types at once.
 *
 * Word banks here contain no duplicates by construction, and the ASQ items use
 * three options as the format does — both are now asserted by the bank check.
 */
export const EXTRA_PASSAGES_3: Passage[] = [
  {
    id: 'cost-of-aviation',
    title: 'The Cost of a Departure',
    topic: 'Aviation policy',
    level: 'C1',
    paragraphs: [
      "Aviation is usually discussed as a technical problem with a technical fix: aircraft are inefficient, fuels are carbon intensive, and both can be improved by better engineering. The arithmetic is less clear, because a large share of a flight's climate impact does not come from the airframe at all.",
      'At a typical altitude the atmosphere is far colder and drier than at sea level, and a combustion engine must work harder to produce useful thrust in those conditions. The second contribution is less visible: water vapour, contrails and nitrogen oxides emitted at altitude alter the radiative balance of the upper atmosphere, and the scientific uncertainty over the magnitude of that effect is larger than the uncertainty over any aircraft efficiency improvement now in development.',
      'This is why efficiency gains have repeatedly disappointed expectations. A given percentage improvement in fuel burn addresses the smaller and better understood part of the problem, while the larger part remains governed by physics that an engine designer cannot change.',
      'That conclusion is politically awkward, because the alternatives to flying are uneven. A domestic flight may have a viable rail substitute; a short-haul island route may have none, and for those passengers the realistic choice is flying or losing a connection with family. Any policy that treats the mode as uniformly substitutable misreads the map.',
      'Offsetting is a third response and the weakest of the three. A tonne of carbon avoided elsewhere does not remove the contrail, and an offset programme is easier to run than to verify. The measure with the clearest evidence behind it remains the least comfortable one: flying less.',
      'The most promising near-term work is not aerodynamic. Improving the accuracy of forecasts, allowing airspace to be used more efficiently, and reducing the weight of what is carried on board deliver more reliably than any new airframe.',
    ],
    keyTerms: ['contrails', 'altitude', 'fuel burn', 'offsets', 'substitutable', 'efficiency'],
    readAloud:
      'Aviation is usually discussed as a technical problem with a technical fix: aircraft are inefficient, fuels are carbon intensive, and both can be improved by better engineering. The framing is convenient because it implies that the alternatives are worse.',
    repeatSentences: [
      'A large share of the impact of a flight does not come from the airframe at all.',
      'The scientific uncertainty over contrail effects exceeds that over efficiency.',
      'Removing a flight beats improving the aircraft that would otherwise have flown.',
      'A tonne of carbon avoided elsewhere does not remove the contrail.',
      'Forecast accuracy delivers gains far more reliably than a new airframe does.',
    ],
    swt: {
      id: 'swt-cost-of-aviation',
      summary:
        "The passage argues that aviation's climate impact is dominated by effects at altitude whose magnitude is scientifically uncertain, which is why fuel efficiency gains disappoint, and that the only measures with clear evidence behind them are reducing flying and improving operational accuracy.",
      excerptLabel: 'Why efficiency disappoints',
      excerpt: [
        'This is why efficiency gains have repeatedly disappointed expectations. A given percentage improvement in fuel burn addresses the smaller and better understood part of the problem, while the larger part remains governed by physics that an engine designer cannot change. It also explains why removing a flight, rather than improving it, produces a reliably larger reduction than any technical roadmap can promise for the aircraft that would otherwise have flown.',
        'The most promising near-term work is not aerodynamic. Improving the accuracy of forecasts, allowing airspace to be used more efficiently, and reducing the weight of what is carried on board deliver more reliably than any new airframe. None of these is exciting, and together they amount to a few per cent rather than the severalfold improvement the sector has occasionally implied is available.',
      ],
      keyTerms: ['efficiency', 'fuel burn', 'altitude', 'reducing flying', 'forecasts', 'per cent'],
      minWords: 20,
    },
    dropdown: {
      id: 'fibd-cost-of-aviation',
      text: "A large share of a flight's impact does not come from the ______ at all. A combustion engine must work harder at ______ , which raises the fuel bill, and the uncertainty over the effect of ______ is larger than the uncertainty over efficiency. Treating the mode as uniformly ______ misreads the map, because some routes have no substitute.",
      bank: [
        'airframe',
        'altitude',
        'contrails',
        'substitutable',
        'fuselage',
        'interchangeable',
        'cabin',
        'cruise',
        'universal',
      ],
      answers: ['airframe', 'altitude', 'contrails', 'substitutable'],
    },
    tableFib: {
      id: 'fibt-cost-of-aviation',
      context: [
        'An airline modelled the effect of three interventions on its own annual fuel use. The table reports the estimated reduction in fuel burn, the estimated reduction in radiative forcing, and the confidence the modeller assigned to each figure.',
      ],
      headers: ['Intervention', 'Fuel reduction', 'Forcing reduction', 'Confidence'],
      rows: [
        ['New airframe', '18%', '19%', 'High'],
        ['Weight reduction', '4%', null, 'High'],
        ['Forecast accuracy', '7%', '8%', null],
        ['Fewer departures', '100%', '100%', 'Moderate'],
      ],
      answers: ['Same as fuel reduction', '9%'],
    },
    mcqSingle: {
      id: 'mcqs-cost-of-aviation',
      question:
        'According to the second paragraph, why does a combustion engine burn more fuel at altitude?',
      options: [
        'The air at altitude is colder and drier',
        'The air is denser and requires more lift',
        'The engines must run at higher revolutions',
        'The contrails increase aerodynamic drag',
      ],
      correct: ['The air at altitude is colder and drier'],
    },
    mcqMultiple: {
      id: 'mcqm-cost-of-aviation',
      question: 'Which two does the passage identify as reasons efficiency gains disappoint?',
      options: [
        'Aircraft efficiency addresses the smaller share of the impact',
        'Fuel prices make efficiency unprofitable',
        'The larger share is governed by physics a designer cannot change',
        'New airframes take too long to certify',
        'Passengers prefer more direct routes',
      ],
      correct: [
        'Aircraft efficiency addresses the smaller share of the impact',
        'The larger share is governed by physics a designer cannot change',
      ],
    },
    asq: [
      {
        id: 'asq-aviation-1',
        question: 'What does the passage say contrail effects do?',
        options: [
          'Alter the radiative balance',
          'Reduce aerodynamic drag',
          'Increase fuel efficiency',
        ],
        correct: 'Alter the radiative balance',
      },
      {
        id: 'asq-aviation-2',
        question: 'Why does the passage call offsetting the weakest response?',
        options: [
          'A tonne avoided elsewhere does not remove the contrail',
          'Offsets are too expensive to run',
          'Aviation cannot be offset at all',
        ],
        correct: 'A tonne avoided elsewhere does not remove the contrail',
      },
      {
        id: 'asq-aviation-3',
        question: 'What does the passage say about treating the mode as substitutable?',
        options: ['It misreads the map', 'It is required by law', 'It is economically necessary'],
        correct: 'It misreads the map',
      },
    ],
  },

  {
    id: 'endangered-list',
    title: 'What Counts as Recovered',
    topic: 'Conservation policy',
    level: 'C1',
    paragraphs: [
      'A species is declared recovered when its population passes a threshold, and the threshold is usually a number: a few thousand breeding adults, sustained over a period of years. The rule has the merit of being administrable.',
      'The first difficulty is that a population count is a snapshot of a distribution, and distributions are unevenly distributed. A species may exceed the threshold across its whole range and still be functionally absent from ninety per cent of it, having concentrated into a single favourable habitat.',
      'The second is that the same total can arise from very different histories. A population that never declined and one that fell to a hundred animals and rebuilt have identical counts now. The second has passed through a bottleneck, and the diversity lost at the bottleneck is not recoverable by population growth, because the alleles are gone rather than rare.',
      'The third difficulty concerns what the count is measuring. A breeding adult count tracks animals that reproduce successfully, which is not the same as animals that contribute to population viability.',
      'The reform that follows is not simply to record more. It is to record the shape of the population rather than its size: the number of distinct breeding sites, the spread of genetic diversity through those sites, and the ratio of the count to the number of sites, which falls continuously as a population concentrates. A recovered population should have a rising count, a stable or rising number of sites, and a stable ratio between them.',
      'It is worth being clear that this makes the criterion harder. A species declared recovered against a distribution criterion can only be relisted by showing the distribution itself changed, which requires the monitoring to have been in place beforehand. It moves the work earlier, where it can still influence the outcome.',
    ],
    keyTerms: [
      'threshold',
      'distribution',
      'bottleneck',
      'effective population size',
      'monitoring',
      'relisted',
    ],
    readAloud:
      'A species is declared recovered when its population passes a threshold, and the threshold is usually a number: a few thousand breeding adults, sustained over a period of years. The rule has the merit of being administrable.',
    repeatSentences: [
      'A population count is a snapshot of a distribution, and distributions are uneven.',
      'Numerical recovery and practical fragility can both describe one population.',
      'A genetic bottleneck removes alleles entirely rather than leaving them merely rare.',
      'The breeding count can rise while the effective population size continues to fall.',
      'The reform is to record the shape of a population rather than its size alone.',
    ],
    swt: {
      id: 'swt-endangered-list',
      summary:
        'The passage argues that a single population threshold conceals three problems — that a concentrated population is numerically recovered but fragile, that equal counts can mean different histories, and that breeding counts are not viability — and proposes recording distribution shape and site spread instead of size alone.',
      excerptLabel: 'Three problems with a single number',
      excerpt: [
        'The second is that the same total can arise from very different histories. A population that never declined and a population that fell to a hundred animals and rebuilt have identical counts now and nothing in common in genetic terms. The second has passed through a bottleneck, and the diversity lost at the bottleneck is not recoverable by population growth, because the alleles are gone rather than out of proportion. Whether this matters is contested, and the contest is itself the point: the number is capable of meaning recovery or merely abundance, and policy has been choosing the convenient reading.',
        'The reform that follows is not simply to record more. It is to record the shape of the population rather than its size: the number of distinct breeding sites, the spread of genetic diversity through those sites, and the ratio of the count to the number of sites, which falls continuously as a population concentrates. A recovered population should have a rising count, a stable or rising number of sites, and a stable ratio between them. Populations that satisfy the first and fail the others are, on any reasonable reading, still declining.',
      ],
      keyTerms: ['threshold', 'bottleneck', 'distribution', 'breeding sites', 'ratio', 'declining'],
      minWords: 20,
    },
    dropdown: {
      id: 'fibd-endangered-list',
      text: 'A population count is a snapshot of a ______ , and distributions are uneven. A species may exceed the threshold across its range and still be absent from most of it, having ______ into one habitat. The diversity lost at a ______ is not recoverable by growth, because the alleles are gone. The reform is to record the ______ of the population rather than its size alone.',
      bank: [
        'distribution',
        'concentrated',
        'bottleneck',
        'shape',
        'spread',
        'density',
        'expansion',
        'recovery',
        'weighting',
      ],
      answers: ['distribution', 'concentrated', 'bottleneck', 'shape'],
    },
    tableFib: {
      id: 'fibt-endangered-list',
      context: [
        'Four populations of the same species were assessed against the recovery criterion. The table records total breeding adults, the number of distinct breeding sites, and the assessment each population received from the monitoring framework.',
      ],
      headers: ['Population', 'Breeding adults', 'Breeding sites', 'Assessment'],
      rows: [
        ['A', '4,200', '11', 'Recovered'],
        ['B', '4,050', '9', 'Recovered'],
        ['C', '4,310', null, 'Recovered'],
        ['D', '4,180', null, 'Recovered'],
      ],
      answers: ['5', '2'],
    },
    mcqSingle: {
      id: 'mcqs-endangered-list',
      question:
        'According to the third paragraph, why is a bottleneck not repaired by population growth?',
      options: [
        'The alleles are gone rather than rare',
        'The population is too small to recover',
        'Growth cannot happen quickly enough',
        'The habitat has been permanently lost',
      ],
      correct: ['The alleles are gone rather than rare'],
    },
    mcqMultiple: {
      id: 'mcqm-endangered-list',
      question: 'Which two does the passage say monitoring frameworks fail to capture?',
      options: [
        'How a population is spread across sites',
        'Whether individuals are breeding successfully',
        'The annual change in rainfall',
        'The cost of the monitoring programme',
        'Whether the threshold has been formally set',
      ],
      correct: [
        'How a population is spread across sites',
        'Whether individuals are breeding successfully',
      ],
    },
    asq: [
      {
        id: 'asq-list-1',
        question: 'What does the passage say a concentrated population is?',
        options: [
          'Numerically recovered and fragile',
          'Recovered and secure',
          'Declining and unmanaged',
        ],
        correct: 'Numerically recovered and fragile',
      },
      {
        id: 'asq-list-2',
        question: 'What ratio does the passage propose recording?',
        options: ['Count to number of sites', 'Sites to total area', 'Count to rainfall'],
        correct: 'Count to number of sites',
      },
      {
        id: 'asq-list-3',
        question: 'What does the passage say the reform does?',
        options: [
          'Moves the work earlier',
          'Removes the need for monitoring',
          'Makes the criterion easier',
        ],
        correct: 'Moves the work earlier',
      },
    ],
  },
]
