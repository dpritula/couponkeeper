## Purpose

Defines the app's own icon identity on Android — replacing the placeholder, auto-generated Capacitor icon everywhere the OS can surface an app icon (launcher, app drawer, recents, notifications) with the designed CouponKeeper mark, plus the store-listing asset used to publish it.

## ADDED Requirements

### Requirement: Launcher icon identity
The app SHALL present the designed CouponKeeper adaptive icon — not a placeholder or auto-generated default — as its Android launcher icon, on the home screen, app drawer, and recents/task switcher, at every supported density.

#### Scenario: Icon shown on home screen and app drawer
- **WHEN** the app is installed on an Android device or emulator
- **THEN** its home-screen and app-drawer icon is the designed CouponKeeper mark (sage-green background, coupon/ticket glyph), not Android's default blank/generic adaptive-icon placeholder

#### Scenario: Icon shown in recents/task switcher
- **WHEN** the app is running and the user opens the Android recents (task switcher) view
- **THEN** the app's card shows the same designed CouponKeeper icon as its task icon

### Requirement: Themed (monochrome) icon support
On Android versions that support themed app icons (Android 13+, "Material You" icon theming), the app SHALL supply a monochrome icon layer depicting the same coupon/ticket glyph as the full-color icon, so that enabling themed icons re-colors the app's icon consistently with the rest of the device's icon set instead of falling back to a generic shape or a blank glyph.

#### Scenario: Themed icons enabled on a supported device
- **WHEN** a device running Android 13 or later has "Themed icons" enabled in its launcher settings
- **THEN** the app's home-screen icon renders as the device's themed color applied to the CouponKeeper coupon/ticket glyph, not a generic fallback shape

### Requirement: Notification icon identity
Every local notification the app schedules or delivers SHALL display the app's own dedicated small status-bar icon, not the operating system's generic fallback icon (e.g. a bell) and not the full-color launcher icon (Android requires status-bar icons to be a single-color silhouette).

#### Scenario: Expiry-warning notification icon
- **WHEN** the app delivers a coupon expiry-warning notification (single- or multi-coupon)
- **THEN** the notification's status-bar and notification-tray icon is the app's dedicated coupon-glyph small icon, not a generic system default icon

### Requirement: Store-listing icon asset
The app's repository SHALL include a dedicated, high-resolution (512x512 or larger) icon asset suitable for use as the Play Store listing icon, kept in sync with the launcher icon's design.

#### Scenario: Preparing a Play Store listing
- **WHEN** a maintainer prepares the app's Play Store listing
- **THEN** a ready-to-upload store-listing icon asset matching the app's launcher icon design is available in the repository, with no separate design work needed

### Requirement: Web favicon identity
The web build (browser tab, bookmarks) SHALL show the designed CouponKeeper mark as its favicon, not the stock Ionic/Capacitor placeholder icon.

#### Scenario: App open in a browser tab
- **WHEN** the app (dev server or a deployed web build) is open in a browser tab
- **THEN** the tab's favicon is the designed CouponKeeper mark, matching the app's launcher icon design, not the generic placeholder icon

### Requirement: In-app header logo mark
Each of the app's three tabs (Codes, Calendar, Settings) SHALL show a small logo mark, matching the app's icon design, to the left of that tab's header wordmark.

#### Scenario: Viewing any of the three tabs
- **WHEN** the user is on the Codes, Calendar, or Settings tab
- **THEN** that tab's fixed header shows the CouponKeeper logo mark immediately to the left of the header text, consistent across all three tabs
