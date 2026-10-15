import { type ComponentPropsWithoutRef, type CSSProperties, type FC } from 'react'
import { cn } from '../../lib/cn'

/* ---------------------------------------------------------------------------
   AnimatedShinyText (from Magic UI).

   A light glare effect that pans across text making it appear shimmering.
--------------------------------------------------------------------------- */

export interface AnimatedShinyTextProps extends ComponentPropsWithoutRef<'span'> {
  shimmerWidth?: number
}

export const AnimatedShinyText: FC<AnimatedShinyTextProps> = ({
  children,
  className,
  shimmerWidth = 100,
  style,
  ...props
}) => {
  return (
    <span
      style={{
        '--shiny-width': `${shimmerWidth}px`,
        ...style,
      } as CSSProperties}
      className={cn(
        'mx-auto inline-block max-w-md text-ink-600 dark:text-ink-on-dark-muted',
        'animate-shiny-text bg-clip-text bg-no-repeat [background-size:var(--shiny-width)_100%]',
        'bg-gradient-to-r from-transparent via-brand-600 via-50% to-transparent dark:via-brand-300',
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
