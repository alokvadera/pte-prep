/* One place to ask whether the visitor wants to be moved, and one place to
   decide how a scripted scroll should behave.

   The blanket reset in index.css already neutralises animations and
   transitions under prefers-reduced-motion — but a *scripted* scroll calls
   scrollIntoView({ behavior: 'smooth' }) and asks the browser for smooth
   scrolling directly, which sails straight past that reset. Every scripted
   scroll therefore goes through scrollBehavior() instead.

   prefersReducedMotion() is re-exported so components stop each keeping
   their own copy of the same five lines. */

import { useSyncExternalStore } from 'react'

const REDUCE_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia(REDUCE_MOTION_QUERY).matches
  )
}

function subscribeToReducedMotion(onChange: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {}
  const mq = window.matchMedia(REDUCE_MOTION_QUERY)
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}

const reducedMotionServerSnapshot = () => false

/**
 * The visitor's reduced-motion preference, safe to read during render.
 *
 * `useSyncExternalStore` is given a server snapshot, so the server's render
 * and the first render during hydration agree. The preference is applied
 * straight afterwards. Reading the media query during render instead would
 * give a reduced-motion visitor different markup from the server's, and
 * break hydration on a prerendered page.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    prefersReducedMotion,
    reducedMotionServerSnapshot,
  )
}

/** 'smooth' for everyone who did not opt out, 'auto' for those who did. */
export function scrollBehavior(): ScrollBehavior {
  return prefersReducedMotion() ? 'auto' : 'smooth'
}
