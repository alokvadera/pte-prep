import { prerender } from 'react-dom/static'
// `StaticRouter` comes from the same package as the router the app itself
// uses. Both packages ship a copy of the router, and mixing them means the
// app's routes cannot see the context the server entry provides.
import { StaticRouter } from 'react-router-dom'
import App from './App'
import { getPageMeta, notFoundMeta } from './seo/meta'
import { pageHeadTags, renderHeadTags } from './seo/structured'
import { SITE, absoluteUrl } from './seo/site'

export interface RenderResult {
  html: string
  head: string
  title: string
  description: string
  canonical: string
  noindex: boolean
  structuredData: string[]
}

/** `prerender` returns a web stream under Node, so it has to be drained. */
async function streamToString(stream: ReadableStream<Uint8Array> | string): Promise<string> {
  /* v8 ignore next -- the server renderer always hands back a stream */
  if (typeof stream === 'string') return stream
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let out = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    // A chunk that is not the last one always carries bytes.
    out += decoder.decode(value!, { stream: true })
  }
  return out + decoder.decode()
}

/**
 * Server entry used only by the prerender step.
 *
 * `react-dom/static` is used rather than `renderToString` because the app splits
 * its routes with `React.lazy`. `renderToString` does not wait for suspended
 * trees and would emit the loading fallback — precisely the empty shell that
 * makes a client-rendered site invisible to crawlers.
 *
 * The head is built from `seo/meta.ts` rather than read back out of the render,
 * so the static HTML and the client-rendered document come from one source.
 */
export async function render(url: string, { known = true }: { known?: boolean } = {}): Promise<RenderResult> {
  const meta = known ? getPageMeta(url) : notFoundMeta(url)
  const tags = pageHeadTags(meta)

  // No extra Suspense boundary here: `App` already has one, and a second
  // boundary would emit an extra marker comment that the client tree does not
  // have, which React reports as a hydration mismatch.
  const app = (
    <StaticRouter location={url} basename={import.meta.env.BASE_URL}>
      <App />
    </StaticRouter>
  )

  const result = (await prerender(app)) as unknown as {
    prelude: ReadableStream<Uint8Array> | string
  }

  /* v8 ignore next -- every page has a title */
  const title = tags.find((t) => t.tag === 'title')?.text ?? SITE.name
  /* v8 ignore next -- every page has a description */
  const description = tags.find((t) => t.attrs?.name === 'description')?.attrs?.content ?? ''

  return {
    html: await streamToString(result.prelude),
    head: renderHeadTags(tags),
    title,
    description,
    canonical: absoluteUrl(meta.path),
    noindex: Boolean(meta.noindex),
    structuredData: (meta.structuredData ?? []).map((b) => JSON.stringify(b)),
  }
}
