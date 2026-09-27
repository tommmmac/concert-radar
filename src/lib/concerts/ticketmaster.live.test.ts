// Live check (npm run test:live): the real Discovery API still returns what
// fetchNearbyConcerts needs. Melbourne always has well over 20 shows listed.
import { beforeAll, describe, expect, it } from 'vitest'
import { distanceKm } from '../geocode'
import { fetchNearbyConcerts, type ConcertEvent } from './ticketmaster'

const MELBOURNE = { lat: -37.8136, lng: 144.9631 }

describe('Ticketmaster Discovery API (live)', () => {
  let events: ConcertEvent[]

  beforeAll(async () => {
    if (!import.meta.env.VITE_TICKETMASTER_API_KEY) {
      throw new Error('VITE_TICKETMASTER_API_KEY is not set (GitHub secret TICKETMASTER_API_KEY)')
    }
    events = await fetchNearbyConcerts(MELBOURNE.lat, MELBOURNE.lng)
  })

  it('finds plenty of Melbourne shows with venue coordinates', () => {
    // fetchNearbyConcerts drops events without venue coordinates, so a
    // renamed location field would show up here as a near-empty list.
    expect(events.length).toBeGreaterThanOrEqual(20)
  })

  it('gives every show an id, name and ticket link', () => {
    for (const event of events) {
      expect(event.id).toBeTruthy()
      expect(event.name).toBeTruthy()
      expect(event.url).toMatch(/^https:\/\//)
    }
  })

  it('still dates shows as YYYY-MM-DD (formatEventDate depends on it)', () => {
    const dated = events.filter((event) => event.date !== null)
    expect(dated.length).toBeGreaterThan(events.length / 2)
    for (const event of dated) expect(event.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('places venues where they are (numeric lat/lng, within the 25km search)', () => {
    for (const event of events) {
      expect(distanceKm(MELBOURNE, event)).toBeLessThan(30)
    }
  })
})
