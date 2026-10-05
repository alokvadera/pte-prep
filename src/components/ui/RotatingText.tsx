import { useEffect, useState } from 'react'

interface RotatingTextProps {
  words: string[]
  interval?: number
  className?: string
}

export function RotatingText({ words, interval = 2800, className = '' }: RotatingTextProps) {
  const [index, setIndex] = useState(0)
  const [fadeState, setFadeState] = useState<'enter' | 'exit'>('enter')

  useEffect(() => {
    const timer = setInterval(() => {
      setFadeState('exit')
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % words.length)
        setFadeState('enter')
      }, 300)
    }, interval)

    return () => clearInterval(timer)
  }, [words.length, interval])

  return (
    <span
      className={`inline-block transition-all duration-300 transform ${
        fadeState === 'enter'
          ? 'opacity-100 translate-y-0 filter-none'
          : 'opacity-0 -translate-y-2 blur-[2px]'
      } ${className}`}
    >
      {words[index]}
    </span>
  )
}
