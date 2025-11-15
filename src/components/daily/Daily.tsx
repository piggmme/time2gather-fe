import DailyGrid from "./DailyGrid";
import dayjs from "dayjs";
import styles from "./Daily.module.scss";
import { useState, useRef, useEffect } from "react";
import { HiChevronUp, HiChevronDown } from "react-icons/hi";

export default function Daily() {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showTopButton, setShowTopButton] = useState(false);
  const [showBottomButton, setShowBottomButton] = useState(true);

  // 시간 범위 설정 예시: 10시부터 17시까지 (오전 10시 ~ 오후 5시)
  // 기본값은 undefined로 설정하면 0-23시 전체 사용
  //   const availableHours = Array.from({ length: 8 }, (_, i) => i + 10); // [10, 11, 12, 13, 14, 15, 16, 17]
  const availableHours = undefined;

  const checkScrollPosition = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const isAtTop = scrollTop <= 10;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;

      setShowTopButton(!isAtTop);
      setShowBottomButton(!isAtBottom);
    }
  };

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      checkScrollPosition();
      scrollContainer.addEventListener("scroll", checkScrollPosition);
      
      // 초기 로드 시에도 확인
      const timer = setTimeout(checkScrollPosition, 100);
      
      return () => {
        scrollContainer.removeEventListener("scroll", checkScrollPosition);
        clearTimeout(timer);
      };
    }
  }, []);

  const scrollUp = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ top: -200, behavior: "smooth" });
    }
  };

  const scrollDown = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ top: 200, behavior: "smooth" });
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>{selectedDate.format("YYYY년 MM월 DD일")}</h2>
      </div>
      <div className={styles.scrollWrapper}>
        <button
          className={`${styles.scrollButton} ${styles.scrollButtonTop}`}
          onClick={scrollUp}
          aria-label="위로 스크롤"
          style={{ opacity: showTopButton ? 1 : 0, pointerEvents: showTopButton ? "auto" : "none" }}
        >
          <HiChevronUp />
        </button>
        <div className={styles.scrollContainer} ref={scrollContainerRef}>
          <DailyGrid date={selectedDate} availableHours={availableHours} />
        </div>
        <button
          className={`${styles.scrollButton} ${styles.scrollButtonBottom}`}
          onClick={scrollDown}
          aria-label="아래로 스크롤"
          style={{ opacity: showBottomButton ? 1 : 0, pointerEvents: showBottomButton ? "auto" : "none" }}
        >
          <HiChevronDown />
        </button>
      </div>
    </div>
  );
}

