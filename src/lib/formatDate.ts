const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

// 1st, 2nd, 3rd, 4th… but 11th, 12th, 13th (not 11st/12nd/13rd).
export function ordinal(day: number): string {
  const lastTwo = day % 100
  if (lastTwo >= 11 && lastTwo <= 13) return `${day}th`
  switch (day % 10) {
    case 1:
      return `${day}st`
    case 2:
      return `${day}nd`
    case 3:
      return `${day}rd`
    default:
      return `${day}th`
  }
}

/**
 * Formats Ticketmaster's bare `YYYY-MM-DD` localDate as e.g.
 * "Friday 25th September 2026". Built from the date parts directly rather
 * than `new Date(str)`, which parses date-only strings as UTC and can shift
 * the day in timezones behind UTC.
 */
export function formatEventDate(date: string | null): string {
  if (!date) return 'Date TBA'

  const [year, month, day] = date.split('-').map(Number)
  if (!year || !month || !day) return date

  const weekday = WEEKDAYS[new Date(year, month - 1, day).getDay()]
  return `${weekday} ${ordinal(day)} ${MONTHS[month - 1]} ${year}`
}
