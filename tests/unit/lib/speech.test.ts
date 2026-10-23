import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AudioScript, Turn } from '../../../src/content/schema'
import {
  cleanProsodyText,
  isSpeechSupported,
  loadVoices,
  playCountdownBeep,
  playErrorTone,
  playSuccessTone,
  playTone,
  speakScript,
  speakText,
  speakWithBeep,
  stopAllSpeech,
} from '../../../src/lib/speech'

/* ---------------------------------------------------------------------------
   Speech playback.

   The listening items are read aloud by the platform's speech engine, so this
   module has to walk a script one turn at a time, pick a voice for each
   speaker, and stop dead when the test says so. The engine in the test
   environment ends every utterance on a timer, which is what lets the turn
   chain run under fake timers exactly as it would in a browser.
   --------------------------------------------------------------------------- */

const SCRIPT: AudioScript = {
  id: 'script-1',
  title: 'Coral reefs',
  kind: 'conversation',
  topic: 'Coral reefs',
  speakers: [
    { id: 'a', name: 'Ana', voiceHint: 'high' },
    { id: 'b', name: 'Ben', voiceHint: 'low' },
    { id: 'c', name: 'Cara', voiceHint: 'mid' },
    { id: 'd', name: 'Dan', voiceHint: 'mid-high' },
  ],
  turns: [
    { speaker: 'a', text: 'Coral reefs are dying.' },
    { speaker: 'b', text: 'That is — bad news.' },
    { speaker: 'c', text: 'We must act now.' },
    { speaker: 'd', text: 'Nobody argues.' },
  ],
}

/** A spy on the oscillator factory, with the frequencies it was asked for. */
interface OscillatorSpy {
  mock: { results: Array<{ type: string; value: unknown }> }
}

function oscillatorFrequencies(spy: OscillatorSpy): number[] {
  const frequencies: number[] = []
  for (const result of spy.mock.results) {
    if (result.type !== 'return') continue
    frequencies.push((result.value as OscillatorNode).frequency.value)
  }
  return frequencies
}

/** The text of every utterance the engine was asked to speak. */
function spokenTexts(spy: { mock: { calls: Array<[SpeechSynthesisUtterance]> } }): string[] {
  return spy.mock.calls.map((call) => call[0].text)
}

describe('cleanProsodyText', () => {
  it('turns an em dash into a pause', () => {
    expect(cleanProsodyText('That is — bad news.')).toBe('That is, bad news.')
    expect(cleanProsodyText('That is—bad news.')).toBe('That is, bad news.')
  })

  it('turns an en dash into a pause', () => {
    expect(cleanProsodyText('That is – bad news.')).toBe('That is, bad news.')
  })

  it('collapses a run of spaces', () => {
    expect(cleanProsodyText('one   two    three')).toBe('one two three')
  })

  it('trims the ends', () => {
    expect(cleanProsodyText('   padded   ')).toBe('padded')
  })

  it('leaves ordinary text alone', () => {
    expect(cleanProsodyText('A plain sentence.')).toBe('A plain sentence.')
  })
})

describe('isSpeechSupported', () => {
  it('is true in a browser that can speak', () => {
    expect(isSpeechSupported()).toBe(true)
  })

  it('is false when the browser has no speech engine', () => {
    vi.stubGlobal('speechSynthesis', undefined)
    const supported = isSpeechSupported()
    vi.unstubAllGlobals()
    expect(supported).toBe(false)
  })
})

