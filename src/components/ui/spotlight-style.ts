import type { CSSProperties } from 'react'

/* The glow's position is read off custom properties, so the inline style is a
   static string — no per-frame React work. It sits beside SpotlightCard rather
   than inside it so that file exports nothing but a component and stays
   hot-reloadable. */

export function spotlightStyle(color: string, size = 260): CSSProperties {
  return {
    background: `radial-gradient(${size}px circle at var(--sp-x, 50%) var(--sp-y, 50%), ${color}, transparent 70%)`,
  } as CSSProperties
}
