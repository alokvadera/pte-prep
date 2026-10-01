import { SITE, absoluteUrl, keywordsFor } from './site'

// ---------------------------------------------------------------------------
// JSON-LD builders.
//
// Structured data is emitted as plain objects so that the same definitions can
// be serialised into the static HTML at build time and into the live document
// on the client.
// ---------------------------------------------------------------------------

export function organizationLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE.name,
    url: SITE.fallbackOrigin,
    logo: absoluteUrl('/icon-512.png'),
  }
}

export function webApplicationLd(opts: { name: string; description: string; path: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: opts.name,
    description: opts.description,
    url: absoluteUrl(opts.path),
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Any modern web browser',
    browserRequirements: 'Requires JavaScript. Microphone optional.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    featureList: [
      'Full-length timed PTE Academic mock tests',
      'All 22 official PTE question types',
      'Instant score report with CEFR band',
      'Question-by-question answer review',
      'Works offline after first visit',
    ],
  }
}

export function faqLd(entries: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: entries.map((e) => ({
      '@type': 'Question',
      name: e.question,
      acceptedAnswer: { '@type': 'Answer', text: e.answer },
    })),
  }
}

export function breadcrumbLd(trail: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.path),
    })),
  }
}

export function howToLd(opts: {
  name: string
  description: string
  steps: Array<{ name: string; text: string }>
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: opts.name,
    description: opts.description,
    step: opts.steps.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, name: s.name, text: s.text })),
  }
}

export function itemListLd(entries: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: entries.map((e, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: e.name,
      url: absoluteUrl(e.path),
    })),
  }
}

// ---------------------------------------------------------------------------
// Head serialisation
// ---------------------------------------------------------------------------

const escapeAttr = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/** JSON-LD is embedded in a script element, so it only needs `<` escaped. */
const escapeJsonLd = (value: unknown): string =>
  JSON.stringify(value).replace(/</g, '\\u003c')

export interface HeadTag {
  tag: 'title' | 'meta' | 'link' | 'script'
  attrs?: Record<string, string>
  text?: string
}

/**
 * Append the brand only when the title still fits the SERP.
 *
 * Google truncates the title tag at roughly 600px, which is about 60 characters.
 * A page whose title already uses most of that budget is better served by
 * keeping every character of its own text than by tacking on a suffix that will
 * be cut off — and the keyword matters more than the brand. So the suffix is
 * dropped once the base title passes `BRAND_BUDGET` characters.
 */
const BRAND_BUDGET = 48

export function pageHeadTags(meta: import('./site').PageMeta): HeadTag[] {
  const base = meta.title
  const fullTitle =
    base.includes(SITE.name) || base.length > BRAND_BUDGET ? base : `${base} | ${SITE.name}`
  const canonical = absoluteUrl(meta.path)
  const image = meta.image ?? '/og-default.png'
  const imageUrl = image.startsWith('http') ? image : absoluteUrl(image)

  const tags: HeadTag[] = [
    { tag: 'title', text: fullTitle },
    { tag: 'meta', attrs: { name: 'description', content: meta.description } },
    { tag: 'meta', attrs: { name: 'keywords', content: keywordsFor(meta.keywords) } },
    { tag: 'link', attrs: { rel: 'canonical', href: canonical } },
    {
      tag: 'meta',
      attrs: {
        name: 'robots',
        content: meta.noindex
          ? 'noindex, nofollow'
          : 'index, follow, max-image-preview:large, max-snippet:-1',
      },
    },
    { tag: 'meta', attrs: { property: 'og:site_name', content: SITE.name } },
    { tag: 'meta', attrs: { property: 'og:type', content: meta.type ?? 'website' } },
    { tag: 'meta', attrs: { property: 'og:title', content: fullTitle } },
    { tag: 'meta', attrs: { property: 'og:description', content: meta.description } },
    { tag: 'meta', attrs: { property: 'og:url', content: canonical } },
    { tag: 'meta', attrs: { property: 'og:image', content: imageUrl } },
    { tag: 'meta', attrs: { property: 'og:image:alt', content: `${SITE.name} — ${meta.title}` } },
    { tag: 'meta', attrs: { property: 'og:locale', content: SITE.locale } },
    { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
    { tag: 'meta', attrs: { name: 'twitter:title', content: fullTitle } },
    { tag: 'meta', attrs: { name: 'twitter:description', content: meta.description } },
    { tag: 'meta', attrs: { name: 'twitter:image', content: imageUrl } },
  ]

  for (const block of meta.structuredData ?? []) {
    tags.push({ tag: 'script', attrs: { type: 'application/ld+json' }, text: escapeJsonLd(block) })
  }

  return tags
}

export function renderHeadTags(tags: HeadTag[]): string {
  return tags
    .map((t) => {
      if (t.tag === 'title') return `<title>${escapeAttr(t.text ?? '')}</title>`
      if (t.tag === 'script') {
        return `<script type="${escapeAttr(t.attrs?.type ?? 'application/ld+json')}">${t.text ?? ''}</script>`
      }
      const attrs = Object.entries(t.attrs ?? {})
        .map(([k, v]) => `${k}="${escapeAttr(v)}"`)
        .join(' ')
      return `<${t.tag} ${attrs} />`
    })
    .join('\n    ')
}
