import { Link } from 'react-router-dom'
import { ALL_QUESTION_TYPES, QUESTION_META, SECTION_META } from '../domain/blueprint'
import type { QuestionType, SectionId } from '../domain/types'
import { HUB_FAQ, QUESTION_TYPE_DETAIL, typeSlug } from '../content/questionTypeDetail'
import { Seo } from '../seo/Seo'
import {
  ButtonLink,
  CtaBand,
  PageWrapper,
  SectionBand,
  SectionHeading,
  TickList,
} from '../components/ui/primitives'
import { Breadcrumbs } from '../components/ui/Breadcrumbs'
import { PointerField, Reveal } from '../components/ui/motion'
import { FlipCard } from '../components/ui/flip-card'
import { RefreshCw } from 'lucide-react'
import { cn } from '../lib/cn'

const SECTION_ORDER: SectionId[] = ['speaking-writing', 'reading', 'listening']

/** Plain-language name for each scoring mode, used as a column heading. */
const SCORING_LABEL: Record<string, string> = {
  binary: 'Correct or incorrect',
  'per-blank': 'One point per blank',
  'per-word': 'One point per word',
  'per-unit-negated': 'Marked against wrong answers',
  'per-adjacent-pair': 'One point per correct pair',
  'trait-composite': 'Scored on traits',
}

const SKILL_LABEL: Record<string, string> = {
  speaking: 'Speaking',
  writing: 'Writing',
  reading: 'Reading',
  listening: 'Listening',
}

const TOP_WEIGHT_TYPES = new Set<QuestionType>([
  'read-aloud',
  'repeat-sentence',
  'fill-in-blanks-dropdown',
  'summarize-spoken-text',
  'fill-in-blanks-listening',
  'write-from-dictation',
])

/**
 * Two types share a name across sections — Multiple Choice (Single Answer) and
 * Multiple Choice (Multiple Answers) each appear in both Reading and Listening.
 * The table repeats the section so the two are never ambiguous, on screen or in
 * a search result.
 */
function typesInSection(section: SectionId): QuestionType[] {
  return ALL_QUESTION_TYPES.filter((t) => QUESTION_META[t].section === section)
}

