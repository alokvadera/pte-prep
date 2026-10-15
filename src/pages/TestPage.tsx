import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TestRunner } from '../components/test/TestRunner'
import { Seo } from '../seo/Seo'
import { useTest } from '../store/useTest'

export default function TestPage() {
  const navigate = useNavigate()
  const status = useTest((s) => s.status)
  const restore = useTest((s) => s.restore)
  const tick = useTest((s) => s.tick)
  const [confirmExit, setConfirmExit] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)

  // A reload mid-test resumes the same item with the same clock. A test that was
  // still at the briefing stage stays there, so the candidate decides when the
  // section clock starts.
  useEffect(() => {
    if (status !== 'briefing') restore()
  }, [status, restore])

  useEffect(() => {
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [tick])

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (status === 'running') e.preventDefault()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [status])

  // The runner renders outside the app shell, so the route change
  // is announced by hand: focus moves to the test's main landmark
  // when the page mounts.
  useEffect(() => {
    document.getElementById('test-main')?.focus({ preventScroll: true })
  }, [])

  // Focus trap + Escape dismiss for the exit dialog
  useEffect(() => {
    if (!confirmExit) return
    const dialog = dialogRef.current
    if (!dialog) return

    // Move focus into the dialog
    const focusable = dialog.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
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
          <button type="button" className="bg-ink-950/70 animate-fade-in absolute inset-0 cursor-pointer" onClick={() => setConfirmExit(false)} aria-label="Cancel" />
          <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="confirm-exit-title" className="card-solid animate-modal-enter relative w-full max-w-sm">
            <h2 id="confirm-exit-title" className="section-title">Leave the test?</h2>
            <p className="text-ink-500 dark:text-ink-on-dark mt-2 text-sm leading-relaxed">
              Your answers are saved. If this is a timed section, its clock will keep running while you are away.
              Resume from the mock setup or practice page to keep going.
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
