#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Generates public/audio-review.html and public/audio-review.js — standalone
// interactive audio browser to listen to every audio recording and inspect
// Fish Audio clips.
// ---------------------------------------------------------------------------

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { BANK, AUDIO_INDEX } from '../src/content/bank.ts'
import { mapConversationVoices } from './render-conversations.mjs'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const PUBLIC_DIR = path.join(ROOT, 'public')
const AUDIO_DIR = path.join(PUBLIC_DIR, 'audio')
const OUT_FILE = path.join(PUBLIC_DIR, 'audio-review.html')
const JS_OUT_FILE = path.join(PUBLIC_DIR, 'audio-review.js')

const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'content', 'audioManifest.json'), 'utf8'))
const filesOnDisk = new Set(fs.readdirSync(AUDIO_DIR))

const enriched = []
for (const item of manifest.items) {
  const fileName = `${item.id}.${item.format}`
  if (!filesOnDisk.has(fileName)) continue

  let text = ''
  let meta = {}

  if (item.kind === 'missing-word') {
    const b = BANK.missingWord.find((x) => x.id === item.id)
    if (b) {
      const turn = AUDIO_INDEX.get(b.audioId)?.turns[b.turnIndex]
      text = turn?.text || ''
      meta = {
        options: b.options,
        correct: b.correct,
        wordIndex: b.wordIndex,
        isFishAudio: true,
        parentAudioId: b.audioId,
        turnIndex: b.turnIndex,
      }
    }
  } else if (item.kind === 'dictation') {
    const b = BANK.dictation.find((x) => x.id === item.id)
    text = b?.text || ''
  } else if (item.kind === 'highlight-incorrect') {
    const b = BANK.highlightIncorrect.find((x) => x.id === item.id)
    text = b?.transcript || ''
    meta = {
      correctTranscript: b?.correctTranscript,
      incorrect: b?.incorrect,
    }
  } else if (item.kind === 'listening-fib') {
    const b = BANK.listeningFib.find((x) => x.id === item.id)
    text = b?.text || ''
    meta = { answers: b?.answers }
  } else if (item.kind === 'repeat-sentence') {
    const b = BANK.repeatSentences.find((x) => x.id === item.id)
    text = b?.text || ''
  } else if (item.kind === 'asq-passage') {
    for (const p of BANK.passages) {
      const found = p.asq?.find((a) => a.id === item.id)
      if (found) {
        text = found.question
        meta = { options: found.options, correct: found.correct }
        break
      }
    }
    if (!text) {
      const b = BANK.asq.find((x) => x.audioId === item.id || x.id === item.id)
      text = b?.question || ''
      if (b) {
        meta = { options: b.options, correct: b.correct }
      }
    }
  } else if (AUDIO_INDEX.has(item.id)) {
    const script = AUDIO_INDEX.get(item.id)
    text = script.turns.map((t) => `${t.speaker}: ${t.text}`).join('\n\n')
    if (item.kind === 'conversation' || item.kind === 'group' || (script.speakers && script.speakers.length > 1)) {
      const assigned = mapConversationVoices(script)
      meta = {
        isFishAudio: true,
        speakers: assigned.map((s) => ({
          id: s.speakerId,
          name: s.name,
          role: s.role,
          voice: s.voice.name,
          gender: s.voice.gender,
          accent: s.voice.accent,
        })),
      }
    }
  }

  enriched.push({
    id: item.id,
    title: item.title,
    kind: item.kind,
    topic: item.topic,
    format: item.format,
    durationSec: item.durationSec,
    byteSize: item.byteSize,
    file: `audio/${fileName}`,
    text,
    meta,
  })
}

// Order: Put Fish Audio (SMW) first so they are immediately accessible, followed by WFD, Conversations, etc.
const KIND_ORDER = {
  'missing-word': 1,
  dictation: 2,
  conversation: 3,
  lecture: 4,
  group: 5,
  'highlight-incorrect': 6,
  'listening-fib': 7,
  'asq-passage': 8,
  'repeat-sentence': 9,
  'single-speaker': 10,
}

enriched.sort((a, b) => {
  const oA = KIND_ORDER[a.kind] || 99
  const oB = KIND_ORDER[b.kind] || 99
  if (oA !== oB) return oA - oB
  return a.id.localeCompare(b.id, undefined, { numeric: true })
})

