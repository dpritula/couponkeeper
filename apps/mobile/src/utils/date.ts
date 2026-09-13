/** Formats an ISO date as a short label like "Sep 30", locale-aware via Intl. */
export function formatShortDate(iso: string, locale = 'en'): string {
  const date = new Date(iso)
  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(date)
}

/** Formats an ISO date as a full label like "Sep 30, 2026" — for detail views where the year matters. */
export function formatFullDate(iso: string, locale = 'en'): string {
  const date = new Date(iso)
  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

/** Parses the code-creation form's "DD.MM.YYYY" date field into an ISO "YYYY-MM-DD" string (passes through if already ISO). */
export function parseDisplayDate(input: string): string {
  const trimmed = input.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed

  const match = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(trimmed)
  if (!match) throw new Error(`Invalid date "${input}", expected DD.MM.YYYY`)
  const [, day, month, year] = match
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}
