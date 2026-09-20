# CouponKeeper

A mobile app for makers and independent sellers — creators running their own storefronts, Etsy shops, or Instagram-driven sales — to manage promo codes without losing track of them across channels.

## The problem

A maker running promotions across several sales channels (their own site, Etsy, Instagram) ends up with promo codes scattered across notes apps, spreadsheets, and memory: which codes are still active, which are about to expire, which have hit their usage limit, and which channel each one belongs to. CouponKeeper centralizes that: creation, status tracking (active / not started / expiring soon / expired), usage limits, channel association, and a calendar view of code validity — as a local-first, offline-capable app with no account or backend required to use it.

## Tech stack

- **Ionic Framework (Vue) + Vue 3** (Composition API, `<script setup lang="ts">`) for the UI layer and navigation.
- **Capacitor** as the native wrapper. Target platform is **Android** for now; iOS is deferred until Mac/CI access is available (Xcode cannot run on this project's Windows dev environment).
- **TypeScript** throughout, including the store and data layer.
- **Vite** as the build tool.
- **Pinia** for state, one store per domain (`settings`, `coupons`, `channels`) rather than a single shared store.
- **vue-i18n** for localization — every user-facing string goes through `t()`; `en` is the only locale so far.
- **Vue Router** + `IonRouterOutlet` for tab navigation only (Codes / Calendar / Settings). Coupon creation and detail viewing are popups, not routes.
- **pnpm workspaces** as the monorepo manager.
- **Drizzle ORM** (via the `sqlite-proxy` driver) over **`@capacitor-community/sqlite`** for on-device storage, with a `jeep-sqlite`/sql.js web fallback for browser-based development.

## Architecture

The app is **local-first**: on launch it works entirely offline as an on-device promo-code store, with no backend required. Cloud backup and cross-device sync are deliberately deferred, but the repository is structured so a sync backend can be added later without a restructure — `apps/api` exists as a placeholder for a future Prisma-based service, once real sync is needed.

Data model, in brief: a **coupon** (promo code) has a code, discount type and value, a validity window (start/end date), an optional usage limit, and a status derived from those dates rather than trusted from storage (`notStarted` / `active` / `soon` / `expired`). A coupon can belong to multiple **channels** — user-managed entities (name + color), not a fixed enum — via a many-to-many join table. Status derivation, the schema, and the query layer live under `apps/mobile/src/db/`.

Two screens beyond the coupon list round out the app:
- **Calendar** — a real monthly grid with per-day, per-channel indicator lines, month/year navigation, and a filterable/sortable list of coupons active on the selected day.
- **Settings** — theme (light/dark/system), a default sort order shared across Codes and Calendar, and a feedback contact link.

All overlays (coupon creation, coupon detail, delete confirmation, channel management, month/year picker) are custom-styled popups sharing one structural pattern, not `ion-alert`/`ion-modal`, teleported to `<body>` to avoid Ionic's page-transition transform quirks affecting `position: fixed` content.

The full architectural record — data flow, native-vs-web SQLite divergences, and the concrete bugs that shaped specific decisions (migration statement-splitting on Android, connection singletons, the `outline`-vs-`border` day-cell fix, and others) — is maintained in [`CLAUDE.md`](CLAUDE.md), which serves as this project's living engineering log as much as its AI-assistant briefing.

## Repository structure

```
couponkeeper/
├─ apps/
│  ├─ mobile/        # Ionic + Vue 3 + Capacitor app — where development happens
│  │  ├─ android/    # Native Android project, committed to git
│  │  └─ src/
│  │     ├─ views/       # CodesPage, CalendarPage, SettingsPage, TabsPage
│  │     ├─ components/  # Shared UI: CodeCard, CouponFormModal, CouponDetailModal, etc.
│  │     ├─ stores/      # Pinia: settings, coupons, channels
│  │     ├─ db/          # Drizzle schema, client, migrations, seed data
│  │     ├─ utils/       # Pure logic: calendar grid, date formatting, sort options
│  │     └─ i18n/        # vue-i18n setup and locale files
│  └─ api/           # Placeholder for a future sync backend (Prisma) — not yet implemented
├─ openspec/         # Spec-driven development data: specs, change proposals, archive
└─ pnpm-workspace.yaml
```

## Getting started

```bash
pnpm install                          # install workspace dependencies
pnpm --filter mobile run dev          # start the Vite dev server (browser preview)
pnpm --filter mobile run build        # type-check and produce a production web build
pnpm --filter mobile run db:generate  # regenerate the SQL migration after editing schema.ts
```

Android build:

```bash
cd apps/mobile
npx cap sync android
cd android && ./gradlew.bat assembleDebug
```

The latest debug APK is committed at `apps/mobile/releases/app-debug.apk` for handing out builds without requiring a local Gradle/JDK/SDK setup. See [`CLAUDE.md`](CLAUDE.md) for Windows-specific JDK configuration and emulator setup.

## Development process: spec-driven with OpenSpec

Feature work goes through **[OpenSpec](https://github.com/Fission-AI/OpenSpec)**, a spec-driven development workflow: a change is proposed and designed (`proposal.md`, `design.md`, delta specs, `tasks.md`) *before* code is written, implemented against that plan, then archived — folding its spec deltas into the canonical specs under `openspec/specs/`. This keeps a durable, reviewable record of *why* a feature looks the way it does, separate from the commit history's *what changed*.

A convention specific to this project: when a shipped feature receives further rounds of feedback, the change's planning artifacts are updated to match the feature's actual current behavior — rather than left to drift from what was originally proposed. Specs describe the product as it behaves today, not as it was first designed.

Not every change goes through OpenSpec — small, purely mechanical fixes (a color token swap, a layout tweak) are made directly and noted as such, keeping the workflow reserved for changes that affect actual product behavior.

## Status

The Codes list, coupon creation/detail/deletion, channel management, and the Calendar month view are all live screens backed by a real on-device SQLite database — no screen still reads mock data. Settings covers theming, a shared default sort order, and a feedback link. Android has a verified, buildable debug APK; iOS is not yet targeted. See [`CLAUDE.md`](CLAUDE.md) for the detailed, up-to-date project history and open questions.

## License

Not yet decided.
