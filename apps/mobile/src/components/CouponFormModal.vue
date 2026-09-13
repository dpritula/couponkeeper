<template>
  <Teleport to="body">
  <div v-if="open" class="form-backdrop" @click.self="handleClose">
    <div class="form-card" role="dialog" aria-modal="true">
      <div class="form-header">
        <div class="form-title font-brand">{{ t('form.newTitle') }}</div>
        <button type="button" class="form-close" :aria-label="t('codes.detailClose')" @click="handleClose">×</button>
      </div>

      <div class="form-body">
        <div class="field">
          <label>{{ t('form.code') }}</label>
          <div class="code-input-row">
            <input v-model="code" class="mono-input" />
            <button class="gen-btn" type="button" @click="generateCode">{{ t('form.generate') }}</button>
          </div>
        </div>

        <div class="field">
          <label>{{ t('form.channel') }}</label>
          <div class="chan-row">
            <button
              v-for="ch in channelsStore.items"
              :key="ch.key"
              type="button"
              class="chan-pick"
              :class="{ sel: channel === ch.key }"
              @click="channel = ch.key"
            >
              {{ ch.name }}
            </button>
          </div>
        </div>

        <div class="field">
          <label>{{ t('form.discountType') }}</label>
          <div class="segmented">
            <div
              v-for="opt in discountOptions"
              :key="opt.value"
              class="segment"
              :class="{ sel: discountType === opt.value }"
              @click="discountType = opt.value"
            >
              {{ opt.label }}
            </div>
          </div>
        </div>

        <div class="field">
          <label>{{ t('form.value') }}</label>
          <input v-model="value" class="plain-input" />
        </div>

        <div class="date-row">
          <div class="field">
            <label>{{ t('form.start') }}</label>
            <input v-model="startDate" class="plain-input" />
          </div>
          <div class="field">
            <label>{{ t('form.end') }}</label>
            <input v-model="endDate" class="plain-input" />
          </div>
        </div>

        <div class="field">
          <label>{{ t('form.usageLimit') }}</label>
          <input v-model="usageLimit" class="plain-input muted-input" :placeholder="t('form.usageLimitPlaceholder')" />
        </div>

        <div class="field">
          <label>{{ t('form.note') }}</label>
          <textarea v-model="note" class="plain-input" rows="2"></textarea>
        </div>
      </div>

      <div class="form-footer">
        <div v-if="errorMessage" class="save-error">{{ errorMessage }}</div>
        <button class="save-btn" type="button" :disabled="saving" @click="save">{{ t('form.save') }}</button>
      </div>
    </div>
  </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { DiscountType } from '@/data/promoCode';
import { parseDisplayDate } from '@/utils/date';
import { useChannelsStore } from '@/stores/channels';
import { useCouponsStore } from '@/stores/coupons';

defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: [] }>();

const { t } = useI18n();
const couponsStore = useCouponsStore();
const channelsStore = useChannelsStore();

const discountOptions: { value: DiscountType; label: string }[] = [
  { value: 'percent', label: t('form.discountPercent') },
  { value: 'amount', label: t('form.discountAmount') },
  { value: 'shipping', label: t('form.discountShipping') }
];

// Ported from the mockup's example values — just the form's starting point, not tied to any existing coupon.
// `open` is v-if'd, so the component (and these refs) are recreated fresh each time the modal opens.
const code = ref('ETSYFALL9');
const channel = ref<string>(channelsStore.items[0]?.key ?? '');
const discountType = ref<DiscountType>('amount');
const value = ref('$5');
const startDate = ref('05.09.2026');
const endDate = ref('15.09.2026');
const usageLimit = ref('');
const note = ref('Fall sale for Etsy subscribers');

const saving = ref(false);
const errorMessage = ref('');

function generateCode() {
  code.value = Math.random().toString(36).slice(2, 10).toUpperCase();
}

function handleClose() {
  emit('close');
}

