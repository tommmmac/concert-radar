// Daily ingest: loads every preloaded city's upcoming events from
// Ticketmaster into Postgres, so /api/events can answer searches without a
// Ticketmaster call per visitor. Run by .github/workflows/ingest.yml, or
// locally with `npm run ingest` (reads .env).
import { CITIES } from '../src/lib/concerts/cities.js'
import { deleteStaleEvents, ensureSchema, findIngestedCities, markCityIngested, upsertEvents } from '../api/_db.js'
import { fetchCityEvents } from './fetchCityEvents.js'

// Server-only, like the live search's key (api/ticketmaster-search.ts). CI
// uses its own key (the TICKETMASTER_API_KEY repo secret), so a busy day
// of live searches can't use up the ingest's quota.
const apiKey = process.env.TICKETMASTER_API_KEY
if (!apiKey || apiKey === 'your_key_here') {
  console.error('Set TICKETMASTER_API_KEY')
  process.exit(1)
}
if (!process.env.DATABASE_URL) {
  console.error('Set DATABASE_URL (Vercel dashboard → Storage → Neon)')
  process.exit(1)
}

const runStartedAt = new Date()
await ensureSchema()
const ingestedBefore = await findIngestedCities()

const succeeded: string[] = []
const failed: string[] = []

for (const city of CITIES) {
  try {
    const events = await fetchCityEvents(city, { apiKey })
    // A city's first successful run only records what's already on sale,
    // so adding a city doesn't flag all its shows as "Just announced".
    await upsertEvents(city.slug, events, runStartedAt, { baseline: !ingestedBefore.has(city.slug) })
    await markCityIngested(city.slug, runStartedAt)
    succeeded.push(city.slug)
    console.log(`${city.name}: ${events.length} events`)
  } catch (err) {
    // Keep going: one city's failure shouldn't cost every other city its
    // update. Its existing rows are kept (deleteStaleEvents skips it).
    failed.push(city.slug)
    console.error(`${city.name}: failed —`, err instanceof Error ? err.message : err)
  }
}

const removed = await deleteStaleEvents(succeeded, runStartedAt)
const minutes = ((Date.now() - runStartedAt.getTime()) / 60_000).toFixed(1)
console.log(`\nDone in ${minutes} min: ${succeeded.length} cities updated, ${removed} stale events removed.`)

if (failed.length > 0) {
  // A failed run emails whoever last edited the workflow's cron line.
  console.error(`Failed: ${failed.join(', ')}`)
  process.exit(1)
}
