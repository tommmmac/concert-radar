import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { distanceKm, parentCityQuery, placeLabel, viewboxAround } from './geocode'

describe('placeLabel', () => {
  it("uses the place's own name", () => {
    expect(
      placeLabel({
        lat: '-38.1',
        lon: '145.28',
        name: 'Cranbourne',
        display_name: 'Cranbourne, Melbourne, Victoria, 3977, Australia',
        address: { suburb: 'Cranbourne', city: 'Melbourne' },
      }),
    ).toBe('Cranbourne')
  })

  it('falls back to the most local address part when there is no name', () => {
    expect(
      placeLabel({
        lat: '0',
        lon: '0',
        display_name: 'Somewhere, Some City, Some State',
        address: { town: 'Sometown', city: 'Some City' },
      }),
    ).toBe('Sometown')
  })

  it('falls back to the first part of display_name as a last resort', () => {
    expect(placeLabel({ lat: '0', lon: '0', display_name: 'Fitzroy, Melbourne, Victoria' })).toBe('Fitzroy')
  })
})

describe('viewboxAround', () => {
  it('returns left,top,right,bottom around the point', () => {
    expect(viewboxAround({ lat: -37.8, lng: 145 })).toBe('143,-35.8,147,-39.8')
  })

  it('rounds to 0.1° so precise coordinates are never sent', () => {
    expect(viewboxAround({ lat: -38.11054, lng: 145.28329 })).toBe('143.3,-36.1,147.3,-40.1')
  })
})

describe('parentCityQuery', () => {
  const base = { lat: '0', lon: '0', display_name: '' }

  it('builds a query for an outer suburb of a bigger city', () => {
    expect(
      parentCityQuery({
        ...base,
        name: 'Cranbourne',
        address: { suburb: 'Cranbourne', city: 'Melbourne', state: 'Victoria', country: 'Australia' },
      }),
    ).toBe('Melbourne, Victoria, Australia')
  })

  it('returns null when the place is the city itself', () => {
    expect(parentCityQuery({ ...base, name: 'Geelong', address: { city: 'Geelong', state: 'Victoria' } })).toBeNull()
  })

  it('returns null when there is no parent city', () => {
    expect(parentCityQuery({ ...base, name: 'Lorne', address: { town: 'Lorne', state: 'Victoria' } })).toBeNull()
  })
})

describe('distanceKm', () => {
  it('matches the known Cranbourne → Melbourne CBD distance (~40km)', () => {
    const km = distanceKm({ lat: -38.108, lng: 145.283 }, { lat: -37.814, lng: 144.963 })
    expect(km).toBeGreaterThan(40)
    expect(km).toBeLessThan(45)
  })

  it('is ~0 for the same point', () => {
    expect(distanceKm({ lat: -37.8, lng: 145 }, { lat: -37.8, lng: 145 })).toBeCloseTo(0)
  })
})

