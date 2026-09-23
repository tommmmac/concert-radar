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
  /** Set when there were too few shows nearby and the search radius was widened. */
  widenedToKm: number | null
  location: GeocodedLocation
}

function Layout() {
  const routeLocation = useRouteLocation()
  const isWide = routeLocation.pathname === '/map' || routeLocation.pathname === '/news'
  const [location, setLocation] = useState<GeocodedLocation>(MELBOURNE)
  const [events, setEvents] = useState<ConcertEvent[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [newEventIds, setNewEventIds] = useState<Set<string>>(new Set())
  const [widenedToKm, setWidenedToKm] = useState<number | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getNearbyConcerts(location)
      .then((fetched) => {
        setEvents(fetched.events)
        setWidenedToKm(fetched.widenedToKm)
        setNewEventIds(findNewEventIds(fetched.events.map((event) => event.id)))
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
    widenedToKm,
    location,
  }

  return (
    <div className="page">
      <Header location={location} onLocationChange={setLocation} />
      <main className={isWide ? 'page-content page-content--wide' : 'page-content'}>
        <Outlet context={context} />
      </main>
      <Footer />
    </div>
  )
}

export default Layout
