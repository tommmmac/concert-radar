import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSpotifyAccessToken, hasSpotifyCredentials } from './_spotifyAuth.js'

// Spotify's search always returns its best guesses, even when no artist
// has that name ("Cuban Fire!" came back as Stan Kenton, whose album it is).
// So look at several and only accept one whose name matches: a stranger's
// photo is worse than none.
const SEARCH_LIMIT = 10

/** Compare names ignoring case, accents, punctuation, "&" vs "and" and a leading "The". */
function sameName(a: string, b: string): boolean {
  const normalize = (name: string) =>
    name
      .normalize('NFKD')
      .replace(/\p{M}/gu, '')
      .toLowerCase()
      .replace(/&/g, ' and ')
      .trim()
      .replace(/^the\s+/, '')
      .replace(/[^\p{L}\p{N}]/gu, '')
  return normalize(a) === normalize(b)
}

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
      limit: String(SEARCH_LIMIT),
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

    // Cache at the edge/browser for a day — artist images don't change
    // often, and this keeps repeat lookups off Spotify's rate limit. That
    // includes "no match": small local acts often aren't on Spotify, and
    // without it every visitor re-asks about them.
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate')

    const artist = searchData.artists.items.find((item) => sameName(item.name, name))
    if (!artist) {
      res.status(200).json(null)
      return
    }

    const result: SpotifyArtistInfo = {
      name: artist.name,
      imageUrl: artist.images[0]?.url ?? null,
      spotifyUrl: artist.external_urls.spotify,
    }

    res.status(200).json(result)
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : 'Spotify lookup failed' })
  }
}
