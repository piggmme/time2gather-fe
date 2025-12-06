import { atom } from 'nanostores'
import { type Locale, getLocaleFromContext, setLocale as setLocaleStorage } from '../i18n'

export const $locale = atom<Locale>(getLocaleFromContext())

export function setLocale (locale: Locale) {
  setLocaleStorage(locale)
  $locale.set(locale)
}
