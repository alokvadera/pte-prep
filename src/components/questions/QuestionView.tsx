import { useMemo, useState } from 'react'
import { AudioPlayer } from '../audio/AudioPlayer'
import { ChartRenderer } from '../charts/ChartRenderer'
import { Recorder, TypedAnswer } from '../recorder/Recorder'
import { cn } from '../../lib/cn'
import type { Item, ItemResponse, TableSpec } from '../../domain/types'

interface Props {
  item: Item
  response: ItemResponse | undefined
  onChange: (patch: Partial<ItemResponse>) => void
  /** Exam mode hides transcripts and coaching notes. */
  examMode: boolean
  /** Whether the stimulus transcript may be revealed. */
  showTranscript?: boolean
}

const LETTERS = 'ABCDEFGH'

/**
 * The player's play allowance.
 *
 * The count lives in the response rather than inside the player: the runner
 * remounts the player every time the candidate moves between items, so a count
 * held there would be reset by navigating away and back, and the "the
 * recording plays once" rule would be trivially bypassed.
 */
function playAllowance(
  response: ItemResponse | undefined,
  onChange: (patch: Partial<ItemResponse>) => void,
) {
  return {
    playsUsed: response?.playsUsed ?? 0,
    onPlayUsed: () => onChange({ playsUsed: (response?.playsUsed ?? 0) + 1 }),
  }
}

/** Every free-text blank in the content bank is written as six underscores. */
const BLANK_MARKER = /______/

export function QuestionView({ item, response, onChange, examMode, showTranscript = true }: Props) {
  switch (item.responseKind) {
    case 'choice':
      return <ChoiceQuestion item={item} response={response} onChange={onChange} examMode={examMode} />
    case 'multi-choice':
      return <MultiChoiceQuestion item={item} response={response} onChange={onChange} examMode={examMode} />
    case 'blanks':
      return <BlanksQuestion item={item} response={response} onChange={onChange} examMode={examMode} />
    case 'order':
      return <OrderQuestion item={item} response={response} onChange={onChange} examMode={examMode} />
    case 'highlight':
      return <HighlightQuestion item={item} response={response} onChange={onChange} examMode={examMode} />
    case 'text':
      return <TextQuestion item={item} response={response} onChange={onChange} examMode={examMode} />
    case 'audio':
      return (
        <AudioQuestion
          item={item}
          response={response}
          onChange={onChange}
          examMode={examMode}
          showTranscript={showTranscript}
        />
      )
    default: {
      const _exhaustive: never = item.responseKind
      return (
        <div role="alert" className="p-4 text-xs text-red-500">
          Unsupported question type: {String(_exhaustive)}
        </div>
      )
    }
  }
}

// ---------------------------------------------------------------------------

function ChoiceQuestion({ item, response, onChange, examMode }: Props) {
  const options = item.options ?? []
  return (
    <fieldset>
      <legend className="passage mb-4 font-semibold">{item.prompt}</legend>
      {item.stimulusId ? (
        <div className="mb-4">
          <AudioPlayer
            audioId={item.stimulusId}
            clipId={item.audioClipId}
            utterance={item.audioUtterance}
            fromTurn={item.audioFromTurn}
            toTurn={item.audioToTurn}
            beepWord={item.audioBeepWord}
            replays={item.replays ?? 0}
            leadIn={item.audioLeadIn ?? 4}
            examMode={examMode}
            {...playAllowance(response, onChange)}
            allowSpeedControl={!examMode}
            compact
          />
        </div>
      ) : null}
      <div className="space-y-2">
        {options.map((opt, i) => {
          const selected = response?.choice === opt
          const inputId = `${item.id}-opt-${i}`
          return (
            <label
              key={inputId}
              htmlFor={inputId}
              className={cn(
                'choice-row',
                'has-[input:focus-visible]:border-brand-500 has-[input:focus-visible]:shadow-[0_0_0_1px_var(--color-brand-500)]',
                selected
                  ? 'choice-active'
                  : 'choice-idle-solid',
              )}
            >
              <input
                id={inputId}
                type="radio"
                name={item.id}
                className="accent-brand-500 mt-0.5 size-4 cursor-pointer"
                checked={selected}
                onChange={() => onChange({ choice: opt })}
              />
              <span className="text-ink-700 dark:text-ink-200 text-sm leading-relaxed">
                <span className="text-ink-500 dark:text-ink-on-dark-muted mr-2 font-mono text-xs">{LETTERS[i]}</span>
                {opt}
              </span>
            </label>
          )
        })}
      </div>
      {!examMode ? (
        <p className="text-ink-500 dark:text-ink-on-dark-muted mt-3 text-xs">
          <span className="font-semibold text-mint-700 dark:text-mint-300">✓ No negative marking:</span> Select one best answer. Always guess if you are unsure.
        </p>
      ) : null}
    </fieldset>
  )
}

