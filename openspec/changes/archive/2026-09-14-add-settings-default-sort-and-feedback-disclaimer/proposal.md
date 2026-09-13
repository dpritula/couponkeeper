## Why

The Settings screen is still the mockup's dev placeholder (a theme picker plus a static "more settings are coming later" note) — the only screen that hasn't grown real functionality. Meanwhile Codes and Calendar each reset to their own hardcoded sort every time they're opened, with no way for a maker to make their preferred ordering (e.g. "days left, most urgent last") stick across the app or across sessions.

## What Changes

- Remove the static placeholder text below the theme picker on the Settings screen.
- Add a "default sort" setting on the Settings screen: a select using the exact same sort options (fields × directions) as the sort control already on Codes/Calendar, extracted into one shared list so both places stay in sync automatically as sort fields are added or renamed.
- This default sort becomes a single, persisted, app-wide value: Codes and Calendar both load their coupon list using it, replacing their current independent hardcoded defaults (Codes: end date ascending; Calendar's selected-day list: days left descending). **BREAKING** for Codes specifically, since its initial sort order changes from end date ascending to whatever the (initially days-left-descending) shared default is.
- The shared default's initial factory value is days-left descending — unchanged for Calendar, new for Codes.
- Changing the sort **anywhere** — the new Settings select, Codes' own sort control, or Calendar's own sort control — updates this one shared, persisted value, so all three places immediately reflect the same current sort and it survives an app restart. This extends Calendar's existing sort control, which previously affected only its own selected-day list.
- Add a short, visually distinct disclaimer below the Settings content, on a background that adapts to the active theme, inviting feedback/suggestions/feature requests/bug reports to couponkeeper.email@gmail.com via a `mailto:` link. Localized text like every other UI string (only `en` exists today).

## Capabilities

### New Capabilities
- `settings`: the Settings screen's own behavior — the default-sort control and the feedback disclaimer (the theme picker itself is out of scope; it's pre-existing and unchanged).

### Modified Capabilities
- `coupon-list-filtering`: the coupon list's current sort selection is no longer local/ephemeral — it is a single value shared with Calendar's selected-day list and the Settings screen, persisted across app restarts, and initialized from that persisted value instead of a fixed default.
- `calendar-view`: requirement on the selected-day list's default sort now sources that default from the same shared, persisted value (initially still days-left descending) instead of a fixed value; requirement that the day-list's own filter/sort controls affect only that list no longer holds for the sort control specifically, since changing it there now also updates the shared default used elsewhere.

## Impact

- `apps/mobile/src/stores/settings.ts` — new persisted `defaultSort` state (`sortBy`/`sortDir`) and an action to change it, alongside the existing `theme` state.
- `apps/mobile/src/stores/coupons.ts` — `sortBy`/`sortDir` sourced from and kept in sync with the settings store instead of owning independent defaults.
- `apps/mobile/src/views/CalendarPage.vue` — day-list sort refs sourced from and kept in sync with the settings store instead of a local-only default.
- `apps/mobile/src/components/CouponFilterToolbar.vue` — sort options list extracted to a shared module so the Settings select can reuse it verbatim.
- `apps/mobile/src/views/SettingsPage.vue` — remove the placeholder paragraph; add the sort select and the disclaimer.
- `apps/mobile/src/i18n/locales/en.ts` — new keys for the sort setting's label and the disclaimer copy; placeholder key removed.
- `openspec/specs/coupon-list-filtering/spec.md`, `openspec/specs/calendar-view/spec.md` — delta updates for the shared/persisted default sort.
- New `openspec/specs/settings/spec.md`.
