// Two-tier cache for artist lookups: an in-memory Map for the current
// session (fastest), backed by localStorage with a TTL so lookups survive a
// page reload too. If storage is unavailable (private browsing, etc.), the
// in-memory tier still works.
interface CacheEntry<T> {
  value: T
  expiresAt: number
}

const TTL_MS = 24 * 60 * 60 * 1000 // 24h, matches api/spotify-artist.ts's edge cache

function readCache<T>(namespace: string, key: string): T | undefined {
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

function writeCache<T>(namespace: string, key: string, value: T): void {
  try {
    const entry: CacheEntry<T> = { value, expiresAt: Date.now() + TTL_MS }
    localStorage.setItem(`${namespace}:${key}`, JSON.stringify(entry))
  } catch {
    // Storage full/unavailable — the in-memory tier still works.
  }
}

/**
 * Wraps a by-name lookup with both cache tiers. Names are matched
 * case-insensitively. Only real answers (including "not found" → null) are
 * persisted; a lookup that throws resolves to null for this session but
 * isn't written to storage, so the next page load retries it.
 */
export function cachedLookup<T>(
  namespace: string,
  lookup: (name: string) => Promise<T | null>,
): (name: string) => Promise<T | null> {
  const memory = new Map<string, Promise<T | null>>()

  return (name) => {
    const key = name.trim().toLowerCase()

    let promise = memory.get(key)
    if (!promise) {
      const persisted = readCache<T | null>(namespace, key)
      promise =
        persisted !== undefined
          ? Promise.resolve(persisted)
          : lookup(name)
              .then((result) => {
                writeCache(namespace, key, result)
                return result
              })
              .catch(() => null)
      memory.set(key, promise)
    }
    return promise
  }
}