function MultiChoiceQuestion({ item, response, onChange, examMode }: Props) {
  const options = item.options ?? []
  const selected = response?.choices ?? []

  const toggle = (opt: string) => {
    const next = selected.includes(opt) ? selected.filter((o) => o !== opt) : [...selected, opt]
    onChange({ choices: next })
  }

  return (
    <fieldset>
      <legend className="passage mb-4 font-semibold">{item.prompt}</legend>
      {item.stimulusId ? (
        <div className="mb-4">
          <AudioPlayer
            audioId={item.stimulusId}
            clipId={item.audioClipId}
            utterance={item.audioUtterance}
            fromTurn={item.audioFromTurn}
            toTurn={item.audioToTurn}
            beepWord={item.audioBeepWord}
            replays={item.replays ?? 0}
            leadIn={item.audioLeadIn ?? 4}
            examMode={examMode}
            {...playAllowance(response, onChange)}
            allowSpeedControl={!examMode}
            compact
          />
        </div>
      ) : null}
      <div className="space-y-2">
        {options.map((opt, i) => {
          const isOn = selected.includes(opt)
          const inputId = `${item.id}-opt-${i}`
          return (
            <label
              key={inputId}
              htmlFor={inputId}
              className={cn(
                'choice-row',
                'has-[input:focus-visible]:border-brand-500 has-[input:focus-visible]:shadow-[0_0_0_1px_var(--color-brand-500)]',
                isOn
                  ? 'choice-active'
                  : 'choice-idle-solid',
              )}
            >
              <input
                id={inputId}
                type="checkbox"
                className="accent-brand-500 mt-0.5 size-4 cursor-pointer"
                checked={isOn}
                onChange={() => toggle(opt)}
              />
              <span className="text-ink-700 dark:text-ink-200 text-sm leading-relaxed">
                <span className="text-ink-500 dark:text-ink-on-dark-muted mr-2 font-mono text-xs">{LETTERS[i]}</span>
                {opt}
              </span>
            </label>
          )
        })}
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
        <span className="font-bold text-amber-700 dark:text-amber-300">⚠️ Negative marking (-1 per wrong option, min 0):</span>
        <span>Only select options you are confident in. Leaving an unsure option unselected is better than guessing wrong.</span>
      </div>
    </fieldset>
  )
}

function BlanksQuestion({ item, response, onChange, examMode }: Props) {
  if (item.type === 'fill-in-blanks-table' && item.table) {
    return <TableBlanks table={item.table} prompt={item.prompt} response={response} onChange={onChange} examMode={examMode} />
  }
  if (item.type === 'fill-in-blanks-dropdown') {
    return <DropdownBlanks item={item} response={response} onChange={onChange} examMode={examMode} />
  }
  return <InlineBlanks item={item} response={response} onChange={onChange} examMode={examMode} />
}

