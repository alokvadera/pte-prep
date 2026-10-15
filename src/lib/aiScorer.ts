import type { AnswerKey, Item, QuestionType, TraitBreakdown } from '../domain/types'
import { useSettings } from '../store/useSettings'

// ============================================================================
// AI Scoring & Feedback Engine (Groq BYOK - Bring Your Own Key)
//
// 100% Deterministic (temperature: 0.0) Pearson PTE Academic Rubric Evaluation.
// Direct in-browser fetch to api.groq.com. Keys stored strictly in localStorage.
// ============================================================================

export interface AiEvaluationResult {
  traits: Partial<TraitBreakdown>
  notes: string[]
  feedback: string[]
  suggestedRewrittenEssay?: string
  rawScore: number
  maxScore: number
}

const evaluationCache = new Map<string, AiEvaluationResult>()
const MAX_EVAL_CACHE = 500

function evictOldestCache() {
  if (evaluationCache.size >= MAX_EVAL_CACHE) {
    const first = evaluationCache.keys().next().value
    if (first !== undefined) {
      evaluationCache.delete(first)
    }
  }
}

function hashAnswer(itemId: string, text: string): string {
  let hash = 5381
  const str = `${itemId}:${text.trim().toLowerCase()}`
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i)
  }
  return (hash >>> 0).toString(36)
}

/**
 * Validates a Groq API Key against the models endpoint.
 */
export async function validateGroqKey(apiKey: string): Promise<{ ok: boolean; error?: string }> {
  const key = apiKey.trim()
  if (!key) return { ok: false, error: 'API key is required' }
  try {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: `Bearer ${key}` },
    })
    if (res.ok) return { ok: true }
    return { ok: false, error: `Invalid key (HTTP ${res.status})` }
  } catch {
    return { ok: false, error: 'Network error contacting Groq' }
  }
}

/**
 * Evaluates a written or spoken response using calibrated Pearson PTE rubrics
 * with temperature: 0.0 for 100% deterministic, reproducible scoring.
 */
