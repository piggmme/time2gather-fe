export const localeMeta = {
  'en': { label: 'English', dir: 'ltr' },
  'zh-CN': { label: '简体中文', dir: 'ltr' },
  'hi': { label: 'हिन्दी', dir: 'ltr' },
  'es': { label: 'Español', dir: 'ltr' },
  'ar': { label: 'العربية', dir: 'rtl' },
  'fr': { label: 'Français', dir: 'ltr' },
  'bn': { label: 'বাংলা', dir: 'ltr' },
  'pt': { label: 'Português', dir: 'ltr' },
  'ru': { label: 'Русский', dir: 'ltr' },
  'id': { label: 'Bahasa Indonesia', dir: 'ltr' },
  'ur': { label: 'اردو', dir: 'rtl' },
  'de': { label: 'Deutsch', dir: 'ltr' },
  'ja': { label: '日本語', dir: 'ltr' },
  'pcm': { label: 'Naijá', dir: 'ltr' },
  'ar-EG': { label: 'العربية (مصر)', dir: 'rtl' },
  'mr': { label: 'मराठी', dir: 'ltr' },
  'vi': { label: 'Tiếng Việt', dir: 'ltr' },
  'te': { label: 'తెలుగు', dir: 'ltr' },
  'ha': { label: 'Hausa', dir: 'ltr' },
  'tr': { label: 'Türkçe', dir: 'ltr' },
  'ko': { label: '한국어', dir: 'ltr' },
  'th': { label: 'ไทย', dir: 'ltr' },
} as const

export type Locale = keyof typeof localeMeta
export const supportedLocales = Object.keys(localeMeta) as Locale[]
export const defaultLocale: Locale = 'en'

export function normalizeLocale (value?: string | null): Locale | undefined {
  if (!value) return undefined
  const tag = value.trim().replace(/_/g, '-').toLowerCase()
  const exact = supportedLocales.find(locale => locale.toLowerCase() === tag)
  if (exact) return exact
  if (tag === 'zh' || tag.startsWith('zh-')) return 'zh-CN'
  return supportedLocales.find(locale => locale === tag.split('-')[0])
}

export function negotiateLocale (languages: string): Locale {
  const preferences = languages.split(',').map((entry, index) => {
    const [tag, ...parameters] = entry.trim().split(';')
    const quality = parameters.find(parameter => parameter.trim().startsWith('q='))
    return { tag, quality: quality ? Number(quality.trim().slice(2)) : 1, index }
  }).filter(entry => entry.quality > 0 && entry.quality <= 1)
    .sort((a, b) => b.quality - a.quality || a.index - b.index)
  for (const preference of preferences) {
    const locale = normalizeLocale(preference.tag)
    if (locale) return locale
  }
  return defaultLocale
}

// Intl currently has no dedicated Nigerian Pidgin data. Use Nigerian regional formats.
export function intlLocale (locale: Locale): string {
  const tag = locale === 'pcm' ? 'en-NG' : locale
  // An unsupported locale must not silently adopt the device's language.
  return Intl.DateTimeFormat.supportedLocalesOf(tag).length ? tag : 'en'
}

export function withLocale (path: string, locale: Locale, origin = 'https://time2gather.org'): string {
  const url = new URL(path, origin)
  if (url.origin !== origin || !/^\/(?:$|meetings(?:\/|$)|my(?:\/|$)|404(?:\/|$)|admin(?:\/|$)|about\/?$|contact\/?$|privacy\/?$|terms\/?$)/.test(url.pathname)) return path
  url.searchParams.set('lang', locale)
  return `${url.pathname}${url.search}${url.hash}`
}

// Metadata identifiers only; these do not select a user's country or time zone.
export const openGraphLocales: Record<Locale, string> = {
  'en': 'en_US', 'zh-CN': 'zh_CN', 'hi': 'hi_IN', 'es': 'es_ES',
  'ar': 'ar_SA', 'fr': 'fr_FR', 'bn': 'bn_BD', 'pt': 'pt_BR',
  'ru': 'ru_RU', 'id': 'id_ID', 'ur': 'ur_PK', 'de': 'de_DE',
  'ja': 'ja_JP', 'pcm': 'pcm_NG', 'ar-EG': 'ar_EG', 'mr': 'mr_IN',
  'vi': 'vi_VN', 'te': 'te_IN', 'ha': 'ha_NG', 'tr': 'tr_TR',
  'ko': 'ko_KR', 'th': 'th_TH',
}
