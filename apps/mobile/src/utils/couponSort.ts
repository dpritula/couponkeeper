import { useI18n } from 'vue-i18n';
import type { CouponSortField, SortDirection } from '@/db/queries/coupons';

export interface CouponSortOption {
  value: `${CouponSortField}:${SortDirection}`;
  sortBy: CouponSortField;
  sortDir: SortDirection;
  label: string;
}

/**
 * The full set of coupon-list sort fields × directions, shared by
 * CouponFilterToolbar (Codes/Calendar) and the Settings screen's default-sort
 * select, so the two never drift out of sync (design.md's sort-options
 * decision).
 */
export function getCouponSortOptions(): CouponSortOption[] {
  const { t } = useI18n();
  return [
    { value: 'startDate:asc', sortBy: 'startDate', sortDir: 'asc', label: t('toolbar.sortStartDateAsc') },
    { value: 'startDate:desc', sortBy: 'startDate', sortDir: 'desc', label: t('toolbar.sortStartDateDesc') },
    { value: 'endDate:asc', sortBy: 'endDate', sortDir: 'asc', label: t('toolbar.sortEndDateAsc') },
    { value: 'endDate:desc', sortBy: 'endDate', sortDir: 'desc', label: t('toolbar.sortEndDateDesc') },
    { value: 'expiringSoon:asc', sortBy: 'expiringSoon', sortDir: 'asc', label: t('toolbar.sortExpiringSoonAsc') },
    { value: 'expiringSoon:desc', sortBy: 'expiringSoon', sortDir: 'desc', label: t('toolbar.sortExpiringSoonDesc') },
    { value: 'alphabetical:asc', sortBy: 'alphabetical', sortDir: 'asc', label: t('toolbar.sortAlphabeticalAsc') },
    { value: 'alphabetical:desc', sortBy: 'alphabetical', sortDir: 'desc', label: t('toolbar.sortAlphabeticalDesc') },
    { value: 'usageCount:asc', sortBy: 'usageCount', sortDir: 'asc', label: t('toolbar.sortUsageAsc') },
    { value: 'usageCount:desc', sortBy: 'usageCount', sortDir: 'desc', label: t('toolbar.sortUsageDesc') },
    { value: 'daysLeft:asc', sortBy: 'daysLeft', sortDir: 'asc', label: t('toolbar.sortDaysLeftAsc') },
    { value: 'daysLeft:desc', sortBy: 'daysLeft', sortDir: 'desc', label: t('toolbar.sortDaysLeftDesc') }
  ];
}
