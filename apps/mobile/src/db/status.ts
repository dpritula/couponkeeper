export type CouponStatus = 'active' | 'soon' | 'expired'

const SOON_THRESHOLD_DAYS = 7

/**
 * Derives status (and days-left, when 'soon') from `endDate` alone — a
 * coupon has no "not started yet" state in this domain, only active/soon/
 * expired. Once there's real storage, CLAUDE.md calls for deriving this
 * instead of trusting whatever status a row happens to have stored.
 */
export function deriveCouponStatus(endDate: string, now: Date = new Date()): { status: CouponStatus; daysLeft?: number } {
  const daysLeft = daysUntilEnd(endDate, now)
  if (daysLeft < 0) return { status: 'expired' }
  return daysLeft <= SOON_THRESHOLD_DAYS ? { status: 'soon', daysLeft } : { status: 'active' }
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
