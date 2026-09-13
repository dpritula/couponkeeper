## Purpose

Lets makers define their own sales channels (beyond the built-in Own site / Etsy / Instagram) and associate coupons with them, replacing a fixed enum with channels the user can add to and remove from at any time.

## ADDED Requirements

### Requirement: Channels are user-managed data, not a fixed set
A channel SHALL be represented as a named, colored record that the user can create and delete, and every place a channel is displayed or picked (the coupon list's channel filter, the coupon creation/detail views, and the channel management list) SHALL reflect the current set of channels rather than a fixed, hardcoded list. A channel's display name SHALL be shown exactly as stored, not translated.

#### Scenario: A newly added channel appears everywhere channels are shown
- **WHEN** a new channel has been added
- **THEN** it appears in the coupon list's channel filter, in the channel picker used when creating a coupon, and in the channel management list, without requiring an app restart

#### Scenario: Channel name is shown as entered
- **WHEN** a channel's name is displayed anywhere in the app
- **THEN** the exact name the user entered is shown, not a translated or localized string

### Requirement: User can add a new channel
The system SHALL provide a form to create a new channel by entering a name and choosing a color, accessible from a channel management view. Saving SHALL persist the channel and immediately refresh every list of channels shown in the app.

#### Scenario: Successful channel creation
- **WHEN** the user enters a channel name, picks a color, and saves
- **THEN** the channel is created, the channel management list updates to include it, and the coupon list's channel filter also updates to include it

#### Scenario: Duplicate channel name is rejected
- **WHEN** the user tries to save a new channel whose name matches an existing channel
- **THEN** the save is rejected and an error is shown, and no duplicate channel is created

### Requirement: User can view all channels for management
The system SHALL provide a scrollable list of every existing channel, each showing its name and color, with a control to delete it.

#### Scenario: Channel management list shows every channel
- **WHEN** the user opens the channel management view
- **THEN** every existing channel is listed with its name, color, and a delete control, scrollable if the list is taller than the visible area

### Requirement: Deleting a channel requires confirmation
Deleting a channel SHALL require the user to confirm the action before it takes effect, since it removes the channel's association from every coupon that used it.

#### Scenario: User confirms a channel deletion
- **WHEN** the user selects delete on a channel and confirms the action
- **THEN** the channel is deleted

#### Scenario: User cancels a channel deletion
- **WHEN** the user selects delete on a channel and cancels the confirmation
- **THEN** the channel is not deleted and remains in every list it appeared in

### Requirement: Deleting a channel un-links its coupons without deleting them
When a channel is deleted, the system SHALL remove that channel's association from every coupon that had it, without deleting the coupons themselves. This SHALL update the coupon list and the channel management view immediately, without requiring either to be manually refreshed.

#### Scenario: Coupons lose only the deleted channel's association
- **WHEN** a channel that is associated with one or more coupons is deleted
- **THEN** each affected coupon still exists with its other data intact, but no longer shows the deleted channel

#### Scenario: Deleting a channel updates the coupon list in the background
- **WHEN** a channel is deleted while the channel management view is open
- **THEN** the coupon list behind it (including its channel filter chips) reflects the deletion without the user needing to close the management view or manually reload

#### Scenario: A coupon left with no channels still displays normally
- **WHEN** a coupon's only associated channel is deleted
- **THEN** the coupon still appears in the coupon list and its detail view, showing no channel tag instead of an error or a broken display
