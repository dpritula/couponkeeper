<template>
  <ion-page>
    <div class="cal-header">
      <div class="cal-head">
        <div class="brand2 font-brand"><AppLogo class="brand-logo" />{{ t('calendar.title') }}</div>
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

      <ChannelFilterChips
        class="cal-channel-filter"
        :channels="channelsStore.items"
        :selected="dayListSelectedChannels"
        @toggle="toggleDayListChannel"
        @select-all="enableAllDayListChannels"
      />
    </div>

    <ion-content>
      <div class="cal-day-list">
        <div class="heading">{{ t('calendar.activeOn', { date: selectedDateLabel }) }}</div>
        <CouponFilterToolbar
          :channels="channelsStore.items"
          :show-channel-filter="false"
          :status-filter="dayListStatusFilter"
          :discount-type-filter="dayListDiscountTypeFilter"
          :sort-by="dayListSortBy"
          :sort-dir="dayListSortDir"
          @toggle-status="toggleDayListStatus"
          @toggle-discount="toggleDayListDiscountType"
          @update:sort="onDayListSortChange"
        />
        <CodeCard v-for="code in selectedDayCoupons" :key="code.code" :code="code" @select="selectedCode = code" />
      </div>
    </ion-content>

    <MonthYearPickerModal :open="showPicker" :visible-month="visibleMonth" @select="onPickerSelect" @close="showPicker = false" />
    <CouponDetailModal :code="selectedCode" @close="selectedCode = null" @edit="startEdit" />
    <CouponFormModal :key="editingCode?.code ?? 'closed'" :open="editingCode !== null" :coupon="editingCode" @close="closeForm" />
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { IonPage, IonContent, onIonViewWillEnter } from '@ionic/vue';
import AppLogo from '@/components/AppLogo.vue';
import ChannelFilterChips from '@/components/ChannelFilterChips.vue';
import CodeCard from '@/components/CodeCard.vue';
import CouponDetailModal from '@/components/CouponDetailModal.vue';
import CouponFilterToolbar from '@/components/CouponFilterToolbar.vue';
import CouponFormModal from '@/components/CouponFormModal.vue';
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
import { resolveSelectedChannelKeys, toggleChannelSelection } from '@/utils/channelSelection';
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
const editingCode = ref<PromoCode | null>(null);
const coupons = ref<PromoCode[]>([]);

// Local to Calendar's own day-list toolbar — never written into
// useCouponsStore, so visiting Calendar never perturbs Codes' own filter
// selections and vice versa (design.md Decision 1 and Decision 7). The sort
// is the exception: it's the shared, persisted default from the settings
// store, so changing it here also updates Codes and the Settings screen
// (design.md's Calendar decision).
//
// Channel visibility is a positive whitelist of explicitly *selected*
// channel keys, empty by default — the same "empty selection means no
// restriction" convention dayListStatusFilter/dayListDiscountTypeFilter
// below already use. "All" is shown as active exactly when this set is
// empty; selecting a channel deselects "All"; deselecting the only
// selected channel reverts to "All" automatically, since the set becomes
// empty again (calendar-channel-line-filter's design.md Decisions 1, 2, 6).
const dayListSelectedChannels = ref<Set<string>>(new Set());
const dayListStatusFilter = ref<CouponRow['status'][]>([]);
const dayListDiscountTypeFilter = ref<CouponRow['discountType'][]>([]);
const dayListSortBy = computed(() => settingsStore.defaultSort.sortBy);
const dayListSortDir = computed(() => settingsStore.defaultSort.sortDir);

// Resolves the whitelist into the concrete set every consumer below needs:
// every current channel when nothing is explicitly selected, or just the
// selected ones (design.md Decision 3).
const enabledChannelKeys = computed(() =>
  resolveSelectedChannelKeys(
    dayListSelectedChannels.value,
    channelsStore.items.map((channel) => channel.key)
  )
);

