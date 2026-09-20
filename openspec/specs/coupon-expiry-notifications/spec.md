# coupon-expiry-notifications Specification

## Purpose

Warns a maker, via a native daily notification, when one or more of their coupons are close to expiring — so an expiry can't lapse unnoticed just because the app wasn't open.

## Requirements

### Requirement: Notifications recalculate on every relevant change
The app SHALL recalculate its scheduled expiry-warning notifications, from scratch, whenever any of the following occurs: the app returns to the foreground from the background, a coupon is created, a coupon is edited, a coupon is deleted, or the "warn about coupon expiry" setting's value changes.

#### Scenario: Returning to the app
- **WHEN** the maker backgrounds the app and later brings it back to the foreground
- **THEN** the app's scheduled expiry-warning notifications are recalculated to reflect the current date and current coupon data

#### Scenario: Saving a coupon
- **WHEN** the maker creates or edits a coupon and the save succeeds
- **THEN** the app's scheduled expiry-warning notifications are recalculated to reflect that coupon's (possibly new) dates

#### Scenario: Deleting a coupon
- **WHEN** the maker deletes a coupon
- **THEN** the app's scheduled expiry-warning notifications are recalculated so that coupon no longer appears in any future notification

#### Scenario: Changing the warning threshold
- **WHEN** the maker changes the "warn about coupon expiry" setting to a new value
- **THEN** the app's scheduled expiry-warning notifications are recalculated using the new threshold

### Requirement: A coupon qualifies for a daily warning while within the threshold
A coupon SHALL be included in a given day's expiry warning when, as of that day, its status is `active` or `soon` (never `expired` or `notStarted`) and the number of days remaining until its end date is between `0` and the current "warn about coupon expiry" setting value, inclusive. A coupon SHALL be included again on each subsequent qualifying day, once per day, until it expires or no longer qualifies.

#### Scenario: Coupon enters the warning window
- **WHEN** a coupon's days remaining until its end date first becomes less than or equal to the configured warning threshold
- **THEN** that coupon is included in the notification scheduled for that day

#### Scenario: Coupon continues to qualify on later days
- **WHEN** a coupon remained within the warning threshold on the previous day and is still within it today
- **THEN** that coupon is included again in today's scheduled notification, not just the day it first qualified

#### Scenario: A newly created coupon already within the window is included in today's notification, not just the day it ends
- **WHEN** the maker creates or edits a coupon whose days remaining until its end date is already within the warning threshold but greater than zero (for example, 2 days remaining with a 3-day threshold)
- **THEN** that coupon is included in today's notification (with its current days-remaining stated accurately), not held back until the day it actually ends

#### Scenario: Expired coupons are never included
- **WHEN** a coupon's status is `expired`
- **THEN** that coupon is never included in any scheduled expiry-warning notification, regardless of the configured threshold

#### Scenario: Coupons that haven't started are never included
- **WHEN** a coupon's status is `notStarted`
- **THEN** that coupon is never included in any scheduled expiry-warning notification, even if its end date happens to fall within the warning threshold

### Requirement: The warning threshold is the single source of truth for the "soon"/"Expiring" status shown everywhere
The "warn about coupon expiry" setting value SHALL also govern when a coupon's displayed status is `soon` ("Expiring") rather than `active`, wherever that status is shown (the Codes list, the Calendar screen's month grid and day list, and the coupon detail view). There SHALL NOT be a separate, independently-configured threshold for this purpose. Changing the setting SHALL be reflected immediately, the next time each of those views is shown, without requiring an app restart.

#### Scenario: Raising the threshold reclassifies coupons as Expiring
- **WHEN** the maker raises the "warn about coupon expiry" value such that a coupon's current days-remaining now falls at or below it
- **THEN** that coupon's status shown on the Codes list, Calendar, and its detail view changes to `soon` ("Expiring") the next time each is shown, without any other change to that coupon's data

#### Scenario: Lowering the threshold reclassifies coupons back to Active
- **WHEN** the maker lowers the "warn about coupon expiry" value such that a coupon's current days-remaining is now above it
- **THEN** that coupon's status shown everywhere reverts to `active`, the same way

### Requirement: Today's notifications fire on time or catch up within a window, grouped by when they were discovered
Every coupon newly qualifying for today's warning SHALL be covered by exactly one expiry-warning notification that day — never zero, and never more than one. Coupons discovered (by a recalculation) before 12:00 local device time SHALL be grouped into a single notification scheduled for 12:00 local time that day; a coupon discovered before 12:00 stays merged into that same not-yet-fired notification even if further coupons are discovered later, up until it fires. A coupon discovered at or after 12:00 and before 20:00 local time SHALL be covered by a notification delivered immediately (a "catch-up" delivery) rather than waiting for a 12:00 time that has already passed. A coupon discovered at or after 20:00 local time SHALL NOT be notified about that day — that day's warning for it is skipped, not delayed further (it is reconsidered fresh the next calendar day it still qualifies). A day with no newly-qualifying coupons SHALL show no notification that day.

