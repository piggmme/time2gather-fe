export const marketingLocales = [
  'ko', 'en', 'es', 'pt', 'fr', 'de', 'ja', 'zh-CN', 'hi', 'ar', 'id', 'tr', 'vi', 'th', 'ru',
] as const

export type MarketingLocale = typeof marketingLocales[number]
export type MarketingPage = 'home' | 'about' | 'contact' | 'privacy' | 'terms'

export const marketingPages: MarketingPage[] = ['home', 'about', 'contact', 'privacy', 'terms']

export const localeMeta: Record<MarketingLocale, { label: string, dir: 'ltr' | 'rtl' }> = {
  'ko': { label: '한국어', dir: 'ltr' },
  'en': { label: 'English', dir: 'ltr' },
  'es': { label: 'Español', dir: 'ltr' },
  'pt': { label: 'Português', dir: 'ltr' },
  'fr': { label: 'Français', dir: 'ltr' },
  'de': { label: 'Deutsch', dir: 'ltr' },
  'ja': { label: '日本語', dir: 'ltr' },
  'zh-CN': { label: '简体中文', dir: 'ltr' },
  'hi': { label: 'हिन्दी', dir: 'ltr' },
  'ar': { label: 'العربية', dir: 'rtl' },
  'id': { label: 'Bahasa Indonesia', dir: 'ltr' },
  'tr': { label: 'Türkçe', dir: 'ltr' },
  'vi': { label: 'Tiếng Việt', dir: 'ltr' },
  'th': { label: 'ไทย', dir: 'ltr' },
  'ru': { label: 'Русский', dir: 'ltr' },
}

export function isMarketingLocale (value: string | undefined): value is MarketingLocale {
  return !!value && marketingLocales.includes(value as MarketingLocale)
}

export function localizedPath (locale: MarketingLocale, page: MarketingPage = 'home'): string {
  const prefix = locale === 'ko' ? '' : `/${locale}`
  if (page === 'home') return prefix ? `${prefix}/` : '/'
  return `${prefix}/${page}/`
}

export function appLocaleFor (locale: MarketingLocale): 'ko' | 'en' {
  return locale === 'ko' ? 'ko' : 'en'
}

export function localizedAppPath (locale: MarketingLocale, path: string): string {
  const separator = path.includes('?') ? '&' : '?'
  return `${path}${separator}lang=${appLocaleFor(locale)}`
}
