export interface SpotifyArtistInfo {
  name: string
  imageUrl: string | null
  previewUrl: string | null
  spotifyUrl: string | null
}

// Module-level cache so switching venues/reopening a panel doesn't
// re-request an artist we've already looked up this session.
const cache = new Map<string, Promise<SpotifyArtistInfo | null>>()

export function fetchArtistInfo(artistName: string): Promise<SpotifyArtistInfo | null> {
  const key = artistName.trim().toLowerCase()
  const cached = cache.get(key)
  if (cached) return cached

  const promise = fetch(`/api/spotify-artist?name=${encodeURIComponent(artistName)}`)
    .then((res) => {
      if (!res.ok) throw new Error(`Spotify lookup failed: ${res.status}`)
      return res.json() as Promise<SpotifyArtistInfo | null>
    })
    .catch(() => null)

  cache.set(key, promise)
  return promise
}
