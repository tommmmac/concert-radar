// Live check (npm run test:live): OpenStreetMap still models Cranbourne as
// a suburb of Melbourne, which the suburb + city search depends on.
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { geocodeCity, type GeocodedLocation } from './geocode'

describe('Nominatim search (live)', () => {
  let cranbourne: GeocodedLocation | null

  beforeAll(async () => {
    // Nominatim's usage policy asks automated clients to identify
    // themselves; browsers send their own User-Agent, but Node's is generic.
    const realFetch = globalThis.fetch
    vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) =>
      realFetch(input, {
        ...init,
        headers: { ...init?.headers, 'User-Agent': 'concert-radar-healthcheck (github.com/tommmmac/concert-radar)' },
      }),
    )
    cranbourne = await geocodeCity('Cranbourne', { lat: -37.81, lng: 144.96 })
  })

  afterAll(() => vi.unstubAllGlobals())

  it('resolves Cranbourne to the Melbourne suburb, labelled by its own name', () => {
    expect(cranbourne?.label).toBe('Cranbourne')
    expect(cranbourne?.lat).toBeCloseTo(-38.1, 0)
    expect(cranbourne?.lng).toBeCloseTo(145.28, 0)
  })

  it('still finds Melbourne as its parent city', () => {
    expect(cranbourne?.city?.label).toBe('Melbourne')
  })
})
