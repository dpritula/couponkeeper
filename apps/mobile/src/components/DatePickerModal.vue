<template>
  <Teleport to="body">
  <div v-if="open" class="picker-backdrop" @click.self="handleClose">
    <div class="picker-card" role="dialog" aria-modal="true">
      <div class="picker-header">
        <div class="picker-title font-brand">{{ title }}</div>
        <button type="button" class="picker-close" :aria-label="t('codes.detailClose')" @click="handleClose">×</button>
      </div>

      <div class="picker-body">
        <div class="picker-nav">
          <button type="button" class="nav-arrow" :aria-label="t('calendar.prevMonth')" @click="goToPrevMonth">‹</button>
          <div class="nav-label">{{ monthLabel }}</div>
          <button type="button" class="nav-arrow" :aria-label="t('calendar.nextMonth')" @click="goToNextMonth">›</button>
        </div>

        <div class="picker-dow">
          <div v-for="wd in weekdays" :key="wd">{{ wd }}</div>
        </div>
        <div class="picker-days">
          <button
            v-for="cell in monthGrid"
            :key="cell.date"
            type="button"
            class="day"
            :class="{ dim: cell.dim, today: cell.date === today, sel: cell.date === modelValue }"
            @click="selectDay(cell)"
          >
            {{ cell.day }}
          </button>
        </div>
      </div>
    </div>
  </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { addMonths, getMonthGrid, todayIsoDate, visibleMonthFromIsoDate, type CalendarDayCell, type VisibleMonth } from '@/utils/calendar';

const props = defineProps<{ open: boolean; modelValue: string; title: string }>();
const emit = defineEmits<{ select: [string]; close: [] }>();
const { t, tm } = useI18n();

const today = todayIsoDate();
const weekdays = computed(() => tm('calendar.weekdays') as string[]);

const visibleMonth = ref<VisibleMonth>(visibleMonthFromIsoDate(props.modelValue || today));

// Re-center on the field's current value every time the picker (re)opens,
// rather than leaving it wherever a previous field's picker last scrolled to
// (same reasoning as MonthYearPickerModal's re-centering).
watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return;
    visibleMonth.value = visibleMonthFromIsoDate(props.modelValue || today);
  }
);

const monthGrid = computed(() => getMonthGrid(visibleMonth.value));
const monthLabel = computed(() =>
  new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(
    new Date(visibleMonth.value.year, visibleMonth.value.month - 1, 1)
  )
);

function goToPrevMonth() {
  visibleMonth.value = addMonths(visibleMonth.value, -1);
}

function goToNextMonth() {
  visibleMonth.value = addMonths(visibleMonth.value, 1);
}

function selectDay(cell: CalendarDayCell) {
  emit('select', cell.date);
}

function handleClose() {
  emit('close');
}
</script>

<style scoped>
.picker-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(31, 42, 36, 0.45);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1100;
}
.picker-card {
  width: 100%;
  max-width: 480px;
  max-height: 80vh;
  background: var(--ck-paper);
  border-radius: 20px 20px 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.picker-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  border-bottom: 1px solid var(--ck-rule);
  box-shadow: 0 2px 6px rgba(31, 42, 36, 0.08);
  position: relative;
  z-index: 1;
}
.picker-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--ck-ink);
}
.picker-close {
  font-size: 20px;
  line-height: 1;
  color: var(--ck-muted);
  background: transparent;
  border: none;
  padding: 2px 2px 4px;
  cursor: pointer;
}
.picker-close:active {
  color: var(--ck-sienna);
}
.picker-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px calc(env(safe-area-inset-bottom) + 20px);
}
.picker-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
  margin-bottom: 14px;
}
.nav-arrow {
  background: transparent;
  border: none;
  padding: 4px 8px;
  font-size: 16px;
  line-height: 1;
  color: var(--ck-muted);
  cursor: pointer;
}
.nav-arrow:active {
  color: var(--ck-ink);
}
.nav-label {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: var(--ck-ink);
  min-width: 140px;
  text-align: center;
}
.picker-dow {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 6px;
}
.picker-dow div {
  text-align: center;
  font-family: 'Inter', sans-serif;
  font-size: 10.5px;
  font-weight: 600;
  color: var(--ck-muted);
}
.picker-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  row-gap: 6px;
}
.picker-days .day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: var(--ck-ink);
  background: transparent;
  border: none;
  border-radius: 50%;
  cursor: pointer;
}
.picker-days .day.dim {
  color: var(--ck-rule);
}
.picker-days .day.today {
  background: var(--ck-sage-dim);
  color: var(--ck-sage);
  font-weight: 600;
}
.picker-days .day.sel {
  background: var(--ck-sage);
  color: #fff;
  font-weight: 600;
}
</style>
