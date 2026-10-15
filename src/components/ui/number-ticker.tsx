import { useEffect, useRef, type ComponentPropsWithoutRef } from 'react'
import { useInView, useMotionValue, useSpring } from 'motion/react'
import { cn } from '../../lib/cn'
import { prefersReducedMotion } from '../../lib/motion'
import { useClientReady } from '../../lib/useClientReady'

/* ---------------------------------------------------------------------------
   NumberTicker (from Magic UI).

   Spring-physics driven numerical counter using motion/react.
   Animates numbers smoothly upon scrolling into viewport.
--------------------------------------------------------------------------- */

interface NumberTickerProps extends ComponentPropsWithoutRef<'span'> {
  value: number
  startValue?: number
  direction?: 'up' | 'down'
  delay?: number
  decimalPlaces?: number
}

export function NumberTicker({
  value,
  startValue = 0,
  direction = 'up',
  delay = 0,
  className,
  decimalPlaces = 0,
  ...props
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const mounted = useClientReady()
  const motionValue = useMotionValue(direction === 'down' ? value : startValue)
  const springValue = useSpring(motionValue, {
    damping: 60,
    stiffness: 100,
  })
  const isInView = useInView(ref, { once: true, margin: '0px' })

  useEffect(() => {
    if (!mounted || prefersReducedMotion()) return

    let timer: ReturnType<typeof setTimeout> | null = null

    if (isInView) {
      timer = setTimeout(() => {
        motionValue.set(direction === 'down' ? startValue : value)
      }, delay * 1000)
    }

    return () => {
      if (timer !== null) {
        clearTimeout(timer)
      }
    }
  }, [mounted, motionValue, isInView, delay, value, direction, startValue])

  useEffect(() => {
    if (!mounted || prefersReducedMotion()) return

    return springValue.on('change', (latest) => {
      if (ref.current) {
        ref.current.textContent = Intl.NumberFormat('en-US', {
          minimumFractionDigits: decimalPlaces,
          maximumFractionDigits: decimalPlaces,
        }).format(Number(latest.toFixed(decimalPlaces)))
      }
    })
  }, [mounted, springValue, decimalPlaces])

  return (
    <span
      ref={ref}
      className={cn('inline-block tracking-tight tabular-nums font-mono', className)}
      {...props}
    >
      {/* Resolved value for SSR / no-JS, startValue once client animates */}
      {mounted && !prefersReducedMotion() ? startValue : value}
    </span>
  )
}
