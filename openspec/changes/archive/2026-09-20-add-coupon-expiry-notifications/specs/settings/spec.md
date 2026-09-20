## ADDED Requirements

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