function DropdownBlanks({ item, response, onChange, examMode }: Props) {
  const parts = useMemo(() => (item.targetText ?? '').split(BLANK_MARKER), [item.targetText])
  const bank = item.options ?? []
  const values = response?.blanks ?? []

  const set = (i: number, v: string) => {
    const next = [...values]
    while (next.length < parts.length - 1) next.push(null)
    // Only a word from the bank can be chosen, so only a word from the bank
    // is stored: anything else would render as a blank select while still
    // counting as an attempt.
    next[i] = v && bank.includes(v) ? v : null
    onChange({ blanks: next })
  }

  // A value left over from an older bank is not selectable, so it is shown
  // as blank rather than as an option the candidate never picked.
  const valueFor = (i: number) => {
    const v = values[i]
    return v && bank.includes(v) ? v : ''
  }

  return (
    <div>
      <p className="passage mb-4 font-semibold">{item.prompt}</p>
      <p className="passage leading-[2.4]">
        {parts.map((part, i) => (
          <span key={i}>
            {part}{' '}
            {i < parts.length - 1 ? (
              <select
                className="field mx-0.5 inline-block w-auto min-w-32 border-0 bg-brand-500/10 px-2 py-1 align-baseline font-semibold"
                value={valueFor(i)}
                onChange={(e) => set(i, e.target.value)}
                aria-label={`Blank ${i + 1}`}
              >
                <option value="">—</option>
                {bank.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            ) : null}{' '}
          </span>
        ))}
      </p>
      {!examMode ? (
        <p className="text-ink-500 dark:text-ink-on-dark-muted mt-4 text-xs">
          <span className="font-semibold text-mint-700 dark:text-mint-300">✓ Partial credit:</span> Each correct blank earns 1 point with no penalty for errors. Read the whole text before choosing.
        </p>
      ) : null}
    </div>
  )
}

function InlineBlanks({ item, response, onChange, examMode }: Props) {
  const parts = useMemo(() => (item.targetText ?? '').split(BLANK_MARKER), [item.targetText])
  const values = response?.blanks ?? []

  const set = (i: number, v: string) => {
    const next = [...values]
    while (next.length < parts.length - 1) next.push(null)
    next[i] = v
    onChange({ blanks: next })
  }

  return (
    <div>
      <p className="passage mb-4 font-semibold">{item.prompt}</p>
      <AudioPlayer
        audioId={item.stimulusId}
        clipId={item.audioClipId}
        fromTurn={item.audioFromTurn}
        replays={item.replays ?? 0}
        leadIn={item.audioLeadIn ?? 4}
        examMode={examMode}
        {...playAllowance(response, onChange)}
        allowSpeedControl={!examMode}
        compact
      />
      <p className="passage mt-5 leading-[2.4]">
        {parts.map((part, i) => (
          <span key={i}>
            {part}{' '}
            {i < parts.length - 1 ? (
              <input
                type="text"
                className="field mx-0.5 inline-block w-40 border-0 border-b-2 border-brand-400 bg-transparent px-1 py-0.5 align-baseline transition-[border-color,background-color] duration-150 focus:border-brand-600 focus:bg-brand-500/5 focus:ring-0 dark:focus:border-brand-300 dark:focus:bg-brand-500/10"
                value={values[i] ?? ''}
                onChange={(e) => set(i, e.target.value)}
                aria-label={`Blank ${i + 1}`}
                autoComplete="off"
                spellCheck={false}
              />
            ) : null}{' '}
          </span>
        ))}
      </p>
      {!examMode ? (
        <p className="text-ink-500 dark:text-ink-on-dark-muted mt-4 text-xs">
          <span className="font-semibold text-mint-700 dark:text-mint-300">✓ Partial credit:</span> +1 per correct word. Fill every blank before proceeding.
        </p>
      ) : null}
    </div>
  )
}

function TableBlanks({ table, response, onChange, examMode, prompt }: Omit<Props, 'item'> & { table: TableSpec; prompt: string }) {
  const values = response?.blanks ?? []

  const set = (index: number, v: string) => {
    const next = [...values]
    while (next.length < table.blankCells.length) next.push(null)
    next[index] = v
    onChange({ blanks: next })
  }

  return (
    <div>
      <p className="passage mb-4 font-semibold">{prompt}</p>
      {table.context.map((c, i) => (
        <p key={i} className="passage mb-2">
          {c}
        </p>
      ))}
      <div className="scrollbar-thin mt-4 overflow-x-auto">
        <table className="w-full min-w-md border-collapse text-sm">
          <caption className="sr-only">Fill in the blanks using the table above</caption>
          <thead>
            <tr>
              {table.headers.map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="border-ink-300 dark:border-white/20 border-b px-3 py-2 text-left text-xs font-bold"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, r) => (
              <tr key={r} className="odd:bg-ink-100/70 dark:odd:bg-white/3">
                {row.map((cell, c) => {
                  const blankIndex = table.blankCells.findIndex((b) => b.row === r && b.col === c)
                  return (
                    <td key={c} className="border-ink-200 dark:border-white/10 border-b px-3 py-2 align-middle">
                      {blankIndex >= 0 ? (
                        <input
                          type="text"
                          className="field py-1.5"
                          value={values[blankIndex] ?? ''}
                          onChange={(e) => set(blankIndex, e.target.value)}
                          aria-label={`Blank ${blankIndex + 1}, row ${r + 1}`}
                          autoComplete="off"
                          spellCheck={false}
                        />
                      ) : (
                        <span className="text-ink-700 dark:text-ink-200">{cell}</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!examMode ? (
        <p className="text-ink-500 dark:text-ink-on-dark-muted mt-3 text-xs">
          <span className="font-semibold text-mint-700 dark:text-mint-300">✓ Partial credit:</span> Each blank is scored separately (+1 each, no penalty).
        </p>
      ) : null}
    </div>
  )
}

function OrderQuestion({ item, response, onChange, examMode }: Props) {
  const blocks = item.blocks ?? []
  const order = response?.order ?? blocks.map((b) => b.id)

  const move = (index: number, delta: number) => {
    const next = [...order]
    const target = index + delta
    /* v8 ignore next -- the buttons at the ends are disabled */
    if (target < 0 || target >= next.length) return
    const a = next[index] as string
    next[index] = next[target] as string
    next[target] = a
    onChange({ order: next })
  }

  return (
    <div>
      <p className="passage mb-4 font-semibold">{item.prompt}</p>
      <ol className="space-y-3">
        {order.map((id, i) => {
          const block = blocks.find((b) => b.id === id)
          if (!block) return null
          return (
            <li key={id} className="card-solid flex items-start gap-3 p-4 transition-[transform,border-color,background-color] duration-200">
              <span className="bg-brand-500 text-white mt-0.5 grid size-6 shrink-0 place-items-center rounded-md text-xs font-bold transition-all duration-150">
                {i + 1}
              </span>
              <p className="passage flex-1">{block.text}</p>
              <span className="flex shrink-0 flex-col gap-1">
                <button
                  type="button"
                  className="btn-ghost active:scale-90 px-1.5 py-0.5 text-xs transition-transform"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label={`Move paragraph ${i + 1} up`}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="btn-ghost active:scale-90 px-1.5 py-0.5 text-xs transition-transform"
                  onClick={() => move(i, 1)}
                  disabled={i === order.length - 1}
                  aria-label={`Move paragraph ${i + 1} down`}
                >
                  ↓
                </button>
              </span>
            </li>
          )
        })}
      </ol>
      {!examMode ? (
        <p className="text-ink-500 dark:text-ink-on-dark-muted mt-3 text-xs">
          <span className="font-semibold text-mint-700 dark:text-mint-300">✓ Partial credit (+1 per correct adjacent pair):</span> Use
          the arrows to reorder. Check the chain of pronouns, definite articles and time markers before moving on.
        </p>
      ) : null}
    </div>
  )
}

function HighlightQuestion({ item, response, onChange, examMode }: Props) {
  const tokens = item.tokens ?? []
  const selected = new Set(response?.highlighted ?? [])

  const toggle = (i: number) => {
    const next = new Set(selected)
    if (next.has(i)) next.delete(i)
    else next.add(i)
    onChange({ highlighted: [...next].sort((a, b) => a - b) })
  }

  return (
    <div>
      <p className="passage mb-4 font-semibold">{item.prompt}</p>
      <AudioPlayer
        audioId={item.stimulusId}
        clipId={item.audioClipId}
        utterance={item.audioUtterance}
        fromTurn={item.audioFromTurn}
        toTurn={item.audioToTurn}
        beepWord={item.audioBeepWord}
        replays={item.replays ?? 0}
        leadIn={item.audioLeadIn ?? 4}
        examMode={examMode}
        {...playAllowance(response, onChange)}
        allowSpeedControl={!examMode}
        compact
      />
      <p className="passage mt-5 rounded-lg border border-ink-200 bg-white p-4 leading-[2.2] dark:border-white/10 dark:bg-white/3">
        {tokens.map((t, i) => {
          if (t === '___') {
            return (
              <span
                key={i}
                role="separator"
                className="bg-brand-500/15 mx-1 inline-block h-6 w-24 rounded-md align-middle"
                aria-label="blank"
              >
                <span className="sr-only">blank</span>
              </span>
            )
          }
          return (
            <button
              key={i}
              type="button"
              onClick={() => toggle(i)}
              aria-pressed={selected.has(i)}
              className={cn(
                'mx-0.5 cursor-pointer rounded px-0.5 transition-colors',
                selected.has(i)
                  ? 'bg-amber-400/40 ring-2 ring-amber-400 dark:bg-amber-400/30 dark:ring-amber-300'
                  : 'hover:bg-brand-500/12 dark:hover:bg-brand-400/20',
              )}
            >
              {t}
            </button>
          )
        })}
      </p>
      <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
        <span className="font-bold text-amber-700 dark:text-amber-300">⚠️ Negative marking (-1 per wrong word, min 0):</span>
        <span>Only highlight words you clearly heard were different. Unhighlight any uncertain words.</span>
      </div>
    </div>
  )
}

function TextQuestion({ item, response, onChange, examMode }: Props) {
  const isDictation = item.type === 'write-from-dictation'
  const isEssay = item.type === 'write-essay'
  const isSwt = item.type === 'summarize-written-text'
  const isSst = item.type === 'summarize-spoken-text'
  const min = isDictation ? undefined : isEssay ? 200 : isSwt ? 5 : isSst ? 50 : 20
  const max = isDictation ? undefined : isEssay ? 300 : isSwt ? 75 : isSst ? 70 : 45

  return (
    <div>
      <p className="passage mb-4 font-semibold">{item.prompt}</p>
      {item.stimulusId || item.audioUtterance ? (
        <div className="mb-4">
          <AudioPlayer
            audioId={item.stimulusId}
            clipId={item.audioClipId}
            utterance={item.audioUtterance}
            fromTurn={item.audioFromTurn}
            toTurn={item.audioToTurn}
            replays={item.replays ?? 0}
            leadIn={item.audioLeadIn ?? 4}
            examMode={examMode}
            {...playAllowance(response, onChange)}
            allowSpeedControl={!examMode}
            compact
          />
        </div>
      ) : null}
      <TypedAnswer
        id={`text-${item.id}`}
        label={item.prompt}
        value={response?.text ?? ''}
        onChange={(text) => onChange({ text })}
        placeholder={
          isEssay
            ? 'Plan for five minutes, then write. Use four paragraphs: introduction, two body paragraphs, conclusion.'
            : isDictation
              ? 'Type exactly what you hear, including punctuation.'
              : 'Write your answer in your own words.'
        }
        minWords={min}
        maxWords={max}
        rows={isEssay ? 14 : isDictation ? 3 : 6}
      />
      {!examMode && isEssay ? (
        <p className="text-ink-500 dark:text-ink-on-dark-muted mt-3 text-xs">
          Twenty minutes. Aim for 200–300 words — content, form, structure and range are all scored.
        </p>
      ) : null}
      {!examMode && isDictation ? (
        <p className="text-ink-500 dark:text-ink-on-dark-muted mt-3 text-xs">
          <span className="font-semibold text-mint-700 dark:text-mint-300">✓ No negative marking:</span> +1 point per correct word spelled correctly. There is no deduction for extra words.
        </p>
      ) : null}
    </div>
  )
}

function AudioQuestion({ item, response, onChange, examMode, showTranscript }: Props) {
  const isShort = item.type === 'answer-short-question'
  // Read Aloud shows its text; Repeat Sentence must not — the sentence is
  // heard, not read, and showing it would test reading instead of listening.
  const showTargetText = item.type === 'read-aloud'
  const hasTarget = item.type === 'read-aloud' || item.type === 'repeat-sentence'
  const [audioPlaying, setAudioPlaying] = useState(false)

  return (
    <div>
      <p className="passage mb-4 font-semibold">{item.prompt}</p>

      {showTargetText && item.targetText ? (
        <p className="passage mb-4 rounded-lg border border-ink-200 bg-white p-4 dark:border-white/10 dark:bg-white/3">
          {item.targetText}
        </p>
      ) : null}

      {item.chartId ? <ChartRenderer chartId={item.chartId} className="mb-4" /> : null}

      {item.tokens && !hasTarget && !isShort ? (
        <p className="passage mb-4 font-semibold">{item.tokens.filter((t) => t !== '___').join(' ')}</p>
      ) : null}

      {item.stimulusId || item.audioUtterance ? (
        <div className="mb-4">
          <AudioPlayer
            audioId={item.stimulusId}
            clipId={item.audioClipId}
            utterance={item.audioUtterance}
            fromTurn={item.audioFromTurn}
            toTurn={item.audioToTurn}
            replays={item.replays ?? 0}
            leadIn={item.audioLeadIn ?? 3}
            showTranscript={showTranscript}
            examMode={examMode}
            {...playAllowance(response, onChange)}
            allowSpeedControl={!examMode}
            compact={!hasTarget}
            onPlayStateChange={setAudioPlaying}
          />
        </div>
      ) : null}

      {isShort ? (
        <div>
          <label className="label" htmlFor={`asq-${item.id}`}>
            Your answer
          </label>
          <input
            id={`asq-${item.id}`}
            className="field"
            placeholder="One to four words"
            value={response?.text ?? ''}
            onChange={(e) => onChange({ text: e.target.value })}
            autoComplete="off"
          />
          <p className="text-ink-500 dark:text-ink-on-dark-muted mt-1.5 text-xs">
            Say your answer aloud, or type it — both are scored the same way.
          </p>
        </div>
      ) : null}

      <div className="mt-4">
        <Recorder
          key={item.id}
          itemId={item.id}
          seconds={item.seconds}
          prepSeconds={item.prepSeconds ?? 0}
          onRecorded={(analysis, transcript) => onChange({ audio: analysis, transcript })}
          onTyped={(t) => onChange({ text: t })}
          disabled={audioPlaying}
        />
      </div>
    </div>
  )
}
