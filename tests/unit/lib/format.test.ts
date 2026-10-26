import { describe, expect, it } from 'vitest'
import {
  clamp,
  formatClock,
  formatDate,
  formatDateTime,
  formatDuration,
  formatResponseEchoLines,
  percent,
  pluralize,
  roundTo,
  titleCase,
  validateResetPasswordForm,
} from '../../../src/lib/format'
import type { ItemResponse } from '../../../src/domain/types'

/* ---------------------------------------------------------------------------
   Presentation helpers: clocks, dates, and the echo of what the candidate
   answered.

   Two of them do real work beyond formatting. The reset-password check has to
   report the *first* thing that is wrong, in a form the UI can show as-is.
   The response echo has to describe whatever shape of answer came back —
   single choice, multiple choice, blanks, ordering, highlights, prose — and
   stay quiet about the parts the candidate never used.
   --------------------------------------------------------------------------- */

describe('clock formatting', () => {
  it('shows minutes and seconds below an hour', () => {
    expect(formatClock(65)).toBe('01:05')
  })

  it('pads both fields to two digits', () => {
    expect(formatClock(0)).toBe('00:00')
  })

  it('adds the hour once the clock passes an hour', () => {
    expect(formatClock(3661)).toBe('1:01:01')
  })

  it('shows a whole hour as hours, minutes and seconds', () => {
    expect(formatClock(3600)).toBe('1:00:00')
  })

  it('rounds a fractional number of seconds', () => {
    expect(formatClock(59.6)).toBe('01:00')
  })

  it('never shows a negative clock', () => {
    expect(formatClock(-10)).toBe('00:00')
  })
})

describe('duration formatting', () => {
  it('shows seconds below a minute', () => {
    expect(formatDuration(45000)).toBe('45s')
  })

  it('shows zero seconds as zero', () => {
    expect(formatDuration(0)).toBe('0s')
  })

  it('shows whole minutes without a seconds part', () => {
    expect(formatDuration(60000)).toBe('1m')
  })

  it('shows the leftover seconds alongside the minutes', () => {
    expect(formatDuration(90000)).toBe('1m 30s')
  })

  it('rounds to the nearest second before deciding the format', () => {
    expect(formatDuration(59900)).toBe('1m')
  })

  it('does not show a negative duration', () => {
    expect(formatDuration(-5000)).toBe('0s')
  })
})

describe('date formatting', () => {
  it('shows the day, the short month and the year', () => {
    const shown = formatDate('2024-03-05T12:00:00')
    expect(shown).toContain('2024')
    expect(shown).toContain('5')
    expect(shown).not.toContain('T12:00:00')
  })

  it('prefixes the time with the same date', () => {
    const stamp = formatDateTime('2024-03-05T14:07:00')
    expect(stamp.startsWith(`${formatDate('2024-03-05T14:07:00')}, `)).toBe(true)
  })

  it('shows the time as hours and minutes', () => {
    const time = formatDateTime('2024-03-05T14:07:00').split(', ').at(-1)
    expect(time).toMatch(/^\d{1,2}:\d{2}/)
  })

  it('shows a dash for a date it cannot parse, rather than throwing', () => {
    expect(formatDate('not-a-date')).toBe('—')
    expect(formatDateTime('not-a-date')).toBe('—')
  })
})

describe('pluralisation', () => {
  it('uses the singular for exactly one', () => {
    expect(pluralize(1, 'item')).toBe('1 item')
  })

  it('uses the plural for none', () => {
    expect(pluralize(0, 'item')).toBe('0 items')
  })

  it('uses the plural for more than one', () => {
    expect(pluralize(2, 'item')).toBe('2 items')
  })

  it('accepts an irregular plural', () => {
    expect(pluralize(2, 'mouse', 'mice')).toBe('2 mice')
  })
})

describe('clamping', () => {
  it('leaves a value inside the range alone', () => {
    expect(clamp(5, 0, 10)).toBe(5)
  })

  it('raises a value below the minimum', () => {
    expect(clamp(-1, 0, 10)).toBe(0)
  })

  it('lowers a value above the maximum', () => {
    expect(clamp(11, 0, 10)).toBe(10)
  })
})

describe('percentages', () => {
  it('expresses a part as a percentage of the whole', () => {
    expect(percent(1, 4)).toBe(25)
  })

  it('is zero for a part of nothing', () => {
    expect(percent(5, 0)).toBe(0)
  })

  it('is zero for a negative whole', () => {
    expect(percent(5, -10)).toBe(0)
  })

  it('never exceeds a hundred per cent', () => {
    expect(percent(20, 10)).toBe(100)
  })
})

describe('rounding to a step', () => {
  it('rounds down to the nearest step', () => {
    expect(roundTo(12.3, 5)).toBe(10)
  })

  it('rounds up to the nearest step', () => {
    expect(roundTo(13, 5)).toBe(15)
  })

  it('rounds to a fractional step', () => {
    expect(roundTo(12.4, 0.5)).toBe(12.5)
  })

  it('leaves a value already on a step alone', () => {
    expect(roundTo(7, 1)).toBe(7)
  })
})