describe('loadVoices', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('resolves straight away when the engine already knows its voices', async () => {
    const voices = await loadVoices()
    expect(voices.map((v) => v.name)).toEqual([
      'Samantha',
      'Daniel',
      'Karen',
      'Google UK English Female',
      'Zarvox',
    ])
  })

  it('waits for the voices-changed event when the engine has none yet', async () => {
    vi.useFakeTimers()
    const getVoices = vi.spyOn(window.speechSynthesis, 'getVoices').mockReturnValue([])
    const promise = loadVoices()
    window.speechSynthesis.dispatchEvent(new Event('voiceschanged'))
    await expect(promise).resolves.toEqual([])
    expect(getVoices).toHaveBeenCalled()
  })

  it('gives up waiting after a short delay', async () => {
    vi.useFakeTimers()
    vi.spyOn(window.speechSynthesis, 'getVoices').mockReturnValue([])
    const promise = loadVoices()
    await vi.advanceTimersByTimeAsync(600)
    await expect(promise).resolves.toEqual([])
  })

  it('ignores a voices-changed event that arrives after it has settled', async () => {
    vi.useFakeTimers()
    vi.spyOn(window.speechSynthesis, 'getVoices').mockReturnValue([])
    const promise = loadVoices()
    await vi.advanceTimersByTimeAsync(600)
    await expect(promise).resolves.toEqual([])
    window.speechSynthesis.dispatchEvent(new Event('voiceschanged'))
    await vi.advanceTimersByTimeAsync(10)
  })

  it('copes with an engine that reports nothing at all', async () => {
    vi.useFakeTimers()
    const getVoices = vi.spyOn(window.speechSynthesis, 'getVoices')
    getVoices.mockReturnValueOnce([]).mockReturnValue(undefined as unknown as SpeechSynthesisVoice[])
    const promise = loadVoices()
    await vi.advanceTimersByTimeAsync(600)
    await expect(promise).resolves.toEqual([])
  })

  it('copes with an engine that hands back no timer at all', async () => {
    vi.useFakeTimers()
    vi.spyOn(window.speechSynthesis, 'getVoices').mockReturnValue([])
    // A hostile engine whose timer id comes back as nothing at all.
    vi.spyOn(window, 'setTimeout').mockReturnValue(
      null as unknown as ReturnType<typeof window.setTimeout>,
    )
    const promise = loadVoices()
    window.speechSynthesis.dispatchEvent(new Event('voiceschanged'))
    await expect(promise).resolves.toEqual([])
  })

  it('resolves with nothing when the browser cannot speak', async () => {
    vi.stubGlobal('speechSynthesis', undefined)
    const voices = await loadVoices()
    vi.unstubAllGlobals()
    expect(voices).toEqual([])
  })
})

