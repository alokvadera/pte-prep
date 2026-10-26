import { useState, useRef, useCallback, useEffect } from 'react'
import { cn } from '../../lib/cn'
import { usePrefersReducedMotion } from '../../lib/motion'
import { RenderType } from './render-type'
import { CountUp } from './motion'
import { ConfettiBurst } from './confetti'

/* ---------------------------------------------------------------------------
   HeroScoreCard.

   Landing-page sample score card. The figures and replay controls are decorative
   examples, not a test result or an official Pearson simulation.
--------------------------------------------------------------------------- */

interface ScoreProfile {
  label: string
  cefrColor: string
  cefrShadow: string
  overall: number
  speaking: number
  writing: number
  readingListening: number
}

const SCORE_PRESETS: ScoreProfile[] = [
  {
    label: 'Sample profile 76',
    cefrColor: '#FF7EB6',
    cefrShadow: '#E85B9B',
    overall: 76,
    speaking: 71,
    writing: 79,
    readingListening: 77,
  },
  {
    label: 'Sample profile 83',
    cefrColor: '#8B5CF6',
    cefrShadow: '#6D28D9',
    overall: 83,
    speaking: 85,
    writing: 82,
    readingListening: 81,
  },
  {
    label: 'Sample profile 88',
    cefrColor: '#2EB88A',
    cefrShadow: '#1D7A5B',
    overall: 88,
    speaking: 90,
    writing: 87,
    readingListening: 88,
  },
  {
    label: 'Sample profile 66',
    cefrColor: '#F59E0B',
    cefrShadow: '#D97706',
    overall: 66,
    speaking: 68,
    writing: 65,
    readingListening: 66,
  },
]

const MASCOT_THOUGHTS = [
  'Keep practising 🚀',
  'One step at a time ⚡',
  'Looking sharp! ✨',
  'You have got this! 🎯',
  'Try another sample 👇',
  'Keep up the good work! 🏆',
]

/* The pop is played on a context the card owns. Chrome caps how many audio
   contexts can exist at once (six), so a context per click exhausts the cap
   after a handful of taps and the pop never plays again. One context is
   created on first use, resumed when the browser has suspended it, and then
   kept. */
function playTactilePop(ctx: AudioContext | null) {
  try {
    if (!ctx) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(540, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.07)
    gain.gain.setValueAtTime(0.04, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.08)
  } catch {
    // AudioContext blocked or unsupported, silently ignore
  }
}

