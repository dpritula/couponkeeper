<template>
  <div class="channel-filter-chips" :class="{ nowrap: !wrap }">
    <button type="button" class="filter-chip" :class="{ on: selected.size === 0 }" @click="$emit('select-all')">
      {{ t('codes.filterAll') }}
    </button>
    <button
      v-for="channel in channels"
      :key="channel.key"
      type="button"
      class="filter-chip channel-chip"
      :class="{ on: selected.has(channel.key) }"
      :style="{ '--chip-color': channel.color }"
      @click="$emit('toggle', channel.key)"
    >
      <span class="dot" :style="{ background: channel.color }"></span>{{ channel.name }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { ChannelRow } from '@/db/schema';

withDefaults(
  defineProps<{
    channels: ChannelRow[];
    /** The set of explicitly selected channel keys; empty means "All" (no restriction). */
    selected: Set<string>;
    /** Wrap to multiple lines (Calendar's usage, with room to spare) vs. scroll horizontally in one line (Codes' toolbar usage, alongside its manage-channels button). */
    wrap?: boolean;
  }>(),
  { wrap: true }
);

defineEmits<{
  toggle: [string];
  'select-all': [];
}>();

const { t } = useI18n();
</script>

<style scoped>
.channel-filter-chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.channel-filter-chips.nowrap {
  flex-wrap: nowrap;
  overflow-x: auto;
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
  display: inline-flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
}
.filter-chip.on {
  background: var(--ck-sienna-dim);
  border-color: var(--ck-sienna);
  color: var(--ck-sienna);
}
/* A channel chip's "on" state uses that channel's own stored color
   (--chip-color) instead of the generic sienna every other filter-chip
   uses, so the chip visually matches its channel's grid indicator-line /
   dot color everywhere else in the app. */
.channel-chip.on {
  border-color: var(--chip-color);
  color: var(--chip-color);
}
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
</style>
