export type CouponStatus = 'notStarted' | 'active' | 'soon' | 'expired'

/**
 * Derives status (and days-left, when 'soon') from `startDate`/`endDate` —
 * a coupon not yet started (today before `startDate`) is always
 * 'notStarted', regardless of how its end date compares to today. CLAUDE.md
 * calls for deriving this from the dates rather than trusting whatever
 * status a row happens to have stored.
 *
 * `soonThresholdDays` is the "soon" cutoff — no longer a hardcoded constant.
 * It's the same "warn about coupon expiry" value that drives notifications
 * (`useSettingsStore().warnDaysBefore`), so the "Expiring" badge shown on
 * every card/detail/calendar view and the notification threshold are always
 * one single, live source of truth rather than two independently-tuned
 * numbers that happen to start out similar. There is deliberately no default
 * here: every caller must pass the current setting explicitly, so a stale
 * hardcoded value can't silently creep back in.
 */
export function deriveCouponStatus(
  startDate: string,
  endDate: string,
  soonThresholdDays: number,
  now: Date = new Date()
): { status: CouponStatus; daysLeft?: number } {
  if (daysUntilEnd(startDate, now) > 0) return { status: 'notStarted' }

  const daysLeft = daysUntilEnd(endDate, now)
  if (daysLeft < 0) return { status: 'expired' }
  return daysLeft <= soonThresholdDays ? { status: 'soon', daysLeft } : { status: 'active' }
}

/**
 * Days between "today" (device-local midnight) and `endDate` — negative once
 * the coupon has ended. Unlike `deriveCouponStatus`'s `daysLeft`, this is
 * defined for every coupon regardless of status, for sorting by it directly.
 */
export function daysUntilEnd(endDate: string, now: Date = new Date()): number {
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const end = new Date(endDate)
  end.setHours(0, 0, 0, 0)

  return Math.round((end.getTime() - today.getTime()) / 86_400_000)
}
