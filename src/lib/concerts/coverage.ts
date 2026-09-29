import { distanceKm } from '../geocode'
import { CITIES, INGEST_RADIUS_KM } from './cities'

/**
 * Whether the database holds *every* event for this search: the search
 * circle must fit entirely inside a preloaded city's circle. "Near a city"
 * isn't enough — a 25km search 40km out from Melbourne would reach 15km
 * past the stored data and silently miss the shows there.
 */
export function isCovered(lat: number, lng: number, radiusKm: number): boolean {
  return CITIES.some((city) => distanceKm({ lat, lng }, city) + radiusKm <= INGEST_RADIUS_KM)
}
