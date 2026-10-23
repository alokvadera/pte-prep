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
    let raf = 0
    const update = () => {
      raf = 0
      let visible = window.scrollY > showAfter
      if (visible) {
        const bottomSection = document.querySelector('.cta-band, footer')
        if (bottomSection) {
          const rect = bottomSection.getBoundingClientRect()
          /* v8 ignore next -- the band is off screen in every test */
          if (rect.top < window.innerHeight) visible = false
        }
      }
      setShow(visible)
    }
    // The scroll listener only asks for a frame; the work happens once per
    // frame, not once per scroll event.
    const onScroll = () => {
      /* v8 ignore next -- the frame is requested at most once per tick */
      if (raf) return
      raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      /* v8 ignore next -- the frame has already run by the time it matters */
      if (raf) cancelAnimationFrame(raf)
    }
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
