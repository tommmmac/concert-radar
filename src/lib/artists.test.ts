import { describe, expect, it } from 'vitest'
import { groupByArtist } from './artists'
import type { ConcertEvent } from './ticketmaster'

function makeEvent(overrides: Partial<ConcertEvent>): ConcertEvent {
  return {
    id: 'evt-1',
    name: 'Some Artist',
    url: 'https://example.com',
    date: '2026-01-01',
    venueName: 'Some Venue',
    lat: -37.8136,
    lng: 144.9631,
    ...overrides,
  }
}

describe('groupByArtist', () => {
  it('returns one group per distinct artist name', () => {
    const events = [makeEvent({ id: '1', name: 'Home Brew' }), makeEvent({ id: '2', name: 'The Cribs' })]

    const groups = groupByArtist(events)

    expect(groups).toHaveLength(2)
  })

  it('merges multiple listings for the same artist into one group', () => {
    const events = [
      makeEvent({ id: '1', name: 'Home Brew', date: '2026-10-08' }),
      makeEvent({ id: '2', name: 'Home Brew', date: '2026-10-15' }),
    ]

    const groups = groupByArtist(events)

    expect(groups).toHaveLength(1)
    expect(groups[0].events).toHaveLength(2)
    expect(groups[0].events.map((e) => e.date)).toEqual(['2026-10-08', '2026-10-15'])
  })

  it('returns an empty array for no events', () => {
    expect(groupByArtist([])).toEqual([])
  })
})
