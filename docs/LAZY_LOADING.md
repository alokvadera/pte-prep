# Question Bank Lazy Loading

## Overview

The question bank (~10,000 LOC, 552 KB) is lazy-loaded to reduce the initial bundle size and improve website load performance.

**Result: 49% reduction in main bundle size (1.15 MB → 588 KB)**

## Architecture

### Bundle Structure

| Chunk | Size | Gzip | When Loaded |
|-------|------|------|-------------|
| `index.js` (main) | 588 KB | 173 KB | Immediately on page load |
| `chartData.js` (bank) | 552 KB | 148 KB | On session start |
| `assemble.js` | 18 KB | 5 KB | On session start |
| `TestPage.js` | 64 KB | 18 KB | On /test route |
| `ResultPage.js` | 28 KB | 8 KB | On /result route |

### Data Flow

```
Page Load
  ├─ Main bundle (588 KB) - app code, pages, UI
  └─ No question bank

User clicks "Start session" / "Start this practice"
  ├─ Load assemble.js (18 KB)
  ├─ Load chartData.js (552 KB) - question bank
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

**Total:** 3,477 checks, all passing

## Key Design Decisions

### 1. Keep Assembler Synchronous

The assembler (1,200 lines) has ~100 references to bank data. Converting it to async was too risky and invasive. Instead, we lazy-load the entire assembler module at click sites.

**Benefits:**
- No changes to assembler logic
- No risk of breaking existing functionality
- Simple implementation (just `await import()`)

**Trade-offs:**
- Assembler and bank load together (18 KB + 552 KB)
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

The previewed summary and the started mock use the same `seed` and `counts`, so they always match. The user sees "84 items, 2:10:00" and starts a session with exactly that.

## Verification

All tests pass:

| Test | Result |
|------|--------|
| typecheck | ✅ Clean |
| build | ✅ 34 routes prerendered |
| smoke | ✅ 130 assertions |
| bank-check | ✅ 3,477 checks |
| boundary | ✅ 20 tests |
| contrast | ✅ 71 pairs |
| browser-check | ✅ Hydration works, no console errors |

### Architecture Verification

```bash
1. Manifest counts match bank: ✓
2. Bank capacity matches: ✓ (1025 vs 1025)
3. Preview matches mock: ✓ (scored: 84 vs 84, time: 7800 vs 7800)
4. Type order matches: ✓
5. Section IDs match: ✓ (speaking-writing, reading, listening)
6. Section preview matches: ✓ (20 vs 20)

All checks passed: ✓
```

## SEO Preserved

- **34 routes prerendered** - static HTML for all indexable pages
- **Prerendered HTML shows correct preview** - "84 items, 2:10:00" in session summary
- **Static HTML unchanged** - same content, now without the bank in initial bundle

## Performance Impact

### Before
1. Download main bundle (1.15 MB)
2. Parse and execute all code including bank
3. Render page
4. Time to interactive: slower (large bundle)

### After
1. Download main bundle (588 KB) - **49% smaller**
2. Parse and execute app code (no bank)
3. Render page
4. Time to interactive: **faster**
5. On "Start session": download bank (552 KB) + assembler (18 KB)
6. Build mock and start test

### Metrics

- **Main bundle:** 1.15 MB → 588 KB (**49% reduction**)
- **Gzip size:** 340 KB → 173 KB (**49% reduction**)
- **Time to interactive:** Improved (smaller bundle to parse)
- **Bank loading:** Deferred to session start

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
- Bank is already in a lazy chunk (552 KB)
- Test needs bank anyway (to build mock)
- AudioPlayer/ChartRenderer are used in TestPage (lazy route)
- Minimal benefit, more complexity

## Conclusion

The question bank lazy-loading is **complete and production-ready**. The main goal (reduce initial bundle size) is achieved with a **49% reduction**. The bank loads only when needed, improving initial load performance while preserving functionality and SEO.

All tests pass. The code is clean, well-documented, and includes drift detection to prevent future regressions.
