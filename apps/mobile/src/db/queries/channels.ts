import { and, asc, desc, eq, like, type SQL } from 'drizzle-orm'
import { db } from '../client'
import { channels, couponChannels, type ChannelRow } from '../schema'

export type ChannelSortField = 'key' | 'name' | 'sortOrder' | 'createdAt'
export type SortDirection = 'asc' | 'desc'

const channelSortColumn = {
  key: channels.key,
  name: channels.name,
  sortOrder: channels.sortOrder,
  createdAt: channels.createdAt
} as const satisfies Record<ChannelSortField, unknown>

export interface ChannelListFilter {
  /** Case-insensitive substring match on the display name. */
  search?: string
}

export interface ChannelListOptions {
  sortBy?: ChannelSortField
  sortDir?: SortDirection
  filter?: ChannelListFilter
}

/** Channels matching `filter`, sorted by `sortBy`/`sortDir` (defaults to the curated `sortOrder`). */
export async function listChannels(options: ChannelListOptions = {}): Promise<ChannelRow[]> {
  const { sortBy = 'sortOrder', sortDir = 'asc', filter } = options

  const conditions: SQL[] = []
  if (filter?.search) conditions.push(like(channels.name, `%${filter.search}%`))

  const orderColumn = channelSortColumn[sortBy]
  return db
    .select()
    .from(channels)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(sortDir === 'desc' ? desc(orderColumn) : asc(orderColumn))
}

export async function getChannelByKey(key: string): Promise<ChannelRow | undefined> {
  const [row] = await db.select().from(channels).where(eq(channels.key, key))
  return row
}

/** Thrown by `createChannel` when a channel with the same (derived) key already exists. */
export class DuplicateChannelNameError extends Error {
  constructor(name: string) {
    super(`A channel named "${name}" already exists`)
    this.name = 'DuplicateChannelNameError'
  }
}

/** Lowercases, trims, and collapses runs of non-alphanumeric characters into a single "-". */
function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export interface NewChannelInput {
  name: string
  color: string
}

/**
 * Creates a channel, deriving its `key` from `name` via `slugify`. Checked
 * for a case-insensitive duplicate before insert rather than relying solely
 * on the `channels_key_unique` index, so the UI can show a clean validation
 * error instead of a raw constraint-violation message.
 */
export async function createChannel(input: NewChannelInput): Promise<ChannelRow> {
  const name = input.name.trim()
  const key = slugify(name)

  const existing = await getChannelByKey(key)
  if (existing) throw new DuplicateChannelNameError(name)

  const existingRows = await db.select().from(channels)
  const nextSortOrder = existingRows.reduce((max, row) => Math.max(max, row.sortOrder), -1) + 1

  await db.insert(channels).values({ key, name, color: input.color, sortOrder: nextSortOrder })

  const created = await getChannelByKey(key)
  if (!created) throw new Error(`Failed to read back channel "${key}" after insert`)
  return created
}

/**
 * Deletes a channel and its `coupon_channels` join rows (explicitly, not via
 * the schema's `onDelete: 'cascade'` — SQLite only enforces that when
 * `PRAGMA foreign_keys = ON` is set, which this app never sets). Coupons
 * that had this channel are left in place, just without that association.
 */
export async function deleteChannel(key: string): Promise<void> {
  const [channel] = await db.select({ id: channels.id }).from(channels).where(eq(channels.key, key))
  if (!channel) return

  await db.delete(couponChannels).where(eq(couponChannels.channelId, channel.id))
  await db.delete(channels).where(eq(channels.id, channel.id))
}
