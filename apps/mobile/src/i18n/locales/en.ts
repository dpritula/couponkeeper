export default {
  app: {
    name: 'CouponKeeper'
  },
  tabs: {
    codes: 'Codes',
    calendar: 'Calendar',
    settings: 'Settings'
  },
  channels: {
    manageTitle: 'Manage channels',
    manageOpen: 'Manage channels',
    empty: 'No channels yet — add one below.',
    delete: 'Delete channel',
    deleteTitle: 'Delete this channel?',
    deleteMessage: '"{name}" will be removed from every code that used it. Codes themselves are not deleted.',
    deleteConfirm: 'Delete',
    deleteCancel: 'Cancel',
    nameLabel: 'Name',
    namePlaceholder: 'e.g. Wholesale',
    colorLabel: 'Color',
    save: 'Save channel',
    saveError: 'Could not save this channel — check the fields and try again.',
    duplicateError: 'A channel with that name already exists.'
  },
  status: {
    active: 'Active',
    soon: 'Expiring',
    expired: 'Expired'
  },
  codes: {
    title: 'CouponKeeper',
    filterAll: 'All',
    until: 'until {date}',
    untilWithDays: 'until {date} · {days} days left',
    ended: 'ended {date}',
    usage: 'used {count} / {limit}',
    usageUnlimited: 'used {count} / unlimited',
    forFollowers: 'for followers {handle}',
    noChannel: 'No channel',
    delete: 'Delete code',
    deleteTitle: 'Delete this code?',
    deleteMessage: '"{code}" will be permanently removed.',
    deleteConfirm: 'Delete',
    deleteCancel: 'Cancel',
    detailClose: 'Close',
    detailChannel: 'Channel',
    detailStatus: 'Status',
    detailDiscountType: 'Discount type',
    detailValue: 'Value',
    detailStart: 'Start date',
    detailEnd: 'End date',
    detailUsageLimit: 'Usage limit',
    detailUsageCount: 'Times used',
    detailDaysLeft: 'Days left',
    detailNote: 'Note',
    empty: 'No codes match these filters.'
  },
  toolbar: {
    sortLabel: 'Sort',
    sortStartDateAsc: 'Start Date ↑',
    sortStartDateDesc: 'Start Date ↓',
    sortEndDateAsc: 'End Date ↑',
    sortEndDateDesc: 'End Date ↓',
    sortExpiringSoonAsc: 'Expiring Soon ↑',
    sortExpiringSoonDesc: 'Expiring Soon ↓',
    sortAlphabeticalAsc: 'A → Z',
    sortAlphabeticalDesc: 'Z → A',
    sortUsageAsc: 'Times Used ↑',
    sortUsageDesc: 'Times Used ↓',
    sortDaysLeftAsc: 'Days Left ↑',
    sortDaysLeftDesc: 'Days Left ↓'
  },
  form: {
    newTitle: 'New promo code',
    code: 'Code',
    generate: 'Generate',
    channel: 'Channel',
    discountType: 'Discount type',
    discountPercent: '%',
    discountAmount: 'Amount',
    discountShipping: 'Shipping',
    value: 'Amount',
    start: 'Start',
    end: 'End',
    usageLimit: 'Usage limit (optional)',
    usageLimitPlaceholder: 'unlimited',
    note: 'Note to self',
    save: 'Save code',
    saveError: 'Could not save this code — check the fields and try again.'
  },
  calendar: {
    title: 'Calendar',
    activeOn: 'Active on {date}',
    weekdays: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
    prevMonth: 'Previous month',
    nextMonth: 'Next month',
    pickerTitle: 'Choose month'
  },
  settings: {
    title: 'Settings',
    theme: 'Theme',
    themeSystem: 'System',
    themeLight: 'Light',
    themeDark: 'Dark',
    sortLabel: 'Default sort',
    feedback: 'We welcome your feedback, suggestions, feature requests, and bug reports at {email}.'
  }
}
