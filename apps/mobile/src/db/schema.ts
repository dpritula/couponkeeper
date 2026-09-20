import { relations, sql } from 'drizzle-orm'
import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

/**
 * Channel a coupon can be associated with (own site / Etsy / Instagram / …).
 * `key` is the stable identifier used by i18n (`channels.<key>`) and the UI
 * (channel dot color); `id` is only the DB-internal join key.
 */
export const channels = sqliteTable(
  'channels',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    key: text('key').notNull(),
    name: text('name').notNull(),
    color: text('color').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(current_timestamp)`)
  },
  (table) => [
    uniqueIndex('channels_key_unique').on(table.key),
    index('channels_sort_order_idx').on(table.sortOrder)
  ]
)

export const coupons = sqliteTable(
  'coupons',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    code: text('code').notNull(),
    discountType: text('discount_type', { enum: ['percent', 'amount', 'shipping'] }).notNull(),
    value: text('value').notNull(),
    startDate: text('start_date').notNull(),
    endDate: text('end_date').notNull(),
    usageLimit: integer('usage_limit'),
    usageCount: integer('usage_count').notNull().default(0),
    /** Audience note (e.g. "@maker"), shown instead of a usage count when set. */
    note: text('note'),
    /**
     * Days left, only meaningful while status is 'soon'. Ported as-is from the
     * mock data; a real implementation should derive both this and `status`
     * from the dates instead of trusting stored values (see CLAUDE.md).
     */
    daysLeft: integer('days_left'),
    status: text('status', { enum: ['notStarted', 'active', 'soon', 'expired'] }).notNull(),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(current_timestamp)`),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`(current_timestamp)`)
  },
  (table) => [
    /**
     * No unique index on `code` alone: uniqueness is scoped to code+channel
     * (a code may repeat across different channels), which isn't expressible
     * as a single-table index since channel lives in the `coupon_channels`
     * join table — enforced instead by `codeExistsOnChannel` in
     * `queries/coupons.ts` (see openspec/changes/edit-coupon-and-validation/design.md).
     */
    index('coupons_code_idx').on(table.code),
    index('coupons_status_idx').on(table.status),
    index('coupons_end_date_idx').on(table.endDate),
    index('coupons_discount_type_idx').on(table.discountType)
  ]
)

/** Many-to-many join between coupons and channels. */
export const couponChannels = sqliteTable(
  'coupon_channels',
  {
    couponId: integer('coupon_id')
      .notNull()
      .references(() => coupons.id, { onDelete: 'cascade' }),
    channelId: integer('channel_id')
      .notNull()
      .references(() => channels.id, { onDelete: 'cascade' })
  },
  (table) => [
    primaryKey({ columns: [table.couponId, table.channelId] }),
    index('coupon_channels_channel_idx').on(table.channelId)
  ]
)

export const couponsRelations = relations(coupons, ({ many }) => ({
  couponChannels: many(couponChannels)
}))

export const channelsRelations = relations(channels, ({ many }) => ({
  couponChannels: many(couponChannels)
}))

export const couponChannelsRelations = relations(couponChannels, ({ one }) => ({
  coupon: one(coupons, { fields: [couponChannels.couponId], references: [coupons.id] }),
  channel: one(channels, { fields: [couponChannels.channelId], references: [channels.id] })
}))

export type ChannelRow = typeof channels.$inferSelect
export type NewChannelRow = typeof channels.$inferInsert
export type CouponRow = typeof coupons.$inferSelect
export type NewCouponRow = typeof coupons.$inferInsert
export type CouponChannelRow = typeof couponChannels.$inferSelect
export type NewCouponChannelRow = typeof couponChannels.$inferInsert
