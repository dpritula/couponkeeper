import type { Router } from 'vue-router'
import { App } from '@capacitor/app'
import { LocalNotifications, type ActionPerformed } from '@capacitor/local-notifications'
import { recalculateExpiryNotifications } from './expiryNotifications'

/**
 * Registers the two things that keep expiry notifications alive outside a
 * page's own lifecycle: recalculating on every OS-level foreground resume,
 * and routing a tap on a delivered notification back into the app (see
 * design.md's "tap routing carries the qualifying codes on the notification
 * itself" decision). Call once from main.ts after the app is mounted.
 */
export function bootstrapExpiryNotifications(router: Router): void {
  App.addListener('resume', () => {
    void recalculateExpiryNotifications()
  })

  LocalNotifications.addListener('localNotificationActionPerformed', (action: ActionPerformed) => {
    const codes = action.notification.extra?.codes as string[] | undefined
    if (!codes?.length) return

    if (codes.length === 1) {
      void router.push({ path: '/tabs/codes', query: { openCode: codes[0] } })
    } else {
      void router.push({ path: '/tabs/codes', query: { notifyCodes: codes.join(',') } })
    }
  })
}
