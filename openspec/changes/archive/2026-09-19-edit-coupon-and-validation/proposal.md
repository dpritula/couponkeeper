## Why

Creating, viewing, and deleting a coupon are all real operations today, but a maker who made a typo or needs to adjust a code's dates, channel, or value has no way to fix it short of deleting and re-creating the coupon (losing its usage count in the process). The coupon form itself also accepts save attempts with empty required fields or an end date before the start date, surfacing only a generic "could not save" message rather than telling the maker what's actually wrong — and its Start/End fields are free-text (`DD.MM.YYYY`), so a malformed date silently throws instead of being caught by validation. This change adds in-place editing and tightens the shared form's validation so both creating and editing a coupon behave predictably and explain failures clearly.

## What Changes

- Add an edit icon to `CouponDetailModal`'s header, on both the Codes and Calendar screens (Calendar's coupon cards stay read-only for delete, but gain the same edit path as Codes).
- Activating the edit icon replaces the detail view with `CouponFormModal`, pre-filled with that coupon's current data, reusing the exact same form used for creating a coupon (not a separate edit form).
- `CouponFormModal` gains an edit mode: saving in edit mode updates the existing coupon in place (by its database id, so changing the code itself is safe) instead of inserting a new one; saving in either mode immediately refreshes the Codes list and the Calendar screen's month grid/day list.
- Add field-level validation to the shared form, checked on save, covering both create and edit:
  - Code, Channel, Discount type, Amount (the existing "Value" field), Start, and End must all be non-empty.
  - End date must not be before Start date.
  - Start and End are picked from a calendar-popup date picker (matching the app's existing Teleport-to-body popup style) instead of typed as free text, so they are always syntactically valid dates.
  - The combination of Code + Channel must be unique: two coupons may reuse the same code as long as they're on different channels (not a single coupon reusing another coupon's code on the *same* channel), checked at save time and excluding the coupon currently being edited.
- Replace the form's single generic `form.saveError` message with an informative error area (same location, above the Save button) that lists every current validation problem in plain language (e.g. which field is empty, that the end date precedes the start date, or that the code is already used on that channel).
- **BREAKING**: `coupons.code` currently has a single-column DB unique index (`coupons_code_unique`). Since uniqueness becomes scoped to code+channel, this index is dropped in favor of an application-level check; the same code may now legitimately exist on two different coupons as long as their channels differ.

## Capabilities

### New Capabilities
- `coupon-editing`: editing an existing coupon through the same form used to create one — the edit entry point, pre-fill, save-time field validation (required fields, date ordering, valid dates via a date picker, code+channel uniqueness), informative inline error messages, and immediate propagation of a saved edit to the Codes list and Calendar.

### Modified Capabilities
- `calendar-view`: the "Read-only coupon cards on Calendar" requirement is updated — Calendar's coupon cards still offer no delete control, but activating a card's detail popup now also offers the same edit path Codes offers, so "read-only" no longer means "no actions at all."

## Impact

- `apps/mobile/src/components/CouponDetailModal.vue` — add the edit icon/header control, switch to edit mode.
- `apps/mobile/src/components/CouponFormModal.vue` — add edit mode (pre-fill, update vs. create), validation, error-message rendering, wire in the new date picker.
- New `apps/mobile/src/components/DatePickerModal.vue` (or similar) — calendar-popup date picker for Start/End, reusing `utils/calendar.ts`'s `getMonthGrid`.
- `apps/mobile/src/db/queries/coupons.ts` — add `updateCoupon`, add an application-level code+channel uniqueness check used by both create and update.
- `apps/mobile/src/db/schema.ts` + a new generated migration (`pnpm --filter mobile run db:generate`) — drop `coupons_code_unique`.
- `apps/mobile/src/db/client.ts` — apply the new migration (previously hardcoded to only ever apply the first one), including self-healing a db created before this change (see design.md Decision 7).
- `apps/mobile/src/stores/coupons.ts` — add an `update` action that calls `updateCoupon` and refreshes `items`.
- `apps/mobile/src/views/CodesPage.vue`, `apps/mobile/src/views/CalendarPage.vue` — wire the detail popup's edit mode through to the shared form.
- `apps/mobile/src/i18n/locales/en.ts` — new strings for the edit icon, the edit-mode form title, and the per-field validation messages.
- `apps/mobile/src/utils/date.ts` — likely gains a date-picker-facing helper alongside the existing `parseDisplayDate`/`formatShortDate`/`formatFullDate`.
