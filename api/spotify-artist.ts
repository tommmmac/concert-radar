import type { VercelRequest, VercelResponse } from '@vercel/node'

// Server-only credentials — never prefixed with VITE_, so Vite never
// inlines them into the client bundle. Only this function reads them.
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET

interface CachedToken {
  token: string
  expiresAt: number
}

// Module-level cache: persists across warm serverless invocations, avoiding
// a token request on every call. Cold starts just fetch a fresh one.
let cachedToken: CachedToken | null = null

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token
  }

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  })

  if (!res.ok) {
    throw new Error(`Spotify auth failed: ${res.status}`)
  }

  const data = (await res.json()) as { access_token: string; expires_in: number }
  cachedToken = {
    token: data.access_token,
    // Refresh a minute early to avoid edge-of-expiry failures.
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  }
  return cachedToken.token
}

interface SpotifyArtistInfo {
  name: string
  imageUrl: string | null
  previewUrl: string | null
  spotifyUrl: string | null
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const name = req.query.name
  if (typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ error: 'Missing "name" query param' })
    return
  }

  if (!CLIENT_ID || !CLIENT_SECRET) {
    res.status(500).json({ error: 'Spotify credentials not configured on the server' })
    return
  }

  try {
    const token = await getAccessToken()

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

    // Artist top track, used to source a preview clip (often unavailable —
    // Spotify has restricted preview_url for most tracks in recent years).
    let previewUrl: string | null = null
    const topTracksRes = await fetch(
      `https://api.spotify.com/v1/artists/${encodeURIComponent(artist.external_urls.spotify.split('/').pop() ?? '')}/top-tracks?market=US`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
    if (topTracksRes.ok) {
      const topTracksData = (await topTracksRes.json()) as { tracks: Array<{ preview_url: string | null }> }
      previewUrl = topTracksData.tracks.find((t) => t.preview_url)?.preview_url ?? null
    }

    const result: SpotifyArtistInfo = {
      name: artist.name,
      imageUrl: artist.images[0]?.url ?? null,
      previewUrl,
      spotifyUrl: artist.external_urls.spotify,
    }

    // Cache at the edge/browser for a day — artist images/previews don't
    // change often, and this keeps repeat lookups off Spotify's rate limit.
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate')
    res.status(200).json(result)
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : 'Spotify lookup failed' })
  }
}
