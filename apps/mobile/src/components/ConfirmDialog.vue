<template>
  <Teleport to="body">
  <div v-if="open" class="confirm-backdrop" @click.self="$emit('cancel')">
    <div class="confirm-card" role="alertdialog" aria-modal="true">
      <div class="confirm-title font-brand">{{ title }}</div>
      <div class="confirm-message">{{ message }}</div>
      <div class="confirm-actions">
        <button class="confirm-btn cancel" type="button" @click="$emit('cancel')">{{ cancelLabel }}</button>
        <button class="confirm-btn destructive" type="button" @click="$emit('confirm')">{{ confirmLabel }}</button>
      </div>
    </div>
  </div>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
}>();

defineEmits<{ confirm: []; cancel: [] }>();
</script>

<style scoped>
.confirm-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(31, 42, 36, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 1000;
}
.confirm-card {
  width: 100%;
  max-width: 340px;
  background: var(--ck-card);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 12px 32px rgba(31, 42, 36, 0.25);
}
.confirm-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--ck-ink);
  margin-bottom: 8px;
}
.confirm-message {
  font-family: 'Inter', sans-serif;
  font-size: 13.5px;
  color: var(--ck-muted);
  line-height: 1.45;
  margin-bottom: 20px;
}
.confirm-actions {
  display: flex;
  gap: 10px;
}
.confirm-btn {
  flex: 1;
  padding: 11px;
  border-radius: 10px;
  font-family: 'Inter', sans-serif;
  font-size: 13.5px;
  font-weight: 600;
  border: none;
  cursor: pointer;
}
.confirm-btn.cancel {
  background: transparent;
  border: 1px solid var(--ck-rule);
  color: var(--ck-ink);
}
.confirm-btn.destructive {
  background: var(--ck-sienna);
  color: #fff;
}
</style>