#### Scenario: No qualifying coupons on a given day
- **WHEN** no coupon qualifies for a warning on a particular day
- **THEN** no expiry-warning notification is shown that day

#### Scenario: Multiple coupons discovered together share one notification
- **WHEN** more than one coupon newly qualifies for a warning at the same time (the same recalculation)
- **THEN** a single notification covers all of them, not one notification per coupon

#### Scenario: Recalculation before noon schedules the notification for noon
- **WHEN** a recalculation runs before 12:00 local time and one or more coupons newly qualify for today
- **THEN** those coupons' notification is scheduled to fire at 12:00 local time, not delivered immediately

#### Scenario: A later, still-before-noon discovery merges into the same noon notification
- **WHEN** a coupon was already scheduled for the 12:00 notification (from an earlier recalculation that same morning), and a different coupon newly qualifies before that 12:00 notification has fired
- **THEN** both coupons are covered by the same single 12:00 notification, not two separate ones

#### Scenario: Catching up between noon and 20:00
- **WHEN** a recalculation runs at or after 12:00 and before 20:00 local time and one or more coupons newly qualify for today
- **THEN** the app schedules and delivers a notification for those coupons immediately, rather than waiting for a 12:00 time that has already passed

#### Scenario: A later catch-up discovery gets its own notification, not a merge
- **WHEN** a coupon was already delivered a catch-up notification earlier today, and a different coupon newly qualifies later the same day (still before 20:00)
- **THEN** the newly-qualifying coupon is delivered its own separate notification — it is not added to the already-delivered one, and the already-delivered one is not re-shown

#### Scenario: The window closes at 20:00
- **WHEN** a recalculation runs at or after 20:00 local time and one or more coupons newly qualify for today
- **THEN** no notification is delivered for those coupons today

### Requirement: A coupon already notified today is never notified again the same day
Once a coupon has been covered by a delivered (or still-pending, not-yet-fired) notification today, the app SHALL NOT deliver any further expiry-warning notification mentioning that same coupon for the remainder of that calendar day, regardless of how many further recalculations happen. This guarantee is per-coupon, not per-day: a *different*, newly-qualifying coupon (for example, one just created or edited) SHALL still receive its own notification the same day — recalculating on every created or edited coupon (see above) is only meaningful if a later recalculation can still produce new output for a genuinely new coupon.

#### Scenario: A later recalculation does not repeat an already-covered coupon
- **WHEN** a coupon has already been covered by today's notification, and the app recalculates again later the same day (for example, the app is resumed again, or another coupon is saved)
- **THEN** that coupon does not appear in any further notification that day, regardless of what the recalculation's qualifying set would otherwise be

#### Scenario: A newly created coupon still gets notified the same day, even after an earlier notification already went out
- **WHEN** the maker creates or edits a second (or third, etc.) coupon that newly qualifies for today's warning, after an earlier, different coupon's notification has already been delivered today
- **THEN** the new coupon is still covered by its own notification that day — it is not silently skipped just because today already had a notification for a different coupon

#### Scenario: A still-pending (not yet fired) coupon edited out of the window is dropped, not notified
- **WHEN** a coupon that was merged into the still-pending 12:00 notification is edited or deleted such that it no longer qualifies, before that notification has fired
- **THEN** that coupon is removed from the pending notification's content before it fires, and is not separately notified about

### Requirement: Notification content names the qualifying coupon(s)
When exactly one coupon qualifies for a day's notification, its content SHALL state that coupon's code, its channel, and how many days remain until it expires. When more than one coupon qualifies, its content SHALL identify each qualifying coupon's code, channel, and days remaining.

#### Scenario: Single qualifying coupon
- **WHEN** exactly one coupon qualifies for the day's notification
- **THEN** the notification states that coupon's code, its channel, and the number of days remaining until it expires

#### Scenario: Multiple qualifying coupons
- **WHEN** more than one coupon qualifies for the day's notification
- **THEN** the notification identifies every qualifying coupon, each with its code, channel, and days remaining

### Requirement: Tapping the notification opens the relevant coupon(s)
Tapping a day's expiry-warning notification SHALL open the app. If the notification covered exactly one coupon, it SHALL open that coupon's detail view directly. If it covered more than one coupon, it SHALL open the Codes list filtered to show exactly the coupons that were included in that notification.

#### Scenario: Tapping a single-coupon notification
- **WHEN** the maker taps a notification that covered exactly one coupon
- **THEN** the app opens directly to that coupon's detail view

#### Scenario: Tapping a multi-coupon notification
- **WHEN** the maker taps a notification that covered more than one coupon
- **THEN** the app opens the Codes list, filtered to show exactly the coupons that were included in that notification

### Requirement: Uninstalling the app clears its scheduled notifications
Removing the app from the device SHALL leave no scheduled expiry-warning notifications behind.

#### Scenario: App is uninstalled with notifications pending
- **WHEN** the maker uninstalls the app while one or more expiry-warning notifications are still scheduled
- **THEN** none of those notifications are delivered after the uninstall
