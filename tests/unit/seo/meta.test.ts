import { describe, expect, it } from 'vitest'
import { ALL_QUESTION_TYPES, QUESTION_META } from '../../../src/domain/blueprint'
import { getPageMeta, notFoundMeta, PAGE_META } from '../../../src/seo/meta'
import { QUESTION_TYPE_META } from '../../../src/seo/questionTypeMeta'
import { typeSlug } from '../../../src/content/questionTypeDetail'

/* ---------------------------------------------------------------------------
   The page-metadata registry.

   Everything the crawler sees for a route lives here, so the registry has to
   be complete (no route without a title, a description or a canonical path),
   and `getPageMeta` has to resolve the path a visitor can actually type —
   with or without the trailing slash — to the same entry.
   --------------------------------------------------------------------------- */

const ROUTES: Record<string, { title: string; description: string; path: string }> = {
  ...PAGE_META,
  ...QUESTION_TYPE_META,
}

describe('PAGE_META', () => {
  it('covers every marketing route', () => {
    expect(Object.keys(PAGE_META)).toEqual(
      expect.arrayContaining([
        '/',
        '/mock',
        '/practice',
        '/format',
        '/scoring',
        '/guide',
        '/about',
        '/privacy/',
        '/dashboard',
        '/login',
        '/register',
        '/test',
        '/reset-password',
        '/ui-elements',
      ]),
    )
  })

  it('gives every route a title, a description and its own path', () => {
    for (const [path, meta] of Object.entries(ROUTES)) {
      expect(meta.title.length, path).toBeGreaterThan(0)
      expect(meta.description.length, path).toBeGreaterThan(0)
      expect(meta.path.startsWith('/'), path).toBe(true)
      // The registry key and the canonical path differ only in their trailing
      // slash — '/about' is registered, '/about/' is the canonical URL.
      expect(meta.path.replace(/\/+$/, '') || '/', path).toBe(
        path.replace(/\/+$/, '') || '/',
      )
    }
  })

  it('keeps titles and descriptions inside a sensible SERP budget', () => {
    for (const [path, meta] of Object.entries(ROUTES)) {
      expect(meta.title.length, path).toBeLessThanOrEqual(80)
      expect(meta.description.length, path).toBeLessThanOrEqual(300)
    }
  })

  it('gives the home page a description that sells the mock', () => {
    const home = PAGE_META['/']!
    expect(home.title).toBe('Free PTE Academic Mock Test — Full-Length Practice')
    expect(home.description).toContain('free full-length PTE Academic mock')
    expect(home.description).toContain('22 question types')
    expect(home.description).toContain('CEFR band')
    expect(home.keywords).toContain('PTE mock test free')
  })

  it('hides the private and utility routes from the index', () => {
    for (const path of ['/dashboard', '/login', '/register', '/test', '/reset-password', '/ui-elements']) {
      expect(PAGE_META[path]?.noindex, path).toBe(true)
    }
    expect(PAGE_META['/']?.noindex).toBeUndefined()
    expect(PAGE_META['/about']?.noindex).toBeUndefined()
  })

  it('attaches structured data to the pages that need it', () => {
    for (const path of ['/', '/mock', '/practice', '/format', '/scoring', '/guide', '/about']) {
      const blocks = PAGE_META[path]?.structuredData
      expect(blocks, path).toBeDefined()
      expect(blocks!.length, path).toBeGreaterThan(0)
      for (const block of blocks!) {
        expect((block as { '@context': string })['@context'], path).toBe('https://schema.org')
        expect((block as { '@type': string })['@type'], path).toBeTruthy()
      }
    }
  })

  it('gives the practice page a list of every question type', () => {
    const list = PAGE_META['/practice']?.structuredData?.[0] as {
      '@type': string
      itemListElement: Array<{ name: string; url: string }>
    }
    expect(list['@type']).toBe('ItemList')
    expect(list.itemListElement).toHaveLength(ALL_QUESTION_TYPES.length)
    expect(list.itemListElement[0]!.name).toBe(QUESTION_META[ALL_QUESTION_TYPES[0]!].label)
  })
})

describe('getPageMeta', () => {
  it('returns the exact entry for a known route', () => {
    expect(getPageMeta('/')).toBe(PAGE_META['/'])
    expect(getPageMeta('/about/')).toBe(PAGE_META['/about'])
    expect(getPageMeta('/format/')).toBe(PAGE_META['/format'])
  })

  it('resolves a route that is missing its trailing slash', () => {
    expect(getPageMeta('/about')).toBe(PAGE_META['/about'])
    expect(getPageMeta('/mock')).toBe(PAGE_META['/mock'])
    expect(getPageMeta('/privacy')).toBe(PAGE_META['/privacy/'])
  })

  it('resolves the results route, which every finished test reaches', () => {
    // Without an entry of its own, the results page fell through to the
    // not-found metadata, so the tab title read "Page Not Found" after every
    // completed mock.
    const meta = getPageMeta('/result')
    expect(meta).toBe(PAGE_META['/result'])
    expect(meta.title).not.toBe('Page Not Found')
    expect(meta.noindex).toBe(true)
  })

  it('resolves the root with or without a trailing slash', () => {
    expect(getPageMeta('/')).toBe(PAGE_META['/'])
    expect(getPageMeta('//')).toBe(PAGE_META['/'])
  })

  it('resolves the question-type hub', () => {
    expect(getPageMeta('/question-types/')).toBe(QUESTION_TYPE_META['/question-types/'])
    expect(getPageMeta('/question-types')).toBe(QUESTION_TYPE_META['/question-types/'])
  })

  it('resolves a question-type spoke with a trailing slash', () => {
    const spoke = '/question-types/read-aloud/'
    expect(getPageMeta(spoke)).toBe(QUESTION_TYPE_META[spoke])
  })

  it('resolves a question-type spoke without a trailing slash', () => {
    const spoke = '/question-types/read-aloud/'
    expect(getPageMeta('/question-types/read-aloud')).toBe(QUESTION_TYPE_META[spoke])
  })

  it('resolves every registered route back to itself', () => {
    for (const [path, meta] of Object.entries(ROUTES)) {
      expect(getPageMeta(path), path).toBe(meta)
    }
  })

  it('resolves every question type to its spoke page', () => {
    for (const type of ALL_QUESTION_TYPES) {
      const path = `/question-types/${typeSlug(type)}/`
      expect(getPageMeta(path), type).toBe(QUESTION_TYPE_META[path])
    }
  })

  it('falls back to a not-found page for an unknown route', () => {
    const meta = getPageMeta('/does-not-exist')
    expect(meta.title).toBe('Page Not Found')
    expect(meta.noindex).toBe(true)
    expect(meta.path).toBe('/does-not-exist')
  })

  it('falls back for an unknown nested route', () => {
    expect(getPageMeta('/question-types/not-a-type/').title).toBe('Page Not Found')
  })
})

describe('notFoundMeta', () => {
  it('points the visitor back at the mock test', () => {
    const meta = notFoundMeta('/missing')
    expect(meta.title).toBe('Page Not Found')
    expect(meta.description).toBe(
      'That page does not exist. Start a free PTE Academic mock test instead.',
    )
    expect(meta.path).toBe('/missing')
    expect(meta.noindex).toBe(true)
    expect(meta.structuredData).toBeUndefined()
  })
})
