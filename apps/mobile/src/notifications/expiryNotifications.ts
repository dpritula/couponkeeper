import { LocalNotifications } from '@capacitor/local-notifications'
import { listCoupons, type CouponWithChannels } from '@/db/queries/coupons'
import { daysUntilEnd } from '@/db/status'
import { useSettingsStore } from '@/stores/settings'
import { dateKey, getFutureSchedule, getTodayState, saveFutureSchedule, saveTodayState, type FutureSchedule } from './todayState'
import i18n from '@/i18n'

/**
 * Reserved local-notification ID ranges:
 * - `19001`..`19020`: one slot per future day-offset `1`..`20` (the "warn
 *   about coupon expiry" setting's own max — see design.md's "bounded,
 *   deterministic ID pool" decision). Always safe to cancel-and-rebuild
 *   since nothing has fired for a day that hasn't arrived.
 * - `19000` (`PENDING_ID`): today's single still-unfired "scheduled for
 *   later today" slot — freely cancel/reschedule-able up until it fires,
 *   since nothing has been delivered under it yet.
 * - `19100`..`19199` (`DELIVERED_BATCH_BASE`, cycling): each catch-up-window
 *   delivery gets its own fresh id from this range, never reused within the
 *   same day, so Android's `ONLY_ALERT_ONCE` semantics can't silently
 *   suppress the alert for a second same-day delivery covering different
 *   coupons (see design.md's per-coupon-not-per-day note).
 */
const PENDING_ID = 19000
const MAX_OFFSET = 20
const DELIVERED_BATCH_BASE = 19100
const DELIVERED_BATCH_RANGE = 100
const CATCH_UP_WINDOW_END_HOUR = 20

/** A coupon paired with how many days it will have left as of the specific offset day it's bucketed under (see `bucketByOffset`). */
interface BucketEntry {
  coupon: CouponWithChannels
  daysRemaining: number
}

let inFlight: Promise<void> | null = null
let rerunQueued = false

/**
 * Recalculates and reschedules every expiry-warning notification from
 * current coupon/settings data. Coalesced, not just single-flighted: if a
 * new trigger arrives while a pass is already running, it doesn't just wait
 * for that (possibly stale, already-in-progress) pass to finish — it queues
 * one more pass to run immediately after, so the caller's own fresh data
 * (e.g. a coupon it just created) is guaranteed to be picked up by *some*
 * pass rather than silently missed because the in-flight one had already
 * read `listCoupons()` before that coupon existed. Mirrors db/client.ts's
 * `getConnection` singleton pattern, extended with a trailing-edge rerun.
 */
export function recalculateExpiryNotifications(): Promise<void> {
  if (inFlight) {
    rerunQueued = true
    return inFlight
  }
  inFlight = runUntilSettled().finally(() => {
    inFlight = null
  })
  return inFlight
}

async function runUntilSettled(): Promise<void> {
  do {
    rerunQueued = false
    await doRecalculate()
  } while (rerunQueued)
}

async function doRecalculate(): Promise<void> {
  const futureIds = futureOffsets().map((offset) => PENDING_ID + offset)

  /**
   * A real, confirmed bug: a future-offset alarm (`19001`-`19020`) fires on
   * its own schedule whether or not the app ever runs again before its
   * target date arrives — that's the whole point of pre-scheduling them
   * (see design.md's reboot-resilience note). If the app isn't opened at
   * all between the day a coupon enters the "tomorrow" bucket and the day
   * that alarm actually fires, `todayState` never learns a delivery
   * happened, because it's only ever mutated from `handleToday`'s own
   * scheduling calls below — never from a future-offset alarm maturing on
   * its own. The first recalculation to run afterwards (typically
   * triggered by tapping that very notification) would then see an empty
   * `deliveredCodes`/`pendingCodes` for today, treat the coupon as
   * brand-new, and immediately fire an identical duplicate a couple of
   * seconds later via the catch-up path — exactly what a maker reported.
   *
   * Fixed by checking, before the unconditional cancel below removes it,
   * whether the specific id that used to target *today* (as of the last
   * recalculation, read from `getFutureSchedule()`) is still pending. Not
   * pending means it already fired, so its codes are handed to
   * `handleToday` as already-covered rather than newly-qualifying.
   * Deliberately id-specific, not just "is `now` past noon": the OS's
   * inexact alarms (`isExactNotification: false`) can be delayed well past
   * their nominal time, so a coupon whose alarm genuinely hasn't fired yet
   * must still go through the normal catch-up path, not be silently
   * swallowed by this check. This can still misfire once, rarely: an OS
   * reboot clears pending alarms without firing them, which would also
   * make the id "not pending" here despite nothing having been delivered
   * — but that's already an accepted, documented gap (see design.md's
   * Risks — "a small UX gap, not a correctness bug"), and confirmed daily
   * duplicates are worse than that rare miss.
   */
  const previousFutureSchedule = getFutureSchedule()
  const todayFutureEntry = previousFutureSchedule[dateKey()]
  let firedWithoutRecalc: string[] = []
  if (todayFutureEntry) {
    const { notifications: pending } = await LocalNotifications.getPending()
    const stillPending = pending.some((notification) => notification.id === todayFutureEntry.id)
    if (!stillPending) firedWithoutRecalc = todayFutureEntry.codes
  }

  await LocalNotifications.cancel({ notifications: futureIds.map((id) => ({ id })) })

  const granted = await ensurePermission()
  if (!granted) return

  const warnDaysBefore = useSettingsStore().warnDaysBefore
  const rows = await listCoupons()
  const buckets = bucketByOffset(rows, warnDaysBefore)

  const nextFutureSchedule: FutureSchedule = {}
  for (const offset of futureOffsets()) {
    if (offset > warnDaysBefore) break
    const bucket = buckets.get(offset)
    if (!bucket?.length) continue
    const id = PENDING_ID + offset
    nextFutureSchedule[dateKey(dateAtNoon(offset))] = { id, codes: bucket.map((entry) => entry.coupon.code) }
    await LocalNotifications.schedule({ notifications: [buildNotification(id, bucket, dateAtNoon(offset))] })
  }
  saveFutureSchedule(nextFutureSchedule)

  await handleToday(buckets.get(0) ?? [], firedWithoutRecalc)
}

