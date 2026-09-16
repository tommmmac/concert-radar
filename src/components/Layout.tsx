import { useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation as useRouteLocation } from 'react-router-dom'
import { getNearbyConcerts } from '../lib/events'
import { findNewEventIds } from '../lib/seenEvents'
import { groupByVenue, type VenueGroup } from '../lib/venues'
import type { ConcertEvent } from '../lib/ticketmaster'
import type { GeocodedLocation } from '../lib/geocode'
import Header from './Header'
import Footer from './Footer'
import './Layout.css'

const MELBOURNE: GeocodedLocation = { lat: -37.8136, lng: 144.9631, label: 'Melbourne' }

export interface AppContext {
  events: ConcertEvent[]
  venues: VenueGroup[]
  loading: boolean
  error: string | null
  newEventIds: Set<string>
  location: GeocodedLocation
  setLocation: (location: GeocodedLocation) => void
}

function Layout() {
  const routeLocation = useRouteLocation()
  const isWide = routeLocation.pathname === '/map'
  const [location, setLocation] = useState<GeocodedLocation>(MELBOURNE)
  const [events, setEvents] = useState<ConcertEvent[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [newEventIds, setNewEventIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    setLoading(true)
    setError(null)
    getNearbyConcerts(location.lat, location.lng)
      .then((fetched) => {
        setEvents(fetched)
        setNewEventIds(findNewEventIds(fetched.map((event) => event.id)))
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [location])

  const venues = useMemo(() => groupByVenue(events), [events])

  const context: AppContext = {
    events,
    venues,
    loading,
    error,
    newEventIds,
    location,
    setLocation,
  }

  return (
    <div className="page">
      <Header />
      <main className={isWide ? 'page-content page-content--wide' : 'page-content'}>
        <Outlet context={context} />
      </main>
      <Footer />
    </div>
  )
}

export default Layout
