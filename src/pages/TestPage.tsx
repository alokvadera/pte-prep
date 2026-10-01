import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TestRunner } from '../components/test/TestRunner'
import { Seo } from '../seo/Seo'
import { useTest } from '../store/useTest'
import { useSettings } from '../store/useSettings'

export default function TestPage() {
  const navigate = useNavigate()
  const status = useTest((s) => s.status)
  const restore = useTest((s) => s.restore)
  const tick = useTest((s) => s.tick)
  const { settings, set } = useSettings()
  const [confirmExit, setConfirmExit] = useState(false)

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

  return (
    <>
      <Seo />

      <div className="fixed top-3 left-3 z-50 flex gap-1">
        <button
          type="button"
          className="btn-ghost bg-white/80 px-2 text-xs backdrop-blur-sm dark:bg-ink-850/80"
          onClick={() => setConfirmExit(true)}
        >
          Exit
        </button>
        {settings.speakPrompts ? (
          <button
            type="button"
            className="btn-ghost bg-white/80 px-2 text-xs backdrop-blur-sm dark:bg-ink-850/80"
            onClick={() => set('speakPrompts', false)}
          >
            Mute prompts
          </button>
        ) : null}
      </div>

      <TestRunner
        onExit={() => {
          setConfirmExit(false)
          navigate('/mock')
        }}
      />

      {confirmExit ? (
        <div className="fixed inset-0 z-100 grid place-items-center p-4">
          <button type="button" className="bg-ink-950/70 absolute inset-0" onClick={() => setConfirmExit(false)} aria-label="Cancel" />
          <div role="dialog" aria-modal="true" className="card-solid relative w-full max-w-sm">
            <h2 className="text-ink-900 dark:text-white text-lg font-bold text-balance">Leave the test?</h2>
            <p className="text-ink-500 dark:text-ink-300 mt-2 text-sm leading-relaxed">
              Your answers are saved, but the section clock will stop and the attempt will not be scored. You can resume
              from the mock test page.
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
