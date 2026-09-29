import { cachedLookup } from './persistentCache'

export interface SpotifyArtistInfo {
  name: string
  imageUrl: string | null
  spotifyUrl: string | null
}

// v2: the function used to trust Spotify's first result even when its name
// didn't match. Bumping both the localStorage namespace and the URL (which
// the edge cache keys on) drops wrong photos cached under the old logic.
export const fetchArtistInfo = cachedLookup<SpotifyArtistInfo>('spotify-artist-v2', async (artistName) => {
  const res = await fetch(`/api/spotify-artist?name=${encodeURIComponent(artistName)}&v=2`)
  if (!res.ok) throw new Error(`Spotify lookup failed: ${res.status}`)
  return (await res.json()) as SpotifyArtistInfo | null
})