export default function QuestionTypes() {
  return (
    <>
      <Seo />

      <PageWrapper
        breadcrumbs={
          <Breadcrumbs trail={[{ name: 'Home', path: '/' }, { name: 'PTE question types' }]} />
        }
        eyebrow="Question type library"
        title={`All ${ALL_QUESTION_TYPES.length} PTE Academic question types`}
        description="See what each task asks you to do, how it is scored, and where marks are commonly lost. Each guide links directly to a matching practice drill."
      >
        <div className="-mt-2 mb-10 flex flex-wrap gap-2.5">
          {SECTION_ORDER.map((s, idx) => (
            <a
              key={s}
              href={`#${s}`}
              className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-4 py-2 text-xs font-bold text-ink-800 transition-all hover:border-mark-500 hover:text-mark-600 dark:border-white/10 dark:bg-white/5 dark:text-ink-100 dark:hover:border-mark-400 dark:hover:text-mark-300 shadow-xs"
            >
              <span className="size-2 rounded-full bg-mark-500" aria-hidden="true" />
              <span>
                Part {idx + 1}: {SECTION_META[s].longTitle}
              </span>
            </a>
          ))}
        </div>

        {SECTION_ORDER.map((section, idx) => {
          const meta = SECTION_META[section]
          const types = typesInSection(section)

          return (
            <section
              key={section}
              id={section}
              className={cn('scroll-mt-24', idx === 0 ? 'mt-8' : 'mt-14 sm:mt-16')}
            >
              <div className="border-ink-200 dark:border-white/10 border-t pt-8">
                <SectionHeading
                  className="mb-2"
                  eyebrow={`Part ${idx + 1}`}
                  title={`${meta.title}: ${meta.longTitle}`}
                />
                <p className="text-ink-500 dark:text-ink-on-dark mt-2 max-w-2xl leading-relaxed">
                  {meta.blurb}
                </p>
                <p className="text-ink-500 dark:text-ink-on-dark-muted mt-2 font-mono text-xs">
                  {types.length} types, {meta.weightNote}
                </p>
              </div>

              <PointerField className="mt-8">
                <ul className="grid gap-4 sm:grid-cols-2">
                  {types.map((type, i) => {
                    const q = QUESTION_META[type]
                    const detail = QUESTION_TYPE_DETAIL[type]
                    const slug = typeSlug(type)

                    return (
                      <Reveal
                        as="li"
                        key={type}
                        delay={Math.min(i, 4) * 45}
                        duration={600}
                        className="flex"
                      >
                        {/* The card flips over for its pro tip.
                          `data-pf` opts the front face into the
                          proximity field — it sits on the card
                          and not on the Reveal wrapper above it,
                          because both animate `translate` and
                          only one of them may own it. */}
                        <FlipCard
                          className="w-full"
                          flipLabel={`Pro tip for ${q.label}`}
                          front={
                            <article data-pf className="card-solid flex h-full w-full flex-col">
                              <div className="flex min-w-0 items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <h3 className="text-ink-900 dark:text-white min-w-0 text-base font-bold leading-tight text-balance">
                                    {/* Padded so the card title is a 24px tap target; the
                                negative margin keeps the card's own spacing. */}
                                    <Link
                                      to={`/question-types/${slug}/`}
                                      className="hover:text-mark-600 dark:hover:text-mark-300 -m-1 inline-block px-1 py-1 transition-colors"
                                    >
                                      {q.label}
                                    </Link>
                                  </h3>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {TOP_WEIGHT_TYPES.has(type) && (
                                    <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                                      High Yield
                                    </span>
                                  )}
                                  <span className="font-mono text-xs text-ink-500 dark:text-ink-on-dark-muted">
                                    {q.short}
                                  </span>
                                </div>
                              </div>

                              <p className="text-ink-500 dark:text-ink-on-dark mt-2 text-sm leading-relaxed">
                                {detail.what}
                              </p>

                              {/* These three were label/value pairs on one wrapped line, separated only
                          by space, so they read as a run-on: "Skills Speaking
                          Per test 6–7 Scoring Scored on traits". Stacked, each
                          fact is findable and the card can be scanned rather
                          than read. */}
                              <dl className="text-ink-700 dark:text-ink-on-dark mt-3 space-y-1 text-xs">
                                <div className="flex gap-2">
                                  <dt className="text-ink-500 dark:text-ink-on-dark-muted w-14 shrink-0">
                                    Skills
                                  </dt>
                                  <dd>{q.skills.map((s) => SKILL_LABEL[s]).join(' + ')}</dd>
                                </div>
                                <div className="flex gap-2">
                                  <dt className="text-ink-500 dark:text-ink-on-dark-muted w-14 shrink-0">
                                    Per test
                                  </dt>
                                  <dd>{q.perTest}</dd>
                                </div>
                                <div className="flex gap-2">
                                  <dt className="text-ink-500 dark:text-ink-on-dark-muted w-14 shrink-0">
                                    Scoring
                                  </dt>
                                  <dd>{SCORING_LABEL[q.scoring]}</dd>
                                </div>
                              </dl>

                              {/* Clean action row */}
                              <div className="border-ink-100 dark:border-white/6 mt-4 flex items-center justify-between border-t pt-3 text-xs">
                                <Link
                                  to={`/practice?type=${type}`}
                                  className="inline-flex min-h-[32px] items-center gap-1 py-1.5 font-bold text-mark-600 hover:text-mark-700 dark:text-mark-300 dark:hover:text-mark-200 transition-colors"
                                >
                                  <span>Drill this type</span>
                                  <span aria-hidden="true">→</span>
                                </Link>
                                <span className="flex items-center gap-1 text-[11px] font-semibold text-ink-500 dark:text-ink-on-dark-muted">
                                  <RefreshCw className="size-3" aria-hidden="true" />
                                  Flip for pro tip
                                </span>
                              </div>
                            </article>
                          }
                          back={
                            <article className="card-solid flex h-full w-full flex-col p-[26px]">
                              <span className="pill-purple mb-3 w-fit">Pro tip</span>
                              <p className="text-ink-600 dark:text-ink-on-dark text-[15px] leading-relaxed">
                                {q.tip}
                              </p>
                              <span className="border-ink-100 dark:border-white/6 mt-auto flex items-center border-t pt-2.5 text-[11px] font-semibold text-ink-500 dark:text-ink-on-dark-muted">
                                Flip again to flip back
                              </span>
                            </article>
                          }
                        />
                      </Reveal>
                    )
                  })}
                </ul>
              </PointerField>
            </section>
          )
        })}

        <SectionBand className="mt-16">
          <Reveal as="section">
            <SectionHeading eyebrow="Scoring rules" title="How scoring works across the test" />
            <p className="text-ink-600 dark:text-ink-on-dark mt-3 leading-relaxed">
              Only three of the {ALL_QUESTION_TYPES.length} types carry negative marking: Multiple
              Choice (Multiple Answers) in Reading, Multiple Choice (Multiple Answers) in Listening,
              and Highlight Incorrect Words. Every other partial-credit type is positive-only, so a
              wrong answer there costs you the point and nothing more.
            </p>
            <TickList
              className="mt-4"
              items={[
                <>
                  <strong className="text-ink-900 dark:text-white">Correct or incorrect</strong> —
                  all or nothing, no partial credit. Worth one point when right, zero when wrong.
                </>,
                <>
                  <strong className="text-ink-900 dark:text-white">
                    One point per blank or word
                  </strong>{' '}
                  — every blank stands alone, so partial credit is automatic.
                </>,
                <>
                  <strong className="text-ink-900 dark:text-white">
                    Marked against wrong answers
                  </strong>{' '}
                  — one point per correct option minus one per incorrect option, floored at zero.
                </>,
                <>
                  <strong className="text-ink-900 dark:text-white">Scored on traits</strong> —
                  spoken and written responses are rated on content and, for writing, form. Where
                  form scores zero, the whole item scores zero.
                </>,
              ]}
            />
            <p className="text-ink-600 dark:text-ink-on-dark mt-4 leading-relaxed">
              For the full scale conversion and CEFR bands, see the{' '}
              <Link to="/scoring" className="link-inline">
                PTE score guide
              </Link>
              . For timings and section structure, see{' '}
              <Link to="/format" className="link-inline">
                the test format
              </Link>
              .
            </p>
            <div className="card-solid mt-8 p-6 sm:p-8">
              <h3 className="text-ink-900 dark:text-white text-lg font-bold text-balance">
                Common questions
              </h3>
              <div className="mt-4 divide-ink-200 dark:divide-white/10 divide-y">
                {HUB_FAQ.map((f) => (
                  <div key={f.question} className="py-4 first:pt-0 last:pb-0">
                    <h4 className="text-ink-900 dark:text-white text-sm font-bold text-balance">
                      {f.question}
                    </h4>
                    <p className="text-ink-600 dark:text-ink-on-dark mt-1.5 text-sm leading-relaxed">
                      {f.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </SectionBand>

        <CtaBand
          title="Practice all 22 question types"
          description="Every type on this page appears in the full mock and in single-skill drills, with the same timings and scoring rules as the real test."
          actions={
            <>
              <ButtonLink to="/mock" size="lg" magnetic>
                Start a full mock
              </ButtonLink>
              <ButtonLink to="/practice" variant="secondary" size="lg">
                Practice one type
              </ButtonLink>
            </>
          }
        />
      </PageWrapper>
    </>
  )
}
