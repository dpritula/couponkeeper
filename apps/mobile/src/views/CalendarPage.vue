<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="cal-head">
        <div class="brand2 font-brand">{{ t('calendar.title') }}</div>
        <div class="cal-nav">
          <button type="button" class="nav-arrow" :aria-label="t('calendar.prevMonth')" @click="goToPrevMonth">‹</button>
          <button type="button" class="nav-label" @click="showPicker = true">{{ monthLabel }}</button>
          <button type="button" class="nav-arrow" :aria-label="t('calendar.nextMonth')" @click="goToNextMonth">›</button>
        </div>
      </div>

      <div class="cal-grid">
        <div class="cal-dow">
          <div v-for="wd in weekdays" :key="wd">{{ wd }}</div>
        </div>
        <div class="cal-days">
          <div
            v-for="cell in monthGrid"
            :key="cell.date"
            class="day"
            :class="{ dim: cell.dim, today: cell.date === today, sel: cell.date === selectedDate }"
            @click="selectDay(cell)"
          >
            <div v-if="linesFor(cell.date).length" class="chan-lines">
              <div v-for="(color, index) in linesFor(cell.date)" :key="index" class="chan-line" :style="{ background: color ?? 'transparent' }"></div>
            </div>
            {{ cell.day }}
          </div>
        </div>
      </div>

      <div class="cal-legend">
        <div v-for="ch in channelsStore.items" :key="ch.key" class="item">
          <span class="dot" :style="{ background: ch.color }"></span>{{ ch.name }}
        </div>
      </div>

      <div class="cal-day-list">
        <div class="heading">{{ t('calendar.activeOn', { date: selectedDateLabel }) }}</div>
        <CouponFilterToolbar
          :channels="channelsStore.items"
          :channel-filter="dayListChannelFilter"
          :status-filter="dayListStatusFilter"
          :discount-type-filter="dayListDiscountTypeFilter"
          :sort-by="dayListSortBy"
          :sort-dir="dayListSortDir"
          @update:channel-filter="dayListChannelFilter = $event"
          @toggle-status="toggleDayListStatus"
          @toggle-discount="toggleDayListDiscountType"
          @update:sort="onDayListSortChange"
        />
        <CodeCard v-for="code in selectedDayCoupons" :key="code.code" :code="code" @select="selectedCode = code" />
      </div>
    </ion-content>

    <MonthYearPickerModal :open="showPicker" :visible-month="visibleMonth" @select="onPickerSelect" @close="showPicker = false" />
    <CouponDetailModal :code="selectedCode" @close="selectedCode = null" />
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { IonPage, IonContent, onIonViewWillEnter } from '@ionic/vue';
import CodeCard from '@/components/CodeCard.vue';
import CouponDetailModal from '@/components/CouponDetailModal.vue';
import CouponFilterToolbar from '@/components/CouponFilterToolbar.vue';
import MonthYearPickerModal from '@/components/MonthYearPickerModal.vue';
import { listCoupons, type CouponSortField, type SortDirection } from '@/db/queries/coupons';
import type { CouponRow } from '@/db/schema';
import type { PromoCode } from '@/data/promoCode';
import { useChannelsStore } from '@/stores/channels';
import { toViewModel } from '@/stores/coupons';
import { useSettingsStore } from '@/stores/settings';
import {
  addMonths,
  filterDayListCoupons,
  getCouponsForDate,
  getDayChannelLines,
  getMonthGrid,
  sortDayListCoupons,
  todayIsoDate,
  visibleMonthFromIsoDate,
  type CalendarDayCell,
  type VisibleMonth
} from '@/utils/calendar';
import { formatShortDate } from '@/utils/date';

function toggleInArray<T>(items: T[], value: T): T[] {
  return items.includes(value) ? items.filter((item) => item !== value) : [...items, value];
}

const { t, tm } = useI18n();
const channelsStore = useChannelsStore();
const settingsStore = useSettingsStore();

const weekdays = computed(() => tm('calendar.weekdays') as string[]);

const visibleMonth = ref<VisibleMonth>(visibleMonthFromIsoDate(todayIsoDate()));
const selectedDate = ref(todayIsoDate());
const today = ref(todayIsoDate());
const showPicker = ref(false);
const selectedCode = ref<PromoCode | null>(null);
const coupons = ref<PromoCode[]>([]);

// Local to Calendar's own day-list toolbar — never written into
// useCouponsStore, so visiting Calendar never perturbs Codes' own filter
// selections and vice versa (design.md Decision 1 and Decision 7). The sort
// is the exception: it's the shared, persisted default from the settings
// store, so changing it here also updates Codes and the Settings screen
// (design.md's Calendar decision).
const dayListChannelFilter = ref<string>('all');
const dayListStatusFilter = ref<CouponRow['status'][]>([]);
const dayListDiscountTypeFilter = ref<CouponRow['discountType'][]>([]);
const dayListSortBy = computed(() => settingsStore.defaultSort.sortBy);
const dayListSortDir = computed(() => settingsStore.defaultSort.sortDir);

const monthGrid = computed(() => getMonthGrid(visibleMonth.value));
// Marks/legend always derive from the full, unfiltered coupon set — the
// day-list toolbar below narrows only `selectedDayCoupons` (design.md
// Decision 7 / specs/calendar-view/spec.md's "Selected-day list filter and sort").
const dayChannelLines = computed(() => getDayChannelLines(monthGrid.value, coupons.value, channelsStore.items));
const selectedDayCoupons = computed(() => {
  const dateFiltered = getCouponsForDate(coupons.value, selectedDate.value);
  const filtered = filterDayListCoupons(dateFiltered, {
    channelFilter: dayListChannelFilter.value,
    statusFilter: dayListStatusFilter.value,
    discountTypeFilter: dayListDiscountTypeFilter.value
  });
  return sortDayListCoupons(filtered, dayListSortBy.value, dayListSortDir.value);
});

