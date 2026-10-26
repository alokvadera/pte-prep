import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  computeAiRawScore,
  evaluateWithAi,
  transcribeWithWhisper,
  validateGroqKey,
} from '../../../src/lib/aiScorer'
import { createDefaultAiUsage, useSettings } from '../../../src/store/useSettings'
import { installFetchMock, jsonResponse } from '../../helpers/fetch'

/* ---------------------------------------------------------------------------
   The AI examiner.

   Groq is called directly from the browser, so everything that matters about
   this module is how it behaves when the network misbehaves: a key that is
   blank, a rate limit, a model that answers with prose instead of JSON, a
   recording that never arrives. The rubric arithmetic is checked separately,
   because a score that silently counts traits the rubric does not declare is
   the one failure mode that would quietly inflate every result.
   --------------------------------------------------------------------------- */

const MODELS_URL = 'https://api.groq.com/openai/v1/models'
const CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions'
const TRANSCRIBE_URL = 'https://api.groq.com/openai/v1/audio/transcriptions'

type Category = Parameters<typeof computeAiRawScore>[1]

/** A chat completion whose message holds the given content. */
function completion(content: string, extra: Record<string, unknown> = {}) {
  return {
    choices: [{ message: { content } }],
    usage: { prompt_tokens: 12, completion_tokens: 8, total_tokens: 20 },
    ...extra,
  }
}

/** The traits block of an examiner's answer. */
function traitsJson(traits: Record<string, number>, extra: Record<string, unknown> = {}): string {
  return JSON.stringify({ traits, feedback: ['Solid work.'], ...extra })
}

function requestBody(call: { init?: RequestInit } | undefined): {
  model: string
  messages: Array<{ role: string; content: string }>
} {
  return JSON.parse(String(call?.init?.body)) as {
    model: string
    messages: Array<{ role: string; content: string }>
  }
}

describe('validateGroqKey', () => {
  it('rejects a blank key without touching the network', async () => {
    const mock = installFetchMock([{ url: MODELS_URL, status: 200 }])
    await expect(validateGroqKey('')).resolves.toEqual({ ok: false, error: 'API key is required' })
    expect(mock.calls).toHaveLength(0)
  })

  it('rejects a key that is only whitespace', async () => {
    const mock = installFetchMock([{ url: MODELS_URL, status: 200 }])
    await expect(validateGroqKey('   \n\t ')).resolves.toEqual({
      ok: false,
      error: 'API key is required',
    })
    expect(mock.calls).toHaveLength(0)
  })

  it('accepts a key the models endpoint accepts', async () => {
    const mock = installFetchMock([{ url: MODELS_URL, status: 200 }])
    await expect(validateGroqKey('gsk_live_key')).resolves.toEqual({ ok: true })
    expect(mock.calls).toHaveLength(1)
    expect(mock.calls[0]?.url).toBe(MODELS_URL)
  })

  it('trims the key before sending it', async () => {
    const mock = installFetchMock([{ url: MODELS_URL, status: 200 }])
    await validateGroqKey('  gsk_trimmed  ')
    const headers = mock.calls[0]?.init?.headers as Record<string, string>
    expect(headers.Authorization).toBe('Bearer gsk_trimmed')
  })

  it('names the HTTP status when Groq rejects the key', async () => {
    installFetchMock([{ url: MODELS_URL, status: 401 }])
    await expect(validateGroqKey('gsk_wrong')).resolves.toEqual({
      ok: false,
      error: 'Invalid key (HTTP 401)',
    })
  })

  it('reports a network failure', async () => {
    installFetchMock([{ url: /.*/, networkError: true }])
    await expect(validateGroqKey('gsk_live_key')).resolves.toEqual({
      ok: false,
      error: 'Network error contacting Groq',
    })
  })
})

