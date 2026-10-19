import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { QUESTION_META, SECTION_META } from '../domain/blueprint'
import { typeSlug } from '../content/questionTypeDetail'
import type { QuestionType, SectionId, Skill } from '../domain/types'
import { Badge, Callout } from './ui/primitives'
import { Reveal } from './ui/motion'
import { cn } from '../lib/cn'

export interface ItemWeightage {
  type: QuestionType
  name: string
  section: SectionId
  skills: Skill[]
  tier: 1 | 2 | 3
  impact: string
  points: string
  crossImpactNote?: string
  priorityStrategy: string
  suggestedTime: string
}

const WEIGHTAGE_DATA: ItemWeightage[] = [
  // --- TIER 1: HIGH-IMPACT CORE (MAJOR DUAL-SKILL DONORS) ---
  {
    type: 'write-from-dictation',
    name: 'Write From Dictation',
    section: 'listening',
    skills: ['listening', 'writing'],
    tier: 1,
    impact: 'Critical (~25 pts to Writing & Listening)',
    points: '25–28 pts (Writing + Listening)',
    crossImpactNote: 'Massive Writing donor! Donates ~25 points directly to Writing. Skimping on time here breaks your Writing score.',
    priorityStrategy: '100% spelling accuracy. Write alternative endings if unsure (no negative penalty for extra words). Practice 20–30 daily.',
    suggestedTime: '1–1.5 min per audio',
  },
  {
    type: 'repeat-sentence',
    name: 'Repeat Sentence',
    section: 'speaking-writing',
    skills: ['speaking', 'listening'],
    tier: 1,
    impact: 'Critical (~30 pts to Speaking, ~20 pts to Listening)',
    points: '30–33 pts (Speaking) + 18–20 pts (Listening)',
    crossImpactNote: 'Biggest speaking contributor and large listening donor. Contributes over 30 points to Speaking alone.',
    priorityStrategy: 'Continuous fluency beats word-for-word recall. If you catch 65–70% of words, speak them smoothly without stopping or hesitating.',
    suggestedTime: '15 sec immediately after beep',
  },
  {
    type: 'read-aloud',
    name: 'Read Aloud',
    section: 'speaking-writing',
    skills: ['speaking', 'reading'],
    tier: 1,
    impact: 'Critical (~22 pts to Speaking, ~20 pts to Reading)',
    points: '22–25 pts (Speaking) + 20–22 pts (Reading)',
    crossImpactNote: 'Massive Reading donor! Secures ~22 points in Reading before Part 2 (Reading section) even starts.',
    priorityStrategy: 'Read with natural cadence and rhythm. Stress key nouns and verbs. Never correct yourself if you mispronounce a word — keep flowing.',
    suggestedTime: '35–40 sec preparation, 30–35 sec speech',
  },
  {
    type: 'fill-in-blanks-dropdown',
    name: 'Reading & Writing: Fill in the Blanks',
    section: 'reading',
    skills: ['reading', 'writing'],
    tier: 1,
    impact: 'Critical (~22 pts to Reading & Writing)',
    points: '22–25 pts (Reading) + 20–22 pts (Writing)',
    crossImpactNote: 'The single highest-weight task in the Reading section, and provides ~22 points to Writing.',
    priorityStrategy: 'Master the Academic Collocation List (ACL), verb agreement, and preposition pairings. Budget 2–2.5 minutes per passage.',
    suggestedTime: '2–2.5 min per passage',
  },
  {
    type: 'describe-image',
    name: 'Describe Image',
    section: 'speaking-writing',
    skills: ['speaking'],
    tier: 1,
    impact: 'High (~22 pts to Speaking)',
    points: '22–25 pts (Speaking)',
    crossImpactNote: 'Pure speaking booster. Easiest task to automate with a fixed 25–30 second oral delivery template.',
    priorityStrategy: 'Rely on a proven 4-point template (Title → Highest trend → Lowest trend → Conclusion). Speak without hesitations or pauses.',
    suggestedTime: '25 sec preparation, 25–30 sec speech',
  },
  {
    type: 'fill-in-blanks-table',
    name: 'Reading: Fill in the Blanks',
    section: 'reading',
    skills: ['reading'],
    tier: 1,
    impact: 'High (~15 pts to Reading)',
    points: '15–18 pts (Reading)',
    crossImpactNote: 'Core Reading score foundation. Critical for meeting 65+ and 79+ cutoffs.',
    priorityStrategy: 'Eliminate options using parts of speech (noun, verb, adjective, adverb). Place confident words first to narrow remaining choices.',
    suggestedTime: '1.5–2 min per passage',
  },

  // --- TIER 2: CORE (~20% OF TOTAL SCORE) ---
  {
    type: 'summarize-spoken-text',
    name: 'Summarize Spoken Text',
    section: 'listening',
    skills: ['listening', 'writing'],
    tier: 2,
    impact: 'Medium (~10% of total exam marks)',
    points: '12–14 pts (Listening) + 12–14 pts (Writing)',
    crossImpactNote: 'Equal dual weightage for Listening and Writing.',
    priorityStrategy: 'Strict 50–70 words. Note down 4–5 clear phrase groups. Embed them into grammatically clean compound sentences. Check spelling.',
    suggestedTime: '10 min per item (independent timer)',
  },
  {
    type: 'write-essay',
    name: 'Write Essay',
    section: 'speaking-writing',
    skills: ['writing'],
    tier: 2,
    impact: 'Medium (~10% of total exam marks)',
    points: '11–13 pts (Writing)',
    crossImpactNote: 'Surprisingly lower weight than Write from Dictation or R&W FIB, but essential for Form and Discourse.',
    priorityStrategy: 'Stick strictly to 220–260 words across 4 paragraphs. Use a template to finish writing in 15 minutes, leaving 5 minutes for proofreading.',
    suggestedTime: '20 min per essay (independent timer)',
  },
  {
    type: 'retell-lecture',
    name: 'Re-tell Lecture',
    section: 'speaking-writing',
    skills: ['speaking', 'listening'],
    tier: 2,
    impact: 'Medium (~8% of total exam marks)',
    points: '10–12 pts (Speaking) + 10–12 pts (Listening)',
    crossImpactNote: 'Dual score for both Speaking and Listening.',
    priorityStrategy: 'Capture 5–7 keywords and key phrases on notepad. Channel them immediately into a fluent lecture template without stammering.',
    suggestedTime: '10 sec preparation, 30–35 sec speech',
  },
  {
    type: 'summarize-written-text',
    name: 'Summarize Written Text',
    section: 'speaking-writing',
    skills: ['reading', 'writing'],
    tier: 2,
    impact: 'Medium (~8% of total exam marks)',
    points: '8–10 pts (Reading) + 8–10 pts (Writing)',
    crossImpactNote: 'Feeds both Reading and Writing skills.',
    priorityStrategy: 'Must be ONE single complete sentence ending in a full stop (5–75 words; sweet spot 35–45 words). Two sentences = 0 Form score!',
    suggestedTime: '10 min per prompt (independent timer)',
  },
  {
    type: 'fill-in-blanks-listening',
    name: 'Listening: Fill in the Blanks',
    section: 'listening',
    skills: ['listening', 'writing'],
    tier: 2,
    impact: 'Medium (~7% of total exam marks)',
    points: '7–9 pts (Listening) + 7–9 pts (Writing)',
    crossImpactNote: 'Directly influences your Writing score via spelling accuracy.',
    priorityStrategy: 'Type rough notes or directly into blanks as audio plays. Double-check plural -s, past-tense -ed, and vowel combinations.',
    suggestedTime: '1.5–2 min per passage',
  },
  {
    type: 'highlight-incorrect-words',
    name: 'Highlight Incorrect Words',
    section: 'listening',
    skills: ['reading', 'listening'],
    tier: 2,
    impact: 'Medium (~7% of total exam marks)',
    points: '8–10 pts (Reading) + 8–10 pts (Listening)',
    crossImpactNote: 'Dual score for Listening and Reading.',
    priorityStrategy: '⚠️ Negative marking (-1 per wrong click)! Track with your cursor word by word. Only click if you are 100% sure the speaker said a different word.',
    suggestedTime: 'Plays once (audio length)',
  },
  {
    type: 'reorder-paragraphs',
    name: 'Re-order Paragraphs',
    section: 'reading',
    skills: ['reading'],
    tier: 2,
    impact: 'Medium (~6% of total exam marks)',
    points: '6–8 pts (Reading)',
    crossImpactNote: 'Pure Reading score. Scored per adjacent correct pair.',
    priorityStrategy: 'Identify the independent topic sentence (no pronouns or unexplained references). Match adjacent pairs (A→B, B→C) methodically.',
    suggestedTime: '2 min per item',
  },
  {
    type: 'summarize-group-discussion',
    name: 'Summarize Group Discussion',
    section: 'speaking-writing',
    skills: ['speaking', 'listening'],
    tier: 2,
    impact: 'Medium (~6% of total exam marks)',
    points: '8–10 pts (Speaking) + 8–10 pts (Listening)',
    crossImpactNote: '2025 new format item. Integrated Speaking & Listening.',
    priorityStrategy: 'Differentiate the 2–3 speakers and note consensus vs divergence. Deliver a structured summary within 40 seconds.',
    suggestedTime: '10 sec preparation, 35–40 sec speech',
  },
  {
    type: 'respond-to-situation',
    name: 'Respond to a Situation',
    section: 'speaking-writing',
    skills: ['speaking'],
    tier: 2,
    impact: 'Medium (~5% of total exam marks)',
    points: '8–10 pts (Speaking)',
    crossImpactNote: '2025 new format item. Evaluates pragmatic oral communication.',
    priorityStrategy: 'Identify the tone (formal vs informal). Follow 4 steps: Greeting → Reason/Empathy → Concrete Solution → Polite Sign-off.',
    suggestedTime: '20 sec preparation, 30–35 sec speech',
  },

  // --- TIER 3: LOW YIELD (<10% COMBINED) ---
  {
    type: 'multiple-choice-single',
    name: 'Multiple Choice, Single Answer (Reading)',
    section: 'reading',
    skills: ['reading'],
    tier: 3,
    impact: 'Low (<2% of exam score)',
    points: '1–2 pts (Reading)',
    crossImpactNote: 'Low yield. Never spend more than 90 seconds here.',
    priorityStrategy: 'Read the question stem first, scan passage for keywords, eliminate two obvious distractors, choose and move on.',
    suggestedTime: '1–1.5 min max',
  },
  {
    type: 'multiple-choice-multiple',
    name: 'Multiple Choice, Multiple Answers (Reading)',
    section: 'reading',
    skills: ['reading'],
    tier: 3,
    impact: 'Low (<3% of exam score)',
    points: '2–3 pts (Reading)',
    crossImpactNote: '⚠️ Negative marking (-1 per wrong option).',
    priorityStrategy: 'Golden Rule: Pick ONLY ONE option you are 100% sure about. Never guess a second option unless completely certain.',
    suggestedTime: '1.5–2 min max',
  },
  {
    type: 'listening-multiple-choice-single',
    name: 'Multiple Choice, Single Answer (Listening)',
    section: 'listening',
    skills: ['listening'],
    tier: 3,
    impact: 'Low (<2% of exam score)',
    points: '1–2 pts (Listening)',
    crossImpactNote: 'Low yield.',
    priorityStrategy: 'Skim the question during the 5-second countdown. Lock in your answer within 10 seconds after audio concludes.',
    suggestedTime: 'Audio duration + 10 sec',
  },
  {
    type: 'listening-multiple-choice-multiple',
    name: 'Multiple Choice, Multiple Answers (Listening)',
    section: 'listening',
    skills: ['listening'],
    tier: 3,
    impact: 'Low (<3% of exam score)',
    points: '2–3 pts (Listening)',
    crossImpactNote: '⚠️ Negative marking (-1 per wrong option).',
    priorityStrategy: 'Protect your points: select ONLY ONE option you are confident in. A second wrong guess wipes out your correct mark.',
    suggestedTime: 'Audio duration + 15 sec',
  },
  {
    type: 'highlight-correct-summary',
    name: 'Highlight Correct Summary',
    section: 'listening',
    skills: ['listening', 'reading'],
    tier: 3,
    impact: 'Low (<3% of exam score)',
    points: '2–3 pts (Listening + Reading)',
    crossImpactNote: 'Low yield dual score.',
    priorityStrategy: 'Focus on overall argument and outcome, not matching isolated buzzwords. Eliminate summaries containing extreme statements.',
    suggestedTime: 'Audio duration + 30 sec',
  },
  {
    type: 'select-missing-word',
    name: 'Select Missing Word',
    section: 'listening',
    skills: ['listening'],
    tier: 3,
    impact: 'Low (<2% of exam score)',
    points: '1–2 pts (Listening)',
    crossImpactNote: 'Low yield.',
    priorityStrategy: 'Follow the speaker’s tone and train of thought to anticipate how the final sentence logically completes before the beep.',
    suggestedTime: 'Audio duration + 10 sec',
  },
  {
    type: 'answer-short-question',
    name: 'Answer Short Question',
    section: 'speaking-writing',
    skills: ['speaking', 'listening'],
    tier: 3,
    impact: 'Low (<3% of exam score)',
    points: '2–3 pts (Speaking + Listening)',
    crossImpactNote: 'Low yield.',
    priorityStrategy: 'Answer with 1–2 words immediately after audio ends. If you do not know, say "I do not know" or any relevant noun and move on.',
    suggestedTime: '5–10 sec',
  },
]

