## Context

See `proposal.md` - Why/What Changes for motivation and scope; see `specs/coupon-channels/spec.md` and `specs/coupon-list-filtering/spec.md` for the required behavior. This section only covers the current implementation shape that constrains the approach:

- `Channel` (`apps/mobile/src/data/promoCode.ts`) is a closed union (`'site' | 'etsy' | 'instagram'`). It's used as: the type of `PromoCode.channel`, the hardcoded chip/picker arrays in `CodesPage.vue` and `CouponFormModal.vue`, the i18n lookup key `channels.<key>` (display name), and the CSS class suffix `dot-<key>` (dot color) in `CodeCard.vue`.
- The `channels` DB table (`schema.ts`) already has everything a user-managed channel needs — `key`, `name`, `color`, `sortOrder` — it's just never read for `name`/`color` today; the UI substitutes its own hardcoded i18n string and CSS class instead. **No schema or migration changes are needed for this change.**
- `queries/coupons.ts`'s `listCoupons` takes a single-value `status`/`discountType`/`channelKey` filter and a single `sortBy`/`sortDir`, translated directly into SQL `WHERE`/`ORDER BY`. `status` and `daysLeft` are never trusted from storage — `attachChannels` always recomputes them from `endDate` via `deriveCouponStatus` (device-local "today"), after the SQL query runs.
- `useCouponsStore` holds one `activeFilter: 'all' | Channel` and always sorts by `endDate asc`.
- The three existing overlays (`ConfirmDialog`, `CouponDetailModal`, `CouponFormModal`) share one pattern: `<Teleport to="body">`, `v-if` on the root, fixed backdrop + bottom-sheet card with header/body/footer. Any new overlay must follow this, per CLAUDE.md.
- `sql.js` (the web dev fallback) can't run Drizzle's relational `with` queries (see CLAUDE.md gotchas) — all multi-row joins already go through plain `innerJoin` + in-JS grouping (`attachChannels`), and this change keeps that pattern rather than introducing new SQL aggregation.

## Goals / Non-Goals

**Goals:**
- Replace the hardcoded `Channel` union with a live read of the `channels` table everywhere a channel is displayed or picked.
- Extend the coupon list's filter/sort surface (channel + status[] + discountType[] + sortBy/sortDir) behind one reactive store, matching `coupon-list-filtering`'s combination requirement.
- Add channel create/delete behind a new Teleport-to-body overlay, matching the existing three overlays' visual/structural pattern.
- Keep "days left" / "expiring soon" ordering consistent with the status the user already sees elsewhere in the app (both derived from `deriveCouponStatus`, not a separate SQL-side notion of "today").

