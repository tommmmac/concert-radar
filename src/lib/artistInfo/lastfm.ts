import { cachedLookup } from './persistentCache'

export interface LastFmArtistDetails {
  bio: string | null
  tags: string[]
  // The artist's Last.fm page. Bios are CC BY-SA wiki text, so wherever one
  // is shown it must link back here.
  url: string | null
}

const API_KEY = import.meta.env.VITE_LASTFM_API_KEY
const HAS_API_KEY = Boolean(API_KEY) && API_KEY !== 'your_key_here'
const BASE_URL = 'https://ws.audioscrobbler.com/2.0/'
// Bump when the cached shape/filtering changes, to invalidate stale entries.
// v3: v2 could hold nulls cached from failed requests (e.g. a bad key).
// v4: added `url`.
const CACHE_NS = 'lastfm-artist-v4'

const cachedLookupArtist = cachedLookup(CACHE_NS, lookupArtist)

export function fetchArtistDetails(artistName: string): Promise<LastFmArtistDetails | null> {
  // No usable key: skip the request entirely rather than caching a 403.
  if (!HAS_API_KEY) return Promise.resolve(null)
  return cachedLookupArtist(artistName)
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
      url?: string
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

  return { bio, tags, url: data.artist.url ?? null }
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
