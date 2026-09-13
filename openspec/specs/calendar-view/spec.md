# calendar-view Specification

## Purpose

Gives makers a real, navigable month calendar over their actual coupons and channels, so they can see at a glance which days have active promo codes, jump to any month, and inspect what's running on a specific day.

## Requirements

### Requirement: Month navigation
The Calendar screen SHALL display a visible month (starting with the device's current month) with controls to move to the previous or next month. Activating either control SHALL immediately re-render the day grid for the newly visible month and update the displayed month/year label to match.

#### Scenario: Advancing to the next month
- **WHEN** the maker activates the "next month" control
- **THEN** the day grid re-renders for the following month and the label shows that month and year

#### Scenario: Returning to the previous month
- **WHEN** the maker activates the "previous month" control
- **THEN** the day grid re-renders for the preceding month and the label shows that month and year

### Requirement: Month/year picker
Activating the month/year label SHALL open a popup for choosing any year and month directly. Confirming a choice SHALL set the visible month to the chosen year/month, update the label and day grid accordingly, and close the popup. Dismissing the popup without choosing SHALL leave the visible month unchanged.

#### Scenario: Jumping to a specific month and year
- **WHEN** the maker opens the month/year picker and selects a year and month, distinct from the currently visible one
- **THEN** the popup closes, the label shows the selected month and year, and the day grid shows that month

#### Scenario: Dismissing the picker without a selection
- **WHEN** the maker opens the month/year picker and dismisses it without selecting a month/year
- **THEN** the visible month, label, and day grid remain unchanged

### Requirement: Day selection
Each day cell in the grid, including a dimmed leading or trailing day belonging to an adjacent month, SHALL be selectable. Selecting a day SHALL make it the selected date; selecting a leading/trailing day SHALL also move the visible month to that day's month.

#### Scenario: Selecting a day within the visible month
- **WHEN** the maker taps a day cell that belongs to the currently visible month
- **THEN** that day becomes the selected date and the coupon list below updates for it

#### Scenario: Selecting a dimmed day from an adjacent month
- **WHEN** the maker taps a dimmed day cell belonging to the previous or next month
- **THEN** the visible month changes to that day's month, the grid re-renders for it, and that day becomes the selected date

### Requirement: Default selected date
On first showing the Calendar screen, the selected date SHALL default to the device's actual current date, and the coupon list SHALL reflect coupons active on that date.

#### Scenario: Opening the Calendar screen for the first time
- **WHEN** the maker opens the Calendar screen
- **THEN** today's date is shown as selected and the coupon list below shows every coupon whose date range includes today

### Requirement: Selected-day visual indicator
The selected day's cell SHALL be visually distinguished by a solid black border, independent of whether that day is also the device's current date.

#### Scenario: A non-today day is selected
- **WHEN** the selected date is not the device's current date
- **THEN** the selected day's cell shows a solid black border

#### Scenario: Today is the selected day
- **WHEN** the selected date is the device's current date
- **THEN** the day's cell still visually communicates it is selected

### Requirement: Per-day channel indicator lines
Each day in the grid SHALL show, inset a small amount from the top of its cell, one thin horizontal line per distinct channel that has at least one coupon whose date range (start date through end date, inclusive) includes that day, colored with that channel's stored color. Lines SHALL be stacked vertically with a small gap between each, ordered the same way channels are ordered elsewhere in the app (the legend, the channel filter, the channel management list). Within a single calendar week (row) of the grid, every channel with at least one active coupon on any day of that week SHALL occupy the same stacking position on every day of that row — a day where that channel has no active coupon SHALL leave that position blank rather than the remaining channels' lines shifting to fill it. A day with no coupon active on it at all SHALL show no lines.

#### Scenario: A day has coupons from two different channels
- **WHEN** two coupons from different channels both have date ranges that include a given day
- **THEN** that day's cell shows one thin line per distinct channel involved, stacked near the top of the cell with a small gap between them, each in that channel's color

#### Scenario: A day has no active coupons
- **WHEN** no coupon's date range includes a given day
- **THEN** that day's cell shows no channel indicator lines

#### Scenario: A channel's coupon ends partway through a week
- **WHEN** a channel has an active coupon on some days of a calendar week but not on a later day within that same week, while a different channel has an active coupon spanning the whole week
- **THEN** the first channel's line is absent (leaving a blank position) on the day(s) it has no active coupon, and the second channel's line stays in the same stacking position on every day of that week, not shifting to fill the gap

#### Scenario: A channel active earlier in the week returns later in the same week
- **WHEN** a channel has an active coupon on the first day of a week, no active coupon on the second day, and an active coupon again on the third day of that same week
- **THEN** that channel's line occupies the same stacking position on the first and third days, and is blank (not present) on the second day

### Requirement: Channel legend reflects real channels
The legend below the grid SHALL list the maker's current set of channels (name and color), read live rather than a fixed set, matching the same channels used elsewhere in the app (the coupon list's channel filter, the coupon form's channel picker).

#### Scenario: Maker has added a custom channel
- **WHEN** the maker has created a channel beyond the built-in Own site / Etsy / Instagram set
- **THEN** that channel appears in the Calendar legend with its stored name and color

### Requirement: Selected-day coupon list
The list below the grid SHALL show every coupon whose date range (start date through end date, inclusive) includes the selected date, headed by a label naming the selected date. If no coupon's range includes the selected date, the list SHALL be empty.

#### Scenario: Selected date falls within a coupon's range
- **WHEN** the selected date is on or after a coupon's start date and on or before its end date
- **THEN** that coupon appears in the list below the grid

#### Scenario: Selected date falls outside every coupon's range
- **WHEN** no coupon's date range includes the selected date
- **THEN** the list below the grid shows no coupons

### Requirement: Default list order
The selected-day coupon list SHALL be ordered using the same shared, persisted default sort value used by the Codes list and the Settings screen (see the coupon-list-filtering capability), rather than a fixed value of its own. That shared default's initial factory value is days-left descending, so before it has ever been changed, coupons further from expiring lead and already-expired coupons fall to the end.

#### Scenario: Selected day has both soon-to-expire and long-running coupons
- **WHEN** the selected day's coupon list contains coupons with different amounts of time left before their end date, and the shared default sort has never been changed from its factory value
- **THEN** the list is ordered with more days remaining first and fewer days remaining (including already-expired coupons) last

#### Scenario: Shared default was changed elsewhere before Calendar is opened
- **WHEN** the maker previously changed the shared default sort — via the Codes list or the Settings screen — to "Alphabetical" ascending, and then opens the Calendar screen for a day whose list has never had its own sort changed
- **THEN** the selected-day list is ordered "Alphabetical" ascending, not days-left descending

### Requirement: Selected-day list filter and sort
The Calendar screen SHALL offer, below the selected-day heading, the same channel filter, multi-select status filter, multi-select discount-type filter, and sort control (field and direction) the Codes list offers. Changing any of these controls SHALL immediately update the selected-day list to match, without requiring any other action. The channel filter, status filter, and discount-type filter SHALL affect only the selected-day list — they SHALL NOT change which days show channel indicator lines on the month grid, nor which channels appear in the legend, both of which continue to reflect every coupon and channel regardless of this filter selection. The sort control is the shared, persisted default described in the coupon-list-filtering capability: changing it here SHALL also update the sort shown and applied on the Codes list and the Settings screen.

#### Scenario: Filtering the selected-day list by channel
- **WHEN** the maker selects a channel filter below the selected-day heading
- **THEN** the list shows only coupons on that channel whose date range includes the selected date
- **AND** the month grid's channel indicator lines and the legend remain unchanged

#### Scenario: Changing the selected-day list's sort
- **WHEN** the maker changes the sort field or direction below the selected-day heading
- **THEN** the selected-day list re-orders immediately to match
- **AND** the Codes list and the Settings screen subsequently show and apply that same sort as their default too

#### Scenario: Combining filters on the selected-day list
- **WHEN** the maker selects a channel filter together with one or more status or discount-type filter values
- **THEN** the selected-day list shows only coupons matching the selected channel (if any) and at least one selected status (if any) and at least one selected discount type (if any), same as the Codes list's combination rule

### Requirement: Read-only coupon cards on Calendar
Each coupon in the selected-day list SHALL be shown using the same card presentation used on the Codes list, without any delete affordance. Activating a card SHALL open the same read-only detail popup the Codes list uses, showing that coupon's full details.

#### Scenario: Viewing a coupon's card on Calendar
- **WHEN** a coupon appears in the Calendar's selected-day list
- **THEN** its card shows no delete control

#### Scenario: Opening a coupon's detail from Calendar
- **WHEN** the maker activates a coupon's card in the Calendar's selected-day list
- **THEN** a detail popup opens showing that coupon's full properties, with no delete action available
