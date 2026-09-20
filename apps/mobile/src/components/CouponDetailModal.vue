<template>
  <Teleport to="body">
  <div v-if="code" class="detail-backdrop" @click.self="$emit('close')">
    <div class="detail-card" role="dialog" aria-modal="true">
      <div class="detail-header">
        <div class="detail-code">{{ code.code }}</div>
        <div class="detail-header-actions">
          <button type="button" class="detail-edit" :aria-label="t('codes.detailEdit')" @click="$emit('edit', code)">
            <ion-icon :icon="pencil" />
          </button>
          <button type="button" class="detail-close" :aria-label="t('codes.detailClose')" @click="$emit('close')">×</button>
        </div>
      </div>

      <div class="detail-body">
        <div class="detail-row">
          <div class="detail-label">{{ t('codes.detailStatus') }}</div>
          <div class="detail-value">
            <span class="badge" :class="`badge-${code.status}`">{{ t(`status.${code.status}`) }}</span>
          </div>
        </div>
        <div class="detail-row">
          <div class="detail-label">{{ t('codes.detailChannel') }}</div>
          <div class="detail-value">
            <template v-if="code.channel">
              <span class="dot" :style="{ background: code.channel.color }"></span>
              {{ code.channel.name }}
            </template>
            <template v-else>{{ t('codes.noChannel') }}</template>
          </div>
        </div>
        <div class="detail-row">
          <div class="detail-label">{{ t('codes.detailDiscountType') }}</div>
          <div class="detail-value">{{ discountTypeLabel }}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">{{ t('codes.detailValue') }}</div>
          <div class="detail-value mono">{{ code.value }}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">{{ t('codes.detailStart') }}</div>
          <div class="detail-value">{{ formatFullDate(code.startDate) }}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">{{ t('codes.detailEnd') }}</div>
          <div class="detail-value">{{ formatFullDate(code.endDate) }}</div>
        </div>
        <div class="detail-row" v-if="code.daysLeft != null">
          <div class="detail-label">{{ t('codes.detailDaysLeft') }}</div>
          <div class="detail-value">{{ code.daysLeft }}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">{{ t('codes.detailUsageLimit') }}</div>
          <div class="detail-value">{{ code.usageLimit ?? t('form.usageLimitPlaceholder') }}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">{{ t('codes.detailUsageCount') }}</div>
          <div class="detail-value">{{ code.usageCount }}</div>
        </div>
        <div class="detail-row" v-if="code.note">
          <div class="detail-label">{{ t('codes.detailNote') }}</div>
          <div class="detail-value">{{ code.note }}</div>
        </div>
      </div>
    </div>
  </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { IonIcon } from '@ionic/vue';
import { pencil } from 'ionicons/icons';
import type { PromoCode } from '@/data/promoCode';
import { formatFullDate } from '@/utils/date';

const props = defineProps<{ code: PromoCode | null }>();
defineEmits<{ close: []; edit: [PromoCode] }>();
const { t } = useI18n();

const discountTypeLabel = computed(() => {
  if (!props.code) return '';
  const key = { percent: 'form.discountPercent', amount: 'form.discountAmount', shipping: 'form.discountShipping' }[
    props.code.discountType
  ];
  return t(key);
});
</script>

<style scoped>
.detail-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(31, 42, 36, 0.45);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
}
.detail-card {
  width: 100%;
  max-width: 480px;
  max-height: 80vh;
  background: var(--ck-card);
  border-radius: 20px 20px 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.detail-header {
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
.detail-code {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--ck-ink);
}
.detail-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.detail-edit {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  font-size: 16px;
  color: var(--ck-sage);
  background: var(--ck-sage-dim);
  border: none;
  cursor: pointer;
}
.detail-edit:active {
  background: var(--ck-sage);
  color: #fff;
}
.detail-close {
  font-size: 20px;
  line-height: 1;
  color: var(--ck-muted);
  background: transparent;
  border: none;
  padding: 2px 2px 4px;
  cursor: pointer;
}
.detail-close:active {
  color: var(--ck-sienna);
}
.detail-body {
  flex: 1;
  overflow-y: auto;
  padding: 4px 20px 28px;
}
.detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 13px 0;
  border-bottom: 1px solid var(--ck-rule);
}
.detail-row:last-child {
  border-bottom: none;
}
.detail-label {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: var(--ck-muted);
  flex-shrink: 0;
}
.detail-value {
  font-family: 'Inter', sans-serif;
  font-size: 14.5px;
  color: var(--ck-ink);
  text-align: right;
  display: flex;
  align-items: center;
  gap: 6px;
}
.detail-value.mono {
  font-family: 'IBM Plex Mono', monospace;
}
.badge {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 100px;
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
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
</style>
