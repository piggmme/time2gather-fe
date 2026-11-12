import en from './locales/en.json'
import { syncLocaleFont } from './fonts'
import {
  defaultLocale, normalizeLocale, negotiateLocale, intlLocale, type Locale,
} from './config'
export {
  defaultLocale, normalizeLocale, negotiateLocale, intlLocale, localeMeta, supportedLocales, type Locale,
} from './config'

const catalogs = (import.meta.env.SSR ? import.meta.glob('./locales/*.json', { eager: true, import: 'default' }) : {}) as Record<string, typeof en>
export const locales: Record<string, typeof en> = Object.fromEntries(
  Object.entries(catalogs).map(([path, messages]) => [path.split('/').pop()!.replace('.json', ''), messages]),
)

function getNestedValue (obj: unknown, keys: string[]): unknown {
  return keys.reduce<unknown>((value, key) => value && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined, obj)
}

let lastBootstrap: Element | null = null
export function getLocaleMessages (locale: Locale): typeof en {
  if (!import.meta.env.SSR && typeof document !== 'undefined') {
    const bootstrap = document.getElementById('i18n-messages')
    if (bootstrap && bootstrap !== lastBootstrap && bootstrap.getAttribute('data-locale') === locale) {
      try {
        locales[locale] = JSON.parse(bootstrap.textContent ?? '{}')
        lastBootstrap = bootstrap
      } catch { /* Keep the English fallback if a document is incomplete. */ }
    }
  }
  return locales[locale] || en
}

export function getTranslations (locale: Locale = defaultLocale) {
  const translations = getLocaleMessages(locale)
  return function t (key: string, params?: Record<string, string | number>): string {
    const keys = key.split('.')
    let value = key.startsWith('errors.')
      ? (translations.errors as Record<string, string>)[key.slice(7)] ?? (en.errors as Record<string, string>)[key.slice(7)]
      : getNestedValue(translations, keys) ?? getNestedValue(en, keys)
    // Optional CLDR plural categories (one/few/many/other, etc.).
    if (value && typeof value === 'object' && typeof params?.count === 'number') {
      const category = new Intl.PluralRules(intlLocale(locale)).select(params.count)
      const forms = value as Record<string, string>
      value = forms[category] ?? forms.other
    }
    if (typeof value !== 'string') return key
    return value.replace(/\{(\w+)\}/g, (match, name) => params?.[name] !== undefined ? String(params[name]) : match)
  }
}

export function getLocaleFromContext (): Locale {
  if (typeof window === 'undefined') return defaultLocale
  const documentLocale = normalizeLocale(document.documentElement.lang)
  if (documentLocale) return documentLocale
  const pathLocale = normalizeLocale(window.location.pathname.split('/')[1])
  if (pathLocale) return pathLocale
  try {
    const stored = normalizeLocale(localStorage.getItem('locale'))
    if (stored) return stored
  } catch { /* Storage can be disabled. */ }
  return negotiateLocale((navigator.languages ?? [navigator.language]).join(','))
}

type LocaleCookies = { get: (name: string) => { value: string } | undefined }
export function getLocaleFromAstroRequest (cookies?: LocaleCookies, headers?: Headers, requestedLocale?: string | null): Locale {
  return normalizeLocale(requestedLocale)
    ?? normalizeLocale(cookies?.get('locale')?.value)
    ?? negotiateLocale(headers?.get('accept-language') ?? '')
}

export function setLocale (locale: Locale) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('locale', locale)
    localStorage.setItem('marketingLocale', locale)
  } catch { /* Cookie still preserves an explicit selection. */ }
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `locale=${locale}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`
  document.documentElement.lang = locale
  document.documentElement.dir = locale === 'ar' || locale === 'ar-EG' || locale === 'ur' ? 'rtl' : 'ltr'
  syncLocaleFont(locale)
  document.dispatchEvent(new Event('time2gather:locale-changed'))
}

// Fetch only the selected catalog and metadata. Keeping the current React roots
// mounted preserves titles, votes and other unsaved form state during a switch.
export async function loadLocaleDocument (locale: Locale, url: URL): Promise<Document> {
  const response = await fetch(url, { credentials: 'same-origin', cache: 'no-store' })
  if (!response.ok) throw new Error('Could not load the selected language')
  const localized = new DOMParser().parseFromString(await response.text(), 'text/html')
  const bootstrap = localized.getElementById('i18n-messages')
  if (bootstrap?.getAttribute('data-locale') !== locale) throw new Error('Missing locale catalog')
  locales[locale] = JSON.parse(bootstrap.textContent ?? '{}')
  return localized
}
