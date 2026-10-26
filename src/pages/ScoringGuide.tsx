import { ADMISSION_TARGETS, pteToIelts, rawToPteScale, toCefr } from '../domain/scoring'
import { Seo } from '../seo/Seo'
import {
  Accordion,
  ButtonLink,
  Callout,
  CtaBand,
  PageWrapper,
  SectionBand,
  SectionHeading,
  TickList,
} from '../components/ui/primitives'
import { Breadcrumbs } from '../components/ui/Breadcrumbs'
import { Reveal, Tilt } from '../components/ui/motion'

const FAQ = [
  {
    question: 'What is a good PTE score?',
    answer:
      'For most undergraduate UK university applications, 50 to 60 is the usual requirement, with many courses asking for 59 to 63. Taught postgraduate and professional programmes commonly ask for 60 to 70. Competitive subjects such as medicine and law frequently require 70 or above.',
  },
  {
    question: 'How does PTE Academic compare to IELTS?',
    answer:
      'Pearson publishes an official concordance between PTE Academic (10–90) and IELTS overall bands (1.0–9.0). For example, PTE 50 corresponds to IELTS 6.0, 59 to IELTS 6.5, 66 to IELTS 7.0, and 76 to IELTS 7.5. Universities and visa authorities evaluate candidates against these published concordances.',
  },
  {
    question: 'Does PTE Academic have a passing score?',
    answer:
      'No. There is no pass mark. Each institution sets its own requirement, and for UK student visas the relevant standard is set separately by immigration policy rather than by the test.',
  },
  {
    question: 'How is the overall PTE score calculated?',
    answer:
      'Every item is scored and the result is combined across the four communicative skills — Speaking, Writing, Reading and Listening — into a scaled score from 10 to 90 in 1-point increments. Reading and Listening are scored exactly. Speaking and Writing are scored on content, form, oral fluency, pronunciation and range.',
  },
  {
    question: 'How long is a PTE score valid?',
    answer:
      'Pearson test results are valid for two years from the test date. Most institutions require results that are no more than two years old at the point of application.',
  },
  {
    question: 'Can I retake the PTE Academic?',
    answer:
      'Yes, but you can only book one test at a time. If you sit the test and do not achieve the score you need, you must wait for your results before booking another attempt.',
  },
]

const SCALE_ROWS: Array<{ score: number; cefr: string; meaning: string; use: string }> = [
  { score: 90, cefr: 'C2', meaning: 'Exceptional', use: 'Above every university requirement' },
  { score: 85, cefr: 'C2', meaning: 'Exceptional', use: 'Above every university requirement' },
  { score: 84, cefr: 'C1', meaning: 'Advanced', use: 'Competitive courses' },
  { score: 76, cefr: 'C1', meaning: 'Advanced', use: 'Strong applications, competitive courses' },
  { score: 75, cefr: 'B2', meaning: 'Upper intermediate', use: 'Top of the B2 band' },
  {
    score: 69,
    cefr: 'B2',
    meaning: 'Upper intermediate',
    use: 'Postgraduate and professional programmes',
  },
  { score: 63, cefr: 'B2', meaning: 'Upper intermediate', use: 'A common minimum requirement' },
  { score: 59, cefr: 'B2', meaning: 'Upper intermediate', use: 'Bottom of the B2 band' },
  { score: 58, cefr: 'B1', meaning: 'Intermediate', use: 'Many UK undergraduate courses' },
  { score: 50, cefr: 'B1', meaning: 'Intermediate', use: 'The usual UK undergraduate floor' },
  { score: 43, cefr: 'B1', meaning: 'Intermediate', use: 'Bottom of the B1 band' },
  { score: 42, cefr: 'A2', meaning: 'Elementary', use: 'Pre-sessional English programmes' },
  { score: 30, cefr: 'A2', meaning: 'Elementary', use: 'Below most university requirements' },
  { score: 29, cefr: 'A1', meaning: 'Basic', use: 'Well below the test threshold' },
]

