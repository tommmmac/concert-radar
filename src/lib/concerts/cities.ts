// The cities the daily ingest job (scripts/ingest.ts) preloads into the
// database. Searches that fall inside one of these areas are answered from
// /api/events; anywhere else still searches Ticketmaster live
// (lib/concerts/coverage.ts). Imported by the ingest script too, so keep
// this file free of imports.
//
// Only list cities in countries Ticketmaster covers. Each city costs a few
// requests a day (more for big ones) out of Ticketmaster's ~5,000.

export interface IngestCity {
  /** Stable id, stored with each event. Don't rename once ingested. */
  slug: string
  name: string
  lat: number
  lng: number
}

/** Each city's events are loaded this far around its centre. */
export const INGEST_RADIUS_KM = 50

export const CITIES: IngestCity[] = [
  // Australia
  { slug: 'melbourne', name: 'Melbourne', lat: -37.8136, lng: 144.9631 },
  { slug: 'sydney', name: 'Sydney', lat: -33.8688, lng: 151.2093 },
  { slug: 'brisbane', name: 'Brisbane', lat: -27.4698, lng: 153.0251 },
  { slug: 'perth', name: 'Perth', lat: -31.9523, lng: 115.8613 },
  { slug: 'adelaide', name: 'Adelaide', lat: -34.9285, lng: 138.6007 },
  { slug: 'hobart', name: 'Hobart', lat: -42.8821, lng: 147.3272 },
  { slug: 'canberra', name: 'Canberra', lat: -35.2809, lng: 149.13 },
  { slug: 'darwin', name: 'Darwin', lat: -12.4634, lng: 130.8456 },
  { slug: 'gold-coast', name: 'Gold Coast', lat: -28.0167, lng: 153.4 },
  { slug: 'sunshine-coast', name: 'Sunshine Coast', lat: -26.65, lng: 153.0667 },
  { slug: 'newcastle-au', name: 'Newcastle', lat: -32.9283, lng: 151.7817 },
  { slug: 'wollongong', name: 'Wollongong', lat: -34.4278, lng: 150.8931 },
  { slug: 'geelong', name: 'Geelong', lat: -38.1499, lng: 144.3617 },
  { slug: 'cairns', name: 'Cairns', lat: -16.9186, lng: 145.7781 },
  { slug: 'townsville', name: 'Townsville', lat: -19.259, lng: 146.8169 },
  // New Zealand
  { slug: 'auckland', name: 'Auckland', lat: -36.8485, lng: 174.7633 },
  { slug: 'wellington', name: 'Wellington', lat: -41.2865, lng: 174.7762 },
  // UK & Ireland
  { slug: 'london', name: 'London', lat: 51.5072, lng: -0.1276 },
  { slug: 'manchester', name: 'Manchester', lat: 53.4808, lng: -2.2426 },
  { slug: 'glasgow', name: 'Glasgow', lat: 55.8642, lng: -4.2518 },
  { slug: 'dublin', name: 'Dublin', lat: 53.3498, lng: -6.2603 },
  // North America
  { slug: 'new-york', name: 'New York', lat: 40.7128, lng: -74.006 },
  { slug: 'los-angeles', name: 'Los Angeles', lat: 34.0522, lng: -118.2437 },
  { slug: 'chicago', name: 'Chicago', lat: 41.8781, lng: -87.6298 },
  { slug: 'san-francisco', name: 'San Francisco', lat: 37.7749, lng: -122.4194 },
  { slug: 'austin', name: 'Austin', lat: 30.2672, lng: -97.7431 },
  { slug: 'nashville', name: 'Nashville', lat: 36.1627, lng: -86.7816 },
  { slug: 'seattle', name: 'Seattle', lat: 47.6062, lng: -122.3321 },
  { slug: 'toronto', name: 'Toronto', lat: 43.6532, lng: -79.3832 },
  { slug: 'vancouver', name: 'Vancouver', lat: 49.2827, lng: -123.1207 },
  { slug: 'montreal', name: 'Montreal', lat: 45.5019, lng: -73.5674 },
  { slug: 'mexico-city', name: 'Mexico City', lat: 19.4326, lng: -99.1332 },
  // Europe
  { slug: 'berlin', name: 'Berlin', lat: 52.52, lng: 13.405 },
  { slug: 'amsterdam', name: 'Amsterdam', lat: 52.3676, lng: 4.9041 },
  { slug: 'madrid', name: 'Madrid', lat: 40.4168, lng: -3.7038 },
  { slug: 'barcelona', name: 'Barcelona', lat: 41.3874, lng: 2.1686 },
]