describe('speakScript', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('speaks each turn in turn and reports the end', async () => {
    const speak = vi.spyOn(window.speechSynthesis, 'speak')
    const started: number[] = []
    const onEnd = vi.fn()
    const controller = await speakScript(SCRIPT, {
      onTurnStart: (index) => started.push(index),
      onEnd,
    })
    expect(controller.speaking).toBe(true)
    await vi.advanceTimersByTimeAsync(2000)
    expect(spokenTexts(speak)).toEqual([
      'Coral reefs are dying.',
      'That is, bad news.',
      'We must act now.',
      'Nobody argues.',
    ])
    expect(started).toEqual([0, 1, 2, 3])
    expect(onEnd).toHaveBeenCalledTimes(1)
    expect(controller.speaking).toBe(false)
  })

  it('speaks only the turns it is asked for', async () => {
    const speak = vi.spyOn(window.speechSynthesis, 'speak')
    const started: number[] = []
    const onEnd = vi.fn()
    await speakScript(SCRIPT, {
      fromTurn: 1,
      toTurn: 2,
      onTurnStart: (index) => started.push(index),
      onEnd,
    })
    await vi.advanceTimersByTimeAsync(2000)
    expect(spokenTexts(speak)).toEqual(['That is, bad news.', 'We must act now.'])
    expect(started).toEqual([1, 2])
    expect(onEnd).toHaveBeenCalledTimes(1)
  })

  it('starts at the first turn when the range is negative', async () => {
    const speak = vi.spyOn(window.speechSynthesis, 'speak')
    await speakScript(SCRIPT, { fromTurn: -3, toTurn: 0 })
    await vi.advanceTimersByTimeAsync(1000)
    expect(spokenTexts(speak)).toEqual(['Coral reefs are dying.'])
  })

  it('falls back to the first speaker when a turn names an unknown one', async () => {
    const speak = vi.spyOn(window.speechSynthesis, 'speak')
    const script: AudioScript = {
      ...SCRIPT,
      turns: [{ speaker: 'ghost', text: 'Who said that?' }],
    }
    await speakScript(script, {})
    await vi.advanceTimersByTimeAsync(1000)
    expect(spokenTexts(speak)).toEqual(['Who said that?'])
    expect(speak.mock.calls[0]?.[0].voice?.name).toBe('Google UK English Female')
    expect(speak.mock.calls[0]?.[0].lang).toBe('en-GB')
  })

  it('says nothing when the script has no speakers at all', async () => {
    const speak = vi.spyOn(window.speechSynthesis, 'speak')
    const onEnd = vi.fn()
    const script: AudioScript = {
      ...SCRIPT,
      speakers: [],
      turns: [{ speaker: 'a', text: 'Hello?' }],
    }
    const controller = await speakScript(script, { onEnd })
    await vi.advanceTimersByTimeAsync(1000)
    expect(speak).not.toHaveBeenCalled()
    expect(onEnd).toHaveBeenCalledTimes(1)
    expect(controller.speaking).toBe(false)
  })

  it('skips a turn that is missing from the script', async () => {
    const speak = vi.spyOn(window.speechSynthesis, 'speak')
    const turns: Turn[] = []
    turns.push({ speaker: 'a', text: 'First' })
    turns[2] = { speaker: 'a', text: 'Third' }
    const script: AudioScript = { ...SCRIPT, turns }
    await speakScript(script, {})
    await vi.advanceTimersByTimeAsync(2000)
    expect(spokenTexts(speak)).toEqual(['First', 'Third'])
  })

  it('stops speaking when the controller is stopped', async () => {
    const speak = vi.spyOn(window.speechSynthesis, 'speak')
    const onEnd = vi.fn()
    const controller = await speakScript(SCRIPT, { onEnd })
    controller.stop()
    await vi.advanceTimersByTimeAsync(2000)
    expect(speak).toHaveBeenCalledTimes(1)
    expect(onEnd).not.toHaveBeenCalled()
    expect(controller.speaking).toBe(false)
  })

  it('reports an error that is not an interruption', async () => {
    const spoken: SpeechSynthesisUtterance[] = []
    vi.spyOn(window.speechSynthesis, 'speak').mockImplementation((utterance: SpeechSynthesisUtterance) => {
      spoken.push(utterance)
    })
    const onError = vi.fn()
    const onEnd = vi.fn()
    await speakScript(SCRIPT, { onError, onEnd })
    spoken[0]?.onerror?.call(spoken[0]!, { error: 'network' } as unknown as SpeechSynthesisErrorEvent)
    expect(onError).toHaveBeenCalledWith('network')
    expect(onEnd).toHaveBeenCalledTimes(1)
  })

  it('ignores an interruption', async () => {
    const spoken: SpeechSynthesisUtterance[] = []
    vi.spyOn(window.speechSynthesis, 'speak').mockImplementation((utterance: SpeechSynthesisUtterance) => {
      spoken.push(utterance)
    })
    const onError = vi.fn()
    const onEnd = vi.fn()
    await speakScript(SCRIPT, { onError, onEnd })
    spoken[0]?.onerror?.call(
      spoken[0]!,
      { error: 'interrupted' } as unknown as SpeechSynthesisErrorEvent,
    )
    expect(onError).not.toHaveBeenCalled()
    expect(onEnd).not.toHaveBeenCalled()
  })

  it('ignores a cancelled utterance', async () => {
    const spoken: SpeechSynthesisUtterance[] = []
    vi.spyOn(window.speechSynthesis, 'speak').mockImplementation((utterance: SpeechSynthesisUtterance) => {
      spoken.push(utterance)
    })
    const onError = vi.fn()
    await speakScript(SCRIPT, { onError })
    spoken[0]?.onerror?.call(
      spoken[0]!,
      { error: 'canceled' } as unknown as SpeechSynthesisErrorEvent,
    )
    expect(onError).not.toHaveBeenCalled()
  })

  it('reports a failure that carries no error code', async () => {
    const spoken: SpeechSynthesisUtterance[] = []
    vi.spyOn(window.speechSynthesis, 'speak').mockImplementation((utterance: SpeechSynthesisUtterance) => {
      spoken.push(utterance)
    })
    const onError = vi.fn()
    await speakScript(SCRIPT, { onError })
    spoken[0]?.onerror?.call(spoken[0]!, {} as SpeechSynthesisErrorEvent)
    expect(onError).toHaveBeenCalledWith('Speech synthesis failed.')
  })

  it('gives up when an utterance never ends', async () => {
    vi.spyOn(window.speechSynthesis, 'speak').mockImplementation(() => {})
    const onError = vi.fn()
    const onEnd = vi.fn()
    await speakScript(SCRIPT, { onError, onEnd })
    await vi.advanceTimersByTimeAsync(20000)
    expect(onError).toHaveBeenCalledWith('Speech playback timed out.')
    expect(onEnd).toHaveBeenCalledTimes(1)
  })

  it('keeps the engine awake while it speaks', async () => {
    vi.spyOn(window.speechSynthesis, 'speak').mockImplementation(() => {})
    const resume = vi.spyOn(window.speechSynthesis, 'resume')
    await speakScript(SCRIPT, {})
    await vi.advanceTimersByTimeAsync(10001)
    expect(resume).toHaveBeenCalled()
  })

  it('reports that speech is unavailable', async () => {
    vi.stubGlobal('speechSynthesis', undefined)
    const onError = vi.fn()
    const onEnd = vi.fn()
    const controller = await speakScript(SCRIPT, { onError, onEnd })
    // The controller is handed back with a stop that does nothing, because
    // there was never any speech to stop.
    controller.stop()
    vi.unstubAllGlobals()
    expect(onError).toHaveBeenCalledWith('Speech synthesis is not available in this browser.')
    expect(onEnd).toHaveBeenCalledTimes(1)
    expect(controller.speaking).toBe(false)
  })

  it('does not report a timeout for playback that was already stopped', async () => {
    vi.spyOn(window.speechSynthesis, 'speak').mockImplementation(() => {})
    // The cancellation loses the race with the safety timer, so the timer
    // still fires after the playback was stopped.
    vi.spyOn(window, 'clearTimeout').mockImplementation(() => {})
    const onError = vi.fn()
    const onEnd = vi.fn()
    const controller = await speakScript(SCRIPT, { onError, onEnd })
    controller.stop()
    await vi.advanceTimersByTimeAsync(20000)
    expect(onError).not.toHaveBeenCalled()
    expect(onEnd).not.toHaveBeenCalled()
  })

  it('gives each speaker a voice of its own', async () => {
    const speak = vi.spyOn(window.speechSynthesis, 'speak')
    await speakScript(SCRIPT, {})
    await vi.advanceTimersByTimeAsync(2000)
    const voices = speak.mock.calls.map((call) => call[0].voice?.name)
    expect(voices[0]).toBe('Google UK English Female')
    expect(new Set(voices).size).toBe(4)
  })

  it('picks the best voice it can for an unusual accent', async () => {
    const voices: SpeechSynthesisVoice[] = [
      { name: 'Yuna', lang: 'ko-KR', localService: true, default: false, voiceURI: 'Yuna' },
      { name: 'Albert', lang: 'en-US', localService: true, default: false, voiceURI: 'Albert' },
      {
        name: 'Microsoft Ava',
        lang: 'en-IN',
        localService: false,
        default: false,
        voiceURI: 'Microsoft Ava',
      },
      { name: 'Oliver', lang: 'en-AU', localService: true, default: false, voiceURI: 'Oliver' },
      { name: 'Fiona', lang: 'en-IE', localService: false, default: false, voiceURI: 'Fiona' },
      {
        name: 'British Amy',
        lang: 'en-UK',
        localService: true,
        default: false,
        voiceURI: 'British Amy',
      },
    ]
    vi.spyOn(window.speechSynthesis, 'getVoices').mockReturnValue(voices)
    const speak = vi.spyOn(window.speechSynthesis, 'speak')
    await speakScript(SCRIPT, {})
    await vi.advanceTimersByTimeAsync(2000)
    const chosen = speak.mock.calls.map((call) => call[0].voice?.name)
    expect(chosen[0]).toBe('Microsoft Ava')
    expect(chosen[1]).toBe('Oliver')
  })

  it('prefers a neural voice over a plain one', async () => {
    const voices: SpeechSynthesisVoice[] = [
      { name: 'Plain Sam', lang: 'en-US', localService: true, default: true, voiceURI: 'Plain Sam' },
      {
        name: 'Siri Neural',
        lang: 'en-US',
        localService: true,
        default: false,
        voiceURI: 'Siri Neural',
      },
    ]
    vi.spyOn(window.speechSynthesis, 'getVoices').mockReturnValue(voices)
    const speak = vi.spyOn(window.speechSynthesis, 'speak')
    await speakScript(SCRIPT, {})
    await vi.advanceTimersByTimeAsync(2000)
    expect(speak.mock.calls[0]?.[0].voice?.name).toBe('Siri Neural')
  })

  it('reuses a voice when there is only one worth using', async () => {
    const voices: SpeechSynthesisVoice[] = [
      { name: 'Samantha', lang: 'en-US', localService: true, default: true, voiceURI: 'Samantha' },
    ]
    vi.spyOn(window.speechSynthesis, 'getVoices').mockReturnValue(voices)
    const speak = vi.spyOn(window.speechSynthesis, 'speak')
    await speakScript(SCRIPT, {})
    await vi.advanceTimersByTimeAsync(2000)
    expect(speak.mock.calls.map((call) => call[0].voice?.name)).toEqual([
      'Samantha',
      'Samantha',
      'Samantha',
      'Samantha',
    ])
  })

  it('speaks without a voice when the engine offers nothing usable', async () => {
    const voices: SpeechSynthesisVoice[] = [
      { name: 'Yuna', lang: 'ko-KR', localService: true, default: false, voiceURI: 'Yuna' },
      { name: 'Zarvox', lang: 'en-US', localService: true, default: false, voiceURI: 'Zarvox' },
    ]
    vi.spyOn(window.speechSynthesis, 'getVoices').mockReturnValue(voices)
    const speak = vi.spyOn(window.speechSynthesis, 'speak')
    await speakScript(SCRIPT, {})
    await vi.advanceTimersByTimeAsync(2000)
    expect(speak).toHaveBeenCalledTimes(4)
    expect(speak.mock.calls[0]?.[0].voice).toBeNull()
    expect(speak.mock.calls[0]?.[0].lang).toBe('')
  })
})

