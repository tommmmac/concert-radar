export type Theme = 'light' | 'dark'

// Keep in sync with the inline script in index.html, which reads this key
// before first paint so a dark-mode visitor never sees a white flash.
export const THEME_STORAGE_KEY = 'concert-radar:theme'

/** A saved choice wins; otherwise follow the device's light/dark setting. */
export function resolveTheme(stored: string | null, systemPrefersDark: boolean): Theme {
  if (stored === 'light' || stored === 'dark') return stored
  return systemPrefersDark ? 'dark' : 'light'
}

export function readStoredTheme(): string | null {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY)
  } catch {
    return null
  }
}

export function storeTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Storage unavailable — the choice just won't survive a reload.
  }
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme
}

/** Whatever the index.html script (or a later toggle) already applied. */
export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}
