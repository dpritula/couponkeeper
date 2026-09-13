export type DiscountType = 'percent' | 'amount' | 'shipping'
export type CodeStatus = 'active' | 'soon' | 'expired'

/** A channel as resolved for display — `undefined` if the coupon's only channel was since deleted. */
export interface PromoCodeChannel {
  key: string
  name: string
  color: string
}

export interface PromoCode {
  code: string
  channel: PromoCodeChannel | undefined
  discountType: DiscountType
  value: string
  startDate: string
  endDate: string
  usageLimit?: number
  usageCount: number
  /** Audience note (e.g. "@maker") shown instead of a usage count when set. */
  note?: string
  /** Days left, only meaningful for status 'soon'. */
  daysLeft?: number
  status: CodeStatus
}

// Matches the colors seeded into the `channels` table (see db/seed.ts) so
// CalendarPage (still on this mock array) renders identically to the real data.
const siteChannel: PromoCodeChannel = { key: 'site', name: 'Own site', color: '#4c7a5d' }
const etsyChannel: PromoCodeChannel = { key: 'etsy', name: 'Etsy', color: '#b8562f' }
const instagramChannel: PromoCodeChannel = { key: 'instagram', name: 'Instagram', color: '#8a6dab' }

// Hardcoded placeholder content, ported 1:1 from the UI mockup (couponkeeper-ui-mockup.html).
export const mockPromoCodes: PromoCode[] = [
  {
    code: 'SUMMER20',
    channel: siteChannel,
    discountType: 'percent',
    value: '-20%',
    startDate: '2026-08-01',
    endDate: '2026-09-30',
    usageLimit: 50,
    usageCount: 12,
    status: 'active'
  },
  {
    code: 'ETSY-FALL9',
    channel: etsyChannel,
    discountType: 'amount',
    value: '-$5',
    startDate: '2026-09-05',
    endDate: '2026-09-15',
    usageCount: 8,
    daysLeft: 3,
    status: 'soon'
  },
  {
    code: 'IGFRIENDS',
    channel: instagramChannel,
    discountType: 'percent',
    value: '-15%',
    startDate: '2026-09-01',
    endDate: '2026-10-01',
    usageCount: 0,
    note: '@maker',
    status: 'active'
  },
  {
    code: 'SPRING24',
    channel: siteChannel,
    discountType: 'percent',
    value: '-10%',
    startDate: '2026-04-01',
    endDate: '2026-04-30',
    usageLimit: 50,
    usageCount: 34,
    status: 'expired'
  }
]
