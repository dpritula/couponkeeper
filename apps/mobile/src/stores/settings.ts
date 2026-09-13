import { defineStore } from 'pinia'
import type { CouponSortField, SortDirection } from '@/db/queries/coupons'

export type ThemeMode = 'system' | 'light' | 'dark'

export interface DefaultSort {
  sortBy: CouponSortField
  sortDir: SortDirection
}

const STORAGE_KEY = 'couponkeeper.theme'
const DEFAULT_SORT_STORAGE_KEY = 'couponkeeper.defaultSort'
const DARK_CLASS = 'ion-palette-dark'
const FACTORY_DEFAULT_SORT: DefaultSort = { sortBy: 'daysLeft', sortDir: 'desc' }

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

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    theme: (localStorage.getItem(STORAGE_KEY) as ThemeMode | null) ?? 'system',
    defaultSort: readDefaultSort()
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
    }
  }
})