**Non-Goals:**
- Renaming or recoloring an existing channel (proposal explicitly scopes the popup to add + delete only).
- Redesigning the channel filter chips to show per-channel colors as their "selected" background — chips keep today's single-accent selected style; channel color continues to be used only for the `CodeCard` dot and the channel-management/picker swatches, same as today.
- Any change to `CalendarPage.vue` (still on `mockPromoCodes`, out of scope per proposal).
- A minimum-channel-count guard (a user can delete every channel down to zero; coupons left without a channel are handled per the spec's "no channel tag" scenario, not specially prevented).

## Decisions

**1. `PromoCode.channel` becomes an optional resolved object, not a union key.**
`Channel` (the union type) is removed. `PromoCode.channel` becomes `{ key: string; name: string; color: string } | undefined` (`undefined` when a coupon has lost its only channel). `toViewModel` in `stores/coupons.ts` already has the full `ChannelRow` at `coupon.channels[0]` — it now passes that through directly instead of extracting `.key` and casting to `Channel`. `CodeCard.vue` renders `code.channel?.name` directly (no `t('channels.…')` lookup) and colors its dot with an inline `style="background-color: …"` instead of a `dot-<key>` CSS class.
*Alternative considered:* keep `channel: string` (just the key) and look up name/color separately in each component. Rejected — every consumer (`CodeCard`, detail modal) needs both name and color, so resolving once in the store avoids repeating the same lookup in three places.

**2. A new `useChannelsStore` (Pinia) is the single source of the channel list**, backing the filter chips, the coupon-form picker, and the new management popup — the same role `useCouponsStore` already plays for coupons. It wraps `queries/channels.ts` with `items`, `load()`, `create(input)`, `remove(key)`; `create`/`remove` refresh `items` themselves (same pattern as `useCouponsStore.create`/`.remove`), and `useCouponsStore.remove` isn't involved — instead, deleting a channel triggers `useCouponsStore.load()` too, so the coupon list's channel data (and any coupon that just lost its channel) refreshes in the same tick, satisfying the spec's "updates in the background" scenario.
*Alternative considered:* fold channels into `useCouponsStore`. Rejected — channels and coupons are managed from different UI surfaces (the management popup doesn't touch coupons directly), and CLAUDE.md's existing convention is one store per domain.

**3. New channel form uses a curated swatch palette, not a raw hex/RGB picker.**
The color field is a small fixed set of preset swatches (extending the existing sage/sienna/instagram-purple hues with several more, chosen to read clearly as a `CodeCard` dot and stay legible in both the light and dark palettes) rather than an open-ended color input. This keeps every channel color inside the app's existing warm/muted design language instead of risking an arbitrary user-picked hex that clashes with `--ck-paper`/`--ck-card` or fails contrast in one of the two themes.
*Alternative considered:* native `<input type="color">`. Rejected — fully unconstrained color choice fights the curated design system described in CLAUDE.md's Design System section, for no functional benefit.

**4. A channel name determines its `key` via slugification; duplicates are checked before insert.**
`key` (e.g. `"own-site"` from `"Own site"`) is derived by lowercasing, trimming, and replacing runs of non-alphanumeric characters with `-`. Before insert, `createChannel` checks (case-insensitively) whether a channel with the same name — equivalently, the same derived key — already exists, and rejects with an error the form surfaces, per the spec's duplicate-name scenario. This reuses the existing `channels_key_unique` index as a backstop, but checks proactively so the UI can show a clean validation error instead of a raw constraint-violation message.

**5. "Expiring Soon" and "Days Left" sorting happen in JS, after the existing SQL query, not via SQL `ORDER BY`.**
`listCoupons` keeps doing SQL-level filtering and `ORDER BY` for the columns that already support it directly (`code`, `startDate`, `endDate`, `usageCount`). For the two new sort fields, `listCoupons` runs its existing query (unsorted by these fields, or by `endDate` as a stable pre-sort), lets `attachChannels` derive `status`/`daysLeft` as it already does, and then sorts the resulting in-memory array in JS using those derived values before returning.
*Why not push this to SQL:* `deriveCouponStatus` computes "today" from the device's local clock (`new Date()`), truncated to local midnight. SQLite's own `date('now')` is UTC. Computing the "expired vs. not" split or day-difference in SQL could disagree with the status the exact same request already shows the user (from the same `attachChannels` call) by one day near local midnight in non-UTC timezones. Sorting from the same derived values the UI displays keeps them always consistent, and avoids relying on any SQL feature beyond what `sql.js` (the web dev fallback) already handles.
*Trade-off accepted:* this sort happens after fetching all matching rows into memory rather than at the database level. Given this is an on-device, single-user coupon list (not a paged, server-scale dataset), the volume is small enough that this is not a performance concern.

**6. `status`/`discountType` filters move from a single value to an array (`IN (...)`), via Drizzle's `inArray`.**
`CouponListFilter.status`/`discountType` become `CouponRow['status'][]`/`CouponRow['discountType'][]`. An empty/undefined array means "no restriction on this field" (matches the spec's "no status selected shows every status" scenario), same as the field being absent today.

**7. `createCoupon` drops its "auto-create the channel if missing" fallback.**
Today, if `NewCouponInput.channelKey` doesn't match any existing channel, `createCoupon` silently inserts a new channel with `color: '#000000'`. Once the coupon form's channel picker only ever offers channels that already exist (read live from `useChannelsStore`), this path becomes unreachable in normal use, so it's removed — `createCoupon` now expects `channelKey` to reference an existing channel and lets the case where it doesn't fail loudly rather than masking it with a black-dot placeholder channel.

**8. The "+" manage-channels button is a small icon button placed in `.app-header`, next to the channel chips row — not the same control as the coupon-creation FAB.**
This matches the reference mockup's layout (the "+" sits beside the chips, not on the list). It opens a new `ChannelManagerModal.vue`, built with the same Teleport-to-body/backdrop/bottom-sheet structure as `CouponFormModal.vue` — but with the header/body/footer roles repurposed to match the mockup's own two-part split more literally than "one scrollable body": the **body** region is the independently vertically-scrolling channel list (bounded height, so it doesn't take over the whole popup) with a delete control per row, and the **footer** region (normally just a save button in `CouponFormModal`) holds the always-visible add-channel form (name + swatch palette + Save). The existing `ConfirmDialog` is reused for the delete confirmation, declared inside `ChannelManagerModal` itself (Teleport renders it to `<body>` regardless of nesting) so the modal owns its own delete-confirmation state rather than lifting it to `CodesPage`.

**9. i18n: channel names stop going through `t()`; the sort/filter toolbar's own labels are new static strings.**
The `channels: { site, etsy, instagram }` block is removed from `en.ts` entirely (channel names are now user data, read straight from the DB — the same treatment `note` and `code` already get). New static strings are added for the toolbar (sort field labels, ASC/DESC labels — the status and discount-type filter chips reuse the existing `status.*` and `form.discount*` strings rather than duplicating them) and for the channel management popup (title, add form labels, delete confirmation, duplicate-name error, empty state).

## Risks / Trade-offs

- **[Risk]** The `Channel` union removal is a breaking, cross-cutting type change touching `promoCode.ts`, `CodeCard.vue`, `CodesPage.vue`, `CouponFormModal.vue`, `stores/coupons.ts`, and `queries/coupons.ts`. → **Mitigation:** `pnpm --filter mobile run build` (type-check) after the change will surface every remaining reference to the old `Channel` type or `channels.<key>` i18n lookup as a compile error; tasks.md sequences the data-layer changes before the component changes so the type error surface guides the remaining edits.
- **[Risk]** Deleting a channel is destructive to data (every coupon's association with it) and, per the spec, irreversible once confirmed. → **Mitigation:** required confirmation step (already specified), reusing the existing, already-trusted `ConfirmDialog` component rather than a new one.
- **[Risk]** Moving "Expiring Soon"/"Days Left" sorting into JS means a large coupon list is fully loaded into memory before sorting. → **Mitigation:** accepted per Decision 5 — this is a local, single-user, on-device list, not a paged/server dataset; the existing `listCoupons` call already loads the full matching set into memory today for every sort.
- **[Risk]** Curating a fixed swatch palette (Decision 3) means a user cannot pick an arbitrary brand color for a channel. → **Mitigation:** explicitly accepted trade-off in favor of design consistency; the palette can be extended later without a spec change if it proves too limiting.

## Migration Plan

No database schema migration is required (the `channels` table already has every column this change needs). Rollout is a normal code change:
1. Land data-layer changes (`queries/channels.ts` additions, `queries/coupons.ts` filter/sort changes) first — these are additive/backward-compatible at the SQL layer.
2. Land the `Channel` type removal and store changes, which will not type-check until the component layer is updated in the same change (expected — see Risk above).
3. Land the component/UI changes (chips, picker, `CodeCard`, new `ChannelManagerModal`, toolbar).
4. Verify on the Android emulator per CLAUDE.md's testing guidance (this touches `@capacitor-community/sqlite` query shapes, not the migration file, so the known migration-splitting bug class doesn't apply — but native vs. web behavior should still be re-checked given the JS-side sort/derivation change in Decision 5).

Rollback is a plain revert (no data migration to unwind); existing seeded coupon/channel rows are unaffected by any of the above since no column or table shape changes.

## Open Questions

- Exact swatch palette values (Decision 3) and the icon used for the new "+ manage channels" button are visual-polish details to finalize during implementation — they don't affect the spec, the approach, or the task breakdown.
