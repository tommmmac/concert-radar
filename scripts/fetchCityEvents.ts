// Fetches every upcoming music event around one city for the daily ingest
// (scripts/ingest.ts). Unlike the browser's single 200-result search, this
// pages through everything.
import {
  DISCOVERY_URL,
  discoveryParams,
  parseDiscoveryEvents,
  type ConcertEvent,
  type DiscoveryResponse,
} from '../src/lib/concerts/discovery.js'
import { INGEST_RADIUS_KM, type IngestCity } from '../src/lib/concerts/cities.js'

// Ticketmaster won't page past the 1,000th result of one search ("deep
// paging"), so a busier window is split in half until each half fits.
const MAX_RESULTS = 1000
const PAGE_SIZE = 200
// How far ahead to load. Very few shows are listed further out than this.
const HORIZON_DAYS = 730
// Free tier allows 5 requests/second; stay safely under it.
const REQUEST_GAP_MS = 250
const DAY_MS = 24 * 60 * 60 * 1000

export interface FetchOptions {
  apiKey: string
  /** Injected so tests don't wait. */
  sleep?: (ms: number) => Promise<void>
  now?: Date
}

const realSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

// Ticketmaster wants whole seconds: 2026-09-29T00:00:00Z, no milliseconds.
const tmDate = (date: Date) => date.toISOString().slice(0, 19) + 'Z'

export async function fetchCityEvents(city: IngestCity, options: FetchOptions): Promise<ConcertEvent[]> {
  const sleep = options.sleep ?? realSleep
  const from = options.now ?? new Date()
  const to = new Date(from.getTime() + HORIZON_DAYS * DAY_MS)

  async function fetchPage(start: Date, end: Date, page: number): Promise<DiscoveryResponse> {
    const params = discoveryParams(options.apiKey, city.lat, city.lng, INGEST_RADIUS_KM)
    params.set('startDateTime', tmDate(start))
    params.set('endDateTime', tmDate(end))
    params.set('page', String(page))

    for (let attempt = 1; ; attempt++) {
      await sleep(REQUEST_GAP_MS)
      const res = await fetch(`${DISCOVERY_URL}?${params}`)
      if (res.ok) return (await res.json()) as DiscoveryResponse
      // 429 = over the per-second limit; 5xx = a blip on Ticketmaster's side
      // (a 502 once cost New York a whole day). Back off and retry.
      if ((res.status === 429 || res.status >= 500) && attempt < 3) {
        await sleep(2000 * attempt)
        continue
      }
      throw new Error(`Ticketmaster ${res.status} for ${city.name} (page ${page})`)
    }
  }

  async function fetchWindow(start: Date, end: Date): Promise<ConcertEvent[]> {
    const first = await fetchPage(start, end, 0)
    const total = first.page?.totalElements ?? 0

    if (total > MAX_RESULTS && end.getTime() - start.getTime() > DAY_MS) {
      const mid = new Date(Math.floor((start.getTime() + end.getTime()) / 2 / 1000) * 1000)
      return [...(await fetchWindow(start, mid)), ...(await fetchWindow(mid, end))]
    }
    if (total > MAX_RESULTS) {
      console.warn(`${city.name}: ${total} events in one day, keeping the first ${MAX_RESULTS}`)
    }

    const events = parseDiscoveryEvents(first)
    const pages = Math.min(first.page?.totalPages ?? 1, MAX_RESULTS / PAGE_SIZE)
    for (let page = 1; page < pages; page++) {
      events.push(...parseDiscoveryEvents(await fetchPage(start, end, page)))
    }
    return events
  }

  // Window edges are inclusive and results can shift between pages while
  // paging, so the same event can turn up twice. Keep one of each.
  const byId = new Map((await fetchWindow(from, to)).map((event) => [event.id, event]))
  return [...byId.values()]
}
