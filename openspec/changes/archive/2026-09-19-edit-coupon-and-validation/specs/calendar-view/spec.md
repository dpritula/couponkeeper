## MODIFIED Requirements

### Requirement: Read-only coupon cards on Calendar
Each coupon in the selected-day list SHALL be shown using the same card presentation used on the Codes list, without any delete affordance. Activating a card SHALL open the same detail popup the Codes list uses, showing that coupon's full details, including the same edit control the Codes list's detail popup offers.

#### Scenario: Viewing a coupon's card on Calendar
- **WHEN** a coupon appears in the Calendar's selected-day list
- **THEN** its card shows no delete control

#### Scenario: Opening a coupon's detail from Calendar
- **WHEN** the maker activates a coupon's card in the Calendar's selected-day list
- **THEN** a detail popup opens showing that coupon's full properties, with no delete action available, but with the same edit control available as on the Codes list

#### Scenario: Editing a coupon from Calendar
- **WHEN** the maker activates the edit control in a coupon's detail popup opened from the Calendar screen
- **THEN** the same coupon form used on the Codes list opens, pre-filled with that coupon's data, and saving updates the coupon the same way it would from Codes
