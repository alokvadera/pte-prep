/* One place to ask whether the visitor wants to be moved, and one place to
   decide how a scripted scroll should behave.

   The blanket reset in index.css already neutralises animations and
   transitions under prefers-reduced-motion — but a *scripted* scroll calls
   scrollIntoView({ behavior: 'smooth' }) and asks the browser for smooth
   scrolling directly, which sails straight past that reset. Every scripted
   scroll therefore goes through scrollBehavior() instead.

   prefersReducedMotion() is re-exported so components stop each keeping
   their own copy of the same five lines. */

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/** 'smooth' for everyone who did not opt out, 'auto' for those who did. */
export function scrollBehavior(): ScrollBehavior {
  return prefersReducedMotion() ? 'auto' : 'smooth'
}
