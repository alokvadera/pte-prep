import { useLocation } from 'react-router-dom'

/**
 * Shows where the router ended up.
 *
 * A page that navigates cannot be tested by looking at the page: it has
 * usually unmounted by then. The probe makes the destination observable, so
 * "sends the candidate back where they came from" can be checked rather than
 * assumed.
 *
 * It lives in its own file so that the fast-refresh rule sees a file that
 * exports nothing but a component.
 */
export function LocationProbe() {
  const location = useLocation()
  return (
    <span data-testid="location">
      {location.pathname}
      {location.search}
    </span>
  )
}
