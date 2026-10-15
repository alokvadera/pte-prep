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
  radius = 160,
  path = true,
  iconSize = 32,
  speed = 1,
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
        const angle = (360 / (count || 1)) * index
        return (
          <div
            style={
              {
                '--duration': calculatedDuration,
                '--radius': radius,
                '--angle': angle,
                '--icon-size': `${iconSize}px`,
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
