/** Prefix an API route with Vite's configured public base path. */
export function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL
  return `${base}${path.replace(/^\/+/, '')}`
}
