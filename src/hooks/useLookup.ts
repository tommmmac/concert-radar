import { useEffect, useState } from 'react'

/**
 * Runs an async lookup (e.g. fetchArtistInfo) for `name` and re-runs it when
 * the name changes, so each card can fetch its own artist. `lookup` must be
 * stable (a module-level function), or it will re-fetch every render.
 */
export function useLookup<T>(name: string, lookup: (name: string) => Promise<T | null>) {
  // Tagged with the name it belongs to, so a result for the previous name
  // reads as "still loading" rather than showing the wrong artist.
  const [result, setResult] = useState<{ name: string; value: T | null } | null>(null)

  useEffect(() => {
    let cancelled = false
    lookup(name).then((value) => {
      if (!cancelled) setResult({ name, value })
    })
    return () => {
      cancelled = true
    }
  }, [name, lookup])

  const current = result?.name === name ? result : null
  return { data: current?.value ?? null, loading: current === null }
}