// Calculate live dynamic counts for each category
const counts = { all: enriched.length }
for (const item of enriched) {
  counts[item.kind] = (counts[item.kind] || 0) + 1
}

const safeJsonClips = JSON.stringify(enriched)

const html = `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>PTE Audio Explorer — All 732 Recordings & Fish Audio Player</title>
  <link rel="icon" type="image/svg+xml" href="favicon.svg" />
  <style>
    :root {
      --bg: #090a0f;
      --surface: #12141c;
      --surface-border: #1f2333;
      --surface-hover: #191c28;
      --text: #f1f5f9;
      --text-muted: #94a3b8;
      --accent: #6366f1;
      --accent-hover: #4f46e5;
      --accent-glow: rgba(99, 102, 241, 0.28);
      --fish: #f59e0b;
      --fish-hover: #d97706;
      --fish-glow: rgba(245, 158, 11, 0.32);
      --success: #10b981;
      --danger: #ef4444;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
      padding-bottom: 140px;
      -webkit-font-smoothing: antialiased;
    }

    /* Sticky Header */
    header {
      position: sticky;
      top: 0;
      z-index: 40;
      background: rgba(9, 10, 15, 0.94);
      backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--surface-border);
      padding: 16px 24px;
    }
    .header-inner {
      max-width: 1440px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .header-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
    }
    .title-group h1 {
      font-size: 20px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 10px;
      color: #fff;
    }
    .title-group p {
      font-size: 13px;
      color: var(--text-muted);
      margin-top: 2px;
    }
    .stats-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 9999px;
      background: var(--surface);
      border: 1px solid var(--surface-border);
      color: var(--text);
    }
    .badge-fish {
      background: rgba(245, 158, 11, 0.15);
      border-color: rgba(245, 158, 11, 0.4);
      color: #fbbf24;
      animation: pulseGlow 2.5s infinite;
    }
    @keyframes pulseGlow {
      0%, 100% { box-shadow: 0 0 0 rgba(245, 158, 11, 0); }
      50% { box-shadow: 0 0 12px var(--fish-glow); }
    }

    .controls-row {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .search-box {
      position: relative;
      width: 100%;
      max-width: 640px;
    }
    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 14px;
      color: var(--text-muted);
      pointer-events: none;
    }
    .search-input {
      width: 100%;
      background: #0d0f18;
      border: 1px solid var(--surface-border);
      border-radius: 8px;
      padding: 9px 12px 9px 36px;
      color: #fff;
      font-size: 14px;
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .search-input:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px var(--accent-glow);
    }
    .clear-search-btn {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      background: #1e2235;
      border: none;
      color: var(--text-muted);
      border-radius: 4px;
      font-size: 11px;
      padding: 2px 6px;
      cursor: pointer;
      display: none;
    }
    .clear-search-btn:hover { color: #fff; }

    /* Filter Pills */
    .filter-pills {
      display: flex;
      gap: 6px;
      overflow-x: auto;
      padding-bottom: 4px;
      scrollbar-width: thin;
    }
    .filter-pills::-webkit-scrollbar { height: 4px; }
    .filter-pills::-webkit-scrollbar-thumb { background: #1f2333; border-radius: 4px; }
    .pill {
      background: #10121b;
      border: 1px solid var(--surface-border);
      color: var(--text-muted);
      font-size: 12px;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 20px;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s;
      flex-shrink: 0;
    }
    .pill:hover {
      background: var(--surface-hover);
      color: #fff;
      border-color: #33394f;
    }
    .pill.active {
      background: var(--accent);
      border-color: var(--accent);
      color: #fff;
      box-shadow: 0 0 12px var(--accent-glow);
    }
    .pill.pill-fish {
      border-color: rgba(245, 158, 11, 0.4);
      color: #fbbf24;
      background: rgba(245, 158, 11, 0.1);
    }
    .pill.pill-fish.active {
      background: var(--fish);
      color: #000;
      box-shadow: 0 0 14px var(--fish-glow);
      font-weight: 700;
    }

    /* Main Grid */
    main {
      max-width: 1440px;
      margin: 20px auto;
      padding: 0 24px;
    }
    .clips-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
      gap: 16px;
    }
    @media (max-width: 768px) {
      .clips-grid { grid-template-columns: 1fr; }
    }

    /* Card */
    .card {
      background: var(--surface);
      border: 1px solid var(--surface-border);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      transition: border-color 0.15s, box-shadow 0.15s, transform 0.1s;
      position: relative;
    }
    .card:hover {
      border-color: #2e354d;
      background: var(--surface-hover);
    }
    .card.is-fish {
      border-color: rgba(245, 158, 11, 0.35);
      background: linear-gradient(180deg, rgba(245, 158, 11, 0.05) 0%, var(--surface) 100%);
    }
    .card.is-active-playing {
      border-color: var(--accent);
      box-shadow: 0 0 18px var(--accent-glow);
    }
    .card.is-fish.is-active-playing {
      border-color: var(--fish);
      box-shadow: 0 0 20px var(--fish-glow);
    }

    .card-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 10px;
    }
    .card-id-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .card-id {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 13px;
      font-weight: 700;
      color: #e2e8f0;
      background: #1a1e2d;
      padding: 2px 7px;
      border-radius: 4px;
      border: 1px solid #272d42;
    }
    .card-title {
      font-size: 14px;
      font-weight: 600;
      color: #cbd5e1;
      margin-top: 4px;
    }
    .card-meta {
      font-size: 12px;
      color: var(--text-muted);
      display: flex;
      gap: 10px;
      align-items: center;
      flex-wrap: wrap;
    }
    .tag {
      font-size: 11px;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 4px;
      background: #1e293b;
      color: #94a3b8;
    }
    .tag-fish {
      background: rgba(245, 158, 11, 0.2);
      color: #f59e0b;
      border: 1px solid rgba(245, 158, 11, 0.35);
      font-weight: 700;
    }

    /* Transcript Box */
    .transcript-box {
      background: #0b0d14;
      border: 1px solid #1a1e2e;
      border-radius: 8px;
      padding: 12px;
      font-size: 13px;
      color: #cbd5e1;
      line-height: 1.6;
      max-height: 160px;
      overflow-y: auto;
      white-space: pre-wrap;
    }
    .beep-badge {
      display: inline-block;
      background: #f59e0b;
      color: #000;
      font-weight: 800;
      padding: 2px 7px;
      border-radius: 4px;
      margin: 0 3px;
      font-size: 12px;
      box-shadow: 0 0 8px rgba(245, 158, 11, 0.4);
    }
    .options-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      margin-top: 6px;
    }
    .option-cell {
      font-size: 12px;
      padding: 6px 10px;
      background: #141724;
      border: 1px solid #232738;
      border-radius: 6px;
      color: #94a3b8;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .option-cell.is-correct {
      background: rgba(16, 185, 129, 0.15);
      border-color: rgba(16, 185, 129, 0.4);
      color: #34d399;
      font-weight: 600;
    }

    /* Card Player Strip */
    .card-player-strip {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #0c0e16;
      border: 1px solid #1b1e2c;
      border-radius: 8px;
      padding: 8px 12px;
      margin-top: auto;
    }
    .card-play-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--accent);
      color: #fff;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      cursor: pointer;
      flex-shrink: 0;
      transition: transform 0.1s, background 0.15s;
    }
    .card-play-btn:hover {
      transform: scale(1.06);
      background: var(--accent-hover);
    }
    .card-play-btn.is-fish {
      background: var(--fish);
      color: #000;
    }
    .card-play-btn.is-fish:hover {
      background: var(--fish-hover);
    }

    .card-scrubber-wrap {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .card-time-row {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: var(--text-muted);
      font-variant-numeric: tabular-nums;
    }
    .card-slider {
      width: 100%;
      -webkit-appearance: none;
      height: 4px;
      border-radius: 2px;
      background: #252b3d;
      outline: none;
      cursor: pointer;
    }
    .card-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 11px;
      height: 11px;
      border-radius: 50%;
      background: var(--accent);
      cursor: pointer;
    }
    .card.is-fish .card-slider::-webkit-slider-thumb {
      background: var(--fish);
    }

    .raw-link {
      font-size: 11px;
      color: #64748b;
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 3px;
      padding: 4px 6px;
      border-radius: 4px;
      background: #141824;
      border: 1px solid #1f2538;
      transition: color 0.15s;
      flex-shrink: 0;
    }
    .raw-link:hover {
      color: #94a3b8;
      border-color: #333d59;
    }

    /* Sticky Bottom Master Bar */
    .master-bar {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(15, 18, 28, 0.96);
      backdrop-filter: blur(20px);
      border-top: 1px solid #282f44;
      padding: 12px 24px;
      z-index: 50;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
      box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.5);
    }
    .master-left {
      display: flex;
      align-items: center;
      gap: 14px;
      min-width: 260px;
      max-width: 380px;
    }
    .master-play-btn {
      width: 46px;
      height: 46px;
      border-radius: 50%;
      background: var(--accent);
      color: #fff;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      cursor: pointer;
      flex-shrink: 0;
      transition: transform 0.1s, background 0.15s;
    }
    .master-play-btn:hover {
      transform: scale(1.05);
      background: var(--accent-hover);
    }
    .master-play-btn.is-fish {
      background: var(--fish);
      color: #000;
    }
    .master-play-btn.is-fish:hover {
      background: var(--fish-hover);
    }
    .master-info h3 {
      font-size: 14px;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: #fff;
    }
    .master-info p {
      font-size: 12px;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .master-center {
      flex: 1;
      max-width: 640px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      align-items: center;
    }
    .master-controls {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .btn-icon {
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      font-size: 16px;
      padding: 6px 10px;
      border-radius: 6px;
      transition: color 0.15s, background 0.15s;
    }
    .btn-icon:hover { color: #fff; background: #1c2132; }

    .master-progress-wrap {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 12px;
      color: var(--text-muted);
      font-variant-numeric: tabular-nums;
    }
    .master-slider {
      flex: 1;
      -webkit-appearance: none;
      height: 5px;
      border-radius: 3px;
      background: #272d40;
      outline: none;
      cursor: pointer;
    }
    .master-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 13px;
      height: 13px;
      border-radius: 50%;
      background: var(--accent);
      cursor: pointer;
    }
    .master-play-btn.is-fish ~ .master-center .master-slider::-webkit-slider-thumb {
      background: var(--fish);
    }

    .master-right {
      display: flex;
      align-items: center;
      gap: 14px;
      font-size: 12px;
      color: var(--text-muted);
    }
    .speed-select {
      background: #181c2b;
      border: 1px solid #282f44;
      color: #fff;
      padding: 5px 8px;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
    }
    .autoplay-toggle {
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      user-select: none;
      white-space: nowrap;
    }
    .autoplay-toggle input { accent-color: var(--accent); cursor: pointer; }

    .toast {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #1e1b4b;
      color: #c7d2fe;
      border: 1px solid #4338ca;
      padding: 10px 16px;
      border-radius: 8px;
      font-size: 13px;
      z-index: 100;
      box-shadow: 0 4px 16px rgba(0,0,0,0.4);
      display: none;
    }

    .no-results {
      grid-column: 1 / -1;
      text-align: center;
      padding: 80px 20px;
      color: var(--text-muted);
    }
    .no-results h3 { font-size: 18px; color: #fff; margin-bottom: 6px; }
  </style>
</head>
<body>

<header>
  <div class="header-inner">
    <div class="header-top">
      <div class="title-group">
        <h1>🎙️ PTE Prep Audio Explorer & Fish Audio Player</h1>
        <p>Listen to all 732 native PTE Academic recordings & inspect excised Fish Audio TTS clips</p>
      </div>
      <div class="stats-bar">
        <span class="badge">Total Clips: <strong id="stat-total">${enriched.length}</strong></span>
        <span class="badge badge-fish">🐟 Fish Audio SMW: <strong id="stat-fish">${counts['missing-word'] || 0}</strong></span>
        <span class="badge">Showing: <strong id="stat-showing">${counts['missing-word'] || 0}</strong></span>
      </div>
    </div>

    <div class="controls-row">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input type="text" id="search-input" class="search-input" placeholder="Search by ID (e.g. smw-1, wfd-10), transcript text, or options..." />
        <button id="clear-search-btn" class="clear-search-btn">✕ Clear</button>
      </div>

      <div class="filter-pills" id="filter-pills">
        <button class="pill" data-kind="all">All (${counts['all'] || 0})</button>
        <button class="pill pill-fish active" data-kind="missing-word">🐟 Fish Audio (SMW) (${counts['missing-word'] || 0})</button>
        <button class="pill" data-kind="repeat-sentence">Repeat Sentence (${counts['repeat-sentence'] || 0})</button>
        <button class="pill" data-kind="asq-passage">Answer Short Question (${counts['asq-passage'] || 0})</button>
        <button class="pill" data-kind="dictation">Write from Dictation (${counts['dictation'] || 0})</button>
        <button class="pill" data-kind="highlight-incorrect">Highlight Incorrect (${counts['highlight-incorrect'] || 0})</button>
        <button class="pill" data-kind="listening-fib">Fill in Blanks (${counts['listening-fib'] || 0})</button>
        <button class="pill" data-kind="conversation">Conversations (${counts['conversation'] || 0})</button>
        <button class="pill" data-kind="lecture">Lectures (${counts['lecture'] || 0})</button>
        <button class="pill" data-kind="group">Group Discussions (${counts['group'] || 0})</button>
        <button class="pill" data-kind="single-speaker">Single Speaker (${counts['single-speaker'] || 0})</button>
      </div>
    </div>
  </div>
</header>

<main>
  <div class="clips-grid" id="clips-grid"></div>
</main>

<!-- Master Bottom Player -->
<div class="master-bar" id="master-bar">
  <div class="master-left">
    <button class="master-play-btn" id="master-play-btn" title="Play / Pause (Space)">▶</button>
    <div class="master-info">
      <h3 id="master-title">Select a clip to play</h3>
      <p id="master-subtitle">Press Space to toggle • Arrows to seek</p>
    </div>
  </div>

  <div class="master-center">
    <div class="master-controls">
      <button class="btn-icon" id="seek-back-btn" title="Back 5s (Left Arrow)">↺ 5s</button>
      <button class="btn-icon" id="prev-btn" title="Previous Track (Shift+Left)">⏮ Prev</button>
      <button class="btn-icon" id="next-btn" title="Next Track (Shift+Right)">Next ⏭</button>
      <button class="btn-icon" id="seek-fwd-btn" title="Forward 5s (Right Arrow)">5s ↻</button>
    </div>
    <div class="master-progress-wrap">
      <span id="cur-time">0:00</span>
      <input type="range" class="master-slider" id="master-slider" value="0" min="0" max="100" step="0.1" />
      <span id="dur-time">0:00</span>
    </div>
  </div>

  <div class="master-right">
    <label class="autoplay-toggle" title="Automatically start the next clip when current one ends">
      <input type="checkbox" id="autoplay-next" checked />
      <span>Autoplay Next</span>
    </label>
    <select class="speed-select" id="speed-select" title="Playback speed">
      <option value="0.75">0.75x</option>
      <option value="1" selected>1.0x</option>
      <option value="1.25">1.25x</option>
      <option value="1.5">1.5x</option>
      <option value="2">2.0x</option>
    </select>
  </div>
</div>

<div id="toast" class="toast"></div>

<script src="audio-review.js"></script>
</body>
</html>
`

