import { useState } from 'react'
import { geocodeCity } from '../lib/geocode'
import type { GeocodedLocation } from '../lib/geocode'
import './LocationSearch.css'

interface LocationSearchProps {
  location: GeocodedLocation
  onLocationChange: (location: GeocodedLocation) => void
}

function LocationSearch({ location, onLocationChange }: LocationSearchProps) {
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return

    setSearching(true)
    setError(null)
    try {
      const result = await geocodeCity(query.trim())
      if (!result) {
        setError('No matching location found')
      } else {
        onLocationChange(result)
        setQuery('')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setSearching(false)
    }
  }

  function handleUseMyLocation() {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }

    setSearching(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onLocationChange({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          label: 'Your location',
        })
        setSearching(false)
      },
      () => {
        setError('Could not get your location')
        setSearching(false)
      },
    )
  }

  return (
    <aside className="location-search">
      <h2>Search a city</h2>
      <p className="location-search-current">
        Showing shows near <strong>{location.label}</strong>
      </p>

      <form onSubmit={handleSearch}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. Sydney, Tokyo…"
          disabled={searching}
        />
        <button type="submit" disabled={searching || !query.trim()}>
          {searching ? 'Searching…' : 'Search'}
        </button>
      </form>

      <button className="location-search-geo" onClick={handleUseMyLocation} disabled={searching}>
        📍 Use my location
      </button>

      {error && <p className="location-search-error">{error}</p>}
    </aside>
  )
}

export default LocationSearch
