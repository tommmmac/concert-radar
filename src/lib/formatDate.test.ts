import { describe, expect, it } from 'vitest'
import { formatEventDate, ordinal } from './formatDate'

describe('ordinal', () => {
  it('uses st/nd/rd/th by last digit', () => {
    expect([1, 2, 3, 4, 21, 22, 23, 24, 31].map(ordinal)).toEqual([
      '1st',
      '2nd',
      '3rd',
      '4th',
      '21st',
      '22nd',
      '23rd',
      '24th',
      '31st',
    ])
  })

  it('uses th for 11, 12 and 13', () => {
    expect([11, 12, 13].map(ordinal)).toEqual(['11th', '12th', '13th'])
  })
})

describe('formatEventDate', () => {
  it('formats a Ticketmaster localDate in full', () => {
    expect(formatEventDate('2026-09-25')).toBe('Friday 25th September 2026')
    expect(formatEventDate('2026-10-01')).toBe('Thursday 1st October 2026')
  })

  it('falls back to Date TBA when there is no date', () => {
    expect(formatEventDate(null)).toBe('Date TBA')
  })

  it('returns unparseable input unchanged', () => {
    expect(formatEventDate('soon')).toBe('soon')
  })
})
