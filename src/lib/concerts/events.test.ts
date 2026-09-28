import { afterEach, describe, expect, it, vi } from 'vitest'
import type { GeocodedLocation } from '../geocode'
import type { ConcertEvent } from './ticketmaster'
import { MOCK_EVENTS } from './mockEvents'

// These tests cover which searches getNearbyConcerts runs, not the HTTP
// call itself (ticketmaster.test.ts does that), so Ticketmaster is mocked
// at the module level. vi.hoisted keeps one mock across module resets.
const fetchNearbyConcerts = vi.hoisted(() => vi.fn<(lat: number, lng: number, radiusKm?: number) => Promise<ConcertEvent[]>>())
vi.mock('./ticketmaster', () => ({ fetchNearbyConcerts }))

// Whether a search is answered from the database depends on the real city
// list, so it's mocked too: off by default (the live-search tests below),
// switched on per test in "preloaded cities".
const isCovered = vi.hoisted(() => vi.fn<(lat: number, lng: number, radiusKm: number) => boolean>(() => false))
vi.mock('./coverage', () => ({ isCovered }))
const fetchStoredConcerts = vi.hoisted(() => vi.fn<(lat: number, lng: number, radiusKm: number) => Promise<ConcertEvent[]>>())
vi.mock('./storedEvents', () => ({ fetchStoredConcerts }))

// USE_MOCK_DATA is read when the module loads — and .env may set it — so
// every test pins it explicitly and imports a fresh copy.
async function loadEvents({ mockData = false } = {}) {
  vi.stubEnv('VITE_USE_MOCK_DATA', String(mockData))
  vi.resetModules()
  return import('./events')
}

function event(id: string, date: string | null = '2026-10-01'): ConcertEvent {
  return { id, name: id, url: '#', date, venueName: 'Venue', lat: 0, lng: 0 }
}

/** `count` distinct events, e.g. shows(3, 'a') → a-0, a-1, a-2. */
const shows = (count: number, prefix: string) => Array.from({ length: count }, (_, i) => event(`${prefix}-${i}`))

/** Answers each search radius with its own list; the city-free default is 25km. */
function eventsByRadius(byRadius: Record<number, ConcertEvent[]>) {
  fetchNearbyConcerts.mockImplementation(async (_lat, _lng, radiusKm = 25) => byRadius[radiusKm] ?? [])
}

const radiiSearched = () => fetchNearbyConcerts.mock.calls.map(([, , radiusKm]) => radiusKm)

const EVANSTON: GeocodedLocation = { lat: 42.0451, lng: -87.6877, label: 'Evanston' }
const CRANBOURNE: GeocodedLocation = {
  lat: -38.0996,
  lng: 145.2834,
  label: 'Cranbourne',
  city: { lat: -37.8142, lng: 144.9632, label: 'Melbourne' },
}

