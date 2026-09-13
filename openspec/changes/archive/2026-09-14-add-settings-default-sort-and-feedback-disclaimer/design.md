## Context

See [proposal.md](proposal.md) for motivation. Relevant current state:

- `stores/settings.ts` owns only `theme`, persisted directly to `localStorage` under `couponkeeper.theme` (no persistence plugin, per CLAUDE.md's Theming section).
- `stores/coupons.ts` owns `sortBy`/`sortDir` as its own state (`endDate`/`asc` default), changed via its `setSort` action, which also triggers a `load()`.
- `CalendarPage.vue` owns `dayListSortBy`/`dayListSortDir` as local `ref`s (`daysLeft`/`desc` default), changed via `onDayListSortChange`, which re-runs a local computed filter/sort (`filterDayListCoupons`/`sortDayListCoupons` from `utils/calendar.ts`) over already-fetched coupons — it does not re-query the DB the way Codes does.
- `CouponFilterToolbar.vue` defines the 11-entry `sortOptions` array (value/sortBy/sortDir/label) inline, used only for the `<select>` it renders itself.
- The Settings screen (`SettingsPage.vue`) has no state beyond the existing `theme` picker.

## Goals / Non-Goals

**Goals:**
- One shared, persisted `{ sortBy, sortDir }` value that Codes, Calendar's day list, and Settings all read from and write to, so a change from any of the three is visible in the other two the next time they're shown.
- Reuse the exact same sort-options list (fields, directions, labels) in the Settings select as the one already on the Codes/Calendar toolbar, from one definition.

**Non-Goals:**
- Persisting or syncing the channel/status/discount-type filters — those stay exactly as they are today (Codes: in `useCouponsStore`, ephemeral; Calendar: local `ref`s, ephemeral). Only the sort field/direction becomes shared.
- Changing `CouponFilterToolbar`'s own markup, styling, or emitted events — it keeps working identically from the outside; only where its options list is defined moves.
- A settings/preferences framework for future settings — this adds exactly one new persisted value, following the existing `theme` field's pattern, not a generalized mechanism.

## Decisions

**Extend `stores/settings.ts` with `sortBy`/`sortDir`, mirroring `theme`'s existing pattern.** Add `defaultSort: { sortBy: CouponSortField, sortDir: SortDirection }` state, seeded from `localStorage` (new key `couponkeeper.defaultSort`, JSON-encoded) falling back to `{ sortBy: 'daysLeft', sortDir: 'desc' }`, plus a `setDefaultSort(sortBy, sortDir)` action that updates state and `localStorage` together — the same shape as `setTheme`/`applyTheme`. This makes `stores/settings.ts` the single source of truth for the shared sort, consistent with it already being the home for the other cross-screen preference (theme). Alternative considered: a new dedicated `stores/sort.ts` — rejected as unnecessary indirection for one value that's conceptually a setting.

**`stores/coupons.ts` stops owning `sortBy`/`sortDir` as independent state; it reads/writes through the settings store.** Its `sortBy`/`sortDir` become getters delegating to `useSettingsStore().defaultSort`, and `setSort(sortBy, sortDir)` calls `useSettingsStore().setDefaultSort(sortBy, sortDir)` before `load()`. This keeps `queries/coupons.ts`'s call site (`listCoupons({ sortBy: this.sortBy, sortDir: this.sortDir, ... })`) unchanged. Alternative considered: keep `coupons.ts`'s own `sortBy`/`sortDir` and add a `$subscribe`/watcher to sync both directions with the settings store — rejected as more moving parts (two watchers, potential loop) for no benefit over one store being the plain owner.

**`CalendarPage.vue`'s `dayListSortBy`/`dayListSortDir` become computed pass-throughs to the same settings store, replacing the local `ref`s.** `onDayListSortChange` calls `useSettingsStore().setDefaultSort(...)` instead of assigning local refs; the existing `computed(() => sortDayListCoupons(filtered, dayListSortBy.value, dayListSortDir.value))` keeps working unchanged since it just reads whatever `dayListSortBy`/`dayListSortDir` resolve to. The channel/status/discount-type day-list refs are untouched (still local, per Non-Goals). This is the smallest change that satisfies "changing sort on Calendar updates Codes and Settings too," since Calendar already re-derives its filtered/sorted list reactively from these values.

**Extract `CouponFilterToolbar`'s `sortOptions` array into a new `utils/couponSort.ts`, exporting `getCouponSortOptions()`** (a function, not a bare constant, since each option's `label` calls `t()` and must be re-evaluated if the locale ever changes at runtime). Both `CouponFilterToolbar.vue` and `SettingsPage.vue` call it from their own `<script setup>` via `computed(() => getCouponSortOptions())`, each rendering it in their own `<select>` markup — no shared select component, since the two selects live in different visual contexts (inline toolbar chip vs. a Settings list item) and copying a `<select>` element is simpler than parameterizing a shared one for two call sites. `CouponRow`'s `status`/`discountType` option lists stay inline in `CouponFilterToolbar.vue` since Settings doesn't need them.

**Feedback disclaimer background: reuse the existing `--ck-sage-dim` token rather than adding a new one.** It's already defined for both palettes (`variables.css`) — a pale sage tint in light mode, a translucent sage overlay in dark mode — and is already used elsewhere as an "on-brand highlighted surface" (the selected-tab pill per CLAUDE.md's Design System section), so it reads as a deliberate accent rather than a new ad-hoc color. The disclaimer becomes a `<div>` styled like a small card (rounded corners, that background, ink-colored text) placed after `ion-list`, inside `ion-content`, with the `mailto:` link as a plain `<a>`.

**New i18n keys under `settings.*`** in `en.ts`: `settings.sortLabel` (the select's own label/row title) and `settings.feedback` (the disclaimer body, interpolating the email so the address itself isn't duplicated in every future locale's translation — e.g. `t('settings.feedback', { email: 'couponkeeper.email@gmail.com' })` with `{email}` wrapped in the `mailto:` anchor via `<i18n-t>`, matching vue-i18n's documented way to keep part of an interpolated string as a real HTML element rather than plain text). `settings.placeholder` is deleted.

## Risks / Trade-offs

- [Existing Codes users, if the app already shipped, get a silent sort-order change on next launch (endDate:asc → whatever the shared default resolves to, initially daysLeft:desc)] → Acceptable per proposal (flagged **BREAKING** there); the app has no shipped users yet (CLAUDE.md: Android build verified but git not yet initialized), so there is no real migration concern in practice.
- [Making `coupons.ts`'s `sortBy`/`sortDir` getters instead of plain state is a small API shape change for that store] → Contained entirely within the store's own file; no other file reads `couponsStore.sortBy`/`sortDir` directly today (only `CodesPage.vue` binds the toolbar's `sortBy`/`sortDir` props from the store, which works identically whether they're plain state or getters).

## Migration Plan

No data migration needed (client-only `localStorage`, no server). First read of the new `couponkeeper.defaultSort` key on an existing install simply misses and falls back to the `daysLeft`/`desc` factory default, same as any first-ever run.
