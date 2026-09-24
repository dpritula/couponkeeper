## MODIFIED Requirements

### Requirement: Per-day channel indicator lines
Each day in the grid SHALL show, inset a small amount from the top of its cell, one thin horizontal line per distinct channel that (a) is currently shown by the channel visibility filter below the grid, and (b) has at least one coupon whose date range (start date through end date, inclusive) includes that day, colored with that channel's stored color. Lines SHALL be stacked vertically with a small gap between each, ordered the same way channels are ordered elsewhere in the app (the channel filter, the channel management list). Within a single calendar week (row) of the grid, every currently-shown channel with at least one active coupon on any day of that week SHALL occupy the same stacking position on every day of that row — a day where that channel has no active coupon SHALL leave that position blank rather than the remaining channels' lines shifting to fill it. A channel not currently shown by the filter SHALL be excluded entirely from a week's stacking order (not merely left blank), so shown channels' lines shift to fill the position it would otherwise have reserved. A day with no coupon active on it at all, or whose only active coupons belong to channels not currently shown, SHALL show no lines. Changing the channel visibility filter SHALL immediately re-render every affected day's lines, without requiring any other action.

#### Scenario: A day has coupons from two different channels
- **WHEN** two coupons from different channels, both currently shown by the filter, have date ranges that include a given day
- **THEN** that day's cell shows one thin line per distinct channel involved, stacked near the top of the cell with a small gap between them, each in that channel's color

#### Scenario: A day has no active coupons
- **WHEN** no coupon's date range includes a given day
- **THEN** that day's cell shows no channel indicator lines

#### Scenario: A channel's coupon ends partway through a week
- **WHEN** a channel has an active coupon on some days of a calendar week but not on a later day within that same week, while a different channel has an active coupon spanning the whole week, and both channels are currently shown by the filter
- **THEN** the first channel's line is absent (leaving a blank position) on the day(s) it has no active coupon, and the second channel's line stays in the same stacking position on every day of that week, not shifting to fill the gap

#### Scenario: A channel active earlier in the week returns later in the same week
- **WHEN** a channel, currently shown by the filter, has an active coupon on the first day of a week, no active coupon on the second day, and an active coupon again on the third day of that same week
- **THEN** that channel's line occupies the same stacking position on the first and third days, and is blank (not present) on the second day

#### Scenario: Selecting a single channel narrows the grid to it
- **WHEN** the maker selects one channel in the channel visibility filter below the grid, out of several with active coupons within the visible month
- **THEN** only that channel's lines remain on the grid; every other channel's lines disappear from every day
- **AND** the selected channel's lines shift to fill the stacking positions the other channels' lines occupied within any shared week

#### Scenario: Returning to "All"
- **WHEN** the maker activates "All" after having one or more specific channels selected
- **THEN** every channel's lines reappear on the days their coupons are active, immediately, without any other action

### Requirement: Selected-day list filter and sort
The Calendar screen SHALL offer, below the selected-day heading, a multi-select status filter, a multi-select discount-type filter, and a sort control (field and direction) — the same three controls the Codes list offers, minus its channel filter, which for Calendar lives instead in the channel visibility filter below the grid (see that requirement). Changing any of these controls, or the channel visibility filter above, SHALL immediately update the selected-day list to match, without requiring any other action. The channel visibility filter SHALL affect both the selected-day list and the month grid's channel indicator lines, unlike the status and discount-type filters below the heading, which SHALL affect only the selected-day list. The sort control is the shared, persisted default described in the coupon-list-filtering capability: changing it here SHALL also update the sort shown and applied on the Codes list and the Settings screen.

#### Scenario: Filtering the selected-day list by channel
- **WHEN** the maker selects one specific channel using the channel visibility filter below the grid
- **THEN** the selected-day list shows only coupons on that channel
- **AND** the month grid's channel indicator lines for every other channel also disappear

#### Scenario: Changing the selected-day list's sort
- **WHEN** the maker changes the sort field or direction below the selected-day heading
- **THEN** the selected-day list re-orders immediately to match
- **AND** the Codes list and the Settings screen subsequently show and apply that same sort as their default too

