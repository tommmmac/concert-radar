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

## Tech stack

- React + Vite + TypeScript
- React Router
- Leaflet / react-leaflet + react-leaflet-cluster
- Esri World Dark Gray Canvas basemap (free, no API key)

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

## Development workflow

- Work happens on feature branches, merged into `main` via PR
- `main` is branch-protected: PRs required, CI (lint + build) must pass,
  linear history only (squash-merge), no force-push/delete
- `npm run lint` / `npm run build` before opening a PR

## Roadmap / TODO

**Next up:**
- [ ] Spotify Web API — artist images + preview clips on venue cards
- [ ] Real music news feed via RSS (Pitchfork, NME, Rolling Stone Music),
      replacing the current "recently added events" feed
- [ ] Setlist.fm API — show what an artist played last time at a venue
- [ ] Last.fm API — trending artists / "trending near you"

**Later:**
- [ ] Genre and date-range filters
- [ ] Additional event sources (Bandsintown, Eventbrite, SeatGeek) for
      broader coverage / cheapest-ticket comparison
- [ ] Backend ingestion layer: scheduled pull into a database instead of
      querying Ticketmaster live on every request, for scale and stronger
      rate-limit headroom
- [ ] Deploy (Vercel)
