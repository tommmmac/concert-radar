import { afterEach, describe, expect, it, vi } from 'vitest'

// Lookups are cached in memory per module, so each test imports a fresh copy.
async function loadSpotify() {
  vi.resetModules()
  return import('./spotify')
}

function stubFetch(body: unknown, status = 200) {
  const fetchMock = vi.fn<typeof fetch>(async () => new Response(JSON.stringify(body), { status }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => vi.unstubAllGlobals())

describe('fetchArtistInfo', () => {
  it('goes through our /api function (never Spotify directly), URL-encoding the name', async () => {
    const fetchMock = stubFetch(null)
    const { fetchArtistInfo } = await loadSpotify()

    await fetchArtistInfo('Florence + the Machine')

    expect(fetchMock).toHaveBeenCalledWith('/api/spotify-artist?name=Florence%20%2B%20the%20Machine&v=2')
  })

  it('returns the artist from the function', async () => {
    const artist = { name: 'Baker Boy', imageUrl: 'https://i.scdn.co/image/x', spotifyUrl: 'https://open.spotify.com/artist/x' }
    stubFetch(artist)
    const { fetchArtistInfo } = await loadSpotify()

    expect(await fetchArtistInfo('Baker Boy')).toEqual(artist)
  })

  it('resolves to null rather than throwing when the function errors', async () => {
    stubFetch({ error: 'Spotify credentials not configured on the server' }, 500)
    const { fetchArtistInfo } = await loadSpotify()

    expect(await fetchArtistInfo('Baker Boy')).toBeNull()
  })
})