const monthGrid = computed(() => getMonthGrid(visibleMonth.value));
// Both the grid's lines and the day list below are narrowed by the same
// channel visibility filter (calendar-channel-line-filter's design.md
// Decision 3); status/discount-type filters below the day-list heading
// still affect only `selectedDayCoupons`.
const dayChannelLines = computed(() => getDayChannelLines(monthGrid.value, coupons.value, channelsStore.items, enabledChannelKeys.value));
const selectedDayCoupons = computed(() => {
  const dateFiltered = getCouponsForDate(coupons.value, selectedDate.value);
  const filtered = filterDayListCoupons(dateFiltered, {
    channelFilter: enabledChannelKeys.value,
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

function toggleDayListChannel(key: string) {
  dayListSelectedChannels.value = toggleChannelSelection(dayListSelectedChannels.value, key, channelsStore.items.length);
}

function enableAllDayListChannels() {
  dayListSelectedChannels.value = new Set();
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

async function loadCoupons() {
  coupons.value = (await listCoupons({ sortBy: 'daysLeft', sortDir: 'desc' })).map(toViewModel);
}

function startEdit(code: PromoCode) {
  selectedCode.value = null;
  editingCode.value = code;
}

// The form saves through `useCouponsStore`, which only refreshes its own
// `items` (what CodesPage reads) — Calendar keeps its own local `coupons`
// list (design.md's Calendar decision), so it has to reload it itself once
// the form closes, rather than relying on a page-lifecycle hook that won't
// re-fire for a same-page popup close.
async function closeForm() {
  editingCode.value = null;
  await loadCoupons();
}

onIonViewWillEnter(async () => {
  today.value = todayIsoDate();
  channelsStore.load();
  await loadCoupons();
});
</script>

<style scoped>
.cal-header {
  /* A page-level sibling of <ion-content>, not inside it — same fixed-header
     pattern as CodesPage's/SettingsPage's `.app-header` (ion-page lays its
     children out as a column, ion-content is the only one that scrolls), so
     the month grid + channel visibility filter stay in place while the day
     list below scrolls independently. Nothing accounts for the status bar / notch on
     its own here (see `.cal-head`'s own top padding), and the border+shadow
     visually separate it from the scrolling list, same as the other two
     screens' headers. */
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  background: var(--ck-paper);
  border-bottom: 1px solid var(--ck-rule);
  box-shadow: 0 2px 6px rgba(31, 42, 36, 0.08);
}
.cal-head {
  padding: calc(env(safe-area-inset-top) + 6px) 20px 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.brand2 {
  /* Matches CodesPage's/SettingsPage's `.brand` size — the three screens'
     headers are meant to look identical in weight/scale (see CLAUDE.md). */
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 22px;
  font-weight: 600;
  color: var(--ck-ink);
}
.brand-logo {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  flex-shrink: 0;
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
     affects the box's padding edge, so (a) .sel toggling its color/width can
     never shift the absolutely-positioned .chan-lines inside this cell, and
     (b) .chan-lines' left:0/right:0 still reach the cell's true visual edge
     on every cell, so same-colored lines in adjacent cells still meet up
     across the thin rule line rather than gapping unevenly. A reserved
     *border* (an earlier approach) fixed (a) but broke (b) — it insets the
     padding edge on every cell, not just the selected one, opening an uneven
     gap between every pair of adjacent cells' lines. Every cell now carries a
     visible (not transparent) hairline outline by default, so the grid reads
     as ruled day-by-day. */
  outline: 1px solid var(--ck-rule);
  outline-offset: -1px;
  position: relative;
  cursor: pointer;
}
.cal-days .day.dim {
  color: var(--ck-rule);
}
.cal-days .day.today {
  /* A solid sage fill (darker/more saturated than the pale `--ck-sage-dim`
     tint used previously) so "today" reads clearly against the grid even
     next to a selected day's darker outline. `--ck-card` gives readable
     contrast on top of it in both palettes (light: dark-ish text on a
     mid-tone green; dark: dark text on the brighter dark-palette sage). */
  background: var(--ck-sage);
  color: var(--ck-card);
  font-weight: 600;
}
.cal-days .day.sel {
  /* Selected day needs to stand out from the plain hairline grid, not just
     from a plain cell's outline color — a thicker, high-contrast `--ck-ink`
     outline plus a `--ck-sage-dim` background fill, rather than the earlier
     `--ck-rule` outline-only treatment, which was barely distinguishable
     from the grid lines themselves once every cell got a visible outline. */
  outline: 2px solid var(--ck-ink);
  outline-offset: -2px;
  background: var(--ck-sage-dim);
  font-weight: 600;
}
.cal-days .day.today.sel {
  /* Higher-specificity override so a selected "today" keeps its solid sage
     fill (rather than being replaced by .sel's paler background) while still
     picking up the bolder selection outline. */
  background: var(--ck-sage);
  outline-color: var(--ck-ink);
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
.cal-channel-filter {
  /* Chip markup/CSS itself lives in ChannelFilterChips.vue (shared with
     Codes' channel filter, see calendar-channel-line-filter's design.md
     Decision 8) — this class only positions it under the grid. */
  padding: 4px 20px 10px;
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
