import { useEffect, useState } from 'react'
import { ButtonLink } from './primitives'
import { cn } from '../../lib/cn'

/* ---------------------------------------------------------------------------
   StickyCTA.

   The landing page's quiet closer: once
   the hero has scrolled away, a pill
   rises from the bottom edge carrying
   the single action the page exists for.
   It bows out again when the footer
   arrives, so it never competes with the
   final band. Hidden from the
   accessibility tree while away.
--------------------------------------------------------------------------- */

export function StickyCTA({
  to,
  label,
  note = 'Free · no account',
  showAfter = 600,
  className,
}: {
  to: string
  label: string
  note?: string
  showAfter?: number
  className?: string
}) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      let visible = window.scrollY > showAfter
      if (visible) {
        const bottomSection = document.querySelector('.cta-band, footer')
        if (bottomSection) {
          const rect = bottomSection.getBoundingClientRect()
          if (rect.top < window.innerHeight) visible = false
        }
      }
      setShow(visible)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [showAfter])

  return (
    <div className={cn('sticky-cta', show && 'sticky-cta-on', className)} aria-hidden={!show}>
      <ButtonLink to={to} size="lg" tabIndex={show ? 0 : -1}>
        {label}
      </ButtonLink>
      <span className="sticky-cta-note">{note}</span>
    </div>
  )
}
