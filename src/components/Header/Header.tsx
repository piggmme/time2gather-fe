import { showCautionToast } from '../../stores/toast'
import styles from './Header.module.scss'
import { useState } from 'react'
import {
  CheckIcon, ChevronDownIcon, ChevronUpIcon, DashboardIcon, EnvelopeClosedIcon, GlobeIcon, HamburgerMenuIcon, MagnifyingGlassIcon, PersonIcon, PlusIcon,
} from '@radix-ui/react-icons'
import { Select, VisuallyHidden } from 'radix-ui'
import { useTranslation } from '../../hooks/useTranslation'
import { localizedPath } from '../../marketing/config'
import { setLocale } from '../../stores/locale'
import {
  localeMeta, supportedLocales, loadLocaleDocument, getTranslations, type Locale,
} from '../../i18n'
import { useStore } from '@nanostores/react'
import { $me } from '../../stores/me'
import Avatar from '../Avatar/Avatar'

export default function Header () {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { t, locale } = useTranslation()
  const [isChangingLanguage, setIsChangingLanguage] = useState(false)
  const me = useStore($me)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

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
    } catch {
      showCautionToast({ message: t('common.error') })
    } finally {
      setIsChangingLanguage(false)
    }
  }

  const languageSelector = (
    <label className={styles.languageSelector}>
      <GlobeIcon aria-hidden='true' />
      <select aria-label={t('common.searchLanguages')} value={locale} disabled={isChangingLanguage} aria-busy={isChangingLanguage} onChange={event => handleLocaleChange(event.target.value as Locale)}>
        {supportedLocales.map(language => <option key={language} value={language} lang={language}>{localeMeta[language].label}</option>)}
      </select>
    </label>
  )

  return (
    <>
      <header className={styles.header}>
        {/* 모바일: 브랜드와 메뉴를 양쪽에 배치 */}
        <div className={styles.mobileHeader}>
          <a href={localizedPath(locale)} className={styles.mobileHeaderBrand}><img src='/favicon.svg' alt='' /><span>Time2Gather</span></a>
          <button
            className={styles.menuButton}
            onClick={toggleMobileMenu}
            aria-label={t('common.openMenu')}
          >
            <HamburgerMenuIcon width={20} height={20} />
          </button>
        </div>

        {/* 데스크톱 네비게이션 */}
        <nav className={styles.desktopNav}>
          <div className={styles.desktopNavContent}>
            <a
              href={localizedPath(locale)}
              className={styles.desktopNavLogo}
            >
              <img
                src='/favicon.svg'
                alt='Time2Gather'
                className={styles.desktopLogo}
              />
              <VisuallyHidden.Root>{t('common.home')}</VisuallyHidden.Root>
            </a>
            <a
              href='/meetings/create'
              className={styles.desktopNavLink}
            >
              <PlusIcon width={27} height={27} />
              <VisuallyHidden.Root>{t('common.createMeeting')}</VisuallyHidden.Root>
            </a>
            <a
              href='/meetings/search'
              className={styles.desktopNavLink}
            >
              <MagnifyingGlassIcon width={27} height={27} />
              <VisuallyHidden.Root>{t('common.searchMeeting')}</VisuallyHidden.Root>
            </a>
            <a
              href='/my'
              className={styles.desktopNavLink}
            >
              {
                me
                  ? (
                      <Avatar
                        src={me.profileImageUrl}
                        name={me.username}
                      />
                    )
                  : (
                      <PersonIcon width={27} height={27} />
                    )
              }
              <VisuallyHidden.Root>{t('common.myMeetings')}</VisuallyHidden.Root>
            </a>
            {me?.role === 'ADMIN' && (
              <a
                href='/admin'
                className={styles.desktopNavLink}
              >
                <DashboardIcon width={27} height={27} />
                <VisuallyHidden.Root>{t('common.adminDashboard')}</VisuallyHidden.Root>
              </a>
            )}
            <a
              href='https://mail.google.com/mail/?view=cm&fs=1&to=wlsdn3578@gmail.com&su=Time2Gather%20Contact'
              target='_blank'
              rel='noreferrer'
              className={styles.desktopNavContact}
            >
              <EnvelopeClosedIcon width={27} height={27} />
              <VisuallyHidden.Root>{t('common.contactUs')}</VisuallyHidden.Root>
            </a>
            <Select.Root value={locale} onValueChange={value => handleLocaleChange(value as Locale)} disabled={isChangingLanguage} dir={localeMeta[locale].dir}>
              <Select.Trigger
                className={styles.languageTrigger}
                aria-label={t('common.searchLanguages')}
                aria-busy={isChangingLanguage}
                title={`${t('common.searchLanguages')}: ${localeMeta[locale].label}`}
              >
                <GlobeIcon width={27} height={27} aria-hidden='true' />
                <VisuallyHidden.Root><Select.Value /></VisuallyHidden.Root>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content
                  className={styles.languageMenu}
                  position='popper'
                  side={localeMeta[locale].dir === 'rtl' ? 'left' : 'right'}
                  align='start'
                  sideOffset={12}
                  collisionPadding={12}
                >
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
          </div>
        </nav>

        {/* 모바일 네비게이션 */}
        <nav className={`${styles.mobileNav} ${isMobileMenuOpen ? styles.mobileMenuOpen : ''}`}>
          <div className={styles.mobileNavContent}>
            <a
              href={localizedPath(locale)}
              className={styles.mobileTitle}
              onClick={closeMobileMenu}
            >
              <span className={styles.mobileTitleText}>
                Time2Gather
              </span>
            </a>
            <a
              href='/meetings/create'
              className={styles.mobileNavLink}
            >
              <PlusIcon width={27} height={27} />
              <span>{t('common.createMeeting')}</span>
            </a>
            <a
              href='/meetings/search'
              className={styles.mobileNavLink}
            >
              <MagnifyingGlassIcon width={27} height={27} />
              <span>{t('common.searchMeeting')}</span>
            </a>
            <a
              href='/my'
              className={styles.mobileNavLink}
            >
              {
                me
                  ? (
                      <Avatar
                        src={me.profileImageUrl}
                        name={me.username}
                        size={27}
                      />
                    )
                  : (
                      <PersonIcon width={27} height={27} />
                    )
              }
              <span>{t('common.myMeetings')}</span>
            </a>
            {me?.role === 'ADMIN' && (
              <a
                href='/admin'
                className={styles.mobileNavLink}
                onClick={closeMobileMenu}
              >
                <DashboardIcon width={27} height={27} />
                <span>{t('common.adminDashboard')}</span>
              </a>
            )}
            <div className={styles.mobileNavBottomContents}>
              {languageSelector}
              <a
                href='mailto:wlsdn3578@gmail.com?subject=Time2Gather%20Contact'
                className={styles.mobileNavBottomItem}
                onClick={closeMobileMenu}
              >
                <EnvelopeClosedIcon width={27} height={27} />
                <span>{t('common.contactUs')}</span>
              </a>
            </div>
          </div>
        </nav>

        {/* 모바일 오버레이 */}
        {isMobileMenuOpen && (
          <div
            className={styles.mobileOverlay}
            onClick={closeMobileMenu}
          />
        )}
      </header>
    </>
  )
}
