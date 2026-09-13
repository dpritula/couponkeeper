## 1. Shared, persisted default sort

- [x] 1.1 In `apps/mobile/src/stores/settings.ts`, add `defaultSort: { sortBy: CouponSortField, sortDir: SortDirection }` state seeded from a new `couponkeeper.defaultSort` `localStorage` key (JSON-encoded), falling back to `{ sortBy: 'daysLeft', sortDir: 'desc' }` when absent or unparseable, plus a `setDefaultSort(sortBy, sortDir)` action that updates state and writes the key back — verify by unit-checking (or a quick manual console check) that a fresh profile reads `daysLeft`/`desc` and that `setDefaultSort` persists across a store re-instantiation.
- [x] 1.2 In `apps/mobile/src/stores/coupons.ts`, replace the `sortBy`/`sortDir` state fields with getters delegating to `useSettingsStore().defaultSort`, and have `setSort(sortBy, sortDir)` call `useSettingsStore().setDefaultSort(sortBy, sortDir)` before `load()` — verify `queries/coupons.ts`'s `listCoupons` call site in `load()` still type-checks unchanged (`pnpm --filter mobile run build`).
- [x] 1.3 In `apps/mobile/src/views/CalendarPage.vue`, replace the local `dayListSortBy`/`dayListSortDir` refs with computed pass-throughs to `useSettingsStore().defaultSort`, and have `onDayListSortChange` call `setDefaultSort` instead of assigning local refs — verify the existing `sortDayListCoupons` computed still recalculates when the setting changes (manual check in dev server: change sort on Calendar, confirm the day list re-orders).

## 2. Shared sort-options list

- [x] 2.1 Create `apps/mobile/src/utils/couponSort.ts` exporting `getCouponSortOptions()`, moving the 11-entry `sortOptions` array (value/sortBy/sortDir/label, using `t()`) out of `CouponFilterToolbar.vue` verbatim — verify by importing it back into `CouponFilterToolbar.vue` via `computed(() => getCouponSortOptions())` and confirming the Codes and Calendar toolbars render the same 11 options as before (dev server, visual check).

## 3. Settings screen

- [x] 3.1 In `apps/mobile/src/views/SettingsPage.vue`, remove the `<p class="placeholder-note">` block and its `settings.placeholder` usage.
- [x] 3.2 Add a "default sort" `<select>` row below the theme picker, bound to `useSettingsStore().defaultSort` and calling `setDefaultSort` on change, using `getCouponSortOptions()` from `utils/couponSort.ts` for its options (matching value encoding/parsing already used in `CouponFilterToolbar.vue`'s `onSortChange`) — verify the select shows "Days Left, Descending" selected on a fresh profile, and that picking another option there updates the Codes list's sort next time Codes is opened.
- [x] 3.3 Add the feedback disclaimer: a styled block after the settings list, using the `--ck-sage-dim` background token (per design.md) and a `mailto:couponkeeper.email@gmail.com` link, rendered via `settings.feedback` (with `<i18n-t keypath="settings.feedback">` wrapping the email in a real `<a>`, per vue-i18n's component interpolation) — verify visually in both light and dark theme (toggle via the existing theme picker) that the disclaimer is legible and visually distinct from the page background.

## 4. Localization

- [x] 4.1 In `apps/mobile/src/i18n/locales/en.ts`, remove the `settings.placeholder` key and add `settings.sortLabel` (the select's row label) and `settings.feedback` (the disclaimer body, `{email}` slot) — verify no other file still references `settings.placeholder` (`grep -r "settings.placeholder" apps/mobile/src`).

## 5. Verification

- [x] 5.1 Run `pnpm --filter mobile run build` (type-check + production build) and confirm it succeeds with no new type errors from the `coupons.ts` getter change or the new store field.
- [x] 5.2 In the dev server (`pnpm --filter mobile run dev`), exercise the full loop: change sort on Settings → confirm Codes and Calendar both reflect it after navigating to them; change sort on Codes → confirm Settings and Calendar reflect it; change sort on Calendar → confirm Settings and Codes reflect it; reload the page and confirm the last-set sort survives (persisted via `localStorage`).
- [x] 5.3 Confirm the Settings screen shows no leftover static/placeholder text and that the feedback disclaimer's `mailto:` link opens a compose window addressed to `couponkeeper.email@gmail.com`.