type TargetScore = 'all' | '50' | '65' | '79'

const TARGET_STRATEGIES: Record<
  TargetScore,
  {
    title: string
    subtitle: string
    recommendation: string
    keyTypes: string[]
    timeAllocation: string
  }
> = {
  all: {
    title: 'Full PTE Score Architecture',
    subtitle: 'Understand the Pareto distribution (80/20 rule) in PTE Academic scoring',
    recommendation:
      'The majority of communicative skill points are contributed by these 6 core question types. Mastering Tier 1 guarantees the greatest return on practice time.',
    keyTypes: ['Write From Dictation', 'Repeat Sentence', 'Read Aloud', 'R&W Fill in the Blanks', 'Describe Image'],
    timeAllocation: '80% time on Tier 1 & 2, 20% on mock exams & remaining items',
  },
  '50': {
    title: 'Target 50 (Competent English / CEFR B1)',
    subtitle: 'Common undergraduate admissions & standard work visa requirement',
    recommendation:
      'Focus 90% of your prep on mastering fixed templates for Describe Image and Essay, and building accuracy in Read Aloud and Write From Dictation. In Reading multiple-choice tasks, pick one answer and move on quickly so you never run out of time.',
    keyTypes: ['Describe Image (Templates)', 'Read Aloud (Fluency)', 'Write Essay (Templates)', 'Write From Dictation'],
    timeAllocation: '70% Tier 1, 25% Tier 2, 5% Tier 3',
  },
  '65': {
    title: 'Target 65 (Proficient English / CEFR B2-C1)',
    subtitle: 'Target for top postgraduate university degrees & 10 PR immigration points',
    recommendation:
      'To reach 65, you cannot rely solely on templates. You need 90%+ spelling accuracy in Write From Dictation, 65%+ word recall in Repeat Sentence with unhesitating oral fluency, and solid mastery of academic collocations in Fill in the Blanks.',
    keyTypes: ['Write From Dictation (90%+)', 'Repeat Sentence (Fluency)', 'R&W Fill in the Blanks (Collocations)', 'Summarize Spoken Text'],
    timeAllocation: '60% Tier 1, 35% Tier 2, 5% Tier 3',
  },
  '79': {
    title: 'Target 79+ (Superior English / CEFR C1-C2)',
    subtitle: 'Competitive cutoff for 20 PR immigration points & medical/legal professional licensing',
    recommendation:
      'Zero-tolerance for spelling errors in Write From Dictation and Summarize Spoken Text. Natural, rapid phrasing with zero self-corrections in Read Aloud and Repeat Sentence. Flawless grammar and punctuation in Summarize Written Text (exact single-sentence rule).',
    keyTypes: ['All Tier 1 (Near 100% accuracy)', 'Summarize Spoken Text', 'Summarize Written Text (Strict single sentence)', 'Highlight Incorrect Words (No penalty clicks)'],
    timeAllocation: '50% Tier 1 mastery, 45% Tier 2 perfection, 5% Tier 3 penalty protection',
  },
}