const jsContent = `// ---------------------------------------------------------------------------
// PTE Audio Explorer Client Engine
// ---------------------------------------------------------------------------

const CLIPS = ${safeJsonClips};

let currentFilter = 'missing-word';
let currentQuery = '';
let activeIndex = -1;
let filteredIndices = [];

const audio = new Audio();
audio.preload = 'metadata';

const grid = document.getElementById('clips-grid');
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search-btn');
const filterPills = document.getElementById('filter-pills');
const statShowing = document.getElementById('stat-showing');

const masterPlayBtn = document.getElementById('master-play-btn');
const masterTitle = document.getElementById('master-title');
const masterSubtitle = document.getElementById('master-subtitle');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const seekBackBtn = document.getElementById('seek-back-btn');
const seekFwdBtn = document.getElementById('seek-fwd-btn');
const curTimeEl = document.getElementById('cur-time');
const durTimeEl = document.getElementById('dur-time');
const masterSlider = document.getElementById('master-slider');
const autoplayCheckbox = document.getElementById('autoplay-next');
const speedSelect = document.getElementById('speed-select');
const toastEl = document.getElementById('toast');

function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.style.display = 'block';
  setTimeout(() => { toastEl.style.display = 'none'; }, 2500);
}

function formatTime(s) {
  if (!Number.isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return m + ':' + sec.toString().padStart(2, '0');
}

function getFiltered() {
  return CLIPS.map((clip, idx) => ({ clip, idx })).filter(({ clip }) => {
    if (currentFilter !== 'all' && clip.kind !== currentFilter) return false;
    if (currentQuery) {
      const q = currentQuery.toLowerCase();
      const inId = clip.id.toLowerCase().includes(q);
      const inTitle = (clip.title || '').toLowerCase().includes(q);
      const inText = (clip.text || '').toLowerCase().includes(q);
      const inTopic = (clip.topic || '').toLowerCase().includes(q);
      const inOptions = clip.meta?.options?.some(o => o.toLowerCase().includes(q));
      if (!inId && !inTitle && !inText && !inTopic && !inOptions) return false;
    }
    return true;
  });
}

function render() {
  const list = getFiltered();
  filteredIndices = list.map(item => item.idx);
  statShowing.textContent = list.length;

  if (list.length === 0) {
    grid.innerHTML = '<div class="no-results"><h3>No matching recordings found</h3><p>Try searching for a different keyword or category.</p></div>';
    return;
  }

  grid.innerHTML = list.map(({ clip, idx }) => {
    const isFish = clip.kind === 'missing-word' || clip.meta?.isFishAudio;
    const isCurrent = activeIndex === idx;
    const isPlaying = isCurrent && !audio.paused;

    let speakerPillsHtml = '';
    if (clip.meta?.speakers && clip.meta.speakers.length > 0) {
      speakerPillsHtml = '<div style="display:flex; flex-wrap:wrap; gap:6px; margin: 8px 0;">' +
        clip.meta.speakers.map(s =>
          '<span style="font-size:11px; padding:3px 8px; border-radius:12px; background:rgba(99,102,241,0.15); border:1px solid rgba(99,102,241,0.3); color:#c7d2fe;">' +
            '🗣️ <strong>' + s.name + '</strong> (' + s.role + '): <strong>' + s.voice + '</strong> (' + s.gender + ', ' + s.accent + ')' +
          '</span>'
        ).join('') +
      '</div>';
    }

    let bodyHtml = '';
    if (isFish && clip.text && clip.meta.wordIndex !== undefined) {
      const words = clip.text.split(/\\s+/);
      const excised = words[clip.meta.wordIndex] || '____';
      const before = words.slice(0, clip.meta.wordIndex).join(' ');
      const after = words.slice(clip.meta.wordIndex + 1).join(' ');
      const optionsHtml = (clip.meta.options || []).map((opt, i) => {
        const isCorrect = i === clip.meta.correct;
        return '<div class="option-cell ' + (isCorrect ? 'is-correct' : '') + '">' +
          (isCorrect ? '✓ ' : '') + opt +
        '</div>';
      }).join('');

      bodyHtml = '<div class="transcript-box">' +
        before + ' <span class="beep-badge">🔊 [1 kHz BEEP: "' + excised + '"]</span> ' + after +
      '</div>' +
      '<div class="options-grid">' + optionsHtml + '</div>';
    } else if (clip.text) {
      bodyHtml = '<div class="transcript-box">' + clip.text + '</div>';
    }

    const sliderVal = isCurrent && audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
    const curDisplay = isCurrent ? formatTime(audio.currentTime) : '0:00';

    return '<div class="card ' + (isFish ? 'is-fish' : '') + ' ' + (isPlaying ? 'is-active-playing' : '') + '" id="card-' + idx + '" data-idx="' + idx + '">' +
      '<div class="card-header">' +
        '<div>' +
          '<div class="card-id-row">' +
            '<span class="card-id">' + clip.id + '</span>' +
            (isFish ? '<span class="tag tag-fish">🐟 Fish Audio TTS</span>' : '<span class="tag">' + clip.kind + '</span>') +
          '</div>' +
          '<div class="card-title">' + (clip.title || clip.id) + '</div>' +
        '</div>' +
        '<a href="' + clip.file + '" target="_blank" class="raw-link" title="Open raw audio file in new tab">↗ Raw .m4a</a>' +
      '</div>' +

      '<div class="card-meta">' +
        '<span>⏱️ ' + formatTime(clip.durationSec) + '</span>' +
        '<span>•</span>' +
        '<span>💾 ' + Math.round(clip.byteSize / 1024) + ' KB</span>' +
        '<span>•</span>' +
        '<span>🏷️ ' + (clip.topic || 'General') + '</span>' +
      '</div>' +

      speakerPillsHtml +
      bodyHtml +

      '<div class="card-player-strip">' +
        '<button class="card-play-btn ' + (isFish ? 'is-fish' : '') + '" id="play-btn-' + idx + '" data-idx="' + idx + '" title="Play / Pause this clip">' +
          (isPlaying ? '⏸' : '▶') +
        '</button>' +
        '<div class="card-scrubber-wrap">' +
          '<input type="range" class="card-slider" id="slider-' + idx + '" data-idx="' + idx + '" min="0" max="100" step="0.1" value="' + sliderVal + '" />' +
          '<div class="card-time-row">' +
            '<span id="time-' + idx + '">' + curDisplay + '</span>' +
            '<span>' + formatTime(clip.durationSec) + '</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');

  list.forEach(({ idx }) => {
    const btn = document.getElementById('play-btn-' + idx);
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePlay(idx);
      });
    }
    const slider = document.getElementById('slider-' + idx);
    if (slider) {
      slider.addEventListener('input', (e) => {
        e.stopPropagation();
        if (activeIndex === idx && audio.duration) {
          audio.currentTime = (parseFloat(e.target.value) / 100) * audio.duration;
        }
      });
    }
  });
}

function togglePlay(idx) {
  if (activeIndex === idx) {
    if (audio.paused) {
      audio.play().catch(err => showToast('Playback blocked: ' + err.message));
    } else {
      audio.pause();
    }
  } else {
    loadAndPlay(idx);
  }
}

function loadAndPlay(idx) {
  if (idx < 0 || idx >= CLIPS.length) return;
  const clip = CLIPS[idx];
  activeIndex = idx;

  audio.src = clip.file;
  audio.playbackRate = parseFloat(speedSelect.value);
  audio.play().catch(err => {
    console.warn('Audio play failed:', err);
    showToast('Could not play clip ' + clip.id + ' (' + err.message + ')');
  });

  updateMasterBar(clip);
  updateCardStates();
}

function updateMasterBar(clip) {
  masterTitle.textContent = clip.id + ' — ' + (clip.title || clip.kind);
  masterSubtitle.textContent = (clip.kind === 'missing-word' ? '🐟 Fish Audio (1 kHz Beep) • ' : '') + formatTime(clip.durationSec) + ' • ' + (clip.topic || 'General');
  if (clip.kind === 'missing-word') {
    masterPlayBtn.classList.add('is-fish');
  } else {
    masterPlayBtn.classList.remove('is-fish');
  }
}

function updateCardStates() {
  document.querySelectorAll('.card').forEach(c => {
    c.classList.remove('is-active-playing');
    const idx = parseInt(c.dataset.idx, 10);
    const btn = document.getElementById('play-btn-' + idx);
    if (btn) btn.textContent = '▶';
  });

  if (activeIndex >= 0) {
    const currentCard = document.getElementById('card-' + activeIndex);
    const currentBtn = document.getElementById('play-btn-' + activeIndex);
    if (currentCard && !audio.paused) {
      currentCard.classList.add('is-active-playing');
    }
    if (currentBtn) {
      currentBtn.textContent = audio.paused ? '▶' : '⏸';
    }
  }
}

function playNext() {
  const curPos = filteredIndices.indexOf(activeIndex);
  if (curPos >= 0 && curPos + 1 < filteredIndices.length) {
    loadAndPlay(filteredIndices[curPos + 1]);
  } else if (filteredIndices.length > 0) {
    loadAndPlay(filteredIndices[0]);
  }
}

function playPrev() {
  const curPos = filteredIndices.indexOf(activeIndex);
  if (curPos > 0) {
    loadAndPlay(filteredIndices[curPos - 1]);
  } else if (filteredIndices.length > 0) {
    loadAndPlay(filteredIndices[filteredIndices.length - 1]);
  }
}

audio.addEventListener('play', () => {
  masterPlayBtn.textContent = '⏸';
  updateCardStates();
});

audio.addEventListener('pause', () => {
  masterPlayBtn.textContent = '▶';
  updateCardStates();
});

audio.addEventListener('timeupdate', () => {
  const cur = audio.currentTime;
  const dur = audio.duration || (activeIndex >= 0 ? CLIPS[activeIndex].durationSec : 0);
  curTimeEl.textContent = formatTime(cur);
  durTimeEl.textContent = formatTime(dur);

  if (dur > 0) {
    const pct = (cur / dur) * 100;
    masterSlider.value = pct;
    const cardSlider = document.getElementById('slider-' + activeIndex);
    const cardTime = document.getElementById('time-' + activeIndex);
    if (cardSlider) cardSlider.value = pct;
    if (cardTime) cardTime.textContent = formatTime(cur);
  }
});

audio.addEventListener('ended', () => {
  masterPlayBtn.textContent = '▶';
  updateCardStates();
  if (autoplayCheckbox.checked) {
    playNext();
  }
});

audio.addEventListener('error', () => {
  const err = audio.error;
  let msg = 'Unknown audio error';
  if (err) {
    if (err.code === 1) msg = 'Audio aborted';
    else if (err.code === 2) msg = 'Network error fetching audio';
    else if (err.code === 3) msg = 'Decoding failed';
    else if (err.code === 4) msg = 'Format not supported by browser';
  }
  showToast('Playback error: ' + msg);
});

masterPlayBtn.addEventListener('click', () => {
  if (activeIndex === -1 && filteredIndices.length > 0) {
    loadAndPlay(filteredIndices[0]);
    return;
  }
  if (audio.paused) {
    audio.play().catch(err => showToast('Play failed: ' + err.message));
  } else {
    audio.pause();
  }
});

prevBtn.addEventListener('click', playPrev);
nextBtn.addEventListener('click', playNext);

seekBackBtn.addEventListener('click', () => {
  if (audio.currentTime !== undefined) {
    audio.currentTime = Math.max(0, audio.currentTime - 5);
  }
});

seekFwdBtn.addEventListener('click', () => {
  if (audio.currentTime !== undefined) {
    audio.currentTime = Math.min(audio.duration || 9999, audio.currentTime + 5);
  }
});

masterSlider.addEventListener('input', (e) => {
  if (audio.duration) {
    audio.currentTime = (parseFloat(e.target.value) / 100) * audio.duration;
  }
});

speedSelect.addEventListener('change', (e) => {
  audio.playbackRate = parseFloat(e.target.value);
});

filterPills.addEventListener('click', (e) => {
  const btn = e.target.closest('.pill');
  if (!btn) return;
  document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  currentFilter = btn.dataset.kind;
  render();
});

let searchTimer;
searchInput.addEventListener('input', (e) => {
  clearTimeout(searchTimer);
  const val = e.target.value.trim();
  clearSearchBtn.style.display = val ? 'block' : 'none';
  searchTimer = setTimeout(() => {
    currentQuery = val;
    render();
  }, 150);
});

clearSearchBtn.addEventListener('click', () => {
  searchInput.value = '';
  currentQuery = '';
  clearSearchBtn.style.display = 'none';
  render();
});

window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

  if (e.code === 'Space') {
    e.preventDefault();
    masterPlayBtn.click();
  } else if (e.code === 'ArrowRight') {
    e.preventDefault();
    if (e.shiftKey) playNext();
    else audio.currentTime = Math.min(audio.duration || 9999, audio.currentTime + 5);
  } else if (e.code === 'ArrowLeft') {
    e.preventDefault();
    if (e.shiftKey) playPrev();
    else audio.currentTime = Math.max(0, audio.currentTime - 5);
  }
});

// Initial render
render();
`

fs.writeFileSync(OUT_FILE, html, 'utf8')
fs.writeFileSync(JS_OUT_FILE, jsContent, 'utf8')
console.log(`Generated audio review explorer: ${OUT_FILE}`)
console.log(`Generated audio review client script: ${JS_OUT_FILE}`)
console.log(`Total clips included: ${enriched.length}`)
console.log(`Fish Audio clips: ${counts['missing-word']}`)
