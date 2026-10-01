import { ALL_QUESTION_TYPES, QUESTION_META, SECTION_META } from '../domain/blueprint'
import type { QuestionType } from '../domain/types'
import { HUB_FAQ, faqForType, typeSlug } from '../content/questionTypeDetail'
import type { PageMeta } from './site'
import { breadcrumbLd, faqLd, itemListLd } from './structured'

/**
 * Metadata for the question-type hub and its 22 spokes.
 *
 * Two PTE types share a display name across sections — Multiple Choice (Single
 * Answer) and Multiple Choice (Multiple Answers) each appear in Reading and in
 * Listening, and there are three Fill in the Blanks variants. If the page title
 * were built from the label alone, those pages would compete with each other for
 * the same keywords. Every title and description therefore carries the section,
 * which both disambiguates the pairs and matches the two ways people actually
 * search for them ("reading multiple choice pte" is a real, distinct query).
 *
 * The descriptions are composed from the editorial copy rather than hand-written
 * per page, so a page can never claim something the blueprint does not back.
 */

function trailFor(type: QuestionType): Array<{ name: string; path: string }> {
  return [
    { name: 'Home', path: '/' },
    { name: 'PTE question types', path: '/question-types/' },
    { name: QUESTION_META[type].label, path: `/question-types/${typeSlug(type)}/` },
  ]
}

/**
 * A description-quality phrase for each scoring mode.
 *
 * Written out per mode rather than interpolated from the mode's own identifier,
 * because "scored via per-blank" is not a phrase a person would search for, and
 * because a vague phrase repeated across five pages is what makes programmatic
 * pages read as machine-generated.
 */
const SCORING_PHRASE: Record<string, string> = {
  binary: 'correct or incorrect, no partial credit',
  'per-blank': 'one point per blank filled in correctly',
  'per-word': 'one point per word spelled correctly',
  'per-unit-negated': 'one point per correct option, minus one per wrong',
  'per-adjacent-pair': 'one point per correctly ordered pair',
  'trait-composite': 'scored on content and form',
}

/**
 * The section as a single word, for the description.
 *
 * "Speaking & Writing" is three words too long for a snippet once a long label
 * like "Multiple Choice (Multiple Answers)" has already been spent on the front
 * of the sentence. The full section name still appears in the title and the H1.
 */
function sectionWord(type: QuestionType): string {
  switch (QUESTION_META[type].section) {
    case 'reading':
      return 'Reading'
    case 'listening':
      return 'Listening'
    default:
      return 'Speaking & Writing'
  }
}

function spokeMeta(type: QuestionType): PageMeta {
  const meta = QUESTION_META[type]
  const section = SECTION_META[meta.section]
  const path = `/question-types/${typeSlug(type)}/`

  return {
    title: `PTE ${meta.label} — ${section.longTitle}`,
    description: `${meta.label} is a PTE ${sectionWord(type)} item: ${meta.perTest} per test, ${SCORING_PHRASE[meta.scoring]}. What it is and how to practise it.`,
    path,
    keywords: [
      `PTE ${meta.label}`,
      `PTE ${section.longTitle.toLowerCase()} ${meta.label}`,
      `what is ${meta.label} PTE`,
      `${meta.label} PTE Academic`,
    ],
    structuredData: [faqLd(faqForType(type)), breadcrumbLd(trailFor(type))],
  }
}

/** The hub, plus one entry per spoke, keyed by path. */
export const QUESTION_TYPE_META: Record<string, PageMeta> = {
  '/question-types/': {
    title: `All ${ALL_QUESTION_TYPES.length} PTE Academic Question Types`,
    description: `All ${ALL_QUESTION_TYPES.length} PTE Academic question types: what each asks, which skill it scores, how many appear on the test, how it is scored, and where marks are lost.`,
    path: '/question-types/',
    keywords: [
      'PTE question types',
      'PTE Academic question types',
      'PTE question types list',
      'how many question types in PTE',
    ],
    structuredData: [
      itemListLd(
        ALL_QUESTION_TYPES.map((t) => ({
          name: QUESTION_META[t].label,
          path: `/question-types/${typeSlug(t)}/`,
        })),
      ),
      faqLd(HUB_FAQ),
      breadcrumbLd([
        { name: 'Home', path: '/' },
        { name: 'PTE question types', path: '/question-types/' },
      ]),
    ],
  },

  ...Object.fromEntries(ALL_QUESTION_TYPES.map((t) => [`/question-types/${typeSlug(t)}/`, spokeMeta(t)])),
}