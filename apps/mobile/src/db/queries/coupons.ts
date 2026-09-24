import { and, asc, desc, eq, inArray, like, type SQL } from 'drizzle-orm'
import { db } from '../client'
import { channels, couponChannels, coupons, type ChannelRow, type CouponRow } from '../schema'
import { daysUntilEnd, deriveCouponStatus } from '../status'
import { getChannelByKey } from './channels'
import { useSettingsStore } from '@/stores/settings'

/**
 * `expiringSoon` and `daysLeft` aren't backed by a sortable SQL column (see
 * `sortRowsInMemory` below) — every other field maps directly to one.
 * `alphabetical` is the coupon-list toolbar's label for sorting by `code`.
 */
export type CouponSortField =
  | 'code'
  | 'alphabetical'
  | 'startDate'
  | 'endDate'
  | 'usageCount'
  | 'status'
  | 'createdAt'
  | 'expiringSoon'
  | 'daysLeft'
export type SortDirection = 'asc' | 'desc'

const couponSqlSortColumn = {
  code: coupons.code,
  alphabetical: coupons.code,
  startDate: coupons.startDate,
  endDate: coupons.endDate,
  usageCount: coupons.usageCount,
  status: coupons.status,
  createdAt: coupons.createdAt
} as const

type SqlCouponSortField = keyof typeof couponSqlSortColumn

function isSqlSortField(sortBy: CouponSortField): sortBy is SqlCouponSortField {
  return sortBy in couponSqlSortColumn
}

export interface CouponListFilter {
  /** A coupon matches if its status is any of these; omit/empty means no restriction. */
  status?: CouponRow['status'][]
  /** A coupon matches if its discount type is any of these; omit/empty means no restriction. */
  discountType?: CouponRow['discountType'][]
  /** A coupon matches if it has a channel whose `key` is any of these (e.g. 'etsy'), not the DB id; omit/empty means no restriction. */
  channelKeys?: string[]
  /** Case-insensitive substring match on the code. */
  search?: string
  /** A coupon matches if its code is any of these — used to show exactly the coupons named on a tapped notification (see notifications/). */
  codes?: string[]
}

export interface CouponListOptions {
  sortBy?: CouponSortField
  sortDir?: SortDirection
  filter?: CouponListFilter
}

export type CouponWithChannels = CouponRow & { channels: ChannelRow[] }

/** Coupons matching `filter`, sorted by `sortBy`/`sortDir`, each with its associated channels attached. */
export async function listCoupons(options: CouponListOptions = {}): Promise<CouponWithChannels[]> {
  const { sortBy = 'endDate', sortDir = 'asc', filter } = options

  const conditions: SQL[] = []
  if (filter?.status?.length) conditions.push(inArray(coupons.status, filter.status))
  if (filter?.discountType?.length) conditions.push(inArray(coupons.discountType, filter.discountType))
  if (filter?.search) conditions.push(like(coupons.code, `%${filter.search}%`))
  if (filter?.codes?.length) conditions.push(inArray(coupons.code, filter.codes))

  if (filter?.channelKeys?.length) {
    const matchingIds = await db
      .select({ id: coupons.id })
      .from(coupons)
      .innerJoin(couponChannels, eq(couponChannels.couponId, coupons.id))
      .innerJoin(channels, eq(channels.id, couponChannels.channelId))
      .where(inArray(channels.key, filter.channelKeys))

    if (matchingIds.length === 0) return []
    conditions.push(
      inArray(
        coupons.id,
        matchingIds.map((row) => row.id)
      )
    )
  }

  // `expiringSoon`/`daysLeft` are sorted in memory below (see sortRowsInMemory),
  // so their SQL-level order doesn't matter — end date is just a stable default.
  const orderColumn = isSqlSortField(sortBy) ? couponSqlSortColumn[sortBy] : coupons.endDate
  const couponRows = await db
    .select()
    .from(coupons)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(sortDir === 'desc' ? desc(orderColumn) : asc(orderColumn))

  const withChannels = await attachChannels(couponRows)
  return isSqlSortField(sortBy) ? withChannels : sortRowsInMemory(withChannels, sortBy, sortDir)
}

