import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { AudioPlayer } from '../../src/components/audio/AudioPlayer'
import type { AudioScript } from '../../src/content/schema'

/* ---------------------------------------------------------------------------
   The audio player.

   The player owns four things: the countdown before a clip starts, the number
   of plays left, the speech-synthesis fallback for when the clip cannot be
   played, and the hand-back to whatever asked for the audio.
   --------------------------------------------------------------------------- */

/**
 * Two recordings the content bank does not have.
 *
 * The bank's own scripts all have matching speakers and more than one of
 * them, so the player's defensive paths — a turn whose speaker is missing,
 * a recording with a single speaker — need scripts of their own.
 */
const synthetic = vi.hoisted(() => ({
  scripts: [
    {
      id: 'synthetic-single-speaker',
      title: 'A single speaker recording',
      kind: 'single-speaker',
      topic: 'Tests',
      speakers: [{ id: 'a', name: 'Narrator', role: 'Narrator', voiceHint: 'mid' }],
      turns: [{ speaker: 'a', text: 'One two three four five.' }],
    },
    {
      id: 'synthetic-orphan-speaker',
      title: 'A recording whose speaker is missing',
      kind: 'conversation',
      topic: 'Tests',
      speakers: [{ id: 'a', name: 'Narrator', role: 'Narrator', voiceHint: 'mid' }],
      turns: [{ speaker: 'zzz', text: 'One two three four five.' }],
    },
  ],
}))

vi.mock('../../src/content/bank', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/content/bank')>()
  const index = new Map(actual.AUDIO_INDEX)
  for (const script of synthetic.scripts) index.set(script.id, script as unknown as AudioScript)
  return { ...actual, AUDIO_INDEX: index }
})

/** A real conversation from the content bank: two speakers, eight turns. */
const AUDIO_ID = 'conv-streaming'

const FIRST_TURN =
  'I am writing about the economics of streaming, and one number keeps coming up: the marginal cost of serving an additional subscriber is close to zero. Is that really the whole story?'

/** A clip id the bank does not know, so the script lookup comes back empty. */
const UNKNOWN_AUDIO_ID = 'no-such-script'

/** Plays the clip and reports that it ended, as a browser would. */
function stubPlayEnding(): void {
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function (
    this: HTMLMediaElement,
  ) {
    window.setTimeout(() => {
      const handler = this.onended
      if (handler) handler.call(this, new Event('ended'))
    }, 0)
    return Promise.resolve()
  })
}

/** Refuses to play the clip, which is what a browser without the codec does. */
function stubPlayFailing(): void {
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() =>
    Promise.reject(new Error('unsupported source')),
  )
}

/**
 * Holds the speech engine back.
 *
 * The voice list arrives asynchronously in a real browser. With no voices the
 * engine waits, which is what lets a test walk away from the player while the
 * speech it started is still in flight.
 */
function stallVoices(): void {
  vi.spyOn(window.speechSynthesis, 'getVoices').mockReturnValue([])
}

/** Runs the countdown out so the player reaches the playing state. */
function runCountdown(): void {
  act(() => {
    vi.advanceTimersByTime(5000)
  })
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  cleanup()
})