describe('geocodeCity', () => {
  const MELBOURNE_QUERY = 'Melbourne, Victoria, Australia'

  const MELBOURNE = {
    lat: '-37.8142',
    lon: '144.9632',
    name: 'Melbourne',
    display_name: 'Melbourne, Victoria, Australia',
    address: { city: 'Melbourne', state: 'Victoria', country: 'Australia' },
  }

  function melbourneSuburb(name: string, lat: string, lon: string) {
    return {
      lat,
      lon,
      name,
      display_name: `${name}, Melbourne, Victoria, Australia`,
      address: { suburb: name, city: 'Melbourne', state: 'Victoria', country: 'Australia' },
    }
  }

  const CRANBOURNE = melbourneSuburb('Cranbourne', '-38.0996', '145.2834') // ~40km out
  const PAKENHAM = melbourneSuburb('Pakenham', '-38.0712', '145.4878') // ~55km out
  const FITZROY = melbourneSuburb('Fitzroy', '-37.7984', '144.9784') // ~2km out

  /** Fakes Nominatim, answering by the `q` param; 'error' returns a 503. */
  function stubNominatim(answers: Record<string, unknown[] | 'error'>) {
    const fetchMock = vi.fn<typeof fetch>(async (input) => {
      const answer = answers[new URL(String(input)).searchParams.get('q') ?? '']
      return answer === 'error' ? new Response('', { status: 503 }) : new Response(JSON.stringify(answer ?? []))
    })
    vi.stubGlobal('fetch', fetchMock)
    return fetchMock
  }

  const searchedFor = (fetchMock: ReturnType<typeof stubNominatim>) =>
    fetchMock.mock.calls.map(([input]) => new URL(String(input)).searchParams.get('q'))

  // The parent-city cache lives at module level, so each test gets a fresh copy.
  async function loadGeocode() {
    vi.resetModules()
    return import('./geocode')
  }

  /** Runs a lookup to completion, skipping the 1s rate-limit pause. */
  async function settle<T>(promise: Promise<T>): Promise<T> {
    await vi.runAllTimersAsync()
    return promise
  }

  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('asks for English-named settlements only, biased around the current area', async () => {
    const fetchMock = stubNominatim({ Melbourne: [MELBOURNE] })
    const { geocodeCity } = await loadGeocode()
    const near = { lat: -37.81, lng: 144.96 }

    await settle(geocodeCity('Melbourne', near))

    const params = new URL(String(fetchMock.mock.calls[0][0])).searchParams
    expect(params.get('featureType')).toBe('settlement')
    expect(params.get('accept-language')).toBe('en')
    expect(params.get('addressdetails')).toBe('1')
    expect(params.get('limit')).toBe('1')
    expect(params.get('viewbox')).toBe(viewboxAround(near))
  })

  it('sends no viewbox when there is no current area', async () => {
    const fetchMock = stubNominatim({ Melbourne: [MELBOURNE] })
    const { geocodeCity } = await loadGeocode()

    await settle(geocodeCity('Melbourne'))

    expect(new URL(String(fetchMock.mock.calls[0][0])).searchParams.has('viewbox')).toBe(false)
  })

  it('returns a city on its own, with no second lookup', async () => {
    const fetchMock = stubNominatim({ Melbourne: [MELBOURNE] })
    const { geocodeCity } = await loadGeocode()

    const result = await settle(geocodeCity('Melbourne'))

    expect(result).toEqual({ lat: -37.8142, lng: 144.9632, label: 'Melbourne', city: undefined })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('attaches the parent city for an outer suburb', async () => {
    const fetchMock = stubNominatim({ Cranbourne: [CRANBOURNE], [MELBOURNE_QUERY]: [MELBOURNE] })
    const { geocodeCity } = await loadGeocode()

    const result = await settle(geocodeCity('Cranbourne'))

    expect(result).toEqual({
      lat: -38.0996,
      lng: 145.2834,
      label: 'Cranbourne',
      city: { lat: -37.8142, lng: 144.9632, label: 'Melbourne' },
    })
    expect(searchedFor(fetchMock)).toEqual(['Cranbourne', MELBOURNE_QUERY])
  })

  it('leaves out the city for an inner suburb (under 15km), where one search covers both', async () => {
    stubNominatim({ Fitzroy: [FITZROY], [MELBOURNE_QUERY]: [MELBOURNE] })
    const { geocodeCity } = await loadGeocode()

    const result = await settle(geocodeCity('Fitzroy'))

    expect(result?.label).toBe('Fitzroy')
    expect(result?.city).toBeUndefined()
  })

  it('waits a second before the city lookup, per Nominatim’s 1 request/sec policy', async () => {
    const fetchMock = stubNominatim({ Cranbourne: [CRANBOURNE], [MELBOURNE_QUERY]: [MELBOURNE] })
    const { geocodeCity } = await loadGeocode()

    const pending = geocodeCity('Cranbourne')
    await vi.advanceTimersByTimeAsync(999)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(1)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    await pending
  })

  it('looks each city up once per session, however many of its suburbs are searched', async () => {
    const fetchMock = stubNominatim({
      Cranbourne: [CRANBOURNE],
      Pakenham: [PAKENHAM],
      [MELBOURNE_QUERY]: [MELBOURNE],
    })
    const { geocodeCity } = await loadGeocode()

    await settle(geocodeCity('Cranbourne'))
    const pakenham = await settle(geocodeCity('Pakenham'))

    expect(pakenham?.city?.label).toBe('Melbourne')
    expect(searchedFor(fetchMock)).toEqual(['Cranbourne', MELBOURNE_QUERY, 'Pakenham'])
  })

  it('still returns the suburb if the city lookup fails', async () => {
    stubNominatim({ Cranbourne: [CRANBOURNE], [MELBOURNE_QUERY]: 'error' })
    const { geocodeCity } = await loadGeocode()

    const result = await settle(geocodeCity('Cranbourne'))

    expect(result).toMatchObject({ label: 'Cranbourne', city: undefined })
  })

  it('returns null when nothing matches', async () => {
    const fetchMock = stubNominatim({})
    const { geocodeCity } = await loadGeocode()

    expect(await settle(geocodeCity('Nowhereville'))).toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('throws a user-facing message when the search itself fails', async () => {
    stubNominatim({ Cranbourne: 'error' })
    const { geocodeCity } = await loadGeocode()

    // Fails on the first request, before any timer — so no settle(), which
    // would let the rejection go unhandled while timers run.
    await expect(geocodeCity('Cranbourne')).rejects.toThrow('Location search failed. Try again.')
  })
})
