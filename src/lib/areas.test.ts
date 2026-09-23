import { describe, expect, it } from 'vitest'
import { mergeAreaEvents } from './areas'
import type { ConcertEvent } from './ticketmaster'

function event(id: string, date: string | null): ConcertEvent {
  return { id, name: id, url: '#', date, venueName: 'Venue', lat: 0, lng: 0 }
}

describe('mergeAreaEvents', () => {
  it('tags each event with the search that found it', () => {
    const merged = mergeAreaEvents([event('a', '2026-10-01')], [event('b', '2026-10-02')])
    expect(merged.map((e) => [e.id, e.area])).toEqual([
      ['a', 'local'],
      ['b', 'city'],
    ])
  })

  it('keeps an event found by both searches once, as local', () => {
    const merged = mergeAreaEvents([event('a', '2026-10-01')], [event('a', '2026-10-01')])
    expect(merged).toHaveLength(1)
    expect(merged[0].area).toBe('local')
  })

  it('sorts by date across both areas, undated last', () => {
    const merged = mergeAreaEvents(
      [event('late', '2026-12-01'), event('tba', null)],
      [event('early', '2026-10-01')],
    )
    expect(merged.map((e) => e.id)).toEqual(['early', 'late', 'tba'])
  })
})