function futureOffsets(): number[] {
  return Array.from({ length: MAX_OFFSET }, (_, index) => index + 1)
}

async function ensurePermission(): Promise<boolean> {
  const status = await LocalNotifications.checkPermissions()
  if (status.display === 'granted') return true
  if (status.display === 'prompt' || status.display === 'prompt-with-rationale') {
    const requested = await LocalNotifications.requestPermissions()
    return requested.display === 'granted'
  }
  return false
}

/**
 * Buckets each qualifying coupon under *every* day-offset it's due to appear
 * in, not just the one matching its current days-remaining. A coupon whose
 * days-remaining today is `k` (already `<= warnDaysBefore`) belongs in
 * *every* offset from `0` (today) through `k` (its end date), since per the
 * spec a coupon qualifies "as of that day" for as long as its remaining days
 * on that day are within the threshold — which, counting forward from
 * today, is true for offsets `0..k` (remaining days on offset day `o` is
 * `k - o`, reaching `0` exactly on offset `k`).
 *
 * This was a real bug found via a maker report: the original version put a
 * coupon in only `buckets.get(k)`, which (since `k` is exactly "days until
 * end date") always schedules for the coupon's end date itself, labelled
 * with whatever `k` was at scheduling time — so a coupon with 2 days left
 * never showed up in *today's* notification at all (today's bucket only
 * ever held coupons whose end date was literally today), and the one
 * notification it did get, when it fired 2 days later, would have wrongly
 * said "2 days" instead of "expires today".
 */
function bucketByOffset(rows: CouponWithChannels[], warnDaysBefore: number): Map<number, BucketEntry[]> {
  const buckets = new Map<number, BucketEntry[]>()
  for (const row of rows) {
    if (row.status !== 'active' && row.status !== 'soon') continue
    const daysLeftToday = daysUntilEnd(row.endDate)
    if (daysLeftToday < 0 || daysLeftToday > warnDaysBefore) continue
    for (let offset = 0; offset <= daysLeftToday; offset++) {
      const bucket = buckets.get(offset) ?? []
      bucket.push({ coupon: row, daysRemaining: daysLeftToday - offset })
      buckets.set(offset, bucket)
    }
  }
  return buckets
}

function dateAtNoon(offsetDays: number, now: Date = new Date()): Date {
  const at = new Date(now)
  at.setDate(at.getDate() + offsetDays)
  at.setHours(12, 0, 0, 0)
  return at
}

/**
 * Offset `0` (today), reworked after a real maker report: locking the
 * *whole day* after the first delivery (the original design) meant every
 * coupon created or edited afterward — even a brand-new one that had never
 * been notified about — was silently swallowed, which directly contradicts
 * "every created/edited coupon recalculates." The lock now lives
 * per-coupon (`deliveredCodes`) instead: a coupon already covered by a
 * delivered notification today is never reconsidered today, but a
 * *different*, newly-qualifying coupon still gets its own notification the
 * same day.
 *
 * `pendingCodes`/`pendingAt` track a single still-unfired "scheduled for
 * noon" slot that later-arriving qualifying coupons can freely merge into
 * (and that a coupon edited back out of the window is dropped from) right
 * up until it actually fires — at which point (detected by wall-clock time
 * having passed, since there's no reliable delivery callback — see
 * design.md) it's promoted into `deliveredCodes` and locked. Once inside
 * the catch-up window (noon–20:00), there's no "later today" to merge into,
 * so each new batch of not-yet-covered coupons is delivered immediately
 * under its own fresh id and locked right away.
 */
