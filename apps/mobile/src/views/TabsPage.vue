<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="codes" href="/tabs/codes">
          <ion-icon aria-hidden="true" :icon="pricetagOutline" />
          <ion-label>{{ t('tabs.codes') }}</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="calendar" href="/tabs/calendar">
          <ion-icon aria-hidden="true" :icon="calendarOutline" />
          <ion-label>{{ t('tabs.calendar') }}</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="settings" href="/tabs/settings">
          <ion-icon aria-hidden="true" :icon="settingsOutline" />
          <ion-label>{{ t('tabs.settings') }}</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { IonTabBar, IonTabButton, IonTabs, IonLabel, IonIcon, IonPage, IonRouterOutlet } from '@ionic/vue';
import { pricetagOutline, calendarOutline, settingsOutline } from 'ionicons/icons';

const { t } = useI18n();
</script>

<style scoped>
/*
 * Color alone (--ion-tab-bar-color-selected: var(--ck-sage)) barely reads as
 * "selected" in the light theme — sage and the unselected muted tone are too
 * close in lightness/saturation to tell apart at a glance (the dark theme's
 * versions of the same two tokens happen to contrast more, which is why this
 * wasn't obvious there). A tinted pill behind the selected tab — the same
 * "selected = filled" language already used for the filter chips and channel
 * picker — makes the active tab unambiguous regardless of theme.
 * `[aria-selected="true"]` is included alongside `.tab-selected` since Ionic
 * sets both; `::part(native)` reaches the button's actual shadow DOM wrapper.
 * The pill's own margin is offset by matching padding on the wrapper (rather
 * than shrinking the native part within the same box) so selecting a tab
 * never changes the button's content box or shifts the icon/label — a bolder
 * label was tried for extra emphasis but caused exactly that shift, so the
 * pill fill alone carries the selected state.
 */
ion-tab-button::part(native) {
  margin: 6px 8px;
  border-radius: 14px;
  width: calc(100% - 16px);
}
ion-tab-button.tab-selected::part(native),
ion-tab-button[aria-selected='true']::part(native) {
  background: var(--ck-sage-dim);
}
</style>
