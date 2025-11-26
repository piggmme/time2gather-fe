import ko from './locales/ko.json';
import en from './locales/en.json';

export type Locale = 'ko' | 'en';

export const locales: Record<Locale, typeof ko> = {
  ko,
  en,
};

export const defaultLocale: Locale = 'ko';

export function getTranslations(locale: Locale = defaultLocale) {
  const translations = locales[locale] || locales[defaultLocale];
  
  return function t(key: string, params?: Record<string, string | number>): string {
    const keys = key.split('.');
    let value: any = translations;
    
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) {
        // Fallback to Korean if translation not found
        const fallbackValue = getNestedValue(locales[defaultLocale], keys);
        if (fallbackValue !== undefined) {
          value = fallbackValue;
        } else {
          return key; // Return key if translation not found
        }
      }
    }
    
    if (typeof value !== 'string') {
      return key;
    }
    
    // Replace placeholders like {count} with actual values
    if (params) {
      return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
        return params[paramKey]?.toString() || match;
      });
    }
    
    return value;
  };
}

function getNestedValue(obj: any, keys: string[]): any {
  let value = obj;
  for (const key of keys) {
    value = value?.[key];
    if (value === undefined) return undefined;
  }
  return value;
}

// Helper function to get locale from URL, cookie, or browser
export function getLocaleFromContext(): Locale {
  if (typeof window !== 'undefined') {
    // Client-side: check localStorage first
    const stored = localStorage.getItem('locale') as Locale;
    if (stored && (stored === 'ko' || stored === 'en')) {
      return stored;
    }
    // Try to detect from browser
    const browserLang = navigator.language.split('-')[0];
    if (browserLang === 'en') return 'en';
  } else {
    // Server-side: check cookies (if available in Astro context)
    // For now, return default locale on server
    // In production, you might want to read from cookies or headers
  }
  return defaultLocale;
}

// Helper function to get locale from Astro request (for server-side)
export function getLocaleFromAstroRequest(cookies?: any): Locale {
  if (cookies) {
    const localeCookie = cookies.get('locale')?.value;
    if (localeCookie && (localeCookie === 'ko' || localeCookie === 'en')) {
      return localeCookie as Locale;
    }
  }
  return defaultLocale;
}

// Helper function to set locale
export function setLocale(locale: Locale) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('locale', locale);
    // Also set cookie for server-side access
    document.cookie = `locale=${locale}; path=/; max-age=31536000`; // 1 year
  }
}