export default function ScoringGuide() {
  return (
    <>
      <Seo />

      <PageWrapper
        breadcrumbs={<Breadcrumbs trail={[{ name: 'Home', path: '/' }, { name: 'PTE scoring' }]} />}
        eyebrow="PTE scoring"
        title="PTE score guide: what your number means"
        description="The PTE Academic is reported on a scaled score from 10 to 90. See how it maps to CEFR bands, common university requirements, and the estimates shown here."
      >
        <SectionHeading
          className="mt-8 sm:mt-10"
          eyebrow="The scale"
          title="The official 10–90 scale"
        />
        <p className="text-ink-600 dark:text-ink-200 mt-4 leading-relaxed">
          Pearson reports PTE Academic results exclusively on a scale of 10 to 90, based on the
          Global Scale of English (GSE). Every score reflects communicative proficiency aligned
          directly with the Common European Framework of Reference (CEFR).
        </p>
        <Reveal className="mt-5">
          <Tilt glare={false}>
            <div className="card-solid grid gap-4 sm:grid-cols-3 p-6 border-ink-200 dark:border-white/10">
              {[
                ['10 – 90', 'Pearson’s official scale', 'Granular 1-point increments', 'mint'],
                ['CEFR A1–C2', 'Directly aligned framework', 'International standard', 'brand'],
                [
                  'IELTS Concordance',
                  'Documented equivalence',
                  'Official Pearson research',
                  'neutral',
                ],
              ].map(([a, b, c]) => (
                <div
                  key={a}
                  className="rounded-2xl border border-ink-100 bg-ink-50/50 p-4.5 dark:border-white/5 dark:bg-white/[0.02]"
                >
                  <p className="font-display text-ink-900 dark:text-white text-3xl font-extrabold tabular-nums tracking-tight">
                    {a}
                  </p>
                  <p className="text-ink-700 dark:text-ink-on-dark mt-1 text-sm font-bold">{b}</p>
                  <p className="text-ink-500 dark:text-ink-on-dark-muted mt-0.5 text-xs">{c}</p>
                </div>
              ))}
            </div>
          </Tilt>
        </Reveal>

        <SectionHeading
          className="mt-12 sm:mt-14"
          eyebrow="Mapping"
          title="Score, IELTS and CEFR concordance"
        />
        <p className="text-ink-600 dark:text-ink-200 mt-3 leading-relaxed">
          These are Pearson's published bands from the official Score Guide and concordance
          research: 85–90 is C2, 76–84 is C1, 59–75 is B2, 43–58 is B1, 30–42 is A2, and 10–29 is A1
          or below. Pearson publishes bands for the <em>overall</em> score only — there are no
          public per-skill bands.
        </p>
        <div className="card-solid mt-5 overflow-x-auto p-0 border-ink-200 dark:border-white/10">
          <table className="table-data min-w-lg">
            <caption className="sr-only">
              PTE Academic score bands, published IELTS concordance, and CEFR equivalents
            </caption>
            <thead>
              <tr className="border-ink-200 dark:border-white/10 border-b">
                {[
                  'Score (10–90)',
                  'IELTS equivalent',
                  'CEFR',
                  'Level',
                  'Typically sufficient for',
                ].map((h) => (
                  <th key={h} scope="col">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SCALE_ROWS.map((r) => {
                // Every row on the scale is 29 or above, which is inside the
                // IELTS concordance, so the fallback is a guard for rows that
                // might one day fall below it.
                /* v8 ignore next -- no row on the scale falls below the concordance */
                const ielts = pteToIelts(r.score) ?? '≤4.0'
                return (
                  <tr key={r.score} className="border-ink-100 dark:border-white/6 border-b">
                    <td className="text-ink-900 dark:text-white font-bold tabular-nums">
                      {r.score}
                    </td>
                    <td className="text-ink-700 dark:text-ink-200 tabular-nums">{ielts}</td>
                    <td>
                      <span className="pill bg-brand-500/12 text-brand-700 dark:text-brand-300">
                        {r.cefr}
                      </span>
                    </td>
                    <td className="text-ink-600 dark:text-ink-on-dark">{r.meaning}</td>
                    <td className="text-ink-500 dark:text-ink-on-dark-muted">{r.use}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="text-ink-500 dark:text-ink-on-dark-muted mt-2 text-xs italic">
          Source: Pearson, “Establishing score concordance between the enhanced PTE Academic and
          IELTS Academic” (July 2025), summarised in the PTE Academic Score Guide.
        </p>

        <SectionHeading
          className="mt-12 sm:mt-14"
          eyebrow="Targets"
          title="What universities require"
        />
        <ul className="mt-5 space-y-3">
          {ADMISSION_TARGETS.map((t, i) => (
            <Reveal
              as="li"
              key={t.label}
              delay={Math.min(i, 3) * 55}
              duration={600}
              className="flex"
            >
              <article className="card-solid w-full p-5 border-ink-200 dark:border-white/10">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-ink-900 dark:text-white text-sm font-bold text-balance">
                    {t.label}
                  </h3>
                  <span className="text-ink-500 dark:text-ink-on-dark-muted text-xs tabular-nums">
                    target {t.range}
                  </span>
                </div>
                <p className="text-ink-500 dark:text-ink-on-dark mt-2 text-sm leading-relaxed">
                  {t.note}
                </p>
              </article>
            </Reveal>
          ))}
        </ul>
        <p className="text-ink-500 dark:text-ink-on-dark-muted mt-4 text-sm">
          Requirements change. Always check the specific course page rather than relying on a
          general threshold.
        </p>

        <SectionHeading
          className="mt-12 sm:mt-14"
          eyebrow="Method"
          title="How this site estimates your score"
        />
        <p className="text-ink-600 dark:text-ink-200 mt-4 leading-relaxed">
          Being precise about this matters more than the number itself, so here is exactly what
          happens when you press finish.
        </p>

        <ol className="mt-6 space-y-4">
          {[
            {
              title: 'Every published rule is implemented exactly',
              body: 'All-or-nothing items, one point per blank, one point per word spelled correctly, and the one-point deduction on the three types that use negative marking. Re-order Paragraphs is scored per correctly ordered adjacent pair, so a run of three boxes earns two points and the item maximum is one less than the number of boxes. The CEFR bands are Pearson\u2019s.',
            },
            {
              title: 'Speaking and writing use a transparent rubric',
              body: 'Pearson scores constructed responses with a proprietary model that cannot be reproduced, so this site reads the published trait scales and estimates the same four constructs from signals a browser can measure: content coverage, form, structure and range, plus measured pace, pause frequency, pitch and energy variation for speaking.',
            },
            {
              title: 'The zero rules are respected',
              body: 'The score guide states that when Content or Form scores zero, no points are awarded for the item at all. So an off-topic essay, an essay under 120 words (or written in all capitals, without punctuation, or as bullets), a summary that is not a single sentence, and a response with no content from the source all score zero however fluently they were delivered. That gate is implemented, not approximated.',
            },
            {
              title: 'Eight types feed two skills at once',
              body: 'Repeat Sentence, Re-tell Lecture and Summarize Group Discussion each count towards both Listening and Speaking. Summarize Written Text counts towards Reading and Writing; Summarize Spoken Text and Write from Dictation towards Listening and Writing; Highlight Correct Summary and Highlight Incorrect Words towards Listening and Reading. A single-skill model would misstate all four skill scores.',
            },
          ].map((step, i) => (
            <Reveal as="li" key={step.title} delay={Math.min(i, 3) * 70} className="flex">
              <article className="card-solid flex w-full gap-4 p-5 sm:p-6 border-ink-200 dark:border-white/10">
                <span className="bg-brand-500 text-white grid size-7 shrink-0 place-items-center rounded-xl text-xs font-bold shadow-xs">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-ink-900 dark:text-white text-sm font-bold text-balance">
                    {step.title}
                  </h3>
                  <p className="text-ink-500 dark:text-ink-on-dark mt-1.5 text-sm leading-relaxed">
                    {step.body}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </ol>

        <Reveal variant="fade" className="mt-8">
          <div className="card-solid overflow-hidden p-6 border-ink-200 dark:border-white/10">
            <h3 className="text-ink-900 dark:text-white text-sm font-bold text-balance">
              The conversion curve, illustrated
            </h3>
            <div className="mt-4 -mx-5 overflow-x-auto px-5">
              <table className="table-data min-w-lg">
                <caption className="sr-only">
                  How raw accuracy maps to the PTE 10 to 90 scale
                </caption>
                <thead>
                  <tr className="border-ink-200 dark:border-white/10 border-b">
                    {['Points earned', 'Score (10–90)', 'CEFR'].map((h) => (
                      <th key={h} scope="col">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[0, 0.25, 0.5, 0.7, 0.85, 1].map((f) => {
                    const s = rawToPteScale(f)
                    return (
                      <tr key={f} className="border-ink-100 dark:border-white/6 border-b">
                        <td className="text-ink-700 dark:text-ink-200 tabular-nums">
                          {Math.round(f * 100)}%
                        </td>
                        <td className="text-ink-900 dark:text-white font-bold tabular-nums">{s}</td>
                        <td className="text-ink-500 dark:text-ink-on-dark-muted">{toCefr(s)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>{' '}
            </div>
          </div>
        </Reveal>

        {/* The closing group — what to do next, the high-yield tools, and the
            FAQ — sits in its own band so the page ends on a different ground
            from the analysis above it. */}
        <SectionBand className="mt-12 sm:mt-14">
          <SectionHeading eyebrow="Next steps" title="How to improve your score fastest" />
          <TickList
            className="mt-5"
            tone="mint"
            items={[
              'Use the accuracy-by-question-type breakdown on your results page. Most candidates lose more points on Fill in the Blanks and Re-order Paragraphs than on the speaking tasks they worry about.',
              'Fix Re-order Paragraphs first. It awards 1 point per correctly ordered adjacent pair, so learning pronoun chains and time markers recovers steady Reading marks.',
              'Practice Repeat Sentence daily. It is the largest single block of items in Part 1 and improves listening, speaking and pronunciation at the same time.',
              'Write the essay under time pressure. Structure alone protects the coherence score, and it is the part candidates most often lose by planning too long.',
              'Re-sit a full mock every four to seven days. The format is the thing being trained, not just the language.',
            ]}
          />

          <Reveal className="mt-8">
            <Tilt glare={false}>
              <Callout label="High-yield tools" className="p-6">
                <h3 className="text-ink-900 dark:text-white text-base font-bold">
                  Essential High-Yield Preparation Tools
                </h3>
                <p className="text-ink-600 dark:text-ink-on-dark mt-2 text-sm leading-relaxed">
                  Maximize your preparation efficiency by focusing on the 6 critical question types
                  that generate 70% of your total score, and adopt proven structures for subjective
                  tasks.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <ButtonLink to="/format#weightage" variant="primary" size="sm">
                    View Score Weightage Matrix
                  </ButtonLink>
                  <ButtonLink to="/guide#templates" variant="secondary" size="sm">
                    2025/2026 Strategy Templates
                  </ButtonLink>
                  <ButtonLink to="/guide#collocations" variant="secondary" size="sm">
                    Academic Collocations List
                  </ButtonLink>
                </div>
              </Callout>
            </Tilt>
          </Reveal>

          <SectionHeading
            className="mt-12 sm:mt-14"
            eyebrow="Questions"
            title="Frequently asked questions"
          />
          <Reveal variant="fade">
            <Accordion items={FAQ} />
          </Reveal>
        </SectionBand>

        <CtaBand
          title="Get a scored mock"
          description="See where your current score actually sits on this scale."
          actions={
            <ButtonLink to="/mock" size="lg" magnetic>
              Start a free mock test
            </ButtonLink>
          }
        />
      </PageWrapper>
    </>
  )
}
