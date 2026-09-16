import { Link, NavLink } from 'react-router-dom'
import './Header.css'

function Header() {
  return (
    <header className="app-header">
      <Link to="/" className="header-brand">
        <span className="brand-mark" aria-hidden="true">
          ◎
        </span>
        <div>
          <h1 className="brand">Concert Radar</h1>
          <p className="tagline">Live music happening near you</p>
        </div>
      </Link>

      <nav className="header-nav">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          News
        </NavLink>
        <NavLink to="/map" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          Map
        </NavLink>
      </nav>
    </header>
  )
}

export default Header
