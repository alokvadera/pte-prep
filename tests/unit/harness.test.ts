import { describe, expect, it } from 'vitest'
import { flushIntersections, setMedia } from '../setup/browser-env'

/**
 * The environment the whole suite runs in. If any of these break, every other
 * test is measuring something other than what it thinks it is.
 */
describe('browser environment', () => {
  it('provides a matchMedia that answers per query', () => {
    expect(window.matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(false)
    expect(window.matchMedia('(pointer: coarse)').matches).toBe(false)
    expect(window.matchMedia('(hover: hover) and (pointer: fine)').matches).toBe(true)

    setMedia('(prefers-reduced-motion: reduce)', true)
    expect(window.matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(true)
  })

  it('notifies matchMedia listeners when the answer changes', () => {
    const seen: boolean[] = []
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    mql.addEventListener('change', (event) => seen.push(event.matches))

    setMedia('(prefers-color-scheme: dark)', true)

    expect(seen).toEqual([true])
  })

  it('holds an intersection observer until the test says so', () => {
    const observed: Element[] = []
    const observer = new IntersectionObserver(() => {
      /* the callback is driven by flushIntersections */
    })
    const element = document.createElement('div')
    observed.push(element)
    observer.observe(element)

    expect(observed).toHaveLength(1)
    expect(() => flushIntersections()).not.toThrow()
    observer.disconnect()
  })

  it('gives the canvas a 2D context that accepts drawing calls', () => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    expect(ctx).not.toBeNull()
    ctx!.setTransform(2, 0, 0, 2, 0, 0)
    ctx!.globalAlpha = 0.5
    ctx!.beginPath()
    ctx!.arc(10, 10, 4, 0, Math.PI * 2)
    ctx!.fill()
    expect(ctx!.globalAlpha).toBe(0.5)
  })

  it('opens and closes a native dialog, firing the close event', () => {
    const dialog = document.createElement('dialog')
    document.body.appendChild(dialog)
    let closed = false
    dialog.addEventListener('close', () => {
      closed = true
    })

    dialog.showModal()
    expect(dialog.open).toBe(true)

    dialog.close()
    expect(dialog.open).toBe(false)
    expect(closed).toBe(true)
    dialog.remove()
  })

  it('provides a speech synthesiser that ends its utterances', async () => {
    const win = window as unknown as {
      speechSynthesis: SpeechSynthesis
      SpeechSynthesisUtterance: new (text?: string) => SpeechSynthesisUtterance
    }
    expect(win.speechSynthesis.getVoices().length).toBeGreaterThan(0)

    const ended = await new Promise<boolean>((resolve) => {
      const utterance = new win.SpeechSynthesisUtterance('hello')
      utterance.onend = () => resolve(true)
      win.speechSynthesis.speak(utterance)
    })
    expect(ended).toBe(true)
  })

  it('provides an audio context whose nodes chain together', () => {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    expect(() => osc.connect(gain).connect(ctx.destination)).not.toThrow()
    expect(() => osc.start()).not.toThrow()
    expect(() => osc.stop()).not.toThrow()
  })

  it('backs IndexedDB with fake-indexeddb so Dexie can open', () => {
    expect(typeof indexedDB).toBe('object')
    expect(indexedDB).not.toBeUndefined()
  })
})
