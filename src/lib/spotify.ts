import { readCache, writeCache } from './persistentCache'

export interface SpotifyArtistInfo {
  name: string
  imageUrl: string | null
  spotifyUrl: string | null
}

const CACHE_NS = 'spotify-artist'

// In-memory cache for the current session (fastest); falls back to a
// localStorage-backed cache so lookups survive a page reload too.
const memoryCache = new Map<string, Promise<SpotifyArtistInfo | null>>()

export function fetchArtistInfo(artistName: string): Promise<SpotifyArtistInfo | null> {
  const key = artistName.trim().toLowerCase()

  const inMemory = memoryCache.get(key)
  if (inMemory) return inMemory

  const persisted = readCache<SpotifyArtistInfo | null>(CACHE_NS, key)
  if (persisted !== undefined) {
    const resolved = Promise.resolve(persisted)
    memoryCache.set(key, resolved)
    return resolved
  }

  const promise = fetch(`/api/spotify-artist?name=${encodeURIComponent(artistName)}`)
    .then((res) => {
      if (!res.ok) throw new Error(`Spotify lookup failed: ${res.status}`)
      return res.json() as Promise<SpotifyArtistInfo | null>
    })
    .then((result) => {
      writeCache(CACHE_NS, key, result)
      return result
    })
    .catch(() => null)

  memoryCache.set(key, promise)
  return promise
}
