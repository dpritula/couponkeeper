import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router';
import i18n from './i18n';
import { useSettingsStore } from './stores/settings';
import { seedDatabase } from './db/seed';
import { bootstrapExpiryNotifications } from './notifications/bootstrap';
import { recalculateExpiryNotifications } from './notifications/expiryNotifications';

import { Capacitor } from '@capacitor/core';
import { IonicVue } from '@ionic/vue';

/**
 * @capacitor-community/sqlite has no web SQLite of its own — on the web
 * platform (dev server, browser preview) it delegates to this custom
 * element (sql.js/IndexedDB backed). Native platforms use the plugin's own
 * SQLite directly and never touch this, so the (sizeable, sql.js-wasm-bundled)
 * loader is imported dynamically here rather than at module scope, keeping it
 * out of the Android build's web assets entirely. See src/db/client.ts.
 */
if (Capacitor.getPlatform() === 'web') {
  import('jeep-sqlite/loader').then(({ defineCustomElements: defineJeepSqlite }) => {
    defineJeepSqlite(window);
    const jeepSqliteEl = document.createElement('jeep-sqlite');
    /**
     * Without this, jeep-sqlite only ever mutates its in-memory sql.js
     * database — nothing is written back to its IndexedDB-backed store, so
     * every write (a new channel, a new coupon, a delete, ...) is silently
     * lost on the next page reload, and `ensureSchema`/`seedDatabase` just
     * recreate the same starting state from scratch. `autoSave` persists to
     * IndexedDB after every statement, which is what native SQLite already
     * does implicitly (writing to a real file), so this just brings the web
     * dev fallback in line with native's actual persistence behavior.
     */
    jeepSqliteEl.autoSave = true;
    document.body.appendChild(jeepSqliteEl);
  });
}

/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/vue/css/padding.css';
import '@ionic/vue/css/float-elements.css';
import '@ionic/vue/css/text-alignment.css';
import '@ionic/vue/css/text-transformation.css';
import '@ionic/vue/css/flex-utils.css';
import '@ionic/vue/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * Not using any of Ionic's built-in `palettes/dark.*.css` files: our own
 * theme/variables.css already defines every `--ion-*` token for both light
 * and dark (toggled via the `ion-palette-dark` class), so importing Ionic's
 * dark palette on top would just fight our tokens for the same properties.
 * See stores/settings.ts for how the class gets applied.
 */

/* Theme variables and fonts */
import './theme/variables.css';
import './theme/fonts.css';

const app = createApp(App)
  .use(IonicVue)
  .use(router)
  .use(createPinia())
  .use(i18n);

const settings = useSettingsStore();
settings.applyTheme();
settings.watchSystemTheme();

/**
 * Seeding runs several sequential statements (check-if-seeded, then one
 * insert per row). If a page's own first query ran concurrently with that,
 * it could land in the middle of the sequence — e.g. right after the
 * "is it seeded?" check but before any row was actually inserted — and see
 * a still-empty table with no reason to ever look again. Waiting for it to
 * finish before mounting means no page can query the db before it's ready.
 */
Promise.all([
  seedDatabase().catch((error) => console.error('Failed to seed database', error)),
  router.isReady()
]).then(() => {
  app.mount('#app');
  bootstrapExpiryNotifications(router);
  recalculateExpiryNotifications().catch((error) => console.error('Failed to schedule expiry notifications', error));
});