describe('computeAiRawScore', () => {
  it('sums the speaking traits the rubric declares', () => {
    expect(computeAiRawScore({ content: 3, pronunciation: 5, oralFluency: 5 }, 'speaking')).toBe(13)
  })

  it('sums the essay traits the rubric declares', () => {
    expect(
      computeAiRawScore(
        { content: 3, grammar: 2, vocabulary: 2, spelling: 2, development: 2, range: 2 },
        'essay',
      ),
    ).toBe(13)
  })

  it('sums the listen-and-summarise traits the rubric declares', () => {
    expect(computeAiRawScore({ content: 2, grammar: 2, vocabulary: 2, spelling: 2 }, 'sst')).toBe(8)
  })

  it('sums the summarise-and-write traits the rubric declares', () => {
    expect(computeAiRawScore({ content: 2, form: 1, grammar: 2, vocabulary: 2 }, 'swt')).toBe(7)
  })

  it('ignores traits the rubric does not declare', () => {
    expect(
      computeAiRawScore(
        { content: 3, pronunciation: 5, oralFluency: 5, grammar: 2, vocabulary: 2 },
        'speaking',
      ),
    ).toBe(13)
    expect(computeAiRawScore({ content: 2, spelling: 2 }, 'swt')).toBe(2)
  })

  it('scores nothing for a category it does not know', () => {
    const unknown = 'listening-multiple-choice' as unknown as Category
    expect(computeAiRawScore({ content: 3, grammar: 2 }, unknown)).toBe(0)
  })

  it('clamps a trait that runs past its maximum', () => {
    expect(computeAiRawScore({ content: 99 }, 'sst')).toBe(2)
    expect(computeAiRawScore({ content: 99, pronunciation: 42 }, 'speaking')).toBe(8)
  })

  it('clamps a negative trait to zero', () => {
    expect(computeAiRawScore({ content: -5, grammar: -1 }, 'sst')).toBe(0)
  })

  it('treats a trait that is not a number as zero', () => {
    expect(computeAiRawScore({ content: '3' }, 'sst')).toBe(0)
    expect(computeAiRawScore({ content: null }, 'sst')).toBe(0)
    expect(computeAiRawScore({ content: undefined }, 'sst')).toBe(0)
    expect(computeAiRawScore({ content: {} }, 'sst')).toBe(0)
  })

  it('treats a trait that is not finite as zero', () => {
    expect(computeAiRawScore({ content: Number.NaN }, 'sst')).toBe(0)
    expect(computeAiRawScore({ content: Number.POSITIVE_INFINITY }, 'sst')).toBe(0)
    expect(computeAiRawScore({ content: Number.NEGATIVE_INFINITY }, 'sst')).toBe(0)
  })

  it('scores nothing when a declared trait is missing', () => {
    expect(computeAiRawScore({}, 'essay')).toBe(0)
  })

  it('falls back to a limit of two when a rubric entry has no limit', () => {
    // Every rubric the app ships declares a limit for every trait it names, so
    // the only way to reach the fallback is to hand the scorer a rubric whose
    // entry has no limit at all.
    const inherited = Object.prototype.toString as unknown as Record<string, unknown>
    inherited.injected = undefined
    try {
      const score = computeAiRawScore({ injected: 3 }, 'toString' as unknown as Category)
      expect(score).toBe(2)
    } finally {
      Reflect.deleteProperty(inherited, 'injected')
    }
  })
})

