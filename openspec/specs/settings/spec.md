# settings Specification

## Purpose

Gives makers a Settings screen that holds real, functioning app-wide preferences — a default coupon-list sort shared across the app, and how to reach the team with feedback — instead of static placeholder text.

## Requirements

### Requirement: Default sort setting
The Settings screen SHALL offer a "default sort" select using the same sort fields and directions available on the Codes and Calendar sort controls (start date, end date, expiring soon, alphabetical, times used, and days left; each selectable ascending or descending). Selecting a value SHALL update the shared, persisted default sort used across the Codes list and the Calendar screen's selected-day list.

#### Scenario: Changing the default sort from Settings
- **WHEN** the maker selects "Start Date" ascending in the Settings screen's default-sort control
- **THEN** the Codes list and the Calendar screen's selected-day list are both sorted "Start Date" ascending the next time they are shown

#### Scenario: Settings reflects a sort changed elsewhere
- **WHEN** the maker changes the sort on the Codes list or the Calendar screen
- **THEN** the Settings screen's default-sort control shows that same value the next time the Settings screen is shown

### Requirement: Expiry warning threshold setting
The Settings screen SHALL offer a "warn about coupon expiry" integer stepper control (increment/decrement), factory-defaulting to `2`. The value SHALL be constrained to the inclusive range `0`–`20`; whenever the stored or entered value falls outside that range, it SHALL be reset to the default `2`. Changing this value SHALL update the shared, persisted threshold used by the coupon expiry-notification subsystem.

#### Scenario: Default value on first use
- **WHEN** the maker opens Settings for the first time, with nothing previously saved
- **THEN** the "warn about coupon expiry" control shows `2`

#### Scenario: Incrementing and decrementing within range
- **WHEN** the maker uses the control's increment or decrement action while the value is within `0`–`20`
- **THEN** the value changes by one and is persisted

#### Scenario: Value pushed below the minimum
- **WHEN** the value would go below `0`
- **THEN** the value is reset to the default `2` instead

#### Scenario: Value pushed above the maximum
- **WHEN** the value would go above `20`
- **THEN** the value is reset to the default `2` instead

#### Scenario: Changing the threshold updates scheduled notifications
- **WHEN** the maker changes the "warn about coupon expiry" value to a new, valid number
- **THEN** the new value is used the next time expiry-warning notifications are recalculated

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
