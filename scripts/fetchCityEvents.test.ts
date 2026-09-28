import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchCityEvents } from './fetchCityEvents.js'

const MELBOURNE = { slug: 'melbourne', name: 'Melbourne', lat: -37.8136, lng: 144.9631 }
const NOW = new Date('2026-09-29T00:00:00.000Z')
const noSleep = async () => {}

function tmEvent(id: string) {
  return {
    id,
    name: id,
    url: `https://ticketmaster.example/${id}`,
    dates: { start: { localDate: '2026-10-01' } },
    _embedded: { venues: [{ name: 'Venue', location: { latitude: '-37.8', longitude: '144.9' } }] },
  }
}

function page(ids: string[], totalElements: number, totalPages: number, number = 0) {
  return { _embedded: { events: ids.map(tmEvent) }, page: { size: 200, totalElements, totalPages, number } }
}

type Responder = (params: URLSearchParams) => Response | unknown

/** Fakes Ticketmaster: each request's query params → a JSON body (or a raw Response). */
function stubTicketmaster(respond: Responder) {
  const fetchMock = vi.fn<typeof fetch>(async (input) => {
    const result = respond(new URL(String(input)).searchParams)
    return result instanceof Response ? result : new Response(JSON.stringify(result))
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

const requested = (fetchMock: ReturnType<typeof stubTicketmaster>) =>
  fetchMock.mock.calls.map(([input]) => new URL(String(input)).searchParams)

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('fetchCityEvents', () => {
  it('searches 50km of music around the city, two years ahead, in whole seconds', async () => {
    const fetchMock = stubTicketmaster(() => page(['a'], 1, 1))

    await fetchCityEvents(MELBOURNE, { apiKey: 'key', sleep: noSleep, now: NOW })

    const [params] = requested(fetchMock)
    expect(params.get('apikey')).toBe('key')
    expect(params.get('latlong')).toBe('-37.8136,144.9631')
    expect(params.get('radius')).toBe('50')
    expect(params.get('classificationName')).toBe('music')
    expect(params.get('startDateTime')).toBe('2026-09-29T00:00:00Z')
    expect(params.get('endDateTime')).toBe('2028-09-28T00:00:00Z')
  })

  it('pages through every result, not just the first 200', async () => {
    const fetchMock = stubTicketmaster((params) => {
      const n = Number(params.get('page'))
      return page([`p${n}-a`, `p${n}-b`], 450, 3, n)
    })

    const events = await fetchCityEvents(MELBOURNE, { apiKey: 'key', sleep: noSleep, now: NOW })

    expect(requested(fetchMock).map((p) => p.get('page'))).toEqual(['0', '1', '2'])
    expect(events.map((e) => e.id)).toEqual(['p0-a', 'p0-b', 'p1-a', 'p1-b', 'p2-a', 'p2-b'])
  })

  it('splits a date range with more than 1,000 results in half, so nothing is lost to the paging limit', async () => {
    const fullRange = '2026-09-29T00:00:00Z'
    const fetchMock = stubTicketmaster((params) => {
      const isFullRange = params.get('startDateTime') === fullRange && params.get('endDateTime') === '2028-09-28T00:00:00Z'
      return isFullRange ? page([], 1500, 8) : page([`in-${params.get('startDateTime')}`], 750, 1)
    })

    const events = await fetchCityEvents(MELBOURNE, { apiKey: 'key', sleep: noSleep, now: NOW })

    const windows = requested(fetchMock).map((p) => [p.get('startDateTime'), p.get('endDateTime')])
    expect(windows).toEqual([
      ['2026-09-29T00:00:00Z', '2028-09-28T00:00:00Z'],
      ['2026-09-29T00:00:00Z', '2027-09-29T00:00:00Z'],
      ['2027-09-29T00:00:00Z', '2028-09-28T00:00:00Z'],
    ])
    expect(events).toHaveLength(2)
  })

  it('lists an event once even when it turns up in two windows or pages', async () => {
    stubTicketmaster((params) => page(['dup', `only-${params.get('page')}`], 400, 2, Number(params.get('page'))))

    const events = await fetchCityEvents(MELBOURNE, { apiKey: 'key', sleep: noSleep, now: NOW })

    expect(events.map((e) => e.id)).toEqual(['dup', 'only-0', 'only-1'])
  })

  it('waits between requests to stay under the 5-per-second limit', async () => {
    stubTicketmaster(() => page(['a'], 1, 1))
    const sleep = vi.fn(noSleep)

    await fetchCityEvents(MELBOURNE, { apiKey: 'key', sleep, now: NOW })

    expect(sleep).toHaveBeenCalledWith(250)
  })

  it('backs off and retries when rate-limited (429)', async () => {
    let calls = 0
    stubTicketmaster(() => (++calls === 1 ? new Response('', { status: 429 }) : page(['a'], 1, 1)))

    const events = await fetchCityEvents(MELBOURNE, { apiKey: 'key', sleep: noSleep, now: NOW })

    expect(events.map((e) => e.id)).toEqual(['a'])
  })

  it('throws on other errors, so the ingest keeps that city\'s existing data', async () => {
    stubTicketmaster(() => new Response('', { status: 401 }))

    await expect(fetchCityEvents(MELBOURNE, { apiKey: 'bad', sleep: noSleep, now: NOW })).rejects.toThrow(
      'Ticketmaster 401 for Melbourne',
    )
  })
})
