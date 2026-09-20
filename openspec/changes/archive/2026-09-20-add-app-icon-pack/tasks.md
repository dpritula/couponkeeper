## 1. Launcher icon replacement

- [x] 1.1 Replace `apps/mobile/android/app/src/main/res/mipmap-{mdpi,hdpi,xhdpi,xxhdpi,xxxhdpi}/ic_launcher.png` and `ic_launcher_round.png` with the delivered pack's versions; verify by diffing file bytes against the pack and confirming no filename in this set is missing or extra.
- [x] 1.2 Replace `apps/mobile/android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml` and `ic_launcher_round.xml` with the delivered pack's versions (3-layer: background/foreground/monochrome); verify each XML parses and references `@drawable/ic_launcher_background`, `@drawable/ic_launcher_foreground`, and `@drawable/ic_launcher_monochrome`. (Also removed the now-orphaned per-density `mipmap-*/ic_launcher_foreground.png` raster files the old 2-layer XML referenced — nothing points at them any more.)
- [x] 1.3 Replace `apps/mobile/android/app/src/main/res/drawable-v24/ic_launcher_background.xml` and `ic_launcher_foreground.xml`, and add the new `drawable-v24/ic_launcher_monochrome.xml`, with the delivered pack's versions; verify the three files exist and each is well-formed vector-drawable XML.
- [x] 1.4 Replace `apps/mobile/android/app/src/main/res/values/ic_launcher_background.xml` with the delivered pack's version; verify the `ic_launcher_background` color resource resolves to `#4C7A5D`.
- [x] 1.5 Confirm `AndroidManifest.xml`'s existing `android:icon="@mipmap/ic_launcher"` / `android:roundIcon="@mipmap/ic_launcher_round"` need no changes (same resource names as before); verify by inspecting the manifest — no diff expected in this file.

## 2. Notification icon

- [x] 2.1 Add `apps/mobile/android/app/src/main/res/drawable-{mdpi,hdpi,xhdpi,xxhdpi,xxxhdpi}/ic_stat_coupon.png` from the delivered pack (new folders/files, no existing files to replace); verify all five density files are present.
- [x] 2.2 In `apps/mobile/src/notifications/expiryNotifications.ts`'s `buildNotification()`, add `smallIcon: 'ic_stat_coupon'` to both the single-coupon and multi-coupon returned notification objects; verify by reading the diff — both branches set the option, not just one.

## 3. Store-listing and source assets

- [x] 3.1 Create `apps/mobile/icon-source/` and copy in the delivered pack's `ic_launcher-playstore.png` and `source/foreground.svg`, `source/icon_full.svg`, `source/notification.svg` (skip `preview.png` — a rendered contact sheet, not a usable asset, per design.md); verify the four files exist at that path and are added to git.

## 4. Build and on-device verification

- [x] 4.1 Run `pnpm --filter mobile run build` then `npx cap sync android` from `apps/mobile/`; verify both complete without error.
- [x] 4.2 Run a clean `assembleDebug` (`cd apps/mobile/android && ./gradlew.bat clean assembleDebug`); verify the build succeeds and `app-debug.apk` is produced.
- [x] 4.3 Install the APK on the `Vichara_API36` emulator and verify the home-screen and app-drawer icon show the new CouponKeeper mark (sage background, coupon/ticket glyph), not the previous placeholder.
- [x] 4.4 With the app running, open Android recents/task switcher and verify the app's card shows the same new icon.
- [x] 4.5 Enable "Themed icons" in the emulator's launcher settings and verify the home-screen icon re-renders using the device theme color with the coupon/ticket glyph shape (the monochrome layer), not a generic fallback; then disable it again. (First attempt showed a stale-icon-cache artifact — the dock slot briefly rendered Play Store's themed icon instead, left over from before the app's icon files were replaced; an uninstall+reinstall while themed icons was already on forced a fresh icon generation and rendered the correct coupon glyph in the theme color. Not a defect in the delivered monochrome XML.)
- [x] 4.6 Trigger a real expiry-warning notification on-device (e.g. temporarily set a coupon's end date within the "warn about coupon expiry" window, or use `adb shell` to fire the scheduled notification early) and verify its status-bar and notification-tray icon is the new coupon glyph, not a system default bell/icon. (Set the emulator's clock to 2:00 PM — inside the noon–20:00 catch-up window — then created a coupon ending the next day; the "Coupon expiring soon" notification delivered within seconds showing the ic_stat_coupon glyph in the tray, confirmed by a pixel-level crop. Device clock restored to automatic afterward.)
- [x] 4.7 Confirm no other on-device regressions from this change (app launches, list/calendar/settings screens unaffected) via a quick smoke pass, since this change touches shared native resource files. (Codes, Calendar, and Settings all render and behave normally; the test coupon and its notification were cleaned up afterward.)

