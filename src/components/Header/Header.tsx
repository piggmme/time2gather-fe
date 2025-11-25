import styles from "./Header.module.scss";
import { useState } from "react";
import calendarIcon from "../../assets/calendar.svg?url";
import { HamburgerMenuIcon, MagnifyingGlassIcon, PersonIcon, PlusIcon, RocketIcon } from "@radix-ui/react-icons";
import { VisuallyHidden } from "radix-ui";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className={styles.header}>
        {/* 모바일: 햄버거 버튼만 표시 */}
        <div className={styles.mobileHeader}>
          <button
            className={styles.menuButton}
            onClick={toggleMobileMenu}
            aria-label="메뉴 열기"
          >
            <HamburgerMenuIcon width={20} height={20} />
          </button>
        </div>

        {/* 데스크톱 네비게이션 */}
        <nav className={styles.desktopNav}>
          <a
            href="/"
            className={styles.desktopNavLogo}
          >
            <img
              src={calendarIcon}
              alt="Time2Gather"
              className={styles.desktopLogo}
            />
            <VisuallyHidden.Root>홈</VisuallyHidden.Root>
          </a>
          <div className={styles.desktopNavContent}>
            <a
              href="/meetings/create"
              className={styles.desktopNavLink}
            >
              <PlusIcon width={27} height={27} />
              <VisuallyHidden.Root>약속 만들기</VisuallyHidden.Root>
            </a>
            <a
              href="/meetings/search"
              className={styles.desktopNavLink}
            >
              <MagnifyingGlassIcon width={27} height={27} />
              <VisuallyHidden.Root>약속 검색</VisuallyHidden.Root>
            </a>
            <a
              href="/meetings/my"
              className={styles.desktopNavLink}
            >
              <PersonIcon width={27} height={27} />
              <VisuallyHidden.Root>내 약속</VisuallyHidden.Root>
            </a>
          </div>
          <a
            href="https://github.com/piggmme/time2gather-fe"
            target="_blank"
            className={styles.desktopNavAboutUs}
          >
            <RocketIcon width={27} height={27} />
            <VisuallyHidden.Root>About Us</VisuallyHidden.Root>
          </a>
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
              <span>약속 만들기</span>
            </a>
            <a
              href="/meetings/search"
              className={styles.mobileNavLink}
            >
              <MagnifyingGlassIcon width={27} height={27} />
              <span>약속 검색</span>
            </a>
            <a
              href="/meetings/my"
              className={styles.mobileNavLink}
            >
              <PersonIcon width={27} height={27} />
              <span>내 약속</span>
            </a>
            <a
              href="https://github.com/piggmme/time2gather-fe"
              target="_blank"
              className={styles.mobileNavAboutUs}
            >
              <RocketIcon width={27} height={27} />
              <span>About Us</span>
            </a>
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