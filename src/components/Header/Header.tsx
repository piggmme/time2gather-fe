import styles from "./Header.module.scss";
import { useState } from "react";
import calendarIcon from "../../assets/calendar.svg?url";
import { HamburgerMenuIcon } from "@radix-ui/react-icons";

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
            <HamburgerMenuIcon />
          </button>
        </div>

        {/* 데스크톱 네비게이션 */}
        <nav className={styles.desktopNav}>
          <div className={styles.desktopNavContent}>
            <a
              href="/"
              className={styles.desktopTitle}
            >
              <img
                src={calendarIcon}
                alt="Time2Gather"
                className={styles.desktopLogo}
              />
            </a>
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