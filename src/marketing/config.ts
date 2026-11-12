import { supportedLocales, localeMeta } from '../i18n/config'
export { localeMeta }
export const marketingLocales = supportedLocales
export type MarketingLocale = typeof marketingLocales[number]
export type MarketingPage = 'home' | 'about' | 'contact' | 'privacy' | 'terms'
export const marketingPages: MarketingPage[] = ['home', 'about', 'contact', 'privacy', 'terms']

export function isMarketingLocale (value: string | undefined): value is MarketingLocale {
  return !!value && marketingLocales.includes(value as MarketingLocale)
}

export function localizedPath (locale: MarketingLocale, page: MarketingPage = 'home'): string {
  return page === 'home' ? `/${locale}/` : `/${locale}/${page}/`
}

export function appLocaleFor (locale: MarketingLocale): MarketingLocale {
  return locale
}

export function localizedAppPath (locale: MarketingLocale, path: string): string {
  const separator = path.includes('?') ? '&' : '?'
  return `${path}${separator}lang=${appLocaleFor(locale)}`
}

// Keep attribution parameters through language negotiation. The destination
// path carries the resolved locale, so language-routing parameters are rebuilt.
export function marketingRedirectPath (
  locale: MarketingLocale,
  page: MarketingPage,
  searchParams: URLSearchParams,
  autoLocale: boolean,
): string {
  const params = new URLSearchParams(searchParams)
  params.delete('lang')
  params.delete('autoLocale')
  if (autoLocale) params.set('autoLocale', '1')
  const query = params.toString()
  return `${localizedPath(locale, page)}${query ? `?${query}` : ''}`
}
