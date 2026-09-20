## MODIFIED Requirements

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
