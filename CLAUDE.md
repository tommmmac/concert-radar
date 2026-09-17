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

### Env vars (`.env.local`, see `.env.local.example`)

- `VITE_TICKETMASTER_API_KEY` — required for live data (free at developer.ticketmaster.com)
- `VITE_USE_MOCK_DATA` — set `true` to develop against fixture data in
  `src/lib/mockEvents.ts` instead of hitting the live API (useful for UI
  work without burning Ticketmaster's rate limit). Vite only reads env
  vars at startup — restart `npm run dev` after changing this.

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
