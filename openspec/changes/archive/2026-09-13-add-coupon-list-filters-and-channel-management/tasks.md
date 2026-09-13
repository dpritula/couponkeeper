## 1. Channel data layer

- [x] 1.1 Add `createChannel({ name, color })` to `queries/channels.ts`: derive `key` from `name` (slugify), reject case-insensitive name/key duplicates with a typed error before insert. Verify by calling it twice with the same name (e.g. from a dev-console/test script) and confirming the second call throws.
- [x] 1.2 Add `deleteChannel(key)` to `queries/channels.ts`: delete the channel's `coupon_channels` join rows first, then the channel row (same explicit-delete-before-parent pattern `deleteCoupon` already uses). Verify by deleting a seeded channel that has coupons and confirming its `coupon_channels` rows are gone afterward.

## 2. Coupon list filter/sort data layer

- [x] 2.1 Change `CouponListFilter.status` and `.discountType` to array types in `queries/coupons.ts`, switching `eq(...)` to `inArray(...)`; an empty/undefined array means no restriction on that field. Verify by calling `listCoupons({ filter: { status: ['active', 'soon'] } })` and confirming expired coupons are excluded.
- [x] 2.2 Add `'alphabetical' | 'expiringSoon' | 'daysLeft'` to `CouponSortField`. Wire `alphabetical` to the existing `code` column at the SQL level. For `expiringSoon`/`daysLeft`, skip SQL-level `ORDER BY` and instead sort the array returned by `attachChannels` in JS, using its already-derived `status`/`daysLeft` (per design.md Decision 5), keeping non-expired coupons before expired ones for `expiringSoon` regardless of direction. Verify with a case mixing an expired coupon whose end date is earlier than a non-expired coupon's end date, confirming `expiringSoon` (either direction) still lists the non-expired one first.
- [x] 2.3 Remove `createCoupon`'s "auto-create the channel if missing" fallback (design.md Decision 7), since the form will only ever submit a channel key that already exists after task 5.3. Verify `pnpm --filter mobile run build` still type-checks after the removal.

## 3. Stores

- [x] 3.1 Add `stores/channels.ts` (`useChannelsStore`) with `items`, `load()`, `create(input)`, `remove(key)`, mirroring `useCouponsStore`'s pattern (design.md Decision 2). Verify `load()` populates `items` with the seeded channels when called from the dev preview.
- [x] 3.2 Replace `useCouponsStore`'s single `activeFilter` with `channelFilter`, `statusFilter: CouponStatus[]`, `discountTypeFilter: DiscountType[]`, `sortBy`, `sortDir`, plus actions to set/toggle each and re-`load()`. Verify the existing channel-chip filtering behavior still narrows the list correctly through the new state shape.
- [x] 3.3 Make `useChannelsStore.remove()` also call `useCouponsStore().load()` after a successful delete, so the coupon list refreshes in the background. Verify: with the manage-channels popup open, delete a channel used by a currently-visible coupon and confirm the list behind the popup updates without closing it.

## 4. Type / data-model changes

- [x] 4.1 Remove the `Channel` union from `data/promoCode.ts`; change `PromoCode.channel` to `{ key: string; name: string; color: string } | undefined`. Update `toViewModel` (`stores/coupons.ts`) to pass the resolved channel row through directly instead of extracting `.key`/casting. Verify by running `pnpm --filter mobile run build` and confirming the resulting type errors are limited to the component files addressed in section 5.

## 5. Component updates

