import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSpotifyAccessToken, hasSpotifyCredentials } from './_spotifyAuth.js'

interface SpotifyArtistInfo {
  name: string
  imageUrl: string | null
  spotifyUrl: string | null
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const name = req.query.name
  if (typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ error: 'Missing "name" query param' })
    return
  }

  if (!hasSpotifyCredentials()) {
    res.status(500).json({ error: 'Spotify credentials not configured on the server' })
    return
  }

  try {
    const token = await getSpotifyAccessToken()

    const searchParams = new URLSearchParams({
      q: name,
      type: 'artist',
      limit: '1',
    })
    const searchRes = await fetch(`https://api.spotify.com/v1/search?${searchParams}`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!searchRes.ok) {
      throw new Error(`Spotify search failed: ${searchRes.status}`)
    }

    const searchData = (await searchRes.json()) as {
      artists: {
        items: Array<{ name: string; images: Array<{ url: string }>; external_urls: { spotify: string } }>
      }
    }

    const artist = searchData.artists.items[0]
    if (!artist) {
      res.status(200).json(null)
      return
    }

    const result: SpotifyArtistInfo = {
      name: artist.name,
      imageUrl: artist.images[0]?.url ?? null,
      spotifyUrl: artist.external_urls.spotify,
    }

    // Cache at the edge/browser for a day — artist images don't change
    // often, and this keeps repeat lookups off Spotify's rate limit.
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate')
    res.status(200).json(result)
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : 'Spotify lookup failed' })
  }
}
