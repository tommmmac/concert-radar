export interface LastFmArtistDetails {
  bio: string | null
  tags: string[]
}

const API_KEY = import.meta.env.VITE_LASTFM_API_KEY
const BASE_URL = 'https://ws.audioscrobbler.com/2.0/'

// Module-level cache so switching venues/reopening a panel doesn't
// re-request an artist we've already looked up this session.
const cache = new Map<string, Promise<LastFmArtistDetails | null>>()

export function fetchArtistDetails(artistName: string): Promise<LastFmArtistDetails | null> {
  const key = artistName.trim().toLowerCase()
  const cached = cache.get(key)
  if (cached) return cached

  const promise = lookupArtist(artistName).catch(() => null)
  cache.set(key, promise)
  return promise
}

async function lookupArtist(artistName: string): Promise<LastFmArtistDetails | null> {
  if (!API_KEY) return null

  const params = new URLSearchParams({
    method: 'artist.getinfo',
    artist: artistName,
    api_key: API_KEY,
    format: 'json',
  })

  const res = await fetch(`${BASE_URL}?${params}`)
  if (!res.ok) return null

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

  const tags = (data.artist.tags?.tag ?? []).map((t) => t.name).slice(0, 3)

  return { bio, tags }
}