export function ScoreWeightageMatrix() {
  const [selectedSkill, setSelectedSkill] = useState<Skill | 'all'>('all')
  const [selectedTier, setSelectedTier] = useState<1 | 2 | 3 | 'all'>('all')
  const [targetScore, setTargetScore] = useState<TargetScore>('all')

  const filteredItems = useMemo(() => {
    return WEIGHTAGE_DATA.filter((item) => {
      const matchSkill = selectedSkill === 'all' || item.skills.includes(selectedSkill)
      const matchTier = selectedTier === 'all' || item.tier === selectedTier
      return matchSkill && matchTier
    })
  }, [selectedSkill, selectedTier])

  const currentStrategy = TARGET_STRATEGIES[targetScore]

  return (
    <section id="weightage" className="mt-16 scroll-mt-24">
      {/* Header */}
      <div className="border-ink-200 dark:border-white/10 border-t pt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="bg-ink-100 text-ink-700 dark:bg-white/5 dark:text-ink-on-dark rounded-sm px-2.5 py-0.5 text-xs font-bold">
              Strategic Scoring Priority
            </span>
            <h2 className="section-title mt-2">Score weightage & contributor matrix</h2>
          </div>
          <Link
            to="/scoring"
            className="btn-secondary px-3 py-1.5 text-xs font-semibold"
          >
            How scoring works
          </Link>
        </div>
        <p className="text-ink-600 dark:text-ink-on-dark mt-3 text-sm leading-relaxed max-w-3xl">
          Unlike traditional exams where skills are isolated, PTE distributes marks across sections through integrated tasks.
          Filter by your target skill to reveal which tasks provide the bulk of your points.
        </p>
      </div>

      {/* Target Score Strategy Selector Tabs */}
      <div className="card-solid mt-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-ink-900 dark:text-white text-base font-bold">Target score focus plans</h3>
            <p className="text-ink-500 dark:text-ink-on-dark-muted text-xs mt-0.5">
              Select your benchmark to adapt your daily study allocation:
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Target score presets">
            {(
              [
                { id: 'all', label: 'All types' },
                { id: '50', label: 'Target 50 (Competent)' },
                { id: '65', label: 'Target 65 (Proficient)' },
                { id: '79', label: 'Target 79+ (Superior)' },
              ] as const
            ).map((tab) => {
              const active = targetScore === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTargetScore(tab.id)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
                    active
                      ? 'bg-brand-600 text-white'
                      : 'bg-ink-100 hover:bg-ink-200 text-ink-700 dark:bg-white/8 dark:hover:bg-white/12 dark:text-ink-200',
                  )}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Strategy Detail Card */}
        <Reveal variant="up" delay={30} duration={550}>
          <div className="border-ink-200 dark:border-white/10 mt-5 rounded-md border bg-ink-100/60 p-4 dark:bg-white/[0.03]">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h4 className="text-ink-900 dark:text-white text-sm font-bold">{currentStrategy.title}</h4>
              <span className="text-ink-500 dark:text-ink-on-dark-muted text-xs">
                {currentStrategy.timeAllocation}
              </span>
            </div>
            <p className="text-ink-500 dark:text-ink-on-dark-muted text-xs mt-1">{currentStrategy.subtitle}</p>
            <p className="text-ink-700 dark:text-ink-200 text-sm mt-3 leading-relaxed">
              {currentStrategy.recommendation}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="text-ink-500 dark:text-ink-on-dark-muted text-xs font-medium mr-1">High-yield priorities:</span>
              {currentStrategy.keyTypes.map((kt) => (
                <span
                  key={kt}
                  className="bg-brand-500/10 text-brand-700 dark:text-brand-300 rounded-sm px-2 py-0.5 text-xs font-medium"
                >
                  {kt}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>

      {/* The Integrated Scoring Trap Callout */}
      <Callout tone="amber" className="mt-6 p-5" label="Crucial PTE Fact">
        <h3 className="text-ink-900 dark:text-white text-sm font-bold">
          The &quot;Integrated Scoring Trap&quot;
        </h3>
        <p className="text-ink-700 dark:text-ink-200 text-sm mt-2 leading-relaxed">
          Candidates who fail <strong>Writing</strong> often assume they wrote a poor essay. In reality, over{' '}
          <strong>50% of your Writing marks</strong> are awarded in the Listening and Reading sections:{' '}
          <span className="font-medium text-ink-900 dark:text-white">Write From Dictation (~25 pts)</span>,{' '}
          <span className="font-medium text-ink-900 dark:text-white">R&W Fill in the Blanks (~22 pts)</span>, and{' '}
          <span className="font-medium text-ink-900 dark:text-white">Summarize Spoken Text (~12 pts)</span>. Similarly,{' '}
          <strong>Read Aloud</strong> donates ~22 points directly to <strong>Reading</strong>.
        </p>
      </Callout>

      {/* Interactive Filters */}
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Skill filter */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-ink-500 dark:text-ink-on-dark-muted text-xs font-semibold mr-1">Filter by skill:</span>
          {(['all', 'speaking', 'writing', 'reading', 'listening'] as const).map((s) => {
            const active = selectedSkill === s
            return (
              <button
                key={s}
                type="button"
                onClick={() => setSelectedSkill(s)}
                aria-pressed={active}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-semibold transition-colors capitalize',
                  active
                    ? 'bg-brand-600 text-white'
                    : 'bg-ink-100 hover:bg-ink-200 text-ink-700 dark:bg-white/8 dark:hover:bg-white/12 dark:text-ink-on-dark',
                )}
              >
                {s === 'all' ? 'All Skills' : s}
              </button>
            )
          })}
        </div>

        {/* Tier filter */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-ink-500 dark:text-ink-on-dark-muted text-xs font-semibold mr-1">Filter by tier:</span>
          {(
            [
              { id: 'all', label: 'All Tiers' },
              { id: 1, label: 'Tier 1 (Critical ~70%)' },
              { id: 2, label: 'Tier 2 (Core ~20%)' },
              { id: 3, label: 'Tier 3 (Low ~10%)' },
            ] as const
          ).map((t) => {
            const active = selectedTier === t.id
            return (
              <button
                key={String(t.id)}
                type="button"
                onClick={() => setSelectedTier(t.id)}
                aria-pressed={active}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-semibold transition-colors',
                  active
                    ? 'bg-ink-900 text-white dark:bg-white dark:text-ink-900'
                    : 'bg-ink-100 hover:bg-ink-200 text-ink-700 dark:bg-white/8 dark:hover:bg-white/12 dark:text-ink-on-dark',
                )}
              >
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Item count status */}
      <div className="mt-3 flex items-center justify-between text-xs text-ink-500 dark:text-ink-on-dark-muted">
        <span>
          Showing <strong>{filteredItems.length}</strong> of 22 question types
        </span>
        {selectedSkill !== 'all' && (
          <span className="text-brand-600 dark:text-brand-300 font-medium">
            Highlighted: all tasks that provide marks toward {selectedSkill}
          </span>
        )}
      </div>

      {/* The Matrix Cards */}
      <div className="mt-4 grid gap-4">
        {filteredItems.map((item, i) => {
          const meta = QUESTION_META[item.type]
          const slug = typeSlug(item.type)

          return (
            <Reveal key={item.type} variant="up" delay={Math.min(i, 8) * 25} duration={550}>
              <div
                className={cn(
                  'card-solid flex flex-col justify-between p-5',
                  item.tier === 1 && 'border-l-4 border-l-brand-500 dark:border-l-brand-400',
                  item.tier === 2 && 'border-l-4 border-l-amber-500 dark:border-l-amber-400',
                  item.tier === 3 && 'border-l-4 border-l-ink-300 dark:border-l-white/20',
                )}
            >
              <div>
                {/* Title & Badges */}
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-ink-900 dark:text-white text-base font-bold">
                      <Link
                        to={`/question-types/${slug}/`}
                        className="-m-1 inline-flex min-h-6 items-center rounded-sm px-1 hover:text-brand-600 dark:hover:text-brand-300 hover:underline"
                      >
                        {item.name}
                      </Link>
                    </h3>
                    <span className="text-ink-500 dark:text-ink-on-dark-muted text-xs">
                      ({SECTION_META[item.section].longTitle})
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {item.tier === 1 && <Badge tone="brand">Tier 1, Critical</Badge>}
                    {item.tier === 2 && <Badge tone="neutral">Tier 2, Core</Badge>}
                    {item.tier === 3 && <Badge tone="neutral">Tier 3, Low yield</Badge>}
                    <Badge tone="brand">{item.skills.join(' + ')}</Badge>
                  </div>
                </div>

                {/* Score estimates & cross-impact */}
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-md bg-ink-100 p-2.5 dark:bg-white/5">
                    <span className="text-ink-500 dark:text-ink-on-dark-muted text-xs font-semibold block">
                      Estimated point impact
                    </span>
                    <span className="text-ink-900 dark:text-white text-sm font-semibold mt-0.5 block">
                      {item.points}
                    </span>
                    <span className="text-ink-500 dark:text-ink-on-dark-muted text-xs mt-0.5 block">
                      Target duration: {item.suggestedTime}
                    </span>
                  </div>

                  {item.crossImpactNote ? (
                    <div className="rounded-md bg-brand-500/8 border border-brand-500/15 p-2.5 dark:bg-brand-500/10">
                      <span className="text-brand-700 dark:text-brand-300 text-xs font-semibold block">
                        Cross-skill contributor
                      </span>
                      <p className="text-ink-800 dark:text-ink-200 text-xs mt-0.5 leading-snug">
                        {item.crossImpactNote}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-md bg-ink-100 p-2.5 dark:bg-white/5">
                      <span className="text-ink-500 dark:text-ink-on-dark-muted text-xs font-semibold block">
                        Module impact
                      </span>
                      <p className="text-ink-700 dark:text-ink-on-dark text-xs mt-0.5 leading-snug">
                        {item.impact}
                      </p>
                    </div>
                  )}
                </div>

                {/* Strategy recommendation */}
                <div className="mt-3">
                  <p className="text-ink-600 dark:text-ink-on-dark text-sm leading-relaxed">
                    <strong className="text-ink-900 dark:text-white font-medium">Exam Strategy: </strong>
                    {item.priorityStrategy}
                  </p>
                </div>
              </div>

              {/* Action Links */}
              <div className="border-ink-100 dark:border-white/6 mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-3 text-xs">
                <div className="text-ink-500 dark:text-ink-on-dark-muted">
                  {meta.perTest} per full exam
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    to={`/question-types/${slug}/`}
                    className="-m-1 inline-flex min-h-6 items-center rounded-sm px-1 text-ink-600 hover:text-ink-900 dark:text-ink-on-dark-muted dark:hover:text-white font-medium hover:underline"
                  >
                    Scoring rubric & mistakes
                  </Link>
                  <Link
                    to={`/practice?type=${item.type}`}
                    className="btn-secondary px-3 py-1 text-xs font-semibold"
                  >
                    Practice now
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
          )
        })}
      </div>
    </section>
  )
}
