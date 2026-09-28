import { afterEach, describe, expect, it, vi } from 'vitest'
import { isLikelyGenreTag } from './lastfm'

// The API key is read when the module loads, and lookups are cached in
// memory, so each test stubs the env and imports a fresh copy.
async function loadLastFm(apiKey = 'test-key') {
  vi.stubEnv('VITE_LASTFM_API_KEY', apiKey)
  vi.resetModules()
  return import('./lastfm')
}

function stubFetch(body: unknown, status = 200) {
  const fetchMock = vi.fn<typeof fetch>(async () => new Response(JSON.stringify(body), { status }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function artistInfo({ summary = '', tags = [] as string[], url = undefined as string | undefined } = {}) {
  return { artist: { url, bio: { summary }, tags: { tag: tags.map((name) => ({ name })) } } }
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('fetchArtistDetails', () => {
  it('asks artist.getinfo for the artist, as JSON', async () => {
    const fetchMock = stubFetch(artistInfo())
    const { fetchArtistDetails } = await loadLastFm()

    await fetchArtistDetails('Fontaines D.C.')

    const url = new URL(String(fetchMock.mock.calls[0][0]))
    expect(url.searchParams.get('method')).toBe('artist.getinfo')
    expect(url.searchParams.get('artist')).toBe('Fontaines D.C.')
    expect(url.searchParams.get('api_key')).toBe('test-key')
    expect(url.searchParams.get('format')).toBe('json')
  })

  it('strips the "Read more on Last.fm" link and other markup from the bio', async () => {
    stubFetch(
      artistInfo({
        summary:
          'The Chats are a <b>punk</b> band from Queensland. <a href="https://www.last.fm/music/The+Chats">Read more on Last.fm</a>.',
      }),
    )
    const { fetchArtistDetails } = await loadLastFm()

    const details = await fetchArtistDetails('The Chats')
    expect(details?.bio).toBe('The Chats are a punk band from Queensland.')
  })

  it('treats a bio that is only the "Read more" link as no bio', async () => {
    stubFetch(artistInfo({ summary: ' <a href="https://www.last.fm/music/Lavern">Read more on Last.fm</a>' }))
    const { fetchArtistDetails } = await loadLastFm()

    expect((await fetchArtistDetails('Lavern'))?.bio).toBeNull()
  })

  it('keeps the first three genre-like tags, skipping junk', async () => {
    stubFetch(artistInfo({ tags: ['punk', 'seen live', 'funk_add_to_lidarr_batch_6', 'australian', 'pub rock'] }))
    const { fetchArtistDetails } = await loadLastFm()

    expect((await fetchArtistDetails('The Chats'))?.tags).toEqual(['punk', 'seen live', 'australian'])
  })

  it("returns the artist's Last.fm page URL, or null if missing", async () => {
    stubFetch(artistInfo({ url: 'https://www.last.fm/music/The+Chats' }))
    const { fetchArtistDetails } = await loadLastFm()
    expect((await fetchArtistDetails('The Chats'))?.url).toBe('https://www.last.fm/music/The+Chats')

    stubFetch(artistInfo())
    expect((await fetchArtistDetails('Lavern'))?.url).toBeNull()
  })

  it('returns null for an artist Last.fm does not know', async () => {
    stubFetch({ error: 6, message: 'The artist you supplied could not be found' })
    const { fetchArtistDetails } = await loadLastFm()

    expect(await fetchArtistDetails('Nobody At All')).toBeNull()
  })

  it('resolves to null rather than throwing when the request fails', async () => {
    stubFetch({ error: 29, message: 'Rate limit exceeded' }, 429)
    const { fetchArtistDetails } = await loadLastFm()

    expect(await fetchArtistDetails('Baker Boy')).toBeNull()
  })

  it.each(['', 'your_key_here'])('skips the request entirely when the key is %j', async (key) => {
    const fetchMock = stubFetch(artistInfo())
    const { fetchArtistDetails } = await loadLastFm(key)

    expect(await fetchArtistDetails('Baker Boy')).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('isLikelyGenreTag', () => {
  it.each(['rock', 'hip hop', 'lo-fi', 'Post-Punk'])('accepts %j', (tag) => {
    expect(isLikelyGenreTag(tag)).toBe(true)
  })

  it.each(['funk_add_to_lidarr_batch_6', '80s', 'seen live 2019', ''])('rejects %j', (tag) => {
    expect(isLikelyGenreTag(tag)).toBe(false)
  })
})
