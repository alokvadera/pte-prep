import { Link, useParams } from 'react-router-dom'
import { QUESTION_META, SECTION_META } from '../domain/blueprint'
import type { QuestionType } from '../domain/types'
import { QUESTION_TYPE_DETAIL, faqForType, relatedTypes, typeFromSlug, typeSlug } from '../content/questionTypeDetail'
import { Seo } from '../seo/Seo'
import { Breadcrumbs } from '../components/ui/Breadcrumbs'
import {
  ButtonLink,
  Callout,
  NumMarker,
  PageWrapper,
  SectionHeading,
} from '../components/ui/primitives'
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
        eyebrow={`${section.title} · ${section.longTitle} · ${meta.short}`}
        title={`${meta.label}: ${section.longTitle} PTE question type`}
        description={detail.what}
      >
        <p className="text-ink-600 dark:text-ink-200 mt-4 leading-relaxed">{detail.how}</p>

        <section className="mt-10 sm:mt-12">
          <SectionHeading eyebrow="Scoring" title={`How ${meta.label} is scored`} />
          <p className="text-ink-600 dark:text-ink-200 mt-3 leading-relaxed">{detail.scoring}</p>

          <dl className="card-solid mt-6 grid gap-px overflow-hidden p-0 sm:grid-cols-2">
            <div className="p-5">
              <dt className="text-ink-500 dark:text-ink-400 text-xs font-semibold">Skills scored</dt>
              <dd className="text-ink-900 dark:text-white mt-1 flex flex-col gap-1 text-sm">
                {meta.skills.map((s) => (
                  <span key={s}>
                    <strong>{SKILL_LABEL[s]}</strong>
                    <span className="text-ink-500 dark:text-ink-400"> — {SKILL_BLURB[s]}</span>
                  </span>
                ))}
              </dd>
            </div>
            <div className="p-5">
              <dt className="text-ink-500 dark:text-ink-400 text-xs font-semibold">Questions per test</dt>
              <dd className="text-ink-900 dark:text-white mt-1 text-sm">
                {meta.perTest}
                <span className="text-ink-500 dark:text-ink-400"> in {section.longTitle}</span>
              </dd>
            </div>
            {meta.traits.length > 0 ? (
              <div className="p-5 sm:col-span-2">
                <dt className="text-ink-500 dark:text-ink-400 text-xs font-semibold">Traits Pearson rates</dt>
                <dd className="text-ink-900 dark:text-white mt-1 text-sm">{meta.traits.join(' · ')}</dd>
              </div>
            ) : null}
          </dl>

          {meta.skills.length > 1 ? (
            <p className="text-ink-500 dark:text-ink-400 mt-3 text-sm leading-relaxed">
              This is an integrated item: it counts towards {meta.skills.length} different skill scores at once, which is
              why its weighting in a full test is higher than a single-skill item.
            </p>
          ) : null}
        </section>

        <section className="mt-12 sm:mt-14">
          <SectionHeading className="mb-4" eyebrow="Watch out" title={`Common ${meta.label} mistakes`} />
          <ol className="space-y-3">
            {detail.mistakes.map((m, i) => (
              <li key={i} className="flex gap-3">
                <NumMarker tone="quiet" className="mt-0.5">
                  {i + 1}
                </NumMarker>
                <span className="text-ink-600 dark:text-ink-200 leading-relaxed">{m}</span>
              </li>
            ))}
          </ol>

          <Callout rule label="Strategy" className="mt-6">
            {meta.tip}
          </Callout>
        </section>

        <section className="mt-10 flex flex-wrap gap-3">
          <ButtonLink to={`/practice?type=${type}`} size="lg">Practice {meta.label}</ButtonLink>
          <ButtonLink to="/mock" variant="secondary" size="lg">Sit a full mock</ButtonLink>
        </section>

        <section className="mt-16">
          <SectionHeading eyebrow="Questions" title={`${meta.label} questions, answered`} />
          {/* Rendered visibly because the FAQPage JSON-LD for this route is built
              from these same entries — marked-up FAQ content has to be on the
              page, not hidden in the head. */}
          <div className="mt-4 divide-ink-200 dark:divide-white/10 divide-y border-y">
            {faqForType(type).map((f) => (
              <div key={f.question} className="px-1 py-4 sm:px-2">
                <h3 className="text-ink-900 dark:text-white text-sm font-semibold text-balance">{f.question}</h3>
                <p className="text-ink-600 dark:text-ink-300 mt-1.5 text-sm leading-relaxed">{f.answer}</p>
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
            {related.map((r: QuestionType) => (
              <li key={r} className="card-solid p-4">
                <Link
                  to={`/question-types/${typeSlug(r)}/`}
                  className="text-ink-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-300 -m-1 inline-block px-1 py-1 font-semibold"
                >
                  {QUESTION_META[r].label}
                </Link>
                <p className="text-ink-500 dark:text-ink-400 mt-1 text-xs">
                  {QUESTION_META[r].perTest} per test · {QUESTION_META[r].skills.map((s) => SKILL_LABEL[s]).join(' + ')}
                </p>
              </li>
            ))}
          </ul>

          <p className="text-ink-500 dark:text-ink-400 mt-6 text-sm leading-relaxed">
            <Link to="/question-types/" className="link-inline">
              All {SECTION_META[meta.section].longTitle} question types
            </Link>{' '}
            ·{' '}
            <Link to="/guide" className="link-inline">
              tips for all 22 types
            </Link>{' '}
            ·{' '}
            <Link to="/format" className="link-inline">
              full test format
            </Link>{' '}
            ·{' '}
            <Link to="/scoring" className="link-inline">
              how PTE scores work
            </Link>
            .
          </p>
        </section>

        <p className="text-ink-500 dark:text-ink-400 mt-10 text-xs">
          Scoring figures on this page follow the current PTE Academic official guide. This is an independent practice
          site and is not affiliated with Pearson.
        </p>
      </PageWrapper>
    </>
  )
}