## 5. Web favicon

- [x] 5.1 Copy `apps/mobile/icon-source/icon_full.svg` verbatim to `apps/mobile/public/favicon.svg`; verify the file exists and its content matches the source exactly (straight copy, no edits).
- [x] 5.2 Regenerate `apps/mobile/public/favicon.png` by downscaling `apps/mobile/icon-source/ic_launcher-playstore.png` to the existing file's size; verify the new PNG replaces the old placeholder and visually shows the coupon/ticket glyph, not the previous generic icon. (Downscaled to 64×64, matching the previous file's size.)
- [x] 5.3 In `apps/mobile/index.html`, change the favicon `<link>` to a modern SVG-primary + PNG-fallback pair (`rel="icon" type="image/svg+xml" href="/favicon.svg"` plus `rel="alternate icon" type="image/png" href="/favicon.png"`); verify by loading the dev server in a browser and checking the tab icon. (Verified both `<link>` tags resolve correctly via `document.querySelectorAll('link[rel*="icon"]')`, and `/favicon.svg` renders the coupon glyph when loaded directly.)

## 6. In-app header logo

- [x] 6.1 Create `apps/mobile/src/components/AppLogo.vue`, inlining `icon_full.svg`'s markup (background gradient + glyph path) as a `<svg>` template with no props needed; verify the component renders standalone (e.g. temporarily drop it into one page) before wiring it into the three headers.
- [x] 6.2 Wire `<AppLogo>` into `CodesPage.vue`'s `.brand`, `CalendarPage.vue`'s `.brand2`, and `SettingsPage.vue`'s `.brand`, each becoming a flex row (`display: flex; align-items: center; gap: 8px`) with a `.brand-logo` rule (`width/height: 22px; border-radius: 6px; flex-shrink: 0`) added to that file's own `<style scoped>` block (matching the existing per-file duplication of `.brand`'s own styling); verify all three headers show the logo immediately to the left of their existing text, at matching size or alignment isn't off. (A real bug surfaced here: the gradient's `id="app-logo-g"` collided across the three simultaneously-mounted tab instances — Ionic keeps every tab's page alive in the DOM — so `fill="url(#app-logo-g)"` resolved unpredictably and the Settings tab's logo silently rendered with no fill in light theme. Fixed with Vue 3.5's `useId()` to give each instance's gradient a unique id; see the note now in `AppLogo.vue` and design.md's Risks.)
- [x] 6.3 Verify in the browser (light and dark theme, and the Calendar tab's narrower header row alongside its nav arrows) that the logo doesn't wrap, overflow, or visually collide with adjacent header content on any of the three tabs. (Checked all three tabs in both themes after the `useId()` fix; logo renders correctly and consistently everywhere, no console errors, `pnpm run build`'s type-check passes.)

## 7. Tighter crop for favicon and header logo (maker feedback)

- [x] 7.1 Measure the glyph's actual rendered bounding box within `icon_full.svg`'s 108×108 viewBox (don't eyeball it — render in the browser at a known pixel size and read `getBoundingClientRect()`); verify the measured box is plausible (centered near the point the source's glyph rotates around).
- [x] 7.2 Choose a square, centered crop viewBox close to that measured box and preview it (at both a large size and the real ~22px usage size) before committing; verify visually that the glyph fills most of the square with a small, even margin and nothing is clipped.
- [x] 7.3 Apply the chosen viewBox (`23 23 62 62`) to `AppLogo.vue` and `apps/mobile/public/favicon.svg`; verify both still build/render (icon-source/icon_full.svg itself stays untouched — it's still the correct, full-safe-zone source for the Android launcher icon).
- [x] 7.4 Regenerate `apps/mobile/public/favicon.png` by cropping `ic_launcher-playstore.png` to the equivalent pixel box (not just resizing the old crop) before downscaling to 64×64; verify it visually matches the new SVG's framing, not the old padded one.
- [x] 7.5 Re-verify in the browser (all three tabs, light/dark theme, and `/favicon.svg` loaded directly) that the glyph now reads clearly at real size; verify `pnpm run build` still passes.