afterEach(() => {
  fetchNearbyConcerts.mockReset()
  fetchStoredConcerts.mockReset()
  isCovered.mockReset().mockReturnValue(false)
  vi.unstubAllEnvs()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('getNearbyConcerts', () => {
  describe('mock mode', () => {
    it('returns the fixtures without calling Ticketmaster, wherever you search', async () => {
      vi.useFakeTimers()
      const { getNearbyConcerts } = await loadEvents({ mockData: true })

      const pending = getNearbyConcerts(CRANBOURNE)
      await vi.runAllTimersAsync() // skip the fixtures' simulated 300ms delay

      expect(await pending).toEqual({ events: MOCK_EVENTS, widenedToKm: null })
      expect(fetchNearbyConcerts).not.toHaveBeenCalled()
    })
  })

  describe('outer suburb of a bigger city', () => {
    it('searches around both the suburb and the city centre', async () => {
      fetchNearbyConcerts.mockResolvedValue([])
      const { getNearbyConcerts } = await loadEvents()

      await getNearbyConcerts(CRANBOURNE)

      expect(fetchNearbyConcerts.mock.calls).toEqual([
        [-38.0996, 145.2834, 25],
        [-37.8142, 144.9632, 25],
      ])
    })

    it('merges both into one date-ordered list, listing shows in the overlap once', async () => {
      fetchNearbyConcerts.mockImplementation(async (lat) =>
        lat === CRANBOURNE.lat
          ? [event('local', '2026-10-05'), event('both', '2026-10-01')]
          : [event('both', '2026-10-01'), event('city', '2026-10-03')],
      )
      const { getNearbyConcerts } = await loadEvents()

      const result = await getNearbyConcerts(CRANBOURNE)

      expect(result.events.map((e) => e.id)).toEqual(['both', 'city', 'local'])
      expect(result.widenedToKm).toBeNull()
    })

    it('never widens the radius, even when few shows are found', async () => {
      fetchNearbyConcerts.mockResolvedValue(shows(2, 'x'))
      const { getNearbyConcerts } = await loadEvents()

      const result = await getNearbyConcerts(CRANBOURNE)

      expect(fetchNearbyConcerts).toHaveBeenCalledTimes(2)
      expect(result.widenedToKm).toBeNull()
    })
  })

  describe('place without a parent city', () => {
    it('stops at 25km when that finds 20+ shows', async () => {
      eventsByRadius({ 25: shows(20, 'near') })
      const { getNearbyConcerts } = await loadEvents()

      const result = await getNearbyConcerts(EVANSTON)

      expect(radiiSearched()).toEqual([25])
      expect(result).toEqual({ events: shows(20, 'near'), widenedToKm: null })
    })

    it('widens to 50km when 25km finds fewer than 20, and reports it', async () => {
      eventsByRadius({ 25: shows(19, 'near'), 50: shows(30, 'wider') })
      const { getNearbyConcerts } = await loadEvents()

      const result = await getNearbyConcerts(EVANSTON)

      expect(radiiSearched()).toEqual([25, 50])
      expect(result).toEqual({ events: shows(30, 'wider'), widenedToKm: 50 })
    })

    it('tries up to 100km, then keeps whichever radius found the most', async () => {
      eventsByRadius({ 25: shows(2, 'a'), 50: shows(9, 'b'), 100: shows(6, 'c') })
      const { getNearbyConcerts } = await loadEvents()

      const result = await getNearbyConcerts(EVANSTON)

      expect(radiiSearched()).toEqual([25, 50, 100])
      expect(result).toEqual({ events: shows(9, 'b'), widenedToKm: 50 })
    })

    it('does not claim a wider search when the best result was the default 25km', async () => {
      eventsByRadius({ 25: shows(5, 'a'), 50: shows(3, 'b'), 100: shows(1, 'c') })
      const { getNearbyConcerts } = await loadEvents()

      const result = await getNearbyConcerts(EVANSTON)

      expect(result).toEqual({ events: shows(5, 'a'), widenedToKm: null })
    })
  })

  describe('preloaded cities', () => {
    it('answers a covered search from the database, not Ticketmaster', async () => {
      isCovered.mockReturnValue(true)
      fetchStoredConcerts.mockResolvedValue(shows(25, 'stored'))
      const { getNearbyConcerts } = await loadEvents()

      const result = await getNearbyConcerts(EVANSTON)

      expect(isCovered).toHaveBeenCalledWith(EVANSTON.lat, EVANSTON.lng, 25)
      expect(fetchStoredConcerts).toHaveBeenCalledWith(EVANSTON.lat, EVANSTON.lng, 25)
      expect(fetchNearbyConcerts).not.toHaveBeenCalled()
      expect(result).toEqual({ events: shows(25, 'stored'), widenedToKm: null })
    })

    it('mixes sources per circle: a covered city centre from the database, an uncovered suburb live', async () => {
      isCovered.mockImplementation((lat) => lat === CRANBOURNE.city!.lat)
      fetchStoredConcerts.mockResolvedValue([event('city')])
      fetchNearbyConcerts.mockResolvedValue([event('local')])
      const { getNearbyConcerts } = await loadEvents()

      const result = await getNearbyConcerts(CRANBOURNE)

      expect(fetchStoredConcerts).toHaveBeenCalledWith(-37.8142, 144.9632, 25)
      expect(fetchNearbyConcerts.mock.calls).toEqual([[-38.0996, 145.2834, 25]])
      expect(result.events.map((e) => e.id).sort()).toEqual(['city', 'local'])
    })

    it('widened searches that outgrow the stored area go live', async () => {
      isCovered.mockImplementation((_lat, _lng, radiusKm) => radiusKm === 25)
      fetchStoredConcerts.mockResolvedValue(shows(3, 'stored'))
      eventsByRadius({ 50: shows(30, 'wider') })
      const { getNearbyConcerts } = await loadEvents()

      const result = await getNearbyConcerts(EVANSTON)

      expect(radiiSearched()).toEqual([50])
      expect(result).toEqual({ events: shows(30, 'wider'), widenedToKm: 50 })
    })

    it('falls back to Ticketmaster when /api/events fails', async () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {})
      isCovered.mockReturnValue(true)
      fetchStoredConcerts.mockRejectedValue(new Error('/api/events failed: 404'))
      fetchNearbyConcerts.mockResolvedValue(shows(20, 'live'))
      const { getNearbyConcerts } = await loadEvents()

      const result = await getNearbyConcerts(EVANSTON)

      expect(result.events).toEqual(shows(20, 'live'))
      expect(console.warn).toHaveBeenCalled()
    })
  })

  it('passes Ticketmaster errors through, so the page can show them', async () => {
    fetchNearbyConcerts.mockRejectedValue(new Error('Ticketmaster API error: 429 Too Many Requests'))
    const { getNearbyConcerts } = await loadEvents()

    await expect(getNearbyConcerts(EVANSTON)).rejects.toThrow('429')
  })
})
