/**
 * Toggles `key`'s membership in `current`, then collapses back to an empty
 * set ("All") once every known channel ends up selected — so selecting
 * every channel individually reads and behaves exactly like never having
 * selected any (see coupon-list-filtering and calendar-view's channel
 * filter requirements). Shared by the Codes list's channel filter
 * (`stores/coupons.ts`) and the Calendar screen's channel visibility filter
 * (`views/CalendarPage.vue`) so the two behave identically. `>=` (not
 * `===`) tolerates `totalChannelCount` being momentarily stale.
 */
export function toggleChannelSelection(current: Set<string>, key: string, totalChannelCount: number): Set<string> {
  const next = new Set(current)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  return next.size >= totalChannelCount ? new Set() : next
}

/** Resolves a selection (empty meaning "All") into the concrete set of channel keys currently shown. */
export function resolveSelectedChannelKeys(selected: Set<string>, allKeys: string[]): Set<string> {
  return selected.size === 0 ? new Set(allKeys) : selected
}
