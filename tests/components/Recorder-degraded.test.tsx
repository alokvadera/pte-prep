import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Recorder } from '../../src/components/recorder/Recorder'
import { useSettings } from '../../src/store/useSettings'
import type { AudioAnalysis } from '../../src/domain/types'

/* ---------------------------------------------------------------------------
   A recorder that answers with nothing.

   The real recorder always hands back an analysis and a transcript, and it
   always says why it failed. These tests stand in a recorder that does
   neither, so the page's own fallbacks can be seen: the empty analysis, the
   empty transcript, and the message for a microphone that failed without
   giving a reason.
   --------------------------------------------------------------------------- */

const stubs = vi.hoisted(() => ({
  /** What `start()` answers with. */
  starts: { value: true },
  /** What `stop()` answers with. */
  stops: { value: {} as Record<string, unknown> },
}))

vi.mock('../../src/lib/recorder', () => {
  class QuietRecorder {
    getState(): string {
      return 'idle'
    }
    async start(): Promise<boolean> {
      return stubs.starts.value
    }
    async stop(): Promise<Record<string, unknown>> {
      return stubs.stops.value
    }
    dispose(): void {}
  }

  return {
    VoiceRecorder: QuietRecorder,
    isRecordingSupported: () => true,
    isSpeechRecognitionSupported: () => false,
  }
})

beforeEach(() => {
  stubs.starts.value = true
  stubs.stops.value = {}
  useSettings.setState({
    settings: { ...useSettings.getState().settings, groqApiKey: '' },
  })
})

afterEach(() => {
  cleanup()
})

describe('Recorder without a measurement', () => {
  it('scores a take the browser gave nothing for', async () => {
    const onRecorded = vi.fn()
    render(<Recorder itemId="item-1" seconds={40} onRecorded={onRecorded} />)

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Start recording/ }))
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Stop recording' }))
    })

    expect(onRecorded).toHaveBeenCalledTimes(1)
    const [analysis, transcript] = onRecorded.mock.calls[0] as [AudioAnalysis, string]
    expect(analysis.durationMs).toBe(0)
    expect(analysis.wordsPerMinute).toBe(0)
    expect(analysis.reliable).toBe(false)
    expect(transcript).toBe('')
  })

  it('does not warn about a take the browser measured at all', async () => {
    render(<Recorder itemId="item-1" seconds={40} onRecorded={vi.fn()} />)

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Start recording/ }))
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Stop recording' }))
    })

    // There is no length to judge, so there is nothing to warn about.
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('says the microphone was unavailable when the recorder gives no reason', async () => {
    stubs.starts.value = false
    const onRecorded = vi.fn()
    render(<Recorder itemId="item-1" seconds={40} onRecorded={onRecorded} />)

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Start recording/ }))
    })

    expect(screen.getByText('Answer not recorded')).toBeInTheDocument()
    expect(screen.getByText(/Microphone unavailable\./)).toBeInTheDocument()
    expect(onRecorded).not.toHaveBeenCalled()
  })

  it('still offers the answer box when the microphone was unavailable', async () => {
    stubs.starts.value = false
    const onTyped = vi.fn()
    render(<Recorder itemId="item-1" seconds={40} onRecorded={vi.fn()} onTyped={onTyped} />)

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Start recording/ }))
    })

    const box = screen.getByRole('textbox') as HTMLTextAreaElement
    await act(async () => {
      fireEvent.change(box, { target: { value: 'Four words go here' } })
    })
    expect(onTyped).toHaveBeenCalledWith('Four words go here')
  })
})
