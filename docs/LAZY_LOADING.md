# Question Bank Lazy Loading

## Overview

The question bank is lazy-loaded so mock setup and practice pages can render without downloading question text. The initial app entry and the deferred bank chunk are both substantial; current sizes are recorded below so an old bundle-size comparison is not mistaken for a current measurement.

## Architecture

### Bundle Structure

Snapshot from the current `dist/assets` build on 26 October 2026. Sizes are KiB; gzip values are measured locally and exclude HTTP headers.

| Chunk | Size | Gzip | When Loaded |
|-------|------|------|-------------|
| app entry | 842 KiB | 251 KiB | Immediately on page load |
| question bank (`chartData`) | 625 KiB | 170 KiB | On session start / first bank use |
| assembler | 19 KiB | 5 KiB | On session start |
| test route | 73 KiB | 20 KiB | On /test route |
| result route | 33 KiB | 10 KiB | On /result route |

### Data Flow

```
Page Load
  ├─ Main bundle (842 KiB) - app code, pages, UI
  └─ No question bank

User clicks "Start session" / "Start this practice"
  ├─ Load assemble.js (19 KiB)
  ├─ Load chartData.js (625 KiB) - question bank
  ├─ Build mock with selected seed/counts
  └─ Navigate to /test
```

## Implementation

### 1. Content Manifest (`src/content/manifest.ts`)

Lightweight metadata-only manifest (~2 KB) with per-type capacity counts. Used by pages that need to list or count items without shipping the bank.

**Exports:**
- `MANIFEST_CAPACITY: Record<QuestionType, number>` - per-type capacity counts
- `manifestBankCapacity(): number` - total bank capacity
- `manifestCapacityByType(): Record<QuestionType, number>` - per-type capacity
- `getManifest(): ManifestEntry[]` - full manifest with metadata
- `typesForSkill(skill: Skill): QuestionType[]` - types that score a skill

**Verified by:** `scripts/bank-check.ts` (drift detection ensures counts match live bank)

### 2. Blueprint Preview Logic (`src/domain/blueprint.ts`)

Added preview metadata computation that works without the content bank.

**Exports:**
- `SECTION_IDS: readonly SectionId[]` - canonical section order
- `MOCK_TYPE_ORDER: readonly QuestionType[]` - order types appear in a mock
- `describeMockPreview(counts, opts): MockPreview` - computes session summary (sections, scored count, time, types)

**Verified by:** `scripts/bank-check.ts` (drift detection ensures preview matches real assembler)

### 3. Page Updates

**Home.tsx & About.tsx:**
```typescript
import { manifestBankCapacity } from '../content/manifest'
const capacity = manifestBankCapacity()
```

**Practice.tsx:**
```typescript
import { manifestCapacityByType } from '../content/manifest'
const capacity = useMemo(() => manifestCapacityByType(), [])

const begin = async () => {
  const { buildDrillMock } = await import('../domain/assemble')
  // ...
}
```

**MockSetup.tsx:**
```typescript
import { manifestCapacityByType, describeMockPreview } from '../content/manifest'
const preview = useMemo(() => {
  return describeMockPreview(counts, { singleSection, timeScale, untimed })
}, [counts, singleSection, timing])

const begin = async () => {
  const { buildFullMock, buildSectionMock } = await import('../domain/assemble')
  // ...
}
```

### 4. Drift Detection (`scripts/bank-check.ts`)

Added 33 assertions to verify the manifest and preview logic stay in sync with the bank and assembler:

1. **Manifest counts match live bank** - all 22 question types
2. **Manifest bank capacity matches** `bankCapacity()`
3. **MOCK_TYPE_ORDER matches a built mock** - across all length scales
4. **describeMockPreview matches real assembler** - scored count, time, types across all lengths, timings, sections

**Recorded total:** 3,477 checks in an earlier verification run

## Key Design Decisions

### 1. Keep Assembler Synchronous

The assembler (1,200 lines) has ~100 references to bank data. Converting it to async was too risky and invasive. Instead, we lazy-load the entire assembler module at click sites.

**Benefits:**
- No changes to assembler logic
- No risk of breaking existing functionality
- Simple implementation (just `await import()`)

**Trade-offs:**
- Assembler and bank load together (19 KiB + 625 KiB)
- Cannot split bank further without more work

### 2. Preview Computation Without Bank

MockSetup shows a session summary (sections, scored items, time, types). This is computed from blueprint metadata alone via `describeMockPreview()`, not from the bank.