async function handleToday(bucket: BucketEntry[], firedWithoutRecalc: string[] = []): Promise<void> {
  const now = new Date()
  const noonToday = dateAtNoon(0, now)
  const state = getTodayState(now)

  if (state.pendingAt && now >= new Date(state.pendingAt)) {
    state.deliveredCodes.push(...state.pendingCodes)
    state.pendingCodes = []
    state.pendingAt = null
  }

  if (firedWithoutRecalc.length > 0) {
    const alreadyClaimed = new Set([...state.deliveredCodes, ...state.pendingCodes])
    for (const code of firedWithoutRecalc) {
      if (!alreadyClaimed.has(code)) state.deliveredCodes.push(code)
    }
  }

  const byCode = new Map(bucket.map((entry) => [entry.coupon.code, entry]))
  const claimed = new Set([...state.deliveredCodes, ...state.pendingCodes])

  // Self-heal: drop any still-pending coupon that no longer qualifies (edited/deleted before its noon slot fired).
  const healedPending = state.pendingCodes.filter((code) => byCode.has(code))
  const pendingChanged = healedPending.length !== state.pendingCodes.length
  state.pendingCodes = healedPending

  const newEntries = bucket.filter((entry) => !claimed.has(entry.coupon.code))

  if (newEntries.length === 0) {
    if (pendingChanged) {
      if (state.pendingCodes.length === 0) {
        await LocalNotifications.cancel({ notifications: [{ id: PENDING_ID }] })
        state.pendingAt = null
      } else if (state.pendingAt) {
        const pendingBucket = state.pendingCodes.map((code) => byCode.get(code)!).filter(Boolean)
        await LocalNotifications.schedule({
          notifications: [buildNotification(PENDING_ID, pendingBucket, new Date(state.pendingAt))]
        })
      }
    }
    saveTodayState(state)
    return
  }

  if (now < noonToday) {
    state.pendingCodes = [...state.pendingCodes, ...newEntries.map((entry) => entry.coupon.code)]
    state.pendingAt = noonToday.toISOString()
    const pendingBucket = state.pendingCodes.map((code) => byCode.get(code)!).filter(Boolean)
    await LocalNotifications.cancel({ notifications: [{ id: PENDING_ID }] })
    await LocalNotifications.schedule({ notifications: [buildNotification(PENDING_ID, pendingBucket, noonToday)] })
  } else if (now.getHours() < CATCH_UP_WINDOW_END_HOUR) {
    // A few seconds out, not literally "now" — some schedulers reject/misbehave
    // on an `at` that isn't genuinely in the future (see design.md's Risks).
    const at = new Date(now.getTime() + 2000)
    const id = DELIVERED_BATCH_BASE + (state.nextBatchId % DELIVERED_BATCH_RANGE)
    state.nextBatchId += 1
    await LocalNotifications.schedule({ notifications: [buildNotification(id, newEntries, at)] })
    state.deliveredCodes.push(...newEntries.map((entry) => entry.coupon.code))
  }
  // else: 20:00 or later — today's window has closed for these newly-qualifying coupons; leave them unclaimed.

  saveTodayState(state)
}

/**
 * `entry.daysRemaining` (not the bucket's offset) is what's shown — see
 * `bucketByOffset` for why those can differ.
 *
 * `isExactNotification: false` is deliberate, not an oversight: the plugin
 * defaults this to `true`, which is what was opening the system "Alarms &
 * reminders" settings screen every time `schedule()` ran without that
 * permission (see design.md's Risks — a real, confirmed-on-device
 * interruption). This app never needed to-the-minute delivery ("a
 * convenient time once a day" was always the ask), so there's no reason to
 * request exact-alarm access at all — setting this per-notification skips
 * the permission check and the settings prompt entirely, scheduling a plain
 * inexact alarm every time, on every Android version.
 */
function buildNotification(id: number, bucket: BucketEntry[], at: Date) {
  const { t } = i18n.global
  const codes = bucket.map(({ coupon }) => coupon.code)

  if (bucket.length === 1) {
    const [{ coupon, daysRemaining }] = bucket
    const channel = coupon.channels[0]?.name ?? t('codes.noChannel')
    const body =
      daysRemaining === 0
        ? t('notifications.singleBodyToday', { code: coupon.code, channel })
        : t('notifications.singleBody', { code: coupon.code, channel, days: daysRemaining })
    return {
      id,
      title: t('notifications.singleTitle'),
      body,
      schedule: { at },
      extra: { codes },
      isExactNotification: false,
      smallIcon: 'ic_stat_coupon'
    }
  }

  const lines = bucket.map(({ coupon, daysRemaining }) => {
    const channel = coupon.channels[0]?.name ?? t('codes.noChannel')
    return daysRemaining === 0
      ? t('notifications.multiLineToday', { code: coupon.code, channel })
      : t('notifications.multiLine', { code: coupon.code, channel, days: daysRemaining })
  })
  return {
    id,
    title: t('notifications.multiTitle', { count: bucket.length }),
    body: lines.join('\n'),
    schedule: { at },
    extra: { codes },
    isExactNotification: false,
    smallIcon: 'ic_stat_coupon'
  }
}
