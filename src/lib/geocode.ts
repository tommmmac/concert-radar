export interface GeocodedLocation {
  lat: number
  lng: number
  label: string
}

// Free, no API key required. Usage policy: max ~1 req/sec, identify via
// a descriptive query — fine for this project's scale.
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'

export async function geocodeCity(query: string): Promise<GeocodedLocation | null> {
  const params = new URLSearchParams({
    format: 'json',
    q: query,
    limit: '1',
  })

  const res = await fetch(`${NOMINATIM_URL}?${params}`)
  if (!res.ok) {
    throw new Error('Location search failed — try again')
  }

  const results: Array<{ lat: string; lon: string; display_name: string }> = await res.json()
  if (results.length === 0) return null

  const [result] = results
  return {
    lat: parseFloat(result.lat),
    lng: parseFloat(result.lon),
    label: result.display_name.split(',').slice(0, 2).join(', '),
  }
}
