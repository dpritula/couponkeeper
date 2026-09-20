# coupon-editing Specification

## Purpose

Lets a maker correct or update an existing coupon — its code, channel, discount type, value, dates, usage limit, or note — through the same form used to create one, with validation that catches bad input before it's saved and explains exactly what's wrong.

## Requirements

### Requirement: Edit entry point on the coupon detail popup
The coupon detail popup SHALL show a visually distinct edit control in its header, on every screen that opens it (the Codes list and the Calendar screen's selected-day list). Activating it SHALL replace the detail view with the coupon form, in edit mode, for that same coupon.

#### Scenario: Opening edit from Codes
- **WHEN** the maker opens a coupon's detail popup from the Codes list and activates the edit control
- **THEN** the detail view is replaced by the coupon form, pre-filled with that coupon's data

#### Scenario: Opening edit from Calendar
- **WHEN** the maker opens a coupon's detail popup from the Calendar screen's selected-day list and activates the edit control
- **THEN** the detail view is replaced by the coupon form, pre-filled with that coupon's data, the same as from Codes

### Requirement: Edit mode reuses the creation form, pre-filled
Editing SHALL use the same form component used to create a new coupon, not a separate form. When opened in edit mode, every field SHALL be pre-filled with the coupon's current values: code, channel, discount type, value, start date, end date, usage limit (if set), and note (if set). If the coupon's only channel was previously deleted, the channel field SHALL open with no channel selected rather than a stale or invalid one.

#### Scenario: Fields match the coupon being edited
- **WHEN** the maker opens edit mode for a coupon
- **THEN** every form field shows that coupon's current value, exactly as it would appear in its detail view

#### Scenario: Editing a coupon whose channel was deleted
- **WHEN** the maker opens edit mode for a coupon whose only associated channel no longer exists
- **THEN** the channel field opens with no channel selected, and the maker must choose one before the edit can be saved

### Requirement: Saving an edit updates the coupon in place
Saving the form in edit mode SHALL update the existing coupon's data rather than creating a new coupon, including when the code itself is changed. Fields not present on the form — usage count and status — SHALL be unaffected by an edit: usage count SHALL be left exactly as it was, and status SHALL continue to be derived from the (possibly new) dates rather than set directly.

#### Scenario: Changing a coupon's code
- **WHEN** the maker edits a coupon and changes its code to a new value, then saves
- **THEN** the same coupon now has the new code, its usage count is unchanged, and no additional coupon is created

#### Scenario: Editing dates updates derived status
- **WHEN** the maker edits a coupon's start or end date such that its status would now be different (for example, extending an expired coupon's end date into the future)
- **THEN** the saved coupon's status reflects the new dates, the same as it would for a coupon with those dates created fresh

### Requirement: Required fields must be non-empty to save
The form SHALL require non-empty values for code, channel, discount type, value ("Amount"), start date, and end date, in both create and edit mode. The coupon code SHALL be accepted with any non-empty content — no character restrictions beyond being non-empty. Attempting to save while any of these is empty SHALL be rejected without contacting storage.

#### Scenario: Saving with an empty code
- **WHEN** the maker clears the code field and attempts to save
- **THEN** the save is rejected and no coupon is created or updated

#### Scenario: Saving with no channel selected
- **WHEN** the maker attempts to save without a channel selected
- **THEN** the save is rejected and no coupon is created or updated

### Requirement: End date cannot precede start date
The form SHALL reject a save whenever the end date is earlier than the start date, in both create and edit mode.

#### Scenario: End date before start date
- **WHEN** the maker sets an end date earlier than the start date and attempts to save
- **THEN** the save is rejected and no coupon is created or updated

#### Scenario: End date equal to start date is allowed
- **WHEN** the maker sets the end date equal to the start date and attempts to save
- **THEN** the save proceeds, since the end date is not before the start date

### Requirement: Start and end dates are chosen from a date picker
The start and end date fields SHALL be set by choosing a date from a calendar popup, not by typing free text, in both create and edit mode. Every value produced by the picker SHALL be a valid calendar date.

#### Scenario: Choosing a start date
- **WHEN** the maker activates the start date field
- **THEN** a calendar popup opens for picking a date, and choosing a day sets the start date field to that day

#### Scenario: Picker cannot produce an invalid date
- **WHEN** the maker uses the date picker to set the start or end date
- **THEN** the resulting value is always a syntactically valid calendar date

### Requirement: Coupon code is unique per channel
A coupon's code, combined with its channel, SHALL be unique: no two coupons may share both the same code and the same channel. The same code MAY be reused across coupons that are on different channels. This SHALL be enforced on every save, in both create and edit mode, excluding the coupon being edited from the check against itself.

#### Scenario: Duplicate code on the same channel is rejected
- **WHEN** the maker attempts to save a coupon whose code matches an existing coupon that has the same channel
- **THEN** the save is rejected and no coupon is created or updated

#### Scenario: Same code on a different channel is allowed
- **WHEN** the maker attempts to save a coupon whose code matches an existing coupon, but the two coupons have different channels
- **THEN** the save proceeds and both coupons exist with the same code

#### Scenario: Editing a coupon without changing its code or channel is allowed
- **WHEN** the maker edits a coupon and saves it with its own unchanged code and channel
- **THEN** the save proceeds — the coupon being edited is not treated as a duplicate of itself

### Requirement: Validation errors are shown together, above Save
When a save is rejected by validation, the form SHALL show every current validation problem in the same error area used for save failures today (directly above the Save button), described in plain language rather than a generic failure message. The message SHALL update immediately to reflect the current set of problems whenever the maker attempts to save again.

#### Scenario: Multiple problems at once
- **WHEN** the maker attempts to save with an empty code and an end date before the start date
- **THEN** the error area above Save lists both problems in plain language, not just one of them and not a generic error

#### Scenario: Problem resolved and form re-submitted
- **WHEN** the maker fixes the reported problems and attempts to save again
- **THEN** the error area reflects only whatever problems remain, or is cleared entirely and the save proceeds if none remain

### Requirement: A saved edit immediately refreshes the Codes list and Calendar
Successfully saving a create or an edit SHALL immediately update the Codes list, and the Calendar screen's month grid (channel indicator lines) and selected-day list, to reflect the change — without requiring a manual reload or re-visiting the screen.

#### Scenario: Editing a coupon's dates updates the Calendar grid
- **WHEN** the maker edits a coupon's end date such that it no longer covers a day it previously covered, and saves
- **THEN** that day's channel indicator lines on the Calendar screen no longer include that coupon's channel, without the maker needing to leave and re-enter the Calendar screen

#### Scenario: Editing a coupon updates the Codes list
- **WHEN** the maker edits a coupon's value from the Codes list and saves
- **THEN** the coupon's card in the Codes list shows the new value immediately
