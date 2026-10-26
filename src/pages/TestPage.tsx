import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TestRunner } from '../components/test/TestRunner'
import { Seo } from '../seo/Seo'
import { useTest } from '../store/useTest'
import { useLocalOwnerId } from '../lib/useLocalOwner'

export default function TestPage() {
  const navigate = useNavigate()
  const status = useTest((s) => s.status)
  const restore = useTest((s) => s.restore)
  const tick = useTest((s) => s.tick)
  const mock = useTest((s) => s.mock)
  const testOwner = useTest((s) => s.ownerId)
  const localOwnerId = useLocalOwnerId()
  const [confirmExit, setConfirmExit] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)

  // A direct URL or stale tab must not drop another account into a test it did
  // not start. A guest who signs in during the test adopts the session; otherwise
  // leave the saved run intact for its owner and send this session back to test setup.
  const isGuestAdoption = Boolean(
    testOwner?.startsWith('guest:') && localOwnerId && !localOwnerId.startsWith('guest:'),
  )
  const ownerMismatch = Boolean(
    localOwnerId && mock && testOwner !== localOwnerId && !isGuestAdoption,
  )

  useEffect(() => {
    if (isGuestAdoption && localOwnerId) {
      useTest.setState({ ownerId: localOwnerId })
    }
  }, [isGuestAdoption, localOwnerId])

  useEffect(() => {
    if (ownerMismatch) navigate('/mock', { replace: true })
  }, [ownerMismatch, navigate])

  // A reload mid-test resumes the same item with the same clock. A test that was
  // still at the briefing stage stays there, so the candidate decides when the
  // section clock starts.
  useEffect(() => {
    if (!localOwnerId || ownerMismatch) return
    // Restoring re-derives the status from the persisted clock, so it is a
    // mount-time act, not something to redo on every status change: running it
    // again after a section transition re-reads a field the transition has
    // just written.
    if (status !== 'briefing') restore()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localOwnerId, ownerMismatch])

  useEffect(() => {
    if (!localOwnerId || ownerMismatch || status !== 'running') return
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [status, tick, localOwnerId, ownerMismatch])

  useEffect(() => {
    if (!localOwnerId || ownerMismatch) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (status !== 'running') return
      e.preventDefault()
      // Safari, and Chrome before 119, ignore preventDefault on their own and
      // need the legacy returnValue to show the "Leave site?" prompt. Without
      // it a candidate on Safari loses the whole section to a stray reload.
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [status, localOwnerId, ownerMismatch])

  // The runner renders outside the app shell, so the route change
  // is announced by hand: focus moves to the test's main landmark.
  // The landmark only exists once a section is running — on mount the
  // runner is still on the briefing screen — so the effect waits for that.
  useEffect(() => {
    if (status !== 'running') return
    document.getElementById('test-main')?.focus({ preventScroll: true })
  }, [status])

  // Focus trap + Escape dismiss for the exit dialog
  useEffect(() => {
    if (!confirmExit) return
    const dialog = dialogRef.current
    if (!dialog) return

    // Move focus into the dialog
    const focusable = dialog.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    focusable[0]?.focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setConfirmExit(false)
        return
      }
      if (e.key === 'Tab' && focusable.length > 0) {
        const first = focusable[0]!
        const last = focusable[focusable.length - 1]!
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [confirmExit])

  // The owner id is null until hydration, so the first painted frame of the
  // runner is blank. A skeleton is shown instead: an empty viewport reads as
  // a broken page.
  // A session that belongs to somebody else is on its way to the mock setup,
  // so it renders nothing. A session whose owner is not resolved yet gets a
  // skeleton: an empty viewport reads as a broken page.
  if (ownerMismatch) return null
  if (!localOwnerId) {
    /* v8 ignore next -- only the server render reaches this branch */
    return (
      <div className="route-inner min-h-dvh grid place-items-center p-4">
        <div className="text-center">
          <span className="border-ink-200 border-t-ink-900 dark:border-white/15 dark:border-t-ink-50 mx-auto block size-9 animate-spin rounded-full border-2" />
          <p className="text-ink-500 dark:text-ink-on-dark-muted mt-4 text-sm">
            Loading your session…
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Seo />

      <TestRunner
        onExit={() => {
          setConfirmExit(true)
        }}
      />

      {confirmExit ? (
        <div className="fixed inset-0 z-100 grid place-items-center p-4">
          <button
            type="button"
            className="bg-ink-950/70 animate-fade-in absolute inset-0 cursor-pointer"
            onClick={() => setConfirmExit(false)}
            aria-label="Cancel"
          />
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-exit-title"
            className="card-solid animate-modal-enter relative w-full max-w-sm"
          >
            <h2 id="confirm-exit-title" className="section-title">
              Leave the test?
            </h2>
            <p className="text-ink-500 dark:text-ink-on-dark mt-2 text-sm leading-relaxed">
              Your answers are saved. If this is a timed section, its clock will keep running while
              you are away. Resume from the mock setup or practice page to keep going.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setConfirmExit(false)}>
                Keep going
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={() => {
                  setConfirmExit(false)
                  navigate('/mock')
                }}
              >
                Leave test
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
