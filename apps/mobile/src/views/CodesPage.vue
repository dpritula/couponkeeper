<template>
  <ion-page>
    <div class="app-header">
      <div class="brand font-brand"><AppLogo class="brand-logo" />{{ t('app.name') }}</div>
      <CouponFilterToolbar
        :channels="channelsStore.items"
        :channel-filter="couponsStore.channelFilter"
        :status-filter="couponsStore.statusFilter"
        :discount-type-filter="couponsStore.discountTypeFilter"
        :sort-by="couponsStore.sortBy"
        :sort-dir="couponsStore.sortDir"
        @toggle-channel="toggleChannelFilter"
        @select-all-channels="selectAllChannels"
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
        <div v-if="couponsStore.notificationCodes" class="notification-banner">
          <span>{{ t('notifications.showingFromNotification') }}</span>
          <button
            type="button"
            class="notification-banner-close"
            :aria-label="t('codes.detailClose')"
            @click="couponsStore.clearNotificationCoupons()"
          >
            ×
          </button>
        </div>
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

    <CouponDetailModal :code="selectedCode" @close="selectedCode = null" @edit="startEdit" />
    <CouponFormModal :key="formKey" :open="showForm || editingCode !== null" :coupon="editingCode" @close="closeForm" />
    <ChannelManagerModal :open="showChannelManager" @close="showChannelManager = false" />
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { IonPage, IonContent, IonFab, IonFabButton, IonIcon, onIonViewWillEnter } from '@ionic/vue';
import { add } from 'ionicons/icons';
import AppLogo from '@/components/AppLogo.vue';
import ChannelManagerModal from '@/components/ChannelManagerModal.vue';
import CodeCard from '@/components/CodeCard.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import CouponDetailModal from '@/components/CouponDetailModal.vue';
import CouponFilterToolbar from '@/components/CouponFilterToolbar.vue';
import CouponFormModal from '@/components/CouponFormModal.vue';
import type { PromoCode } from '@/data/promoCode';
import { getCouponByCode } from '@/db/queries/coupons';
import { useChannelsStore } from '@/stores/channels';
import { toViewModel, useCouponsStore } from '@/stores/coupons';
import { toggleChannelSelection } from '@/utils/channelSelection';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const couponsStore = useCouponsStore();
const channelsStore = useChannelsStore();

const pendingDeleteCode = ref<string | null>(null);
const selectedCode = ref<PromoCode | null>(null);
const showForm = ref(false);
const editingCode = ref<PromoCode | null>(null);
const showChannelManager = ref(false);

// Keys CouponFormModal so it fully remounts (fresh field refs, see its own
// "recreated fresh each time it opens" note) on every open — not just when
// switching between two different coupons, but also between two separate
// create-mode opens, which don't otherwise change `coupon` at all.
const formKey = computed(() => {
  if (!showForm.value && editingCode.value === null) return 'closed';
  return editingCode.value?.code ?? 'new';
});

onIonViewWillEnter(() => {
  couponsStore.load();
  channelsStore.load();
});

/**
 * `notifications/bootstrap.ts` reaches this deep link via `router.push`
 * while Codes may already be the active tab — Ionic's `onIonViewWillEnter`
 * only fires on an actual page transition, not a query-only navigation to
 * the page that's already showing (the same class of lifecycle-hook gap
 * CLAUDE.md already documents for cross-page data propagation), so a real
 * on-device test of the notification tap showed it silently doing nothing.
 * Watching the query reactively (`immediate: true` also covers a cold
 * start where the app launches fresh with the query already present)
 * fixes it regardless of whether a page transition happens to occur.
 */
watch(
  () => [route.query.openCode, route.query.notifyCodes],
  () => {
    handleNotificationQuery();
  },
  { immediate: true }
);

/**
 * Routes a tapped expiry notification's deep link into the right UI state
 * (see notifications/bootstrap.ts, which is what sets these query params),
 * then strips them via `router.replace` so re-entering Codes normally
 * doesn't reopen/refilter. `notifyCodes` intentionally leaves
 * `couponsStore.notificationCodes` set afterward so the banner in the
 * template stays visible until the maker dismisses it.
 */
async function handleNotificationQuery() {
  const openCode = route.query.openCode;
  const notifyCodes = route.query.notifyCodes;

  if (typeof openCode === 'string') {
    const coupon = await getCouponByCode(openCode);
    if (coupon) selectedCode.value = toViewModel(coupon);
    await router.replace({ path: '/tabs/codes' });
    return;
  }

  if (typeof notifyCodes === 'string') {
    const codes = notifyCodes.split(',').filter(Boolean);
    if (codes.length) await couponsStore.showNotificationCoupons(codes);
    await router.replace({ path: '/tabs/codes' });
  }
}

// The toggle-and-collapse-to-"All" rule lives in the shared util, not the
// store, so it stays identical to Calendar's own channel filter (see
// calendar-channel-line-filter's design.md Decision 8) — the store just
// takes the already-resolved next selection.
function toggleChannelFilter(key: string) {
  couponsStore.setChannelFilter(toggleChannelSelection(couponsStore.channelFilter, key, channelsStore.items.length));
}

function selectAllChannels() {
  couponsStore.setChannelFilter(new Set());
}

function requestDelete(code: string) {
  pendingDeleteCode.value = code;
}

function startEdit(code: PromoCode) {
  selectedCode.value = null;
  editingCode.value = code;
}

function closeForm() {
  showForm.value = false;
  editingCode.value = null;
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
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 22px;
  font-weight: 600;
  margin: 0 0 12px;
  color: var(--ck-ink);
}
.brand-logo {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  flex-shrink: 0;
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
.notification-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 12px;
  background: var(--ck-sage-dim);
  color: var(--ck-ink);
  font-family: 'Inter', sans-serif;
  font-size: 12.5px;
  font-weight: 500;
}
.notification-banner-close {
  flex-shrink: 0;
  font-size: 17px;
  line-height: 1;
  color: var(--ck-muted);
  background: transparent;
  border: none;
  padding: 0 2px;
  cursor: pointer;
}
.notification-banner-close:active {
  color: var(--ck-sienna);
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
