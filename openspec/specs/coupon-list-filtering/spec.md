# coupon-list-filtering Specification

## Purpose

Lets makers sort and filter the coupon list by date, alphabetical order, usage, days left, status, and discount type, in combination with the existing channel filter, so a growing list of coupons stays easy to scan.

## Requirements

### Requirement: Coupon list can be sorted by multiple fields
The coupon list SHALL offer a sort control with the following fields, each selectable in ascending or descending direction: start date, end date, expiring soon, alphabetical (by code), times used, and days left. Changing the sort field or direction SHALL re-order the currently visible list immediately, without requiring any other action.

#### Scenario: Sorting by a date field
- **WHEN** the user selects "Start Date" or "End Date" with a direction
- **THEN** the list is ordered by that date field in the chosen direction

#### Scenario: Sorting alphabetically
- **WHEN** the user selects the alphabetical sort with a direction
- **THEN** the list is ordered by coupon code in the chosen direction

#### Scenario: Sorting by times used
- **WHEN** the user selects "Times Used" with a direction
- **THEN** the list is ordered by usage count in the chosen direction

#### Scenario: Sorting by days left
- **WHEN** the user selects "Days Left" with a direction
- **THEN** every coupon is ordered by the number of days between today and its end date (a negative number for coupons that have already ended) in the chosen direction, regardless of the coupon's status label

### Requirement: "Expiring Soon" sort prioritizes non-expired coupons
The "Expiring Soon" sort SHALL order all non-expired coupons (active or expiring) before all expired coupons, regardless of direction. Within each of those two groups, coupons SHALL be ordered by end date in the chosen direction.

#### Scenario: Expiring Soon ascending
- **WHEN** the user selects "Expiring Soon" ascending
- **THEN** non-expired coupons appear first, ordered by soonest end date first, followed by expired coupons ordered by soonest (least-past) end date first

#### Scenario: Expiring Soon descending
- **WHEN** the user selects "Expiring Soon" descending
- **THEN** non-expired coupons appear first, ordered by furthest end date first, followed by expired coupons ordered by furthest (most-past) end date first

#### Scenario: An expiring coupon outranks an expired one
- **WHEN** the list contains both an expired coupon and a non-expired coupon whose end date is earlier than the expired coupon's end date
- **THEN** under "Expiring Soon" sort (either direction) the non-expired coupon is still listed before the expired one

### Requirement: Coupon list can be filtered by status
The coupon list SHALL offer a status filter with the values Not Started, Active, Expiring, and Expired, allowing more than one value to be selected at once. A coupon SHALL be shown if its status matches any of the selected values. When no status value is selected, coupons of every status SHALL be shown.

#### Scenario: Filtering by a single status
- **WHEN** the user selects only "Expiring"
- **THEN** only coupons with expiring status are shown

#### Scenario: Filtering by multiple statuses
- **WHEN** the user selects both "Active" and "Expiring"
- **THEN** coupons with either status are shown, and expired coupons are hidden

#### Scenario: Filtering by "Not Started"
- **WHEN** the user selects only "Not Started"
- **THEN** only coupons whose start date is after today are shown

#### Scenario: No status selected shows every status
- **WHEN** no status value is selected
- **THEN** coupons of all statuses, including "Not Started," are shown, subject to any other active filters

### Requirement: Coupon list can be filtered by discount type
The coupon list SHALL offer a discount-type filter with the values Percent, Amount, and Shipping, allowing more than one value to be selected at once. A coupon SHALL be shown if its discount type matches any of the selected values. When no discount-type value is selected, coupons of every discount type SHALL be shown.

#### Scenario: Filtering by a single discount type
- **WHEN** the user selects only "Percent"
- **THEN** only percent-discount coupons are shown

#### Scenario: Filtering by multiple discount types
- **WHEN** the user selects both "Percent" and "Amount"
- **THEN** coupons with either discount type are shown, and shipping-discount coupons are hidden

### Requirement: Sort, status filter, discount-type filter, and channel filter combine
The channel filter, the status filter, the discount-type filter, and the selected sort SHALL all apply together: the visible list SHALL contain only coupons matching the selected channel (if any) AND matching at least one selected status (if any are selected) AND matching at least one selected discount type (if any are selected), ordered by the selected sort. Changing any one of these controls SHALL immediately update the visible list without requiring the others to be reset.

#### Scenario: Combining a channel filter with a status filter
- **WHEN** the user has an "Etsy" channel filter active and also selects the "Expiring" status
- **THEN** only Etsy coupons with expiring status are shown

#### Scenario: Changing the sort while filters are active
- **WHEN** filters are active and the user changes the sort field or direction
- **THEN** the same filtered set of coupons is shown, re-ordered according to the new sort

#### Scenario: No coupons match the combined filters
- **WHEN** the combination of active filters matches no coupons
- **THEN** the list shows an empty-state message instead of a blank area

### Requirement: Toolbar reflects the currently active sort and filters
The sort control and both filter controls SHALL visually indicate their current selection (the active sort field/direction, and which status and discount-type values are selected).

#### Scenario: Active filter values are visually distinguished
- **WHEN** one or more status or discount-type values are selected
- **THEN** those selected values are visually distinguished from unselected ones in the toolbar

### Requirement: Coupon list's sort persists and is shared with Settings and Calendar
The coupon list's currently selected sort field and direction SHALL be a single value shared with the Settings screen's default-sort setting and the Calendar screen's selected-day list, persisted so it survives an app restart. On opening the Codes list, the sort control SHALL show and apply this shared value rather than resetting to a fixed default. Changing the sort field or direction on the Codes list SHALL update this shared value, so the Settings screen and the Calendar screen's selected-day list subsequently show and apply the new value as well.

#### Scenario: Codes list opens with the previously used sort
- **WHEN** the maker last set the sort to "Alphabetical" ascending — whether on the Codes list, the Calendar screen, or the Settings screen — and later reopens the Codes list, including after restarting the app
- **THEN** the Codes list is sorted "Alphabetical" ascending, not reset to any fixed default

#### Scenario: Changing sort on the Codes list updates the shared default
- **WHEN** the maker changes the Codes list's sort control to "Times Used" descending
- **THEN** the Settings screen's default-sort setting and the Calendar screen's selected-day list both reflect "Times Used" descending the next time they are shown

#### Scenario: Shared default's initial value before it has ever been changed
- **WHEN** the maker opens the Codes list for the first time, having never changed the sort on the Codes list, the Calendar screen, or the Settings screen
- **THEN** the Codes list is sorted "Days Left" descending