describe('title casing', () => {
  it('capitalises each word', () => {
    expect(titleCase('hello world')).toBe('Hello World')
  })

  it('leaves the rest of each word as it was', () => {
    expect(titleCase('the PTE academic test')).toBe('The PTE Academic Test')
  })

  it('capitalises the letter after an apostrophe as well', () => {
    expect(titleCase("it's ready")).toBe("It'S Ready")
  })

  it('leaves an empty string empty', () => {
    expect(titleCase('')).toBe('')
  })
})

describe('reset password validation', () => {
  it('rejects a missing token', () => {
    expect(validateResetPasswordForm(null, 'longenough1', 'longenough1')).toEqual({
      valid: false,
      error: 'Missing or invalid reset token. Please request a new link.',
    })
  })

  it('rejects an undefined token', () => {
    expect(validateResetPasswordForm(undefined, 'longenough1', 'longenough1').valid).toBe(false)
  })

  it('rejects an empty token', () => {
    expect(validateResetPasswordForm('', 'longenough1', 'longenough1').valid).toBe(false)
  })

  it('complains about the token before anything else', () => {
    const result = validateResetPasswordForm(null, 'short', 'other')
    expect(result.error).toBe('Missing or invalid reset token. Please request a new link.')
  })

  it('rejects a password shorter than eight characters', () => {
    expect(validateResetPasswordForm('token', 'short', 'short')).toEqual({
      valid: false,
      error: 'Password must be at least 8 characters long.',
    })
  })

  it('rejects two passwords that differ', () => {
    expect(validateResetPasswordForm('token', 'longenough1', 'longenough2')).toEqual({
      valid: false,
      error: 'Passwords do not match.',
    })
  })

  it('accepts a token and two matching long enough passwords', () => {
    expect(validateResetPasswordForm('token', 'longenough1', 'longenough1')).toEqual({
      valid: true,
    })
  })
})

describe('response echo lines', () => {
  it('says nothing about an answer that was never given', () => {
    expect(formatResponseEchoLines({})).toEqual([])
  })

  it('echoes a single choice', () => {
    expect(formatResponseEchoLines({ choice: 'A' })).toEqual(['Your answer: A'])
  })

  it('echoes several choices', () => {
    expect(formatResponseEchoLines({ choices: ['A', 'B'] })).toEqual(['Your answers: A, B'])
  })

  it('says nothing about an empty list of choices', () => {
    expect(formatResponseEchoLines({ choices: [] })).toEqual([])
  })

  it('echoes the blanks, naming the ones left empty', () => {
    expect(formatResponseEchoLines({ blanks: ['first', null] })).toEqual([
      'Your answers: first, (blank 2)',
    ])
  })

  it('says nothing about an empty list of blanks', () => {
    expect(formatResponseEchoLines({ blanks: [] })).toEqual([])
  })

  it('echoes the order the blocks were placed in', () => {
    expect(formatResponseEchoLines({ order: ['a', 'b'] })).toEqual(['Your order: a → b'])
  })

  it('echoes an empty order as an empty line', () => {
    expect(formatResponseEchoLines({ order: [] })).toEqual(['Your order: '])
  })

  it('echoes the highlighted words by their text', () => {
    expect(formatResponseEchoLines({ highlighted: [1] }, ['the', 'cat'])).toEqual([
      'You highlighted: “cat”',
    ])
  })

  it('numbers the highlight when there is no token list to name it with', () => {
    expect(formatResponseEchoLines({ highlighted: [0] })).toEqual(['You highlighted: #1'])
  })

  it('numbers the highlight when the token list does not reach it', () => {
    expect(formatResponseEchoLines({ highlighted: [4] }, ['the', 'cat'])).toEqual([
      'You highlighted: #5',
    ])
  })

  it('says nothing about an empty list of highlights', () => {
    expect(formatResponseEchoLines({ highlighted: [] })).toEqual([])
  })

  it('echoes what the candidate wrote', () => {
    expect(formatResponseEchoLines({ text: 'my essay' })).toEqual(['You wrote: my essay'])
  })

  it('echoes the transcript of a spoken answer', () => {
    expect(formatResponseEchoLines({ transcript: 'spoken words' })).toEqual([
      'Your answer (transcribed): spoken words',
    ])
  })

  it('echoes every part of a response that used them all', () => {
    const response: ItemResponse = {
      choice: 'A',
      choices: ['B', 'C'],
      blanks: ['one', null],
      order: ['x', 'y'],
      highlighted: [0, 1],
      text: 'written',
      transcript: 'spoken',
    }
    expect(formatResponseEchoLines(response, ['alpha', 'beta'])).toEqual([
      'Your answer: A',
      'Your answers: B, C',
      'Your answers: one, (blank 2)',
      'Your order: x → y',
      'You highlighted: “alpha”, “beta”',
      'You wrote: written',
      'Your answer (transcribed): spoken',
    ])
  })
})
