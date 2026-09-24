## MODIFIED Requirements

### Requirement: Sort, status filter, discount-type filter, and channel filter combine
The channel filter, the status filter, the discount-type filter, and the selected sort SHALL all apply together: the visible list SHALL contain only coupons matching at least one selected channel (if any are selected) AND matching at least one selected status (if any are selected) AND matching at least one selected discount type (if any are selected), ordered by the selected sort. Changing any one of these controls SHALL immediately update the visible list without requiring the others to be reset.

#### Scenario: Combining a channel filter with a status filter
- **WHEN** the user has "Etsy" selected in the channel filter and also selects the "Expiring" status
- **THEN** only Etsy coupons with expiring status are shown

#### Scenario: Combining multiple selected channels with a status filter
- **WHEN** the user has both "Etsy" and "Instagram" selected in the channel filter and also selects the "Expiring" status
- **THEN** only expiring coupons on either Etsy or Instagram are shown

#### Scenario: Changing the sort while filters are active
- **WHEN** filters are active and the user changes the sort field or direction
- **THEN** the same filtered set of coupons is shown, re-ordered according to the new sort

#### Scenario: No coupons match the combined filters
- **WHEN** the combination of active filters matches no coupons
- **THEN** the list shows an empty-state message instead of a blank area

### Requirement: Toolbar reflects the currently active sort and filters
The sort control and the channel, status, and discount-type filter controls SHALL visually indicate their current selection (the active sort field/direction, and which channel, status, and discount-type values are selected).

#### Scenario: Active filter values are visually distinguished
- **WHEN** one or more channel, status, or discount-type values are selected
- **THEN** those selected values are visually distinguished from unselected ones in the toolbar

## ADDED Requirements

### Requirement: Coupon list can be filtered by channel
The coupon list SHALL offer a channel filter listing the maker's current channels, allowing more than one to be selected at once, plus an "All" control. A coupon SHALL be shown if it has a channel matching any of the selected channels. When no channel is selected, "All" SHALL be shown as active and coupons of every channel SHALL be shown; selecting any specific channel SHALL immediately make "All" no longer shown as active. This channel filter SHALL behave identically to the Calendar screen's own channel visibility filter (see the calendar-view capability): selecting an additional channel adds to what's shown without removing the others; deselecting the only selected channel, or selecting every channel individually, both revert the filter to the same "All" state — shown the same way and producing the same visible list as never having selected anything.

#### Scenario: Filtering by a single channel
- **WHEN** the user selects only "Etsy"
- **THEN** only coupons on the Etsy channel are shown, and "All" is no longer shown as active

#### Scenario: Filtering by multiple channels
- **WHEN** the user selects both "Etsy" and "Instagram"
- **THEN** coupons on either channel are shown, and coupons on every other channel are hidden

#### Scenario: No channel selected shows every channel
- **WHEN** no channel is selected
- **THEN** "All" is shown as active and coupons of every channel are shown, subject to any other active filters

#### Scenario: Deselecting the only selected channel reverts to "All"
- **WHEN** the user deselects a channel that is the only one currently selected
- **THEN** "All" becomes shown as active again and coupons of every channel are shown again

#### Scenario: Selecting every channel individually collapses to "All"
- **WHEN** the user selects each of the maker's channels one at a time, until every one of them is selected
- **THEN** "All" becomes shown as active and every specific channel control becomes shown as not active, the same as if the user had activated "All" directly
- **AND** the visible list is unchanged from what it already showed with every channel individually selected

#### Scenario: A coupon with no channel is unaffected by the channel filter
- **WHEN** a coupon's only channel was deleted, leaving it with no channel
- **THEN** that coupon is shown regardless of which channels are selected in the channel filter
