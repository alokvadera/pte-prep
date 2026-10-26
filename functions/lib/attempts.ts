export interface RawAttemptRow {
  id: string
  user_id: string
  mock_id: string
  mock_title: string
  mode: string
  started_at: string
  finished_at: string
  duration_ms: number
  overall_score: number
  cefr: string
  earned_points: number
  available_points: number
  skill_scores: string
  breakdown: string
  responses?: string | null
  synced_at: string
}

export function mapRawAttemptRow(row: RawAttemptRow) {
  let skillScores = {}
  let breakdown = {}
  let responses: Record<string, unknown> = {}
  let seed = 0
  let mockKind: string | undefined
  let details: unknown[] | undefined
  let sectionIds = ['speaking-writing', 'reading', 'listening']
  let untimed: boolean | undefined
  let timeScale: number | undefined

  try {
    skillScores = JSON.parse(row.skill_scores)
    breakdown = JSON.parse(row.breakdown)
    if (row.responses) {
      const parsed = JSON.parse(row.responses)
      if (parsed && typeof parsed === 'object') {
        if ('responses' in parsed) {
          responses = parsed.responses ?? {}
          seed = Number(parsed.seed ?? 0)
          mockKind = parsed.mockKind ?? undefined
          details = parsed.details ?? undefined
          untimed = parsed.untimed ? true : undefined
          timeScale = typeof parsed.timeScale === 'number' ? parsed.timeScale : undefined
          if (Array.isArray(parsed.sectionIds)) sectionIds = parsed.sectionIds
        } else {
          responses = parsed
        }
      }
    }
  } catch {
    /* ignore corrupted json */
  }

  // Not stored as a column: derive it the way the client does, so pulled
  // copies do not clobber the correct local flag with a blanket true.
  const hasEstimated = Array.isArray(details)
    ? details.some((d) => {
        const item = d as { maxPoints?: unknown; traits?: unknown }
        return typeof item.maxPoints === 'number' && item.maxPoints > 0 && item.traits !== undefined
      })
    : true

  return {
    id: row.id,
    userId: row.user_id,
    mockId: row.mock_id,
    mockTitle: row.mock_title,
    mockKind,
    details,
    ...(untimed ? { untimed: true } : {}),
    ...(timeScale ? { timeScale } : {}),
    mode: row.mode,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    durationMs: row.duration_ms,
    overallScore: row.overall_score,
    cefr: row.cefr,
    earnedPoints: row.earned_points,
    availablePoints: row.available_points,
    skillScores,
    breakdown,
    syncedAt: row.synced_at,
    seed,
    sectionIds,
    overallIsEstimate: hasEstimated,
    completedItemIds: Object.keys(responses),
    responses,
  }
}
