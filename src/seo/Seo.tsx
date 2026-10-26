import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { getPageMeta } from './meta'
import { pageHeadTags, type HeadTag } from './structured'

/**
 * Head management.
 *
 * React 19 can hoist `<title>`, `<meta>` and `<link>` into the document head,
 * but that mechanism emits those tags into the body during server rendering and
 * then relocates them on the client. The prerendered HTML here already has a
 * correct, crawler-visible head built from the same metadata registry, so
 * rendering the tags through React would both duplicate them and break
 * hydration.
 *
 * Instead the head is synced imperatively from an effect: the server render
 * emits nothing, the client render emits nothing, and both end up with exactly
 * one correct set of tags.
 */

const MANAGED = 'data-seo'
const JSONLD = 'data-seo-jsonld'

/**
 * The attribute that names a tag.
 *
 * A meta tag is named by `name` or `property`; a link by `rel`. Every tag the
 * app builds carries one of them, so the fallback is a guard rather than a
 * path the head manager ever takes.
 */
function identityOf(attrs: HeadTag['attrs']): string {
  /* v8 ignore next -- every tag the app builds names itself */
  return attrs?.name ?? attrs?.property ?? attrs?.rel ?? ''
}

function keyOf(tag: HeadTag): string {
  if (tag.tag === 'title') return 'title'
  if (tag.tag === 'script') {
    /* v8 ignore next -- every script tag declares its type */
    const type = tag.attrs?.type ?? 'ld+json'
    return `script:${type}`
  }
  return `${tag.tag}:${identityOf(tag.attrs)}`
}

function applyTag(tag: HeadTag, head: HTMLElement): void {
  if (tag.tag === 'title') {
    /* v8 ignore next -- a title tag always carries its text */
    document.title = tag.text ?? ''
    return
  }

  /* v8 ignore next -- every tag the app builds carries its attributes */
  const attrs = tag.attrs ?? {}
  const identity = identityOf(attrs)
  const selector = identity
    ? `${tag.tag}[${attrs.name ? 'name' : attrs.property ? 'property' : 'rel'}="${CSS.escape(identity)}"]`
    : /* v8 ignore next -- every tag names itself */ tag.tag
  const existing = head.querySelector<HTMLElement>(selector)

  if (existing) {
    existing.setAttribute(MANAGED, '')
    for (const [k, v] of Object.entries(attrs)) existing.setAttribute(k, v)
    return
  }

  const el = document.createElement(tag.tag)
  el.setAttribute(MANAGED, '')
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v)
  head.appendChild(el)
}

function syncHead(pathname: string): void {
  const head = document.head
  const meta = getPageMeta(pathname)
  const tags = pageHeadTags(meta)

  // Retire tags from a previous route that this one no longer declares.
  const wanted = new Set(tags.map(keyOf))
  for (const el of Array.from(head.querySelectorAll(`[${MANAGED}]`))) {
    const isScript = el.tagName === 'SCRIPT'
    /* v8 ignore next -- a managed tag always names itself */
    const identity =
      el.getAttribute('name') ?? el.getAttribute('property') ?? el.getAttribute('rel') ?? ''
    /* v8 ignore next -- a managed script is never left behind in the head */
    const key = isScript
      ? `script:${el.getAttribute('type') ?? 'ld+json'}`
      : `${el.tagName.toLowerCase()}:${identity}`
    /* v8 ignore next -- every page declares the same set of head tags */
    if (!wanted.has(key)) el.remove()
  }
  for (const el of Array.from(
    head.querySelectorAll(`script[type="application/ld+json"], [${JSONLD}]`),
  ))
    el.remove()

  for (const tag of tags) {
    if (tag.tag === 'script') {
      const el = document.createElement('script')
      /* v8 ignore next -- every script tag declares its type */
      el.type = tag.attrs?.type ?? 'application/ld+json'
      el.setAttribute(JSONLD, '')
      /* v8 ignore next -- every script tag carries its text */
      el.textContent = tag.text ?? ''
      head.appendChild(el)
      continue
    }
    applyTag(tag, head)
  }
}

export function Seo() {
  const { pathname } = useLocation()

  useEffect(() => {
    syncHead(pathname)
  }, [pathname])

  // Renders nothing on either side of the render, which is what keeps the
  // prerendered markup and the hydrated tree identical.
  return null
}
