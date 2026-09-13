import { defineStore } from 'pinia'
import {
  createCoupon,
  deleteCoupon,
  listCoupons,
  type CouponSortField,
  type CouponWithChannels,
  type NewCouponInput,
  type SortDirection
} from '@/db/queries/coupons'
import type { CouponRow } from '@/db/schema'
import type { PromoCode } from '@/data/promoCode'
import { useSettingsStore } from '@/stores/settings'

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
    /** A channel `key`, or 'all' for no channel restriction. */
    channelFilter: 'all' as 'all' | string,
    statusFilter: [] as CouponRow['status'][],
    discountTypeFilter: [] as CouponRow['discountType'][],
    loading: false
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
            channelKey: this.channelFilter === 'all' ? undefined : this.channelFilter,
            status: this.statusFilter,
            discountType: this.discountTypeFilter
          }
        })
        this.items = rows.map(toViewModel)
      } finally {
        this.loading = false
      }
    },
    async setChannelFilter(filter: 'all' | string) {
      this.channelFilter = filter
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
    },
    async remove(code: string) {
      await deleteCoupon(code)
      this.items = this.items.filter((item) => item.code !== code)
    }
  }
})
