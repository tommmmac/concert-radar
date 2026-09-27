import { afterEach, describe, expect, it, vi } from 'vitest'

// The API key is read when the module loads, so each test stubs the env
// and imports a fresh copy.
async function loadTicketmaster(apiKey = 'test-key') {
  vi.stubEnv('VITE_TICKETMASTER_API_KEY', apiKey)
  vi.resetModules()
  return import('./ticketmaster')
}

function stubFetch(body: unknown, status = 200) {
  const fetchMock = vi.fn<typeof fetch>(async () => new Response(JSON.stringify(body), { status }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function discoveryEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: 'ev1',
    name: 'Tash Sultana',
    url: 'https://ticketmaster.example/ev1',
    dates: { start: { localDate: '2026-12-05' } },
    _embedded: {
      venues: [{ name: 'Sidney Myer Music Bowl', location: { latitude: '-37.8281', longitude: '144.9789' } }],
    },
    ...overrides,
  }
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('fetchNearbyConcerts', () => {
  it('searches music events around the point, in km, soonest first', async () => {
    const fetchMock = stubFetch({})
    const { fetchNearbyConcerts } = await loadTicketmaster()

    await fetchNearbyConcerts(-37.81, 144.96, 50)

    const url = new URL(String(fetchMock.mock.calls[0][0]))
    expect(url.searchParams.get('apikey')).toBe('test-key')
    expect(url.searchParams.get('latlong')).toBe('-37.81,144.96')
    expect(url.searchParams.get('radius')).toBe('50')
    expect(url.searchParams.get('unit')).toBe('km')
    expect(url.searchParams.get('classificationName')).toBe('music')
    expect(url.searchParams.get('sort')).toBe('date,asc')
  })

  it('maps events to the fields the app uses, with numeric coordinates', async () => {
    stubFetch({ _embedded: { events: [discoveryEvent()] } })
    const { fetchNearbyConcerts } = await loadTicketmaster()

    expect(await fetchNearbyConcerts(0, 0)).toEqual([
      {
        id: 'ev1',
        name: 'Tash Sultana',
        url: 'https://ticketmaster.example/ev1',
        date: '2026-12-05',
        venueName: 'Sidney Myer Music Bowl',
        lat: -37.8281,
        lng: 144.9789,
      },
    ])
  })

  it('drops events whose venue has no coordinates, since they cannot go on the map', async () => {
    stubFetch({
      _embedded: {
        events: [
          discoveryEvent({ id: 'no-location', _embedded: { venues: [{ name: 'Somewhere' }] } }),
          discoveryEvent({ id: 'no-venue', _embedded: undefined }),
          discoveryEvent({ id: 'ok' }),
        ],
      },
    })
    const { fetchNearbyConcerts } = await loadTicketmaster()

    const events = await fetchNearbyConcerts(0, 0)
    expect(events.map((e) => e.id)).toEqual(['ok'])
  })

  it('leaves the date null when Ticketmaster has not set one', async () => {
    stubFetch({ _embedded: { events: [discoveryEvent({ dates: {} })] } })
    const { fetchNearbyConcerts } = await loadTicketmaster()

    const [event] = await fetchNearbyConcerts(0, 0)
    expect(event.date).toBeNull()
  })

  it('returns an empty list when nothing is on (no _embedded at all)', async () => {
    stubFetch({ page: { totalElements: 0 } })
    const { fetchNearbyConcerts } = await loadTicketmaster()

    expect(await fetchNearbyConcerts(0, 0)).toEqual([])
  })

  it('throws with the status on an API error', async () => {
    stubFetch({ fault: 'Rate limit quota violation' }, 429)
    const { fetchNearbyConcerts } = await loadTicketmaster()

    await expect(fetchNearbyConcerts(0, 0)).rejects.toThrow('429')
  })

  it.each(['', 'your_key_here'])('throws without calling the API when the key is %j', async (key) => {
    const fetchMock = stubFetch({})
    const { fetchNearbyConcerts } = await loadTicketmaster(key)

    await expect(fetchNearbyConcerts(0, 0)).rejects.toThrow('Missing VITE_TICKETMASTER_API_KEY')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
