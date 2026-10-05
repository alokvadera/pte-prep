import { useState } from 'react'
import { Link } from 'react-router-dom'

export function DesktopMockupWindow() {
  const [activeTab, setActiveTab] = useState<'exam' | 'audio' | 'score'>('exam')
  const [isRecording, setIsRecording] = useState(false)

  return (
    <aside
      className="relative overflow-hidden rounded-lg border border-ink-200/90 bg-white/95 shadow-[0_12px_36px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-[#0d1117]/95 dark:shadow-[0_20px_40px_rgba(0,0,0,0.5)]"
      aria-label="High-tech exam runner instrument preview"
    >
      {/* Precision Top Instrument Bar */}
      <div className="flex h-10 items-center justify-between border-b border-ink-200 bg-ink-100/70 px-3.5 dark:border-white/10 dark:bg-ink-950/80">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-ink-400 dark:text-ink-500">+</span>
          <span className="font-mono text-[11px] font-bold tracking-wider uppercase text-ink-700 dark:text-ink-200">
            INSTRUMENT // PTE-2026
          </span>
          <span className="hidden sm:inline-block font-mono text-[10px] text-ink-400 dark:text-ink-500">
            [REV 4.2]
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-sm border border-brand-500/30 bg-brand-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-brand-700 dark:border-brand-400/30 dark:bg-brand-400/10 dark:text-brand-300">
            <span className="size-1.5 rounded-full bg-brand-500 animate-pulse" />
            STANDBY // OK
          </span>
          <span className="font-mono text-xs font-bold text-ink-400 dark:text-ink-500">+</span>
        </div>
      </div>

      {/* Swiss Architectural Segmented Control Tabs */}
      <div className="grid grid-cols-3 border-b border-ink-200 bg-ink-50/50 p-1 dark:border-white/10 dark:bg-ink-950/40">
        {[
          { id: 'exam', label: 'EXAM RUNNER', code: '01' },
          { id: 'audio', label: 'SPEECH AI', code: '02' },
          { id: 'score', label: 'CONCORDANCE', code: '03' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center justify-center gap-2 rounded py-1.5 text-xs font-mono font-semibold transition-all duration-150 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-ink-900 text-white shadow-xs dark:bg-white dark:text-ink-900'
                : 'text-ink-600 hover:text-ink-900 hover:bg-ink-100 dark:text-ink-400 dark:hover:text-white dark:hover:bg-white/5'
            }`}
          >
            <span className="text-[10px] opacity-60">[{tab.code}]</span>
            <span className="text-[11px] tracking-tight">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Instrument Body */}
      <div className="p-5 sm:p-6 font-sans">
        {activeTab === 'exam' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-ink-200/80 pb-3 dark:border-white/10">
              <div>
                <span className="font-mono text-[10px] font-bold tracking-widest uppercase text-brand-600 dark:text-brand-400">
                  SECTION 01 // SPEAKING & WRITING
                </span>
                <h2 className="text-ink-900 dark:text-white mt-0.5 text-sm sm:text-base font-bold tracking-tight">
                  Item 04 · Read Aloud (Academic Corpus)
                </h2>
              </div>
              <div className="text-right">
                <span className="font-mono text-[10px] uppercase text-ink-500">Remaining</span>
                <p className="font-mono text-sm sm:text-base font-bold text-ink-900 dark:text-white tabular-nums">
                  00:34.2
                </p>
              </div>
            </div>

            <div className="rounded border border-ink-200/90 bg-ink-100/60 p-4 font-mono text-xs sm:text-sm leading-relaxed text-ink-800 dark:border-white/10 dark:bg-ink-950/60 dark:text-ink-200">
              "The deep-sea ecosystem encompasses a variety of unique geochemical habitats, from hydrothermal vents to cold methane seeps, fostering endemic biodiversity."
            </div>

            <div className="flex items-center justify-between gap-4 pt-1">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="font-mono text-[11px] text-ink-600 dark:text-ink-300">
                  MIC: CALIBRATED (48kHz)
                </span>
              </div>
              <Link
                to="/mock"
                className="btn-primary rounded px-3.5 py-1.5 font-mono text-xs font-semibold"
              >
                Execute Mock →
              </Link>
            </div>
          </div>
        )}

        {activeTab === 'audio' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-ink-200/80 pb-3 dark:border-white/10">
              <div>
                <span className="font-mono text-[10px] font-bold tracking-widest uppercase text-brand-600 dark:text-brand-400">
                  ACOUSTIC TELEMETRY // AI MODEL
                </span>
                <h2 className="text-ink-900 dark:text-white mt-0.5 text-sm sm:text-base font-bold tracking-tight">
                  Formant & Phoneme Extraction
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsRecording(!isRecording)}
                className={`rounded border px-2.5 py-1 font-mono text-xs font-bold transition-all cursor-pointer ${
                  isRecording
                    ? 'border-rose-600 bg-rose-600 text-white animate-pulse'
                    : 'border-ink-300 bg-ink-100 text-ink-800 hover:border-ink-500 dark:border-white/20 dark:bg-white/5 dark:text-white dark:hover:border-white/40'
                }`}
              >
                {isRecording ? '● SAMPLING...' : '▶ TEST RECORD'}
              </button>
            </div>

            {/* Industrial Soundwave Equalizer */}
            <div className="flex h-16 items-center justify-center gap-1 rounded border border-ink-200/80 bg-ink-100/50 px-4 dark:border-white/10 dark:bg-ink-950/60">
              {[25, 48, 20, 60, 82, 95, 45, 68, 90, 32, 52, 75, 98, 65, 38, 85, 55, 28, 70, 45].map(
                (h, i) => (
                  <div
                    key={i}
                    className="w-1.5 rounded-xs bg-ink-900 transition-all duration-100 dark:bg-white"
                    style={{
                      height: isRecording ? `${Math.max(12, (h * (i % 2 === 0 ? 1.25 : 0.75)) % 100)}%` : `${h * 0.45}%`,
                      opacity: isRecording ? 0.95 : 0.35,
                    }}
                  />
                ),
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 text-center font-mono">
              <div className="rounded border border-ink-200/80 bg-white/80 p-2 dark:border-white/10 dark:bg-ink-950/40">
                <span className="text-[10px] text-ink-500 uppercase">Fluency</span>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">88.5%</p>
              </div>
              <div className="rounded border border-ink-200/80 bg-white/80 p-2 dark:border-white/10 dark:bg-ink-950/40">
                <span className="text-[10px] text-ink-500 uppercase">Pronunciation</span>
                <p className="text-sm font-bold text-brand-600 dark:text-brand-400">85.0%</p>
              </div>
              <div className="rounded border border-ink-200/80 bg-white/80 p-2 dark:border-white/10 dark:bg-ink-950/40">
                <span className="text-[10px] text-ink-500 uppercase">Lexical Form</span>
                <p className="text-sm font-bold text-ink-900 dark:text-white">91.0%</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'score' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-ink-200/80 pb-3 dark:border-white/10">
              <div>
                <span className="font-mono text-[10px] font-bold tracking-widest uppercase text-brand-600 dark:text-brand-400">
                  OFFICIAL SCALE // PEARSON CONCORDANCE
                </span>
                <h2 className="text-ink-900 dark:text-white mt-0.5 text-sm sm:text-base font-bold tracking-tight">
                  B2 → C1 Qualification Grid
                </h2>
              </div>
              <span className="rounded border border-emerald-600/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                CEFR C1
              </span>
            </div>

            <div className="space-y-2 font-mono text-xs">
              {[
                { skill: 'SPEAKING', score: 84 },
                { skill: 'WRITING', score: 86 },
                { skill: 'READING', score: 79 },
                { skill: 'LISTENING', score: 83 },
              ].map((row) => (
                <div key={row.skill} className="flex items-center gap-3">
                  <span className="w-20 text-[11px] font-semibold text-ink-700 dark:text-ink-300">
                    {row.skill}
                  </span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-xs bg-ink-200 dark:bg-white/10">
                    <div className="h-full bg-ink-900 dark:bg-white" style={{ width: `${(row.score / 90) * 100}%` }} />
                  </div>
                  <span className="w-8 text-right font-bold text-ink-900 dark:text-white">
                    {row.score}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-center font-mono text-[10px] text-ink-500 dark:text-ink-400 pt-1">
              BENCHMARK: 10–90 CONTINUOUS SCALE · LATENCY &lt; 50ms
            </p>
          </div>
        )}
      </div>

      {/* Swiss Bottom Measurement Footer */}
      <div className="flex items-center justify-between border-t border-ink-200 bg-ink-100/60 px-3.5 py-2 font-mono text-[10px] text-ink-500 dark:border-white/10 dark:bg-ink-950/80 dark:text-ink-400">
        <span className="flex items-center gap-1.5">
          <span className="size-1 rounded-full bg-brand-500" />
          <span>WASM ENGINE: ACTIVE</span>
        </span>
        <span className="tracking-widest">
          |·····|·····|·····|
        </span>
        <span>
          PRECISION: 0.5 PT
        </span>
      </div>
    </aside>
  )
}
