import { cachedLookup } from './persistentCache'

export interface SpotifyArtistInfo {
  name: string
  imageUrl: string | null
  spotifyUrl: string | null
}

export const fetchArtistInfo = cachedLookup<SpotifyArtistInfo>('spotify-artist', async (artistName) => {
  const res = await fetch(`/api/spotify-artist?name=${encodeURIComponent(artistName)}`)
  if (!res.ok) throw new Error(`Spotify lookup failed: ${res.status}`)
  return (await res.json()) as SpotifyArtistInfo | null
})
