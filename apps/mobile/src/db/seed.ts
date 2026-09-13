import { eq } from 'drizzle-orm'
import { mockPromoCodes } from '../data/promoCode'
import { db } from './client'
import { channels, coupons, couponChannels, type NewChannelRow } from './schema'

/**
 * Channel metadata isn't in promoCode.ts (there `channel` is just a key on
 * each mock code) — name/color come from en.ts and variables.css so the
 * seeded rows match what the UI already renders.
 */
const seedChannels: NewChannelRow[] = [
  { key: 'site', name: 'Own site', color: '#4c7a5d', sortOrder: 0 },
  { key: 'etsy', name: 'Etsy', color: '#b8562f', sortOrder: 1 },
  { key: 'instagram', name: 'Instagram', color: '#8a6dab', sortOrder: 2 }
]

/** Seeds channels + coupons (+ the join rows linking them) from the mock data, unless coupons already exist. */
export async function seedDatabase(): Promise<void> {
  const existing = await db.select({ id: coupons.id }).from(coupons).limit(1)
  if (existing.length > 0) return

  for (const channel of seedChannels) {
    await db.insert(channels).values(channel)
  }
  const insertedChannels = await db.select().from(channels)
  const channelIdByKey = new Map(insertedChannels.map((channel) => [channel.key, channel.id]))

  for (const mock of mockPromoCodes) {
    await db.insert(coupons).values({
      code: mock.code,
      discountType: mock.discountType,
      value: mock.value,
      startDate: mock.startDate,
      endDate: mock.endDate,
      usageLimit: mock.usageLimit,
      usageCount: mock.usageCount,
      note: mock.note,
      daysLeft: mock.daysLeft,
      status: mock.status
    })

    const [inserted] = await db.select().from(coupons).where(eq(coupons.code, mock.code))
    const channelId = mock.channel ? channelIdByKey.get(mock.channel.key) : undefined
    if (inserted && channelId) {
      await db.insert(couponChannels).values({ couponId: inserted.id, channelId })
    }
  }
}
