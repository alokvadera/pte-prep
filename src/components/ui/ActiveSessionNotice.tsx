import { ButtonLink } from './primitives'
import { useTest } from '../../store/useTest'
import { useClientReady } from '../../lib/useClientReady'
import { useLocalOwnerId } from '../../lib/useLocalOwner'

/** A way back into the running test before a new setup can overwrite it. */
export function ActiveSessionNotice() {
  const mock = useTest((s) => s.mock)
  const status = useTest((s) => s.status)
  const mode = useTest((s) => s.mode)
  const sectionIndex = useTest((s) => s.sectionIndex)
  const itemIndex = useTest((s) => s.itemIndex)
  const testOwner = useTest((s) => s.ownerId)
  // Saved sessions are client-only. Keep the initial hydration render identical
  // to the prerendered page, then show the resume path once React takes over.
  const hydrated = useClientReady()
  const localOwnerId = useLocalOwnerId()

  const isGuestAdoption = Boolean(testOwner?.startsWith('guest:') && localOwnerId && !localOwnerId.startsWith('guest:'))

  if (!hydrated || !mock || status === 'finished' || (testOwner !== localOwnerId && !isGuestAdoption)) return null

  const section = mock.sections[sectionIndex]
  const position = status === 'running' && section
    ? `Question ${itemIndex + 1} of ${section.itemIds.length} in ${section.title}.`
    : status === 'break'
      ? 'Your next section is ready.'
      : 'Your session is ready to begin.'

  return (
    <aside aria-label="Active session" className="callout mb-8 flex animate-rise-in flex-wrap items-center justify-between gap-4">
      <div className="min-w-0">
        <h2 className="font-display text-ink-900 dark:text-ink-50 text-xl font-bold">
          Continue your {mode === 'practice' ? 'practice drill' : 'mock test'}
        </h2>
        <p className="text-ink-700 dark:text-ink-on-dark mt-1 text-sm">
          {mock.title}. {position}{status === 'running' && !mock.untimed ? ' Timed sessions do not pause while you are away.' : ''}
        </p>
      </div>
      <ButtonLink to="/test" magnetic>Resume session</ButtonLink>
    </aside>
  )
}
