import type { Passage } from './schema'
import { EXTRA_PASSAGES } from './passagesExtra'
import { EXTRA_PASSAGES_2 } from './passagesExtra2'
import { EXTRA_PASSAGES_3 } from './passagesExtra3'
import { EXTRA_PASSAGES_4 } from './passagesExtra4'
import { EXTRA_PASSAGES_5 } from './passagesExtra5'
import { EXTRA_PASSAGES_6 } from './passagesExtra6'
import { EXTRA_PASSAGES_7 } from './passagesExtra7'

export const PASSAGES: Passage[] = (
  [
    {
      id: 'urban-heat',
      title: 'Cities as Heat Islands',
      topic: 'Urban climatology',
      level: 'C1',
      paragraphs: [
        'For most of human history, the temperature of a city tracked the temperature of the countryside surrounding it. That relationship began to break down during the twentieth century, and the reason is material rather than meteorological. Pavement, brick and roofing absorb short-wave solar radiation during the day and release it slowly as long-wave radiation after sunset.',
        'The magnitude of this urban heat island depends on more than population density. A low, compact city built of pale stone in a dry climate may be no warmer than its surroundings, whereas a high-rise city of dark roofs in a humid subtropical basin can run eight degrees warmer at night. Humidity matters because evaporative cooling, the main mechanism by which vegetation cools the air, is progressively suppressed as the air approaches saturation.',
        'The consequences are not evenly distributed within a city. Neighbourhoods built in the postwar period, with wide roads, low vegetation and large parking areas, are consistently warmer than the dense, tree-lined districts of the nineteenth century. Public health studies in several countries have found that heat-related hospital admissions cluster in those same districts, and that the risk is highest among elderly residents, people living alone, and households without reliable cooling.',
        'The most effective interventions are also the least glamorous. Street trees reduce surface and air temperatures more reliably and more cheaply than reflective roofing, because a canopy shades both the surface that would otherwise absorb radiation and the pedestrian that would otherwise absorb it. Reflective surfaces work well but can shift rather than remove heat, particularly when the reflected radiation is directed towards unshaded housing.',
        'What is clear is that the heat island is not a fixed feature of urbanisation but an outcome of specific, reversible design decisions. A city that wished to reduce its heat island would not begin with a new technology. It would begin by inventorying the surfaces it already has.',
      ],
      keyTerms: [
        'urban heat island',
        'long-wave radiation',
        'humidity',
        'evaporative cooling',
        'canopy',
        'permeable paving',
      ],
      readAloud:
        'The magnitude of this urban heat island depends on more than population density. A low, compact city built of pale stone in a dry climate may be no warmer than its surroundings, whereas a high-rise city of dark roofs in a humid subtropical basin can run eight degrees warmer at night.',
      repeatSentences: [
        'Pavement, brick and roofing absorb short-wave solar radiation during the day and release it slowly afterwards.',
        'Cities that combine high humidity with heavy surface cover experience the sharpest warming at night.',
        'Heat-related hospital admissions cluster in districts with wide roads and very little vegetation.',
        'A tree canopy shades both the surface that would absorb radiation and the pedestrian who would absorb it.',
        'The heat island is an outcome of specific and largely reversible design decisions rather than a fixed feature.',
      ],
      swt: {
        id: 'swt-urban-heat',
        summary:
          'The passage explains that dense cities absorb short-wave solar radiation by day and release it as long-wave radiation at night, while humid air suppresses the evaporative cooling that vegetation provides, so surface material and local climate together determine how much heat a city retains.',
        excerptLabel: 'The physical mechanism',
        excerpt: [
          'For most of human history, the temperature of a city tracked the temperature of the countryside surrounding it. That relationship began to break down during the twentieth century, and the reason is material rather than meteorological. Pavement, brick and roofing absorb short-wave solar radiation during the day and release it slowly as long-wave radiation after sunset. The atmosphere above a dense city therefore receives energy that the rural atmosphere does not, and the effect is now large enough to be measured from orbit.',
          'Humidity matters because evaporative cooling, the main mechanism by which vegetation cools the air, is progressively suppressed as the air approaches saturation. Cities that combine high humidity with heavy surface cover therefore experience the sharpest nocturnal warming, and the effect persists after the sun has gone down.',
        ],
        keyTerms: [
          'absorb',
          'short-wave',
          'release',
          'long-wave radiation',
          'evaporative cooling',
          'humidity',
        ],
        minWords: 20,
      },
      dropdown: {
        id: 'fibd-urban-heat',
        text: 'The magnitude of the urban heat island is not a function of population ______ alone. Humidity matters because evaporative ______ , the main mechanism by which vegetation cools the air, is suppressed as the air approaches ______ . Street trees reduce surface and air temperatures more ______ than reflective roofing, because a canopy shades both the surface and the pedestrian. Where rainfall already exceeds demand, ______ paving offers little benefit because there is no water to hold.',
        bank: [
          'density',
          'cooling',
          'saturation',
          'reliably',
          'permeable',
          'sparsity',
          'transparent',
          'equilibrium',
          'precisely',
        ],
        answers: ['density', 'cooling', 'saturation', 'reliably', 'permeable'],
      },
      tableFib: {
        id: 'fibt-urban-heat',
        context: [
          'Researchers in four cities recorded mean summer daytime and night-time air temperatures across a sample of neighbourhoods matched for population but differing in surface cover. The table summarises the gap between the warmest and coolest sampled district in each city. City D had light roofs and dense canopy; City E had moderate humidity.',
        ],
        headers: ['City', 'Surface cover', 'Day gap (°C)', 'Night gap (°C)', 'Humidity'],
        rows: [
          ['A', 'Dark roofs, low canopy', '3.1', '2.6', 'High'],
          ['B', 'Mixed, moderate canopy', '1.8', '1.2', 'Moderate'],
          ['C', 'Pale roofs, dense canopy', '0.9', '0.4', 'Low'],
          ['D', null, '1.4', '1.0', 'High'],
          ['E', 'Asphalt parking, no canopy', '3.4', '3.1', null],
        ],
        answers: ['Light roofs, dense canopy', 'Moderate'],
      },
      mcqSingle: {
        id: 'mcqs-urban-heat',
        question:
          'According to the fourth paragraph, what limits the effectiveness of reflective surfaces?',
        options: [
          'They direct heat towards unshaded housing',
          'They become less effective in dry climates',
          'They require regular maintenance to remain reflective',
          'They interfere with local rainfall patterns',
        ],
        correct: ['They direct heat towards unshaded housing'],
      },
      mcqMultiple: {
        id: 'mcqm-urban-heat',
        question:
          'Which two factors does the passage identify as increasing the risk of heat-related illness?',
        options: [
          'Living in a district with little vegetation',
          'Owning a vehicle',
          'Being elderly or living alone',
          'Having access to reliable cooling',
          'Working outside during the afternoon',
        ],
        correct: ['Living in a district with little vegetation', 'Being elderly or living alone'],
      },
      asq: [
        {
          id: 'asq-urban-1',
          question: 'According to the passage, what does vegetation do to the air?',
          options: [
            'Lowers its temperature',
            'Raises its humidity permanently',
            'Removes its particles',
          ],
          correct: 'Lowers its temperature',
        },
        {
          id: 'asq-urban-2',
          question: 'Which period does the passage single out as the worst for heat?',
          options: ['Sunset and after', 'Early morning', 'Midday only'],
          correct: 'Sunset and after',
        },
        {
          id: 'asq-urban-3',
          question: 'What does the author say a city should inventory first?',
          options: ['Its existing surfaces', 'Its residents', 'Its rainfall records'],
          correct: 'Its existing surfaces',
        },
      ],
    },

    {
      id: 'gut-brain',
      title: 'The Second Brain in the Abdomen',
      topic: 'Microbiology',
      level: 'C1',
      paragraphs: [
        'The human gut hosts a vast community of microorganisms. An often-repeated estimate placed the number of bacteria in the whole body at roughly one hundred trillion, but later work revised it to about thirty-eight trillion, close to the estimated thirty trillion human cells. For decades the gut community was treated as a passive collection of passengers. The change in that view was driven less by a single discovery than by a technical one: it became possible to sequence large mixed populations cheaply, and therefore to ask, rather than guess, what the organisms were doing.',
        'One important capability is the production of short-chain fatty acids, metabolic by-products that gut organisms generate from dietary fibre the host cannot digest. Microbes can also influence neurotransmitter signalling: microbial metabolites can prompt host enterochromaffin cells in the gut to increase serotonin synthesis. The serotonin is made by host cells, and the extent to which gut-derived serotonin affects the brain remains under study.',
        'The evidence linking the gut to behaviour is real but weaker than the publicity suggests. In animal models, transferring gut organisms between individuals reliably changes anxiety-like behaviour, and the effect persists only when the recipient can digest the relevant dietary fibre. In humans, the association between gut composition and mood is correlational: people with higher levels of certain organisms report lower anxiety, but people with anxiety may also eat differently, take different medication and sleep less, all of which reshape the gut.',
        'The clearest intervention results come from what patients already do. When a diet low in fibre is corrected, the population of fibre-fermenting organisms rises within days, often before any measurable change in mood. The reason is straightforward: the organisms are responding to a substrate that is actually available. Effects from a single-organism supplement can vary with the strain and the recipient’s diet, so a result for one product should not be generalized to every product.',
        'Evidence for probiotic products is specific to the strain and condition studied. A diet low in fibre can be improved at low cost, although a change in gut organisms does not guarantee a change in mood.',
      ],
      keyTerms: [
        'microorganisms',
        'short-chain fatty acids',
        'dietary fibre',
        'neurotransmitters',
        'correlation',
        'diversity',
      ],
      readAloud:
        'The clearest intervention results come from what patients already do. When a diet low in fibre is corrected, the population of fibre-fermenting organisms rises within days, often before any measurable change in mood, because the organisms are responding to a substrate that is actually available.',
      repeatSentences: [
        'The gut hosts a vast community of microorganisms whose effects researchers are still studying.',
        'Sequencing large mixed populations cheaply allowed researchers to ask what the organisms were doing.',
        'These compounds are the principal fuel for the cells that line the large intestine.',
        'People with anxiety may also eat differently, take medication and sleep less than others.',
        'A community fed a single input tends to collapse toward a less diverse equilibrium.',
      ],
      swt: {
        id: 'swt-gut-brain',
        summary:
          'The passage explains that gut bacteria ferment dietary fibre into short-chain fatty acids and can influence host serotonin synthesis, while the human evidence linking gut composition to mood remains correlational and probiotic findings depend on the strain and condition studied.',
        excerptLabel: 'What the evidence shows',
        excerpt: [
          'The evidence linking the gut to behaviour is real but weaker than the publicity suggests. In animal models, transferring gut organisms between individuals reliably changes anxiety-like behaviour, and the effect persists only when the recipient can digest the relevant dietary fibre. In humans, the association between gut composition and mood is correlational: people with higher levels of certain organisms report lower anxiety, but people with anxiety may also eat differently, take different medication and sleep less, all of which reshape the gut. Correlation of this kind cannot establish direction.',
          'The clearest intervention results come from diet rather than supplements. When a diet low in fibre is corrected, the population of fibre-fermenting organisms rises within days, often before any measurable change in mood.',
        ],
        keyTerms: [
          'animal models',
          'anxiety',
          'correlational',
          'diet',
          'medication',
          'sleep',
          'fibre',
          'direction',
        ],
        minWords: 20,
      },
      dropdown: {
        id: 'fibd-gut-brain',
        text: 'The human gut hosts a vast community of ______ . Gut organisms generate short-chain fatty acids from dietary ______ the host cannot digest. Microbial metabolites can prompt host cells in the gut to increase ______ synthesis. Evidence for probiotic products is specific to the strain and condition ______ .',
        bank: [
          'microorganisms',
          'fibre',
          'serotonin',
          'diverse',
          'studied',
          'permanent',
          'inert',
          'homogeneous',
          'collagen',
          'predictable',
        ],
        answers: ['microorganisms', 'fibre', 'serotonin', 'studied'],
      },
      tableFib: {
        id: 'fibt-gut-brain',
        context: [
          'A cross-sectional survey of 1,200 adults recorded average daily fibre intake, self-reported anxiety score and the measured abundance of butyrate-producing organisms. Results are grouped by fibre intake quartile. The Q3 group had high abundance of butyrate-producing organisms.',
        ],
        headers: ['Fibre intake', 'Mean intake (g)', 'Mean anxiety score', 'Butyrate producers'],
        rows: [
          ['Q1 (lowest)', '11', '7.8', 'Low'],
          ['Q2', '18', '6.9', 'Moderate'],
          ['Q3', '26', '5.7', null],
          ['Q4 (highest)', '34', '5.1', 'High'],
          ['Survey design', null, 'Self-reported', 'Measured by sequencing'],
        ],
        answers: ['High', 'Cross-sectional'],
      },
      mcqSingle: {
        id: 'mcqs-gut-brain',
        question: 'Why does the author describe the human data as correlational?',
        options: [
          'Confounding behaviours may change gut composition',
          'Too few participants were studied',
          'Mood cannot be measured reliably',
          'Animal results did not replicate',
        ],
        correct: ['Confounding behaviours may change gut composition'],
      },
      mcqMultiple: {
        id: 'mcqm-gut-brain',
        question: 'Which two claims does the author make about probiotic evidence?',
        options: [
          'Results can depend on the strain and the recipient’s diet',
          'They are expensive to produce',
          'Findings for one product should not be generalized to every product',
          'They reliably improve mood across people',
          'They replace the need for dietary fibre',
        ],
        correct: [
          'Results can depend on the strain and the recipient’s diet',
          'Findings for one product should not be generalized to every product',
        ],
      },
      asq: [
        {
          id: 'asq-gut-1',
          question: 'What dietary component fuels the fibre-fermenting organisms?',
          options: ['Dietary fibre', 'Protein', 'Fat'],
          correct: 'Dietary fibre',
        },
        {
          id: 'asq-gut-2',
          question: 'Which technology changed how scientists studied the gut?',
          options: ['Cheap sequencing', 'Electron microscopy', 'Electrophoresis'],
          correct: 'Cheap sequencing',
        },
        {
          id: 'asq-gut-3',
          question: 'How quickly do organisms respond to a corrected diet?',
          options: ['Within days', 'Within six months', 'Only after a year'],
          correct: 'Within days',
        },
      ],
    },

    {
      id: 'attention-economy',
      title: 'The Economics of Attention',
      topic: 'Behavioural economics',
      level: 'C1',
      paragraphs: [
        "Herbert Simon observed in 1971 that a wealth of information creates a poverty of attention, and that attention is therefore what a buyer purchases. The observation has aged well, largely because the conditions that made it true have become more extreme rather than less. The scarcity that was assumed in Simon's formulation no longer applies to information, and the price of attention has consequently fallen to nearly zero, which is precisely what makes the market for capturing it so fiercely contested.",
        'A platform that competes for attention must answer a structural question: what is the most reliable way to stop a user from leaving? Abundant evidence from behavioural research suggests that the answer is interruption rather than satisfaction. A satisfied user leaves; an interrupted user returns to check what the interruption was about.',
        'Critics have argued for decades that this is an equilibrium that the industry cannot escape, because the business model depends on it. The argument is strong on commercial grounds and weak on empirical ones. The counter-evidence comes from subscription products, where revenue is collected once rather than per impression, and where the incentive to interrupt is substantially reduced.',
        'Regulation has so far addressed the most visible symptoms rather than the mechanism. Restrictions on dark patterns, consent banners and the use of certain interface elements have forced disclosure, but disclosure does not alter an incentive.',
        'The more useful frame is not whether a given design is manipulative, which is reliably arguable in both directions, but whether the user could obtain the same value with a different design. Where an alternative exists and is not the default, the burden of proof belongs to the design that captures the most attention, because that design is the one that must justify the cost it imposes.',
      ],
      keyTerms: [
        'poverty of attention',
        'interruption',
        'equilibrium',
        'disclosure',
        'incentive',
        'burden of proof',
      ],
      readAloud:
        'A satisfied user leaves; an interrupted user returns to check what the interruption was about. This produces a measurable and slightly perverse outcome — the design decisions that maximise time-on-platform are frequently the same decisions that most annoy the people subject to them.',
      repeatSentences: [
        'A wealth of information creates a poverty of attention, and attention is what a buyer purchases.',
        'The price of attention has fallen to nearly zero, which makes the market for capturing it so contested.',
        'The business model depends on the very behaviour that regulators find difficult to prohibit.',
        'Disclosure does not alter an incentive, though it does alter the content of the warning.',
        'Where an alternative exists and is not the default, the burden of proof belongs to the capturing design.',
      ],
      swt: {
        id: 'swt-attention',
        summary:
          'The passage argues that platforms compete for attention by interruption rather than satisfaction, that subscription models show this is not unavoidable, and that regulation has so far addressed disclosure rather than the incentive that produces the behaviour.',
        excerptLabel: 'Interruption as strategy',
        excerpt: [
          'A platform that competes for attention must answer a structural question: what is the most reliable way to stop a user from leaving? Abundant evidence from behavioural research suggests that the answer is interruption rather than satisfaction. A satisfied user leaves; an interrupted user returns to check what the interruption was about. This produces a measurable and slightly perverse outcome — the design decisions that maximise time-on-platform are frequently the same decisions that most annoy the people subject to them, and both facts are reported in the same internal metrics.',
          'Critics have argued for decades that this is an equilibrium that the industry cannot escape, because the business model depends on it. The argument is strong on commercial grounds and weak on empirical ones.',
        ],
        keyTerms: [
          'interruption',
          'satisfaction',
          'design decisions',
          'time on platform',
          'equilibrium',
          'business model',
        ],
        minWords: 20,
      },
      dropdown: {
        id: 'fibd-attention',
        text: 'Simon observed in 1971 that a wealth of information creates a poverty of ______ , and that attention is what a buyer purchases. Research suggests that the most reliable way to retain a user is ______ rather than satisfaction, because a satisfied user leaves permanently. Critics argue that this is an ______ that the industry cannot escape while the business model depends on it. Regulation has addressed visible symptoms rather than the mechanism, since disclosure does not ______ an incentive.',
        bank: [
          'attention',
          'interruption',
          'equilibrium',
          'alter',
          'scarcity',
          'imbalance',
          'raise',
          'innovation',
          'reflect',
        ],
        answers: ['attention', 'interruption', 'equilibrium', 'alter'],
      },
      tableFib: {
        id: 'fibt-attention',
        context: [
          'Two comparable content services were compared over twelve months. Service A sold advertising and optimised for time on platform. Service B sold subscriptions and optimised for retention among paying customers. Service B sent 0.4 notifications per session; Service A had monthly churn of 3.4%. No other significant difference was observed.',
        ],
        headers: ['Metric', 'Service A (ads)', 'Service B (subscription)'],
        rows: [
          ['Median daily minutes', '54', '31'],
          ['Notifications per session', null, '0.4'],
          ['Monthly churn', 'Not published', null],
          ['Median satisfaction score', '4.1', '6.8'],
          ['Revenue per user (index)', '100', '72'],
        ],
        answers: ['7.2', '3.4%'],
      },
      mcqSingle: {
        id: 'mcqs-attention',
        question: 'What does the author identify as the main weakness of the industry defence?',
        options: [
          'It rests on commercial rather than empirical reasoning',
          'It ignores the effect on advertising revenue',
          'It is contradicted by the subscription model',
          'It assumes users are passive',
        ],
        correct: ['It rests on commercial rather than empirical reasoning'],
      },
      mcqMultiple: {
        id: 'mcqm-attention',
        question: 'Which two statements about regulation does the passage support?',
        options: [
          'It has forced disclosure of dark patterns',
          'It has abolished the advertising model',
          'It has targeted symptoms rather than incentives',
          'It has reduced notification volumes',
          'It requires user consent for cookies',
        ],
        correct: [
          'It has forced disclosure of dark patterns',
          'It has targeted symptoms rather than incentives',
        ],
      },
      asq: [
        {
          id: 'asq-attn-1',
          question: 'Who published the poverty of attention observation?',
          options: ['Herbert Simon', 'Adam Smith', 'John Maynard Keynes'],
          correct: 'Herbert Simon',
        },
        {
          id: 'asq-attn-2',
          question: 'What does a satisfied user usually do?',
          options: ['Leaves', 'Shares more content', 'Upgrades'],
          correct: 'Leaves',
        },
        {
          id: 'asq-attn-3',
          question: 'Where does the burden of proof belong, according to the author?',
          options: ['With the attention-capturing design', 'With the user', 'With the regulator'],
          correct: 'With the attention-capturing design',
        },
      ],
    },

    {
      id: 'mycelium',
      title: 'The Wood Wide Web',
      topic: 'Forest ecology',
      level: 'B2',
      paragraphs: [
        'Beneath a forest floor, the greater majority of the organisms are fungal. Their filaments, collectively described as mycelium, form a network of extraordinary extent: a single cubic centimetre of forest soil can contain several kilometres of hyphae, and the largest known fungal individual, a honey fungus in Oregon, covers several hectares and is estimated to be thousands of years old.',
        'Because hyphae grow through soil rather than air, they cross the boundaries between individual plants. In the 1990s, experiments appeared to show a striking effect: carbon labelled with a radioisotope moved from one plant to a neighbour of another species through the fungal network. The paper became a textbook case of cooperation in nature, and the phrase "wood wide web" entered general use.',
        'Later work complicated the picture. Replications with modern controls found most of the apparent transfer had disappeared. Two artefacts had inflated the result: the radioisotope could travel through soil water rather than fungal tissue, and the fine mesh barriers meant to block fungal threads also changed the soil environment in uncontrolled ways. A transfer that survives a stricter design is a weaker claim than one measured once.',
        'What survived is more modest and more interesting. Fungal networks are abundant, they connect different plants, and they move carbon and nitrogen between them. Whether a net transfer means active cooperation, incidental uptake by a fungus acting regardless, or simple leakage through shared soil solution remains open, and the three explanations make different predictions that experiments have not yet separated.',
        'The broader lesson is about scientific revision. A striking result enters the literature, becomes a standard example, and gains meaning beyond its original domain. The correction is rarely dramatic — no paper retracted, no career ruined — and the field grows more careful. Understanding what mycelium does required first learning what it does not do.',
      ],
      keyTerms: ['mycelium', 'hyphae', 'carbon', 'artefacts', 'modest', 'revision'],
      readAloud:
        'Beneath a forest floor, the greater majority of the organisms are fungal. Their filaments, collectively described as mycelium, form a network of extraordinary extent: a single cubic centimetre of forest soil can contain several kilometres of hyphae.',
      repeatSentences: [
        'A single cubic centimetre of forest soil can contain several kilometres of fungal filaments.',
        'Because hyphae grow through soil, they cross the boundaries between individual plants.',
        'Most of the apparent carbon transfer disappeared when modern controls were applied.',
        'Whether the transfer represents cooperation or leakage remains genuinely open.',
        'A striking result can acquire a cultural meaning beyond the domain in which it was tested.',
      ],
      swt: {
        id: 'swt-mycelium',
        summary:
          'The passage describes a fungal network beneath forest soils that connects different plants and moves carbon and nitrogen between them, but reports that the celebrated 1990s transfer result largely disappeared under modern controls, leaving genuinely open whether the movement represents cooperation or incidental uptake.',
        excerptLabel: 'What the reanalysis found',
        excerpt: [
          'Later work complicated the picture. Replications with modern controls found most of the apparent transfer had disappeared. Two artefacts had inflated the result: the radioisotope could travel through soil water rather than fungal tissue, and the fine mesh barriers meant to block fungal threads also changed the soil environment in uncontrolled ways. A transfer that survives a stricter design is a weaker claim than one measured once.',
          'What survived is more modest and more interesting. Fungal networks are abundant, they connect different plants, and they move carbon and nitrogen between them.',
        ],
        keyTerms: [
          'controls',
          'artefacts',
          'radioisotope',
          'mesh barriers',
          'soil environment',
          'carbon',
          'nitrogen',
          'plants',
        ],
        minWords: 20,
      },
      dropdown: {
        id: 'fibd-mycelium',
        text: 'Beneath a forest floor, the greater majority of the organisms are ______ . Their filaments form a network of ______ extent, and the largest known fungal individual covers several hectares. Because hyphae grow through ______ , they cross the boundaries between individual plants. Later work found that two ______ had inflated the original result, and most of the apparent carbon transfer disappeared once modern controls were applied.',
        bank: [
          'fungal',
          'extraordinary',
          'soil',
          'artefacts',
          'bacterial',
          'modest',
          'air',
          'analogies',
          'absorptions',
        ],
        answers: ['fungal', 'extraordinary', 'soil', 'artefacts'],
      },
      tableFib: {
        id: 'fibt-mycelium',
        context: [
          'The 1997 experiment and its two independent replications reported the proportion of labelled carbon recovered in the receiver plant. Values are given as a percentage of the carbon released by the donor.',
        ],
        headers: ['Study', 'Mesh barrier', 'Soil moisture control', 'Carbon recovered'],
        rows: [
          ['Original (1997)', 'None', null, '18.4%'],
          ['Replication A', 'Fine mesh', 'Uncontrolled', '9.1%'],
          ['Replication B', 'Fine mesh', null, '2.3%'],
          ['Replication C', 'Coarse mesh', 'Controlled', '1.9%'],
          ['Overall conclusion', '—', '—', null],
        ],
        answers: ['Not reported', 'Controlled', 'Transfer not demonstrated'],
      },
      mcqSingle: {
        id: 'mcqs-mycelium',
        question:
          'According to the fourth paragraph, what three explanations for carbon transfer remain open?',
        options: [
          'Cooperation, incidental uptake, and leakage through soil solution',
          'Competition, predation, and parasitism',
          'Symbiosis, migration, and dormancy',
          'Photosynthesis, respiration, and transpiration',
        ],
        correct: ['Cooperation, incidental uptake, and leakage through soil solution'],
      },
      mcqMultiple: {
        id: 'mcqm-mycelium',
        question: 'Which two artefacts inflated the original result?',
        options: [
          'Movement of the isotope in soil water',
          'Contamination of the sample',
          'A mesh that altered the soil environment',
          'An incorrect estimate of fungal age',
          'Uncontrolled temperature during the study',
        ],
        correct: [
          'Movement of the isotope in soil water',
          'A mesh that altered the soil environment',
        ],
      },
      asq: [
        {
          id: 'asq-myc-1',
          question: 'Which organism forms the network beneath a forest floor?',
          options: ['Fungi', 'Mosses', 'Bacteria'],
          correct: 'Fungi',
        },
        {
          id: 'asq-myc-2',
          question: 'In which state is the largest known fungal individual?',
          options: ['Oregon', 'Finland', 'Japan'],
          correct: 'Oregon',
        },
        {
          id: 'asq-myc-3',
          question: 'What is described as making the field more careful?',
          options: ['The revision', 'The discovery', 'The funding'],
          correct: 'The revision',
        },
      ],
    },

    {
      id: 'machine-translation',
      title: 'Translation Without Meaning',
      topic: 'Computational linguistics',
      level: 'C1',
      paragraphs: [
        'Many machine-translation systems learn from parallel documents: sentences in one language paired with translations in another, gathered from sources such as international proceedings, technical manuals and subtitles. A common training objective is to predict a target sentence from the source. Systems can produce fluent text that appears convincing to a monolingual reader, yet still miss details of the original meaning; fluency alone cannot show whether a translation is accurate.',
        'Some errors are systematic rather than random. A source sentence may be ambiguous in one way in English and differently in the target language; the system may resolve the ambiguity according to its statistical prior and produce a translation that is fluent but wrong. Reviewers who know both languages can catch this. Reviewers who know only one may not, because fluent text invites a reader to assume it was checked. The evaluation problem and the translation problem are therefore closely linked.',
        'Domain coverage compounds the issue. A system performs best on the distribution it was trained on, and academic prose, legal text and literary dialogue differ from each other far more than any of them resembles a United Nations transcript.',
        'A constructive response can be to narrow the task rather than abandon it. In some settings, domain-specific vocabulary and review by someone who knows both languages can improve reliability on covered material. The limitation moves rather than disappears: review costs human time, and the result still depends on the quality of that review.',
        'The broader implication concerns what fluency conceals. The translation case illustrates why fluent output is not, by itself, evidence of accuracy: a system can produce grammatical, confident text that changes the source meaning, and the fluency can make the error harder to notice.',
      ],
      keyTerms: [
        'parallel documents',
        'statistical prior',
        'systematic',
        'domain coverage',
        'narrow',
        'fluency',
      ],
      readAloud:
        'A constructive response can be to narrow the task rather than abandon it. In some settings, domain-specific vocabulary and review by someone who knows both languages can improve reliability on covered material.',
      repeatSentences: [
        'The systems are trained on parallel documents gathered from proceedings, manuals and subtitles.',
        'Predicting a likely target sentence does not guarantee that every detail of the source meaning is preserved.',
        'A fluent text invites a reader to accept that it has already been checked.',
        'A technical word outside the training vocabulary is silently replaced by a frequent neighbour.',
        'Fluent output makes an error harder to detect rather than easier.',
      ],
      swt: {
        id: 'swt-machine-translation',
        summary:
          'The passage explains that machine-translation systems learn from parallel text but can still miss meaning when resolving ambiguity, so fluent output may be wrong; domain-specific vocabulary and review can improve reliability in some settings, at the cost of human time.',
        excerptLabel: 'Why fluency misleads',
        excerpt: [
          'Some errors are systematic rather than random. A source sentence may be ambiguous in one way in English and differently in the target language; the system may resolve the ambiguity according to its statistical prior and produce a translation that is fluent but wrong. Reviewers who know both languages can catch this. Reviewers who know only one may not, because fluent text invites a reader to assume it was checked.',
          'The passage argues that fluency alone is not evidence of accuracy: a system can produce grammatical, confident text that changes the source meaning, and the fluency can make the error harder to notice.',
        ],
        keyTerms: [
          'systematic',
          'ambiguity',
          'statistical prior',
          'fluent',
          'reviewers',
          'evaluation',
          'grammatical',
          'scale',
        ],
        minWords: 20,
      },
      dropdown: {
        id: 'fibd-machine-translation',
        text: "Many systems learn from ______ documents: sentences in one language paired with translations in another. Because the training objective does not directly measure meaning preservation, an ambiguous source sentence may be resolved according to the system's statistical ______ . A system performs best on the distribution it was trained on, and academic and legal text differ ______ from a United Nations transcript. Narrowing a system to one domain ______ its reliability, but the cost of review is human time.",
        bank: [
          'parallel',
          'prior',
          'markedly',
          'improves',
          'bilingual',
          'degrades',
          'hardly',
          'identical',
          'shift',
        ],
        answers: ['parallel', 'prior', 'markedly', 'improves'],
      },
      tableFib: {
        id: 'fibt-machine-translation',
        context: [
          'The same 200 sentences were translated by a general system and two domain-restricted systems. One covered legal text and received spot checks; the other covered medical text and received full review. Reviewers who knew both languages scored meaning preservation from 0 to 10.',
        ],
        headers: ['System', 'Coverage', 'Meaning score', 'Human review'],
        rows: [
          ['General', 'Very broad', '5.8', 'None'],
          ['Domain-restricted', 'Legal only', '7.9', 'Spot checks'],
          ['Domain-restricted', null, '8.4', 'Full'],
          ['Overall', '—', null, '—'],
        ],
        answers: ['Medical only', '7.4 average'],
      },
      mcqSingle: {
        id: 'mcqs-machine-translation',
        question:
          'Why does the passage say the evaluation problem and the translation problem are the same?',
        options: [
          'Fluent but wrong output passes unchallenged review',
          'Both require knowledge of two languages',
          'Both are solved by restricting vocabulary',
          'Both are measured on United Nations text',
        ],
        correct: ['Fluent but wrong output passes unchallenged review'],
      },
      mcqMultiple: {
        id: 'mcqm-machine-translation',
        question:
          'Which two domains does the passage say differ greatly from the training distribution?',
        options: [
          'Academic prose',
          'Subtitles',
          'Legal text',
          'Weather reports',
          'Literary dialogue',
        ],
        correct: ['Academic prose', 'Legal text'],
      },
      asq: [
        {
          id: 'asq-mt-1',
          question: 'On what kind of documents are the systems trained?',
          options: ['Parallel documents', 'Private letters', 'Dictionaries'],
          correct: 'Parallel documents',
        },
        {
          id: 'asq-mt-2',
          question: 'What is used to resolve an ambiguous source sentence?',
          options: ['The statistical prior', 'A grammar checker', 'A human translator'],
          correct: 'The statistical prior',
        },
        {
          id: 'asq-mt-3',
          question: 'Where are domain-restricted systems used?',
          options: ['Legal and medical settings', 'Advertising only', 'Schools only'],
          correct: 'Legal and medical settings',
        },
      ],
    },

    {
      id: 'glacier-retreat',
      title: 'The Slow Collapse of a Glacier',
      topic: 'Physical geography',
      level: 'B2',
      paragraphs: [
        'A glacier is not a frozen river but a moving one, and the speed at which ice travels downhill is determined by the balance between the weight of the ice above and the resisting forces at the bed. For most of the industrial era, accumulation in the upper basin exceeded loss at the terminus, and the glacier advanced or held a stable front. That balance has now reversed across a large number of catchments, and the reversal is the defining feature of contemporary glacial change.',
        'The immediate cause is not the rise in global temperature itself but the rise in the proportion of melt-season days on which the air is above freezing. Annual average temperature is a poor predictor of glacier behaviour, because glacier mass responds to how often melting occurs and to how much energy is available on each of those days.',
        "Response is governed by two further variables that are frequently confused. Calving — the breaking away of ice into the sea — removes mass instantly and is visible, whereas the slow thinning of ice far from the terminus may reduce volume dramatically over decades while barely appearing at the glacier's edge.",
        'A glacier losing one per cent of its mass per year is a phenomenon; one losing six per cent per year is a different system, because the higher rate generates its own feedback. The doubling time of such a system is far shorter than linear extrapolation from historical data would suggest.',
        'A predictable slow retreat is a matter of adjusting the water supply infrastructure over decades. An accelerating retreat is a matter of deciding, with incomplete information and under time pressure, which assets to abandon. The difficulty is not that the science is absent; it is that the science describes a distribution of futures rather than a single one, and decisions must be taken before the distribution resolves.',
      ],
      keyTerms: ['accumulation', 'melt season', 'calving', 'feedback', 'distribution of futures'],
      readAloud:
        'A glacier losing one per cent of its mass per year is a phenomenon; one losing six per cent per year is a different system, because the higher rate generates its own feedback that linear extrapolation would not predict.',
      repeatSentences: [
        'A glacier is not a frozen river but a moving one, driven by the balance of weight and resistance.',
        'Glacier mass responds to how often melting occurs rather than to annual average temperature.',
        'Calving removes mass instantly, while thinning far from the terminus reduces volume gradually.',
        'A lake forming behind a retreating front marks a very different timescale from a surge.',
        'The science describes a distribution of futures rather than a single outcome.',
      ],
      swt: {
        id: 'swt-glacier',
        summary:
          'The passage distinguishes fast visible calving from slow thickness loss, warns that an accelerating retreat generates its own feedback that linear extrapolation will not predict, and notes that planning is made difficult not by absent science but by a distribution of futures rather than a single one.',
        excerptLabel: 'Two kinds of loss',
        excerpt: [
          "Response is governed by two further variables that are frequently confused. Calving — the breaking away of ice into the sea — removes mass instantly and is visible, whereas the slow thinning of ice far from the terminus may reduce volume dramatically over decades while barely appearing at the glacier's edge. A glacier that looks unchanged at its snout may have lost several metres of thickness across its entire surface, and a lake forming behind a retreating front is a marker of a very different response timescale from a surge.",
          'The consequence that matters for planning is not the total volume lost but the rate of change of the rate.',
        ],
        keyTerms: [
          'calving',
          'terminus',
          'thinning',
          'thickness',
          'lake',
          'surge',
          'planning',
          'volume',
        ],
        minWords: 20,
      },
      dropdown: {
        id: 'fibd-glacier',
        text: 'A glacier is not a frozen river but a moving one, and its speed is set by the ______ between the weight of ice above and the resistance at the bed. Annual average temperature is a poor ______ of glacier behaviour, because mass loss depends on how often melting occurs. ______ removes mass instantly, whereas gradual thinning may reduce volume over decades. The consequence that matters for planning is the rate of ______ of the rate itself.',
        bank: [
          'balance',
          'predictor',
          'Calving',
          'change',
          'climate',
          'retreat',
          'Evaporation',
          'measurement',
          'increase',
        ],
        answers: ['balance', 'predictor', 'Calving', 'change'],
      },
      tableFib: {
        id: 'fibt-glacier',
        context: [
          'Four monitored catchments were compared over 1990–2025. Mean thickness change is measured at a point 5 km from the terminus; terminus retreat is measured at the visible edge. The mean thinning across all four catchments was 38 m.',
        ],
        headers: ['Catchment', 'Thinning at 5 km', 'Terminus retreat', 'Lake formation'],
        rows: [
          ['North', '38 m', '210 m', 'None'],
          ['East', null, '480 m', 'Yes'],
          ['South', '29 m', '160 m', 'None'],
          ['West', '44 m', '620 m', 'Yes'],
          ['Overall pattern', 'Slow', null, 'Two catchments'],
        ],
        answers: ['41 m', 'Variable'],
      },
      mcqSingle: {
        id: 'mcqs-glacier',
        question:
          'What does the passage say distinguishes a slow retreat from an accelerating one?',
        options: [
          'The accelerating case generates its own feedback',
          'The slow case is easier to measure',
          'The accelerating case occurs at higher altitudes',
          'The slow case involves no visible change',
        ],
        correct: ['The accelerating case generates its own feedback'],
      },
      mcqMultiple: {
        id: 'mcqm-glacier',
        question: 'Which two variables does the passage say are frequently confused?',
        options: ['Calving', 'Accumulation', 'Surface thinning', 'Precipitation', 'Albedo'],
        correct: ['Calving', 'Surface thinning'],
      },
      asq: [
        {
          id: 'asq-gl-1',
          question: 'What determines the speed at which ice travels downhill?',
          options: [
            'A balance of weight and resistance',
            'The air temperature',
            'The depth of snow',
          ],
          correct: 'A balance of weight and resistance',
        },
        {
          id: 'asq-gl-2',
          question: 'What does the passage say is a poor predictor of glacier behaviour?',
          options: ['Annual average temperature', 'Melt-season length', 'Ice thickness'],
          correct: 'Annual average temperature',
        },
        {
          id: 'asq-gl-3',
          question: 'What does the science provide for planners?',
          options: [
            'A distribution of futures',
            'A single certain outcome',
            'No information at all',
          ],
          correct: 'A distribution of futures',
        },
      ],
    },
    ...EXTRA_PASSAGES,
    ...EXTRA_PASSAGES_2,
    ...EXTRA_PASSAGES_3,
    ...EXTRA_PASSAGES_4,
    ...EXTRA_PASSAGES_5,
    ...EXTRA_PASSAGES_6,
    ...EXTRA_PASSAGES_7,
  ] satisfies Passage[]
).map((passage) => ({
  ...passage,
  ...(passage.tableFib
    ? {
        tableFib: {
          ...passage.tableFib,
          context: passage.tableFib.context.map((context) =>
            /^illustrative/i.test(context)
              ? context
              : `Illustrative practice data (not from a published study): ${context}`,
          ),
        },
      }
    : {}),
}))
