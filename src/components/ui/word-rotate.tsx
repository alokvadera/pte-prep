import { useEffect, useRef, useState } from 'react'
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
  // The words are read through a ref: a caller that passes an inline array
  // literal would otherwise hand the effect a new array on every render,
  // and the interval would be torn down and started again each time.
  const wordsRef = useRef(words)
  useEffect(() => {
    wordsRef.current = words
  }, [words])

  useEffect(() => {
    const count = wordsRef.current.length
    if (prefersReducedMotion() || count <= 1) return

    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % count)
    }, duration)

    return () => clearInterval(interval)
  }, [words.length, duration])

  const currentWord = words[index % (words.length || 1)] ?? ''

  return (
    <span className="inline-block overflow-hidden py-1 align-baseline">
      <AnimatePresence mode="wait">
        <motion.span key={currentWord} className={cn('inline-block', className)} {...motionProps}>
          {currentWord}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}
