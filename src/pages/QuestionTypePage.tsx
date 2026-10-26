import { Link, useParams } from 'react-router-dom'
import { QUESTION_META, SECTION_META } from '../domain/blueprint'
import type { QuestionType } from '../domain/types'
import {
  QUESTION_TYPE_DETAIL,
  faqForType,
  relatedTypes,
  typeFromSlug,
  typeSlug,
} from '../content/questionTypeDetail'
import { Seo } from '../seo/Seo'
import { Breadcrumbs } from '../components/ui/Breadcrumbs'
import {
  ButtonLink,
  Callout,
  NumMarker,
  PageWrapper,
  SectionHeading,
} from '../components/ui/primitives'
import { Reveal } from '../components/ui/motion'
import NotFound from './NotFound'

const SKILL_LABEL: Record<string, string> = {
  speaking: 'Speaking',
  writing: 'Writing',
  reading: 'Reading',
  listening: 'Listening',
}

const SKILL_BLURB: Record<string, string> = {
  speaking: 'contributes to your Speaking score',
  writing: 'contributes to your Writing score',
  reading: 'contributes to your Reading score',
  listening: 'contributes to your Listening score',
}

/**
 * One page per question type.
 *
 * The structural facts — skills, count on a test, scoring mode, traits — are read
 * from the blueprint at render time rather than restated as prose, so these
 * pages cannot fall out of step with the engine that builds the tests. Only the
 * explanatory writing comes from the content module.
 */
