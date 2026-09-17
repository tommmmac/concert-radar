# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start Vite dev server
npm run build    # tsc -b type-check, then vite build
npm run lint      # oxlint
npm run preview   # preview a production build locally
```

There is no test suite yet. `npm run build` (type-check + build) is the
main correctness gate; CI runs `npm run lint` and `npm run build` on every
PR and push to `main`.

Plain `npm run dev` does not serve `/api` routes. To exercise the Spotify
function locally, use `npx vercel dev` instead (requires `npx vercel
login` once) — it serves the Vite frontend and the Vercel functions
together. Both read env vars from the same `.env` file (Vite and
`vercel dev` disagree on `.env.local`, so this project uses plain
`.env` for everything, gitignored as usual).

### Env vars (`.env`, see `.env.example`)

- `VITE_TICKETMASTER_API_KEY` — required for live data (free at developer.ticketmaster.com)
- `VITE_USE_MOCK_DATA` — set `true` to develop against fixture data in
  `src/lib/mockEvents.ts` instead of hitting the live API (useful for UI
  work without burning Ticketmaster's rate limit). Vite only reads env
  vars at startup — restart `npm run dev` after changing this.
- `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` — server-only, no `VITE_`
  prefix (see Architecture below for why that distinction matters here).
  Free app at developer.spotify.com/dashboard.
- `VITE_LASTFM_API_KEY` — client-side safe (read-only, no secret involved),
  unlike the Spotify credentials above. Free key at
  last.fm/api/account/create.

## Architecture

**Shared data flow via router outlet context.** `Layout.tsx` is the sole
owner of app state — current search `location`, fetched `events`,
`venues` (grouped), `loading`, `error`, and `newEventIds` — fetched once
per location change and passed down to routed pages through React
Router's `<Outlet context={...}>` (typed as `AppContext`). Page
components read it with `useOutletContext<AppContext>()` rather than
fetching independently, so switching between News and Map doesn't
re-fetch. `LocationSearch` (rendered on the Map page) calls
`setLocation` from that context, which re-triggers the fetch effect in
`Layout` and updates both pages at once.

**`lib/events.ts` is the fetch entry point**, not `lib/ticketmaster.ts`
directly — it switches between the live Ticketmaster call and
`mockEvents.ts` fixtures based on `VITE_USE_MOCK_DATA`. Always go
through it so mock mode keeps working.

**Data fetching is entirely client-side** — `lib/ticketmaster.ts` calls
the Ticketmaster Discovery API directly from the browser with the API
key in a Vite env var (no backend proxy yet). A scheduled-ingestion /
database layer is on the roadmap (see README) for when this needs to
scale beyond a single-key, single-request-per-load model.

**Venue grouping** (`lib/venues.ts`): multiple events at the same venue
are merged into one `VenueGroup` (keyed by coordinates rounded to 4
decimal places) so the map shows one marker per venue rather than
stacked pins. Clicking a marker (`MapPage.tsx`) sets the selected venue,
rendered as a scrollable list of event cards in `VenuePanel`.

**"New since last visit" detection** (`lib/seenEvents.ts`): the News
feed diffs freshly fetched event IDs against a set persisted in
`localStorage`. On a genuinely first-ever visit nothing is flagged new
(to avoid flooding the feed with everything on load) — only IDs that
appear after a seed set already exists get the "New" badge.

**Map tiles**: Esri's free World Dark Gray Canvas (`MapPage.tsx`, two
stacked `TileLayer`s — Base + Reference for labels) was chosen
deliberately over CartoDB's dark tiles, which now bake an "API key
required" watermark into free/anonymous tile responses.

**`lib/leafletIconFix.ts`** is a side-effect-only module that must be
imported before any Leaflet marker renders — Vite's asset bundling
breaks Leaflet's default icon URL resolution, and this patches
`L.Icon.Default` to point at the bundled marker images.

**`api/spotify-artist.ts` is the one server-side piece of this app.**
Everything else fetches directly from the browser, but Spotify's Client
Credentials flow requires a client secret that must never reach the
client bundle (unlike Ticketmaster's key, which is safe client-side).
This Vercel serverless function (with shared token logic in
`api/_spotifyAuth.ts` — the `_` prefix tells Vercel it's not a route)
holds `SPOTIFY_CLIENT_ID`/`_SECRET`, exchanges them for an access token
(cached in a module-level variable across warm invocations), looks up
an artist by name, and returns only `{ name, imageUrl, spotifyUrl }` to
the frontend — the raw Spotify token never leaves the server.
`src/lib/spotify.ts` calls this endpoint with a two-tier cache
(in-memory, then `localStorage` with a 24h TTL via
`lib/persistentCache.ts`), and `useSpotifyArtist` (a hook, since each
`EventCard` needs its own per-artist fetch) wires it into the venue
panel's event cards, exposing a `loading` flag so the card can render a
skeleton placeholder instead of a layout jump.

Preview clips were tried and removed — Spotify's "Get Artist's Top
Tracks" endpoint (needed to find a `preview_url`) returned 403 for this
app even though "Get Artist" worked fine with the same token; that
endpoint is restricted to apps manually approved for Extended Quota
Mode. Don't re-add a preview feature without that approval — it will
fail 100% of the time, not just for tracks lacking a clip.

**`lib/lastfm.ts` is a separate, client-side-safe integration** — unlike
Spotify, Last.fm's `artist.getinfo` endpoint only needs a public API key
(no secret), so it's called directly from the browser and does not go
through `/api`. It supplies both the genre pills and the click-to-expand
bio on each `EventCard`, from a single request (`useArtistDetails`
hook). Note: Spotify's artist `genres` field was tried first and dropped
— it now returns empty consistently (even for major artists), a known
recent Spotify API regression — so Last.fm's community tags are the
actual genre source, not Spotify. Genre pill colors are deterministic,
hashed from the genre string (`lib/genreColor.ts`), not a maintained
palette, since there's no fixed list of possible genre tags.

**Routing**: `App.tsx` defines routes nested under a shared `Layout`
(header + footer chrome): `/` → `NewsPage`, `/map` → `MapPage`, `/about`
→ a currently-blank stub linked from the footer.

**Styling**: design tokens (colors, radii, shadows) live as CSS custom
properties on `:root` in `src/index.css`; component-scoped CSS files
consume them via `var(--color-accent)` etc.

## Workflow

Feature branches → PR → squash-merge into `main`. `main` is
branch-protected: PRs required (no direct pushes), CI must pass, linear
history only (squash/rebase merge — plain merge commits are blocked),
no force-push or branch deletion.
