// Live check (npm run test:live): the deployed /api/events answers from the
// database, and the daily ingest (.github/workflows/ingest.yml, an hour
// earlier) actually refreshed it. If the ingest quietly stops — a revoked
// key, a paused database, GitHub disabling the schedule — the site falls
// back to live Ticketmaster searches and looks fine, so this is what
// notices.
import { describe, expect, it } from 'vitest'
import type { StoredEventsResponse } from './storedEvents'

const SITE = 'https://concert-radar.com'
// Daily runs, plus slack for GitHub's delayed schedules.
const MAX_AGE_HOURS = 36

describe('Production /api/events (live)', () => {
  it('serves fresh Melbourne events from the database', async () => {
    // Edge-cached for an hour; a per-day extra param makes each run fresh.
    const check = new Date().toISOString().slice(0, 10)
    const res = await fetch(`${SITE}/api/events?lat=-37.8136&lng=144.9631&radius=25&check=${check}`)

    expect(res.status, await res.clone().text()).toBe(200)
    const data = (await res.json()) as StoredEventsResponse
    expect(data.events.length).toBeGreaterThan(20)
    expect(data.events[0]).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      venueName: expect.any(String),
      lat: expect.any(Number),
      lng: expect.any(Number),
    })

    const ageHours = (Date.now() - new Date(data.updatedAt ?? 0).getTime()) / 3_600_000
    expect(ageHours, `last ingest was ${ageHours.toFixed(1)}h ago`).toBeLessThan(MAX_AGE_HOURS)
  })
})
