## 1. Schema and migration

- [x] 1.1 Drop `uniqueIndex('coupons_code_unique')` from `coupons` in `apps/mobile/src/db/schema.ts` and verify the file still type-checks (`pnpm --filter mobile run build`)
- [x] 1.2 Regenerate the migration with `pnpm --filter mobile run db:generate` and verify a new SQL file appears under `apps/mobile/src/db/migrations/` that removes the old unique index and no other unintended schema diff is present

- [x] 1.3 (Found during implementation, see design.md Decision 7) Update `apps/mobile/src/db/client.ts`'s `ensureSchema` to import and apply migration `0001_naive_meggan.sql` — running it after 0000 on a fresh db, and self-healing an existing db (where `coupons` already exists) by checking `sqlite_master` for whether the old `coupons_code_unique` index is still present and applying 0001 if so — and verify by wiping a dev database (delete the `jeepSqliteStore` IndexedDB store) and confirming a fresh load no longer throws `UNIQUE constraint failed: coupons.code` when saving a same-code-different-channel edit

## 2. Query layer: uniqueness check and update

- [x] 2.1 Add a `codeExistsOnChannel(code, channelKey, excludeCouponId?)` helper to `apps/mobile/src/db/queries/coupons.ts` (join `coupons` → `coupon_channels` → `channels`) and verify it returns true only for a coupon sharing both code and channel, excluding `excludeCouponId` when given
- [x] 2.2 Call `codeExistsOnChannel` from `createCoupon`, throwing a distinguishable error (e.g. a `DuplicateCouponCodeError` class or an error with a recognizable `code`/message) when it matches, and verify `createCoupon` now rejects a same-code-same-channel duplicate instead of relying on the dropped DB index
- [x] 2.3 Add `updateCoupon(currentCode: string, input: NewCouponInput): Promise<CouponWithChannels>` to `apps/mobile/src/db/queries/coupons.ts` per design.md Decision 6 — looks up the row by `currentCode`, runs the same `codeExistsOnChannel` check (excluding its own id), updates all editable columns plus re-derived `status`/`daysLeft`, replaces its single `coupon_channels` row, and leaves `usageCount` untouched — and verify with a direct call (temporary script or the store wiring in section 3) that editing a coupon's code, dates, and channel all persist correctly while usage count is preserved

## 3. Coupons store

- [x] 3.1 Add an `update(currentCode: string, input: NewCouponInput)` action to `useCouponsStore` (`apps/mobile/src/stores/coupons.ts`) that calls `updateCoupon` and reloads `items`, mirroring the existing `create` action, and verify `couponsStore.items` reflects an edited coupon's new values immediately after the action resolves

## 4. Date picker component

- [x] 4.1 Create `apps/mobile/src/components/DatePickerModal.vue` per design.md Decision 5 — Teleport-to-body bottom sheet, reusing `utils/calendar.ts`'s `getMonthGrid` for a single-month day grid with prev/next month navigation, taking a currently-selected ISO date (or none) and emitting a chosen ISO date on day tap — and verify it renders a correct month grid and emits the tapped day's ISO date
- [x] 4.2 Style `DatePickerModal` consistently with `MonthYearPickerModal`/`CouponFormModal` (same backdrop/card/header shell, safe-area padding) and verify visually in the dev preview

## 5. Form modal: edit mode and validation

- [x] 5.1 Add an optional `coupon: PromoCode | null` prop to `CouponFormModal` and derive `mode: 'create' | 'edit'` from it; key the form's root on `coupon?.code ?? 'new'` per design.md Decision 1, and verify opening the form with a `coupon` prop pre-fills every field (code, channel, discount type, value, start date, end date, usage limit, note) from that coupon's data
- [x] 5.2 Replace the Start/End free-text `<input>`s with read-only fields that open `DatePickerModal` on tap, storing the chosen ISO date directly (no more `parseDisplayDate` round-trip through `DD.MM.YYYY`), and verify a date picked in the popup appears formatted in the field and is used as-is (already ISO) on save
- [x] 5.3 Implement synchronous validation (code non-empty, channel selected, value non-empty, start date present, end date present, end >= start) that runs before any store call, collecting every failing check into one list, and verify saving with multiple empty/invalid fields shows every corresponding message at once in the existing error area above Save
- [x] 5.4 Update `save()` to branch on `mode`: call `couponsStore.create(...)` when creating, `couponsStore.update(coupon.code, ...)` when editing, and verify both paths close the form and leave `couponsStore.items` updated
- [x] 5.5 Catch a duplicate-code-on-channel error from the store/query layer in `save()` and render it as an informative message (e.g. "This code is already used on this channel") in the same error area, combined with any other still-relevant messages, and verify saving a duplicate code on the same channel shows this specific message rather than the generic `form.saveError` fallback
- [x] 5.6 Verify the form's title (`form.newTitle`) switches to an edit-appropriate title when `mode === 'edit'`

## 6. Detail modal: edit entry point

- [x] 6.1 Add a visually distinct edit icon/button to `CouponDetailModal`'s header (e.g. an `ion-icon` pencil/create icon, alongside the existing × close button) that emits an `edit` event with the current coupon, and verify it renders on every screen that opens the modal
- [x] 6.2 Verify activating the edit control does not also trigger the backdrop's `@click.self` close handler or the × close handler

## 7. Page wiring (Codes and Calendar)

- [x] 7.1 In `CodesPage.vue`, add an `editingCode` local ref, handle `CouponDetailModal`'s `edit` event by setting `selectedCode = null; editingCode = code`, pass `editingCode` as `CouponFormModal`'s `coupon` prop, and combine `showForm`/`editingCode` into the form's `open` per design.md Decision 2; verify tapping a coupon's detail edit icon replaces the detail popup with the pre-filled form, and saving or closing returns to the list with no popup open
- [x] 7.2 Apply the same wiring to `CalendarPage.vue` (edit reachable from its detail popup, form save refreshes both the month grid's indicator lines and the selected-day list), and verify editing a coupon's dates from Calendar's detail popup updates the day grid and day list immediately without leaving the screen
- [x] 7.3 Verify Calendar's coupon cards still show no delete control and the edit control remains the only mutating action reachable from Calendar, per the updated `calendar-view` spec delta

## 8. Localization

- [x] 8.1 Add new `en.ts` strings: the edit icon's accessible label, the edit-mode form title, and one message per validation rule (empty code, empty channel, empty discount type, empty value, empty start date, empty end date, end-before-start, duplicate code on channel), and verify every new string is referenced via `t()` with no hardcoded copy in the touched components

## 9. Cross-cutting verification

- [x] 9.1 Run `pnpm --filter mobile run build` (type-check + production build) and verify it passes with no new errors
- [x] 9.2 Exercise the full edit flow in the web/dev preview: open a coupon's detail popup from Codes, edit it (including changing its code and its channel), save, and verify the list and the coupon's own detail view reflect the change
- [x] 9.3 Exercise the duplicate-code and required-field validation scenarios from the `coupon-editing` spec in the dev preview (same code, same channel → rejected with message; same code, different channel → allowed; empty required field → rejected with message; end date before start date → rejected with message) and verify each matches its spec scenario
- [x] 9.4 Per CLAUDE.md, rebuild and verify on the Android emulator (`Vichara_API36`) after `npx cap sync android`, since this change touches the schema/migration layer, which has previously diverged between the web fallback and native SQLite