**Benefits:**
- Preview renders instantly (no bank loading)
- Preview matches real assembler output exactly (verified by drift detection)
- No loading spinner for the summary

**How it works:**
- `counts` - per-type item counts (from MOCK_BLUEPRINT)
- `SECTION_META[id].minSeconds` - section time
- `MOCK_TYPE_ORDER` - type ordering
- Computed: scored count = sum(counts), time = sum(minSeconds) * timeScale

### 3. Same Seed/Counts for Preview and Actual

The previewed summary and the started mock use the same `seed` and `counts`, so they always match. The user sees "75 items, 2:10:00" and starts a session with exactly that.

## Recorded verification

The table below records an earlier full verification run; it is not a report on the current worktree. Re-run the listed commands when validating a new change.

The earlier run reported:

| Test | Result |
|------|--------|
| typecheck | ✅ Clean |
| build | ✅ 35 routes prerendered |
| smoke | ✅ 130 assertions |
| bank-check | ✅ 3,477 checks |
| boundary | ✅ 20 tests |
| contrast | ✅ 71 pairs |
| browser-check | ✅ Hydration works, no console errors |

### Architecture Verification

```bash
1. Manifest counts match bank: ✓
2. Bank capacity matches: ✓ (1200 vs 1200)
3. Preview matches mock: ✓ (scored: 75 vs 75, time: 7800 vs 7800)
4. Type order matches: ✓
5. Section IDs match: ✓ (speaking-writing, reading, listening)
6. Section preview matches: ✓ (18 vs 18)

All checks passed: ✓
```

## SEO Preserved

- **35 routes prerendered** - static HTML for indexable pages and noindex app pages
- **Prerendered HTML shows correct preview** - "75 items, 2:10:00" in session summary
- **Static HTML unchanged** - same content, now without the bank in initial bundle

## Performance Impact

The current entry defers the question bank until a flow imports the assembler or another bank-dependent module. The current build snapshot above is the baseline for future comparisons; the older 49% reduction figure no longer describes this build.

### Metrics

- **App entry:** 842 KiB (251 KiB gzip)
- **Question bank:** 625 KiB (170 KiB gzip), deferred from mock setup and practice landing views
- **Assembler:** 19 KiB (5 KiB gzip)

## Files Changed

**New:**
- `src/content/manifest.ts` - lightweight manifest (2 KB)
- `docs/LAZY_LOADING.md` - this documentation

**Modified:**
- `src/domain/blueprint.ts` - added `describeMockPreview()`, `MOCK_TYPE_ORDER`, `SECTION_IDS`
- `src/pages/Home.tsx` - use `manifestBankCapacity()`
- `src/pages/About.tsx` - use `manifestBankCapacity()`
- `src/pages/Practice.tsx` - use `manifestCapacityByType()`, lazy-load assembler
- `src/pages/MockSetup.tsx` - use `describeMockPreview()`, lazy-load assembler
- `scripts/bank-check.ts` - added drift detection (33 assertions)

**Removed:**
- `src/content/bankLoader.ts` - unused (approach changed to lazy-load assembler)

## Optional Future Optimizations

These are minor optimizations with minimal benefit (bank is already lazy-loaded):

1. **Lazy-load `AUDIO_INDEX` in AudioPlayer**
   - Defer bank loading until first audio question
   - **Benefit:** Minor (bank loads anyway for most tests)
   - **Complexity:** Medium (loading states, async rendering)

2. **Lazy-load `CHART_INDEX` in ChartRenderer/chartData**
   - Defer bank loading until first chart question
   - **Benefit:** Minor (bank loads anyway for most tests)
   - **Complexity:** Medium (loading states, async rendering)

3. **Split bank into smaller chunks**
   - Separate audio, charts, passages
   - Only load what's needed for the specific test
   - **Benefit:** Moderate (smaller chunks, faster incremental loading)
   - **Complexity:** High (restructure content files)

**Why not implemented:**
- Bank is already in a lazy chunk (625 KiB in the current build snapshot)
- Test needs bank anyway (to build mock)
- AudioPlayer/ChartRenderer are used in TestPage (lazy route)
- Minimal benefit, more complexity

## Conclusion

The question bank remains separate from the initial mock setup and practice route imports. The current bundle sizes above replace the earlier 49% comparison; future performance claims should be based on a new build snapshot. The bank-check script remains the drift guard for manifest and preview consistency.
