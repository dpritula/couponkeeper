## Why

Calendar's month grid always draws every channel's indicator lines and its static legend always lists every channel, regardless of the day-list's own channel filter below — a maker with several channels can't currently narrow the grid itself down to just the channel(s) they care about, and the read-only legend takes up space without letting them act on it.

## What Changes

- **BREAKING**: Replace Calendar's static, read-only channel legend (dot + name, below the grid) with an interactive, multi-select channel filter in that same position — a maker can toggle any combination of channels on/off (plus an "All" convenience control), rather than only viewing a fixed list.
- The month grid's per-day channel indicator lines now respect this filter: a day only shows a line for a channel currently enabled by the filter. Toggling the filter re-renders the grid's lines immediately, with no other action required.
- The channel filter chips are removed from the "Active on {date}" toolbar below the day list (where they previously offered single-channel-or-All selection, mirroring the Codes list) — that toolbar keeps its status filter, discount-type filter, and sort control unchanged.
- The relocated, multi-select channel filter continues to drive the selected-day coupon list exactly as the old single-select one did: the list below shows only coupons on a channel the filter currently has enabled, combined with the existing status/discount-type filters and sort the same way as before.
- Calendar's day-list channel filter state changes shape from a single `string` (a channel key, or `'all'`) to a set of explicitly *selected* channel keys, empty by default — the same "empty selection means no restriction" convention the status and discount-type filters on this same toolbar already use. "All" is selected exactly when this set is empty; selecting any specific channel deselects "All" and shows only the selected channel(s); deselecting the last specific selection reverts to "All" (everything shown) automatically. This is local to `CalendarPage`, like the rest of its day-list filter state — it is not persisted.
- **Second round of feedback, after the above had shipped:** selecting every channel individually (one at a time) now collapses the selection back to the same state as "All" — "All" shown as active, every per-channel chip shown as inactive — rather than leaving every channel individually highlighted with "All" unhighlighted, even though both states show the same lines/coupons. This applies identically wherever a channel filter of this shape exists.
- **BREAKING**, same round: the Codes list's own channel filter is rebuilt on this exact model instead of staying single-select — multi-select, "All" default, same collapse-to-"All" behavior as Calendar's — so the two screens' channel filters work identically, reversing this proposal's original plan to leave the Codes list's channel filter untouched. This reaches down into the DB query layer (`listCoupons`'s channel filter goes from one key to a set of keys), unlike Calendar's filter, which only ever operated in memory over an already-loaded coupon list.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `calendar-view`: the "Per-day channel indicator lines" requirement now depends on the channel filter's enabled set; the "Channel legend reflects real channels" requirement is replaced by a new interactive-filter requirement in the same position; the "Selected-day list filter and sort" requirement is split so the channel filter (now multi-select, relocated below the grid) affects both the grid's lines and the day list, while status filter, discount-type filter, and sort remain in the toolbar below the day-list heading, affecting only the day list. Its "Channel visibility filter" requirement additionally now specifies the collapse-to-"All" behavior when every channel ends up individually selected.
- `coupon-list-filtering`: the Codes list's channel filter becomes multi-select (a new, standalone requirement, mirroring the existing status/discount-type filter requirements' shape), including the same "All" default and collapse-to-"All" behavior; the "Sort, status filter, discount-type filter, and channel filter combine" and "Toolbar reflects the currently active sort and filters" requirements are updated to describe a multi-select channel filter instead of a single selected-or-not one.

## Impact

- `apps/mobile/src/utils/channelSelection.ts` (new): `toggleChannelSelection(current, key, totalChannelCount)` — the shared toggle-with-collapse-to-"All" logic — and `resolveSelectedChannelKeys(selected, allKeys)`, both pure functions, used by Codes and Calendar identically.
- `apps/mobile/src/components/ChannelFilterChips.vue` (new): the "All" + per-channel toggle-chip row's markup and styling, extracted so Codes and Calendar render the literal same component instead of two copies that could drift apart, now that both need it.
- `apps/mobile/src/views/CalendarPage.vue`: channel-filter state (`dayListSelectedChannels`) is a set of selected channel keys, empty by default; renders `<ChannelFilterChips>` below the grid in place of its former inline chip markup; its toggle handler now calls the shared `toggleChannelSelection`.
- `apps/mobile/src/utils/calendar.ts`: `getDayChannelLines` takes the resolved enabled-channel-keys set and excludes non-shown channels' lines (and drops them from a week's stacking order the same way an inactive channel already is); `filterDayListCoupons`'s `channelFilter` field is that same resolved set.
- `apps/mobile/src/components/CouponFilterToolbar.vue`: its channel-chip row (shown only for Codes, via `showChannelFilter`) renders `<ChannelFilterChips>` instead of the old single-select radio row; its `channelFilter` prop and channel-related emits change shape to match (a `Set<string>`, `toggle-channel`/`select-all-channels` instead of `update:channelFilter`).
- `apps/mobile/src/stores/coupons.ts`: `channelFilter` changes from `'all' | string` to `Set<string>`; `setChannelFilter` now takes the already-resolved next set rather than a single value.
- `apps/mobile/src/db/queries/coupons.ts`: `CouponListFilter.channelKey?: string` becomes `channelKeys?: string[]`, and the channel-matching join's `WHERE` clause becomes an `inArray` instead of `eq`.
- `apps/mobile/src/views/CodesPage.vue`: computes the toggle-then-set-filter call itself (using `channelsStore.items.length` and the shared util), since `stores/coupons.ts` can't import `stores/channels.ts` without creating a circular module dependency (`channels.ts` already imports `coupons.ts`).
- No schema or migration changes — only the query filter's shape changes, not any stored data.
