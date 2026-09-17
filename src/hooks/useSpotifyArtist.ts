import { useEffect, useState } from 'react'
import { fetchArtistInfo, type SpotifyArtistInfo } from '../lib/spotify'

export function useSpotifyArtist(artistName: string) {
  const [artist, setArtist] = useState<SpotifyArtistInfo | null>(null)

  useEffect(() => {
    let cancelled = false
    setArtist(null)

    fetchArtistInfo(artistName).then((result) => {
      if (!cancelled) setArtist(result)
    })

    return () => {
      cancelled = true
    }
  }, [artistName])

  return artist
}
