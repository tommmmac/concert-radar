import { Link, NavLink } from 'react-router-dom'
import LocationSearch from './LocationSearch'
import type { GeocodedLocation } from '../lib/geocode'
import './Header.css'

interface HeaderProps {
  location: GeocodedLocation
  onLocationChange: (location: GeocodedLocation) => void
}

function Header({ location, onLocationChange }: HeaderProps) {
  return (
    <header className="app-header">
      <Link to="/" className="header-brand">
        <img className="brand-mark" src="/favicon.svg" alt="" aria-hidden="true" />
        <div>
          <h1 className="brand">Concert Radar</h1>
          <p className="tagline">Live music happening near you</p>
        </div>
      </Link>

      <nav className="header-nav">
        <NavLink to="/news" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          News
        </NavLink>
        <NavLink to="/map" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          Map
        </NavLink>
      </nav>

      <LocationSearch location={location} onLocationChange={onLocationChange} />
    </header>
  )
}

export default Header
