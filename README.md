# Concert Radar

Find live concerts happening near you, plotted on a map — with a news feed
of newly announced shows, venue-by-venue event listings, and city search.

## Features

- Live event data from the [Ticketmaster Discovery API](https://developer.ticketmaster.com/)
- Interactive map with venue clustering and a click-through side panel of
  events per venue
- News feed flagging events newly added since your last visit
- City search (geocoded via OpenStreetMap Nominatim) with a "use my
  location" option
- Mock data mode for UI work without hitting API rate limits
- Artist images (via Spotify) on venue event cards
- Genre pills and a click-to-expand artist bio (via Last.fm) on event cards

## Tech stack

- React + Vite + TypeScript
- React Router
- Leaflet / react-leaflet + react-leaflet-cluster
- Esri World Dark Gray Canvas basemap (free, no API key)
- A Vercel serverless function (`api/spotify-artist.ts`) proxies Spotify's
  Client Credentials flow — the client secret can't safely live in
  frontend code, so this is the one part of the app with a backend

## Getting started

```bash
npm install
cp .env.example .env
```

Add your Ticketmaster API key to `.env` (free at
[developer.ticketmaster.com](https://developer.ticketmaster.com/)), then:

```bash
npm run dev
```

Set `VITE_USE_MOCK_DATA=true` in `.env` to develop against fixture
data instead of the live API.

### Testing the Spotify integration locally

`npm run dev` (plain Vite) doesn't serve `/api` routes. To test artist
images locally, add `SPOTIFY_CLIENT_ID` and
`SPOTIFY_CLIENT_SECRET` to `.env` (free app at
[developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)),
then run the app through the Vercel CLI instead, which serves the
frontend and `/api` functions together:

```bash
npx vercel login   # one-time, opens a browser
npx vercel dev
```

## Performance notes

Artist lookups (Spotify images, Last.fm genres/bio) are cached in
`localStorage` for 24h, so repeat visits to the same artist are instant
instead of re-fetching. `<link rel="preconnect">` hints in `index.html`
give the browser a head start on the DNS/TLS handshake for those
domains before the first request fires.

## Development workflow

- Work happens on feature branches, merged into `main` via PR
- `main` is branch-protected: PRs required, CI (lint + test + build) must
  pass, linear history only (squash-merge), no force-push/delete
- `npm run lint` / `npm test` / `npm run build` before opening a PR
- Tests use Vitest, colocated next to the code they cover (`foo.test.ts`
  beside `foo.ts`)

## Roadmap / TODO

**Next up:**
- [x] Spotify Web API — artist images on venue cards (preview clips
      turned out to be a dead end — Spotify blocks the Top Tracks
      endpoint for apps without manual Extended Quota Mode approval)
- [ ] Real music news feed via RSS (Pitchfork, NME, Rolling Stone Music),
      replacing the current "recently added events" feed
- [ ] Setlist.fm API — show what an artist played last time at a venue
- [x] Last.fm API — genre pills + artist bio (still want: trending
      artists / "trending near you")

**Later:**
- [ ] Genre and date-range filters
- [ ] Additional event sources (Bandsintown, Eventbrite, SeatGeek) for
      broader coverage / cheapest-ticket comparison
- [ ] Backend ingestion layer: scheduled pull into a database instead of
      querying Ticketmaster live on every request, for scale and stronger
      rate-limit headroom
- [ ] Deploy (Vercel)

## License

[MIT](LICENSE)
