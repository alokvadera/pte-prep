import { useEffect, useState } from 'react'
import { AnimatePresence, motion, type MotionProps } from 'motion/react'
import { cn } from '../../lib/cn'
import { prefersReducedMotion } from '../../lib/motion'

/* ---------------------------------------------------------------------------
   WordRotate (from Magic UI).

   A smooth vertical rotation of words with staggered entry/exit transitions.
--------------------------------------------------------------------------- */

interface WordRotateProps {
  words: string[]
  duration?: number
  motionProps?: MotionProps
  className?: string
}

export function WordRotate({
  words,
  duration = 2500,
  motionProps = {
    initial: { opacity: 0, y: -16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 16 },
    transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
  },
  className,
}: WordRotateProps) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (prefersReducedMotion() || words.length <= 1) return

    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % words.length)
    }, duration)

    return () => clearInterval(interval)
  }, [words, duration])

  return (
    <span className="inline-block overflow-hidden py-1 align-baseline">
      <AnimatePresence mode="wait">
        <motion.span
          key={words[index]}
          className={cn('inline-block', className)}
          {...motionProps}
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}
