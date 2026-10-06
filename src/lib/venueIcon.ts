import L from 'leaflet'

// Venue map pin: a red teardrop whose head is the app's logo record (black
// vinyl, cream grooves, mustard sweep, red label — see public/favicon.svg).
// Inline SVG in a divIcon, so there are no image files for Vite to break.
const PIN_WIDTH = 36
const PIN_HEIGHT = 46

const pinSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 46" width="${PIN_WIDTH}" height="${PIN_HEIGHT}">
  <path d="M18 45C18 45 3 28.5 3 18a15 15 0 1 1 30 0c0 10.5-15 27-15 27z"
        fill="#d8432a" stroke="#1b1814" stroke-width="1.5"/>
  <circle cx="18" cy="18" r="12" fill="#151311"/>
  <circle cx="18" cy="18" r="9.5" fill="none" stroke="#efe8da" stroke-opacity="0.22" stroke-width="1"/>
  <circle cx="18" cy="18" r="6.5" fill="none" stroke="#efe8da" stroke-opacity="0.22" stroke-width="1"/>
  <line x1="18" y1="18" x2="25.8" y2="10.2" stroke="#e9b13a" stroke-width="1.6" stroke-linecap="round"/>
  <circle cx="25.8" cy="10.2" r="1.8" fill="#e9b13a"/>
  <circle cx="18" cy="18" r="3.8" fill="#d8432a"/>
  <circle cx="18" cy="18" r="1" fill="#efe8da"/>
</svg>`

export const venueIcon = L.divIcon({
  html: pinSvg,
  className: 'venue-pin', // replaces Leaflet's default white-box divIcon styling
  iconSize: [PIN_WIDTH, PIN_HEIGHT],
  iconAnchor: [PIN_WIDTH / 2, PIN_HEIGHT], // the pin's tip sits on the venue
})
