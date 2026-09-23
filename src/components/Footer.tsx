import { Link } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'
import './Footer.css'

function Footer() {
  return (
    <footer className="app-footer">
      <span>Concert Radar — Built for finding the next show</span>
      <nav className="footer-links">
        <Link to="/about">About</Link>
        <Link to="/privacy">Privacy</Link>
        <a href="https://github.com/tommmmac/concert-radar" target="_blank" rel="noreferrer">
          GitHub
        </a>
        <ThemeToggle />
      </nav>
    </footer>
  )
}

export default Footer
