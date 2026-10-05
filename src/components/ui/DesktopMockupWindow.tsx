import { useState } from 'react'
import { Link } from 'react-router-dom'

export function DesktopMockupWindow() {
  const [activeTab, setActiveTab] = useState<'exam' | 'audio' | 'score'>('exam')
  const [isRecording, setIsRecording] = useState(false)

  return (
    <aside
      className="card-glow relative overflow-hidden rounded-2xl border border-ink-200/80 bg-white/90 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.1)] backdrop-blur-xl dark:border-white/10 dark:bg-ink-900/90 dark:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)]"
      aria-label="Interactive desktop application preview"
    >
      {/* macOS Window Titlebar */}
      <div className="flex h-11 items-center justify-between border-b border-ink-100 bg-ink-50/70 px-4 dark:border-white/5 dark:bg-ink-950/60">
        <div className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-[#ff5f56] border border-[#e0443e]/40 shadow-sm" />
          <span className="size-3 rounded-full bg-[#ffbd2e] border border-[#dea123]/40 shadow-sm" />
          <span className="size-3 rounded-full bg-[#27c93f] border border-[#1aab29]/40 shadow-sm" />
          <span className="ml-3 font-mono text-[11px] font-semibold text-ink-500 dark:text-ink-400">
            pte-academic-app · v2.4
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-brand-700 dark:bg-brand-400/15 dark:text-brand-300">
            <span className="size-1.5 rounded-full bg-brand-500 animate-pulse" />
            Engine Ready
          </span>
        </div>
      </div>

      {/* Segmented Control Tabs */}
      <div className="flex border-b border-ink-100 bg-ink-50/30 p-1.5 dark:border-white/5 dark:bg-ink-950/20">
        {[
          { id: 'exam', label: 'Exam Session', badge: 'Live Timer' },
          { id: 'audio', label: 'Audio AI', badge: 'Speech' },
          { id: 'score', label: 'Pearson Scale', badge: '10–90' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-1.5 text-xs font-semibold transition-all duration-200 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-white text-ink-900 shadow-sm dark:bg-ink-800 dark:text-white'
                : 'text-ink-500 hover:text-ink-800 dark:text-ink-400 dark:hover:text-ink-200'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`hidden rounded px-1.5 py-0.2 font-mono text-[10px] sm:inline-block ${
                activeTab === tab.id
                  ? 'bg-brand-500/10 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300'
                  : 'bg-ink-100 text-ink-500 dark:bg-white/5 dark:text-ink-400'
              }`}
            >
              {tab.badge}
            </span>
          </button>
        ))}
      </div>

      {/* Window Body Contents */}
      <div className="p-6">
        {activeTab === 'exam' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-ink-100 pb-3 dark:border-white/5">
              <div>
                <span className="font-mono text-[11px] font-bold text-brand-600 dark:text-brand-400">
                  PART 1 · ITEM 04 OF 28
                </span>
                <h2 className="text-ink-900 dark:text-white mt-0.5 text-base font-bold">
                  Read Aloud — Academic Lecture
                </h2>
              </div>
              <div className="text-right">
                <span className="font-mono text-xs text-ink-400">Time Left</span>
                <p className="font-mono text-sm font-bold text-ink-900 dark:text-white tabular-nums">
                  00:34
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-ink-200/80 bg-ink-50/60 p-4 font-serif text-sm leading-relaxed text-ink-800 dark:border-white/5 dark:bg-ink-950/40 dark:text-ink-200">
              "The deep-sea ecosystem encompasses a variety of unique geochemical habitats, from hydrothermal vents to cold methane seeps, fostering endemic biodiversity."
            </div>

            <div className="flex items-center justify-between gap-4 pt-1">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs text-ink-600 dark:text-ink-300 font-medium">
                  Microphone calibrated
                </span>
              </div>
              <Link
                to="/mock"
                className="btn-primary inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold"
              >
                Launch Mock →
              </Link>
            </div>
          </div>
        )}

        {activeTab === 'audio' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono text-[11px] font-bold text-brand-600 dark:text-brand-400">
                  AI SPEECH ENGINE
                </span>
                <h2 className="text-ink-900 dark:text-white text-base font-bold">
                  Oral Fluency & Acoustic Profile
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsRecording(!isRecording)}
                className={`rounded-full px-3 py-1 font-mono text-xs font-bold transition-all cursor-pointer ${
                  isRecording
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-brand-500/10 text-brand-700 hover:bg-brand-500/20 dark:bg-brand-500/20 dark:text-brand-300'
                }`}
              >
                {isRecording ? '● Live Recording' : '▶ Simulate Voice'}
              </button>
            </div>

            {/* Simulated Live Audio Waveform */}
            <div className="flex h-16 items-center justify-center gap-1 rounded-xl border border-ink-200/80 bg-ink-50/80 px-4 dark:border-white/5 dark:bg-ink-950/60">
              {[24, 45, 18, 55, 78, 92, 40, 60, 85, 30, 48, 70, 95, 62, 35, 80, 50, 25, 65, 42].map(
                (h, i) => (
                  <div
                    key={i}
                    className="w-1.5 rounded-full bg-brand-500/70 transition-all duration-150 dark:bg-brand-400"
                    style={{
                      height: isRecording ? `${Math.max(12, (h * (i % 2 === 0 ? 1.2 : 0.8)) % 100)}%` : `${h * 0.5}%`,
                      opacity: isRecording ? 0.9 : 0.4,
                    }}
                  />
                ),
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-ink-100/60 p-2 dark:bg-white/5">
                <span className="text-[10px] text-ink-500 dark:text-ink-400">Fluency</span>
                <p className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">88%</p>
              </div>
              <div className="rounded-lg bg-ink-100/60 p-2 dark:bg-white/5">
                <span className="text-[10px] text-ink-500 dark:text-ink-400">Pronunciation</span>
                <p className="font-mono text-sm font-bold text-brand-600 dark:text-brand-400">85%</p>
              </div>
              <div className="rounded-lg bg-ink-100/60 p-2 dark:bg-white/5">
                <span className="text-[10px] text-ink-500 dark:text-ink-400">Content</span>
                <p className="font-mono text-sm font-bold text-ink-900 dark:text-white">90%</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'score' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-ink-100 pb-3 dark:border-white/5">
              <div>
                <span className="font-mono text-[11px] font-bold text-brand-600 dark:text-brand-400">
                  DIAGNOSTIC REPORT
                </span>
                <h2 className="text-ink-900 dark:text-white text-base font-bold">
                  Official Concordance
                </h2>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 font-mono text-xs font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                CEFR C1 Qualified
              </span>
            </div>

            <div className="space-y-2.5">
              {[
                { skill: 'Speaking', score: 84, color: 'bg-emerald-500' },
                { skill: 'Writing', score: 86, color: 'bg-brand-500' },
                { skill: 'Reading', score: 79, color: 'bg-brand-500' },
                { skill: 'Listening', score: 83, color: 'bg-emerald-500' },
              ].map((row) => (
                <div key={row.skill} className="flex items-center gap-3 text-xs">
                  <span className="w-16 font-medium text-ink-700 dark:text-ink-300">{row.skill}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-200/70 dark:bg-white/10">
                    <div className={`h-full ${row.color}`} style={{ width: `${(row.score / 90) * 100}%` }} />
                  </div>
                  <span className="w-8 text-right font-mono font-bold text-ink-900 dark:text-white">
                    {row.score}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-center font-mono text-[11px] text-ink-500 dark:text-ink-400 pt-1">
              Aligned with Pearson PTE Academic Score Concordance 2026
            </p>
          </div>
        )}
      </div>

      {/* Mac Window Bottom Bar */}
      <div className="flex items-center justify-between border-t border-ink-100 bg-ink-50/50 px-4 py-2.5 font-mono text-[11px] text-ink-500 dark:border-white/5 dark:bg-ink-950/40 dark:text-ink-400">
        <span className="flex items-center gap-1.5">
          <kbd className="rounded border border-ink-200 bg-white px-1.5 py-0.5 text-[10px] shadow-2xs dark:border-white/10 dark:bg-ink-900">
            ⌘K
          </kbd>
          <span>Quick actions</span>
        </span>
        <span className="flex items-center gap-1">
          <kbd className="rounded border border-ink-200 bg-white px-1.5 py-0.5 text-[10px] shadow-2xs dark:border-white/10 dark:bg-ink-900">
            Space
          </kbd>
          <span>Preview audio</span>
        </span>
      </div>
    </aside>
  )
}
