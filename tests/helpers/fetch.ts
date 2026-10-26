import { vi } from 'vitest'

/* ---------------------------------------------------------------------------
   A fetch stub for the endpoints the app talks to.

   The app makes relative requests (`/api/attempts/...`) and absolute ones
   (`https://api.groq.com/...`). Both are matched here by a route table, and
   every call is recorded so a test can assert on what was actually sent.
   --------------------------------------------------------------------------- */

export interface RecordedCall {
  url: string
  method: string
  init?: RequestInit
}

export interface FetchRoute {
  /** HTTP method. Defaults to GET. */
  method?: string
  /** Exact path, or a prefix, or a pattern. */
  url: string | RegExp
  /** Status code. Defaults to 200. */
  status?: number
  /** JSON body. */
  body?: unknown
  /** Extra response headers. */
  headers?: Record<string, string>
  /** Make the route throw a network error instead of answering. */
  networkError?: boolean
  /** Only answer the first time; later calls fall through. */
  once?: boolean
}

export interface FetchMock {
  calls: RecordedCall[]
  /** Every URL requested, in order. */
  urls: string[]
  fetch: ReturnType<typeof vi.fn>
}

function matches(url: string, pattern: string | RegExp): boolean {
  if (pattern instanceof RegExp) return pattern.test(url)
  if (url === pattern) return true
  // A path pattern also matches a query string appended to it.
  return url.startsWith(pattern)
}

export function jsonResponse(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  })
}

/**
 * Installs a `fetch` that answers from the given route table. A request that
 * matches no route gets a 404, which is more useful in a failure message than
 * a silent hang.
 */
export function installFetchMock(routes: FetchRoute[] = []): FetchMock {
  const calls: RecordedCall[] = []
  const used = new Set<FetchRoute>()

  const fetchMock = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.toString()
            : (input as Request).url
      const method = (
        init?.method ??
        (typeof input === 'object' && 'method' in input ? (input as Request).method : 'GET')
      ).toUpperCase()

      calls.push({ url, method, init })

      for (const route of routes) {
        if (route.once && used.has(route)) continue
        if (route.method && route.method.toUpperCase() !== method) continue
        if (!matches(url, route.url)) continue
        if (route.once) used.add(route)

        if (route.networkError) {
          throw new TypeError('Failed to fetch')
        }
        if (route.body !== undefined) {
          return jsonResponse(route.body, route.status ?? 200, route.headers)
        }
        return new Response(null, { status: route.status ?? 200, headers: route.headers })
      }

      return jsonResponse({ error: `No fetch route for ${method} ${url}` }, 404)
    },
  )

  vi.stubGlobal('fetch', fetchMock)

  return {
    calls,
    urls: calls.map((c) => c.url),
    fetch: fetchMock,
  }
}

/** A fetch that always fails at the network level. */
export function installOfflineFetch(): FetchMock {
  return installFetchMock([{ url: /.*/, networkError: true }])
}