/**
 * Sorts by a field that isn't a plain SQL column, using the same
 * `status`/derived-date logic `attachChannels` already applied to these rows
 * (see design.md's rationale: SQLite's own `date('now')` is UTC, which could
 * disagree with the device-local "today" already used to compute the status
 * shown for these exact rows).
 */
function sortRowsInMemory(
  rows: CouponWithChannels[],
  sortBy: Exclude<CouponSortField, SqlCouponSortField>,
  sortDir: SortDirection
): CouponWithChannels[] {
  const sign = sortDir === 'desc' ? -1 : 1

  if (sortBy === 'daysLeft') {
    return [...rows].sort((a, b) => sign * (daysUntilEnd(a.endDate) - daysUntilEnd(b.endDate)))
  }

  // expiringSoon: non-expired coupons always precede expired ones, regardless
  // of direction — only the ordering *within* each of those two groups flips.
  return [...rows].sort((a, b) => {
    const aExpired = a.status === 'expired'
    const bExpired = b.status === 'expired'
    if (aExpired !== bExpired) return aExpired ? 1 : -1
    return sign * a.endDate.localeCompare(b.endDate)
  })
}

export async function getCouponByCode(code: string): Promise<CouponWithChannels | undefined> {
  const couponRows = await db.select().from(coupons).where(eq(coupons.code, code))
  const [result] = await attachChannels(couponRows)
  return result
}

/** Thrown by `createCoupon`/`updateCoupon` when another coupon already has the same code on the same channel. */
export class DuplicateCouponCodeError extends Error {
  constructor(code: string) {
    super(`A coupon with code "${code}" already exists on this channel`)
    this.name = 'DuplicateCouponCodeError'
  }
}

/**
 * Whether some *other* coupon already has `code` on the channel identified by
 * `channelKey`. `coupons` has no `channel_id` column (channel is a many-to-many
 * join, see schema.ts), so this is a join rather than a single-table lookup —
 * there is deliberately no DB-level unique index for it (see
 * openspec/changes/edit-coupon-and-validation/design.md Decision 3).
 */
async function codeExistsOnChannel(code: string, channelKey: string, excludeCouponId?: number): Promise<boolean> {
  const rows = await db
    .select({ couponId: coupons.id })
    .from(coupons)
    .innerJoin(couponChannels, eq(couponChannels.couponId, coupons.id))
    .innerJoin(channels, eq(channels.id, couponChannels.channelId))
    .where(and(eq(coupons.code, code), eq(channels.key, channelKey)))

  return rows.some((row) => row.couponId !== excludeCouponId)
}

/**
 * Attaches each coupon's channels via a plain join instead of Drizzle's
 * relational query API: that API aggregates nested relations with SQLite's
 * `json_group_array`, which the web dev fallback (sql.js, see client.ts)
 * doesn't support — the query silently never resolves. A join + in-JS
 * grouping works identically on both that fallback and native SQLite.
 */
async function attachChannels(couponRows: CouponRow[]): Promise<CouponWithChannels[]> {
  if (couponRows.length === 0) return []

  const joinRows = await db
    .select({ couponId: couponChannels.couponId, channel: channels })
    .from(couponChannels)
    .innerJoin(channels, eq(channels.id, couponChannels.channelId))
    .where(
      inArray(
        couponChannels.couponId,
        couponRows.map((coupon) => coupon.id)
      )
    )

  const channelsByCouponId = new Map<number, ChannelRow[]>()
  for (const row of joinRows) {
    const list = channelsByCouponId.get(row.couponId) ?? []
    list.push(row.channel)
    channelsByCouponId.set(row.couponId, list)
  }

  const soonThresholdDays = useSettingsStore().warnDaysBefore
  return couponRows.map((coupon) => {
    const { status, daysLeft } = deriveCouponStatus(coupon.startDate, coupon.endDate, soonThresholdDays)
    return {
      ...coupon,
      status,
      daysLeft: daysLeft ?? null,
      channels: channelsByCouponId.get(coupon.id) ?? []
    }
  })
}

