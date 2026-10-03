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
import { PointerField, Reveal, Tilt } from '../components/ui/motion'
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
          <Breadcrumbs
            trail={[{ name: 'Home', path: '/' }, { name: 'PTE question types' }]}
          />
        }
        eyebrow="Question type library"
        title={`All ${ALL_QUESTION_TYPES.length} PTE Academic question types`}
        description="See what each task asks you to do, how it is scored, and where marks are commonly lost. Each guide links directly to a matching practice drill."
      >

        <div className="-mt-4 mb-8 flex flex-wrap gap-2">
          {SECTION_ORDER.map((s) => (
            <a
              key={s}
              href={`#${s}`}
              className="btn-secondary px-3 py-1.5 text-xs"
            >
              {SECTION_META[s].longTitle}
            </a>
          ))}
        </div>

        {SECTION_ORDER.map((section, idx) => {
          const meta = SECTION_META[section]
          const types = typesInSection(section)

          return (
            <section key={section} id={section} className={cn('scroll-mt-24', idx === 0 ? 'mt-8' : 'mt-14 sm:mt-16')}>
              <div className="border-ink-200 dark:border-white/10 border-t pt-8">
                <SectionHeading
                  className="mb-2"
                  eyebrow={`Part ${idx + 1}`}
                  title={`${meta.title}: ${meta.longTitle}`}
                />
                <p className="text-ink-500 dark:text-ink-300 mt-2 max-w-2xl leading-relaxed">{meta.blurb}</p>
                <p className="text-ink-500 dark:text-ink-400 mt-2 font-mono text-xs">
                  {types.length} types · {meta.weightNote}
                </p>
              </div>

              <PointerField className="mt-8">
              <ul className="grid gap-4 sm:grid-cols-2">
                {types.map((type, i) => {
                  const q = QUESTION_META[type]
                  const detail = QUESTION_TYPE_DETAIL[type]
                  const slug = typeSlug(type)

                  return (
                    <Reveal as="li" key={type} delay={Math.min(i, 4) * 45} duration={600} className="flex">
                      {/* `data-pf` opts this card into the proximity field. It
                          sits on the card and not on the Reveal wrapper above
                          it, because both animate `translate` and only one of
                          them may own it. */}
                      <article data-pf className="card-solid flex w-full flex-col">
                      <div className="flex min-w-0 items-start justify-between gap-3">
                        <h3 className="text-ink-900 dark:text-white min-w-0 text-base font-bold leading-tight text-balance">
                          {/* Padded so the card title is a 24px tap target; the
                              negative margin keeps the card's own spacing. */}
                          <Link
                            to={`/question-types/${slug}/`}
                            className="hover:text-brand-600 dark:hover:text-brand-300 -m-1 inline-block px-1 py-1"
                          >
                            {q.label}
                          </Link>
                        </h3>
                        <span className="shrink-0 font-mono text-micro text-ink-500 dark:text-ink-400">{q.short}</span>
                      </div>

                      <p className="text-ink-500 dark:text-ink-300 mt-2 text-sm leading-relaxed">{detail.what}</p>

                      {/* These three were label/value pairs on one wrapped line, separated only
                          by space, so they read as a run-on: "Skills Speaking
                          Per test 6–7 Scoring Scored on traits". Stacked, each
                          fact is findable and the card can be scanned rather
                          than read. */}
                      <dl className="text-ink-700 dark:text-ink-300 mt-3 space-y-1 text-xs">
                        <div className="flex gap-2">
                          <dt className="text-ink-500 dark:text-ink-400 w-14 shrink-0">Skills</dt>
                          <dd>{q.skills.map((s) => SKILL_LABEL[s]).join(' + ')}</dd>
                        </div>
                        <div className="flex gap-2">
                          <dt className="text-ink-500 dark:text-ink-400 w-14 shrink-0">Per test</dt>
                          <dd>{q.perTest}</dd>
                        </div>
                        <div className="flex gap-2">
                          <dt className="text-ink-500 dark:text-ink-400 w-14 shrink-0">Scoring</dt>
                          <dd>{SCORING_LABEL[q.scoring]}</dd>
                        </div>
                      </dl>

                      {/* One action per card. "Guide & rubric →" pointed at exactly the same place
                          as the card title directly above it, so the guide was
                          linked twice and the drill — the action a candidate on
                          this page is most likely to want — had to share the row
                          with its own twin. The title carries the guide. */}
                      <div className="border-ink-100 dark:border-white/6 mt-4 flex items-center border-t pt-2.5 text-xs">
                        <Link
                          to={`/practice?type=${type}`}
                          className="-m-1 inline-flex min-h-6 items-center rounded-sm px-1 text-brand-600 hover:text-brand-700 dark:text-brand-300 dark:hover:text-brand-200 font-semibold hover:underline"
                        >
                          Drill this type →
                        </Link>
                      </div>
                      </article>
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
          <p className="text-ink-600 dark:text-ink-300 mt-3 leading-relaxed">
            Only three of the {ALL_QUESTION_TYPES.length} types carry negative marking: Multiple Choice (Multiple
            Answers) in Reading, Multiple Choice (Multiple Answers) in Listening, and Highlight Incorrect Words. Every
            other partial-credit type is positive-only, so a wrong answer there costs you the point and nothing more.
          </p>
          <TickList
            className="mt-4"
            items={[
              <>
                <strong className="text-ink-900 dark:text-white">Correct or incorrect</strong> — all or nothing, no
                partial credit. Worth one point when right, zero when wrong.
              </>,
              <>
                <strong className="text-ink-900 dark:text-white">One point per blank or word</strong> — every blank stands
                alone, so partial credit is automatic.
              </>,
              <>
                <strong className="text-ink-900 dark:text-white">Marked against wrong answers</strong> — one point per
                correct option minus one per incorrect option, floored at zero.
              </>,
              <>
                <strong className="text-ink-900 dark:text-white">Scored on traits</strong> — spoken and written responses
                are rated on content and, for writing, form. Where form scores zero, the whole item scores zero.
              </>,
            ]}
          />
          <p className="text-ink-600 dark:text-ink-300 mt-4 leading-relaxed">
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
        <Tilt className="mt-8" glare={false}>
            <h3 className="text-ink-900 dark:text-white text-lg font-semibold text-balance">Common questions</h3>
            <div className="mt-3 divide-ink-200 dark:divide-white/10 divide-y border-y">
              {HUB_FAQ.map((f) => (
                <div key={f.question} className="px-1 py-4 sm:px-2">
                  <h4 className="text-ink-900 dark:text-white text-sm font-semibold text-balance">{f.question}</h4>
                  <p className="text-ink-600 dark:text-ink-300 mt-1.5 text-sm leading-relaxed">{f.answer}</p>
                </div>
              ))}
            </div>
          </Tilt>
        </Reveal>
        </SectionBand>

        <CtaBand
          title="Practice all 22 question types"
          description="Every type on this page appears in the full mock and in single-skill drills, with the same timings and scoring rules as the real test."
          actions={
            <>
              <ButtonLink to="/mock" size="lg">Start a full mock</ButtonLink>
              <ButtonLink to="/practice" variant="secondary" size="lg">Practice one type</ButtonLink>
            </>
          }
        />
      </PageWrapper>
    </>
  )
}
