<template>
  <ion-page>
    <div class="app-header">
      <div class="brand font-brand">{{ t('app.name') }}</div>
      <CouponFilterToolbar
        :channels="channelsStore.items"
        :channel-filter="couponsStore.channelFilter"
        :status-filter="couponsStore.statusFilter"
        :discount-type-filter="couponsStore.discountTypeFilter"
        :sort-by="couponsStore.sortBy"
        :sort-dir="couponsStore.sortDir"
        @update:channel-filter="couponsStore.setChannelFilter($event)"
        @toggle-status="couponsStore.toggleStatusFilter($event)"
        @toggle-discount="couponsStore.toggleDiscountTypeFilter($event)"
        @update:sort="couponsStore.setSort($event.sortBy, $event.sortDir)"
      >
        <template #channel-extra>
          <button
            type="button"
            class="manage-channels-btn"
            :aria-label="t('channels.manageOpen')"
            @click="showChannelManager = true"
          >
            <ion-icon :icon="add" />
          </button>
        </template>
      </CouponFilterToolbar>
    </div>

    <ion-content>
      <div class="list">
        <div v-if="!couponsStore.loading && couponsStore.items.length === 0" class="empty-state">
          {{ t('codes.empty') }}
        </div>
        <CodeCard
          v-for="code in couponsStore.items"
          :key="code.code"
          :code="code"
          deletable
          @delete="requestDelete(code.code)"
          @select="selectedCode = code"
        />
      </div>

      <ion-fab vertical="bottom" horizontal="end" slot="fixed" class="new-code-fab">
        <ion-fab-button @click="showForm = true">
          <ion-icon :icon="add" />
        </ion-fab-button>
      </ion-fab>
    </ion-content>

    <ConfirmDialog
      :open="pendingDeleteCode !== null"
      :title="t('codes.deleteTitle')"
      :message="t('codes.deleteMessage', { code: pendingDeleteCode })"
      :confirm-label="t('codes.deleteConfirm')"
      :cancel-label="t('codes.deleteCancel')"
      @confirm="confirmDelete"
      @cancel="pendingDeleteCode = null"
    />

    <CouponDetailModal :code="selectedCode" @close="selectedCode = null" />
    <CouponFormModal :open="showForm" @close="showForm = false" />
    <ChannelManagerModal :open="showChannelManager" @close="showChannelManager = false" />
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { IonPage, IonContent, IonFab, IonFabButton, IonIcon, onIonViewWillEnter } from '@ionic/vue';
import { add } from 'ionicons/icons';
import ChannelManagerModal from '@/components/ChannelManagerModal.vue';
import CodeCard from '@/components/CodeCard.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import CouponDetailModal from '@/components/CouponDetailModal.vue';
import CouponFilterToolbar from '@/components/CouponFilterToolbar.vue';
import CouponFormModal from '@/components/CouponFormModal.vue';
import type { PromoCode } from '@/data/promoCode';
import { useChannelsStore } from '@/stores/channels';
import { useCouponsStore } from '@/stores/coupons';

const { t } = useI18n();
const couponsStore = useCouponsStore();
const channelsStore = useChannelsStore();

const pendingDeleteCode = ref<string | null>(null);
const selectedCode = ref<PromoCode | null>(null);
const showForm = ref(false);
const showChannelManager = ref(false);

onIonViewWillEnter(() => {
  couponsStore.load();
  channelsStore.load();
});

function requestDelete(code: string) {
  pendingDeleteCode.value = code;
}

async function confirmDelete() {
  if (!pendingDeleteCode.value) return;
  await couponsStore.remove(pendingDeleteCode.value);
  pendingDeleteCode.value = null;
}
</script>

<style scoped>
.app-header {
  /* A page-level sibling of <ion-content>, not inside it — so it's fixed
     (ion-page lays its children out as a column, ion-content is the only
     one that scrolls) while the list below scrolls independently. Nothing
     accounts for the status bar / notch on its own here, so the safe area
     inset is added explicitly. The border + shadow visually separate it
     from the scrolling list, the same way ion-header/ion-toolbar do on the
     Settings tab. */
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
  margin: 0 0 12px;
  color: var(--ck-ink);
}
.manage-channels-btn {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 1.5px solid var(--ck-rule);
  background: transparent;
  color: var(--ck-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  padding: 0;
}
.manage-channels-btn:active {
  background: var(--ck-sage-dim);
  border-color: var(--ck-sage);
  color: var(--ck-sage);
}
.list {
  padding: 4px 16px 90px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.empty-state {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: var(--ck-muted);
  text-align: center;
  padding: 40px 20px;
}
.new-code-fab {
  --ion-color-primary: var(--ck-ink);
  --ion-color-primary-contrast: var(--ck-paper);
}
</style>