export interface NewCouponInput {
  code: string
  /** Channel `key` (e.g. 'etsy'), not the DB id. */
  channelKey: string
  discountType: CouponRow['discountType']
  /** Display-ready value, exactly as entered (e.g. "-20%", "-$5"). */
  value: string
  startDate: string
  endDate: string
  usageLimit?: number
  note?: string
}

/** Inserts a coupon (+ its channel join row) from form input; status/daysLeft are derived from the dates, not taken from the caller. */
export async function createCoupon(input: NewCouponInput): Promise<CouponWithChannels> {
  if (await codeExistsOnChannel(input.code, input.channelKey)) {
    throw new DuplicateCouponCodeError(input.code)
  }

  const { status, daysLeft } = deriveCouponStatus(input.startDate, input.endDate, useSettingsStore().warnDaysBefore)

  await db.insert(coupons).values({
    code: input.code,
    discountType: input.discountType,
    value: input.value,
    startDate: input.startDate,
    endDate: input.endDate,
    usageLimit: input.usageLimit,
    usageCount: 0,
    note: input.note,
    daysLeft,
    status
  })

  const [created] = await db.select().from(coupons).where(eq(coupons.code, input.code))
  if (!created) throw new Error(`Failed to read back coupon "${input.code}" after insert`)

  const channel = await getChannelByKey(input.channelKey)
  if (!channel) throw new Error(`Unknown channel key "${input.channelKey}"`)
  await db.insert(couponChannels).values({ couponId: created.id, channelId: channel.id })

  return (await getCouponByCode(input.code))!
}

/**
 * Updates an existing coupon (looked up by its *current* code) with new form
 * input, including a possibly-changed code. `usageCount` and `id` are left
 * untouched — they aren't form fields — and status/daysLeft are re-derived
 * from the (possibly new) dates, exactly as `createCoupon` does. The coupon's
 * single channel join row is replaced rather than diffed, since the form only
 * ever picks one channel.
 */
export async function updateCoupon(currentCode: string, input: NewCouponInput): Promise<CouponWithChannels> {
  const [existing] = await db.select({ id: coupons.id }).from(coupons).where(eq(coupons.code, currentCode))
  if (!existing) throw new Error(`No coupon found with code "${currentCode}"`)

  if (await codeExistsOnChannel(input.code, input.channelKey, existing.id)) {
    throw new DuplicateCouponCodeError(input.code)
  }

  const { status, daysLeft } = deriveCouponStatus(input.startDate, input.endDate, useSettingsStore().warnDaysBefore)

  await db
    .update(coupons)
    .set({
      code: input.code,
      discountType: input.discountType,
      value: input.value,
      startDate: input.startDate,
      endDate: input.endDate,
      // `?? null` (not left `undefined`) so clearing usage limit/note while
      // editing actually clears the stored value, rather than an update
      // silently leaving a previous value in place.
      usageLimit: input.usageLimit ?? null,
      note: input.note ?? null,
      daysLeft,
      status
    })
    .where(eq(coupons.id, existing.id))

  const channel = await getChannelByKey(input.channelKey)
  if (!channel) throw new Error(`Unknown channel key "${input.channelKey}"`)
  await db.delete(couponChannels).where(eq(couponChannels.couponId, existing.id))
  await db.insert(couponChannels).values({ couponId: existing.id, channelId: channel.id })

  return (await getCouponByCode(input.code))!
}

/**
 * Deletes a coupon and its channel join rows. The join rows are deleted
 * explicitly rather than relying on the schema's `onDelete: 'cascade'` —
 * SQLite only enforces that when `PRAGMA foreign_keys = ON` is set on the
 * connection, which this app never sets.
 */
export async function deleteCoupon(code: string): Promise<void> {
  const [coupon] = await db.select({ id: coupons.id }).from(coupons).where(eq(coupons.code, code))
  if (!coupon) return

  await db.delete(couponChannels).where(eq(couponChannels.couponId, coupon.id))
  await db.delete(coupons).where(eq(coupons.id, coupon.id))
}
