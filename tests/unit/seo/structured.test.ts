import { describe, expect, it } from 'vitest'
import {
  breadcrumbLd,
  faqLd,
  howToLd,
  itemListLd,
  organizationLd,
  pageHeadTags,
  renderHeadTags,
  webApplicationLd,
} from '../../../src/seo/structured'
import { absoluteUrl, SITE } from '../../../src/seo/site'
import type { HeadTag } from '../../../src/seo/structured'
import type { PageMeta } from '../../../src/seo/site'

/* ---------------------------------------------------------------------------
   JSON-LD builders and the head-tag serialiser.

   The builders are plain data, so the assertions are about shape: a valid
   `@context`/`@type` pair, absolute URLs, and one-based positions. The
   serialiser is the part that can break a page, so it gets the hostile
   inputs — quotes, angle brackets and ampersands.
   --------------------------------------------------------------------------- */

describe('organizationLd', () => {
  it('describes the site as an organisation', () => {
    const ld = organizationLd()
    expect(ld['@context']).toBe('https://schema.org')
    expect(ld['@type']).toBe('Organization')
    expect(ld.name).toBe(SITE.name)
    expect(ld.url).toBe(absoluteUrl('/'))
    expect(ld.logo).toBe(absoluteUrl('/icon-512.png'))
  })
})

describe('webApplicationLd', () => {
  it('describes the mock test as a free web application', () => {
    const ld = webApplicationLd({
      name: 'PTE Prep — Free PTE Academic Mock Test',
      description: 'A full-length PTE Academic practice test.',
      path: '/mock/',
    })
    expect(ld['@context']).toBe('https://schema.org')
    expect(ld['@type']).toBe('WebApplication')
    expect(ld.name).toBe('PTE Prep — Free PTE Academic Mock Test')
    expect(ld.description).toBe('A full-length PTE Academic practice test.')
    expect(ld.url).toBe(absoluteUrl('/mock/'))
    expect(ld.applicationCategory).toBe('EducationalApplication')
    expect(ld.operatingSystem).toBe('Any modern web browser')
    expect(ld.browserRequirements).toBe('Requires JavaScript. Microphone optional.')
    expect(ld.offers).toEqual({ '@type': 'Offer', price: '0', priceCurrency: 'USD' })
    expect(ld.featureList).toHaveLength(5)
    expect(ld.featureList).toContain('All 22 official PTE question types')
  })
})

describe('faqLd', () => {
  it('turns question-and-answer pairs into a FAQ page', () => {
    const ld = faqLd([
      { question: 'Is it free?', answer: 'Yes, entirely.' },
      { question: 'Do I need an account?', answer: 'No.' },
    ])
    expect(ld['@context']).toBe('https://schema.org')
    expect(ld['@type']).toBe('FAQPage')
    expect(ld.mainEntity).toHaveLength(2)
    expect(ld.mainEntity[0]).toEqual({
      '@type': 'Question',
      name: 'Is it free?',
      acceptedAnswer: { '@type': 'Answer', text: 'Yes, entirely.' },
    })
    expect(ld.mainEntity[1]!.acceptedAnswer.text).toBe('No.')
  })

  it('accepts an empty question set', () => {
    expect(faqLd([]).mainEntity).toEqual([])
  })
})

describe('breadcrumbLd', () => {
  it('numbers the trail from one and resolves every crumb to an absolute URL', () => {
    const ld = breadcrumbLd([
      { name: 'Home', path: '/' },
      { name: 'PTE question types', path: '/question-types/' },
      { name: 'Read Aloud', path: '/question-types/read-aloud/' },
    ])
    expect(ld['@context']).toBe('https://schema.org')
    expect(ld['@type']).toBe('BreadcrumbList')
    expect(ld.itemListElement).toHaveLength(3)
    expect(ld.itemListElement[0]).toEqual({
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: absoluteUrl('/'),
    })
    expect(ld.itemListElement[2]!.position).toBe(3)
    expect(ld.itemListElement[2]!.item).toBe(absoluteUrl('/question-types/read-aloud/'))
  })
})

