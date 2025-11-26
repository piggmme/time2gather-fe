import DailyGrid from "./DailyGrid";
import dayjs from "dayjs";
import "dayjs/locale/ko";
import "dayjs/locale/en";
import styles from "./Daily.module.scss";
import { useState, useRef, useEffect } from "react";
import { HiChevronLeft, HiChevronRight, HiChevronUp, HiChevronDown } from "react-icons/hi";
import { useStore } from "@nanostores/react";
import { $locale } from "../../stores/locale";

export default function Daily() {
  const locale = useStore($locale);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollWrapperRef = useRef<HTMLDivElement>(null);
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(true);
  const [showTopButton, setShowTopButton] = useState(false);
  const [showBottomButton, setShowBottomButton] = useState(true);

  // Update dayjs locale when locale changes
  useEffect(() => {
    dayjs.locale(locale === 'ko' ? 'ko' : 'en');
  }, [locale]);

  // Format date based on locale
  const formatDate = (date: dayjs.Dayjs) => {
    if (locale === 'ko') {
      return date.format("M월 D일 ddd");
    } else {
      return date.format("MMM D ddd");
    }
  };

  // 시간 범위 설정 예시: 10시부터 17시까지 (오전 10시 ~ 오후 5시)
  // 기본값은 undefined로 설정하면 0-23시 전체 사용
  //   const availableHours = Array.from({ length: 8 }, (_, i) => i + 10); // [10, 11, 12, 13, 14, 15, 16, 17]
  const availableHours = undefined;

  const checkHorizontalScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      
      // 스크롤이 필요 없는 경우 (모든 내용이 화면에 보이는 경우)
      if (scrollWidth <= clientWidth) {
        setShowLeftButton(false);
        setShowRightButton(false);
        return;
      }
      
      const isAtLeft = scrollLeft <= 10;
      const isAtRight = scrollLeft + clientWidth >= scrollWidth - 10;

      setShowLeftButton(!isAtLeft);
      setShowRightButton(!isAtRight);
    }
  };

  const checkVerticalScroll = () => {
    if (scrollWrapperRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollWrapperRef.current;
      const isAtTop = scrollTop <= 10;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;

      setShowTopButton(!isAtTop);
      setShowBottomButton(!isAtBottom);
    }
  };

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    const scrollWrapper = scrollWrapperRef.current;
    
    if (scrollContainer) {
      checkHorizontalScroll();
      scrollContainer.addEventListener("scroll", checkHorizontalScroll);
      
      // resize 이벤트도 감지하여 화면 크기 변경 시 버튼 표시 상태 업데이트
      const handleResize = () => {
        checkHorizontalScroll();
      };
      window.addEventListener("resize", handleResize);
      
      const timer1 = setTimeout(checkHorizontalScroll, 100);
      
      return () => {
        scrollContainer.removeEventListener("scroll", checkHorizontalScroll);
        window.removeEventListener("resize", handleResize);
        clearTimeout(timer1);
      };
    }
  }, []);

  useEffect(() => {
    const scrollWrapper = scrollWrapperRef.current;
    
    if (scrollWrapper) {
      checkVerticalScroll();
      scrollWrapper.addEventListener("scroll", checkVerticalScroll);
      const timer2 = setTimeout(checkVerticalScroll, 100);
      
      return () => {
        scrollWrapper.removeEventListener("scroll", checkVerticalScroll);
        clearTimeout(timer2);
      };
    }
  }, []);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: "smooth" });
    }
  };

  const scrollUp = () => {
    if (scrollWrapperRef.current) {
      scrollWrapperRef.current.scrollBy({ top: -200, behavior: "smooth" });
    }
  };

  const scrollDown = () => {
    if (scrollWrapperRef.current) {
      scrollWrapperRef.current.scrollBy({ top: 200, behavior: "smooth" });
    }
  };

  const formatTimeSlot = (slot: number): string => {
    const hour = Math.floor(slot / 2);
    const minute = (slot % 2) * 30;
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  };

  const timeSlots = availableHours || Array.from({ length: 48 }, (_, i) => i);

  const dates = [
    dayjs('2025-11-10'),
    dayjs('2025-11-20'),
    dayjs('2025-11-25'),
    dayjs('2025-12-1'),
    dayjs('2025-12-3'),
    dayjs('2025-12-5'),
    dayjs('2025-12-7'),
    dayjs('2025-12-9'),
  ]

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.scrollWrapper} ref={scrollWrapperRef}>
          <div className={styles.timeColumn}>
            {timeSlots.map((slot) => {
              const isFullHour = slot % 2 === 0;
              return (
                <div
                  key={slot}
                  className={`${styles.timeCell} ${isFullHour ? styles.fullHour : styles.halfHour}`}
                >
                  {formatTimeSlot(slot)}
                </div>
              );
            })}
          </div>
          <div className={styles.scrollContainer} ref={scrollContainerRef}>
            {
              dates.map((date) => (
                <div className={styles.dateWrapper}>
                  <span className={styles.dateTitle}>{formatDate(date)}</span>
                  <DailyGrid
                    key={date.format("YYYY-MM-DD")}
                    date={date}
                    availableHours={availableHours}
                  />
                </div>
              ))
            }
          </div>
        </div>
        <button
          className={`${styles.scrollButtonVertical} ${styles.scrollButtonTop}`}
          onClick={scrollUp}
          aria-label="위로 스크롤"
          style={{ opacity: showTopButton ? 1 : 0, pointerEvents: showTopButton ? "auto" : "none" }}
        >
          <HiChevronUp />
        </button>
        <button
          className={`${styles.scrollButtonHorizontal} ${styles.scrollButtonLeft}`}
          onClick={scrollLeft}
          aria-label="왼쪽으로 스크롤"
          style={{ opacity: showLeftButton ? 1 : 0, pointerEvents: showLeftButton ? "auto" : "none" }}
        >
          <HiChevronLeft />
        </button>
        <button
          className={`${styles.scrollButtonHorizontal} ${styles.scrollButtonRight}`}
          onClick={scrollRight}
          aria-label="오른쪽으로 스크롤"
          style={{ opacity: showRightButton ? 1 : 0, pointerEvents: showRightButton ? "auto" : "none" }}
        >
          <HiChevronRight />
        </button>
        <button
          className={`${styles.scrollButtonVertical} ${styles.scrollButtonBottom}`}
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

