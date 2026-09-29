import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchNearbyConcerts } from './ticketmaster'

// The Ticketmaster call and parsing are tested server-side
// (api/_ticketmaster-search.test.ts); this is just the browser's side.

function stubFetch(body: unknown, status = 200) {
  const fetchMock = vi.fn<typeof fetch>(async () => new Response(JSON.stringify(body), { status }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchNearbyConcerts', () => {
  it('asks our own /api function (never Ticketmaster directly), 25km by default', async () => {
    const fetchMock = stubFetch({ events: [] })

    await fetchNearbyConcerts(-37.81, 144.96)
    await fetchNearbyConcerts(-37.81, 144.96, 50)

    expect(String(fetchMock.mock.calls[0][0])).toBe('/api/ticketmaster-search?lat=-37.81&lng=144.96&radius=25')
    expect(String(fetchMock.mock.calls[1][0])).toBe('/api/ticketmaster-search?lat=-37.81&lng=144.96&radius=50')
  })

  it("returns the function's events", async () => {
    const events = [{ id: 'e1', name: 'Show', url: '#', date: '2026-10-01', venueName: 'Venue', lat: 1, lng: 2 }]
    stubFetch({ events })

    expect(await fetchNearbyConcerts(0, 0)).toEqual(events)
  })

  it('throws with the status on an error, so the page can show it', async () => {
    stubFetch({ error: 'Ticketmaster API error: 429' }, 502)

    await expect(fetchNearbyConcerts(0, 0)).rejects.toThrow('502')
  })
})
