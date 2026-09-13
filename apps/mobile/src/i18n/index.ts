import { createI18n } from 'vue-i18n'
import en from './locales/en'

export type MessageSchema = typeof en

// Only `en` exists today. The app is structured for more locales:
// add a new `locales/<code>.ts` file and register it in the `messages` map below.
const i18n = createI18n<[MessageSchema], 'en'>({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: { en }
})

export default i18n
