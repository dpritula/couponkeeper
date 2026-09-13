## ADDED Requirements

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