describe('AudioPlayer', () => {
  it('renders nothing when there is nothing to play', () => {
    const { container } = render(<AudioPlayer />)

    expect(container).toBeEmptyDOMElement()
  })

  it('names the recording and its speakers', () => {
    render(<AudioPlayer audioId={AUDIO_ID} />)

    expect(screen.getByText('The economics of streaming')).toBeInTheDocument()
    expect(screen.getByText('2 speakers: Ms Aldana, Dr Reyes')).toBeInTheDocument()
  })

  it('calls a single-speaker recording a single speaker', () => {
    render(<AudioPlayer utterance="A sentence to repeat." />)

    expect(screen.getByText('Single speaker')).toBeInTheDocument()
  })

  it('offers the number of plays that are left', () => {
    render(<AudioPlayer audioId={AUDIO_ID} replays={1} />)

    expect(screen.getByRole('button', { name: /Play, 2 left/ })).toBeInTheDocument()
  })

  it('offers a single play when no replay is allowed', () => {
    render(<AudioPlayer audioId={AUDIO_ID} replays={0} />)

    expect(screen.getByRole('button', { name: /^Play$/ })).toBeInTheDocument()
  })

  it('counts down before the clip starts', () => {
    render(<AudioPlayer audioId={AUDIO_ID} leadIn={3} />)

    fireEvent.click(screen.getByRole('button', { name: /^Play/ }))

    const timer = screen.getByRole('timer')
    expect(timer).toHaveAttribute('aria-label', 'Starting in 3 seconds')
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('plays the clip once the countdown is over', () => {
    stubPlayEnding()
    render(<AudioPlayer audioId={AUDIO_ID} />)

    fireEvent.click(screen.getByRole('button', { name: /^Play/ }))
    runCountdown()

    expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument()
    expect(screen.queryByRole('timer')).not.toBeInTheDocument()
  })

  it('spends a play when the clip starts', async () => {
    stubPlayEnding()
    render(<AudioPlayer audioId={AUDIO_ID} replays={2} />)

    fireEvent.click(screen.getByRole('button', { name: /Play, 3 left/ }))
    runCountdown()
    await act(async () => {
      vi.advanceTimersByTime(1)
    })

    expect(screen.getByRole('button', { name: /Play, 2 left/ })).toBeInTheDocument()
  })

  it('reports the play so the caller can keep the count across a remount', async () => {
    stubPlayEnding()
    const onPlayUsed = vi.fn()
    render(<AudioPlayer audioId={AUDIO_ID} replays={1} onPlayUsed={onPlayUsed} />)

    fireEvent.click(screen.getByRole('button', { name: /Play, 2 left/ }))
    runCountdown()
    await act(async () => {
      vi.advanceTimersByTime(1)
    })

    expect(onPlayUsed).toHaveBeenCalledTimes(1)
  })

  it('takes the allowance from the caller, so a remount cannot restore it', () => {
    // The runner remounts the player every time the candidate moves between
    // items, so the count has to live with the caller: this is the player as
    // it comes back after one play of a recording that may only be played
    // once.
    const { rerender } = render(<AudioPlayer audioId={AUDIO_ID} replays={0} playsUsed={0} />)
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument()

    rerender(<AudioPlayer audioId={AUDIO_ID} replays={0} playsUsed={1} />)
    expect(screen.getByRole('button', { name: 'Played' })).toBeDisabled()
  })

  it('runs out of plays and says so', async () => {
    stubPlayEnding()
    render(<AudioPlayer audioId={AUDIO_ID} replays={0} />)

    fireEvent.click(screen.getByRole('button', { name: /^Play/ }))
    runCountdown()
    await act(async () => {
      vi.advanceTimersByTime(1)
    })

    const play = screen.getByRole('button', { name: 'Played' })
    expect(play).toBeDisabled()
  })

  it('hands back when the clip has finished', async () => {
    stubPlayEnding()
    const onPlayed = vi.fn()
    render(<AudioPlayer audioId={AUDIO_ID} replays={1} onPlayed={onPlayed} />)

    fireEvent.click(screen.getByRole('button', { name: /Play, 2 left/ }))
    runCountdown()
    await act(async () => {
      vi.advanceTimersByTime(1)
    })

    expect(onPlayed).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: /^Play$/ })).toBeInTheDocument()
  })

  it('cancels the countdown and keeps the play', () => {
    render(<AudioPlayer audioId={AUDIO_ID} replays={1} />)

    fireEvent.click(screen.getByRole('button', { name: /Play, 2 left/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.getByRole('button', { name: /Play, 2 left/ })).toBeInTheDocument()
    expect(screen.queryByRole('timer')).not.toBeInTheDocument()
  })

  it('stops a clip that is playing', () => {
    stubPlayEnding()
    render(<AudioPlayer audioId={AUDIO_ID} replays={1} />)

    fireEvent.click(screen.getByRole('button', { name: /Play, 2 left/ }))
    runCountdown()
    fireEvent.click(screen.getByRole('button', { name: 'Stop' }))

    expect(screen.getByRole('button', { name: /^Play$/ })).toBeInTheDocument()
  })

  it('says the browser cannot play the clip when there is nothing to fall back to', async () => {
    stubPlayFailing()
    render(<AudioPlayer audioId={UNKNOWN_AUDIO_ID} />)

    fireEvent.click(screen.getByRole('button', { name: /^Play/ }))
    runCountdown()
    await act(async () => {
      vi.advanceTimersByTime(10)
    })

    expect(screen.getByText(/This browser cannot play audio/)).toBeInTheDocument()
  })

  it('does not offer the transcript in an exam when the clip cannot be played', async () => {
    stubPlayFailing()
    render(<AudioPlayer audioId={UNKNOWN_AUDIO_ID} examMode />)

    fireEvent.click(screen.getByRole('button', { name: /^Play/ }))
    runCountdown()
    await act(async () => {
      vi.advanceTimersByTime(10)
    })

    // The transcript is the stimulus — the text to write from dictation, the
    // sentence to repeat, the passage with the wrong words in it — so it must
    // not become reachable just because the audio failed.
    expect(screen.queryByRole('button', { name: /transcript/i })).not.toBeInTheDocument()
  })

  it('offers the transcript outside an exam when the clip cannot be played', async () => {
    stubPlayFailing()
    render(<AudioPlayer audioId={UNKNOWN_AUDIO_ID} />)

    fireEvent.click(screen.getByRole('button', { name: /^Play/ }))
    runCountdown()
    await act(async () => {
      vi.advanceTimersByTime(10)
    })

    expect(screen.getByRole('button', { name: /Show transcript/ })).toBeInTheDocument()
  })

  it('falls back to speech synthesis when the clip cannot be played', async () => {
    stubPlayFailing()
    const speak = vi.spyOn(window.speechSynthesis, 'speak')
    render(<AudioPlayer audioId={AUDIO_ID} />)

    fireEvent.click(screen.getByRole('button', { name: /^Play/ }))
    runCountdown()
    await act(async () => {
      vi.advanceTimersByTime(10)
    })

    expect(speak).toHaveBeenCalled()
    const utterance = speak.mock.calls[0]?.[0] as SpeechSynthesisUtterance
    expect(utterance.text).toContain('marginal cost')
  })

  it('beeps where a word is missing instead of saying it', async () => {
    stubPlayFailing()
    const speak = vi.spyOn(window.speechSynthesis, 'speak')
    render(<AudioPlayer audioId={AUDIO_ID} fromTurn={0} beepWord={4} />)

    fireEvent.click(screen.getByRole('button', { name: /^Play/ }))
    runCountdown()
    await act(async () => {
      vi.advanceTimersByTime(10)
    })

    const utterance = speak.mock.calls[0]?.[0] as SpeechSynthesisUtterance
    expect(utterance.text).toBe('I am writing about')
    expect(utterance.text).not.toContain('the economics')
  })

  it('reads the whole turn when the beep is out of range', async () => {
    stubPlayFailing()
    const speak = vi.spyOn(window.speechSynthesis, 'speak')
    render(<AudioPlayer audioId={AUDIO_ID} fromTurn={0} beepWord={999} />)

    fireEvent.click(screen.getByRole('button', { name: /^Play/ }))
    runCountdown()
    await act(async () => {
      vi.advanceTimersByTime(10)
    })

    const utterance = speak.mock.calls[0]?.[0] as SpeechSynthesisUtterance
    expect(utterance.text).toBe(FIRST_TURN)
  })

  it('speaks a literal utterance when there is no clip', async () => {
    const speak = vi.spyOn(window.speechSynthesis, 'speak')
    render(<AudioPlayer utterance="The sentence to repeat." />)

    fireEvent.click(screen.getByRole('button', { name: /^Play/ }))
    runCountdown()
    await act(async () => {
      vi.advanceTimersByTime(10)
    })

    const utterance = speak.mock.calls[0]?.[0] as SpeechSynthesisUtterance
    expect(utterance.text).toBe('The sentence to repeat.')
  })

  it('says the browser cannot play when there is nothing to fall back to', async () => {
    const original = window.speechSynthesis
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: undefined })
    try {
      render(<AudioPlayer utterance="The sentence to repeat." />)

      fireEvent.click(screen.getByRole('button', { name: /^Play/ }))

      expect(screen.getByText(/This browser cannot play audio/)).toBeInTheDocument()
    } finally {
      Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: original })
    }
  })

  it('reports whether the audio is playing', async () => {
    stubPlayEnding()
    const onPlayStateChange = vi.fn()
    render(<AudioPlayer audioId={AUDIO_ID} onPlayStateChange={onPlayStateChange} />)

    expect(onPlayStateChange).toHaveBeenLastCalledWith(false)

    fireEvent.click(screen.getByRole('button', { name: /^Play/ }))
    runCountdown()
    await act(async () => {
      vi.advanceTimersByTime(1)
    })

    expect(onPlayStateChange).toHaveBeenCalledWith(true)
  })

  it('offers a speed control when the caller allows one', () => {
    render(<AudioPlayer audioId={AUDIO_ID} allowSpeedControl />)

    const group = screen.getByRole('group', { name: 'Playback speed' })
    expect(group).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '0.8×' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: '1.0×' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('changes the playback speed', () => {
    render(<AudioPlayer audioId={AUDIO_ID} allowSpeedControl />)

    fireEvent.click(screen.getByRole('button', { name: '1.2×' }))

    expect(screen.getByRole('button', { name: '1.2×' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '1.0×' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('locks the speed control while the clip is playing', () => {
    stubPlayEnding()
    render(<AudioPlayer audioId={AUDIO_ID} allowSpeedControl />)

    fireEvent.click(screen.getByRole('button', { name: /^Play/ }))
    runCountdown()

    expect(screen.getByRole('button', { name: '1.0×' })).toBeDisabled()
  })

  it('keeps the speed control out when the caller does not allow one', () => {
    render(<AudioPlayer audioId={AUDIO_ID} />)

    expect(screen.queryByRole('group', { name: 'Playback speed' })).not.toBeInTheDocument()
  })

  it('shows the transcript on request', () => {
    render(<AudioPlayer audioId={AUDIO_ID} showTranscript />)

    const toggle = screen.getByRole('button', { name: 'Show transcript' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(toggle)

    expect(screen.getByRole('button', { name: 'Hide transcript' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    expect(screen.getAllByText(/Ms Aldana:/).length).toBeGreaterThan(0)
    expect(
      screen.getByText(/marginal cost of serving an additional subscriber/),
    ).toBeInTheDocument()
  })

  it('hides the transcript again', () => {
    render(<AudioPlayer audioId={AUDIO_ID} showTranscript />)

    fireEvent.click(screen.getByRole('button', { name: 'Show transcript' }))
    fireEvent.click(screen.getByRole('button', { name: 'Hide transcript' }))

    expect(screen.getByRole('button', { name: 'Show transcript' })).toBeInTheDocument()
  })

  it('shows a literal utterance as the transcript', () => {
    render(<AudioPlayer utterance="The sentence to repeat." showTranscript />)

    fireEvent.click(screen.getByRole('button', { name: 'Show transcript' }))

    expect(screen.getByText('The sentence to repeat.')).toBeInTheDocument()
  })

  it('keeps the transcript away when it is not wanted', () => {
    render(<AudioPlayer audioId={AUDIO_ID} />)

    expect(screen.queryByRole('button', { name: 'Show transcript' })).not.toBeInTheDocument()
  })

  it('titles a missing-word clip', () => {
    render(<AudioPlayer audioId={UNKNOWN_AUDIO_ID} beepWord={2} />)

    expect(screen.getByText('Listen and select the missing word')).toBeInTheDocument()
  })

  it('titles a repeat-sentence clip', () => {
    render(<AudioPlayer utterance="The sentence to repeat." />)

    expect(screen.getByText('Listen and repeat the sentence')).toBeInTheDocument()
  })

  it('titles an unnamed recording', () => {
    render(<AudioPlayer audioId={UNKNOWN_AUDIO_ID} />)

    expect(screen.getByText('Audio recording')).toBeInTheDocument()
  })

  it('names the speaker while the clip plays', () => {
    stubPlayEnding()
    render(<AudioPlayer audioId={AUDIO_ID} />)

    fireEvent.click(screen.getByRole('button', { name: /^Play/ }))
    runCountdown()

    expect(screen.getByText('Ms Aldana:')).toBeInTheDocument()
  })

  it('stops the speech when the player goes away', async () => {
    stubPlayFailing()
    const cancel = vi.spyOn(window.speechSynthesis, 'cancel')
    const { unmount } = render(<AudioPlayer audioId={AUDIO_ID} />)

    fireEvent.click(screen.getByRole('button', { name: /^Play/ }))
    runCountdown()
    unmount()
    await act(async () => {
      vi.advanceTimersByTime(10)
    })

    expect(cancel).toHaveBeenCalled()
  })

  it('starts over when the stimulus changes', () => {
    const { rerender } = render(<AudioPlayer audioId={AUDIO_ID} replays={2} />)

    fireEvent.click(screen.getByRole('button', { name: /Play, 3 left/ }))
    rerender(<AudioPlayer audioId={UNKNOWN_AUDIO_ID} replays={2} />)

    expect(screen.getByRole('button', { name: /Play, 3 left/ })).toBeInTheDocument()
  })

  it('draws the playing bars only while the clip plays', () => {
    stubPlayEnding()
    const { container } = render(<AudioPlayer audioId={AUDIO_ID} />)

    fireEvent.click(screen.getByRole('button', { name: /^Play/ }))
    runCountdown()

    expect(container.querySelectorAll('.eq-bar')).toHaveLength(32)
  })

  it('renders compactly when it is asked to', () => {
    const { container } = render(<AudioPlayer audioId={AUDIO_ID} compact />)

    expect(container.querySelector('.card-solid')).toHaveClass('p-3')
  })

  it('renders at full size otherwise', () => {
    const { container } = render(<AudioPlayer audioId={AUDIO_ID} />)

    expect(container.querySelector('.card-solid')).toHaveClass('p-4')
  })

  it('calls a recording with one speaker a single speaker', () => {
    render(<AudioPlayer audioId="synthetic-single-speaker" />)

    expect(screen.getByText('A single speaker recording')).toBeInTheDocument()
    expect(screen.getByText('Single speaker')).toBeInTheDocument()
  })

  it('plays a clip that belongs to the item itself', async () => {
    stubPlayEnding()
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play')
    render(<AudioPlayer clipId="dictation-1" />)

    fireEvent.click(screen.getByRole('button', { name: /^Play/ }))
    runCountdown()

    expect(play).toHaveBeenCalled()
  })

  it('gives up the countdown when the stimulus is taken away', () => {
    const { rerender } = render(<AudioPlayer audioId={AUDIO_ID} />)

    fireEvent.click(screen.getByRole('button', { name: /^Play/ }))
    rerender(<AudioPlayer />)
    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('gives up the playback when the stimulus is taken away', async () => {
    stubPlayEnding()
    const { rerender } = render(<AudioPlayer audioId={AUDIO_ID} />)

    fireEvent.click(screen.getByRole('button', { name: /^Play/ }))
    runCountdown()
    rerender(<AudioPlayer />)
    await act(async () => {
      vi.advanceTimersByTime(1)
    })

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('skips the countdown when the lead-in is not a number of seconds', () => {
    stubPlayEnding()
    render(<AudioPlayer audioId={AUDIO_ID} leadIn={-1} />)

    fireEvent.click(screen.getByRole('button', { name: /^Play/ }))
    runCountdown()

    expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument()
  })

  it('does not report a clip that ends after the player has gone', async () => {
    stubPlayEnding()
    const onPlayed = vi.fn()
    const { unmount } = render(<AudioPlayer audioId={AUDIO_ID} onPlayed={onPlayed} />)

    fireEvent.click(screen.getByRole('button', { name: /^Play/ }))
    runCountdown()
    unmount()
    await act(async () => {
      vi.advanceTimersByTime(1)
    })

    expect(onPlayed).not.toHaveBeenCalled()
  })

  it('stops the speech it started when the player goes away mid-sentence', async () => {
    stallVoices()
    const cancel = vi.spyOn(window.speechSynthesis, 'cancel')
    const { unmount } = render(<AudioPlayer utterance="The sentence to repeat." />)

    fireEvent.click(screen.getByRole('button', { name: /^Play/ }))
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    await act(async () => {})
    unmount()
    const before = cancel.mock.calls.length
    await act(async () => {
      vi.advanceTimersByTime(700)
    })

    // The sentence is cut off: the engine is asked to stop as well as to cancel.
    expect(cancel.mock.calls.length).toBeGreaterThan(before + 1)
  })

  it('stops the beep it started when the player goes away mid-word', async () => {
    stubPlayFailing()
    stallVoices()
    const cancel = vi.spyOn(window.speechSynthesis, 'cancel')
    const { unmount } = render(<AudioPlayer audioId={AUDIO_ID} fromTurn={0} beepWord={4} />)

    fireEvent.click(screen.getByRole('button', { name: /^Play/ }))
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    await act(async () => {})
    unmount()
    const before = cancel.mock.calls.length
    await act(async () => {
      vi.advanceTimersByTime(700)
    })

    expect(cancel.mock.calls.length).toBeGreaterThan(before + 1)
  })

  it('stops the script it started when the player goes away mid-turn', async () => {
    stubPlayFailing()
    stallVoices()
    const cancel = vi.spyOn(window.speechSynthesis, 'cancel')
    const { unmount } = render(<AudioPlayer audioId={AUDIO_ID} />)

    fireEvent.click(screen.getByRole('button', { name: /^Play/ }))
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    await act(async () => {})
    unmount()
    const before = cancel.mock.calls.length
    await act(async () => {
      vi.advanceTimersByTime(700)
    })

    expect(cancel.mock.calls.length).toBeGreaterThan(before + 1)
  })

  it('reads the whole turn when the turn is not in the recording', async () => {
    stubPlayFailing()
    const speak = vi.spyOn(window.speechSynthesis, 'speak')
    render(<AudioPlayer audioId={AUDIO_ID} fromTurn={99} beepWord={1} />)

    fireEvent.click(screen.getByRole('button', { name: /^Play/ }))
    runCountdown()
    await act(async () => {
      vi.advanceTimersByTime(10)
    })

    // The turn is past the end of the recording, so there is nothing to say.
    expect(speak).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Played' })).toBeInTheDocument()
  })

  it('speaks a turn whose speaker is not in the recording', async () => {
    stubPlayFailing()
    const speak = vi.spyOn(window.speechSynthesis, 'speak')
    render(<AudioPlayer audioId="synthetic-orphan-speaker" fromTurn={0} beepWord={2} />)

    fireEvent.click(screen.getByRole('button', { name: /^Play/ }))
    runCountdown()
    await act(async () => {
      vi.advanceTimersByTime(10)
    })

    const utterance = speak.mock.calls[0]?.[0] as SpeechSynthesisUtterance
    expect(utterance.text).toBe('One two')
  })

  it('does not fall back twice when the clip fails in two ways', async () => {
    stubPlayFailing()
    const speak = vi.spyOn(window.speechSynthesis, 'speak')
    const elements: HTMLAudioElement[] = []
    class TrackedAudio {
      constructor() {
        const element = document.createElement('audio')
        elements.push(element)
        return element as unknown as TrackedAudio
      }
    }
    vi.stubGlobal('Audio', TrackedAudio)

    const { unmount } = render(<AudioPlayer audioId={AUDIO_ID} />)
    fireEvent.click(screen.getByRole('button', { name: /^Play/ }))
    runCountdown()
    await act(async () => {
      vi.advanceTimersByTime(10)
    })

    const element = elements[0]
    expect(element).toBeDefined()
    const spoken = speak.mock.calls.length

    // The element reports an error as well as refusing to play: the fallback
    // has already run, so it must not run again.
    await act(async () => {
      element?.dispatchEvent(new Event('error'))
    })
    expect(speak.mock.calls.length).toBe(spoken)

    // A late error from an element the player has abandoned is ignored.
    unmount()
    await act(async () => {
      element?.dispatchEvent(new Event('error'))
    })
    expect(speak.mock.calls.length).toBe(spoken)
  })

  it('falls back when the browser cannot make an audio element at all', async () => {
    stubPlayFailing()
    class BrokenAudio {
      constructor() {
        throw new Error('no media support')
      }
    }
    vi.stubGlobal('Audio', BrokenAudio)

    render(<AudioPlayer audioId={AUDIO_ID} />)
    fireEvent.click(screen.getByRole('button', { name: /^Play/ }))
    runCountdown()
    await act(async () => {
      vi.advanceTimersByTime(10)
    })

    expect(screen.queryByText(/This browser cannot play audio/)).not.toBeInTheDocument()
  })
})
