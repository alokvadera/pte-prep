import React from 'react'
import { cn } from '../../lib/cn'

/* ---------------------------------------------------------------------------
   OrbitingCircles (from Magic UI).

   A collection of elements that move in a smooth, continuous circular
   orbit around a central origin using GPU-accelerated CSS transforms.
--------------------------------------------------------------------------- */

export interface OrbitingCirclesProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  children?: React.ReactNode
  reverse?: boolean
  duration?: number
  /** Delay before the orbit starts, in seconds. */
  delay?: number
  radius?: number
  path?: boolean
  iconSize?: number
  speed?: number
}

export function OrbitingCircles({
  className,
  children,
  reverse,
  duration = 20,
  delay = 0,
  radius = 160,
  path = true,
  iconSize = 32,
  speed = 1,
  style,
  ...props
}: OrbitingCirclesProps) {
  const calculatedDuration = duration / speed
  return (
    <>
      {path && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          version="1.1"
          className="pointer-events-none absolute inset-0 size-full"
        >
          <circle
            className="stroke-ink-900/10 stroke-1 dark:stroke-white/10"
            cx="50%"
            cy="50%"
            r={radius}
            fill="none"
          />
        </svg>
      )}
      {React.Children.map(children, (child, index) => {
        const count = React.Children.count(children)
        /* v8 ignore next -- the callback only runs when there are children */
        const angle = (360 / (count || 1)) * index
        return (
          <div
            style={
              {
                '--duration': calculatedDuration,
                '--radius': radius,
                '--angle': angle,
                '--icon-size': `${iconSize}px`,
                // The caller's own style is merged in, not written over:
                // a style prop that replaced the custom properties would
                // stop the orbit dead.
                ...style,
                ...(delay ? { animationDelay: `${delay}s` } : {}),
              } as React.CSSProperties
            }
            className={cn(
              'animate-orbit absolute flex size-(--icon-size) transform-gpu items-center justify-center rounded-full',
              reverse && '[animation-direction:reverse]',
              className,
            )}
            {...props}
          >
            {child}
          </div>
        )
      })}
    </>
  )
}
