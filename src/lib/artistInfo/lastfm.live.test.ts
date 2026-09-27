// Live check (npm run test:live): Last.fm's artist.getinfo still gives
// fetchArtistDetails a bio and genre tags, and our cleanup still strips
// its markup. Uses a long-established artist so the data is stable.
import { beforeAll, describe, expect, it } from 'vitest'
import { fetchArtistDetails, type LastFmArtistDetails } from './lastfm'

describe('Last.fm artist.getinfo (live)', () => {
  let details: LastFmArtistDetails | null

  beforeAll(async () => {
    if (!import.meta.env.VITE_LASTFM_API_KEY) {
      throw new Error('VITE_LASTFM_API_KEY is not set (GitHub secret LASTFM_API_KEY)')
    }
    details = await fetchArtistDetails('Radiohead')
  })

  it('finds the artist', () => {
    expect(details).not.toBeNull()
  })

  it('returns a bio with the "Read more on Last.fm" link and all markup stripped', () => {
    expect(details?.bio).toBeTruthy()
    expect(details?.bio).not.toMatch(/Read more on Last\.fm/i)
    expect(details?.bio).not.toMatch(/[<>]/)
  })

  it('returns genre tags that pass the genre filter', () => {
    expect(details?.tags.length).toBeGreaterThan(0)
  })
})
