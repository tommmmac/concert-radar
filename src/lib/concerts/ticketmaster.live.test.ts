// Live check (npm run test:live): the deployed site's live search works end
// to end — Vercel is up, its TICKETMASTER_API_KEY is set, and the real
// Discovery API still returns what the app needs. Melbourne always has well
// over 20 shows listed. No Ticketmaster key is needed here.
import { beforeAll, describe, expect, it } from 'vitest'
import { distanceKm } from '../geocode'
import type { ConcertEvent } from './ticketmaster'

const SITE = 'https://concert-radar.com'
const MELBOURNE = { lat: -37.8136, lng: 144.9631 }

describe('Production /api/ticketmaster-search (live)', () => {
  let events: ConcertEvent[]

  beforeAll(async () => {
    // The response is edge-cached for an hour; a per-day extra param
    // (ignored by the function) makes each daily run a fresh search.
    const check = new Date().toISOString().slice(0, 10)
    const res = await fetch(
      `${SITE}/api/ticketmaster-search?lat=${MELBOURNE.lat}&lng=${MELBOURNE.lng}&radius=25&check=${check}`,
    )
    if (!res.ok) throw new Error(`/api/ticketmaster-search: ${res.status} ${await res.text()}`)
    events = ((await res.json()) as { events: ConcertEvent[] }).events
  })

  it('finds plenty of Melbourne shows with venue coordinates', () => {
    // Events without venue coordinates are dropped, so a renamed location
    // field would show up here as a near-empty list.
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
