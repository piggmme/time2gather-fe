import styles from "./Header.module.scss";
import { useState } from "react";
import calendarIcon from "../../assets/calendar.svg?url";
import { GlobeIcon, HamburgerMenuIcon, MagnifyingGlassIcon, PersonIcon, PlusIcon, RocketIcon } from "@radix-ui/react-icons";
import { VisuallyHidden } from "radix-ui";
import { useTranslation } from "../../hooks/useTranslation";
import { setLocale } from "../../stores/locale";
import { type Locale } from "../../i18n";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { t, locale } = useTranslation();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale);
    window.location.reload();
  };

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
              href="/"
              className={styles.desktopNavLogo}
            >
              <img
                src={calendarIcon}
                alt="Time2Gather"
                className={styles.desktopLogo}
              />
              <VisuallyHidden.Root>{t('common.home')}</VisuallyHidden.Root>
            </a>
            <a
              href="/meetings/create"
              className={styles.desktopNavLink}
            >
              <PlusIcon width={27} height={27} />
              <VisuallyHidden.Root>{t('common.createMeeting')}</VisuallyHidden.Root>
            </a>
            <a
              href="/meetings/search"
              className={styles.desktopNavLink}
            >
              <MagnifyingGlassIcon width={27} height={27} />
              <VisuallyHidden.Root>{t('common.searchMeeting')}</VisuallyHidden.Root>
            </a>
            <a
              href="/my"
              className={styles.desktopNavLink}
            >
              <PersonIcon width={27} height={27} />
              <VisuallyHidden.Root>{t('common.myMeetings')}</VisuallyHidden.Root>
            </a>
            <a
              href="https://github.com/piggmme/time2gather-fe"
              target="_blank"
              className={styles.desktopNavAboutUs}
            >
              <RocketIcon width={27} height={27} />
              <VisuallyHidden.Root>{t('common.aboutUs')}</VisuallyHidden.Root>
            </a>
            <button
              className={styles.localeButton}
              onClick={() => handleLocaleChange(locale === 'ko' ? 'en' : 'ko')}
              aria-label="한국어"
            >
              {locale === 'ko' ? 'A' : '가'}
            </button>
          </div>
        </nav>

        {/* 모바일 네비게이션 */}
        <nav className={`${styles.mobileNav} ${isMobileMenuOpen ? styles.mobileMenuOpen : ''}`}>
          <div className={styles.mobileNavContent}>
            <a
              href="/"
              className={styles.mobileTitle}
              onClick={closeMobileMenu}
            >
              <span className={styles.mobileTitleText}>
                Time2Gather
              </span>
            </a>
            <a
              href="/meetings/create"
              className={styles.mobileNavLink}
            >
              <PlusIcon width={27} height={27} />
              <span>{t('common.createMeeting')}</span>
            </a>
            <a
              href="/meetings/search"
              className={styles.mobileNavLink}
            >
              <MagnifyingGlassIcon width={27} height={27} />
              <span>{t('common.searchMeeting')}</span>
            </a>
            <a
              href="/my"
              className={styles.mobileNavLink}
            >
              <PersonIcon width={27} height={27} />
              <span>{t('common.myMeetings')}</span>
            </a>
            <div className={styles.mobileNavBottomContents}>
              <button
                className={styles.mobileNavBottomItem}
                onClick={() => handleLocaleChange(locale === 'ko' ? 'en' : 'ko')}
                aria-label="한국어"
              >
                <GlobeIcon width={27} height={27} />
                <span>{locale === 'ko' ? 'English' : '한국어'}</span>
              </button>
              <a
                href="https://github.com/piggmme/time2gather-fe"
                target="_blank"
                className={styles.mobileNavBottomItem}
              >
                <RocketIcon width={27} height={27} />
                <span>{t('common.aboutUs')}</span>
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