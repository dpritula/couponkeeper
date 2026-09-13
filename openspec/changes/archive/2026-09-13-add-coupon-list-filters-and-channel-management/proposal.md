## Why

The Codes list currently filters by a single, hardcoded 3-channel enum (site/etsy/instagram baked into TypeScript, CSS, and i18n) and always sorts by end date ascending — makers can't add their own sales channels, and can't slice or order the list the way they actually work (by status, discount type, usage, alphabetically, or a "what's expiring soon" view that isn't drowned out by already-expired codes). This proposal turns channels into a user-managed, database-backed list and adds a full sort/filter toolbar to the Codes list.

## What Changes

- **BREAKING**: `Channel` stops being a fixed TypeScript union (`'site' | 'etsy' | 'instagram'`) and becomes a dynamic, database-backed entity (`key`, `name`, `color`) everywhere it's rendered — `CodeCard`'s channel dot/label, `CodesPage`'s filter chips, and `CouponFormModal`'s channel picker all read the live `channels` table instead of a hardcoded array plus `channels.<key>` i18n strings. Channel display names become free-text data (like `note`/`code` already are), not translated copy.
- Add a "manage channels" popup, opened via a new "+" button placed next to the channel filter chips (distinct from the existing FAB that creates a coupon), using the same Teleport-to-body bottom-sheet pattern as the app's other three overlays:
  - Top half: vertically scrolling list of existing channels, styled like the channel picker in the coupon form, each with a small delete affordance.
  - Bottom half: a form to add a new channel — name plus a user-chosen color (color picker) — with a Save button that refreshes the channel list shown above it.
  - Deleting a channel asks for confirmation first (reusing `ConfirmDialog`), then removes the channel and its `coupon_channels` join rows only (the coupons themselves are not deleted). This refreshes both the popup's own channel list and the coupon list behind it.
  - Adding/deleting a channel does not include renaming or recoloring an existing channel — only add and delete are in scope for this popup.
- Add a sort + filter toolbar to the Codes list header, below the (already horizontally-scrollable) channel filter chips:
  - A sort dropdown with: Start Date, End Date, Expiring Soon, Alphabetical, Times Used, and Days Left — each available ASC/DESC. "Expiring Soon" is a distinct sort from plain "End Date": it orders active/expiring coupons first by end date, with expired coupons sorted last, so an already-expired code doesn't outrank a code that's actually about to expire.
  - A Status filter (Active / Expiring / Expired) and a Discount Type filter (Percent / Amount / Shipping), both multi-select (OR within each filter).
  - All of the above combine with the existing channel filter (AND across the channel filter, the status filter, and the discount-type filter) and re-run the list query reactively as soon as any control changes.
- Extend `listCoupons`'s filter to accept multiple statuses and multiple discount types (currently single-value), and add the two new sort behaviors (`expiringSoon` as a compound status-then-date order, `daysLeft` as a sort field) alongside the existing sort fields.

## Capabilities

### New Capabilities
- `coupon-channels`: user-managed sales channels — creating, listing, and deleting channels (with cascading removal of their coupon associations only, not the coupons), and channels as a dynamic entity (not a hardcoded enum) consumed everywhere a channel is displayed or picked.
- `coupon-list-filtering`: sorting and filtering the Codes list — by date fields, alphabetically, by usage count, by days left, by status, and by discount type — combined with the existing channel filter.

### Modified Capabilities
(none — no specs exist yet; this is the first proposed change in this project)

## Impact

- `apps/mobile/src/data/promoCode.ts`: `Channel` changes from a union type to a DB-shaped reference; `PromoCode` needs a way to carry resolved channel name/color instead of just a union key.
- `apps/mobile/src/db/schema.ts` / `queries/channels.ts`: add `deleteChannel` (and its cascading `coupon_channels` cleanup); `queries/coupons.ts`'s `CouponListFilter` gains array-valued `status`/`discountType`, and `CouponSortField`/sort logic gains `expiringSoon` and `daysLeft`.
- `apps/mobile/src/stores/coupons.ts`: `activeFilter` (today a single channel-or-'all') becomes a richer filter/sort state (channel + statuses[] + discountTypes[] + sortBy/sortDir).
- A new channels store (or extension of an existing one) backs both the manage-channels popup and every channel picker/list in the app.
- `apps/mobile/src/components/`: a new manage-channels overlay component (Teleport-to-body pattern, per CLAUDE.md); updates to `CodeCard.vue`, `CouponFormModal.vue`, and `CodesPage.vue` to consume dynamic channels and the new toolbar.
- `apps/mobile/src/i18n/locales/en.ts`: drop `channels.<key>` translation lookups for channel names (they become DB data); add strings for the manage-channels popup and the sort/filter toolbar.
- `CalendarPage.vue` (still on the hardcoded `mockPromoCodes` array per CLAUDE.md) is explicitly out of scope and untouched by this change.
