/**
 * Stable local identity for practice done while signed out.
 *
 * Guest attempts are kept in the same IndexedDB database as account attempts,
 * so they need an owner too. This id is deliberately separate from a cloud
 * user id: sync must never upload guest history to whichever account happens
 * to sign in next. The only way guest attempts become account data is through
 * the explicit import prompt on the login page.
 */
const GUEST_OWNER_KEY = 'pte-prep-guest-owner'

let cached: string | null = null

function createGuestOwnerId(): string {
  const suffix =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  return `guest:${suffix}`
}

export function getGuestOwnerId(): string {
  if (typeof window === 'undefined') return 'guest:server'
  if (cached) return cached

  try {
    const stored = window.localStorage.getItem(GUEST_OWNER_KEY)
    if (stored) {
      cached = stored
      return stored
    }
  } catch {
    /* storage unavailable; fall through to a process-lifetime id */
  }

  cached = createGuestOwnerId()
  try {
    window.localStorage.setItem(GUEST_OWNER_KEY, cached)
  } catch {
    /* private mode / quota: the module cache keeps this tab isolated */
  }
  return cached
}