export function HeroScoreCard({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Preset index for the illustrative sample scores.
  const [presetIndex, setPresetIndex] = useState(0)
  const [confettiFire, setConfettiFire] = useState(false)

  // Interactive Mascot state
  const [isMascotHovered, setIsMascotHovered] = useState(false)
  const [mascotBounce, setMascotBounce] = useState(false)
  const [thoughtIndex, setThoughtIndex] = useState(0)
  const [showThought, setShowThought] = useState(false)

  // 3D Card Tilt state
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 })
  const [isCardHovered, setIsCardHovered] = useState(false)

  // Hovered skill row for interactive equalizer affordance
  const [hoveredSkill, setHoveredSkill] = useState<string | null>(null)

  // Decorative score replay state
  const [isSimulating, setIsSimulating] = useState(false)

  // Reduced motion preference. The hook is given a server snapshot, so the
  // server's render and the first render during hydration agree; the
  // preference is applied straight afterwards. Reading the media query
  // during render would give a reduced-motion visitor different markup from
  // the server's, and break hydration on the prerendered home page.
  const reducedMotion = usePrefersReducedMotion()

  // Every timer this card schedules, keyed by the job it does. A second
  // click replaces the pending timer for the same job instead of stacking
  // another one on top of it, and an unmount clears the lot — so no
  // setState ever lands on a card that is no longer there.
  const timers = useRef<Record<string, number>>({})

  // The card's own audio context, created on first use and reused after that.
  const audioContextRef = useRef<AudioContext | null>(null)
  const getAudioContext = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined') return null
    const scope = window as unknown as {
      AudioContext?: typeof AudioContext
      webkitAudioContext?: typeof AudioContext
    }
    const Ctor = scope.AudioContext ?? scope.webkitAudioContext
    if (!Ctor) return null
    if (!audioContextRef.current) audioContextRef.current = new Ctor()
    if (audioContextRef.current.state === 'suspended') void audioContextRef.current.resume()
    return audioContextRef.current
  }, [])

  const schedule = useCallback((key: string, fn: () => void, delay: number) => {
    const pending = timers.current[key]
    if (pending !== undefined) window.clearTimeout(pending)
    timers.current[key] = window.setTimeout(() => {
      delete timers.current[key]
      fn()
    }, delay)
  }, [])

  useEffect(() => {
    const pending = timers.current
    return () => {
      for (const id of Object.values(pending)) window.clearTimeout(id)
      for (const key of Object.keys(pending)) delete pending[key]
    }
  }, [])

  // Mascot click interaction: squish bounce, thought bubble, sound, sparkles
  const handleMascotClick = useCallback(() => {
    playTactilePop(getAudioContext())
    setMascotBounce(true)
    setShowThought(true)
    setThoughtIndex((prev) => (prev + 1) % MASCOT_THOUGHTS.length)
    setConfettiFire(true)

    schedule('bounce', () => setMascotBounce(false), 500)
    schedule('confetti', () => setConfettiFire(false), 80)
    schedule('thought', () => setShowThought(false), 2400)
  }, [schedule, getAudioContext])

  // Cycle illustrative sample profile
  const handleCyclePreset = useCallback(() => {
    playTactilePop(getAudioContext())
    setPresetIndex((prev) => (prev + 1) % SCORE_PRESETS.length)
    setConfettiFire(true)
    schedule('confetti', () => setConfettiFire(false), 80)

    // Mascot cheers
    setMascotBounce(true)
    schedule('bounce', () => setMascotBounce(false), 450)
  }, [schedule, getAudioContext])

  // Replay the decorative score animation
  const handleSimulate = useCallback(() => {
    playTactilePop(getAudioContext())
    setIsSimulating(true)
    schedule(
      'simulate',
      () => {
        setIsSimulating(false)
        setConfettiFire(true)
        schedule('confetti', () => setConfettiFire(false), 80)
      },
      1100,
    )
  }, [schedule, getAudioContext])

  /* v8 ignore next -- the preset index is always inside the table */
  const current = SCORE_PRESETS[presetIndex] ?? SCORE_PRESETS[0]!

  // Dynamic SVG dial math:
  // Semicircle from (8, 46) to (78, 46) around center (43, 46) with R = 35.
  // Fraction f is mapped from score range [10, 90]
  const targetScore = isSimulating ? 90 : current.overall
  const scoreFraction = Math.max(0, Math.min(1, (targetScore - 10) / 80))
  const arcTotalLength = Math.PI * 35 // ~109.96
  const strokeOffset = arcTotalLength * (1 - scoreFraction)
  const angleRad = Math.PI * (1 - scoreFraction)
  const dotX = 43 + 35 * Math.cos(angleRad)
  const dotY = 46 - 35 * Math.sin(angleRad)

  return (
    <div
      ref={containerRef}
      className={cn('relative mx-auto w-full max-w-md pb-5 [perspective:1200px]', className)}
      onPointerEnter={() => setIsCardHovered(true)}
      onPointerLeave={() => {
        setIsCardHovered(false)
        setTilt({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 })
      }}
      onPointerMove={(e) => {
        if (reducedMotion || !containerRef.current) return
        const cRect = containerRef.current.getBoundingClientRect()
        const nx = (e.clientX - cRect.left) / cRect.width
        const ny = (e.clientY - cRect.top) / cRect.height
        const rY = (nx - 0.5) * 11
        const rX = -(ny - 0.5) * 11
        setTilt({
          rotateX: rX,
          rotateY: rY,
          glareX: nx * 100,
          glareY: ny * 100,
        })
      }}
    >
      <ConfettiBurst fire={confettiFire} count={32} />

      {/* Mascot — The living candy companion */}
      <div
        onClick={handleMascotClick}
        onMouseEnter={() => {
          setIsMascotHovered(true)
          setShowThought(true)
        }}
        onMouseLeave={() => {
          setIsMascotHovered(false)
          setShowThought(false)
        }}
        role="button"
        tabIndex={0}
        aria-label="PTE Mascot companion — click for celebration"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleMascotClick()
          }
        }}
        className={cn(
          'absolute -left-8 -top-9 z-30 hidden sm:block cursor-pointer select-none outline-none focus-visible:ring-4 focus-visible:ring-brand-400 rounded-full',
          !reducedMotion && 'transition-transform duration-300 ease-out',
          mascotBounce && 'scale-110 -rotate-6',
        )}
        style={{
          transform:
            !reducedMotion && isCardHovered
              ? `translateZ(65px) rotate(${tilt.rotateY * 0.8}deg)`
              : undefined,
        }}
      >
        {/* Thought / speech bubble */}
        {showThought && (
          <div
            className="pointer-events-none absolute -top-11 -left-2 z-40 whitespace-nowrap rounded-full bg-white px-3.5 py-1 text-[11px] font-black text-ink-900 shadow-lift-md border border-ink-200 dark:bg-ink-850 dark:text-white dark:border-white/10 animate-modal-enter"
            aria-live="polite"
          >
            {MASCOT_THOUGHTS[thoughtIndex]}
            <span
              className="absolute -bottom-1.5 left-7 size-2.5 rotate-45 bg-white border-r border-b border-ink-200 dark:bg-ink-850 dark:border-white/10"
              aria-hidden="true"
            />
          </div>
        )}

        {/* Mascot Face Body */}
        <div
          className={cn(
            'relative flex size-24 items-center justify-center rounded-full bg-[#FF9F1C] shadow-[0_8px_0_#DB7B06] dark:shadow-[0_4px_22px_rgba(255,159,28,0.4),0_6px_0_#DB7B06] transition-all duration-300',
            isMascotHovered &&
              'scale-105 shadow-[0_10px_0_#DB7B06] dark:shadow-[0_6px_28px_rgba(255,159,28,0.55),0_8px_0_#DB7B06]',
          )}
        >
          {/* Eyes. The right eye winks on hover — the one
              expression the candidate triggers. */}
          <span className="absolute left-[26px] top-8 flex gap-[22px]">
            {/* Left Eye */}
            <span className="h-[14px] w-[11px] rounded-full bg-ink-900" />
            {/* Right Eye (winks on hover!) */}
            {isMascotHovered ? (
              <span className="relative h-[14px] w-[11px] flex items-center justify-center">
                <span className="h-1.5 w-3 -rotate-6 border-b-[3.5px] border-ink-900 rounded-b-full" />
              </span>
            ) : (
              <span className="h-[14px] w-[11px] rounded-full bg-ink-900" />
            )}
          </span>

          {/* Rosy Blush Cheeks (pulse on hover) */}
          <span
            className={cn(
              'absolute left-4 top-[54px] h-[9px] w-[14px] rounded-full bg-[rgba(255,126,182,0.85)] transition-all duration-300',
              isMascotHovered &&
                'scale-125 bg-[rgba(255,126,182,1)] drop-shadow-[0_0_8px_rgba(255,126,182,0.8)]',
            )}
          />
          <span
            className={cn(
              'absolute right-4 top-[54px] h-[9px] w-[14px] rounded-full bg-[rgba(255,126,182,0.85)] transition-all duration-300',
              isMascotHovered &&
                'scale-125 bg-[rgba(255,126,182,1)] drop-shadow-[0_0_8px_rgba(255,126,182,0.8)]',
            )}
          />

          {/* Smile — expands into joyful grin on hover/click */}
          {isMascotHovered || mascotBounce ? (
            <span className="absolute left-[29px] top-[50px] h-5 w-[38px] rounded-b-full bg-ink-900 overflow-hidden flex items-end justify-center pb-0.5">
              <span className="h-2 w-4 rounded-t-full bg-[#FF7EB6]" />
            </span>
          ) : (
            <span className="absolute left-7 top-[52px] h-5 w-10 rounded-b-[40px] border-b-[6px] border-b-ink-900" />
          )}
        </div>
      </div>

      {/* Main Score Card Surface with 3D Parallax */}
      <div
        className={cn(
          'lift relative mx-auto max-w-[390px] w-full rounded-[24px] border-2 border-ink-200 bg-white p-[26px] shadow-[0_10px_0_rgba(139,92,246,0.22),0_24px_40px_rgba(45,42,94,0.10)] dark:border-white/10 dark:bg-ink-850 select-none overflow-visible',
          !reducedMotion && 'transition-transform duration-160 ease-out',
        )}
        style={{
          transform:
            !reducedMotion && isCardHovered
              ? `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale3d(1.015, 1.015, 1.015)`
              : undefined,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Specular glass reflection sheen layer */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[22px] transition-opacity duration-300"
          style={{
            background:
              isCardHovered && !reducedMotion
                ? `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255, 255, 255, 0.14) 0%, transparent 60%)`
                : undefined,
          }}
        />

        {/* Card Header Row */}
        <div className="flex items-center justify-between pl-14 sm:pl-16">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-mint-500 animate-pulse" aria-hidden="true" />
              <button
                type="button"
                onClick={handleSimulate}
                title="Replay the sample score animation"
                className="text-left text-ink-500 dark:text-ink-on-dark-muted text-xs font-bold uppercase tracking-wider hover:text-brand-600 dark:hover:text-brand-300 transition-colors cursor-pointer group flex items-center gap-1.5"
              >
                <span>Sample score · Practice view</span>
                <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity text-mint-700 font-mono">
                  [Replay]
                </span>
              </button>
            </div>
            <RenderType
              text={[
                'Illustrative score breakdown',
                'Speaking, writing, reading & listening',
                'Pearson 10–90 score scale',
              ]}
              speed={38}
              holdDuration={2600}
              className="mt-0.5 text-[11px] text-ink-500 dark:text-ink-on-dark-muted font-medium"
              cursorClassName="bg-mint-500 dark:bg-mint-400 h-[10px]"
            />
          </div>
        </div>

        {/* Score Dial & Overall Score Row */}
        <div
          onClick={handleSimulate}
          role="button"
          tabIndex={0}
          title="Replay sample score animation"
          onKeyDown={(e) => {
            if (e.key !== 'Enter' && e.key !== ' ') return
            // Space scrolls the page out from under the card.
            e.preventDefault()
            handleSimulate()
          }}
          className="mt-4 flex items-center gap-4 cursor-pointer group rounded-xl p-1 -m-1 transition-colors hover:bg-ink-100/50 dark:hover:bg-white/5"
        >
          {/* Animated SVG Semicircular Gauge */}
          <div className="relative shrink-0">
            <svg
              width="86"
              height="52"
              viewBox="0 0 86 52"
              role="img"
              aria-label={`Score dial reading ${current.overall} out of 90`}
              className="shrink-0"
            >
              {/* Background Track */}
              <path
                d="M8 46 A35 35 0 0 1 78 46"
                fill="none"
                className="stroke-ink-100 dark:stroke-white/10"
                strokeWidth="11"
                strokeLinecap="round"
              />
              {/* Active Score Track */}
              <path
                d="M8 46 A35 35 0 0 1 78 46"
                fill="none"
                stroke="var(--color-mark-500)"
                strokeWidth="11"
                strokeLinecap="round"
                strokeDasharray={arcTotalLength}
                strokeDashoffset={strokeOffset}
                className="transition-[stroke-dashoffset] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
              />
              {/* Glowing Marker Dot */}
              <circle
                cx={dotX}
                cy={dotY}
                r="6"
                className="fill-ink-900 dark:fill-white transition-[cx,cy] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]"
              />
            </svg>
          </div>

          <div>
            <div className="font-display text-ink-900 dark:text-ink-50 text-4xl leading-none font-extrabold flex items-baseline gap-1">
              <CountUp key={current.overall} value={current.overall} duration={500} />
              <span className="text-xs text-ink-500 dark:text-ink-on-dark-faint font-semibold">
                / 90
              </span>
            </div>
            <div className="text-ink-500 dark:text-ink-on-dark-muted mt-1 text-xs font-bold flex items-center gap-1.5">
              <span>Overall, 10 to 90 scale</span>
              <span className="text-[10px] text-mint-700 dark:text-mint-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                ↻
              </span>
            </div>
          </div>
        </div>

        {/* Three Communicative Skill Bars with Live Affordances */}
        <ul className="mt-5 grid gap-2.5">
          {/* Speaking */}
          <li
            onMouseEnter={() => setHoveredSkill('speaking')}
            onMouseLeave={() => setHoveredSkill(null)}
            className={cn(
              'bg-ink-100/70 dark:bg-white/5 flex flex-col gap-1.5 rounded-xl px-3.5 py-2.5 text-sm font-bold transition-all duration-200',
              hoveredSkill === 'speaking' &&
                'bg-ink-200/70 dark:bg-white/10 ring-1 ring-mint-500/40',
            )}
          >
            <div className="flex items-center gap-2.5">
              <span className="bg-mint-500 size-2.5 rounded-full shrink-0" aria-hidden="true" />
              <span>Speaking</span>

              {/* Animated audio equalizer micro-indicator */}
              <span
                className={cn(
                  'flex items-end gap-0.5 h-3 transition-opacity duration-200',
                  hoveredSkill === 'speaking' ? 'opacity-100' : 'opacity-0',
                )}
                aria-hidden="true"
              >
                <span className="w-0.5 bg-mint-500 rounded-full animate-bounce [animation-delay:0ms] h-2.5" />
                <span className="w-0.5 bg-mint-500 rounded-full animate-bounce [animation-delay:150ms] h-3.5" />
                <span className="w-0.5 bg-mint-500 rounded-full animate-bounce [animation-delay:300ms] h-2" />
              </span>

              <span className="ml-auto font-mono text-xs tabular-nums text-ink-700 dark:text-ink-200">
                {current.speaking} / 90
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-ink-200/60 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-mint-500 transition-[width] duration-450 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{ width: `${(current.speaking / 90) * 100}%` }}
              />
            </div>
          </li>

          {/* Writing */}
          <li
            onMouseEnter={() => setHoveredSkill('writing')}
            onMouseLeave={() => setHoveredSkill(null)}
            className={cn(
              'bg-ink-100/70 dark:bg-white/5 flex flex-col gap-1.5 rounded-xl px-3.5 py-2.5 text-sm font-bold transition-all duration-200',
              hoveredSkill === 'writing' &&
                'bg-ink-200/70 dark:bg-white/10 ring-1 ring-mark-500/40',
            )}
          >
            <div className="flex items-center gap-2.5">
              <span className="bg-mark-500 size-2.5 rounded-full shrink-0" aria-hidden="true" />
              <span>Writing</span>

              {/* Typing cursor micro-indicator */}
              <span
                className={cn(
                  'text-[10px] text-mark-600 dark:text-mark-300 font-mono transition-opacity duration-200',
                  hoveredSkill === 'writing' ? 'opacity-100' : 'opacity-0',
                )}
                aria-hidden="true"
              >
                essay graded ⌨
              </span>

              <span className="ml-auto font-mono text-xs tabular-nums text-ink-700 dark:text-ink-200">
                {current.writing} / 90
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-ink-200/60 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-mark-500 transition-[width] duration-450 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{ width: `${(current.writing / 90) * 100}%` }}
              />
            </div>
          </li>

          {/* Reading & Listening */}
          <li
            onMouseEnter={() => setHoveredSkill('reading')}
            onMouseLeave={() => setHoveredSkill(null)}
            className={cn(
              'bg-ink-100/70 dark:bg-white/5 flex flex-col gap-1.5 rounded-xl px-3.5 py-2.5 text-sm font-bold transition-all duration-200',
              hoveredSkill === 'reading' &&
                'bg-ink-200/70 dark:bg-white/10 ring-1 ring-amber-400/40',
            )}
          >
            <div className="flex items-center gap-2.5">
              <span className="bg-amber-400 size-2.5 rounded-full shrink-0" aria-hidden="true" />
              <span>Reading &amp; Listening</span>

              {/* Audio wave micro-indicator */}
              <span
                className={cn(
                  'text-[10px] text-amber-600 dark:text-amber-300 font-mono transition-opacity duration-200',
                  hoveredSkill === 'reading' ? 'opacity-100' : 'opacity-0',
                )}
                aria-hidden="true"
              >
                integrated 🎧
              </span>

              <span className="ml-auto font-mono text-xs tabular-nums text-ink-700 dark:text-ink-200">
                {current.readingListening} / 90
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-ink-200/60 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-400 transition-[width] duration-450 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{ width: `${(current.readingListening / 90) * 100}%` }}
              />
            </div>
          </li>
        </ul>

        {/* Floating CEFR Badge — Interactive Target Switcher */}
        <button
          type="button"
          onClick={handleCyclePreset}
          title="Click to cycle illustrative sample profiles"
          aria-label={`${current.label}. Click to switch sample profile`}
          className={cn(
            'text-ink-900 absolute -bottom-3.5 -right-2 z-20 rounded-full px-4 py-2 text-[13.5px] font-extrabold select-none cursor-pointer outline-none focus-visible:ring-4 focus-visible:ring-brand-400 -rotate-2 active:translate-y-1 active:shadow-none transition-all duration-200 hover:scale-105 group',
          )}
          style={{
            backgroundColor: current.cefrColor,
            boxShadow: `0 5px 0 ${current.cefrShadow}`,
            transform:
              !reducedMotion && isCardHovered ? `translateZ(48px) rotate(-2deg)` : undefined,
          }}
        >
          <span className="flex items-center gap-1.5">
            <span>{current.label}</span>
            <span
              className="text-[11px] opacity-70 group-hover:opacity-100 transition-opacity font-mono"
              aria-hidden="true"
            >
              ↻
            </span>
          </span>
        </button>
      </div>
    </div>
  )
}
