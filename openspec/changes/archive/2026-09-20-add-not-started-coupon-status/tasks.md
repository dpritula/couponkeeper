## 1. Domain and status derivation

- [x] 1.1 In `apps/mobile/src/db/status.ts`, add `'notStarted'` to `CouponStatus` and change `deriveCouponStatus` to accept `(startDate, endDate, now?)`, returning `{ status: 'notStarted' }` (no `daysLeft`) when today (local midnight) is before `startDate` (local midnight), checked before the existing end-date logic. Verify with a quick manual check (or a unit test if a test runner is later added) covering: start date tomorrow → `notStarted`; start date today → falls through to existing active/soon/expired logic; start date in the past → unaffected.
- [x] 1.2 In `apps/mobile/src/db/schema.ts`, add `'notStarted'` to `coupons.status`'s `enum` list.
- [x] 1.3 In `apps/mobile/src/data/promoCode.ts`, add `'notStarted'` to `CodeStatus`.

## 2. Wire status derivation through reads and writes

- [x] 2.1 In `apps/mobile/src/db/queries/coupons.ts`'s `attachChannels`, pass `coupon.startDate` into `deriveCouponStatus` alongside `coupon.endDate`.
- [x] 2.2 In the same file's `createCoupon`, pass `input.startDate` into `deriveCouponStatus` alongside `input.endDate`. Verify by creating a coupon with a future start date (via `CouponFormModal` in the running app) and confirming it's inserted with `status = 'notStarted'`.

## 3. Labels and visual treatment

- [x] 3.1 In `apps/mobile/src/i18n/locales/en.ts`, add `status.notStarted: 'Not Started'` and `codes.startsOn: 'starts {date}'`.
- [x] 3.2 In `apps/mobile/src/components/CodeCard.vue`, add a `.badge-notStarted` style (`background: var(--ck-rule); color: var(--ck-muted);`) and a `dateLabel` branch: when `code.status === 'notStarted'`, return `t('codes.startsOn', { date: formatShortDate(code.startDate) })`.
- [x] 3.3 In `apps/mobile/src/components/CouponDetailModal.vue`, add the same `.badge-notStarted` style so the detail popup's badge matches the card's.

## 4. Filtering

- [x] 4.1 In `apps/mobile/src/components/CouponFilterToolbar.vue`'s `statusOptions`, add `{ value: 'notStarted', label: t('status.notStarted') }`. Verify the new chip appears in both the Codes list and Calendar's day-list toolbar (both consume this shared component) and that selecting it shows only not-started coupons.

## 5. Verification

- [x] 5.1 Run `pnpm --filter mobile run build` (type-check + build) and confirm it succeeds with no type errors from the widened status union.
- [x] 5.2 In the running dev server (`pnpm --filter mobile run dev`), create a coupon with a start date a few days in the future and confirm: it shows a "Not Started" badge on the Codes list, in its detail popup, and in Calendar's day list for a day within its date range; it's included/excluded correctly by the new "Not Started" filter chip on both screens; and it sorts as non-expired under "Expiring Soon."
