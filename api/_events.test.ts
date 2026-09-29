// Named with a leading underscore (not events.test.ts) because Vercel
// deploys every other file in api/ as a serverless route.
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { StoredEvents } from './_db.js'

// The SQL itself runs against real Postgres (checked by the live test);
// here the database module is mocked to test the handler around it.
const findEventsNear = vi.hoisted(() => vi.fn<(lat: number, lng: number, radiusKm: number) => Promise<StoredEvents>>())
vi.mock('./_db.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./_db.js')>()),
  findEventsNear,
}))

const { default: handler } = await import('./events.js')
const { boundingBox } = await import('./_db.js')

function fakeResponse() {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    headers: {} as Record<string, string>,
    status(code: number) {
      res.statusCode = code
      return res
    },
    json(body: unknown) {
      res.body = body
      return res
    },
    setHeader(name: string, value: string) {
      res.headers[name] = value
      return res
    },
  }
  return res
}

async function get(query: Record<string, string>) {
  const res = fakeResponse()
  await handler({ query } as unknown as VercelRequest, res as unknown as VercelResponse)
  return res
}

afterEach(() => {
  findEventsNear.mockReset()
})

describe('GET /api/events', () => {
  it('returns the stored events around the point, edge-cached for an hour', async () => {
    const stored: StoredEvents = {
      events: [{ id: 'e1', name: 'Show', url: '#', date: '2026-10-01', venueName: 'Venue', lat: -37.8, lng: 145 }],
      updatedAt: '2026-09-29T19:00:00.000Z',
    }
    findEventsNear.mockResolvedValue(stored)

    const res = await get({ lat: '-37.8136', lng: '144.9631', radius: '25' })

    expect(findEventsNear).toHaveBeenCalledWith(-37.8136, 144.9631, 25)
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual(stored)
    expect(res.headers['Cache-Control']).toMatch(/s-maxage=3600/)
  })

  it.each([
    [{ lng: '144.9', radius: '25' }],
    [{ lat: 'abc', lng: '144.9', radius: '25' }],
    [{ lat: '-37.8', lng: '144.9', radius: '' }],
    [{ lat: '91', lng: '144.9', radius: '25' }],
    [{ lat: '-37.8', lng: '144.9', radius: '0' }],
    [{ lat: '-37.8', lng: '144.9', radius: '5000' }],
  ])('rejects bad params %o without querying the database', async (query) => {
    const res = await get(query)

    expect(res.statusCode).toBe(400)
    expect(findEventsNear).not.toHaveBeenCalled()
  })

  it('answers 502 (so the browser falls back to Ticketmaster) when the database fails', async () => {
    findEventsNear.mockRejectedValue(new Error('DATABASE_URL is not set'))

    const res = await get({ lat: '-37.8', lng: '144.9', radius: '25' })

    expect(res.statusCode).toBe(502)
    expect(res.body).toEqual({ error: 'DATABASE_URL is not set' })
  })
})

describe('boundingBox', () => {
  it('spans the radius in latitude either side of the point', () => {
    const box = boundingBox(0, 0, 111.32)
    expect(box.minLat).toBeCloseTo(-1)
    expect(box.maxLat).toBeCloseTo(1)
  })

  it('widens in longitude away from the equator, where degrees are shorter', () => {
    const equator = boundingBox(0, 0, 50)
    const melbourne = boundingBox(-37.8, 144.9, 50)
    expect(melbourne.maxLng - melbourne.minLng).toBeGreaterThan(equator.maxLng - equator.minLng)
  })
})
