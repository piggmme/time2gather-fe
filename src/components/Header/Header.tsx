import { useState } from 'react'
import { useStore } from '@nanostores/react'
import {
  CheckIcon, ChevronDownIcon, ChevronUpIcon, GlobeIcon, HamburgerMenuIcon,
} from '@radix-ui/react-icons'
import { Select } from 'radix-ui'
import { showCautionToast } from '../../stores/toast'
import { $me } from '../../stores/me'
import { setLocale } from '../../stores/locale'
import { useTranslation } from '../../hooks/useTranslation'
import { localizedAppPath, localizedPath } from '../../marketing/config'
import {
  localeMeta, supportedLocales, loadLocaleDocument, getTranslations, type Locale,
} from '../../i18n'
import styles from './Header.module.scss'

export default function Header () {
  const { t, locale } = useTranslation()
  const me = useStore($me)
  const [isChangingLanguage, setIsChangingLanguage] = useState(false)

  const handleLocaleChange = async (newLocale: Locale) => {
    if (isChangingLanguage || newLocale === locale) return
    setIsChangingLanguage(true)
    const url = new URL(window.location.href)
    url.searchParams.set('lang', newLocale)
    try {
      const localized = await loadLocaleDocument(newLocale, url)
      setLocale(newLocale)
      if (document.documentElement.hasAttribute('data-meeting-invitation')) {
        try {
          if (localStorage.getItem('locale') === newLocale) url.searchParams.delete('lang')
        } catch { /* Keep the language in the URL when storage is unavailable. */ }
      }
      window.history.replaceState(window.history.state, '', url.href)
      document.title = localized.title
      for (const selector of ['meta[name="description"]', 'meta[property="og:title"]', 'meta[property="og:description"]', 'meta[property="og:locale"]', 'meta[property="og:url"]', 'meta[name="twitter:title"]', 'meta[name="twitter:description"]']) {
        const content = localized.querySelector(selector)?.getAttribute('content')
        if (content) document.querySelector(selector)?.setAttribute('content', content)
      }
      const canonical = localized.querySelector('link[rel="canonical"]')?.getAttribute('href')
      if (canonical) document.querySelector('link[rel="canonical"]')?.setAttribute('href', canonical)
      const translate = getTranslations(newLocale)
      document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((element) => {
        if (element.dataset.i18n) element.textContent = translate(element.dataset.i18n)
      })
      document.querySelectorAll<HTMLElement>('[data-i18n-aria-label]').forEach((element) => {
        if (element.dataset.i18nAriaLabel) element.setAttribute('aria-label', translate(element.dataset.i18nAriaLabel))
      })
    } catch {
      showCautionToast({ message: t('common.error') })
    } finally {
      setIsChangingLanguage(false)
    }
  }

  return (
    <header className='t2g-site-header' data-site-header>
      <a className='t2g-site-header__brand' href={localizedPath(locale)} aria-label='Time2Gather'>
        <img src='/brand/icon-192.png' alt='' width={34} height={34} /><span>Time2Gather</span>
      </a>
      <nav className='t2g-site-header__nav' aria-label={t('common.home')}>
        <a href={localizedAppPath(locale, '/my')}>{t('common.myMeetings')}</a>
        <a href={localizedAppPath(locale, '/meetings/search')}>{t('common.enterInvitationCode')}</a>
        {me?.role === 'ADMIN' && <a href={localizedAppPath(locale, '/admin')}>{t('common.adminDashboard')}</a>}
        <a href={localizedPath(locale, 'contact')}>{t('common.contact')}</a>
      </nav>
      <Select.Root value={locale} onValueChange={value => handleLocaleChange(value as Locale)} disabled={isChangingLanguage} dir={localeMeta[locale].dir}>
        <Select.Trigger className='t2g-site-header__locale' aria-label={t('common.searchLanguages')} aria-busy={isChangingLanguage} title={`${t('common.searchLanguages')}: ${localeMeta[locale].label}`}>
          <GlobeIcon width={20} height={20} aria-hidden='true' /><span><Select.Value /></span><ChevronDownIcon aria-hidden='true' />
        </Select.Trigger>
        <Select.Portal>
          <Select.Content className={styles.languageMenu} position='popper' side='bottom' align='end' sideOffset={8} collisionPadding={12}>
            <Select.ScrollUpButton className={styles.languageScroll}><ChevronUpIcon /></Select.ScrollUpButton>
            <Select.Viewport className={styles.languageViewport}>
              {supportedLocales.map(language => (
                <Select.Item className={styles.languageOption} key={language} value={language} textValue={localeMeta[language].label}>
                  <Select.ItemText><span lang={language} dir={localeMeta[language].dir}>{localeMeta[language].label}</span></Select.ItemText>
                  <Select.ItemIndicator className={styles.languageCheck}><CheckIcon /></Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Viewport>
            <Select.ScrollDownButton className={styles.languageScroll}><ChevronDownIcon /></Select.ScrollDownButton>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
      <details className='t2g-site-header__menu'>
        <summary aria-label={t('common.openMenu')}><HamburgerMenuIcon width={22} height={22} aria-hidden='true' /></summary>
        <nav className='t2g-site-header__menu-panel' aria-label={t('common.openMenu')}>
          <a href={localizedAppPath(locale, '/meetings/create')}>{t('common.createMeeting')}</a>
          <a href={localizedAppPath(locale, '/my')}>{t('common.myMeetings')}</a>
          <a href={localizedAppPath(locale, '/meetings/search')}>{t('common.enterInvitationCode')}</a>
          {me?.role === 'ADMIN' && <a href={localizedAppPath(locale, '/admin')}>{t('common.adminDashboard')}</a>}
          <a className='t2g-site-header__contact' href={localizedPath(locale, 'contact')}>{t('common.contact')}</a>
        </nav>
      </details>
    </header>
  )
}