describe('speakText', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('reads a string aloud as a single turn', async () => {
    const speak = vi.spyOn(window.speechSynthesis, 'speak')
    const started: number[] = []
    const onEnd = vi.fn()
    await speakText('Read this aloud.', {
      onTurnStart: (index) => started.push(index),
      onEnd,
    })
    await vi.advanceTimersByTimeAsync(1000)
    expect(spokenTexts(speak)).toEqual(['Read this aloud.'])
    expect(started).toEqual([0])
    expect(onEnd).toHaveBeenCalledTimes(1)
  })
})

describe('speakWithBeep', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('speaks the remainder after a beep when there is no lead-in', async () => {
    const speak = vi.spyOn(window.speechSynthesis, 'speak')
    const onEnd = vi.fn()
    const controller = await speakWithBeep('', 'The tail of the sentence.', { onEnd })
    await vi.advanceTimersByTimeAsync(2000)
    expect(spokenTexts(speak)).toEqual(['The tail of the sentence.'])
    expect(onEnd).toHaveBeenCalledTimes(1)
    expect(controller.speaking).toBe(false)
  })

  it('speaks the lead-in first and the remainder after the beep', async () => {
    const speak = vi.spyOn(window.speechSynthesis, 'speak')
    const onEnd = vi.fn()
    await speakWithBeep('The lead-in.', 'The tail.', { onEnd })
    await vi.advanceTimersByTimeAsync(2000)
    expect(spokenTexts(speak)).toEqual(['The lead-in.', 'The tail.'])
    expect(onEnd).toHaveBeenCalledTimes(1)
  })

  it('stops before the remainder is spoken', async () => {
    const speak = vi.spyOn(window.speechSynthesis, 'speak')
    const controller = await speakWithBeep('', 'The tail.', {})
    controller.stop()
    await vi.advanceTimersByTimeAsync(2000)
    expect(speak).not.toHaveBeenCalled()
    expect(controller.speaking).toBe(false)
  })

  it('does not speak the remainder when the beep loses the race with the stop', async () => {
    const speak = vi.spyOn(window.speechSynthesis, 'speak')
    // The cancellation loses the race with the beep timer, so the timer still
    // fires after the playback was stopped.
    vi.spyOn(window, 'clearTimeout').mockImplementation(() => {})
    const controller = await speakWithBeep('', 'The tail.', {})
    controller.stop()
    await vi.advanceTimersByTimeAsync(2000)
    expect(speak).not.toHaveBeenCalled()
    expect(controller.speaking).toBe(false)
  })

  it('stops the inner playback as well', async () => {
    const speak = vi.spyOn(window.speechSynthesis, 'speak')
    const controller = await speakWithBeep('The lead-in.', 'The tail.', {})
    await vi.advanceTimersByTimeAsync(2000)
    controller.stop()
    await vi.advanceTimersByTimeAsync(2000)
    expect(spokenTexts(speak)).toEqual(['The lead-in.', 'The tail.'])
    expect(controller.speaking).toBe(false)
  })

  it('reports an error in the lead-in', async () => {
    const spoken: SpeechSynthesisUtterance[] = []
    vi.spyOn(window.speechSynthesis, 'speak').mockImplementation((utterance: SpeechSynthesisUtterance) => {
      spoken.push(utterance)
    })
    const onError = vi.fn()
    const controller = await speakWithBeep('The lead-in.', 'The tail.', { onError })
    spoken[0]?.onerror?.call(
      spoken[0]!,
      { error: 'network' } as unknown as SpeechSynthesisErrorEvent,
    )
    expect(onError).toHaveBeenCalledWith('network')
    expect(controller.speaking).toBe(false)
  })

  it('reports an error in the remainder', async () => {
    const spoken: SpeechSynthesisUtterance[] = []
    vi.spyOn(window.speechSynthesis, 'speak').mockImplementation((utterance: SpeechSynthesisUtterance) => {
      spoken.push(utterance)
      if (spoken.length === 1) {
        window.setTimeout(() => {
          utterance.onend?.(new Event('end') as unknown as SpeechSynthesisEvent)
        }, 0)
      }
    })
    const onError = vi.fn()
    await speakWithBeep('The lead-in.', 'The tail.', { onError })
    await vi.advanceTimersByTimeAsync(2000)
    expect(spoken).toHaveLength(2)
    spoken[1]?.onerror?.call(
      spoken[1]!,
      { error: 'network' } as unknown as SpeechSynthesisErrorEvent,
    )
    expect(onError).toHaveBeenCalledWith('network')
  })
})

