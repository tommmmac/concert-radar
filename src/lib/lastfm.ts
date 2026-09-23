import { readCache, writeCache } from './persistentCache'

export interface LastFmArtistDetails {
  bio: string | null
  tags: string[]
}

const API_KEY = import.meta.env.VITE_LASTFM_API_KEY
const HAS_API_KEY = Boolean(API_KEY) && API_KEY !== 'your_key_here'
const BASE_URL = 'https://ws.audioscrobbler.com/2.0/'
// Bump when the cached shape/filtering changes, to invalidate stale entries.
// v3: v2 could hold nulls cached from failed requests (e.g. a bad key).
const CACHE_NS = 'lastfm-artist-v3'

// In-memory cache for the current session (fastest); falls back to a
// localStorage-backed cache so lookups survive a page reload too.
const memoryCache = new Map<string, Promise<LastFmArtistDetails | null>>()

export function fetchArtistDetails(artistName: string): Promise<LastFmArtistDetails | null> {
  // No usable key: skip the request entirely rather than caching a 403.
  if (!HAS_API_KEY) return Promise.resolve(null)

  const key = artistName.trim().toLowerCase()

  const inMemory = memoryCache.get(key)
  if (inMemory) return inMemory

  const persisted = readCache<LastFmArtistDetails | null>(CACHE_NS, key)
  if (persisted !== undefined) {
    const resolved = Promise.resolve(persisted)
    memoryCache.set(key, resolved)
    return resolved
  }

  // Only real answers (including "no such artist" → null) are persisted;
  // a failed request throws past writeCache, so the next page load retries.
  const promise = lookupArtist(artistName)
    .then((result) => {
      writeCache(CACHE_NS, key, result)
      return result
    })
    .catch(() => null)
  memoryCache.set(key, promise)
  return promise
}

async function lookupArtist(artistName: string): Promise<LastFmArtistDetails | null> {
  const params = new URLSearchParams({
    method: 'artist.getinfo',
    artist: artistName,
    api_key: API_KEY,
    format: 'json',
  })

  const res = await fetch(`${BASE_URL}?${params}`)
  if (!res.ok) throw new Error(`Last.fm lookup failed: ${res.status}`)

  const data = (await res.json()) as {
    artist?: {
      bio?: { summary?: string }
      tags?: { tag?: Array<{ name: string }> }
    }
  }
  if (!data.artist) return null

  // Last.fm appends a "Read more on Last.fm" link with a raw <a> tag —
  // strip it and any other markup, keep plain text only.
  const rawSummary = data.artist.bio?.summary ?? ''
  const withoutReadMoreLink = rawSummary.replace(/<a[^>]*>.*?<\/a>\.?/i, '')
  const bio = withoutReadMoreLink.replace(/<[^>]+>/g, '').trim() || null

  const tags = (data.artist.tags?.tag ?? [])
    .map((t) => t.name)
    .filter(isLikelyGenreTag)
    .slice(0, 3)

  return { bio, tags }
}

// Last.fm tags are arbitrary user-submitted strings, not a curated genre
// list — some tools tag artists as a side effect of their own bookkeeping
// (e.g. "funk_add_to_lidarr_batch_6" from a Lidarr import script). Real
// genre tags are essentially always plain words/phrases, so reject
// anything with digits or underscores rather than trying to denylist
// every possible junk pattern.
export function isLikelyGenreTag(tag: string): boolean {
  return /^[a-z\s-]+$/i.test(tag)
}
