import { daysUntilEnd } from '@/db/status'
import type { CouponSortField, SortDirection } from '@/db/queries/coupons'
import type { ChannelRow, CouponRow } from '@/db/schema'
import type { PromoCode } from '@/data/promoCode'

export interface VisibleMonth {
  year: number
  /** 1-12 */
  month: number
}

export interface CalendarDayCell {
  /** ISO "YYYY-MM-DD", in local calendar terms (not UTC). */
  date: string
  day: number
  /** True for a leading/trailing day borrowed from an adjacent month to fill out the grid. */
  dim: boolean
}

const DAYS_PER_WEEK = 7

function toIsoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/** Monday=0 .. Sunday=6, for the given 1-based month/day. */
function weekdayMondayFirst(year: number, month: number, day: number): number {
  const jsWeekday = new Date(year, month - 1, day).getDay() // Sunday=0 .. Saturday=6
  return (jsWeekday + 6) % 7
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function addMonthsRaw(year: number, month: number, delta: number): VisibleMonth {
  const zeroBased = month - 1 + delta
  const newYear = year + Math.floor(zeroBased / 12)
  const newMonth = ((zeroBased % 12) + 12) % 12
  return { year: newYear, month: newMonth + 1 }
}

/** `visibleMonth` shifted by `delta` months, correctly rolling over year boundaries in either direction. */
export function addMonths(visibleMonth: VisibleMonth, delta: number): VisibleMonth {
  return addMonthsRaw(visibleMonth.year, visibleMonth.month, delta)
}

/** The `{ year, month }` an ISO "YYYY-MM-DD" date falls in. */
export function visibleMonthFromIsoDate(date: string): VisibleMonth {
  const [year, month] = date.split('-').map(Number)
  return { year, month }
}

/** Today's date, in local calendar terms, as "YYYY-MM-DD". */
export function todayIsoDate(): string {
  const now = new Date()
  return toIsoDate(now.getFullYear(), now.getMonth() + 1, now.getDate())
}

/**
 * A real, computed month grid: Monday-first weeks, with dimmed leading/trailing
 * days borrowed from the adjacent months so every row has 7 cells. Handles
 * variable month lengths (28-31 days) and leap-year Februaries via `daysInMonth`.
 */
export function getMonthGrid({ year, month }: VisibleMonth): CalendarDayCell[] {
  const cells: CalendarDayCell[] = []

  const firstWeekday = weekdayMondayFirst(year, month, 1)
  const currentMonthDays = daysInMonth(year, month)
  const { year: prevYear, month: prevMonth } = addMonthsRaw(year, month, -1)
  const prevMonthDays = daysInMonth(prevYear, prevMonth)

  for (let i = firstWeekday - 1; i >= 0; i--) {
    const day = prevMonthDays - i
    cells.push({ date: toIsoDate(prevYear, prevMonth, day), day, dim: true })
  }

  for (let day = 1; day <= currentMonthDays; day++) {
    cells.push({ date: toIsoDate(year, month, day), day, dim: false })
  }

  const remainder = cells.length % DAYS_PER_WEEK
  if (remainder > 0) {
    const { year: nextYear, month: nextMonth } = addMonthsRaw(year, month, 1)
    const trailing = DAYS_PER_WEEK - remainder
    for (let day = 1; day <= trailing; day++) {
      cells.push({ date: toIsoDate(nextYear, nextMonth, day), day, dim: true })
    }
  }

  return cells
}

function activeChannelKeysOn(date: string, coupons: PromoCode[]): Set<string> {
  const keys = new Set<string>()
  for (const coupon of coupons) {
    if (!coupon.channel) continue
    if (coupon.startDate <= date && date <= coupon.endDate) keys.add(coupon.channel.key)
  }
  return keys
}

/**
 * Per day (keyed by its ISO date), an ordered array of "slots" to render as
 * indicator lines — one slot per distinct channel that is currently enabled
 * by `enabledChannelKeys` and has at least one active coupon on *any* day
 * within that day's calendar week (row), ordered the same way `channels` is
 * ordered (its callers already pass it sorted by `sortOrder`, matching the
 * filter/management order elsewhere in the app). A slot holds that channel's
 * color on a day it has an active coupon, or `null` on a day within the same
 * week it doesn't — so a channel's line stays at the same stacking position
 * across its whole week, instead of the remaining lines shifting up to fill
 * the gap the moment that channel's coupon ends partway through the week.
 * `days` is grouped into consecutive chunks of 7 (as `getMonthGrid`
 * produces) to determine each week's channel set independently. A channel
 * absent from `enabledChannelKeys` is excluded from that computation
 * entirely (not merely blanked), so enabled channels' lines shift up to fill
 * the position it would otherwise have reserved. A day with no active
 * coupon on it, or whose only active coupons belong to disabled channels,
 * has no entry in the returned map. A coupon contributes only its own
 * resolved `channel` (a coupon with no channel — its only channel was
 * deleted — contributes nothing).
 */
export function getDayChannelLines(
  days: CalendarDayCell[],
  coupons: PromoCode[],
  channels: ChannelRow[],
  enabledChannelKeys: Set<string>
): Map<string, (string | null)[]> {
  const result = new Map<string, (string | null)[]>()

  for (let weekStart = 0; weekStart < days.length; weekStart += DAYS_PER_WEEK) {
    const week = days.slice(weekStart, weekStart + DAYS_PER_WEEK)

    const weekActiveKeys = new Set<string>()
    for (const day of week) {
      for (const key of activeChannelKeysOn(day.date, coupons)) weekActiveKeys.add(key)
    }
    const weekChannelOrder = channels.filter((channel) => weekActiveKeys.has(channel.key) && enabledChannelKeys.has(channel.key))
    if (weekChannelOrder.length === 0) continue

    for (const day of week) {
      const dayActiveKeys = activeChannelKeysOn(day.date, coupons)
      if (dayActiveKeys.size === 0) continue

      const slots = weekChannelOrder.map((channel) => (dayActiveKeys.has(channel.key) ? channel.color : null))
      result.set(day.date, slots)
    }
  }

  return result
}

/**
 * Coupons whose `[startDate, endDate]` range includes `selectedDate`, ordered
 * by days-left descending (matching the Codes list's "Days Left ↓" sort) —
 * further-from-expiring coupons first, already-expired ones last.
 */
export function getCouponsForDate(coupons: PromoCode[], selectedDate: string): PromoCode[] {
  return coupons
    .filter((coupon) => coupon.startDate <= selectedDate && selectedDate <= coupon.endDate)
    .sort((a, b) => daysUntilEnd(b.endDate) - daysUntilEnd(a.endDate))
}

export interface DayListFilters {
  /** The set of currently channel-visibility-filter-enabled channel `key`s (see calendar-view's "Channel visibility filter" requirement). A coupon with no channel is never excluded by this filter, regardless of this set's contents. */
  channelFilter: Set<string>
  statusFilter: CouponRow['status'][]
  discountTypeFilter: CouponRow['discountType'][]
}

/**
 * Narrows a coupon list by the same channel/status/discount-type combination
 * rule `coupon-list-filtering` specifies for the Codes list (AND across the
 * three filter types, OR within each multi-select one) — reused here for
 * Calendar's own day-list toolbar (design.md Decision 7), with the channel
 * dimension driven by the multi-select channel visibility filter instead of
 * the Codes list's single-select one (see calendar-channel-line-filter's
 * design.md Decision 4).
 */
export function filterDayListCoupons(coupons: PromoCode[], filters: DayListFilters): PromoCode[] {
  return coupons.filter((coupon) => {
    if (coupon.channel !== undefined && !filters.channelFilter.has(coupon.channel.key)) return false
    if (filters.statusFilter.length && !filters.statusFilter.includes(coupon.status)) return false
    if (filters.discountTypeFilter.length && !filters.discountTypeFilter.includes(coupon.discountType)) return false
    return true
  })
}

/**
 * Sorts a coupon list by `sortBy`/`sortDir`, mirroring `queries/coupons.ts`'s
 * `sortRowsInMemory` comparators over the `PromoCode` view-model shape
 * instead of `CouponWithChannels` rows (design.md Decision 7's "why not
 * share the comparator" note — the two operate on different row shapes).
 */
export function sortDayListCoupons(coupons: PromoCode[], sortBy: CouponSortField, sortDir: SortDirection): PromoCode[] {
  const sign = sortDir === 'desc' ? -1 : 1
  const sorted = [...coupons]

  switch (sortBy) {
    case 'daysLeft':
      return sorted.sort((a, b) => sign * (daysUntilEnd(a.endDate) - daysUntilEnd(b.endDate)))
    case 'expiringSoon':
      // Non-expired coupons always precede expired ones, regardless of direction —
      // only the ordering within each of those two groups flips.
      return sorted.sort((a, b) => {
        const aExpired = a.status === 'expired'
        const bExpired = b.status === 'expired'
        if (aExpired !== bExpired) return aExpired ? 1 : -1
        return sign * a.endDate.localeCompare(b.endDate)
      })
    case 'startDate':
      return sorted.sort((a, b) => sign * a.startDate.localeCompare(b.startDate))
    case 'endDate':
      return sorted.sort((a, b) => sign * a.endDate.localeCompare(b.endDate))
    case 'alphabetical':
    case 'code':
      return sorted.sort((a, b) => sign * a.code.localeCompare(b.code))
    case 'usageCount':
      return sorted.sort((a, b) => sign * (a.usageCount - b.usageCount))
    default:
      return sorted
  }
}
