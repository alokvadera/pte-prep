import { describe, expect, it } from 'vitest'
import { ABOUT_FAQ, HOME_FAQ } from '../../../src/content/faq'
import type { FaqEntry } from '../../../src/content/faq'

/* ---------------------------------------------------------------------------
   Shared FAQ copy.

   The same arrays feed the visible accordion and the FAQPage JSON-LD, so a
   question that is empty or duplicated on the page is a question that is
   broken in the markup too.
   --------------------------------------------------------------------------- */

const FAQ_SETS: Array<[string, FaqEntry[]]> = [
  ['HOME_FAQ', HOME_FAQ],
  ['ABOUT_FAQ', ABOUT_FAQ],
]

describe('the FAQ sets', () => {
  it('are not empty', () => {
    expect(HOME_FAQ.length).toBeGreaterThanOrEqual(6)
    expect(ABOUT_FAQ.length).toBeGreaterThanOrEqual(6)
  })

  it('give every entry a question and an answer', () => {
    for (const [name, entries] of FAQ_SETS) {
      for (const entry of entries) {
        expect(entry.question, name).toBeTypeOf('string')
        expect(entry.question.trim(), name).not.toBe('')
        expect(entry.answer, name).toBeTypeOf('string')
        expect(entry.answer.trim(), name).not.toBe('')
        expect(entry.answer.length, `${name}: ${entry.question}`).toBeGreaterThan(40)
        expect(entry.question.endsWith('?'), `${name}: ${entry.question}`).toBe(true)
      }
    }
  })

  it('never repeat a question', () => {
    for (const [name, entries] of FAQ_SETS) {
      const questions = entries.map((e) => e.question)
      expect(new Set(questions).size, name).toBe(questions.length)
    }
  })

  it('never repeat an answer', () => {
    for (const [name, entries] of FAQ_SETS) {
      const answers = entries.map((e) => e.answer)
      expect(new Set(answers).size, name).toBe(answers.length)
    }
  })
})

describe('HOME_FAQ', () => {
  it('answers the questions the landing page raises', () => {
    const questions = HOME_FAQ.map((e) => e.question)
    expect(questions).toContain('Is this PTE mock test really free?')
    expect(questions).toContain('Do I need a microphone?')
    expect(questions).toContain('Do I need to create an account?')
    expect(questions).toContain('Does it work offline?')
  })

  it('says the test is free and needs no account', () => {
    const free = HOME_FAQ.find((e) => e.question === 'Is this PTE mock test really free?')!
    expect(free.answer).toContain('no payment step')
    expect(free.answer).toContain('no limit on how many mock tests')

    const account = HOME_FAQ.find((e) => e.question === 'Do I need to create an account?')!
    expect(account.answer).toContain('no sign up')
  })

  it('is honest about how the scores are produced', () => {
    const accuracy = HOME_FAQ.find((e) => e.question === 'How accurate are the scores here?')!
    expect(accuracy.answer).toContain('practice estimates, not official Pearson scores')
  })
})

describe('ABOUT_FAQ', () => {
  it('states the relationship with Pearson', () => {
    const affiliation = ABOUT_FAQ.find(
      (e) => e.question === 'Is this site affiliated with Pearson?',
    )!
    expect(affiliation.answer).toContain('No.')
    expect(affiliation.answer).toContain('independent practice tool')
  })

  it('explains where the material comes from', () => {
    const material = ABOUT_FAQ.find(
      (e) => e.question === 'Where does the practice material come from?',
    )!
    expect(material.answer).toContain('written specifically for it')
    expect(material.answer).toContain('copyright')
  })

  it('explains where the data is stored', () => {
    const data = ABOUT_FAQ.find((e) => e.question === 'Where is my data stored?')!
    expect(data.answer).toContain('IndexedDB')
    expect(data.answer).toContain('no analytics')
  })
})
