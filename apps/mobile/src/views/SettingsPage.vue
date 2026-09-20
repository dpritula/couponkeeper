<template>
  <ion-page>
    <div class="app-header">
      <div class="brand font-brand"><AppLogo class="brand-logo" />{{ t('settings.title') }}</div>
    </div>

    <ion-content class="ion-padding">
      <div class="section">
        <div class="section-title">{{ t('settings.sectionAppearance') }}</div>
        <div class="section-card">
          <div class="setting-row">
            <div class="setting-name">{{ t('settings.theme') }}</div>
            <ion-segment :value="settings.theme" @ionChange="onThemeChange">
              <ion-segment-button value="system">
                <ion-label>{{ t('settings.themeSystem') }}</ion-label>
              </ion-segment-button>
              <ion-segment-button value="light">
                <ion-label>{{ t('settings.themeLight') }}</ion-label>
              </ion-segment-button>
              <ion-segment-button value="dark">
                <ion-label>{{ t('settings.themeDark') }}</ion-label>
              </ion-segment-button>
            </ion-segment>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">{{ t('settings.sectionCoupons') }}</div>
        <div class="section-card">
          <div class="setting-row">
            <div class="setting-name">{{ t('settings.sortLabel') }}</div>
            <div class="setting-hint">{{ t('settings.sortHint') }}</div>
            <select class="sort-select" :value="sortValue" @change="onSortChange">
              <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">{{ t('settings.sectionNotifications') }}</div>
        <div class="section-card">
          <div class="setting-row">
            <div class="setting-name">{{ t('settings.warnDaysBefore') }}</div>
            <div class="setting-hint">{{ t('settings.warnDaysBeforeHint') }}</div>
            <div class="stepper">
              <button
                type="button"
                class="stepper-btn"
                :aria-label="t('settings.warnDaysBeforeDecrement')"
                @click="decrementWarnDaysBefore"
              >
                −
              </button>
              <input
                class="stepper-value"
                type="number"
                inputmode="numeric"
                min="0"
                max="20"
                step="1"
                :value="settings.warnDaysBefore"
                @change="onWarnDaysBeforeInput"
              />
              <button
                type="button"
                class="stepper-btn"
                :aria-label="t('settings.warnDaysBeforeIncrement')"
                @click="incrementWarnDaysBefore"
              >
                +
              </button>
              <span class="stepper-unit">{{ t('settings.warnDaysBeforeUnit') }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">{{ t('settings.sectionAbout') }}</div>
        <div class="disclaimer">
          <i18n-t keypath="settings.feedback" tag="p">
            <template #email>
              <a href="mailto:couponkeeper.email@gmail.com">couponkeeper.email@gmail.com</a>
            </template>
          </i18n-t>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { IonPage, IonContent, IonLabel, IonSegment, IonSegmentButton } from '@ionic/vue';
import AppLogo from '@/components/AppLogo.vue';
import { useSettingsStore, type ThemeMode } from '@/stores/settings';
import { getCouponSortOptions } from '@/utils/couponSort';

const { t } = useI18n();
const settings = useSettingsStore();

const sortOptions = computed(() => getCouponSortOptions());
const sortValue = computed(() => `${settings.defaultSort.sortBy}:${settings.defaultSort.sortDir}`);

function onThemeChange(event: CustomEvent) {
  settings.setTheme(event.detail.value as ThemeMode);
}

function onSortChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value;
  const option = sortOptions.value.find((opt) => opt.value === value);
  if (option) settings.setDefaultSort(option.sortBy, option.sortDir);
}

function incrementWarnDaysBefore() {
  settings.setWarnDaysBefore(settings.warnDaysBefore + 1);
}

function decrementWarnDaysBefore() {
  settings.setWarnDaysBefore(settings.warnDaysBefore - 1);
}

function onWarnDaysBeforeInput(event: Event) {
  const input = event.target as HTMLInputElement;
  settings.setWarnDaysBefore(Number(input.value));
  // The `:value` binding only re-patches the DOM when the bound number itself
  // changes; if an out-of-range entry sanitizes back to whatever it already
  // was (e.g. typing 99 while already at 2), Vue sees no change and leaves
  // the invalid text sitting in the input. Force the field back in sync with
  // the store explicitly so an out-of-range entry is always visibly corrected.
  input.value = String(settings.warnDaysBefore);
}
</script>

<style scoped>
/* Matches CodesPage's .app-header exactly (same font, padding, border + shadow) —
   a plain <ion-page> sibling of <ion-content>, not <ion-header>/<ion-toolbar>,
   so the divider is our own hand-rolled shadow, not Ionic's. See CLAUDE.md. */
.app-header {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  background: var(--ck-paper);
  padding: calc(env(safe-area-inset-top) + 6px) 20px 14px;
  border-bottom: 1px solid var(--ck-rule);
  box-shadow: 0 2px 6px rgba(31, 42, 36, 0.08);
}
.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 22px;
  font-weight: 600;
  color: var(--ck-ink);
}
.brand-logo {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  flex-shrink: 0;
}
.section {
  margin-bottom: 22px;
}
.section-title {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ck-muted);
  margin: 0 4px 8px;
}
.section-card {
  background: var(--ck-card);
  border: 1px solid var(--ck-rule);
  border-radius: 14px;
  overflow: hidden;
}
.setting-row {
  padding: 14px 16px;
}
.setting-row + .setting-row {
  border-top: 1px solid var(--ck-rule);
}
.setting-name {
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  font-weight: 600;
  color: var(--ck-ink);
  margin-bottom: 2px;
}
.setting-hint {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  line-height: 1.4;
  color: var(--ck-muted);
  margin-bottom: 10px;
}
.setting-row > ion-segment {
  margin-top: 4px;
}
.sort-select {
  width: 100%;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  padding: 8px 10px;
  border-radius: 10px;
  background: var(--ck-paper);
  border: 1px solid var(--ck-rule);
  color: var(--ck-ink);
}
.stepper {
  display: flex;
  align-items: center;
  gap: 10px;
}
.stepper-btn {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1.5px solid var(--ck-rule);
  background: transparent;
  color: var(--ck-ink);
  font-size: 18px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}
.stepper-btn:active {
  background: var(--ck-sage-dim);
  border-color: var(--ck-sage);
  color: var(--ck-sage);
}
.stepper-value {
  width: 56px;
  text-align: center;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 600;
  padding: 8px 6px;
  border-radius: 10px;
  background: var(--ck-paper);
  border: 1px solid var(--ck-rule);
  color: var(--ck-ink);
}
.stepper-unit {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: var(--ck-muted);
}
.disclaimer {
  padding: 14px 16px;
  border-radius: 12px;
  background: var(--ck-sage-dim);
  color: var(--ck-ink);
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  line-height: 1.5;
}
.disclaimer :deep(p) {
  margin: 0;
}
.disclaimer :deep(a) {
  color: var(--ck-sage);
  font-weight: 600;
}
</style>
