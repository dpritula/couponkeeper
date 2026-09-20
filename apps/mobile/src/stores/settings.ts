import { defineStore } from 'pinia'
import type { CouponSortField, SortDirection } from '@/db/queries/coupons'
import { recalculateExpiryNotifications } from '@/notifications/expiryNotifications'

export type ThemeMode = 'system' | 'light' | 'dark'

export interface DefaultSort {
  sortBy: CouponSortField
  sortDir: SortDirection
}

const STORAGE_KEY = 'couponkeeper.theme'
const DEFAULT_SORT_STORAGE_KEY = 'couponkeeper.defaultSort'
const WARN_DAYS_BEFORE_STORAGE_KEY = 'couponkeeper.warnDaysBefore'
const DARK_CLASS = 'ion-palette-dark'
const FACTORY_DEFAULT_SORT: DefaultSort = { sortBy: 'daysLeft', sortDir: 'desc' }
const FACTORY_DEFAULT_WARN_DAYS_BEFORE = 2
const WARN_DAYS_BEFORE_MIN = 0
const WARN_DAYS_BEFORE_MAX = 20

function prefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applyDarkClass(isDark: boolean) {
  document.documentElement.classList.toggle(DARK_CLASS, isDark)
}

function readDefaultSort(): DefaultSort {
  const raw = localStorage.getItem(DEFAULT_SORT_STORAGE_KEY)
  if (!raw) return FACTORY_DEFAULT_SORT
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed.sortBy === 'string' && typeof parsed.sortDir === 'string') {
      return parsed as DefaultSort
    }
  } catch {
    // fall through to factory default
  }
  return FACTORY_DEFAULT_SORT
}

/**
 * A value outside `0`-`20` (or non-integer/unparseable) resets to the factory
 * default rather than clamping to the nearest boundary — per the maker's own
 * spec wording ("cannot be less than 0 or more than 20, otherwise reset to
 * the default (2)"), not a min/max clamp.
 */
function sanitizeWarnDaysBefore(value: number): number {
  if (!Number.isInteger(value) || value < WARN_DAYS_BEFORE_MIN || value > WARN_DAYS_BEFORE_MAX) {
    return FACTORY_DEFAULT_WARN_DAYS_BEFORE
  }
  return value
}

function readWarnDaysBefore(): number {
  const raw = localStorage.getItem(WARN_DAYS_BEFORE_STORAGE_KEY)
  if (!raw) return FACTORY_DEFAULT_WARN_DAYS_BEFORE
  const parsed = Number(raw)
  if (Number.isNaN(parsed)) return FACTORY_DEFAULT_WARN_DAYS_BEFORE
  return sanitizeWarnDaysBefore(parsed)
}

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    theme: (localStorage.getItem(STORAGE_KEY) as ThemeMode | null) ?? 'system',
    defaultSort: readDefaultSort(),
    warnDaysBefore: readWarnDaysBefore()
  }),
  actions: {
    setTheme(theme: ThemeMode) {
      this.theme = theme
      localStorage.setItem(STORAGE_KEY, theme)
      this.applyTheme()
    },
    applyTheme() {
      const isDark = this.theme === 'dark' || (this.theme === 'system' && prefersDark())
      applyDarkClass(isDark)
    },
    watchSystemTheme() {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (this.theme === 'system') this.applyTheme()
      })
    },
    setDefaultSort(sortBy: CouponSortField, sortDir: SortDirection) {
      this.defaultSort = { sortBy, sortDir }
      localStorage.setItem(DEFAULT_SORT_STORAGE_KEY, JSON.stringify(this.defaultSort))
    },
    /** Also triggers a notification recalculation (see notifications/expiryNotifications.ts, which reads `warnDaysBefore` back from this same store — see design.md's recalculation-trigger decision). */
    setWarnDaysBefore(value: number) {
      this.warnDaysBefore = sanitizeWarnDaysBefore(value)
      localStorage.setItem(WARN_DAYS_BEFORE_STORAGE_KEY, String(this.warnDaysBefore))
      void recalculateExpiryNotifications()
    }
  }
})