describe('stopAllSpeech', () => {
  it('cancels the speech engine', () => {
    const cancel = vi.spyOn(window.speechSynthesis, 'cancel')
    stopAllSpeech()
    expect(cancel).toHaveBeenCalled()
  })

  it('does nothing when the browser cannot speak', () => {
    const cancel = vi.spyOn(window.speechSynthesis, 'cancel')
    vi.stubGlobal('speechSynthesis', undefined)
    stopAllSpeech()
    vi.unstubAllGlobals()
    expect(cancel).not.toHaveBeenCalled()
  })
})

describe('tones', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('plays a tone at the requested frequency', () => {
    const create = vi.spyOn(window.AudioContext.prototype, 'createOscillator')
    playTone(1234, 50, 0.02)
    expect(oscillatorFrequencies(create)).toEqual([1234])
  })

  it('beeps higher when the countdown is nearly over', () => {
    const create = vi.spyOn(window.AudioContext.prototype, 'createOscillator')
    playCountdownBeep(3)
    expect(oscillatorFrequencies(create)).toEqual([880])
  })

  it('beeps lower when there is time left', () => {
    const create = vi.spyOn(window.AudioContext.prototype, 'createOscillator')
    playCountdownBeep(10)
    expect(oscillatorFrequencies(create)).toEqual([620])
  })

  it('plays a second, higher tone after a success', async () => {
    vi.useFakeTimers()
    const create = vi.spyOn(window.AudioContext.prototype, 'createOscillator')
    playSuccessTone()
    expect(oscillatorFrequencies(create)).toEqual([700])
    await vi.advanceTimersByTimeAsync(100)
    expect(oscillatorFrequencies(create)).toEqual([700, 940])
  })

  it('plays a low tone for an error', () => {
    const create = vi.spyOn(window.AudioContext.prototype, 'createOscillator')
    playErrorTone()
    expect(oscillatorFrequencies(create)).toEqual([300])
  })

  it('does nothing when the browser has no audio support', () => {
    const create = vi.spyOn(window.AudioContext.prototype, 'createOscillator')
    vi.stubGlobal('AudioContext', undefined)
    vi.stubGlobal('webkitAudioContext', undefined)
    playTone(440, 50)
    vi.unstubAllGlobals()
    expect(create).not.toHaveBeenCalled()
  })

  it('falls back to the prefixed audio context', async () => {
    vi.resetModules()
    const speech = await import('../../../src/lib/speech')
    const create = vi.spyOn(window.AudioContext.prototype, 'createOscillator')
    vi.stubGlobal('AudioContext', undefined)
    speech.playTone(440, 50)
    vi.unstubAllGlobals()
    expect(oscillatorFrequencies(create)).toEqual([440])
  })

  it('resumes an audio context that is suspended', async () => {
    vi.resetModules()
    const speech = await import('../../../src/lib/speech')
    const resume = vi.fn(async () => {
      state = 'running'
    })
    let state: AudioContextState = 'suspended'
    const fakeContext = {
      get state() {
        return state
      },
      currentTime: 0,
      destination: {},
      resume,
      // The real context can be closed, and the module closes it when the page
      // goes away, so the stub has to answer the call too.
      close: async () => {},
      createOscillator: () => ({
        type: 'sine',
        frequency: { value: 0 },
        connect: (node: unknown) => node,
        start: () => {},
        stop: () => {},
      }),
      createGain: () => ({
        gain: {
          setValueAtTime: () => {},
          exponentialRampToValueAtTime: () => {},
        },
        connect: (node: unknown) => node,
      }),
    }
    vi.stubGlobal(
      'AudioContext',
      function () {
        return fakeContext
      } as unknown as typeof AudioContext,
    )
    speech.playTone(440, 50)
    expect(resume).toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it('closes the shared audio context when the page goes away', async () => {
    vi.resetModules()
    const speech = await import('../../../src/lib/speech')
    // The close rejects here so the failure path is exercised as well: a
    // context that will not close must not throw on the way out of the page.
    const close = vi.fn(async () => {
      throw new Error('already closed')
    })
    const fakeContext = {
      state: 'running',
      currentTime: 0,
      destination: {},
      close,
      resume: async () => {},
      createOscillator: () => ({
        type: 'sine',
        frequency: { value: 0 },
        connect: (node: unknown) => node,
        start: () => {},
        stop: () => {},
      }),
      createGain: () => ({
        gain: {
          setValueAtTime: () => {},
          exponentialRampToValueAtTime: () => {},
        },
        connect: (node: unknown) => node,
      }),
    }
    vi.stubGlobal(
      'AudioContext',
      function () {
        return fakeContext
      } as unknown as typeof AudioContext,
    )
    speech.playTone(440, 50)
    expect(close).not.toHaveBeenCalled()
    // The context is shared for the life of the page, so it is closed when the
    // page goes away rather than being left open until the tab is discarded.
    window.dispatchEvent(new Event('pagehide'))
    expect(close).toHaveBeenCalledTimes(1)
    // A context made after the page went away is still covered: the handler
    // stays bound and closes whatever context is current.
    speech.playTone(440, 50)
    window.dispatchEvent(new Event('pagehide'))
    expect(close).toHaveBeenCalledTimes(2)
    // A third pagehide has no context left to close.
    window.dispatchEvent(new Event('pagehide'))
    expect(close).toHaveBeenCalledTimes(2)
    vi.unstubAllGlobals()
  })
})