describe('howToLd', () => {
  it('numbers the steps from one', () => {
    const ld = howToLd({
      name: 'How to take a full PTE Academic mock test',
      description: 'Five steps to a scored report.',
      steps: [
        { name: 'Start a full mock', text: 'Open the mock test page.' },
        { name: 'Set up audio', text: 'Allow playback.' },
      ],
    })
    expect(ld['@context']).toBe('https://schema.org')
    expect(ld['@type']).toBe('HowTo')
    expect(ld.name).toBe('How to take a full PTE Academic mock test')
    expect(ld.description).toBe('Five steps to a scored report.')
    expect(ld.step).toHaveLength(2)
    expect(ld.step[0]).toEqual({
      '@type': 'HowToStep',
      position: 1,
      name: 'Start a full mock',
      text: 'Open the mock test page.',
    })
    expect(ld.step[1]!.position).toBe(2)
  })
})

describe('itemListLd', () => {
  it('numbers the entries from one', () => {
    const ld = itemListLd([
      { name: 'Read Aloud', path: '/question-types/read-aloud/' },
      { name: 'Repeat Sentence', path: '/question-types/repeat-sentence/' },
    ])
    expect(ld['@context']).toBe('https://schema.org')
    expect(ld['@type']).toBe('ItemList')
    expect(ld.itemListElement[0]).toEqual({
      '@type': 'ListItem',
      position: 1,
      name: 'Read Aloud',
      url: absoluteUrl('/question-types/read-aloud/'),
    })
    expect(ld.itemListElement[1]!.position).toBe(2)
  })
})

describe('pageHeadTags', () => {
  const base: PageMeta = {
    title: 'PTE Prep — Practice',
    description: 'A description of the page.',
    path: '/practice/',
  }

  it('emits a title, a description, keywords and a canonical link', () => {
    const tags = pageHeadTags(base)
    expect(tags[0]).toEqual({ tag: 'title', text: 'PTE Prep — Practice' })
    expect(tags[1]).toEqual({
      tag: 'meta',
      attrs: { name: 'description', content: 'A description of the page.' },
    })
    expect(tags[2]!.attrs?.name).toBe('keywords')
    expect(tags[2]!.attrs?.content).toContain('PTE mock test')
    expect(tags[3]).toEqual({
      tag: 'link',
      attrs: { rel: 'canonical', href: absoluteUrl('/practice/') },
    })
  })

  it('appends the brand to a short title', () => {
    const tags = pageHeadTags({ ...base, title: 'Practice' })
    expect(tags[0]!.text).toBe('Practice | PTE Prep')
  })

  it('leaves a title that already names the brand alone', () => {
    const tags = pageHeadTags({ ...base, title: 'PTE Prep — Practice' })
    expect(tags[0]!.text).toBe('PTE Prep — Practice')
  })

  it('leaves a long title alone so the suffix cannot be truncated', () => {
    const long = 'A title that is already long enough to fill the result page'
    expect(long.length).toBeGreaterThan(48)
    const tags = pageHeadTags({ ...base, title: long })
    expect(tags[0]!.text).toBe(long)
  })

  it('indexes a public page and excludes a private one', () => {
    const indexed = pageHeadTags(base).find(
      (t) => t.tag === 'meta' && t.attrs?.name === 'robots',
    )
    expect(indexed?.attrs?.content).toBe(
      'index, follow, max-image-preview:large, max-snippet:-1',
    )

    const hidden = pageHeadTags({ ...base, noindex: true }).find(
      (t) => t.tag === 'meta' && t.attrs?.name === 'robots',
    )
    expect(hidden?.attrs?.content).toBe('noindex, nofollow')
  })

  it('defaults the Open Graph type to website and honours an override', () => {
    const ogType = (meta: PageMeta) =>
      pageHeadTags(meta).find((t) => t.tag === 'meta' && t.attrs?.property === 'og:type')
        ?.attrs?.content
    expect(ogType(base)).toBe('website')
    expect(ogType({ ...base, type: 'article' })).toBe('article')
  })

  it('uses the default social image and honours an absolute one', () => {
    const ogImage = (meta: PageMeta) =>
      pageHeadTags(meta).find((t) => t.tag === 'meta' && t.attrs?.property === 'og:image')
        ?.attrs?.content
    expect(ogImage(base)).toBe(absoluteUrl('/og-default.png'))
    expect(ogImage({ ...base, image: 'https://cdn.example.test/og.png' })).toBe(
      'https://cdn.example.test/og.png',
    )
    expect(ogImage({ ...base, image: '/og-custom.png' })).toBe(absoluteUrl('/og-custom.png'))
  })

  it('repeats the title and description for Twitter cards', () => {
    const tags = pageHeadTags(base)
    const twitter = (name: string) =>
      tags.find((t) => t.tag === 'meta' && t.attrs?.name === name)?.attrs?.content
    expect(twitter('twitter:card')).toBe('summary_large_image')
    expect(twitter('twitter:title')).toBe('PTE Prep — Practice')
    expect(twitter('twitter:description')).toBe('A description of the page.')
    expect(twitter('twitter:image')).toBe(absoluteUrl('/og-default.png'))
  })

  it('renders one JSON-LD script per structured-data block', () => {
    const tags = pageHeadTags({ ...base, structuredData: [organizationLd(), faqLd([])] })
    const scripts = tags.filter((t) => t.tag === 'script')
    expect(scripts).toHaveLength(2)
    expect(scripts[0]!.attrs?.type).toBe('application/ld+json')
    expect(JSON.parse(scripts[0]!.text!)).toMatchObject({ '@type': 'Organization' })
    expect(JSON.parse(scripts[1]!.text!)).toMatchObject({ '@type': 'FAQPage' })
  })

  it('emits no script tag when the page has no structured data', () => {
    expect(pageHeadTags(base).filter((t) => t.tag === 'script')).toHaveLength(0)
  })
})

