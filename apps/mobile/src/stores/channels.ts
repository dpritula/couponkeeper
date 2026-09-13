import { defineStore } from 'pinia'
import { createChannel, deleteChannel, listChannels, type NewChannelInput } from '@/db/queries/channels'
import type { ChannelRow } from '@/db/schema'
import { useCouponsStore } from './coupons'

/**
 * Single source of the channel list, mirroring `useCouponsStore`'s role for
 * coupons — backs the coupon list's filter chips, the coupon form's channel
 * picker, and the channel management popup, so all three stay in sync
 * through ordinary Vue reactivity.
 */
export const useChannelsStore = defineStore('channels', {
  state: () => ({
    items: [] as ChannelRow[],
    loading: false
  }),
  actions: {
    async load() {
      this.loading = true
      try {
        this.items = await listChannels()
      } finally {
        this.loading = false
      }
    },
    async create(input: NewChannelInput) {
      await createChannel(input)
      await this.load()
    },
    /**
     * Also refreshes the coupon list: deleting a channel un-links it from
     * every coupon that had it, so the coupon list (and any coupon shown in
     * a still-open popup) needs to reflect that immediately, not just this
     * store's own `items`.
     */
    async remove(key: string) {
      await deleteChannel(key)
      await this.load()
      await useCouponsStore().load()
    }
  }
})
