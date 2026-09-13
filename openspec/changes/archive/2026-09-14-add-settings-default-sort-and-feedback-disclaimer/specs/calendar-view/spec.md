## MODIFIED Requirements

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
