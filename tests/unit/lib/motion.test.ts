import { describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { setMedia } from '../../setup/browser-env'
import {
  prefersReducedMotion,
  scrollBehavior,
  usePrefersReducedMotion,
} from '../../../src/lib/motion'

/* ---------------------------------------------------------------------------
   Motion preferences.

   The stylesheet already neutralises animations for visitors who have asked
   for reduced motion, but a scripted scroll asks the browser for smooth
   scrolling directly and so sails past that reset. Every scripted scroll goes
   through scrollBehavior() instead, which asks this module.
   --------------------------------------------------------------------------- */

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

describe('reading the motion preference', () => {
  it('reports no preference when the visitor has not asked for reduced motion', () => {
    setMedia(REDUCED_MOTION, false)
    expect(prefersReducedMotion()).toBe(false)
  })

  it('reports the preference when the visitor has asked for reduced motion', () => {
    setMedia(REDUCED_MOTION, true)
    expect(prefersReducedMotion()).toBe(true)
  })

  it('reports no preference when the browser cannot answer media queries', () => {
    vi.stubGlobal('matchMedia', undefined)
    expect(prefersReducedMotion()).toBe(false)
  })
})

describe('choosing a scroll behaviour', () => {
  it('scrolls smoothly for a visitor who has not asked for reduced motion', () => {
    setMedia(REDUCED_MOTION, false)
    expect(scrollBehavior()).toBe('smooth')
  })

  it('scrolls instantly for a visitor who has asked for reduced motion', () => {
    setMedia(REDUCED_MOTION, true)
    expect(scrollBehavior()).toBe('auto')
  })
})

describe('the reduced-motion hook', () => {
  it('reports the preference to a component', () => {
    setMedia(REDUCED_MOTION, true)
    const { result } = renderHook(() => usePrefersReducedMotion())
    expect(result.current).toBe(true)
  })

  it('follows the preference when it changes', () => {
    setMedia(REDUCED_MOTION, false)
    const { result } = renderHook(() => usePrefersReducedMotion())
    expect(result.current).toBe(false)
    act(() => setMedia(REDUCED_MOTION, true))
    expect(result.current).toBe(true)
  })

  it('reports no preference when the browser cannot answer media queries', () => {
    vi.stubGlobal('matchMedia', undefined)
    const { result } = renderHook(() => usePrefersReducedMotion())
    expect(result.current).toBe(false)
    vi.unstubAllGlobals()
  })
})
