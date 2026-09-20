## Why

A maker only finds out a coupon is about to expire by opening the app and looking at the Codes list or Calendar. There's no proactive reminder, so a code can lapse unnoticed. A native daily reminder — driven by a maker-configurable "warn me N days before expiry" threshold — closes that gap using on-device local notifications, consistent with the app's local-first design (no backend, no push infrastructure).

## What Changes

- Add a new Settings field, "Warn about coupon expiry": an integer stepper (increment/decrement, default `2`), clamped to `0`–`20`; any value outside that range (however it gets there) resets to the default `2`.
- Add a native local-notification subsystem that recalculates and reschedules the app's expiry-warning notifications whenever: the app returns to the foreground, a coupon is created, edited, or deleted, or the warning-days setting changes.
- Each day, at 12:00 local device time, show at most one grouped notification listing every coupon whose remaining days until its end date is between `0` and the configured warning threshold (inclusive) and whose status is not `expired` (and not `notStarted`, since it hasn't gone live yet). A day with no qualifying coupons shows no notification.
- Tapping a notification for a single qualifying coupon opens that coupon's detail popup; tapping a notification covering multiple coupons opens the Codes list with a filter that shows exactly that day's qualifying coupons.
- Scheduling uses a bounded, deterministic set of notification IDs (one slot per day-offset from today, `0`..`20`) that is fully cancelled and rebuilt on every recalculation — simpler and less error-prone than diffing against whatever was previously scheduled, and cheap since the horizon is capped at 20 days by the setting's own maximum.
- Uninstalling the app removes all of its scheduled notifications automatically — this is a guarantee of the Android platform (scheduled local notifications are tied to the app's package), not something this change needs to implement.

## Capabilities

### New Capabilities
- `coupon-expiry-notifications`: the native local-notification subsystem — when recalculation runs, which coupons qualify for a warning, how they're grouped into a day's single notification, its content and delivery time, what tapping it does, and the platform-provided guarantee that uninstalling the app clears its scheduled notifications.

### Modified Capabilities
- `settings`: gains a new requirement for the "warn about coupon expiry" stepper field (range, default, and invalid-value reset behavior) alongside the existing theme and default-sort controls.

## Impact

- `apps/mobile/src/stores/settings.ts` — new persisted `warnDaysBefore` state (same `localStorage` + read/clamp/fallback pattern as `defaultSort`), plus a `setWarnDaysBefore` action.
- `apps/mobile/src/views/SettingsPage.vue` — new stepper control for the setting.
- `apps/mobile/src/i18n/locales/en.ts` — new `settings.*` and a new `notifications.*` section for notification title/body strings.
- New `apps/mobile/src/notifications/` module (name indicative — finalized in design.md): recalculation/scheduling logic, wrapping the new `@capacitor/local-notifications` dependency.
- `apps/mobile/package.json` — add `@capacitor/local-notifications`.
- `apps/mobile/android/app/src/main/AndroidManifest.xml` — add the `POST_NOTIFICATIONS` permission (required on Android 13+/API 33+).
- `apps/mobile/src/stores/coupons.ts` — `create`/`update`/`remove` trigger a recalculation after their existing store/database work.
- `apps/mobile/src/main.ts` (or a small bootstrap module it calls) — registers the `@capacitor/app` `resume` listener and runs one recalculation on cold start, after seeding.
- `apps/mobile/src/router/`, `apps/mobile/src/views/CodesPage.vue` — a way to open the Codes list pre-filtered to a specific set of coupon codes (for the multi-coupon notification tap case) and to open a specific coupon's detail popup directly (single-coupon case), both driven by data carried on the notification itself.
- No database schema change — this reuses the existing `startDate`/`endDate`/`status` already on `coupons` (via `deriveCouponStatus`/`daysUntilEnd` in `db/status.ts`), read fresh on every recalculation rather than stored.
