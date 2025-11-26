import { useStore } from '@nanostores/react';
import { $locale } from '../stores/locale';
import { getTranslations, type Locale } from '../i18n';

export function useTranslation() {
  const locale = useStore($locale);
  const t = getTranslations(locale);
  
  return { t, locale };
}

