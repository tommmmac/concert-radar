import { describe, expect, it } from 'vitest'
import { isJustAnnounced } from './announced'

const NOW = new Date('2026-10-10T12:00:00Z')

describe('isJustAnnounced', () => {
  it('flags an event first seen within the last 7 days', () => {
    expect(isJustAnnounced({ announcedAt: '2026-10-09T19:00:00Z' }, NOW)).toBe(true)
    expect(isJustAnnounced({ announcedAt: '2026-10-03T12:00:01Z' }, NOW)).toBe(true)
  })

  it('stops flagging it once 7 days have passed', () => {
    expect(isJustAnnounced({ announcedAt: '2026-10-03T12:00:00Z' }, NOW)).toBe(false)
    expect(isJustAnnounced({ announcedAt: '2026-09-01T19:00:00Z' }, NOW)).toBe(false)
  })

  it('never flags an event without a first-seen time (baseline or live search)', () => {
    expect(isJustAnnounced({ announcedAt: null }, NOW)).toBe(false)
    expect(isJustAnnounced({}, NOW)).toBe(false)
  })
})