#### Scenario: Combining filters on the selected-day list
- **WHEN** the maker has one or more specific channels selected in the channel visibility filter, together with one or more selected status or discount-type filter values below the heading
- **THEN** the selected-day list shows only coupons on a currently-shown channel and matching at least one selected status (if any) and at least one selected discount type (if any), same as the Codes list's combination rule

## ADDED Requirements

### Requirement: Channel visibility filter
Below the month grid, in the position the read-only channel legend previously occupied, the Calendar screen SHALL offer an interactive, multi-select channel filter: one toggle control per channel in the maker's current channel list (showing that channel's name and color), each independently selectable, plus an "All" control. This filter SHALL determine both which channels' indicator lines appear on the month grid (see "Per-day channel indicator lines") and which coupons appear in the selected-day list below (see "Selected-day list filter and sort") — it is the same filter driving both, not two independent ones.

"All" and the per-channel controls behave as a single filter with two ways to view it, not two independent switches: "All" SHALL be shown as active whenever no specific channel is currently selected, in which case every channel's lines and coupons SHALL be shown. Selecting any specific channel SHALL immediately make "All" no longer shown as active, and SHALL restrict the grid and the selected-day list to only the currently-selected channel(s). Selecting an additional channel while one or more are already selected SHALL add it to what's shown, without removing the others — unless doing so selects every channel that currently exists, in which case the filter SHALL behave exactly as if "All" had been activated directly (see below), rather than leaving every channel individually shown as selected. Deselecting a specific channel SHALL remove it from what's shown; if it was the only one selected, every channel SHALL be shown again and "All" SHALL be shown as active again. Activating "All" directly SHALL clear any specific selection at once, making every specific channel control no longer shown as active and showing every channel's lines and coupons.

#### Scenario: Opening the Calendar screen for the first time
- **WHEN** the maker opens the Calendar screen
- **THEN** "All" is shown as active, no specific channel control is, and the grid and selected-day list reflect every channel

#### Scenario: Selecting a single channel
- **WHEN** the maker selects one channel's control while "All" is active
- **THEN** "All" is no longer shown as active
- **AND** only that channel's control is shown as active
- **AND** the grid and the selected-day list show only that channel's lines and coupons

#### Scenario: Selecting an additional channel
- **WHEN** the maker selects a second channel's control while a first channel is already selected
- **THEN** both channels' controls are shown as active
- **AND** the grid and the selected-day list show both channels' lines and coupons, with every other channel still excluded

#### Scenario: Deselecting the only selected channel
- **WHEN** the maker deselects a channel's control that is the only one currently selected
- **THEN** "All" becomes shown as active again
- **AND** the grid and the selected-day list show every channel's lines and coupons again

#### Scenario: Activating "All" while specific channels are selected
- **WHEN** the maker activates "All" while one or more specific channels are currently selected
- **THEN** every specific channel control is no longer shown as active
- **AND** the grid and the selected-day list show every channel's lines and coupons

#### Scenario: Maker has added a custom channel
- **WHEN** the maker has created a channel beyond the built-in Own site / Etsy / Instagram set
- **THEN** that channel appears as its own control in this filter, with its stored name and color

#### Scenario: Selecting every channel individually collapses to "All"
- **WHEN** the maker selects each of the maker's channels one at a time, until every one of them is selected
- **THEN** "All" becomes shown as active and every specific channel control becomes shown as not active, the same as if the maker had activated "All" directly
- **AND** the grid and the selected-day list show every channel's lines and coupons, unchanged from what they already showed with every channel individually selected

## REMOVED Requirements

### Requirement: Channel legend reflects real channels
**Reason**: Replaced by the "Channel visibility filter" requirement, which occupies the same position below the grid but is interactive (a multi-select filter with an "All" shortcut) rather than a read-only list, and now also governs which channels' lines the grid shows.
**Migration**: No data migration needed. The read-only legend markup is replaced by the new filter chips; the channel data it reads (name, color, live channel list) is unchanged.
