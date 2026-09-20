<template>
  <Teleport to="body">
  <div v-if="open" class="form-backdrop" @click.self="handleClose">
    <div class="form-card" role="dialog" aria-modal="true">
      <div class="form-header">
        <div class="form-title font-brand">{{ mode === 'edit' ? t('form.editTitle') : t('form.newTitle') }}</div>
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
            <button type="button" class="date-input" @click="showStartPicker = true">
              {{ startDate ? formatShortDate(startDate) : t('form.datePlaceholder') }}
            </button>
          </div>
          <div class="field">
            <label>{{ t('form.end') }}</label>
            <button type="button" class="date-input" @click="showEndPicker = true">
              {{ endDate ? formatShortDate(endDate) : t('form.datePlaceholder') }}
            </button>
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

  <DatePickerModal
    :open="showStartPicker"
    :model-value="startDate"
    :title="t('form.start')"
    @select="onStartDateSelect"
    @close="showStartPicker = false"
  />
  <DatePickerModal
    :open="showEndPicker"
    :model-value="endDate"
    :title="t('form.end')"
    @select="onEndDateSelect"
    @close="showEndPicker = false"
  />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { DiscountType, PromoCode } from '@/data/promoCode';
import { formatShortDate } from '@/utils/date';
import { DuplicateCouponCodeError } from '@/db/queries/coupons';
import DatePickerModal from '@/components/DatePickerModal.vue';
import { useChannelsStore } from '@/stores/channels';
import { useCouponsStore } from '@/stores/coupons';

const props = defineProps<{ open: boolean; coupon?: PromoCode | null }>();
const emit = defineEmits<{ close: [] }>();

const { t } = useI18n();
const couponsStore = useCouponsStore();
const channelsStore = useChannelsStore();

const mode = computed<'create' | 'edit'>(() => (props.coupon ? 'edit' : 'create'));

const discountOptions: { value: DiscountType; label: string }[] = [
  { value: 'percent', label: t('form.discountPercent') },
  { value: 'amount', label: t('form.discountAmount') },
  { value: 'shipping', label: t('form.discountShipping') }
];

// In edit mode, every field starts from `props.coupon`'s current values. In
// create mode, these are the mockup's ported example values — just the
// form's starting point, not tied to any existing coupon. These refs are
// only initialized once per component *instance*, so the parent is
// responsible for keying this component itself (not just this internal
// `v-if="open"`) so it remounts — and these refs re-initialize from fresh
// props — every time the modal opens or switches to a different coupon.
const code = ref(props.coupon?.code ?? 'ETSYFALL9');
const channel = ref<string>(props.coupon?.channel?.key ?? channelsStore.items[0]?.key ?? '');
const discountType = ref<DiscountType>(props.coupon?.discountType ?? 'amount');
const value = ref(props.coupon?.value ?? '$5');
const startDate = ref(props.coupon?.startDate ?? '2026-09-05');
const endDate = ref(props.coupon?.endDate ?? '2026-09-15');
const usageLimit = ref(props.coupon?.usageLimit != null ? String(props.coupon.usageLimit) : '');
const note = ref(props.coupon?.note ?? (props.coupon ? '' : 'Fall sale for Etsy subscribers'));

const saving = ref(false);
const errorMessage = ref('');
const showStartPicker = ref(false);
const showEndPicker = ref(false);

function generateCode() {
  code.value = Math.random().toString(36).slice(2, 10).toUpperCase();
}

function onStartDateSelect(date: string) {
  startDate.value = date;
  showStartPicker.value = false;
}

function onEndDateSelect(date: string) {
  endDate.value = date;
  showEndPicker.value = false;
}

function handleClose() {
  emit('close');
}

/** Every current field-validation problem, in plain language — checked synchronously, before any storage call. */
function validate(): string[] {
  const problems: string[] = [];
  if (!code.value.trim()) problems.push(t('form.errorCodeRequired'));
  if (!channel.value) problems.push(t('form.errorChannelRequired'));
  if (!discountType.value) problems.push(t('form.errorDiscountTypeRequired'));
  if (!value.value.trim()) problems.push(t('form.errorValueRequired'));
  if (!startDate.value) problems.push(t('form.errorStartRequired'));
  if (!endDate.value) problems.push(t('form.errorEndRequired'));
  if (startDate.value && endDate.value && endDate.value < startDate.value) {
    problems.push(t('form.errorEndBeforeStart'));
  }
  return problems;
}

async function save() {
  errorMessage.value = '';

  const problems = validate();
  if (problems.length) {
    errorMessage.value = problems.join(' ');
    return;
  }

  saving.value = true;
  try {
    const usageLimitValue = usageLimit.value.trim() ? Number(usageLimit.value) : undefined;
    const input = {
      code: code.value.trim(),
      channelKey: channel.value,
      discountType: discountType.value,
      value: value.value.trim(),
      startDate: startDate.value,
      endDate: endDate.value,
      usageLimit: usageLimitValue != null && !Number.isNaN(usageLimitValue) ? usageLimitValue : undefined,
      note: note.value.trim() || undefined
    };

    if (mode.value === 'edit' && props.coupon) {
      await couponsStore.update(props.coupon.code, input);
    } else {
      await couponsStore.create(input);
    }
    emit('close');
  } catch (error) {
    if (error instanceof DuplicateCouponCodeError) {
      errorMessage.value = t('form.errorDuplicateCode');
    } else {
      console.error('Failed to save coupon', error);
      errorMessage.value = t('form.saveError');
    }
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
.date-input {
  width: 100%;
  font-size: 15px;
  padding: 11px 12px;
  border-radius: 9px;
  border: 1px solid var(--ck-rule);
  background: var(--ck-card);
  color: var(--ck-ink);
  font-family: 'Inter', sans-serif;
  text-align: left;
  cursor: pointer;
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