describe('renderHeadTags', () => {
  it('renders a title element', () => {
    expect(renderHeadTags([{ tag: 'title', text: 'Hello' }])).toBe('<title>Hello</title>')
  })

  it('renders a title element with no text', () => {
    expect(renderHeadTags([{ tag: 'title' }])).toBe('<title></title>')
  })

  it('renders attributes on meta and link elements', () => {
    expect(renderHeadTags([{ tag: 'meta', attrs: { name: 'description', content: 'Hi' } }])).toBe(
      '<meta name="description" content="Hi" />',
    )
    expect(renderHeadTags([{ tag: 'link', attrs: { rel: 'canonical', href: '/x/' } }])).toBe(
      '<link rel="canonical" href="/x/" />',
    )
  })

  it('renders an element with no attributes at all', () => {
    expect(renderHeadTags([{ tag: 'meta' }])).toBe('<meta  />')
  })

  it('renders a JSON-LD script element', () => {
    expect(
      renderHeadTags([
        { tag: 'script', attrs: { type: 'application/ld+json' }, text: '{"a":1}' },
      ]),
    ).toBe('<script type="application/ld+json">{"a":1}</script>')
  })

  it('defaults the script type and tolerates a missing body', () => {
    expect(renderHeadTags([{ tag: 'script' }])).toBe(
      '<script type="application/ld+json"></script>',
    )
  })

  it('escapes the characters that would break out of an attribute', () => {
    expect(
      renderHeadTags([
        { tag: 'meta', attrs: { name: 'description', content: 'a & b < c > d " e' } },
      ]),
    ).toBe('<meta name="description" content="a &amp; b &lt; c &gt; d &quot; e" />')
  })

  it('escapes the title text', () => {
    expect(renderHeadTags([{ tag: 'title', text: 'Tom & Jerry <b>"bold"</b>' }])).toBe(
      '<title>Tom &amp; Jerry &lt;b&gt;&quot;bold&quot;&lt;/b&gt;</title>',
    )
  })

  it('joins the tags with an indented newline', () => {
    expect(
      renderHeadTags([
        { tag: 'title', text: 'Hello' },
        { tag: 'meta', attrs: { name: 'description', content: 'Hi' } },
      ]),
    ).toBe('<title>Hello</title>\n    <meta name="description" content="Hi" />')
  })

  it('renders an empty list as an empty string', () => {
    expect(renderHeadTags([])).toBe('')
  })
})

describe('renderHeadTags over a real page', () => {
  it('never leaves a raw angle bracket inside the JSON-LD', () => {
    const tags: HeadTag[] = pageHeadTags({
      title: 'Escape',
      description: 'Escape',
      path: '/x/',
      structuredData: [{ '@type': 'Thing', name: '<script>alert(1)</script>' }],
    })
    const script = tags.find((t) => t.tag === 'script')
    expect(script?.text).not.toContain('<script>')
    expect(script?.text).toContain('\\u003cscript>')
  })
})
