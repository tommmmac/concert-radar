import { useEffect, useState } from 'react'
import { fetchArtistDetails, type LastFmArtistDetails } from '../lib/lastfm'

export function useArtistDetails(artistName: string) {
  const [details, setDetails] = useState<LastFmArtistDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setDetails(null)

    fetchArtistDetails(artistName).then((result) => {
      if (cancelled) return
      setDetails(result)
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [artistName])

  return { details, loading }
}
