## Why

A coupon's status is currently derived from its end date alone (`active` / `soon` / `expired` — see `db/status.ts`'s `deriveCouponStatus`), so a coupon whose start date is still in the future is shown as `active` even though it isn't usable yet. Makers scheduling codes ahead of a launch have no way to tell, at a glance, which codes haven't gone live.

## What Changes

- Add a fourth coupon status, `notStarted`, derived when today is before the coupon's start date — taking priority over `active`/`soon`/`expired`, which continue to be derived from the end date exactly as today once a coupon has started.
- Extend the `coupons.status` column's allowed values and the `PromoCode`/`CodeStatus` domain type to include `notStarted`.
- Add a "Not started" badge label (and matching card/detail-modal styling, reusing existing color tokens — no new hardcoded colors) for coupons with this status.
- Add "Not Started" as a fourth selectable value in the coupon list's status filter (Codes list and Calendar's day-list toolbar, which shares the same filter), alongside the existing Active/Expiring/Expired values.

## Capabilities

### New Capabilities
- `coupon-status`: defines how a coupon's status (`notStarted`/`active`/`soon`/`expired`) is derived from its start/end dates, including the new not-started case and its priority over the others.

### Modified Capabilities
- `coupon-list-filtering`: the status filter's requirement gains a fourth selectable value, "Not Started."

## Impact

- `apps/mobile/src/db/schema.ts` — `coupons.status` enum gains `'notStarted'` (TypeScript-level only; not a DB `CHECK` constraint, so no new migration is needed — confirmed against `migrations/0000_elite_snowbird.sql`).
- `apps/mobile/src/db/status.ts` — `deriveCouponStatus` takes `startDate` in addition to `endDate`.
- `apps/mobile/src/db/queries/coupons.ts` — `attachChannels` (read path) and `createCoupon` (insert path) pass `startDate` through to `deriveCouponStatus`.
- `apps/mobile/src/data/promoCode.ts` — `CodeStatus` gains `'notStarted'`.
- `apps/mobile/src/components/CodeCard.vue`, `CouponDetailModal.vue` — new `.badge-notStarted` style.
- `apps/mobile/src/components/CouponFilterToolbar.vue` — status filter gains a fourth chip.
- `apps/mobile/src/i18n/locales/en.ts` — new `status.notStarted` label.
- No schema migration, no changes to sorting logic (a not-started coupon is non-expired and sorts alongside active/expiring coupons under "Expiring Soon," and by its dates normally under every other sort field), no changes to Calendar's month-grid/indicator-line logic (unaffected — those key off date ranges, not status).
