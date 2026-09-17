import { Link } from 'react-router-dom'
import './Footer.css'

function Footer() {
  return (
    <footer className="app-footer">
      <span>Concert Radar — Built for finding the next show</span>
      <nav className="footer-links">
        <Link to="/about">About</Link>
        <a href="https://github.com/tommmmac/concert-radar" target="_blank" rel="noreferrer">
          GitHub
        </a>
      </nav>
    </footer>
  )
}

export default Footer
