import { PiHamburger } from "react-icons/pi";
import { HiChevronLeft } from "react-icons/hi";
import styles from "./Header.module.scss";

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button id="backButton" className={styles.backButton}>
          <HiChevronLeft size={24} />
        </button>
      </div>
      <a href="/" className={styles.title}>Time2Gather</a>
      <div className={styles.right}>
        <button className={styles.menuButton}>
          <PiHamburger size={24} />
        </button>
      </div>
    </header>
  )
}