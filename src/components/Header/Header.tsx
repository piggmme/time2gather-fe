import { PiHamburger } from "react-icons/pi";
import { HiChevronLeft } from "react-icons/hi";
import styles from "./Header.module.scss";
import { useState, useEffect } from "react";
import { useLocation } from "react-use";

export default function Header() {
  const location = useLocation()
  const [hasHistory, setHasHistory] = useState(false)

  useEffect(() => {
    if (location) {
      const pathname = location.pathname || window.location.pathname;
      const isHomePage = pathname === '/' || pathname === '';
      setHasHistory(!isHomePage);
    }
  }, [location]);

  const handleBack = () => {
    window.history.back();
  };

  return (
    <header className={`${styles.header} ${!hasHistory ? styles.noBackButton : ''}`}>
      {hasHistory && (
        <div className={styles.left}>
          <button 
            className={styles.backButton}
            onClick={handleBack}
          >
            <HiChevronLeft size={24} />
          </button>
        </div>
      )}
      <a 
        href="/" 
        className={`${styles.title} ${hasHistory ? styles.center : styles.left}`}
      >
        Time2Gather
      </a>
      <div className={styles.right}>
        <button className={styles.menuButton}>
          <PiHamburger size={24} />
        </button>
      </div>
    </header>
  )
}