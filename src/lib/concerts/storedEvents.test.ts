import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchStoredConcerts } from './storedEvents'

function stubFetch(body: unknown, status = 200) {
  const fetchMock = vi.fn<typeof fetch>(async () => new Response(JSON.stringify(body), { status }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchStoredConcerts', () => {
  it('asks our own /api/events for the circle and returns its events', async () => {
    const events = [{ id: 'e1', name: 'Show', url: '#', date: '2026-10-01', venueName: 'Venue', lat: 1, lng: 2 }]
    const fetchMock = stubFetch({ events, updatedAt: '2026-09-29T19:00:00.000Z' })

    expect(await fetchStoredConcerts(-37.81, 144.96, 25)).toEqual(events)
    expect(String(fetchMock.mock.calls[0][0])).toBe('/api/events?lat=-37.81&lng=144.96&radius=25')
  })

  it('throws on an error response, so the caller can fall back to a live search', async () => {
    stubFetch({ error: 'DATABASE_URL is not set' }, 502)

    await expect(fetchStoredConcerts(0, 0, 25)).rejects.toThrow('502')
  })
})
