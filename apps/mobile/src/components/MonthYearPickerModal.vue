<template>
  <Teleport to="body">
  <div v-if="open" class="picker-backdrop" @click.self="handleClose">
    <div class="picker-card" role="dialog" aria-modal="true">
      <div class="picker-header">
        <div class="picker-title font-brand">{{ t('calendar.pickerTitle') }}</div>
        <button type="button" class="picker-close" :aria-label="t('codes.detailClose')" @click="handleClose">×</button>
      </div>

      <div class="picker-body">
        <div class="year-row">
          <button
            v-for="year in years"
            :key="year"
            ref="yearChipEls"
            type="button"
            class="year-chip"
            :class="{ on: year === pickerYear }"
            @click="pickerYear = year"
          >
            {{ year }}
          </button>
        </div>

        <div class="month-grid">
          <button
            v-for="(label, index) in monthLabels"
            :key="label"
            type="button"
            class="month-cell"
            :class="{ on: isCurrentSelection(index) }"
            @click="selectMonth(index)"
          >
            {{ label }}
          </button>
        </div>
      </div>
    </div>
  </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { VisibleMonth } from '@/utils/calendar';

const props = defineProps<{ open: boolean; visibleMonth: VisibleMonth }>();
const emit = defineEmits<{ select: [VisibleMonth]; close: [] }>();
const { t } = useI18n();

const pickerYear = ref(props.visibleMonth.year);
const yearChipEls = ref<HTMLElement[]>([]);

const YEAR_SPAN = 12;
const years = computed(() => {
  const center = props.visibleMonth.year;
  return Array.from({ length: YEAR_SPAN * 2 + 1 }, (_, i) => center - YEAR_SPAN + i);
});

// Re-center the year selector on the visible month every time the popup is
// (re)opened, rather than leaving it wherever it was last left scrolled to
// (design.md Decision 4).
watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) return;
    pickerYear.value = props.visibleMonth.year;
    await nextTick();
    const index = years.value.indexOf(props.visibleMonth.year);
    yearChipEls.value[index]?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }
);

const monthLabels = Array.from({ length: 12 }, (_, i) =>
  new Intl.DateTimeFormat('en', { month: 'short' }).format(new Date(2000, i, 1))
);

function isCurrentSelection(monthIndex: number): boolean {
  return pickerYear.value === props.visibleMonth.year && monthIndex + 1 === props.visibleMonth.month;
}

function selectMonth(monthIndex: number) {
  emit('select', { year: pickerYear.value, month: monthIndex + 1 });
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
  z-index: 1000;
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
.year-row {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 4px;
  margin-bottom: 18px;
}
.year-chip {
  flex-shrink: 0;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 500;
  padding: 7px 14px;
  border-radius: 100px;
  background: var(--ck-card);
  border: 1px solid var(--ck-rule);
  color: var(--ck-muted);
  white-space: nowrap;
}
.year-chip.on {
  background: var(--ck-sage);
  border-color: var(--ck-sage);
  color: #fff;
  font-weight: 600;
}
.month-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
.month-cell {
  padding: 14px 0;
  border-radius: 10px;
  background: var(--ck-card);
  border: 1px solid var(--ck-rule);
  font-family: 'Inter', sans-serif;
  font-size: 13.5px;
  font-weight: 500;
  color: var(--ck-ink);
}
.month-cell.on {
  background: var(--ck-sage);
  border-color: var(--ck-sage);
  color: #fff;
  font-weight: 600;
}
</style>
