import { useEffect, useState } from 'react'
import { fetchArtistDetails, type LastFmArtistDetails } from '../lib/lastfm'

export function useArtistDetails(artistName: string) {
  const [details, setDetails] = useState<LastFmArtistDetails | null>(null)

  useEffect(() => {
    let cancelled = false
    setDetails(null)

    fetchArtistDetails(artistName).then((result) => {
      if (!cancelled) setDetails(result)
    })

    return () => {
      cancelled = true
    }
  }, [artistName])

  return details
}
