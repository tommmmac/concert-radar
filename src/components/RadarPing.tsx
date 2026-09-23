import type { CSSProperties } from 'react'
import './RadarPing.css'

// Must match the sweep animation's duration in RadarPing.css.
const SWEEP_SECONDS = 4

// Blips as (angle clockwise from 12 o'clock, distance from centre as % of
// the radius). Placed by hand to look scattered, not evenly spaced — and all
// on the left half (180–360°) and near the middle band, since the landing
// hero crops the right half and the top/bottom of the radar.
const BLIPS = [
  { angle: 222, distance: 38 },
  { angle: 232, distance: 70 },
  { angle: 251, distance: 84 },
  { angle: 276, distance: 56 },
  { angle: 303, distance: 38 },
  { angle: 312, distance: 62 },
  { angle: 341, distance: 50 },
]

/**
 * Decorative "record radar" for the landing hero, echoing the logo: a vinyl
 * disc whose grooves double as range rings. The record spins, carrying a
 * pink sweep painted on it, and blips ping as the sweep passes them. Each
 * blip's delay is derived from its angle, so the ping lines up with the sweep.
 */
function RadarPing() {
  return (
    <div className="radar" aria-hidden="true">
      {/* Grooves are perfect circles, so they don't need to rotate — only the
          asymmetric parts (sweep + label mark) spin, and that reads as the
          whole record turning. */}
      <div className="radar-grooves" />
      <div className="radar-spin">
        <div className="radar-sweep" />
        <div className="radar-label">
          <span className="radar-label-mark" />
        </div>
      </div>
      {BLIPS.map(({ angle, distance }) => {
        const radians = (angle * Math.PI) / 180
        // Radar is a square; 50% is the centre and the radius is 50%.
        const x = 50 + (distance / 2) * Math.sin(radians)
        const y = 50 - (distance / 2) * Math.cos(radians)
        const style = {
          left: `${x}%`,
          top: `${y}%`,
          animationDelay: `${(angle / 360) * SWEEP_SECONDS}s`,
        } as CSSProperties
        return <span key={angle} className="radar-blip" style={style} />
      })}
    </div>
  )
}

export default RadarPing
