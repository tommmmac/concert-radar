import { describe, expect, it } from 'vitest'
import { groupByVenue } from './venues'
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

describe('groupByVenue', () => {
  it('returns one group per distinct venue location', () => {
    const events = [
      makeEvent({ id: '1', lat: -37.8136, lng: 144.9631 }),
      makeEvent({ id: '2', lat: -37.8000, lng: 144.9700 }),
    ]

    const groups = groupByVenue(events)

    expect(groups).toHaveLength(2)
  })

  it('merges multiple events at the same coordinates into one group', () => {
    const events = [
      makeEvent({ id: '1', venueName: 'The Night Cat', lat: -37.7982, lng: 144.9862 }),
      makeEvent({ id: '2', venueName: 'The Night Cat', lat: -37.7982, lng: 144.9862 }),
      makeEvent({ id: '3', venueName: 'The Night Cat', lat: -37.7982, lng: 144.9862 }),
    ]

    const groups = groupByVenue(events)

    expect(groups).toHaveLength(1)
    expect(groups[0].events).toHaveLength(3)
    expect(groups[0].events.map((e) => e.id)).toEqual(['1', '2', '3'])
  })

  it('merges venues with tiny coordinate jitter (rounded to 4 decimal places)', () => {
    const events = [
      makeEvent({ id: '1', lat: -37.81361, lng: 144.96309 }),
      makeEvent({ id: '2', lat: -37.81362, lng: 144.96311 }),
    ]

    const groups = groupByVenue(events)

    expect(groups).toHaveLength(1)
    expect(groups[0].events).toHaveLength(2)
  })

  it('returns an empty array for no events', () => {
    expect(groupByVenue([])).toEqual([])
  })
})
