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
