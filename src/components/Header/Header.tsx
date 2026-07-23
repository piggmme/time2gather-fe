import styles from './Header.module.scss'
import { useState } from 'react'
import {
  DashboardIcon, EnvelopeClosedIcon, GlobeIcon, HamburgerMenuIcon, MagnifyingGlassIcon, PersonIcon, PlusIcon,
} from '@radix-ui/react-icons'
import { VisuallyHidden } from 'radix-ui'
import { useTranslation } from '../../hooks/useTranslation'
import { setLocale } from '../../stores/locale'
import { type Locale } from '../../i18n'
import { useStore } from '@nanostores/react'
import { $me } from '../../stores/me'
import Avatar from '../Avatar/Avatar'

export default function Header () {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { t, locale } = useTranslation()
  const me = useStore($me)
  const nextLocale = locale === 'ko' ? 'en' : 'ko'
  const languageButtonLabel = t(nextLocale === 'ko' ? 'common.switchToKorean' : 'common.switchToEnglish')

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale)

    if (window.location.pathname === '/' && newLocale === 'en') {
      window.location.assign('/en/')
      return
    }

    if ((window.location.pathname === '/en' || window.location.pathname === '/en/') && newLocale === 'ko') {
      window.location.assign('/')
      return
    }

    window.location.reload()
  }

  return (
    <>
      <header className={styles.header}>
        {/* 모바일: 햄버거 버튼만 표시 */}
        <div className={styles.mobileHeader}>
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
              href='/'
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
                me && me?.provider !== 'ANONYMOUS'
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
            <button
              className={styles.localeButton}
              onClick={() => handleLocaleChange(nextLocale)}
              aria-label={languageButtonLabel}
            >
              {locale === 'ko' ? 'A' : '가'}
            </button>
          </div>
        </nav>

        {/* 모바일 네비게이션 */}
        <nav className={`${styles.mobileNav} ${isMobileMenuOpen ? styles.mobileMenuOpen : ''}`}>
          <div className={styles.mobileNavContent}>
            <a
              href='/'
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
                me && me?.provider !== 'ANONYMOUS'
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
              <button
                className={styles.mobileNavBottomItem}
                onClick={() => handleLocaleChange(nextLocale)}
                aria-label={languageButtonLabel}
              >
                <GlobeIcon width={27} height={27} />
                <span>{locale === 'ko' ? 'English' : '한국어'}</span>
              </button>
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
