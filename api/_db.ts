// Neon Postgres access for api/events.ts and the daily ingest job
// (scripts/ingest.ts). The leading underscore tells Vercel this file is
// not itself a route.
import { neon } from '@neondatabase/serverless'
import type { ConcertEvent } from '../src/lib/concerts/discovery.js'

// Server-only, like the Spotify secret. Set automatically on Vercel by the
// Neon integration; copied into .env by hand for local use.
function getSql() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')
  return neon(url)
}

export async function ensureSchema(): Promise<void> {
  const sql = getSql()
  await sql`
    CREATE TABLE IF NOT EXISTS events (
      id text PRIMARY KEY,
      name text NOT NULL,
      url text NOT NULL,
      date date,
      venue_name text NOT NULL,
      lat double precision NOT NULL,
      lng double precision NOT NULL,
      city text NOT NULL,
      last_seen_at timestamptz NOT NULL
    )`
  // Distance queries start with a latitude band (see boundingBox).
  await sql`CREATE INDEX IF NOT EXISTS events_lat_idx ON events (lat)`
  // When the ingest first saw each event, for the "Just announced" badge.
  // Added after launch, so existing rows start as NULL (= unknown).
  await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS first_seen_at timestamptz`
  // Cities that have completed at least one ingest. A city's first run is
  // its baseline: everything it finds was already on sale, not announced.
  await sql`
    CREATE TABLE IF NOT EXISTS ingested_cities (
      slug text PRIMARY KEY,
      first_ingested_at timestamptz NOT NULL
    )`
}

export async function findIngestedCities(): Promise<Set<string>> {
  const sql = getSql()
  const rows = (await sql`SELECT slug FROM ingested_cities`) as Array<{ slug: string }>
  return new Set(rows.map((row) => row.slug))
}

export async function markCityIngested(city: string, at: Date): Promise<void> {
  const sql = getSql()
  await sql`
    INSERT INTO ingested_cities (slug, first_ingested_at)
    VALUES (${city}, ${at.toISOString()}::timestamptz)
    ON CONFLICT (slug) DO NOTHING`
}

/**
 * Inserts or refreshes one city's events, stamping them as seen in this run.
 * A new row's first_seen_at is this run, unless it's the city's `baseline`
 * run (see ensureSchema); an existing row's is never changed.
 */
export async function upsertEvents(
  city: string,
  events: ConcertEvent[],
  seenAt: Date,
  { baseline }: { baseline: boolean },
): Promise<void> {
  if (events.length === 0) return
  const sql = getSql()
  const firstSeenAt = baseline ? null : seenAt.toISOString()
  // One statement per city: columns go in as parallel arrays and unnest()
  // turns them back into rows.
  await sql`
    INSERT INTO events (id, name, url, date, venue_name, lat, lng, city, last_seen_at, first_seen_at)
    SELECT u.*, ${city}, ${seenAt.toISOString()}::timestamptz, ${firstSeenAt}::timestamptz
    FROM unnest(
      ${events.map((e) => e.id)}::text[],
      ${events.map((e) => e.name)}::text[],
      ${events.map((e) => e.url)}::text[],
      ${events.map((e) => e.date)}::date[],
      ${events.map((e) => e.venueName)}::text[],
      ${events.map((e) => e.lat)}::float8[],
      ${events.map((e) => e.lng)}::float8[]
    ) AS u
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name, url = EXCLUDED.url, date = EXCLUDED.date,
      venue_name = EXCLUDED.venue_name, lat = EXCLUDED.lat, lng = EXCLUDED.lng,
      city = EXCLUDED.city, last_seen_at = EXCLUDED.last_seen_at
      -- first_seen_at deliberately left out: it keeps its first value.`
}

/**
 * Removes events that have been cancelled or taken down (not seen in this
 * run) — but only for cities that were fetched successfully, so one
 * Ticketmaster hiccup doesn't wipe a city — plus anything already past.
 */
export async function deleteStaleEvents(fetchedCities: string[], runStartedAt: Date): Promise<number> {
  const sql = getSql()
  const rows = await sql`
    DELETE FROM events
    WHERE (city = ANY(${fetchedCities}::text[]) AND last_seen_at < ${runStartedAt.toISOString()}::timestamptz)
       OR date < current_date - 1
    RETURNING id`
  return rows.length
}

/**
 * A lat/lng box around a point that contains the whole search circle.
 * Lets the query use the lat index and skip the exact distance maths for
 * most rows. (Longitude degrees shrink towards the poles, hence the cos.)
 */
export function boundingBox(lat: number, lng: number, radiusKm: number) {
  const latDelta = radiusKm / 111.32
  const lngDelta = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180))
  return { minLat: lat - latDelta, maxLat: lat + latDelta, minLng: lng - lngDelta, maxLng: lng + lngDelta }
}

export interface StoredEvents {
  events: ConcertEvent[]
  /** When the freshest of these events was last confirmed by the ingest job. */
  updatedAt: string | null
}

// Far more than any one search returns today; stops a runaway response.
const MAX_EVENTS = 3000

export async function findEventsNear(lat: number, lng: number, radiusKm: number): Promise<StoredEvents> {
  const sql = getSql()
  const box = boundingBox(lat, lng, radiusKm)
  const rows = (await sql`
    SELECT id, name, url, to_char(date, 'YYYY-MM-DD') AS date, venue_name, lat, lng, last_seen_at, first_seen_at
    FROM events
    WHERE lat BETWEEN ${box.minLat} AND ${box.maxLat}
      AND lng BETWEEN ${box.minLng} AND ${box.maxLng}
      AND 6371 * 2 * asin(sqrt(
            power(sin(radians(lat - ${lat}) / 2), 2) +
            cos(radians(${lat})) * cos(radians(lat)) * power(sin(radians(lng - ${lng}) / 2), 2)
          )) <= ${radiusKm}
      AND (date IS NULL OR date >= current_date - 1)
    ORDER BY date ASC NULLS LAST, id
    LIMIT ${MAX_EVENTS}`) as Array<{
    id: string
    name: string
    url: string
    date: string | null
    venue_name: string
    lat: number
    lng: number
    last_seen_at: string | Date
    first_seen_at: string | Date | null
  }>

  let updatedAt: string | null = null
  const events = rows.map((row) => {
    const seen = new Date(row.last_seen_at).toISOString()
    if (!updatedAt || seen > updatedAt) updatedAt = seen
    return {
      id: row.id,
      name: row.name,
      url: row.url,
      date: row.date,
      venueName: row.venue_name,
      lat: row.lat,
      lng: row.lng,
      announcedAt: row.first_seen_at === null ? null : new Date(row.first_seen_at).toISOString(),
    }
  })

  return { events, updatedAt }
}
