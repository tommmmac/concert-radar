import { useEffect, useState } from 'react'
import { applyTheme, currentTheme, readStoredTheme, storeTheme, type Theme } from '../lib/theme'
import './ThemeToggle.css'

function ThemeToggle() {
  // index.html has already applied the right theme; just mirror it.
  const [theme, setTheme] = useState<Theme>(currentTheme)

  // Until the visitor picks one, keep following the device if it changes
  // (e.g. the OS switches to dark mode at sunset).
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    function handleChange(e: MediaQueryListEvent) {
      if (readStoredTheme()) return
      const next: Theme = e.matches ? 'dark' : 'light'
      applyTheme(next)
      setTheme(next)
    }
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [])

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    storeTheme(next)
    setTheme(next)
  }

  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Dark mode"
      className="theme-toggle"
      onClick={toggle}
    >
      <span className="theme-toggle-icon" aria-hidden="true">
        ☀️
      </span>
      <span className={isDark ? 'theme-toggle-track theme-toggle-track--on' : 'theme-toggle-track'}>
        <span className="theme-toggle-thumb" />
      </span>
      <span className="theme-toggle-icon" aria-hidden="true">
        🌙
      </span>
    </button>
  )
}

export default ThemeToggle
