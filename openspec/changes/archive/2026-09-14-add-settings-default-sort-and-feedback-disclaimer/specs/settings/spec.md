## Purpose

Gives makers a Settings screen that holds real, functioning app-wide preferences — a default coupon-list sort shared across the app, and how to reach the team with feedback — instead of static placeholder text.

## ADDED Requirements

### Requirement: Default sort setting
The Settings screen SHALL offer a "default sort" select using the same sort fields and directions available on the Codes and Calendar sort controls (start date, end date, expiring soon, alphabetical, times used, and days left; each selectable ascending or descending). Selecting a value SHALL update the shared, persisted default sort used across the Codes list and the Calendar screen's selected-day list.

#### Scenario: Changing the default sort from Settings
- **WHEN** the maker selects "Start Date" ascending in the Settings screen's default-sort control
- **THEN** the Codes list and the Calendar screen's selected-day list are both sorted "Start Date" ascending the next time they are shown

#### Scenario: Settings reflects a sort changed elsewhere
- **WHEN** the maker changes the sort on the Codes list or the Calendar screen
- **THEN** the Settings screen's default-sort control shows that same value the next time the Settings screen is shown

### Requirement: No static placeholder text
The Settings screen SHALL NOT show any static informational text that does not represent a real, functioning setting, control, or the feedback disclaimer.

#### Scenario: Opening Settings shows only real content
- **WHEN** the maker opens the Settings screen
- **THEN** every piece of text below the theme picker corresponds to an actual setting or control, or to the feedback disclaimer — no placeholder or "coming soon" text is shown

### Requirement: Feedback disclaimer
The Settings screen SHALL show a visually distinct disclaimer below its settings content, styled with a background appropriate to the active theme (light or dark), inviting feedback, suggestions, feature requests, and bug reports to be sent to couponkeeper.email@gmail.com. The email address SHALL be presented as a `mailto:` link.

#### Scenario: Viewing the feedback disclaimer
- **WHEN** the maker scrolls to the bottom of the Settings screen
- **THEN** a visually distinct disclaimer is shown inviting feedback to couponkeeper.email@gmail.com as a mailto link

#### Scenario: Disclaimer adapts to the dark theme
- **WHEN** the active theme is dark
- **THEN** the disclaimer's background and text remain legible and visually distinct from the surrounding content, matching the dark palette