- [x] 5.1 Update `CodeCard.vue`: render `code.channel?.name` directly (no `t('channels.…')` lookup), color the dot via an inline style bound to `code.channel?.color` instead of the `dot-<key>` CSS classes, and render a neutral/empty state when `channel` is undefined. Verify visually in the dev preview that all seeded coupons still show correct channel dot/name.
- [x] 5.2 Update `CodesPage.vue`'s filter chips to iterate `useChannelsStore().items` instead of the hardcoded `channels` array, keeping the existing single-select behavior and horizontal scroll. Verify the chip row grows and shrinks correctly after adding and deleting a channel.
- [x] 5.3 Update `CouponFormModal.vue`'s channel picker to iterate `useChannelsStore().items` and submit the picked channel's real `key`. Verify creating a coupon against a newly-added (non-default) channel succeeds and displays correctly in the list.

## 6. Channel management popup

- [x] 6.1 Build `ChannelManagerModal.vue` using the same Teleport-to-body/backdrop/bottom-sheet structure as `CouponFormModal.vue` (fixed header, scrollable body, fixed footer): top section is a scrollable channel list (styled like the coupon form's channel picker) with a delete control per row; bottom section is the add-channel form (name input + swatch palette + Save). Verify it opens/closes and visually matches the other three overlays.
- [x] 6.2 Wire channel creation: Save calls `useChannelsStore().create()`, shows a duplicate-name error inline on failure (reusing `CouponFormModal`'s error-message styling), and updates the channel list in place on success. Verify by adding a channel, then attempting a second with the same name and seeing the inline error.
- [x] 6.3 Wire channel deletion: the per-row delete control opens the existing `ConfirmDialog` layered above `ChannelManagerModal`; confirming calls `useChannelsStore().remove()`. Verify both the confirm path (channel removed) and cancel path (channel untouched).
- [x] 6.4 Add a new "+" icon button to `CodesPage.vue`'s `.app-header`, next to the channel filter chips (distinct from the existing coupon-creation FAB), opening `ChannelManagerModal`. Verify by tapping it and confirming the popup opens over the list, matching the reference mockup's placement.

## 7. Sort/filter toolbar

- [x] 7.1 Build the sort control (Start Date / End Date / Expiring Soon / Alphabetical / Times Used / Days Left, each ASC/DESC) in `CodesPage.vue`'s header, calling into `useCouponsStore`'s sort state. Verify each option re-orders the visible list as expected, including that "Expiring Soon" keeps an expired coupon after a non-expired coupon with an earlier end date.
- [x] 7.2 Build multi-select Status filter chips (Active/Expiring/Expired) and Discount Type filter chips (Percent/Amount/Shipping), toggling into `useCouponsStore`'s filter arrays and visually indicating each selected value. Verify selecting multiple values within one category OR-combines, and that combining a category with the channel filter AND-combines, per the spec's scenarios.
- [x] 7.3 Add an empty-state message shown when the combined channel/status/discount-type filters match zero coupons. Verify by choosing a combination that yields no matches and confirming the empty state renders instead of a blank list.

## 8. Localization

- [x] 8.1 Remove the `channels: { site, etsy, instagram }` block from `en.ts`. Add strings for the manage-channels popup (title, name/color labels, save, delete-confirm title/message, duplicate-name error, empty state) and the sort/filter toolbar (sort field labels, direction labels), reusing the existing `status.*`/`form.discount*` strings for the status/discount-type filter chips. Verify by grepping the changed components for literal user-facing strings that bypass `t()`.

## 9. Verification

- [x] 9.1 Run `pnpm --filter mobile run build` and confirm it passes with zero type errors.
- [x] 9.2 In the web dev preview (`pnpm --filter mobile run dev`), exercise the full flow: add a channel, create a coupon on it, exercise every sort option and every filter combination, delete the channel, and confirm the coupon list updates live — covering every scenario in `specs/coupon-channels/spec.md` and `specs/coupon-list-filtering/spec.md`.
- [x] 9.3 Per CLAUDE.md's testing guidance, run `npx cap sync android` and repeat the same flow on the `Vichara_API36` emulator (not just the web/jeep-sqlite fallback), since this change adds new `@capacitor-community/sqlite` insert/delete paths (channel create/delete). Confirm behavior matches the web preview.
