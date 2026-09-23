// Ticketmaster event names are marketing copy, not artist names:
// "James Massiah (UK)", "Iron Maiden - Run For Your Lives World Tour",
// "Tash Sultana with special guests". Spotify and Last.fm look up by exact
// artist name, so strip the obvious extras first.
//
// Deliberately conservative — only cut at unambiguous markers. Never split
// on "+" or "&" (Florence + the Machine, Simon & Garfunkel): a wrong match
// shows someone else's photo and bio, which is worse than no match.
const CUT_MARKERS = [
  /\s+[-–—]\s+/, // spaced dash: "Artist - Tour Name"
  /:\s+/, // "Artist: Tour Name"
  /\s+with special guests?\b/i,
  /\s+w\/\s*/i,
  /\s+(?:feat\.?|ft\.?|featuring)\s+/i,
]

// Trailing "(UK)", "[18+]", "(DJ Set)" — possibly several in a row.
const TRAILING_BRACKETS = /(?:\s*[([][^()[\]]*[)\]])+\s*$/

export function cleanArtistName(eventName: string): string {
  let name = eventName.trim()

  for (const marker of CUT_MARKERS) {
    const match = marker.exec(name)
    if (match && match.index > 0) name = name.slice(0, match.index)
  }

  name = name.replace(TRAILING_BRACKETS, '').trim()

  // If cleaning ate everything (e.g. the whole name was in brackets), the
  // original is a better guess than an empty lookup.
  return name || eventName.trim()
}
