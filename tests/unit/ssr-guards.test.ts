// @vitest-environment node

import { describe, expect, it } from 'vitest'

/* ---------------------------------------------------------------------------
   The server-render guards.

   The site is prerendered: `scripts/prerender.mjs` renders every route in
   Node, where there is no `window`, no `localStorage` and no IndexedDB. The
   modules that touch the browser have to degrade rather than throw, and the
   guards that make them degrade are unreachable from a jsdom test — `window`
   is always defined there.

   This file runs in a plain Node environment, which is the only way to reach
   them.
   --------------------------------------------------------------------------- */

describe('speech synthesis without a DOM', () => {
  it('reports speech as unsupported', async () => {
    const { isSpeechSupported } = await import('../../src/lib/speech')
    expect(isSpeechSupported()).toBe(false)
  })

  it('resolves an empty voice list', async () => {
    const { loadVoices } = await import('../../src/lib/speech')
    await expect(loadVoices()).resolves.toEqual([])
  })

  it('reports an error and ends when asked to speak', async () => {
    const { speakText } = await import('../../src/lib/speech')
    const errors: string[] = []
    let ended = false

    const controller = await speakText('hello', {
      onError: (message) => errors.push(message),
      onEnd: () => {
        ended = true
      },
    })

    expect(errors).toEqual(['Speech synthesis is not available in this browser.'])
    expect(ended).toBe(true)
    expect(controller.speaking).toBe(false)
  })

  it('does not throw when stopping speech', async () => {
    const { stopAllSpeech } = await import('../../src/lib/speech')
    expect(() => stopAllSpeech()).not.toThrow()
  })

  it('does not throw when playing a tone', async () => {
    const { playTone, playCountdownBeep, playSuccessTone, playErrorTone } = await import('../../src/lib/speech')
    expect(() => playTone()).not.toThrow()
    expect(() => playCountdownBeep(3)).not.toThrow()
    expect(() => playSuccessTone()).not.toThrow()
    expect(() => playErrorTone()).not.toThrow()
  })
})

describe('the guest owner without a DOM', () => {
  it('falls back to a fixed server identity', async () => {
    const { getGuestOwnerId } = await import('../../src/lib/guestOwner')
    expect(getGuestOwnerId()).toBe('guest:server')
  })
})

describe('the reduced-motion hook without a DOM', () => {
  it('renders the server snapshot, so the first render agrees with the client', async () => {
    const { renderToString } = await import('react-dom/server')
    const { createElement } = await import('react')
    const { usePrefersReducedMotion } = await import('../../src/lib/motion')

    function Probe() {
      const reduced = usePrefersReducedMotion()
      return createElement('span', null, reduced ? 'reduced' : 'not reduced')
    }

    expect(renderToString(createElement(Probe))).toContain('not reduced')
  })
})

describe('storage without a DOM', () => {
  it('keeps values in memory', async () => {
    const { safeStateStorage } = await import('../../src/lib/storage')
    const storage = safeStateStorage()

    storage.setItem('key', 'value')
    expect(storage.getItem('key')).toBe('value')

    storage.removeItem('key')
    expect(storage.getItem('key')).toBeNull()
  })

  it('keeps throttled values in memory', async () => {
    const { throttledStateStorage } = await import('../../src/lib/storage')
    const storage = throttledStateStorage(10)

    storage.setItem('key', 'value')
    expect(storage.getItem('key')).toBe('value')
    expect(storage.getItem('missing')).toBeNull()
  })
})

describe('the attempt database without a DOM', () => {
  it('returns empty results rather than throwing', async () => {
    const { listAttempts, listAllAttempts, getAttempt, readKv } = await import('../../src/db/db')

    await expect(listAttempts(10)).resolves.toEqual([])
    await expect(listAllAttempts()).resolves.toEqual([])
    await expect(getAttempt('missing')).resolves.toBeUndefined()
    await expect(readKv('missing', 'fallback')).resolves.toBe('fallback')
  })

  it('swallows a failed write', async () => {
    const { writeKv } = await import('../../src/db/db')
    await expect(writeKv('key', 'value')).resolves.toBe(false)
  })
})

describe('the local owner without a DOM', () => {
  it('resolves no owner on the server', async () => {
    const React = await import('react')
    const { renderToStaticMarkup } = await import('react-dom/server')
    const { useLocalOwnerId } = await import('../../src/lib/useLocalOwner')

    let owner: string | null = null
    function Probe({ onValue }: { onValue: (value: string | null) => void }) {
      onValue(useLocalOwnerId())
      return null
    }

    renderToStaticMarkup(React.createElement(Probe, { onValue: (value) => (owner = value) }))

    // The server snapshot of `useClientReady` is false, so there is no owner
    // until hydration — that is what keeps the first client render in step
    // with the prerendered markup.
    expect(owner).toBeNull()
  })
})

describe('absolute URLs without a DOM', () => {
  it('falls back to the configured origin', async () => {
    const { absoluteUrl } = await import('../../src/seo/site')
    expect(absoluteUrl('/about')).toMatch(/^\S+\/about$/)
  })
})

describe('the component gallery without a DOM', () => {
  it('renders its placeholders while the client has not hydrated', async () => {
    const React = await import('react')
    const { renderToStaticMarkup } = await import('react-dom/server')
    const { StaticRouter } = await import('react-router-dom')
    const { default: UiElements } = await import('../../src/pages/UiElements')

    const html = renderToStaticMarkup(
      React.createElement(StaticRouter, { location: '/ui-elements' }, React.createElement(UiElements)),
    )

    // The streak and the heatmap are drawn from browser state, so the server
    // renders a placeholder in their place.
    expect(html).toContain('animate-pulse')
  })
})

describe('the score card without a DOM', () => {
  it('renders with motion allowed, because there is no preference to read', async () => {
    const React = await import('react')
    const { renderToStaticMarkup } = await import('react-dom/server')
    const { HeroScoreCard } = await import('../../src/components/ui/HeroScoreCard')

    const html = renderToStaticMarkup(React.createElement(HeroScoreCard))

    expect(html).toBeTruthy()
  })
})

describe('the recorder without a DOM', () => {
  it('reports no microphone support', async () => {
    const { isRecordingSupported } = await import('../../src/lib/recorder')
    expect(isRecordingSupported()).toBe(false)
  })

  it('reports no speech recognition support', async () => {
    const { isSpeechRecognitionSupported } = await import('../../src/lib/recorder')
    expect(isSpeechRecognitionSupported()).toBe(false)
  })

  it('cannot start without a window', async () => {
    const { VoiceRecorder } = await import('../../src/lib/recorder')
    const errors: string[] = []
    const recorder = new VoiceRecorder({ onError: (message) => errors.push(message) })

    await recorder.start()

    expect(errors.length).toBeGreaterThan(0)
  })
})
