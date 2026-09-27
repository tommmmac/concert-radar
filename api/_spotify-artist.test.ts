// Named with a leading underscore (not spotify-artist.test.ts) because
// Vercel deploys every other file in api/ as a serverless route.
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { afterEach, describe, expect, it, vi } from 'vitest'

// Credentials and the token cache live at module level, so each test stubs
// the env and imports fresh copies.
async function loadHandler({ clientId = 'id', clientSecret = 'secret' } = {}) {
  vi.stubEnv('SPOTIFY_CLIENT_ID', clientId)
  vi.stubEnv('SPOTIFY_CLIENT_SECRET', clientSecret)
  vi.resetModules()
  return (await import('./spotify-artist.js')).default
}

const TOKEN_URL = 'https://accounts.spotify.com/api/token'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status })
}

/** Fakes Spotify: the token endpoint, plus whatever search should return. */
function stubSpotify(search: () => Response, token: () => Response = () => json({ access_token: 'tok', expires_in: 3600 })) {
  const fetchMock = vi.fn<typeof fetch>(async (input) => (String(input) === TOKEN_URL ? token() : search()))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function searchResult(...items: unknown[]) {
  return json({ artists: { items } })
}

const BAKER_BOY = {
  name: 'Baker Boy',
  images: [{ url: 'https://i.scdn.co/image/large' }, { url: 'https://i.scdn.co/image/small' }],
  external_urls: { spotify: 'https://open.spotify.com/artist/bb' },
  // Fields the function should never pass through to the browser:
  id: 'bb',
  popularity: 60,
  followers: { total: 123 },
}

/** Just enough of VercelResponse to record what the handler sent. */
function fakeResponse() {
  const sent = { status: 0, body: undefined as unknown, headers: {} as Record<string, string> }
  const res = {
    status(code: number) {
      sent.status = code
      return res
    },
    json(body: unknown) {
      sent.body = body
      return res
    },
    setHeader(name: string, value: string) {
      sent.headers[name] = value
      return res
    },
  }
  return { res: res as unknown as VercelResponse, sent }
}

function request(query: Record<string, string | string[]>) {
  return { query } as unknown as VercelRequest
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('GET /api/spotify-artist', () => {
  it('returns only name, image and link for the top match', async () => {
    stubSpotify(() => searchResult(BAKER_BOY))
    const handler = await loadHandler()
    const { res, sent } = fakeResponse()

    await handler(request({ name: 'Baker Boy' }), res)

    expect(sent.status).toBe(200)
    expect(sent.body).toEqual({
      name: 'Baker Boy',
      imageUrl: 'https://i.scdn.co/image/large',
      spotifyUrl: 'https://open.spotify.com/artist/bb',
    })
  })

  it('never sends the access token to the browser', async () => {
    stubSpotify(() => searchResult(BAKER_BOY))
    const handler = await loadHandler()
    const { res, sent } = fakeResponse()

    await handler(request({ name: 'Baker Boy' }), res)

    expect(JSON.stringify(sent.body)).not.toContain('tok')
  })

  it('searches for one artist with the bearer token', async () => {
    const fetchMock = stubSpotify(() => searchResult(BAKER_BOY))
    const handler = await loadHandler()

    await handler(request({ name: 'Baker Boy' }), fakeResponse().res)

    const [searchUrl, init] = fetchMock.mock.calls[1]
    const url = new URL(String(searchUrl))
    expect(url.searchParams.get('q')).toBe('Baker Boy')
    expect(url.searchParams.get('type')).toBe('artist')
    expect(url.searchParams.get('limit')).toBe('1')
    expect(init?.headers).toEqual({ Authorization: 'Bearer tok' })
  })

  it('lets the edge cache hold results for a day', async () => {
    stubSpotify(() => searchResult(BAKER_BOY))
    const handler = await loadHandler()
    const { res, sent } = fakeResponse()

    await handler(request({ name: 'Baker Boy' }), res)

    expect(sent.headers['Cache-Control']).toContain('s-maxage=86400')
  })

  it('returns a null image when the artist has none', async () => {
    stubSpotify(() => searchResult({ ...BAKER_BOY, images: [] }))
    const handler = await loadHandler()
    const { res, sent } = fakeResponse()

    await handler(request({ name: 'Baker Boy' }), res)

    expect(sent.body).toMatchObject({ imageUrl: null })
  })

  it('returns 200 null when no artist matches', async () => {
    stubSpotify(() => searchResult())
    const handler = await loadHandler()
    const { res, sent } = fakeResponse()

    await handler(request({ name: 'Nobody At All' }), res)

    expect(sent.status).toBe(200)
    expect(sent.body).toBeNull()
  })

  it('reuses the token across warm invocations', async () => {
    const fetchMock = stubSpotify(() => searchResult(BAKER_BOY))
    const handler = await loadHandler()

    await handler(request({ name: 'Baker Boy' }), fakeResponse().res)
    await handler(request({ name: 'King Stingray' }), fakeResponse().res)

    const tokenRequests = fetchMock.mock.calls.filter(([input]) => String(input) === TOKEN_URL)
    expect(tokenRequests).toHaveLength(1)
  })

  const badQueries: Record<string, string | string[]>[] = [{}, { name: '' }, { name: '   ' }, { name: ['a', 'b'] }]
  it.each(badQueries)('rejects query %j with 400', async (query) => {
    const fetchMock = stubSpotify(() => searchResult(BAKER_BOY))
    const handler = await loadHandler()
    const { res, sent } = fakeResponse()

    await handler(request(query), res)

    expect(sent.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns 500 without calling Spotify when credentials are not configured', async () => {
    const fetchMock = stubSpotify(() => searchResult(BAKER_BOY))
    const handler = await loadHandler({ clientSecret: '' })
    const { res, sent } = fakeResponse()

    await handler(request({ name: 'Baker Boy' }), res)

    expect(sent.status).toBe(500)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns 502 when Spotify rejects the credentials', async () => {
    stubSpotify(
      () => searchResult(BAKER_BOY),
      () => json({ error: 'invalid_client' }, 400),
    )
    const handler = await loadHandler()
    const { res, sent } = fakeResponse()

    await handler(request({ name: 'Baker Boy' }), res)

    expect(sent.status).toBe(502)
    expect(sent.body).toEqual({ error: 'Spotify auth failed: 400' })
  })

  it('returns 502 when the search fails', async () => {
    stubSpotify(() => json({ error: { status: 429 } }, 429))
    const handler = await loadHandler()
    const { res, sent } = fakeResponse()

    await handler(request({ name: 'Baker Boy' }), res)

    expect(sent.status).toBe(502)
    expect(sent.body).toEqual({ error: 'Spotify search failed: 429' })
  })
})
