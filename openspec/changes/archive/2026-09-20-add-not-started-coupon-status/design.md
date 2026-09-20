## Context

See [proposal.md](proposal.md) for motivation. `db/status.ts`'s `deriveCouponStatus(endDate, now)` currently derives `active`/`soon`/`expired` purely from `endDate`, and is called from two places: `queries/coupons.ts`'s `attachChannels` (every read) and `createCoupon` (insert, to populate the NOT NULL `status`/`days_left` columns). `coupons.status` is `text('status', { enum: [...] })` in Drizzle's sqlite-core — confirmed against `migrations/0000_elite_snowbird.sql` that this produces a plain `TEXT NOT NULL` column with no SQL `CHECK` constraint, so extending the enum is a TypeScript-level change only; no new migration is needed and existing rows need no backfill (their `status` value is always overwritten by `deriveCouponStatus` on read anyway, same as every other status already works — see CLAUDE.md's "status/daysLeft are always derived from the dates, never trusted from storage").

## Goals / Non-Goals

**Goals:**
- Add `notStarted` as a fourth, correctly-prioritized status, derived consistently everywhere status is computed or shown.
- Keep the change additive: no changes to the month-grid/indicator-line logic, the shared default-sort mechanism, or any other status's derivation rule.

**Non-Goals:**
- No "days until start" countdown (mirroring how `active`/`expired` don't carry a `daysLeft` value either — only `soon` does).
- No change to how a coupon's start date is chosen at creation time (`CouponFormModal` already allows any date, including future ones).

## Decisions

**`deriveCouponStatus` signature becomes `(startDate, endDate, now?)`, with `notStarted` checked first.** The function already normalizes `now` to local midnight internally (see `daysUntilEnd`); the not-started check reuses the same day-granularity comparison (`today < startDate`, both normalized to local midnight) rather than a separate string comparison, so a same-day start is never mistaken for not-started. Alternative considered: a wrapper function that decides `notStarted` outside `deriveCouponStatus` and falls back to it otherwise — rejected because it would split "how status is computed" across two places for no benefit; every caller already has both dates on hand (`CouponRow`/`NewCouponInput` both carry `startDate` and `endDate`).

**Badge styling reuses existing tokens: `background: var(--ck-rule)`, `color: var(--ck-muted)`.** The app's established practice (see CLAUDE.md's Calendar day-cell note) is to stay within the existing `--ck-*` token set rather than introduce new hardcoded colors. `--ck-rule`/`--ck-muted` are the app's neutral/divider tokens, giving "Not Started" a visually muted, neutral treatment distinct from Active's sage, Expiring's sienna, and Expired's `--ck-expired-bg`. This CSS block is duplicated into both `CodeCard.vue` and `CouponDetailModal.vue`, matching how the existing three badge variants are already duplicated between those two components (they don't share a style module today).

**The card's secondary date line shows "starts {date}" (start date) instead of "until {date}" (end date) when not-started.** `CodeCard.vue`'s `dateLabel` already branches per status (`ended` for expired, `untilWithDays` for soon, `until` otherwise); a not-started coupon hasn't begun yet, so its end date is less immediately useful than knowing when it starts. A new `codes.startsOn: 'starts {date}'` i18n key is added for this branch. This is a small, localized UI-copy decision, not a spec-level requirement — `coupon-status`'s spec only requires the status *label* to be distinguishable, not any particular secondary-line wording.

**No change to `CouponListFilter.status`'s type or to `sortRowsInMemory`/`sortDayListCoupons`.** Both are already typed against `CouponRow['status']` / the broader status union, so they pick up `notStarted` automatically once the schema/domain types are extended. The "Expiring Soon" comparator's non-expired/expired split (`status === 'expired'`) already treats anything else, `notStarted` included, as non-expired — matching the new `coupon-status` spec's requirement, with no code change needed.

## Risks / Trade-offs

[A coupon with `startDate > endDate` (invalid input) could be simultaneously "not started" and "already ended" by naive date math] → Not newly introduced by this change: the form doesn't currently validate `start <= end`, and `notStarted`'s priority rule (checked first) already gives a deterministic answer — such a coupon shows as `notStarted` until its start date arrives, then falls through to whatever its end-date-based status already would have been. No new validation is added here since it's an existing, orthogonal gap.
