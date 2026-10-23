import { describe, expect, it, vi } from 'vitest'
import { absoluteUrl, BASE_KEYWORDS, keywordsFor, SITE, SITE_ORIGIN } from '../../../src/seo/site'

/* ---------------------------------------------------------------------------
   Site constants and URL helpers.

   `site.ts` reads the canonical origin from `VITE_SITE_ORIGIN` at module load.
   That variable is not set in the test environment, so `SITE_ORIGIN` is the
   empty string and every URL falls back to the origin the page is served from
   (the jsdom origin here). The build-time origin is covered by re-importing
   the module with the variable stubbed.
   --------------------------------------------------------------------------- */

describe('site constants', () => {
  it('describes the product', () => {
    expect(SITE.name).toBe('PTE Prep')
    expect(SITE.shortName).toBe('PTE Prep')
    expect(SITE.logoText).toBe('PTE Prep')
    expect(SITE.tagline).toBe('Free unlimited PTE Academic mock tests')
    expect(SITE.twitter).toBe('@pteprep')
  })

  it('uses a British-English locale for social cards', () => {
    expect(SITE.locale).toBe('en_US')
    expect(SITE.lang).toBe('en')
  })

  it('carries a description that names every part of the offer', () => {
    expect(SITE.description).toContain('PTE Academic mock tests for free')
    expect(SITE.description).toContain('22 question types')
    expect(SITE.description).toContain('CEFR band')
    expect(SITE.description).toContain('No signup required')
  })

  it('keeps a known fallback origin for builds without VITE_SITE_ORIGIN', () => {
    expect(SITE.fallbackOrigin).toBe('https://pte-prep.pages.dev')
  })
})

describe('SITE_ORIGIN', () => {
  it('is empty when VITE_SITE_ORIGIN is not set', () => {
    // The variable is absent from the test environment, which is exactly the
    // case the runtime fallback exists for.
    expect(import.meta.env.VITE_SITE_ORIGIN).toBeUndefined()
    expect(SITE_ORIGIN).toBe('')
  })

  it('uses a configured origin and strips trailing slashes', async () => {
    vi.stubEnv('VITE_SITE_ORIGIN', 'https://pte.example.test///')
    vi.resetModules()
    try {
      const mod = await import('../../../src/seo/site')
      expect(mod.SITE_ORIGIN).toBe('https://pte.example.test')
      expect(mod.absoluteUrl('/format/')).toBe('https://pte.example.test/format/')
    } finally {
      vi.unstubAllEnvs()
      vi.resetModules()
    }
  })
})

describe('absoluteUrl', () => {
  it('resolves against the origin the page is served from', () => {
    expect(SITE_ORIGIN).toBe('')
    expect(absoluteUrl('/format/')).toBe(`${window.location.origin}/format/`)
  })

  it('adds the missing leading slash', () => {
    expect(absoluteUrl('format')).toBe(`${window.location.origin}/format`)
  })

  it('keeps a sub-path deployment working', () => {
    vi.stubEnv('BASE_URL', '/repo/')
    try {
      expect(absoluteUrl('/format/')).toBe(`${window.location.origin}/repo/format/`)
    } finally {
      vi.unstubAllEnvs()
    }
  })

  it('uses a base path that does not end in a slash as-is', () => {
    vi.stubEnv('BASE_URL', '/repo')
    try {
      expect(absoluteUrl('/format/')).toBe(`${window.location.origin}/repo/format/`)
    } finally {
      vi.unstubAllEnvs()
    }
  })

  it('falls back to the site root when no base is configured', () => {
    vi.stubEnv('BASE_URL', undefined)
    try {
      expect(absoluteUrl('/format/')).toBe(`${window.location.origin}/format/`)
    } finally {
      vi.unstubAllEnvs()
    }
  })
})

describe('keywords', () => {
  it('lists the site-wide keyword set', () => {
    expect(BASE_KEYWORDS).toHaveLength(9)
    expect(BASE_KEYWORDS[0]).toBe('PTE mock test')
    expect(BASE_KEYWORDS).toContain('PTE Academic practice test')
    expect(BASE_KEYWORDS).toContain('PTE practice test with score')
    expect(BASE_KEYWORDS).toContain('PTE Academic 2026')
    for (const keyword of BASE_KEYWORDS) {
      expect(keyword).toBe(keyword.trim())
      expect(keyword.length).toBeGreaterThan(3)
    }
  })

  it('joins the base keywords when nothing extra is given', () => {
    expect(keywordsFor()).toBe(BASE_KEYWORDS.join(', '))
  })

  it('appends the page keywords', () => {
    expect(keywordsFor(['PTE mock test free'])).toBe(
      `${BASE_KEYWORDS.join(', ')}, PTE mock test free`,
    )
  })

  it('never repeats a keyword', () => {
    expect(keywordsFor(['PTE mock test', 'PTE score'])).toBe(BASE_KEYWORDS.join(', '))
    expect(keywordsFor(['Same thing', 'Same thing'])).toBe(
      `${BASE_KEYWORDS.join(', ')}, Same thing`,
    )
  })
})
