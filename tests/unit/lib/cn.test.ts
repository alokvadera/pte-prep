import { describe, expect, it } from 'vitest'
import { cn } from '../../../src/lib/cn'

/* ---------------------------------------------------------------------------
   Class name assembly.

   Components build their class lists from conditionals, and the same utility
   class often arrives twice from different places. clsx flattens the
   conditionals, and tailwind-merge then keeps the last of two conflicting
   Tailwind utilities, so a component can override a parent's class without
   having to know the parent's class list.
   --------------------------------------------------------------------------- */

describe('assembling class names', () => {
  it('returns an empty string when there is nothing to join', () => {
    expect(cn()).toBe('')
  })

  it('joins the classes it is given', () => {
    expect(cn('flex', 'items-center')).toBe('flex items-center')
  })

  it('drops the classes whose condition was false', () => {
    const hidden = false
    expect(cn('p-2', hidden && 'p-4', undefined, null)).toBe('p-2')
  })

  it('takes the classes out of an array and an object', () => {
    expect(cn(['a', 'b'], { c: true, d: false })).toBe('a b c')
  })

  it('keeps the last of two conflicting padding utilities', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('keeps the last of two conflicting text colours', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('keeps utilities that do not conflict with each other', () => {
    expect(cn('px-2', 'py-4')).toBe('px-2 py-4')
  })

  it('keeps a shorthand alongside a utility it does not conflict with', () => {
    expect(cn('m-2', 'mx-4')).toBe('m-2 mx-4')
  })
})
