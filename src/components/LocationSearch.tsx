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
      // Bias towards the area already being viewed, so "Cranbourne" means the one near here.
      const result = await geocodeCity(query.trim(), location)
      if (!result) {
        setError("Couldn't find that place")
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
      setError("Your browser can't share your location")
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
        setError("Couldn't get your location. Check the site's location permission.")
        setSearching(false)
      },
    )
  }

  return (
    // Lives in the header (not on a page) because the location is app-wide
    // state in Layout — searching here updates News, Map and the landing page.
    <form className="location-search" onSubmit={handleSearch} role="search">
      <label className="location-search-current" htmlFor="location-search-input">
        Near <strong>{location.label}</strong>
      </label>
      <div className="location-search-field">
        <input
          id="location-search-input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a suburb or city…"
          disabled={searching}
        />
        <button type="submit" className="location-search-submit" disabled={searching || !query.trim()}>
          {searching ? '…' : 'Search'}
        </button>
        <button
          type="button"
          className="location-search-geo"
          onClick={handleUseMyLocation}
          disabled={searching}
          title="Use my location"
          aria-label="Use my location"
        >
          {/* Crosshair */}
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <circle cx="8" cy="8" r="5" />
            <circle cx="8" cy="8" r="1.2" fill="currentColor" stroke="none" />
            <path d="M8 0.5v3M8 12.5v3M0.5 8h3M12.5 8h3" />
          </svg>
        </button>
      </div>
      {error && (
        <p className="location-search-error" role="alert">
          {error}
        </p>
      )}
    </form>
  )
}

export default LocationSearch
