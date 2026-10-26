import fs from 'fs'

let tsx = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8')

// Replace the stats grid area. We will search for:
// <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
// up to:
// </Card>
// but there are multiple </Card>.
// Let's use a simpler string replace.

const oldStats = tsx.substring(
  tsx.indexOf('<div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">'),
  tsx.indexOf('</Card>', tsx.indexOf('<Card className="mt-6">')) + 7,
)

const bentoDashboard = `<div className="mt-12 grid gap-6 md:grid-cols-3">
              {/* Stat Cards - span full width in a sub-grid */}
              <div className="md:col-span-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Stat
                  label="Latest score"
                  value={stats.latest.overallScore}
                  sub={stats.hasFullMocks ? \`Full mock · CEFR \${stats.latest.cefr}\` : \`CEFR \${stats.latest.cefr}\`}
                  tone="brand"
                />
                <Stat
                  label="Best score"
                  value={stats.best}
                  sub={stats.hasFullMocks ? 'best full mock' : \`across \${attempts.length} attempts\`}
                  tone="mint"
                />
                <Stat
                  label="Change"
                  value={\`\${stats.delta >= 0 ? '+' : ''}\${Math.round(stats.delta * 10) / 10}\`}
                  sub={stats.hasFullMocks ? 'since first full mock' : 'since first attempt'}
                  tone={stats.delta >= 0 ? 'mint' : 'rose'}
                />
                <Stat label="Attempts" value={attempts.length} sub={formatDuration(stats.sorted.reduce((a, b) => a + b.durationMs, 0))} />
              </div>

              {/* Main Bento Area */}
              {stats.trendAttempts.length > 1 ? (
                <Card className="md:col-span-2 flex flex-col min-h-[300px]">
                  <CardTitle>Overall score over time{stats.isFullMockTrend ? ' (Full mocks)' : ''}</CardTitle>
                  <div className="flex-1 mt-4 relative">
                    <ScoreTrend points={stats.trendAttempts.map((a) => ({ label: a.finishedAt, value: a.overallScore }))} />
                  </div>
                </Card>
              ) : null}

              <Card className={stats.trendAttempts.length > 1 ? "md:col-span-1" : "md:col-span-3"}>
                <CardTitle>Average by skill</CardTitle>
                <div className="mt-6 space-y-5">
                  {SKILL_ORDER.filter((s) => stats.skillAvg[s] !== undefined).map((s) => {
                    const value = stats.skillAvg[s] as number
                    return (
                      <div key={s}>
                        <div className="mb-2 flex items-baseline justify-between gap-3 text-sm">
                          <span className="text-ink-800 dark:text-ink-100 font-semibold capitalize">{s}</span>
                          <span className="text-ink-900 dark:text-white font-bold tabular-nums">{Math.round(value * 10) / 10}</span>
                        </div>
                        <ProgressBar
                          value={value}
                          max={90}
                          tone="brand"
                          label={s}
                        />
                      </div>
                    )
                  })}
                </div>
              </Card>
            </div>`

tsx = tsx.replace(oldStats, bentoDashboard)
fs.writeFileSync('src/pages/Dashboard.tsx', tsx)
