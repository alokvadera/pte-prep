/**
 * Single source of truth for every SEO-relevant constant.
 *
 * The site is fully static, so the canonical origin has to be known at build
 * time for the prerendered HTML and for `sitemap.xml`. If it is not set, the
 * runtime falls back to the origin the site is actually served from, which
 * keeps canonicals correct on any domain without a rebuild.
 */

function readEnv(): string {
  const fromEnv =
    (import.meta.env as unknown as { VITE_SITE_ORIGIN?: string }).VITE_SITE_ORIGIN ?? ''
  return fromEnv.replace(/\/+$/, '')
}

export const SITE_ORIGIN = readEnv()

export const SITE = {
  name: 'PTE Prep',
  shortName: 'PTE Prep',
  tagline: 'Free unlimited PTE Academic mock tests',
  description:
    'Take full-length PTE Academic mock tests for free. All 22 question types, real section timings, instant score reports, CEFR band and question-by-question review. No signup required, no payment, runs in your browser with optional cloud sync.',
  locale: 'en_US',
  lang: 'en',
  logoText: 'PTE Prep',
  twitter: '@pteprep',
  /** Used when no VITE_SITE_ORIGIN is provided. */
  fallbackOrigin: 'https://pte-prep.pages.dev',
} as const

export function absoluteUrl(path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`
  // A build-time origin is trusted whole, sub-path included.
  if (SITE_ORIGIN) return `${SITE_ORIGIN}${clean}`
  if (typeof window !== 'undefined') {
    // Runtime fallback: the served origin plus the router base, so sub-path
    // deployments (e.g. /repo/) produce correct URLs without a rebuild.
    const base = import.meta.env.BASE_URL ?? '/'
    const prefix = base.endsWith('/') ? base.slice(0, -1) : base
    return `${window.location.origin}${prefix}${clean}`
  }
  return `${SITE.fallbackOrigin}${clean}`
}

export interface PageMeta {
  title: string
  description: string
  /** Path with a leading slash, no origin. */
  path: string
  /** Extra keywords, merged with the site-wide set. */
  keywords?: string[]
  /** Overrides the default OG type. */
  type?: 'website' | 'article'
  /** Absolute or root-relative image used for social cards. */
  image?: string
  /** Hides the page from the index (test runner, results). */
  noindex?: boolean
  /** JSON-LD blocks rendered alongside the page. */
  structuredData?: unknown[]
}

export const BASE_KEYWORDS = [
  'PTE mock test',
  'PTE Academic practice test',
  'PTE practice online free',
  'PTE Academic test',
  'PTE score',
  'PTE test format',
  'PTE Academic 2026',
  'free PTE mock test',
  'PTE practice test with score',
]

export function keywordsFor(extra: string[] = []): string {
  return [...new Set([...BASE_KEYWORDS, ...extra])].join(', ')
}
