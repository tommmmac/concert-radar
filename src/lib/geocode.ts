export interface GeocodedLocation {
  lat: number
  lng: number
  label: string
  /**
   * The bigger city an outer suburb belongs to (Cranbourne → Melbourne).
   * When set, events are fetched around both points and the News feed splits
   * into "In {city}" and "Near {label}" sections. Unset for cities
   * themselves and for inner suburbs close enough that one search covers both.
   */
  city?: { lat: number; lng: number; label: string }
}

// Free, no API key required. Usage policy: max ~1 req/sec, identify via
// a descriptive query — fine for this project's scale.
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'

// How far (in degrees, ~220km) around the current location to prefer
// results. A preference only — searching "London" from Melbourne still works.
const BIAS_DEGREES = 2

// Suburbs nearer than this to their city centre (e.g. Fitzroy, ~2km) get a
// single search — a separate "In Melbourne" section would just repeat it.
const CITY_MIN_DISTANCE_KM = 15

export interface NominatimResult {
  lat: string
  lon: string
  name?: string
  display_name: string
  address?: Partial<
    Record<'suburb' | 'town' | 'village' | 'city' | 'municipality' | 'state' | 'country', string>
  >
}

/**
 * Nominatim viewbox (left,top,right,bottom) around a point, so an ambiguous
 * name like "Cranbourne" resolves to the Melbourne suburb, not the English
 * village of the same name.
 */
export function viewboxAround({ lat, lng }: { lat: number; lng: number }): string {
  // Rounded to 0.1° (~10km): plenty for biasing a search, and it means a
  // precise "use my location" position is never sent to Nominatim.
  const round = (n: number) => Math.round(n * 10) / 10
  return [lng - BIAS_DEGREES, lat + BIAS_DEGREES, lng + BIAS_DEGREES, lat - BIAS_DEGREES].map(round).join(',')
}

/**
 * Short place name for headings ("What's on in Cranbourne") — the place's
 * own name, never a street or the full "suburb, city, state, postcode" chain.
 */
export function placeLabel(result: NominatimResult): string {
  const address = result.address ?? {}
  return (
    result.name ||
    address.suburb ||
    address.town ||
    address.village ||
    address.city ||
    address.municipality ||
    result.display_name.split(',')[0].trim()
  )
}

/**
 * The query for a result's parent city ("Melbourne, Victoria, Australia"),
 * or null when the result *is* the city or isn't part of one.
 */
export function parentCityQuery(result: NominatimResult): string | null {
  const city = result.address?.city
  if (!city || city === placeLabel(result)) return null
  return [city, result.address?.state, result.address?.country].filter(Boolean).join(', ')
}

/** Great-circle distance in km (haversine). */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(h))
}

async function searchNominatim(query: string, near?: { lat: number; lng: number }): Promise<NominatimResult | null> {
  const params = new URLSearchParams({
    format: 'jsonv2',
    q: query,
    limit: '1',
    addressdetails: '1',
    // Towns, cities and suburbs only — otherwise "Cranbourne" matches
    // Cranbourne railway station and the label becomes "Cranbourne, Station Street".
    featureType: 'settlement',
  })
  if (near) params.set('viewbox', viewboxAround(near))

  const res = await fetch(`${NOMINATIM_URL}?${params}`)
  if (!res.ok) {
    throw new Error('Location search failed — try again')
  }

  const results: NominatimResult[] = await res.json()
  return results[0] ?? null
}

// City centres rarely move — cache them for the session so repeat searches
// in the same metro area cost one Nominatim request, not two.
const cityCache = new Map<string, Promise<NominatimResult | null>>()

async function findParentCity(
  result: NominatimResult,
  place: { lat: number; lng: number },
): Promise<GeocodedLocation['city']> {
  const query = parentCityQuery(result)
  if (!query) return undefined

  let lookup = cityCache.get(query)
  if (!lookup) {
    // Nominatim's usage policy allows ~1 request/sec; we just made one.
    lookup = new Promise((resolve) => setTimeout(resolve, 1000))
      .then(() => searchNominatim(query))
      .catch(() => null)
    cityCache.set(query, lookup)
  }

  const cityResult = await lookup
  if (!cityResult) return undefined

  const city = { lat: parseFloat(cityResult.lat), lng: parseFloat(cityResult.lon), label: placeLabel(cityResult) }
  return distanceKm(place, city) >= CITY_MIN_DISTANCE_KM ? city : undefined
}

export async function geocodeCity(
  query: string,
  near?: { lat: number; lng: number },
): Promise<GeocodedLocation | null> {
  const result = await searchNominatim(query, near)
  if (!result) return null

  const place = { lat: parseFloat(result.lat), lng: parseFloat(result.lon) }
  return {
    ...place,
    label: placeLabel(result),
    city: await findParentCity(result, place),
  }
}
