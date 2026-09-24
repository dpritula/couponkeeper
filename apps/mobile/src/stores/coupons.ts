import { defineStore } from 'pinia'
import {
  createCoupon,
  deleteCoupon,
  listCoupons,
  updateCoupon,
  type CouponSortField,
  type CouponWithChannels,
  type NewCouponInput,
  type SortDirection
} from '@/db/queries/coupons'
import type { CouponRow } from '@/db/schema'
import type { PromoCode } from '@/data/promoCode'
import { useSettingsStore } from '@/stores/settings'
import { recalculateExpiryNotifications } from '@/notifications/expiryNotifications'

function toggleInArray<T>(items: T[], value: T): T[] {
  return items.includes(value) ? items.filter((item) => item !== value) : [...items, value]
}

export function toViewModel(coupon: CouponWithChannels): PromoCode {
  const channel = coupon.channels[0]
  return {
    code: coupon.code,
    channel: channel ? { key: channel.key, name: channel.name, color: channel.color } : undefined,
    discountType: coupon.discountType,
    value: coupon.value,
    startDate: coupon.startDate,
    endDate: coupon.endDate,
    usageLimit: coupon.usageLimit ?? undefined,
    usageCount: coupon.usageCount,
    note: coupon.note ?? undefined,
    daysLeft: coupon.daysLeft ?? undefined,
    status: coupon.status
  }
}

/**
 * Centralizes the coupon list so creating/deleting a coupon updates every
 * view through normal Vue reactivity, instead of relying on the page that
 * changed it to also be the page the user is looking at next. Before this,
 * the create form (then a separate routed page, `CodeFormPage`) saved and
 * navigated back trusting CodesPage's own `onIonViewWillEnter` to refetch —
 * which is exactly the kind of Ionic page-lifecycle timing that was
 * unreliable on a real device (see CLAUDE.md). Writing here refreshes
 * `items` directly, so the list is already correct by the time any view
 * renders it.
 */
export const useCouponsStore = defineStore('coupons', {
  state: () => ({
    items: [] as PromoCode[],
    /** The set of explicitly selected channel keys; empty means "All" (no restriction) — see utils/channelSelection.ts. */
    channelFilter: new Set<string>() as Set<string>,
    statusFilter: [] as CouponRow['status'][],
    discountTypeFilter: [] as CouponRow['discountType'][],
    loading: false,
    /**
     * Transient — set when `items` currently shows exactly the coupons named
     * on a tapped multi-coupon expiry notification, rather than the maker's
     * own channel/status/discount-type filters. Not persisted; see
     * notifications/ and design.md's "separate, transient 'notification
     * view'" decision.
     */
    notificationCodes: null as string[] | null
  }),
  getters: {
    /**
     * Sourced from the settings store rather than owned here — this list's
     * sort is a single value shared with Calendar's day list and the
     * Settings screen (see openspec/changes/add-settings-default-sort-and-feedback-disclaimer/design.md).
     */
    sortBy: (): CouponSortField => useSettingsStore().defaultSort.sortBy,
    sortDir: (): SortDirection => useSettingsStore().defaultSort.sortDir
  },
  actions: {
    async load() {
      this.loading = true
      try {
        const rows = await listCoupons({
          sortBy: this.sortBy,
          sortDir: this.sortDir,
          filter: {
            channelKeys: this.channelFilter.size === 0 ? undefined : [...this.channelFilter],
            status: this.statusFilter,
            discountType: this.discountTypeFilter
          }
        })
        this.items = rows.map(toViewModel)
      } finally {
        this.loading = false
      }
    },
    /** Takes the already-resolved next selection (see utils/channelSelection.ts's `toggleChannelSelection`) — the store itself doesn't own the toggle-and-collapse-to-"All" rule, matching how it's shared with Calendar's own channel filter. */
    async setChannelFilter(next: Set<string>) {
      this.channelFilter = next
      await this.load()
    },
    async toggleStatusFilter(status: CouponRow['status']) {
      this.statusFilter = toggleInArray(this.statusFilter, status)
      await this.load()
    },
    async toggleDiscountTypeFilter(discountType: CouponRow['discountType']) {
      this.discountTypeFilter = toggleInArray(this.discountTypeFilter, discountType)
      await this.load()
    },
    async setSort(sortBy: CouponSortField, sortDir: SortDirection) {
      useSettingsStore().setDefaultSort(sortBy, sortDir)
      await this.load()
    },
    async create(input: NewCouponInput) {
      await createCoupon(input)
      await this.load()
      void recalculateExpiryNotifications()
    },
    async update(currentCode: string, input: NewCouponInput) {
      await updateCoupon(currentCode, input)
      await this.load()
      void recalculateExpiryNotifications()
    },
    async remove(code: string) {
      await deleteCoupon(code)
      this.items = this.items.filter((item) => item.code !== code)
      void recalculateExpiryNotifications()
    },
    /** Shows exactly `codes`, bypassing the normal channel/status/discount-type filters without changing them. */
    async showNotificationCoupons(codes: string[]) {
      this.notificationCodes = codes
      this.loading = true
      try {
        const rows = await listCoupons({ sortBy: this.sortBy, sortDir: this.sortDir, filter: { codes } })
        this.items = rows.map(toViewModel)
      } finally {
        this.loading = false
      }
    },
    /** Returns to the maker's own filters, exactly as before the notification tap. */
    async clearNotificationCoupons() {
      this.notificationCodes = null
      await this.load()
    }
  }
})