describe('evaluateWithAi', () => {
  beforeEach(() => {
    useSettings.setState((s) => ({ settings: { ...s.settings, aiUsage: createDefaultAiUsage() } }))
  })

  afterEach(() => {
    useSettings.setState((s) => ({ settings: { ...s.settings, aiUsage: createDefaultAiUsage() } }))
    vi.useRealTimers()
  })

  it('returns null for an empty response', async () => {
    const mock = installFetchMock([{ url: CHAT_URL, method: 'POST', body: completion('{}') }])
    await expect(
      evaluateWithAi({ id: 'empty-text', type: 'write-essay' }, 'reference', '   ', 'gsk_live'),
    ).resolves.toBeNull()
    expect(mock.calls).toHaveLength(0)
  })

  it('returns null when no API key is configured', async () => {
    const mock = installFetchMock([{ url: CHAT_URL, method: 'POST', body: completion('{}') }])
    await expect(
      evaluateWithAi({ id: 'empty-key', type: 'write-essay' }, 'reference', 'an answer', ''),
    ).resolves.toBeNull()
    expect(mock.calls).toHaveLength(0)
  })

  it('returns null when there is no response to grade', async () => {
    const mock = installFetchMock([{ url: CHAT_URL, method: 'POST', body: completion('{}') }])
    await expect(
      evaluateWithAi(
        { id: 'missing-text', type: 'write-essay' },
        'reference',
        undefined as unknown as string,
        'gsk_live',
      ),
    ).resolves.toBeNull()
    expect(mock.calls).toHaveLength(0)
  })

  it('serves the second identical evaluation from the cache', async () => {
    const mock = installFetchMock([
      { url: CHAT_URL, method: 'POST', body: completion(traitsJson({ content: 3, grammar: 2 })) },
    ])
    const item = { id: 'cache-hit', type: 'write-essay' } as const
    const first = await evaluateWithAi(item, 'reference', 'The answer text', 'gsk_live')
    const second = await evaluateWithAi(item, 'reference', '  the ANSWER text ', 'gsk_live')
    expect(first).not.toBeNull()
    expect(second).toBe(first)
    expect(mock.calls).toHaveLength(1)
  })

  it('keys the cache on the model as well as the text', async () => {
    const mock = installFetchMock([
      { url: CHAT_URL, method: 'POST', body: completion(traitsJson({ content: 3 })) },
    ])
    const item = { id: 'cache-model', type: 'write-essay' } as const
    await evaluateWithAi(item, 'reference', 'one answer', 'gsk_live', 'llama-3.1-8b-instant')
    await evaluateWithAi(item, 'reference', 'one answer', 'gsk_live', 'llama-3.3-70b-versatile')
    expect(mock.calls).toHaveLength(2)
  })

  it('asks for the essay rubric when the item is an essay', async () => {
    const mock = installFetchMock([
      { url: CHAT_URL, method: 'POST', body: completion(traitsJson({ content: 3 })) },
    ])
    await evaluateWithAi(
      { id: 'prompt-essay', type: 'write-essay' },
      'the essay prompt',
      'essay text',
      'gsk_live',
    )
    const body = requestBody(mock.calls[0])
    expect(body.model).toBe('llama-3.3-70b-versatile')
    expect(body.messages[0]?.content).toContain('Write Essay')
    expect(body.messages[0]?.content).toContain('"development": <number 0-2>')
    expect(body.messages[0]?.content).not.toContain('Oral Fluency')
    expect(body.messages[1]?.content).toContain('the essay prompt')
    expect(body.messages[1]?.content).toContain('essay text')
  })

  it('asks for the speech rubric when the item is spoken', async () => {
    const mock = installFetchMock([
      { url: CHAT_URL, method: 'POST', body: completion(traitsJson({ content: 3 })) },
    ])
    await evaluateWithAi(
      { id: 'prompt-speak', type: 'read-aloud' },
      'the target text',
      'spoken words',
      'gsk_live',
    )
    const body = requestBody(mock.calls[0])
    expect(body.messages[0]?.content).toContain('transcribed speech response for read-aloud')
    expect(body.messages[0]?.content).toContain('"pronunciation": <number 0-5>')
    expect(body.messages[0]?.content).toContain('"oralFluency": <number 0-5>')
    expect(body.messages[0]?.content).not.toContain('Write Essay')
  })

  it('asks for the written-summary rubric when the item is a summary', async () => {
    const mock = installFetchMock([
      { url: CHAT_URL, method: 'POST', body: completion(traitsJson({ content: 2 })) },
    ])
    await evaluateWithAi(
      { id: 'prompt-summary', type: 'summarize-written-text' },
      'the passage',
      'summary text',
      'gsk_live',
    )
    const body = requestBody(mock.calls[0])
    expect(body.messages[0]?.content).toContain('evaluating a summary response')
    expect(body.messages[0]?.content).toContain('"form": <number 0-1>')
    expect(body.messages[0]?.content).not.toContain('"spelling": <number 0-2>')
  })

  it('asks for spelling when the item is a spoken summary', async () => {
    const mock = installFetchMock([
      { url: CHAT_URL, method: 'POST', body: completion(traitsJson({ content: 2 })) },
    ])
    await evaluateWithAi(
      { id: 'prompt-sst', type: 'summarize-spoken-text' },
      'the lecture',
      'summary text',
      'gsk_live',
    )
    const body = requestBody(mock.calls[0])
    expect(body.messages[0]?.content).toContain('"spelling": <number 0-2>')
    expect(body.messages[0]?.content).not.toContain('"form": <number 0-1>')
  })

  it('takes the reference from the answer key when one is given', async () => {
    const mock = installFetchMock([
      { url: CHAT_URL, method: 'POST', body: completion(traitsJson({ content: 2 })) },
    ])
    await evaluateWithAi(
      { id: 'prompt-key', type: 'summarize-written-text' },
      { reference: 'THE KEY REFERENCE' },
      'summary text',
      'gsk_live',
    )
    expect(requestBody(mock.calls[0]).messages[1]?.content).toContain('THE KEY REFERENCE')
  })

  it('falls back to the item prompt when there is no reference', async () => {
    const mock = installFetchMock([
      { url: CHAT_URL, method: 'POST', body: completion(traitsJson({ content: 2 })) },
    ])
    await evaluateWithAi(
      { id: 'prompt-item', type: 'summarize-written-text', prompt: 'THE ITEM PROMPT' },
      undefined,
      'summary text',
      'gsk_live',
    )
    expect(requestBody(mock.calls[0]).messages[1]?.content).toContain('THE ITEM PROMPT')
  })

  it('copes with an item that has no prompt at all', async () => {
    const mock = installFetchMock([
      { url: CHAT_URL, method: 'POST', body: completion(traitsJson({ content: 2 })) },
    ])
    await evaluateWithAi(
      { id: 'prompt-none', type: 'summarize-written-text' },
      undefined,
      'summary text',
      'gsk_live',
    )
    expect(requestBody(mock.calls[0]).messages[1]?.content).toContain('summary text')
  })

  it('copes with an item whose prompt is blank', async () => {
    const mock = installFetchMock([
      { url: CHAT_URL, method: 'POST', body: completion(traitsJson({ content: 2 })) },
    ])
    await evaluateWithAi(
      { id: 'prompt-blank', type: 'summarize-written-text', prompt: undefined },
      undefined,
      'summary text',
      'gsk_live',
    )
    expect(requestBody(mock.calls[0]).messages[1]?.content).toContain('summary text')
  })

  it('returns null when Groq answers with an error status', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ error: 'rate limited' }, 429)),
    )
    await expect(
      evaluateWithAi({ id: 'error-status', type: 'write-essay' }, 'ref', 'text', 'gsk_live'),
    ).resolves.toBeNull()
    expect(error).toHaveBeenCalled()
  })

  it('returns null when the model answers without any content', async () => {
    installFetchMock([{ url: CHAT_URL, method: 'POST', body: { choices: [] } }])
    await expect(
      evaluateWithAi({ id: 'no-content', type: 'write-essay' }, 'ref', 'text', 'gsk_live'),
    ).resolves.toBeNull()
  })

  it('returns null when the model answers with malformed JSON', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    installFetchMock([
      { url: CHAT_URL, method: 'POST', body: completion('{"traits": {"content": 2') },
    ])
    await expect(
      evaluateWithAi({ id: 'bad-json', type: 'write-essay' }, 'ref', 'text', 'gsk_live'),
    ).resolves.toBeNull()
    expect(error).toHaveBeenCalledWith('Failed to evaluate with AI:', expect.anything())
  })

  it('returns null when the model answers with prose that is not wrapped in braces', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    installFetchMock([
      {
        url: CHAT_URL,
        method: 'POST',
        body: completion('I am sorry, I cannot grade that response.'),
      },
    ])
    await expect(
      evaluateWithAi({ id: 'prose', type: 'write-essay' }, 'ref', 'text', 'gsk_live'),
    ).resolves.toBeNull()
    expect(error).toHaveBeenCalled()
  })

  it('records the rate limit headers the server reports', async () => {
    installFetchMock([
      {
        url: CHAT_URL,
        method: 'POST',
        body: completion(traitsJson({ content: 3 })),
        headers: {
          'x-ratelimit-remaining-requests': '42',
          'x-ratelimit-limit-requests': '100',
          'x-ratelimit-reset-requests': '1s',
        },
      },
    ])
    await evaluateWithAi({ id: 'rate-limit', type: 'write-essay' }, 'ref', 'text', 'gsk_live')
    const usage = useSettings.getState().settings.aiUsage
    expect(usage.serverRemainingRequests).toBe(42)
    expect(usage.serverLimitRequests).toBe(100)
    expect(usage.serverResetRequests).toBe('1s')
    expect(usage.totalRequests).toBe(1)
    expect(usage.promptTokens).toBe(12)
    expect(usage.completionTokens).toBe(8)
    expect(usage.totalTokens).toBe(20)
  })

  it('records a request that reported no token usage at all', async () => {
    installFetchMock([
      {
        url: CHAT_URL,
        method: 'POST',
        body: completion(traitsJson({ content: 3 }), { usage: undefined }),
      },
    ])
    await evaluateWithAi({ id: 'no-usage', type: 'write-essay' }, 'ref', 'text', 'gsk_live')
    const usage = useSettings.getState().settings.aiUsage
    expect(usage.totalTokens).toBe(0)
    expect(usage.serverRemainingRequests).toBeUndefined()
  })

  it('normalises speaking traits onto the 0..1 scale', async () => {
    installFetchMock([
      {
        url: CHAT_URL,
        method: 'POST',
        body: completion(traitsJson({ content: 3, pronunciation: 5, oralFluency: 3 })),
      },
    ])
    const result = await evaluateWithAi(
      { id: 'norm-speaking', type: 'read-aloud' },
      'ref',
      'spoken words',
      'gsk_live',
    )
    expect(result?.traits).toEqual({ content: 1, pronunciation: 1, oralFluency: 0.6 })
    expect(result?.maxScore).toBe(13)
    expect(result?.rawScore).toBe(11)
  })

  it('normalises essay traits onto the 0..1 scale', async () => {
    installFetchMock([
      {
        url: CHAT_URL,
        method: 'POST',
        body: completion(
          traitsJson({
            content: 3,
            grammar: 1,
            vocabulary: 2,
            spelling: 2,
            development: 1,
            range: 2,
          }),
        ),
      },
    ])
    const result = await evaluateWithAi(
      { id: 'norm-essay', type: 'write-essay' },
      'ref',
      'essay text',
      'gsk_live',
    )
    expect(result?.traits).toEqual({
      content: 1,
      grammar: 0.5,
      vocabulary: 1,
      spelling: 1,
      form: undefined,
      development: 0.5,
      range: 1,
    })
    expect(result?.maxScore).toBe(13)
    expect(result?.rawScore).toBe(11)
  })

  it('normalises a spoken-summary answer', async () => {
    installFetchMock([
      {
        url: CHAT_URL,
        method: 'POST',
        body: completion(traitsJson({ content: 2, grammar: 2, vocabulary: 1, spelling: 1 })),
      },
    ])
    const result = await evaluateWithAi(
      { id: 'norm-sst', type: 'summarize-spoken-text' },
      'ref',
      'summary text',
      'gsk_live',
    )
    expect(result?.traits).toEqual({
      content: 1,
      grammar: 1,
      vocabulary: 0.5,
      spelling: 0.5,
      form: undefined,
      development: undefined,
      range: undefined,
    })
    expect(result?.maxScore).toBe(8)
    expect(result?.rawScore).toBe(6)
  })

  it('normalises a written-summary answer and awards a form mark', async () => {
    installFetchMock([
      {
        url: CHAT_URL,
        method: 'POST',
        body: completion(traitsJson({ content: 2, grammar: 1, vocabulary: 2, form: 0 })),
      },
    ])
    const result = await evaluateWithAi(
      { id: 'norm-swt', type: 'summarize-written-text' },
      'ref',
      'summary text',
      'gsk_live',
    )
    expect(result?.traits).toEqual({
      content: 1,
      grammar: 0.5,
      vocabulary: 1,
      // The written summary is not scored on Spelling, so the model never
      // evaluated one and the trait stays undefined.
      spelling: undefined,
      form: 0,
      development: undefined,
      range: undefined,
    })
    expect(result?.maxScore).toBe(7)
    expect(result?.rawScore).toBe(5)
  })

  it('assumes a well-formed sentence when the model reports no form mark', async () => {
    installFetchMock([
      {
        url: CHAT_URL,
        method: 'POST',
        body: completion(traitsJson({ content: 2, grammar: 2, vocabulary: 2 })),
      },
    ])
    const result = await evaluateWithAi(
      { id: 'norm-swt-default', type: 'summarize-written-text' },
      'ref',
      'summary text',
      'gsk_live',
    )
    expect(result?.traits?.form).toBe(1)
  })

  it('clamps a trait the model reported out of range', async () => {
    installFetchMock([
      {
        url: CHAT_URL,
        method: 'POST',
        body: completion(traitsJson({ content: 99, grammar: -4, vocabulary: 'high' as any })),
      },
    ])
    const result = await evaluateWithAi(
      { id: 'norm-clamped', type: 'summarize-written-text' },
      'ref',
      'summary text',
      'gsk_live',
    )
    expect(result?.traits?.content).toBe(1)
    expect(result?.traits?.grammar).toBe(0)
    expect(result?.traits?.vocabulary).toBe(0)
  })

  it('keeps the feedback and the model rewrite the examiner wrote', async () => {
    installFetchMock([
      {
        url: CHAT_URL,
        method: 'POST',
        body: completion(
          JSON.stringify({
            traits: { content: 2 },
            feedback: ['Clear argument.', 'Thin evidence.'],
            modelRewrite: 'A model essay.',
          }),
        ),
      },
    ])
    const result = await evaluateWithAi(
      { id: 'feedback', type: 'write-essay' },
      'ref',
      'essay text',
      'gsk_live',
    )
    expect(result?.notes).toEqual(['Clear argument.', 'Thin evidence.'])
    expect(result?.feedback).toEqual(['Clear argument.', 'Thin evidence.'])
    expect(result?.suggestedRewrittenEssay).toBe('A model essay.')
  })

  it('copes with an answer that carries no traits and no feedback', async () => {
    installFetchMock([{ url: CHAT_URL, method: 'POST', body: completion('{}') }])
    const result = await evaluateWithAi(
      { id: 'bare-answer', type: 'write-essay' },
      'ref',
      'essay text',
      'gsk_live',
    )
    expect(result?.notes).toEqual([])
    expect(result?.feedback).toEqual([])
    expect(result?.suggestedRewrittenEssay).toBeUndefined()
    expect(result?.rawScore).toBe(0)
  })

  it('ignores a failure while recording the usage', async () => {
    const original = useSettings.getState().recordAiUsage
    useSettings.setState({
      recordAiUsage: () => {
        throw new Error('metrics storage is full')
      },
    })
    installFetchMock([
      { url: CHAT_URL, method: 'POST', body: completion(traitsJson({ content: 3 })) },
    ])
    const result = await evaluateWithAi(
      { id: 'usage-throws', type: 'write-essay' },
      'ref',
      'essay text',
      'gsk_live',
    )
    useSettings.setState({ recordAiUsage: original })
    expect(result?.rawScore).toBe(3)
  })

  it('re-evaluates an answer once the cached entry has expired', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))
    const mock = installFetchMock([
      { url: CHAT_URL, method: 'POST', body: completion(traitsJson({ content: 3 })) },
    ])
    const item = { id: 'expiry', type: 'write-essay' } as const
    await evaluateWithAi(item, 'ref', 'answer that ages', 'gsk_live')
    vi.setSystemTime(new Date('2026-01-01T00:06:00.000Z'))
    await evaluateWithAi(item, 'ref', 'answer that ages', 'gsk_live')
    expect(mock.calls).toHaveLength(2)
  })

  it('drops expired entries as it prunes the cache', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-01T00:00:00.000Z'))
    const mock = installFetchMock([
      { url: CHAT_URL, method: 'POST', body: completion(traitsJson({ content: 3 })) },
    ])
    await evaluateWithAi(
      { id: 'prune-old', type: 'write-essay' },
      'ref',
      'the older answer',
      'gsk_live',
    )
    vi.setSystemTime(new Date('2026-02-01T00:06:00.000Z'))
    await evaluateWithAi(
      { id: 'prune-new', type: 'write-essay' },
      'ref',
      'the newer answer',
      'gsk_live',
    )
    expect(mock.calls).toHaveLength(2)
  })

  it('evicts the oldest entry once the cache is full', async () => {
    const mock = installFetchMock([
      { url: CHAT_URL, method: 'POST', body: completion(traitsJson({ content: 3 })) },
    ])
    for (let i = 0; i < 520; i++) {
      await evaluateWithAi(
        { id: `bulk-${i}`, type: 'write-essay' },
        'ref',
        `bulk answer number ${i}`,
        'gsk_live',
      )
    }
    const before = mock.calls.length
    await evaluateWithAi(
      { id: 'bulk-0', type: 'write-essay' },
      'ref',
      'bulk answer number 0',
      'gsk_live',
    )
    expect(mock.calls.length).toBe(before + 1)
  })
})

