# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start Vite dev server
npm run build    # tsc -b type-check, then vite build
npm run lint      # oxlint
npm test          # vitest run (one-shot; use `npx vitest` for watch mode)
npm run test:live # live checks against the real APIs (uses .env keys)
npm run ingest    # run the daily events ingest locally (needs DATABASE_URL in .env)
npm run preview   # preview a production build locally
```

Tests are colocated with the code they cover (`foo.ts` → `foo.test.ts`),
not in a separate `tests/` folder — keeps a test in view whenever you
touch its source. Vitest environment is plain `node` (no jsdom/DOM
testing set up yet); it's for pure logic (`lib/**/*.ts`), not components.

API clients are tested against a stubbed `fetch` (`vi.stubGlobal('fetch',
...)` returning a real `Response`), never the live APIs. Modules that
read an API key or hold a cache at load time are imported fresh per
test: `vi.stubEnv(...)`, `vi.resetModules()`, then `await import(...)`
(see `lib/concerts/ticketmaster.test.ts`). Vitest loads `.env`, so a test
touching `lib/concerts/events.ts` must pin `VITE_USE_MOCK_DATA` itself or
it silently takes the mock path. Tests for `api/` functions must start
with `_` (`api/_spotify-artist.test.ts`) — Vercel deploys every other
file in `api/` as a route. Vitest doesn't type-check, so run
`npm run build` too.
CI runs `npm run lint`, `npm test`, and `npm run build` on every PR and
push to `main`, plus a gitleaks scan of the full git history for
committed secrets.

**Live API checks** (`*.live.test.ts`, colocated like other tests) call
the real Last.fm and Nominatim APIs plus production's
`/api/spotify-artist`, `/api/ticketmaster-search` and `/api/events`, and assert
only the fields the app relies on. They're excluded from `npm test`
(`vite.config.ts`) and run via `vitest.live.config.ts` — daily at 6am
Melbourne by `.github/workflows/api-health.yml` (also a manual "Run
workflow" button), with the Last.fm key from the `LASTFM_API_KEY` repo
secret (the Ticketmaster checks go through production, so need no key).
A failed run emails whoever last edited the workflow's cron line. If an upstream API changes, extend the relevant
live check alongside the fix.

Plain `npm run dev` does not serve `/api` routes. To exercise the `/api`
functions (live events, Spotify) locally, use `npx vercel dev` instead (requires `npx vercel
login` once) — it serves the Vite frontend and the Vercel functions
together. Both read env vars from the same `.env` file (Vite and
`vercel dev` disagree on `.env.local`, so this project uses plain
`.env` for everything, gitignored as usual).

### Env vars (`.env`, see `.env.example`)

- `TICKETMASTER_API_KEY` — server-only, for `api/ticketmaster-search.ts`
  and `npm run ingest` (free at developer.ticketmaster.com). Deliberately
  not a `VITE_` var: those are bundled into the public JavaScript, where
  anyone can copy the key and use up its 5,000/day quota. Production
  (Vercel) and the ingest (GitHub secret) use separate keys (separate
  Ticketmaster "apps"), so one being used up can't take down the other.
- `VITE_USE_MOCK_DATA` — set `true` to develop against fixture data in
  `src/lib/concerts/mockEvents.ts` instead of hitting the live API (useful for UI
  work without burning Ticketmaster's rate limit). Vite only reads env
  vars at startup — restart `npm run dev` after changing this.
- `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` — server-only, no `VITE_`
  prefix (see Architecture below for why that distinction matters here).
  Free app at developer.spotify.com/dashboard.
- `DATABASE_URL` — server-only Neon Postgres connection string, for
  `api/events.ts` and `npm run ingest`. Set on Vercel by the Neon
  integration and as a GitHub secret for the ingest workflow; paste it
  into `.env` by hand (`vercel env pull .env` would overwrite the file).
- `VITE_LASTFM_API_KEY` — client-side safe (read-only, no secret involved),
  unlike the Spotify credentials above. Free key at
  last.fm/api/account/create.

## Architecture

**`src/lib` is grouped by topic**, tests colocated in each folder:
`lib/concerts/` (Ticketmaster fetching, mock data, and grouping events
by venue/artist/area), `lib/artistInfo/` (Spotify + Last.fm lookups and
their cache), and cross-cutting helpers at the top level (`geocode`,
`formatDate`, `theme`, `venueIcon`). Put new modules in the folder whose
topic they serve, rather than back at the top level.

**Shared data flow via router outlet context.** `Layout.tsx` is the sole
owner of app state — current search `location`, fetched `events`,
`venues` (grouped), `loading`, `error`, and `newEventIds` — fetched once
per location change and passed down to routed pages through React
Router's `<Outlet context={...}>` (typed as `AppContext`). Page
components read it with `useOutletContext<AppContext>()` rather than
fetching independently, so switching between News and Map doesn't
re-fetch. `LocationSearch` lives in the `Header` (every page), which
`Layout` renders directly and hands `setLocation` as a prop — pages only
read the location, they never set it. Changing it re-triggers the fetch
effect in `Layout` and updates every page at once.

**`lib/concerts/events.ts` is the fetch entry point**, not `lib/concerts/ticketmaster.ts`
directly — it switches between the live Ticketmaster call and
`mockEvents.ts` fixtures based on `VITE_USE_MOCK_DATA`. Always go
through it so mock mode keeps working.

**Events come from a database for preloaded cities, live elsewhere.**
A daily GitHub Actions job (`.github/workflows/ingest.yml` →
`scripts/ingest.ts`) loads every city in `lib/concerts/cities.ts` (50km
around each) from Ticketmaster into Neon Postgres (`api/_db.ts`, table
created on first run), paging past the 200-result cap and splitting date
ranges to stay under Ticketmaster's 1,000-result deep-paging limit.
`api/events.ts` serves it by distance. In `lib/concerts/events.ts`, each
search circle goes to `/api/events` only if `isCovered()`
(`lib/concerts/coverage.ts`) says the circle fits *inside* a preloaded
city's area — otherwise, or if `/api/events` fails,
`lib/concerts/ticketmaster.ts` searches live through
`/api/ticketmaster-search` (edge-cached for an hour). Plain `npm run dev`
serves neither, so use mock mode or `npx vercel dev` there. Response
parsing lives in `lib/concerts/discovery.ts`, which has no imports and
no `import.meta.env` so the Node script can load it (same for
`cities.ts`). Adding a city: append it to `CITIES`, then "Run workflow"
on the ingest action. The daily live check
(`storedEvents.live.test.ts`) fails if the data is over 36h old — the
site would silently fall back to live searches otherwise.

**Venue grouping** (`lib/concerts/venues.ts`): multiple events at the same venue
are merged into one `VenueGroup` (keyed by coordinates rounded to 4
decimal places) so the map shows one marker per venue rather than
stacked pins. Clicking a marker (`MapPage.tsx`) sets the selected venue,
rendered as a scrollable list of event cards in `VenuePanel`.

**"New since last visit" detection** (`lib/concerts/seenEvents.ts`): the News
feed diffs freshly fetched event IDs against a set persisted in
`localStorage`, **one set per area** (keyed by the search location rounded
to 0.1°, ~10km). On a first visit to an area nothing is flagged new (to
avoid flooding the feed with everything on load) — only IDs that appear
after that area's seed set exists get the "New" badge. The per-area key
matters: with a single shared set, the first search of any other city
flagged every one of its events as new. The feed
still lists every event, not just new ones: new IDs only drive the badge
and sort order (new first). Cards are revealed 12 at a time
(`PAGE_SIZE` in `NewsFeed.tsx`) because each one triggers its own
Spotify + Last.fm lookup.

**"Just announced"** (`lib/concerts/announced.ts`) is the shared,
no-login counterpart: the ingest stamps each event's `first_seen_at` when
it first finds it (never updated afterwards), `/api/events` returns it as
`announcedAt`, and the News card shows "Just announced" for 7 days
(`JUST_ANNOUNCED_DAYS`). A city's first successful ingest is a
*baseline* (tracked in the `ingested_cities` table): its events get
`first_seen_at = NULL`, so adding a city doesn't flag every show it
already had. Only database-served events have it — live Ticketmaster
results never get the badge. "New" (personal) outranks it on a card.

**Location search** (`lib/geocode.ts`): Nominatim with
`featureType=settlement` (so "Cranbourne" isn't a railway station) and a
`viewbox` bias around the current location (so it isn't the English
village), labelled by the place's own name. If the place is an outer
suburb of a bigger city (≥15km from its centre), `GeocodedLocation.city`
is set and `lib/concerts/events.ts` fetches 25km around **both** points and merges
them into one list (`lib/concerts/areas.ts`); the map frames both points.
Places *without* a parent city (a city itself, or a country town) that
find fewer than 20 shows widen the radius 25 → 50 → 100km instead
(`widenUntilEnough`), and the News banner says so. This depends on how
OpenStreetMap models each metro area, so it's inconsistent worldwide by
design — a stopgap until the scheduled-ingestion/DB layer (see README)
makes "which events to show" a query instead of per-visitor API calls.

**Dates**: always display event dates through `formatEventDate`
(`lib/formatDate.ts`, e.g. "Friday 25th September 2026") rather than
raw Ticketmaster `localDate` strings or `new Date(str)` — date-only
strings parse as UTC and can land on the wrong day.

**Map tiles**: Esri's free World Dark Gray Canvas (`MapPage.tsx`, two
stacked `TileLayer`s — Base + Reference for labels) was chosen
deliberately over CartoDB's dark tiles, which now bake an "API key
required" watermark into free/anonymous tile responses.

**Map pins** use a custom `L.divIcon` (`lib/venueIcon.ts`) — inline SVG
of the logo record in a red pin, so no image assets are involved. Pass
`icon={venueIcon}` to every `<Marker>`: Leaflet's *default* icon is no
longer patched for Vite (the old `leafletIconFix.ts` was removed), so a
marker without an explicit icon would render as a broken image.

**`api/spotify-artist.ts` keeps the Spotify secret server-side.**
Spotify's Client Credentials flow requires a client secret that must
never reach the client bundle (the Ticketmaster key moved server-side
for a related reason — see Env vars).
This Vercel serverless function (with shared token logic in
`api/_spotifyAuth.ts` — the `_` prefix tells Vercel it's not a route)
holds `SPOTIFY_CLIENT_ID`/`_SECRET`, exchanges them for an access token
(cached in a module-level variable across warm invocations), looks up
an artist by name, and returns only `{ name, imageUrl, spotifyUrl }` to
the frontend — the raw Spotify token never leaves the server.
`src/lib/artistInfo/spotify.ts` calls this endpoint.

**Artist lookups (Spotify and Last.fm) share one pipeline.** Each lib
wraps its fetch in `cachedLookup()` (`lib/artistInfo/persistentCache.ts`): a
two-tier cache (in-memory, then `localStorage` with a 24h TTL) that
persists "not found" answers but not failures, so a reload retries.
Cards call the generic `useLookup(name, fetchArtistInfo)` hook
(`hooks/useLookup.ts`) — a hook since each card needs its own
per-artist fetch — which exposes a `loading` flag so the card can
render a skeleton placeholder instead of a layout jump. Pass
module-level lookup functions to it; an inline arrow would re-fetch
every render. A new artist data source should follow the same pattern
rather than adding its own cache or hook.

Preview clips were tried and removed — Spotify's "Get Artist's Top
Tracks" endpoint (needed to find a `preview_url`) returned 403 for this
app even though "Get Artist" worked fine with the same token; that
endpoint is restricted to apps manually approved for Extended Quota
Mode. Don't re-add a preview feature without that approval — it will
fail 100% of the time, not just for tracks lacking a clip.

**`lib/artistInfo/lastfm.ts` is a separate, client-side-safe integration** — unlike
Spotify, Last.fm's `artist.getinfo` endpoint only needs a public API key
(no secret), so it's called directly from the browser and does not go
through `/api`. It supplies both the genre pills and the bio (click to
expand on `ArtistCard`, a 3-line excerpt on `NewsCard`), from a single
request (`fetchArtistDetails`). Note: Spotify's artist `genres` field was tried first and dropped
— it now returns empty consistently (even for major artists), a known
recent Spotify API regression — so Last.fm's community tags are the
actual genre source for the pills on cards, not Spotify.

**Genre filter** (`lib/concerts/genres.ts`, `GenreFilter`) uses a
different source: Ticketmaster's own top-level `classifications` genre
("Rock", "Hip-Hop/Rap", ~15 fixed values), parsed in `discovery.ts` so
both the ingest and the live search get it. A fixed list makes tidy
chips; Last.fm's free-text tags ("seen live", "australian") would not.
The selection lives in `Layout` (`selectedGenres`) so News and Map
share it; each page filters its own copy, so `events`/`venues` in the
context stay unfiltered. The same parse also keeps Ticketmaster's
headline act (`artistName`), which `lookupArtistName()` prefers over
`cleanArtistName(event.name)` for Spotify/Last.fm lookups.

Spotify's Developer Terms (IV.3.1.a) forbid storing "databases of
Spotify Content", so artist photos stay per-visitor lookups (edge- and
`localStorage`-cached) — don't move them into the ingest/DB. Last.fm
data may be stored (under its 100 MB cap). Genre pill colors are deterministic,
hashed from the genre string (`lib/artistInfo/genreColor.ts`), not a maintained
palette, since there's no fixed list of possible genre tags.

**Routing**: `App.tsx` defines routes nested under a shared `Layout`
(header + footer chrome): `/` → `LandingPage`, `/news` → `NewsPage`,
`/map` → `MapPage`, plus `/about`, `/privacy` and `/terms` (linked from the footer,
sharing `pages/InfoPage.css`). Keep `Privacy.tsx` in sync if you add new
`localStorage` keys or third-party services.

**Attribution is a licence requirement, not decoration.** Spotify's
developer terms require artist artwork to link back to Spotify (use
`SpotifyArtistImage`, never a bare `<img>`), and Last.fm bios are CC
BY-SA wiki text, so every place a bio is shown links to the artist's
Last.fm page (`LastFmArtistDetails.url`).

**Styling**: a flat "record shop" look — cream sleeve-card paper, ink
rules, a red record-label accent and a mustard "sticker" for highlights;
no gradients or soft shadows. Archivo (variable, condensed via
`font-stretch` for headings) plus IBM Plex Mono (`.mono`) for dates and
counts. Design tokens live as CSS custom properties on `:root` in
`src/index.css`, along with the shared `.btn` / `.sticker` classes;
component-scoped CSS files consume them via `var(--color-accent)` etc.
Never hard-code a light colour in component CSS — use a token, so dark
mode keeps working. (`RadarPing`, the logo and map pins are the
exception: a black record in both themes, so they use fixed colours.)

**Theming**: light/dark via `data-theme` on `<html>`, with dark overrides
in `:root[data-theme='dark']` (`index.css`); the header and footer
follow the theme like everything else. An
inline script in `index.html` picks the theme before first paint (saved
choice in `localStorage`, else the device's `prefers-color-scheme`) —
same rules as `resolveTheme()` in `lib/theme.ts`, so keep the two in
sync. `ThemeToggle` (footer) flips and saves it. Genre pills get only a
hue from `lib/artistInfo/genreColor.ts` (`--genre-hue`); `.genre-pill` sets
lightness per theme.

## Workflow

Feature branches → PR → squash-merge into `main`. `main` is
branch-protected: PRs required (no direct pushes), CI must pass, linear
history only (squash/rebase merge — plain merge commits are blocked),
no force-push or branch deletion.
