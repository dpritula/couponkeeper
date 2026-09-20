<template>
  <div class="code-card" :class="{ 'is-expired': code.status === 'expired' }" @click="$emit('select')">
    <div class="row1">
      <div class="code-str">{{ code.code }}</div>
      <div class="row1-right">
        <div class="badge" :class="`badge-${code.status}`">{{ t(`status.${code.status}`) }}</div>
        <button
          v-if="deletable"
          type="button"
          class="delete-btn"
          :aria-label="t('codes.delete')"
          @click.stop="$emit('delete')"
        >
          ×
        </button>
      </div>
    </div>
    <div class="row2">
      <span v-if="code.channel" class="channel-tag">
        <span class="dot" :style="{ background: code.channel.color }"></span>
        {{ code.channel.name }}
      </span>
      <span v-else class="channel-tag">{{ t('codes.noChannel') }}</span>
      <span class="value">{{ code.value }}</span>
    </div>
    <div class="row2 row2-secondary">
      <span>{{ dateLabel }}</span>
      <span>{{ detailLabel }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { PromoCode } from '@/data/promoCode';
import { formatShortDate } from '@/utils/date';

const props = defineProps<{ code: PromoCode; deletable?: boolean }>();
defineEmits<{ delete: []; select: [] }>();
const { t } = useI18n();

const dateLabel = computed(() => {
  if (props.code.status === 'notStarted') {
    return t('codes.startsOn', { date: formatShortDate(props.code.startDate) });
  }
  const date = formatShortDate(props.code.endDate);
  if (props.code.status === 'expired') return t('codes.ended', { date });
  if (props.code.status === 'soon' && props.code.daysLeft != null) {
    return t('codes.untilWithDays', { date, days: props.code.daysLeft });
  }
  return t('codes.until', { date });
});

const detailLabel = computed(() => {
  if (props.code.note) return t('codes.forFollowers', { handle: props.code.note });
  if (props.code.usageLimit != null) {
    return t('codes.usage', { count: props.code.usageCount, limit: props.code.usageLimit });
  }
  return t('codes.usageUnlimited', { count: props.code.usageCount });
});
</script>

<style scoped>
.code-card {
  background: var(--ck-card);
  border: 1px solid var(--ck-rule);
  border-radius: 12px;
  padding: 14px 16px;
  cursor: pointer;
}
.code-card.is-expired {
  opacity: 0.55;
}
.row1 {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}
.code-str {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--ck-ink);
}
.row1-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.badge {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 100px;
  flex-shrink: 0;
}
.delete-btn {
  font-size: 18px;
  line-height: 1;
  font-family: 'Inter', sans-serif;
  color: var(--ck-muted);
  background: transparent;
  border: none;
  padding: 2px 2px 4px;
  cursor: pointer;
}
.delete-btn:active {
  color: var(--ck-sienna);
}
.badge-notStarted {
  background: var(--ck-rule);
  color: var(--ck-muted);
}
.badge-active {
  background: var(--ck-sage-dim);
  color: var(--ck-sage);
}
.badge-soon {
  background: var(--ck-sienna-dim);
  color: var(--ck-sienna);
}
.badge-expired {
  background: var(--ck-expired-bg);
  color: var(--ck-muted);
}
.row2 {
  display: flex;
  justify-content: space-between;
  font-size: 12.5px;
  color: var(--ck-muted);
}
.row2-secondary {
  margin-top: 4px;
}
.value {
  font-weight: 600;
  color: var(--ck-ink);
}
.channel-tag {
  font-size: 11px;
  color: var(--ck-muted);
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
</style>
