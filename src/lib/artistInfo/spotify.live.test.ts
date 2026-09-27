// Live check (npm run test:live): the deployed site's /api/spotify-artist
// works end to end — Vercel is up, its Spotify env vars are set, and
// Spotify still returns images. No Spotify secret is needed here.
import { describe, expect, it } from 'vitest'
import type { SpotifyArtistInfo } from './spotify'

const SITE = 'https://concert-radar.com'

describe('Production /api/spotify-artist (live)', () => {
  it('serves the site', async () => {
    const res = await fetch(SITE)
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('<div id="root">')
  })

  it('looks up an artist with an image and Spotify link', async () => {
    // The response is edge-cached for a day, which could hide a breakage
    // for up to 24h. A per-day extra param (ignored by the function) makes
    // each daily run a fresh lookup.
    const check = new Date().toISOString().slice(0, 10)
    const res = await fetch(`${SITE}/api/spotify-artist?name=Radiohead&check=${check}`)

    expect(res.status, await res.clone().text()).toBe(200)
    const artist = (await res.json()) as SpotifyArtistInfo | null
    expect(artist?.name).toBe('Radiohead')
    expect(artist?.imageUrl).toMatch(/^https:\/\/i\.scdn\.co\//)
    expect(artist?.spotifyUrl).toMatch(/^https:\/\/open\.spotify\.com\/artist\//)
  })
})
