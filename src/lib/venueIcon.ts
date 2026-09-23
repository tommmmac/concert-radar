import L from 'leaflet'

// Venue map pin: a pink teardrop whose head is the app's logo record (dark
// vinyl, cyan grooves, pink sweep, teal label — see public/favicon.svg).
// Inline SVG in a divIcon, so there are no image files for Vite to break.
const PIN_WIDTH = 36
const PIN_HEIGHT = 46

const pinSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 46" width="${PIN_WIDTH}" height="${PIN_HEIGHT}">
  <path d="M18 45C18 45 3 28.5 3 18a15 15 0 1 1 30 0c0 10.5-15 27-15 27z"
        fill="#ff2ea6" stroke="#0a0a0f" stroke-opacity="0.5" stroke-width="1.5"/>
  <circle cx="18" cy="18" r="12" fill="#0a0a0f"/>
  <circle cx="18" cy="18" r="9.5" fill="none" stroke="#22d3ee" stroke-opacity="0.35" stroke-width="1"/>
  <circle cx="18" cy="18" r="6.5" fill="none" stroke="#22d3ee" stroke-opacity="0.35" stroke-width="1"/>
  <line x1="18" y1="18" x2="25.8" y2="10.2" stroke="#ff2ea6" stroke-width="1.6" stroke-linecap="round"/>
  <circle cx="25.8" cy="10.2" r="1.8" fill="#ff2ea6"/>
  <circle cx="18" cy="18" r="3.6" fill="#0d1f21" stroke="#22d3ee" stroke-width="0.9"/>
  <circle cx="18" cy="18" r="1" fill="#22d3ee"/>
</svg>`

export const venueIcon = L.divIcon({
  html: pinSvg,
  className: 'venue-pin', // replaces Leaflet's default white-box divIcon styling
  iconSize: [PIN_WIDTH, PIN_HEIGHT],
  iconAnchor: [PIN_WIDTH / 2, PIN_HEIGHT], // the pin's tip sits on the venue
})
