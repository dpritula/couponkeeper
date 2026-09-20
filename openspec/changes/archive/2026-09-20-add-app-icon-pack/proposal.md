## Why

CouponKeeper still ships Capacitor's default, generic Android icon set (auto-generated when `cap add android` ran) everywhere the OS can show an app icon — home screen, app drawer, recents/task switcher, and every local expiry-warning notification. A finished icon pack (adaptive launcher icon incl. monochrome themed variant, notification small-icon, and Play Store listing icon), matching the app's own `--ck-sage`/`--ck-paper` palette and coupon/ticket motif, has been designed and delivered as a ready-to-use Android resource set (`CouponKeeper-android-icons.zip`). It needs to replace the placeholder assets so the app looks intentional wherever its icon can appear, not just in the running UI.

Two more surfaces still show the old generic placeholder once the Android-side work above landed: the browser tab (favicon) for the web/dev-server build, and — unlike a native app's OS-level launcher icon — CouponKeeper's own in-app header, which today shows only a wordmark with no mark at all on any of its three tabs. Both are covered by this same delivered icon pack and belong in the same "wherever the app's icon can appear" scope as the rest of this change (maker feedback, added after the Android-side tasks were already implemented).

## What Changes

- Replace the default-generated Android launcher icon resources (`mipmap-{m,h,xh,xxh,xxxh}dpi/ic_launcher.png` + `ic_launcher_round.png`, `mipmap-anydpi-v26/ic_launcher.xml` + `ic_launcher_round.xml`, `drawable-v24/ic_launcher_background.xml` + `ic_launcher_foreground.xml`, `values/ic_launcher_background.xml`) with the delivered pack's versions, so the home screen, app drawer, and recents/task switcher all show the real CouponKeeper icon.
- Add the delivered pack's `drawable-v24/ic_launcher_monochrome.xml` adaptive-icon layer (not present today), so Android 13+'s themed-icon mode renders a correct monochrome CouponKeeper glyph instead of falling back to a generic shape.
- Add the delivered pack's per-density `drawable-{m,h,xh,xxh,xxxh}dpi/ic_stat_coupon.png` notification small-icon resources, and wire `apps/mobile/src/notifications/expiryNotifications.ts`'s `buildNotification` to pass `smallIcon: 'ic_stat_coupon'` on every scheduled notification, so expiry-warning notifications show the app's own glyph in the status bar and notification tray instead of Android's generic-bell fallback.
- Check in the delivered pack's `ic_launcher-playstore.png` (512×512) and source vectors (`foreground.svg`, `icon_full.svg`, `notification.svg`) as repo-tracked design assets, for use when the app is submitted to the Play Store and as the editable source for any future icon revision.
- Replace `apps/mobile/public/favicon.png` (the stock Ionic/Capacitor placeholder) with the delivered icon's own art, so the browser tab (web/dev-server build) shows CouponKeeper's real icon instead of the generic one.
- Add a small logo mark, taken from the same delivered icon, to the left of the wordmark in the fixed header on all three tabs (Codes, Calendar, Settings), so the app's identity shows up in its own UI, not just the OS chrome around it.

## Capabilities

### New Capabilities
- `app-icon`: the app's icon identity everywhere it can appear — the Android adaptive launcher icon (incl. themed/monochrome variant) shown on the home screen, app drawer, and recents/task switcher; the dedicated small icon shown on every local notification; the store-listing icon asset checked into the repo; the browser-tab favicon for the web build; and the in-app header logo mark shown on all three tabs.

### Modified Capabilities
(none — `coupon-expiry-notifications`'s content, timing, and delivery-dedup requirements are unchanged; only the icon asset a notification renders with changes, which is covered by the new `app-icon` capability above)

## Impact

- **Affected code**: `apps/mobile/android/app/src/main/res/mipmap-{m,h,xh,xxh,xxxh}dpi/`, `res/mipmap-anydpi-v26/`, `res/drawable-v24/`, `res/values/ic_launcher_background.xml` (all replaced/added, generated Android resources — not TypeScript), `apps/mobile/src/notifications/expiryNotifications.ts` (`buildNotification`, add `smallIcon`), `apps/mobile/index.html` (favicon `<link>` tags), `apps/mobile/public/favicon.png` (replaced) plus a new `apps/mobile/public/favicon.svg`, a new shared logo component used by `CodesPage.vue`/`CalendarPage.vue`/`SettingsPage.vue`'s headers (see design.md for the exact component shape).
- **Affected assets (new, repo-tracked)**: `apps/mobile/android/app/src/main/res/drawable-{m,h,xh,xxh,xxxh}dpi/ic_stat_coupon.png`, `apps/mobile/icon-source/ic_launcher-playstore.png` and `icon-source/*.svg` (already landed in this change's first round), plus the new `apps/mobile/public/favicon.svg` and the header logo component's own asset (see design.md).
- **Verification**: the Android-side items (launcher/notification icon) still need a real build (`assembleDebug` + emulator/device install) — the web/`jeep-sqlite` dev server has no Android launcher/notification-tray surface. The favicon and header logo are the opposite: they're only meaningfully verifiable in the web/dev-server preview (browser tab + in-app header), not on the Android build.
