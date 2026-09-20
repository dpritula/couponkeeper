<template>
  <div class="chip-row">
    <div class="chips">
      <button class="chip" :class="{ on: channelFilter === 'all' }" @click="$emit('update:channelFilter', 'all')">
        {{ t('codes.filterAll') }}
      </button>
      <button
        v-for="channel in channels"
        :key="channel.key"
        class="chip"
        :class="{ on: channelFilter === channel.key }"
        @click="$emit('update:channelFilter', channel.key)"
      >
        {{ channel.name }}
      </button>
    </div>
    <slot name="channel-extra" />
  </div>

  <div class="toolbar">
    <select class="sort-select" :value="sortValue" @change="onSortChange">
      <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
    </select>
    <button
      v-for="status in statusOptions"
      :key="status.value"
      type="button"
      class="filter-chip"
      :class="{ on: statusFilter.includes(status.value) }"
      @click="$emit('toggle-status', status.value)"
    >
      {{ status.label }}
    </button>
    <button
      v-for="discount in discountOptions"
      :key="discount.value"
      type="button"
      class="filter-chip"
      :class="{ on: discountTypeFilter.includes(discount.value) }"
      @click="$emit('toggle-discount', discount.value)"
    >
      {{ discount.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { CouponSortField, SortDirection } from '@/db/queries/coupons';
import type { ChannelRow, CouponRow } from '@/db/schema';
import { getCouponSortOptions } from '@/utils/couponSort';

const props = defineProps<{
  channels: ChannelRow[];
  /** A channel `key`, or 'all' for no channel restriction. */
  channelFilter: string;
  statusFilter: CouponRow['status'][];
  discountTypeFilter: CouponRow['discountType'][];
  sortBy: CouponSortField;
  sortDir: SortDirection;
}>();

const { t } = useI18n();

const sortOptions = computed(() => getCouponSortOptions());

const statusOptions: { value: CouponRow['status']; label: string }[] = [
  { value: 'notStarted', label: t('status.notStarted') },
  { value: 'active', label: t('status.active') },
  { value: 'soon', label: t('status.soon') },
  { value: 'expired', label: t('status.expired') }
];

const discountOptions: { value: CouponRow['discountType']; label: string }[] = [
  { value: 'percent', label: t('form.discountPercent') },
  { value: 'amount', label: t('form.discountAmount') },
  { value: 'shipping', label: t('form.discountShipping') }
];

const sortValue = computed(() => `${props.sortBy}:${props.sortDir}`);

const emit = defineEmits<{
  'update:channelFilter': [string];
  'toggle-status': [CouponRow['status']];
  'toggle-discount': [CouponRow['discountType']];
  'update:sort': [{ sortBy: CouponSortField; sortDir: SortDirection }];
}>();

function onSortChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value;
  const option = sortOptions.value.find((opt) => opt.value === value);
  if (option) emit('update:sort', { sortBy: option.sortBy, sortDir: option.sortDir });
}
</script>

<style scoped>
.chip-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.chips {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  flex: 1;
  min-width: 0;
}
.chip {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 500;
  padding: 6px 13px;
  border-radius: 100px;
  background: var(--ck-card);
  border: 1px solid var(--ck-rule);
  white-space: nowrap;
  color: var(--ck-muted);
  flex-shrink: 0;
}
.chip.on {
  background: var(--ck-sage);
  border-color: var(--ck-sage);
  color: #fff;
}
.toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow-x: auto;
  margin-top: 8px;
}
.sort-select {
  flex-shrink: 0;
  font-family: 'Inter', sans-serif;
  font-size: 11.5px;
  font-weight: 500;
  padding: 6px 10px;
  border-radius: 100px;
  background: var(--ck-card);
  border: 1px solid var(--ck-rule);
  color: var(--ck-ink);
}
.filter-chip {
  font-family: 'Inter', sans-serif;
  font-size: 11.5px;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 100px;
  background: var(--ck-card);
  border: 1px solid var(--ck-rule);
  white-space: nowrap;
  color: var(--ck-muted);
  flex-shrink: 0;
}
.filter-chip.on {
  background: var(--ck-sienna-dim);
  border-color: var(--ck-sienna);
  color: var(--ck-sienna);
}
</style>
