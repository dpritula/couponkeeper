const STORAGE_KEY = 'couponkeeper.expiryNotificationToday'
const FUTURE_STORAGE_KEY = 'couponkeeper.expiryNotificationFutureSchedule'

/**
 * Per-coupon, not per-day: a coupon already covered by a delivered (or
 * about-to-fire) notification today is never reconsidered today, but a
 * *different*, newly-qualifying coupon (e.g. just created) still gets its
 * own notification the same day. An earlier version locked the whole day
 * after the first delivery — a real maker report showed that silently
 * swallowed every coupon created afterward, since "every created/edited
 * coupon recalculates" is only meaningful if a later recalculation can
 * still produce new output. `pendingCodes`/`pendingAt` track the single
 * still-unfired "scheduled for later today" slot (see expiryNotifications.ts's
 * `PENDING_ID`), which stays freely rescheduleable — including merging in
 * more newly-qualifying coupons, or dropping ones edited back out of the
 * window — until it actually fires; `deliveredCodes` is permanent for the
 * day once a delivery has gone out (immediate catch-up, or the pending slot's
 * time has passed).
 */
interface TodayState {
  date: string
  deliveredCodes: string[]
  pendingCodes: string[]
  /** ISO timestamp the pending slot is scheduled for, or `null` if nothing is pending. */
  pendingAt: string | null
  /** Counts up so every catch-up-window delivery gets its own fresh notification id — see design.md's alert-suppression note. */
  nextBatchId: number
}

/** Local-date key (`YYYY-MM-DD`), not UTC — matches how the rest of the app reasons about "today" (see db/status.ts). */
export function dateKey(now: Date = new Date()): string {
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const EMPTY_STATE = (key: string): TodayState => ({
  date: key,
  deliveredCodes: [],
  pendingCodes: [],
  pendingAt: null,
  nextBatchId: 0
})

/** Resets automatically once the stored date is no longer today — see design.md's "persisted 'today' state" decision. */
export function getTodayState(now: Date = new Date()): TodayState {
  const key = dateKey(now)
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return EMPTY_STATE(key)
  try {
    const parsed = JSON.parse(raw)
    if (
      parsed &&
      parsed.date === key &&
      Array.isArray(parsed.deliveredCodes) &&
      Array.isArray(parsed.pendingCodes) &&
      (typeof parsed.pendingAt === 'string' || parsed.pendingAt === null) &&
      typeof parsed.nextBatchId === 'number'
    ) {
      return parsed as TodayState
    }
  } catch {
    // fall through to a fresh state for today
  }
  return EMPTY_STATE(key)
}

export function saveTodayState(state: TodayState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

/**
 * What the *previous* recalculation scheduled under each still-future
 * offset id (`19001`-`19020`), keyed by the actual calendar date each one
 * targets rather than by its offset number — the offset a given date maps
 * to shifts by one every day, but the date itself (and the id that alarm
 * was scheduled under) doesn't change once set. Unlike `TodayState`, this
 * does *not* reset daily: it's read once at the top of a recalculation,
 * before that same call fully overwrites it with the freshly rebuilt
 * `1..20` window, so a recalculation can tell whether *today* used to be
 * one of those future offsets as of the last time the app ran — see
 * `expiryNotifications.ts`'s `doRecalculate` for why that matters (a real,
 * confirmed duplicate-notification bug).
 */
interface FutureScheduleEntry {
  id: number
  codes: string[]
}
type FutureSchedule = Record<string, FutureScheduleEntry>

export function getFutureSchedule(): FutureSchedule {
  const raw = localStorage.getItem(FUTURE_STORAGE_KEY)
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as FutureSchedule) : {}
  } catch {
    return {}
  }
}

export function saveFutureSchedule(schedule: FutureSchedule): void {
  localStorage.setItem(FUTURE_STORAGE_KEY, JSON.stringify(schedule))
}

export type { TodayState, FutureScheduleEntry, FutureSchedule }
