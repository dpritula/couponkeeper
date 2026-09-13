<template>
  <Teleport to="body">
  <div v-if="open" class="form-backdrop" @click.self="handleClose">
    <div class="form-card" role="dialog" aria-modal="true">
      <div class="form-header">
        <div class="form-title font-brand">{{ t('channels.manageTitle') }}</div>
        <button type="button" class="form-close" :aria-label="t('codes.detailClose')" @click="handleClose">×</button>
      </div>

      <div class="channel-list">
        <div v-if="channelsStore.items.length === 0" class="channel-empty">{{ t('channels.empty') }}</div>
        <div v-for="ch in channelsStore.items" :key="ch.key" class="channel-row">
          <span class="channel-swatch" :style="{ background: ch.color }"></span>
          <span class="channel-name">{{ ch.name }}</span>
          <button
            type="button"
            class="channel-delete"
            :aria-label="t('channels.delete')"
            @click="requestDelete(ch)"
          >
            ×
          </button>
        </div>
      </div>

      <div class="form-footer">
        <div class="field">
          <label>{{ t('channels.nameLabel') }}</label>
          <input v-model="name" class="plain-input" :placeholder="t('channels.namePlaceholder')" />
        </div>

        <div class="field">
          <label>{{ t('channels.colorLabel') }}</label>
          <div class="swatch-row">
            <button
              v-for="swatch in swatchPalette"
              :key="swatch"
              type="button"
              class="swatch"
              :class="{ sel: color === swatch }"
              :style="{ background: swatch }"
              :aria-label="swatch"
              @click="color = swatch"
            ></button>
          </div>
        </div>

        <div v-if="errorMessage" class="save-error">{{ errorMessage }}</div>
        <button class="save-btn" type="button" :disabled="saving" @click="save">{{ t('channels.save') }}</button>
      </div>
    </div>
  </div>
  </Teleport>

  <ConfirmDialog
    :open="pendingDelete !== null"
    :title="t('channels.deleteTitle')"
    :message="t('channels.deleteMessage', { name: pendingDelete?.name })"
    :confirm-label="t('channels.deleteConfirm')"
    :cancel-label="t('channels.deleteCancel')"
    @confirm="confirmDelete"
    @cancel="pendingDelete = null"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { DuplicateChannelNameError } from '@/db/queries/channels';
import type { ChannelRow } from '@/db/schema';
import { useChannelsStore } from '@/stores/channels';

defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: [] }>();

const { t } = useI18n();
const channelsStore = useChannelsStore();

// Extends the app's existing sage/sienna/instagram-purple accents with a few
// more hues in the same warm/muted register (see design.md Decision 3) —
// a curated set rather than an open-ended color picker.
const swatchPalette = [
  '#4c7a5d',
  '#b8562f',
  '#8a6dab',
  '#3d6b8a',
  '#a68b3c',
  '#7a4c6a',
  '#5c8a4c',
  '#8a4c4c'
];

const name = ref('');
const color = ref(swatchPalette[0]);
const saving = ref(false);
const errorMessage = ref('');
const pendingDelete = ref<ChannelRow | null>(null);

function handleClose() {
  emit('close');
}

function requestDelete(channel: ChannelRow) {
  pendingDelete.value = channel;
}

async function confirmDelete() {
  if (!pendingDelete.value) return;
  await channelsStore.remove(pendingDelete.value.key);
  pendingDelete.value = null;
}

async function save() {
  errorMessage.value = '';
  saving.value = true;
  try {
    await channelsStore.create({ name: name.value.trim(), color: color.value });
    name.value = '';
    color.value = swatchPalette[0];
  } catch (error) {
    errorMessage.value = error instanceof DuplicateChannelNameError ? t('channels.duplicateError') : t('channels.saveError');
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
.channel-list {
  flex: 1;
  overflow-y: auto;
  min-height: 80px;
  max-height: 38vh;
  padding: 10px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.channel-empty {
  font-family: 'Inter', sans-serif;
  font-size: 12.5px;
  color: var(--ck-muted);
  padding: 10px 2px;
}
.channel-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--ck-rule);
  border-radius: 9px;
  background: var(--ck-card);
}
.channel-swatch {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.channel-name {
  flex: 1;
  font-family: 'Inter', sans-serif;
  font-size: 13.5px;
  color: var(--ck-ink);
}
.channel-delete {
  font-size: 18px;
  line-height: 1;
  font-family: 'Inter', sans-serif;
  color: var(--ck-muted);
  background: transparent;
  border: none;
  padding: 2px 2px 4px;
  cursor: pointer;
}
.channel-delete:active {
  color: var(--ck-sienna);
}
.form-footer {
  flex-shrink: 0;
  padding: 14px 20px calc(env(safe-area-inset-bottom) + 14px);
  border-top: 1px solid var(--ck-rule);
  background: var(--ck-paper);
}
.field {
  margin-bottom: 14px;
}
.field label {
  display: block;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: var(--ck-muted);
  margin-bottom: 7px;
}
.plain-input {
  width: 100%;
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  padding: 11px 12px;
  border-radius: 9px;
  border: 1px solid var(--ck-rule);
  background: var(--ck-card);
  color: var(--ck-ink);
}
.swatch-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.swatch {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
}
.swatch.sel {
  border-color: var(--ck-ink);
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
