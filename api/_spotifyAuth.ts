// Shared by the api/spotify-*.ts functions. The leading underscore tells
// Vercel this file is not itself a route.

// Server-only credentials — never prefixed with VITE_, so Vite never
// inlines them into the client bundle.
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET

interface CachedToken {
  token: string
  expiresAt: number
}

// Module-level cache: persists across warm serverless invocations, avoiding
// a token request on every call. Cold starts just fetch a fresh one.
let cachedToken: CachedToken | null = null

export function hasSpotifyCredentials(): boolean {
  return Boolean(CLIENT_ID && CLIENT_SECRET)
}

export async function getSpotifyAccessToken(): Promise<string> {
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
