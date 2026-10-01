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

function keyOf(tag: HeadTag): string {
  if (tag.tag === 'title') return 'title'
  const attrs = tag.attrs ?? {}
  if (tag.tag === 'script') return `script:${attrs.type ?? 'ld+json'}`
  const identity = attrs.name ?? attrs.property ?? attrs.rel ?? ''
  return `${tag.tag}:${identity}`
}

function applyTag(tag: HeadTag, head: HTMLElement): void {
  if (tag.tag === 'title') {
    document.title = tag.text ?? ''
    return
  }

  const attrs = tag.attrs ?? {}
  const identity = attrs.name ?? attrs.property ?? attrs.rel ?? ''
  const selector = identity
    ? `${tag.tag}[${attrs.name ? 'name' : attrs.property ? 'property' : 'rel'}="${CSS.escape(identity)}"]`
    : tag.tag
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
    const identity =
      el.getAttribute('name') ?? el.getAttribute('property') ?? el.getAttribute('rel') ?? (isScript ? '' : '')
    const key = isScript
      ? `script:${el.getAttribute('type') ?? 'ld+json'}`
      : `${el.tagName.toLowerCase()}:${identity}`
    if (!wanted.has(key)) el.remove()
  }
  for (const el of Array.from(head.querySelectorAll(`[${JSONLD}]`))) el.remove()

  for (const tag of tags) {
    if (tag.tag === 'script') {
      const el = document.createElement('script')
      el.type = tag.attrs?.type ?? 'application/ld+json'
      el.setAttribute(JSONLD, '')
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