const monthLabel = computed(() =>
  new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(
    new Date(visibleMonth.value.year, visibleMonth.value.month - 1, 1)
  )
);
const selectedDateLabel = computed(() => formatShortDate(selectedDate.value));

function linesFor(date: string): (string | null)[] {
  return dayChannelLines.value.get(date) ?? [];
}

function goToPrevMonth() {
  visibleMonth.value = addMonths(visibleMonth.value, -1);
}

function goToNextMonth() {
  visibleMonth.value = addMonths(visibleMonth.value, 1);
}

function selectDay(cell: CalendarDayCell) {
  selectedDate.value = cell.date;
  if (cell.dim) visibleMonth.value = visibleMonthFromIsoDate(cell.date);
}

function onPickerSelect(value: VisibleMonth) {
  visibleMonth.value = value;
  showPicker.value = false;
}

function toggleDayListStatus(status: CouponRow['status']) {
  dayListStatusFilter.value = toggleInArray(dayListStatusFilter.value, status);
}

function toggleDayListDiscountType(discountType: CouponRow['discountType']) {
  dayListDiscountTypeFilter.value = toggleInArray(dayListDiscountTypeFilter.value, discountType);
}

function onDayListSortChange({ sortBy, sortDir }: { sortBy: CouponSortField; sortDir: SortDirection }) {
  settingsStore.setDefaultSort(sortBy, sortDir);
}

onIonViewWillEnter(async () => {
  today.value = todayIsoDate();
  channelsStore.load();
  coupons.value = (await listCoupons({ sortBy: 'daysLeft', sortDir: 'desc' })).map(toViewModel);
});
</script>

<style scoped>
.cal-head {
  /* Custom in-content header (no <ion-header>), so nothing accounts for the
     status bar / notch on its own — add the safe area inset explicitly. */
  padding: calc(env(safe-area-inset-top) + 6px) 20px 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.brand2 {
  /* Matches CodesPage's/SettingsPage's `.brand` size — the three screens'
     headers are meant to look identical in weight/scale (see CLAUDE.md). */
  font-size: 22px;
  font-weight: 600;
  color: var(--ck-ink);
}
.cal-nav {
  display: flex;
  align-items: center;
  gap: 14px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: var(--ck-muted);
}
.nav-arrow {
  background: transparent;
  border: none;
  padding: 4px 6px;
  font-size: 15px;
  line-height: 1;
  color: var(--ck-muted);
  cursor: pointer;
}
.nav-arrow:active {
  color: var(--ck-ink);
}
.nav-label {
  background: transparent;
  border: none;
  padding: 0;
  color: var(--ck-ink);
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.cal-grid {
  padding: 8px 16px 0;
}
.cal-dow {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 6px;
}
.cal-dow div {
  text-align: center;
  font-family: 'Inter', sans-serif;
  font-size: 10.5px;
  font-weight: 600;
  color: var(--ck-muted);
}
.cal-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  row-gap: 4px;
}
.cal-days .day {
  aspect-ratio: 1;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 6px;
  font-family: 'Inter', sans-serif;
  font-size: 12.5px;
  color: var(--ck-ink);
  border-radius: 0;
  /* An outline, not a border: outline is drawn after layout and never
     affects the box's padding edge, so (a) .sel toggling its color can never
     shift the absolutely-positioned .chan-lines inside this cell, and
     (b) .chan-lines' left:0/right:0 still reach the cell's true visual edge
     on every cell (selected or not), keeping same-colored lines in adjacent
     cells flush against each other. A reserved *border* (the previous
     approach) fixed (a) but broke (b) — it insets the padding edge on every
     cell, not just the selected one, opening a gap between every pair of
     adjacent cells' lines. */
  outline: 1.5px solid transparent;
  outline-offset: -1.5px;
  position: relative;
  cursor: pointer;
}
.cal-days .day.dim {
  color: var(--ck-rule);
}
.cal-days .day.today {
  /* A solid sage fill (darker/more saturated than the pale `--ck-sage-dim`
     tint used previously) so "today" reads clearly against the grid even
     next to a selected day's lighter outline. `--ck-card` gives readable
     contrast on top of it in both palettes (light: dark-ish text on a
     mid-tone green; dark: dark text on the brighter dark-palette sage). */
  background: var(--ck-sage);
  color: var(--ck-card);
  font-weight: 600;
}
.cal-days .day.sel {
  /* `--ck-rule` — the app's standard border/divider token — rather than
     `--ck-muted`: a visibly lighter ring than before, still distinguishable
     from a plain cell's border-less edge in both palettes. */
  outline-color: var(--ck-rule);
  font-weight: 600;
}
.chan-lines {
  position: absolute;
  top: 4px;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.chan-line {
  height: 3px;
  /* No border-radius and no horizontal inset (see .chan-lines): `.cal-days`
     already has no column-gap, so a same-colored line in the next day's cell
     sits flush against this one, reading as one continuous bar across the
     row (design.md Decision 3b). */
}
.cal-legend {
  display: flex;
  gap: 14px;
  padding: 14px 20px 10px;
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  color: var(--ck-muted);
  border-top: 1px solid var(--ck-rule);
  margin-top: 10px;
  flex-wrap: wrap;
}
.cal-legend .item {
  display: flex;
  align-items: center;
  gap: 5px;
}
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.cal-day-list {
  padding: 2px 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.cal-day-list .heading {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: var(--ck-muted);
  margin: 6px 2px 2px;
}
</style>
