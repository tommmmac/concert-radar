// Thin localStorage-backed cache with a TTL, so artist lookups survive a
// page reload instead of re-fetching every visit. Falls back to just an
// in-memory Map entry if storage is unavailable (private browsing, etc).
interface CacheEntry<T> {
  value: T
  expiresAt: number
}

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000 // 24h, matches the API's own edge cache

export function readCache<T>(namespace: string, key: string): T | undefined {
  try {
    const raw = localStorage.getItem(`${namespace}:${key}`)
    if (!raw) return undefined

    const entry: CacheEntry<T> = JSON.parse(raw)
    if (entry.expiresAt < Date.now()) {
      localStorage.removeItem(`${namespace}:${key}`)
      return undefined
    }
    return entry.value
  } catch {
    return undefined
  }
}

export function writeCache<T>(namespace: string, key: string, value: T, ttlMs = DEFAULT_TTL_MS): void {
  try {
    const entry: CacheEntry<T> = { value, expiresAt: Date.now() + ttlMs }
    localStorage.setItem(`${namespace}:${key}`, JSON.stringify(entry))
  } catch {
    // Storage full/unavailable — the in-memory cache in the caller still works.
  }
}
