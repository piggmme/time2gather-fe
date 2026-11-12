import type { Locale } from './config'

type Typography = {
  family: string
  fallback?: string
  lineHeight?: number
  headingLineHeight?: number
}

// These choices follow script coverage and UI readability, not national popularity.
// Keep docs/typography.md and the locale-coverage regression in sync.
export const localeTypography = {
  'en': { family: 'Inter' },
  'zh-CN': { family: 'Noto Sans SC', fallback: '"PingFang SC", "Microsoft YaHei"' },
  'hi': { family: 'Noto Sans Devanagari', fallback: '"Nirmala UI"', lineHeight: 1.65 },
  'es': { family: 'Inter' },
  'ar': { family: 'Noto Sans Arabic', fallback: 'Tahoma', lineHeight: 1.65 },
  'fr': { family: 'Inter' },
  'bn': { family: 'Noto Sans Bengali', fallback: '"Nirmala UI"', lineHeight: 1.65 },
  'pt': { family: 'Inter' },
  'ru': { family: 'Golos Text' },
  'id': { family: 'Inter' },
  'ur': { family: 'Noto Sans Arabic', fallback: 'Tahoma', lineHeight: 1.65 },
  'de': { family: 'Inter' },
  'ja': { family: 'Noto Sans JP', fallback: '"Hiragino Kaku Gothic ProN", "Yu Gothic"' },
  'pcm': { family: 'Inter' },
  'ar-EG': { family: 'Noto Sans Arabic', fallback: 'Tahoma', lineHeight: 1.65 },
  'mr': { family: 'Noto Sans Devanagari', fallback: '"Nirmala UI"', lineHeight: 1.65 },
  'vi': { family: 'Be Vietnam Pro', lineHeight: 1.6 },
  'te': { family: 'Noto Sans Telugu', fallback: '"Nirmala UI"', lineHeight: 1.65 },
  'ha': { family: 'Inter' },
  'tr': { family: 'Inter' },
  'ko': { family: 'Noto Sans KR', fallback: '"Apple SD Gothic Neo", "Malgun Gothic"' },
  'th': { family: 'Noto Sans Thai', fallback: 'Tahoma', lineHeight: 1.65 },
} satisfies Record<Locale, Typography>

const weightRanges: Record<string, string> = {
  'Inter': '100..900',
  'Golos Text': '400..900',
  'Be Vietnam Pro': '400;500;600;700;800',
}

export function getFontStylesheetURL (locale: Locale): string {
  const typography: Typography = localeTypography[locale]
  const families = [...new Set(['Inter', typography.family])]
  const query = families.sort().map(family => `family=${family.replaceAll(' ', '+')}:wght@${weightRanges[family] ?? '100..900'}`).join('&')
  return `https://fonts.googleapis.com/css2?${query}&display=swap`
}

export function getTypographyCSS (): string {
  return Object.entries(localeTypography).map(([locale, settings]) => {
    const typography: Typography = settings
    const stack = (family: string) => `"${family}", ${typography.fallback ? `${typography.fallback}, ` : ''}${family !== 'Inter' ? '"Inter", ' : ''}system-ui, sans-serif`
    return `html[lang="${locale}"]{--font-ui:${stack(typography.family)};--font-controls:var(--font-ui);--font-body-line-height:${typography.lineHeight ?? '1.6'};--font-heading-line-height:${typography.headingLineHeight ?? '1.4'};}`
  }).join('\n')
}

// In-place language changes preserve React state; update their font link too.
// A failed font request must never prevent switching language or using the app.
export function syncLocaleFont (locale: Locale): void {
  if (typeof document === 'undefined') return
  const id = 'locale-font-stylesheet'
  const previous = document.getElementById(id) as HTMLLinkElement | null
  const href = getFontStylesheetURL(locale)
  if (previous?.href === href) {
    previous.dataset.localeFont = locale
    return
  }
  const next = document.createElement('link')
  next.id = id
  next.rel = 'stylesheet'
  next.href = href
  next.dataset.localeFont = locale
  const retirePrevious = () => previous?.remove()
  next.addEventListener('load', retirePrevious, { once: true })
  next.addEventListener('error', retirePrevious, { once: true })
  previous?.removeAttribute('id')
  document.head.appendChild(next)
}
