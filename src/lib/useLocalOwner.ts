import { useAuth } from '../store/useAuth'
import { useClientReady } from './useClientReady'
import { getGuestOwnerId } from './guestOwner'

/**
 * The owner of local practice data for the current session.
 *
 * `null` until hydration so server and first-client renders agree. Signed-in
 * users are scoped by account id; signed-out users get a stable guest id.
 */
export function useLocalOwnerId(): string | null {
  const ready = useClientReady()
  const user = useAuth((s) => s.user)
  const token = useAuth((s) => s.token)
  // A persisted session can outlive its own token: the user object is restored
  // from local storage on boot, but the token behind it may already have
  // expired or been revoked. The session check drops it — the Dashboard waits
  // for that check before it lists anything, and the report no longer depends
  // on the viewer matching the test's owner — so the account is still the
  // owner here, and the window is closed downstream rather than by making
  // every signed-in visitor briefly guest-scoped.
  return ready ? (user && token ? user.id : getGuestOwnerId()) : null
}
