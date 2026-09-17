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
- Artist images and preview clips (via Spotify) on venue event cards
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
cp .env.local.example .env.local
```

Add your Ticketmaster API key to `.env.local` (free at
[developer.ticketmaster.com](https://developer.ticketmaster.com/)), then:

```bash
npm run dev
```

Set `VITE_USE_MOCK_DATA=true` in `.env.local` to develop against fixture
data instead of the live API.

### Testing the Spotify integration locally

`npm run dev` (plain Vite) doesn't serve `/api` routes. To test artist
images/previews locally, add `SPOTIFY_CLIENT_ID` and
`SPOTIFY_CLIENT_SECRET` to **`.env`** (free app at
[developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)) —
note: plain `.env`, not `.env.local`. `vercel dev` only reads `.env` for
the API functions; Vite itself reads `.env.local` for the frontend, so
keep the two in sync (or just put everything in `.env`). Then run the app
through the Vercel CLI, which serves the frontend and `/api` functions
together:

```bash
npx vercel login   # one-time, opens a browser
npx vercel dev
```

## Development workflow

- Work happens on feature branches, merged into `main` via PR
- `main` is branch-protected: PRs required, CI (lint + build) must pass,
  linear history only (squash-merge), no force-push/delete
- `npm run lint` / `npm run build` before opening a PR

## Roadmap / TODO

**Next up:**
- [x] Spotify Web API — artist images + preview clips on venue cards
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