export async function evaluateWithAi(
  item: { id: string; type: QuestionType; prompt?: string } | Item,
  referenceOrKey: AnswerKey | string | undefined,
  userText: string,
  apiKey: string,
  model = 'qwen/qwen3.8-27b',
): Promise<AiEvaluationResult | null> {
  const text = (userText ?? '').trim()
  if (!text || !apiKey) return null

  const cacheKey = hashAnswer(item.id, text)
  const cached = evaluationCache.get(cacheKey)
  if (cached) return cached

  const isEssay = item.type === 'write-essay'
  const isSWT = item.type === 'summarize-written-text'
  const isSST = item.type === 'summarize-spoken-text'
  const isSpeaking =
    item.type === 'read-aloud' ||
    item.type === 'repeat-sentence' ||
    item.type === 'describe-image' ||
    item.type === 'retell-lecture' ||
    item.type === 'respond-to-situation' ||
    item.type === 'summarize-group-discussion'

  const promptText =
    typeof referenceOrKey === 'string'
      ? referenceOrKey
      : referenceOrKey?.reference ?? ('prompt' in item ? item.prompt ?? '' : '')

  let systemPrompt: string

  if (isEssay) {
    systemPrompt = `You are an official Pearson PTE Academic Examiner evaluating a Write Essay response.
Grade the essay strictly against the official Pearson PTE scoring rubrics:
- Content (0 to 3): 3 = deals fully with the topic; 2 = deals with most aspects; 1 = deals with minor aspects; 0 = completely irrelevant or off-topic.
- Grammar (0 to 2): 2 = correct grammatical control, complex structures; 1 = some minor errors not hindering meaning; 0 = persistent errors.
- Vocabulary (0 to 2): 2 = broad academic lexical range, idiomatic, precise; 1 = adequate; 0 = basic or inaccurate.
- Spelling (0 to 2): 2 = correct standard spelling throughout; 1 = 1-2 minor slips; 0 = frequent errors.
- Development (0 to 2): 2 = logical 4-paragraph structure with cohesive devices; 1 = partial cohesion; 0 = disorganized or single block.
- Range (0 to 2): 2 = varied sentence structures and nuanced expression; 1 = moderate range; 0 = simple repetitive sentences.

Output ONLY a JSON object with this exact format:
{
  "traits": {
    "content": <number 0-3>,
    "grammar": <number 0-2>,
    "vocabulary": <number 0-2>,
    "spelling": <number 0-2>,
    "development": <number 0-2>,
    "range": <number 0-2>
  },
  "feedback": ["<critique point 1>", "<critique point 2>", "<critique point 3>"],
  "modelRewrite": "<A short 220-word band 90 model essay based on the candidate's arguments>"
}`
  } else if (isSpeaking) {
    systemPrompt = `You are an official Pearson PTE Academic Examiner evaluating a candidate's transcribed speech response for ${item.type}.
Reference/Target: "${promptText}"
Grade strictly against Pearson PTE speech rubrics:
- Content (0 to 3): 3 = accurate coverage of all target words or main ideas; 2 = majority covered; 1 = partial; 0 = irrelevant or missed.
- Pronunciation (0 to 5): 5 = native-like clarity and phonemic accuracy; 3-4 = intelligible with minor slips; 1-2 = frequent distortion; 0 = unintelligible.
- Oral Fluency (0 to 5): 5 = smooth rhythm with natural phrasing; 3-4 = minor hesitations; 1-2 = halting/choppy; 0 = broken.

Output ONLY a JSON object with this exact format:
{
  "traits": {
    "content": <number 0-3>,
    "pronunciation": <number 0-5>,
    "oralFluency": <number 0-5>
  },
  "feedback": ["<critique point 1>", "<critique point 2>"]
}`
  } else {
    systemPrompt = `You are an official Pearson PTE Academic Examiner evaluating a summary response for ${item.type}.
Prompt Reference: "${promptText}"
Grade strictly against the Pearson PTE summary rubrics:
- Content (0 to 2): 2 = provides a good summary of all main ideas; 1 = provides summary of some main ideas; 0 = misrepresents or misses main ideas.
- Grammar (0 to 2): 2 = correct grammatical control; 1 = basic with errors; 0 = severe errors.
- Vocabulary (0 to 2): 2 = appropriate word choice and lexical control; 1 = basic; 0 = defective.
${isSST ? '- Spelling (0 to 2): 2 = correct spelling; 1 = 1 error; 0 = more than 1 error.' : ''}
${isSWT ? '- Form (0 to 1): 1 = exactly one complete single sentence; 0 = more than one sentence or fragment.' : ''}

Output ONLY a JSON object with this exact format:
{
  "traits": {
    "content": <number 0-2>,
    "grammar": <number 0-2>,
    "vocabulary": <number 0-2>${isSST ? ',\n    "spelling": <number 0-2>' : ''}${isSWT ? ',\n    "form": <number 0-1>' : ''}
  },
  "feedback": ["<critique point 1>", "<critique point 2>"]
}`
  }

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `PROMPT / TARGET:\n${promptText}\n\nCANDIDATE RESPONSE:\n${text}` },
        ],
        temperature: 0.0,
        response_format: { type: 'json_object' },
      }),
    })

    if (!res.ok) {
      console.error('Groq AI scoring error:', res.status, await res.text())
      return null
    }

    const remainingRequests = res.headers.get('x-ratelimit-remaining-requests')
    const limitRequests = res.headers.get('x-ratelimit-limit-requests')
    const resetRequests = res.headers.get('x-ratelimit-reset-requests')

    const data = await res.json()
    try {
      useSettings.getState().recordAiUsage({
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
        totalTokens: data.usage?.total_tokens ?? 0,
        remainingRequests: remainingRequests ? parseInt(remainingRequests, 10) : undefined,
        limitRequests: limitRequests ? parseInt(limitRequests, 10) : undefined,
        resetRequests: resetRequests ?? undefined,
      })
    } catch {
      /* ignore */
    }

    const content = data.choices?.[0]?.message?.content
    if (!content) return null

    const parsed = JSON.parse(content)
    const t = parsed.traits || {}

    // Normalise traits onto the 0..1 scale used by ItemScoreDetail
    const traits: Partial<TraitBreakdown> = isSpeaking
      ? {
          content: (t.content ?? 0) / 3,
          pronunciation: (t.pronunciation ?? 0) / 5,
          oralFluency: (t.oralFluency ?? 0) / 5,
        }
      : {
          content: isEssay ? (t.content ?? 0) / 3 : (t.content ?? 0) / 2,
          grammar: (t.grammar ?? 0) / 2,
          vocabulary: (t.vocabulary ?? 0) / 2,
          spelling: isEssay || isSST ? (t.spelling ?? 0) / 2 : 1,
          form: isSWT ? (t.form ?? 1) : undefined,
          development: isEssay ? (t.development ?? 0) / 2 : undefined,
          range: isEssay ? (t.range ?? 0) / 2 : undefined,
        }

    const rawScore = Object.values(t).reduce((acc: number, v) => acc + (typeof v === 'number' ? v : 0), 0)
    const maxScore = isEssay ? 13 : isSpeaking ? 13 : isSST ? 8 : 7

    const result: AiEvaluationResult = {
      traits,
      notes: parsed.feedback || [],
      feedback: parsed.feedback || [],
      suggestedRewrittenEssay: parsed.modelRewrite,
      rawScore,
      maxScore,
    }

    evictOldestCache()
    evaluationCache.set(cacheKey, result)
    return result
  } catch (err) {
    console.error('Failed to evaluate with AI:', err)
    return null
  }
}

/**
 * Transcribes audio using Groq's high-speed Whisper-large-v3-turbo endpoint.
 * Returns both full text and millisecond-accurate word timestamps.
 */
export async function transcribeWithWhisper(
  audioBlob: Blob,
  apiKey: string,
): Promise<{ text: string; words?: Array<{ word: string; start: number; end: number }>; duration?: number } | null> {
  if (!apiKey || audioBlob.size === 0) return null

  try {
    const formData = new FormData()
    formData.append('file', audioBlob, 'audio.webm')
    formData.append('model', 'whisper-large-v3-turbo')
    formData.append('response_format', 'verbose_json')
    formData.append('timestamp_granularities[]', 'word')

    const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    })

    if (!res.ok) {
      console.error('Whisper transcription error:', res.status, await res.text())
      return null
    }

    const data = await res.json()
    const duration = typeof data.duration === 'number' ? data.duration : Math.max(1, Math.round(audioBlob.size / 16000))
    try {
      useSettings.getState().recordAiUsage({
        whisperSeconds: duration,
      })
    } catch {
      /* ignore */
    }

    return {
      text: data.text?.trim() ?? '',
      words: data.words,
      duration,
    }
  } catch (err) {
    console.error('Failed to transcribe with Whisper:', err)
    return null
  }
}
