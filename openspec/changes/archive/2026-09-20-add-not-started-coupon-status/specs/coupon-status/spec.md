## Purpose

Defines how a coupon's status — Not Started, Active, Expiring, or Expired — is derived from its start and end dates, so every view that shows or filters by status (the coupon list, Calendar, and the detail popup) agrees on the same rule.

## ADDED Requirements

### Requirement: Coupons not yet started have a distinct status
A coupon whose start date is after today SHALL have status "Not Started," distinct from Active, Expiring, and Expired. This status SHALL take priority over any end-date-based status: a coupon that has not yet started SHALL never be shown as Active, Expiring, or Expired, regardless of how its end date compares to today.

#### Scenario: A coupon scheduled to start in the future
- **WHEN** a coupon's start date is after today
- **THEN** its status is "Not Started"

#### Scenario: Not-started status overrides the end-date-based statuses
- **WHEN** a coupon's start date is after today and its end date is also more than the "soon" threshold away
- **THEN** its status is still "Not Started," not "Active"

### Requirement: A coupon's status is recomputed from its dates, not stored as fixed data
As with the existing Active/Expiring/Expired statuses, "Not Started" SHALL be derived from the coupon's start date and today's date every time the status is shown, not trusted from whatever value happens to be stored.

#### Scenario: Today reaches a coupon's start date
- **WHEN** a coupon previously had status "Not Started" because today was before its start date, and today has since reached or passed that start date
- **THEN** the coupon's status is now Active, Expiring, or Expired (based on its end date), not "Not Started"

### Requirement: Not-started coupons are visually distinguishable
Everywhere a coupon's status is shown as a label (the coupon list, Calendar's day list, and the coupon detail popup), a coupon with "Not Started" status SHALL show a label distinct from the Active, Expiring, and Expired labels.

#### Scenario: A not-started coupon's card
- **WHEN** a coupon with "Not Started" status appears in the coupon list, Calendar's day list, or the detail popup
- **THEN** its status label reads "Not Started," styled distinctly from the Active, Expiring, and Expired labels

### Requirement: Not-started coupons participate in existing sorts like non-expired coupons
Every existing sort SHALL treat a "Not Started" coupon the same way it treats an Active or Expiring coupon for grouping purposes — in particular, the "Expiring Soon" sort's rule that non-expired coupons precede expired ones SHALL treat "Not Started" as non-expired.

#### Scenario: Not-started coupon under "Expiring Soon" sort
- **WHEN** the list contains a "Not Started" coupon and an Expired coupon, sorted by "Expiring Soon"
- **THEN** the "Not Started" coupon is listed before the Expired one, regardless of direction