export default function QuestionTypePage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const type = typeFromSlug(slug)

  // An unknown slug is a genuine 404, not a redirect: the sitemap only lists real
  // types, and rendering a soft-404 here would be indexable thin content.
  if (!type) return <NotFound />

  const meta = QUESTION_META[type]
  const detail = QUESTION_TYPE_DETAIL[type]
  const section = SECTION_META[meta.section]
  const related = relatedTypes(type)

  return (
    <>
      <Seo />

      <PageWrapper
        breadcrumbs={
          <Breadcrumbs
            trail={[
              { name: 'Home', path: '/' },
              { name: 'PTE question types', path: '/question-types/' },
              { name: meta.label },
            ]}
          />
        }
        eyebrow={`${section.title}, ${section.longTitle}, ${meta.short}`}
        title={`${meta.label}: ${section.longTitle} PTE question type`}
        description={detail.what}
      >
        <p className="text-ink-600 dark:text-ink-200 mt-4 leading-relaxed">{detail.how}</p>

        <section className="mt-10 sm:mt-12">
          <SectionHeading eyebrow="Scoring" title={`How ${meta.label} is scored`} />
          <p className="text-ink-600 dark:text-ink-200 mt-3 leading-relaxed">{detail.scoring}</p>

          <dl className="card-solid mt-6 grid gap-px overflow-hidden p-0 sm:grid-cols-2">
            <div className="p-5">
              <dt className="text-ink-500 dark:text-ink-on-dark-muted text-xs font-semibold">
                Skills scored
              </dt>
              <dd className="text-ink-900 dark:text-white mt-1 flex flex-col gap-1 text-sm">
                {meta.skills.map((s) => (
                  <span key={s}>
                    <strong>{SKILL_LABEL[s]}</strong>
                    <span className="text-ink-500 dark:text-ink-on-dark-muted">
                      {' '}
                      — {SKILL_BLURB[s]}
                    </span>
                  </span>
                ))}
              </dd>
            </div>
            <div className="p-5">
              <dt className="text-ink-500 dark:text-ink-on-dark-muted text-xs font-semibold">
                Questions per test
              </dt>
              <dd className="text-ink-900 dark:text-white mt-1 text-sm">
                {meta.perTest}
                <span className="text-ink-500 dark:text-ink-on-dark-muted">
                  {' '}
                  in {section.longTitle}
                </span>
              </dd>
            </div>
            {meta.traits.length > 0 ? (
              <div className="p-5 sm:col-span-2">
                <dt className="text-ink-500 dark:text-ink-on-dark-muted text-xs font-semibold">
                  Traits Pearson rates
                </dt>
                <dd className="text-ink-900 dark:text-white mt-1 text-sm">
                  {meta.traits.join(', ')}
                </dd>
              </div>
            ) : null}
          </dl>

          {meta.skills.length > 1 ? (
            <p className="text-ink-500 dark:text-ink-on-dark-muted mt-3 text-sm leading-relaxed">
              This is an integrated item: the published blueprint assigns it to {meta.skills.length}{' '}
              skill scores. The exact contribution to each scaled score is not published.
            </p>
          ) : null}
        </section>

        <section className="mt-12 sm:mt-14">
          <SectionHeading
            className="mb-4"
            eyebrow="Watch out"
            title={`Common ${meta.label} mistakes`}
          />
          <ol className="space-y-3">
            {detail.mistakes.map((m, i) => (
              <Reveal key={i} variant="up" delay={Math.min(i, 6) * 25} duration={500}>
                <li className="flex gap-3">
                  <NumMarker tone="quiet" className="mt-0.5">
                    {i + 1}
                  </NumMarker>
                  <span className="text-ink-600 dark:text-ink-200 leading-relaxed">{m}</span>
                </li>
              </Reveal>
            ))}
          </ol>

          <Callout rule label="Strategy" className="mt-6">
            {meta.tip}
          </Callout>
        </section>

        <section className="mt-10 flex flex-wrap gap-3">
          <Reveal as="div" variant="up" delay={30} className="w-full sm:w-auto">
            <ButtonLink to={`/practice?type=${type}`} size="lg" magnetic>
              Practice {meta.label}
            </ButtonLink>
          </Reveal>
          <Reveal as="div" variant="up" delay={60} className="w-full sm:w-auto">
            <ButtonLink to="/mock" variant="secondary" size="lg">
              Sit a full mock
            </ButtonLink>
          </Reveal>
        </section>

        <section className="mt-16">
          <SectionHeading eyebrow="Questions" title={`${meta.label} questions, answered`} />
          {/* Rendered visibly because the FAQPage JSON-LD for this route is built
              from these same entries — marked-up FAQ content has to be on the
              page, not hidden in the head. */}
          <div className="card-solid mt-6 p-6 sm:p-8 divide-ink-200 dark:divide-white/10 divide-y">
            {faqForType(type).map((f) => (
              <div key={f.question} className="py-4 first:pt-0 last:pb-0">
                <h3 className="text-ink-900 dark:text-white text-sm font-bold text-balance">
                  {f.question}
                </h3>
                <p className="text-ink-600 dark:text-ink-on-dark mt-1.5 text-sm leading-relaxed">
                  {f.answer}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <SectionHeading
            eyebrow="Keep going"
            title={`Related ${section.longTitle.toLowerCase()} question types`}
          />
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {related.map((r: QuestionType, i: number) => (
              <Reveal key={r} variant="up" delay={Math.min(i, 4) * 25} duration={500}>
                <li className="card-solid p-5 hover:border-mark-500/50 transition-all group">
                  <Link
                    to={`/question-types/${typeSlug(r)}/`}
                    className="text-ink-900 dark:text-white group-hover:text-mark-600 dark:group-hover:text-mark-300 font-bold text-sm inline-flex min-h-[32px] items-center py-1 transition-colors"
                  >
                    {QUESTION_META[r].label} →
                  </Link>
                  <p className="text-ink-500 dark:text-ink-on-dark-muted mt-1 text-xs">
                    {QUESTION_META[r].perTest} per test,{' '}
                    {QUESTION_META[r].skills.map((s) => SKILL_LABEL[s]).join(' + ')}
                  </p>
                </li>
              </Reveal>
            ))}
          </ul>

          <p className="text-ink-500 dark:text-ink-on-dark-muted mt-6 text-sm leading-relaxed">
            <Link to="/question-types/" className="link-inline">
              All {SECTION_META[meta.section].longTitle} question types
            </Link>
            ,{' '}
            <Link to="/guide" className="link-inline">
              tips for all 22 types
            </Link>
            ,{' '}
            <Link to="/format" className="link-inline">
              full test format
            </Link>
            ,{' '}
            <Link to="/scoring" className="link-inline">
              how PTE scores work
            </Link>
            .
          </p>
        </section>

        <p className="text-ink-500 dark:text-ink-on-dark-muted mt-10 text-xs">
          Scoring figures on this page follow the current PTE Academic official guide. This is an
          independent practice site and is not affiliated with Pearson.
        </p>
      </PageWrapper>
    </>
  )
}
