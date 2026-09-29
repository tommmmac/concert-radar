// Named with a leading underscore (not ticketmaster-search.test.ts) because
// Vercel deploys every other file in api/ as a serverless route.
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { afterEach, describe, expect, it, vi } from 'vitest'
import handler from './ticketmaster-search.js'

function stubTicketmaster(body: unknown, status = 200) {
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

/** Just enough of VercelResponse to record what the handler sent. */
function fakeResponse() {
  const sent = { status: 0, body: undefined as unknown, headers: {} as Record<string, string> }
  const res = {
    status(code: number) {
      sent.status = code
      return res
    },
    json(body: unknown) {
      sent.body = body
      return res
    },
    setHeader(name: string, value: string) {
      sent.headers[name] = value
      return res
    },
  }
  return { res: res as unknown as VercelResponse, sent }
}

async function search(query: Record<string, string> = { lat: '-37.81', lng: '144.96', radius: '25' }) {
  const { res, sent } = fakeResponse()
  await handler({ query } as unknown as VercelRequest, res)
  return sent
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('GET /api/ticketmaster-search', () => {
  it('searches music events around the point with the server-side key, soonest first', async () => {
    vi.stubEnv('TICKETMASTER_API_KEY', 'server-key')
    const fetchMock = stubTicketmaster({})

    await search({ lat: '-37.81', lng: '144.96', radius: '50' })

    const url = new URL(String(fetchMock.mock.calls[0][0]))
    expect(url.origin + url.pathname).toBe('https://app.ticketmaster.com/discovery/v2/events.json')
    expect(url.searchParams.get('apikey')).toBe('server-key')
    expect(url.searchParams.get('latlong')).toBe('-37.81,144.96')
    expect(url.searchParams.get('radius')).toBe('50')
    expect(url.searchParams.get('unit')).toBe('km')
    expect(url.searchParams.get('classificationName')).toBe('music')
    expect(url.searchParams.get('sort')).toBe('date,asc')
  })

  it('returns only the parsed fields, edge-cached for an hour, and never the key', async () => {
    vi.stubEnv('TICKETMASTER_API_KEY', 'server-key')
    stubTicketmaster({ _embedded: { events: [discoveryEvent()] } })

    const sent = await search()

    expect(sent.status).toBe(200)
    expect(sent.body).toEqual({
      events: [
        {
          id: 'ev1',
          name: 'Tash Sultana',
          url: 'https://ticketmaster.example/ev1',
          date: '2026-12-05',
          venueName: 'Sidney Myer Music Bowl',
          lat: -37.8281,
          lng: 144.9789,
          genre: null,
          artistName: null,
        },
      ],
    })
    expect(JSON.stringify(sent.body)).not.toContain('server-key')
    expect(sent.headers['Cache-Control']).toMatch(/s-maxage=3600/)
  })

  it('drops events whose venue has no coordinates, since they cannot go on the map', async () => {
    vi.stubEnv('TICKETMASTER_API_KEY', 'server-key')
    stubTicketmaster({
      _embedded: {
        events: [
          discoveryEvent({ id: 'no-location', _embedded: { venues: [{ name: 'Somewhere' }] } }),
          discoveryEvent({ id: 'no-venue', _embedded: undefined }),
          discoveryEvent({ id: 'ok', dates: {} }),
        ],
      },
    })

    const sent = await search()

    const events = (sent.body as { events: Array<{ id: string; date: string | null }> }).events
    expect(events.map((e) => e.id)).toEqual(['ok'])
    expect(events[0].date).toBeNull()
  })

  it('returns an empty list when nothing is on (no _embedded at all)', async () => {
    vi.stubEnv('TICKETMASTER_API_KEY', 'server-key')
    stubTicketmaster({ page: { totalElements: 0 } })

    expect((await search()).body).toEqual({ events: [] })
  })

  it('answers 502 with the status when Ticketmaster fails (e.g. over quota)', async () => {
    vi.stubEnv('TICKETMASTER_API_KEY', 'server-key')
    stubTicketmaster({ fault: 'Rate limit quota violation' }, 429)

    const sent = await search()

    expect(sent.status).toBe(502)
    expect(sent.body).toEqual({ error: 'Ticketmaster API error: 429' })
  })

  it('answers 500 without calling Ticketmaster when the key is not configured', async () => {
    vi.stubEnv('TICKETMASTER_API_KEY', '')
    const fetchMock = stubTicketmaster({})

    expect((await search()).status).toBe(500)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects a bad search circle without calling Ticketmaster', async () => {
    vi.stubEnv('TICKETMASTER_API_KEY', 'server-key')
    const fetchMock = stubTicketmaster({})

    expect((await search({ lat: '-37.8', lng: '144.9', radius: '5000' })).status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
