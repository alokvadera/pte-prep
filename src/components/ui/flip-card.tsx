import { useState, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

/* ---------------------------------------------------------------------------
   FlipCard.

   A card that turns over to show its
   back — the question-type cards flip
   to reveal the pro tip for that type.
   The whole card is the trigger, so no
   separate "flip" button is needed.

   It is a div, not a button, because
   the front face carries links of its
   own (the type's guide and drill) and
   a button may not contain them. The
   flip borrows clicks that land on the
   card itself; a click on a link is
   the link's. Keyboard users get a
   real button — visually hidden but
   focusable — that does the same flip.
   Turns on the spring curve so the flip
   overshoots slightly, like a card
   being flicked.
--------------------------------------------------------------------------- */

export function FlipCard({
  front,
  back,
  className,
  flipLabel = 'Flip card',
}: {
  front: ReactNode
  back: ReactNode
  className?: string
  /** Screen-reader label for the flip affordance. */
  flipLabel?: string
}) {
  const [flipped, setFlipped] = useState(false)

  return (
    <div
      className={cn('flip-card group', className)}
      onClick={(e) => {
        const targetEl = e.target instanceof Element ? e.target : (e.target as Node).parentElement
        if (targetEl?.closest('a, button, input, textarea, select')) return
        setFlipped((f) => !f)
      }}
    >
      <button
        type="button"
        className="sr-only"
        aria-pressed={flipped}
        aria-label={flipLabel}
        onClick={() => setFlipped((f) => !f)}
      >
        Flip card
      </button>
      <span className={cn('flip-inner', flipped && 'flip-inner-flipped')}>
        <span className="flip-face flip-front">{front}</span>
        <span className="flip-face flip-back">{back}</span>
      </span>
    </div>
  )
}
