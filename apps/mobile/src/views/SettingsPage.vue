<template>
  <ion-page>
    <div class="app-header">
      <div class="brand font-brand">{{ t('settings.title') }}</div>
    </div>

    <ion-content class="ion-padding">
      <ion-list inset>
        <ion-item lines="none">
          <ion-label>{{ t('settings.theme') }}</ion-label>
        </ion-item>
        <ion-item lines="none">
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
        </ion-item>

        <ion-item lines="none">
          <ion-label>{{ t('settings.sortLabel') }}</ion-label>
        </ion-item>
        <ion-item lines="none">
          <select class="sort-select" :value="sortValue" @change="onSortChange">
            <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </ion-item>
      </ion-list>

      <div class="disclaimer">
        <i18n-t keypath="settings.feedback" tag="p">
          <template #email>
            <a href="mailto:couponkeeper.email@gmail.com">couponkeeper.email@gmail.com</a>
          </template>
        </i18n-t>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { IonPage, IonContent, IonList, IonItem, IonLabel, IonSegment, IonSegmentButton } from '@ionic/vue';
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
  font-size: 22px;
  font-weight: 600;
  color: var(--ck-ink);
}
.sort-select {
  width: 100%;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  padding: 8px 10px;
  border-radius: 10px;
  background: var(--ck-card);
  border: 1px solid var(--ck-rule);
  color: var(--ck-ink);
}
.disclaimer {
  margin: 18px 16px 0;
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