describe('transcribeWithWhisper', () => {
  beforeEach(() => {
    useSettings.setState((s) => ({ settings: { ...s.settings, aiUsage: createDefaultAiUsage() } }))
  })

  afterEach(() => {
    useSettings.setState((s) => ({ settings: { ...s.settings, aiUsage: createDefaultAiUsage() } }))
  })

  it('returns null when no API key is configured', async () => {
    const mock = installFetchMock([{ url: TRANSCRIBE_URL, method: 'POST', body: { text: 'hi' } }])
    const blob = new Blob([new Uint8Array(16)], { type: 'audio/webm' })
    await expect(transcribeWithWhisper(blob, '')).resolves.toBeNull()
    expect(mock.calls).toHaveLength(0)
  })

  it('returns null for an empty recording', async () => {
    const mock = installFetchMock([{ url: TRANSCRIBE_URL, method: 'POST', body: { text: 'hi' } }])
    await expect(
      transcribeWithWhisper(new Blob([], { type: 'audio/webm' }), 'gsk_live'),
    ).resolves.toBeNull()
    expect(mock.calls).toHaveLength(0)
  })

  it('posts the recording to the transcription endpoint', async () => {
    const mock = installFetchMock([
      {
        url: TRANSCRIBE_URL,
        method: 'POST',
        body: {
          text: '  hello world  ',
          words: [{ word: 'hello', start: 0, end: 120 }],
          duration: 1.5,
        },
      },
    ])
    const blob = new Blob([new Uint8Array(1600)], { type: 'audio/webm' })
    const result = await transcribeWithWhisper(blob, 'gsk_live')
    expect(mock.calls).toHaveLength(1)
    expect(mock.calls[0]?.url).toBe(TRANSCRIBE_URL)
    expect(mock.calls[0]?.method).toBe('POST')
    const form = mock.calls[0]?.init?.body as FormData
    expect(form).toBeInstanceOf(FormData)
    expect(form.get('model')).toBe('whisper-large-v3-turbo')
    expect(form.get('response_format')).toBe('verbose_json')
    expect(form.get('timestamp_granularities[]')).toBe('word')
    expect((form.get('file') as File).name).toBe('audio.webm')
    expect(result).toEqual({
      text: 'hello world',
      words: [{ word: 'hello', start: 0, end: 120 }],
      duration: 1.5,
    })
  })

  it('names the uploaded file after the container format', async () => {
    const mock = installFetchMock([{ url: TRANSCRIBE_URL, method: 'POST', body: { text: 'x' } }])
    const formats: Array<[string, string]> = [
      ['audio/mp4', 'audio.mp4'],
      ['audio/ogg', 'audio.ogg'],
      ['audio/wav', 'audio.wav'],
      ['audio/webm', 'audio.webm'],
    ]
    for (const [type, name] of formats) {
      await transcribeWithWhisper(new Blob([new Uint8Array(16)], { type }), 'gsk_live')
      const form = mock.calls[mock.calls.length - 1]?.init?.body as FormData
      expect((form.get('file') as File).name).toBe(name)
    }
    expect(mock.calls).toHaveLength(formats.length)
  })

  it('falls back to a duration worked out from the recording size', async () => {
    installFetchMock([{ url: TRANSCRIBE_URL, method: 'POST', body: { text: 'hi' } }])
    const blob = new Blob([new Uint8Array(32000)], { type: 'audio/webm' })
    const result = await transcribeWithWhisper(blob, 'gsk_live')
    expect(result?.duration).toBe(2)
  })

  it('never reports a duration below one second', async () => {
    installFetchMock([{ url: TRANSCRIBE_URL, method: 'POST', body: { text: 'hi' } }])
    const blob = new Blob([new Uint8Array(16)], { type: 'audio/webm' })
    const result = await transcribeWithWhisper(blob, 'gsk_live')
    expect(result?.duration).toBe(1)
  })

  it('copes with an answer that carries no text', async () => {
    installFetchMock([{ url: TRANSCRIBE_URL, method: 'POST', body: {} }])
    const blob = new Blob([new Uint8Array(16)], { type: 'audio/webm' })
    const result = await transcribeWithWhisper(blob, 'gsk_live')
    expect(result?.text).toBe('')
    expect(result?.words).toBeUndefined()
  })

  it('returns null when the transcription endpoint fails', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    installFetchMock([{ url: TRANSCRIBE_URL, method: 'POST', status: 500 }])
    const blob = new Blob([new Uint8Array(16)], { type: 'audio/webm' })
    await expect(transcribeWithWhisper(blob, 'gsk_live')).resolves.toBeNull()
    expect(error).toHaveBeenCalled()
  })

  it('returns null when the request cannot be sent', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    installFetchMock([{ url: /.*/, networkError: true }])
    const blob = new Blob([new Uint8Array(16)], { type: 'audio/webm' })
    await expect(transcribeWithWhisper(blob, 'gsk_live')).resolves.toBeNull()
    expect(error).toHaveBeenCalled()
  })

  it('records the seconds it transcribed', async () => {
    installFetchMock([{ url: TRANSCRIBE_URL, method: 'POST', body: { text: 'hi', duration: 4 } }])
    const blob = new Blob([new Uint8Array(16)], { type: 'audio/webm' })
    await transcribeWithWhisper(blob, 'gsk_live')
    const usage = useSettings.getState().settings.aiUsage
    expect(usage.whisperRequests).toBe(1)
    expect(usage.whisperSeconds).toBe(4)
  })

  it('ignores a failure while recording the usage', async () => {
    const original = useSettings.getState().recordAiUsage
    useSettings.setState({
      recordAiUsage: () => {
        throw new Error('metrics storage is full')
      },
    })
    installFetchMock([{ url: TRANSCRIBE_URL, method: 'POST', body: { text: 'hi', duration: 2 } }])
    const blob = new Blob([new Uint8Array(16)], { type: 'audio/webm' })
    const result = await transcribeWithWhisper(blob, 'gsk_live')
    useSettings.setState({ recordAiUsage: original })
    expect(result?.text).toBe('hi')
  })
})