async function save() {
  errorMessage.value = '';
  saving.value = true;
  try {
    const usageLimitValue = usageLimit.value.trim() ? Number(usageLimit.value) : undefined;
    await couponsStore.create({
      code: code.value.trim(),
      channelKey: channel.value,
      discountType: discountType.value,
      value: value.value.trim(),
      startDate: parseDisplayDate(startDate.value),
      endDate: parseDisplayDate(endDate.value),
      usageLimit: usageLimitValue != null && !Number.isNaN(usageLimitValue) ? usageLimitValue : undefined,
      note: note.value.trim() || undefined
    });
    emit('close');
  } catch (error) {
    console.error('Failed to save coupon', error);
    errorMessage.value = t('form.saveError');
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.form-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(31, 42, 36, 0.45);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
}
.form-card {
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  background: var(--ck-paper);
  border-radius: 20px 20px 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.form-header {
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
.form-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--ck-ink);
}
.form-close {
  font-size: 20px;
  line-height: 1;
  color: var(--ck-muted);
  background: transparent;
  border: none;
  padding: 2px 2px 4px;
  cursor: pointer;
}
.form-close:active {
  color: var(--ck-sienna);
}
.form-body {
  flex: 1;
  overflow-y: auto;
  padding: 18px 20px 8px;
}
.field {
  margin-bottom: 18px;
  flex: 1;
}
.field label {
  display: block;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: var(--ck-muted);
  margin-bottom: 7px;
}
.code-input-row {
  display: flex;
  gap: 8px;
}
.code-input-row input {
  flex: 1;
}
input,
textarea {
  width: 100%;
  font-size: 15px;
  padding: 11px 12px;
  border-radius: 9px;
  border: 1px solid var(--ck-rule);
  background: var(--ck-card);
  color: var(--ck-ink);
}
.mono-input {
  font-family: 'IBM Plex Mono', monospace;
}
.plain-input {
  font-family: 'Inter', sans-serif;
}
.muted-input::placeholder {
  color: var(--ck-muted);
}
textarea {
  font-family: 'Inter', sans-serif;
  font-size: 13.5px;
  resize: none;
}
.gen-btn {
  font-family: 'Inter', sans-serif;
  font-size: 12.5px;
  font-weight: 600;
  padding: 0 14px;
  border-radius: 9px;
  border: 1px solid var(--ck-ink);
  background: transparent;
  color: var(--ck-ink);
  white-space: nowrap;
}
.segmented {
  display: flex;
  border: 1px solid var(--ck-rule);
  border-radius: 9px;
  overflow: hidden;
}
.segment {
  flex: 1;
  text-align: center;
  font-family: 'Inter', sans-serif;
  font-size: 12.5px;
  font-weight: 500;
  padding: 9px 4px;
  color: var(--ck-muted);
  border-right: 1px solid var(--ck-rule);
  cursor: pointer;
}
.segment:last-child {
  border-right: none;
}
.segment.sel {
  background: var(--ck-ink);
  color: var(--ck-paper);
  font-weight: 600;
}
.chan-row {
  display: flex;
  gap: 8px;
  overflow-x: auto;
}
.chan-pick {
  flex-shrink: 0;
  min-width: 84px;
  text-align: center;
  padding: 10px 10px;
  border: 1px solid var(--ck-rule);
  border-radius: 9px;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: var(--ck-muted);
  background: transparent;
  white-space: nowrap;
}
.chan-pick.sel {
  border-color: var(--ck-sage);
  color: var(--ck-sage);
  background: var(--ck-sage-dim);
  font-weight: 600;
}
.date-row {
  display: flex;
  gap: 8px;
}
.form-footer {
  /* Pinned to the bottom of the popup, not the viewport — flex-shrink: 0 in
     the card's flex column, always visible under whatever the scrollable
     body's current scroll position is. */
  flex-shrink: 0;
  padding: 14px 20px calc(env(safe-area-inset-bottom) + 14px);
  border-top: 1px solid var(--ck-rule);
  background: var(--ck-paper);
}
.save-error {
  font-family: 'Inter', sans-serif;
  font-size: 12.5px;
  color: var(--ck-sienna);
  margin-bottom: 10px;
}
.save-btn {
  width: 100%;
  padding: 14px;
  border-radius: 11px;
  background: var(--ck-sage);
  color: #fff;
  text-align: center;
  font-family: 'Inter', sans-serif;
  font-size: 14.5px;
  font-weight: 600;
  border: none;
}
.save-btn:disabled {
  opacity: 0.6;
}
</style>
