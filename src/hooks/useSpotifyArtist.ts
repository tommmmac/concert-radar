import { useEffect, useState } from 'react'
import { fetchArtistInfo, type SpotifyArtistInfo } from '../lib/spotify'

export function useSpotifyArtist(artistName: string) {
  const [artist, setArtist] = useState<SpotifyArtistInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setArtist(null)

    fetchArtistInfo(artistName).then((result) => {
      if (cancelled) return
      setArtist(result)
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [artistName])

  return { artist, loading }
}
