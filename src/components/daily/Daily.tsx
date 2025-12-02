import DailyGrid from "./DailyGrid";
import dayjs from "dayjs";
import "dayjs/locale/ko";
import "dayjs/locale/en";
import styles from "./Daily.module.scss";
import { useState, useRef, useEffect } from "react";
import { HiChevronLeft, HiChevronRight, HiChevronUp, HiChevronDown } from "react-icons/hi";
import { useStore } from "@nanostores/react";
import { $locale } from "../../stores/locale";
import { formatDate } from "../../utils/time";

type DailyProps = {
  dates: dayjs.Dayjs[];
  availableTimes: string[];
}
export default function Daily({ dates, availableTimes }: DailyProps) {
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

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.scrollWrapper} ref={scrollWrapperRef}>
          <div className={styles.timeColumn}>
            {availableTimes.map((time) => {
              const isFullHour = time.endsWith(":00");
              return (
                <div
                  key={time}
                  className={`${styles.timeCell} ${isFullHour ? styles.fullHour : styles.halfHour}`}
                >
                  {time}
                </div>
              );
            })}
          </div>
          <div className={styles.scrollContainer} ref={scrollContainerRef}>
            {
              dates.map((date) => (
                <div className={styles.dateWrapper}>
                  <span className={styles.dateTitle}>{formatDate(date, locale)}</span>
                  <DailyGrid
                    key={date.format("YYYY-MM-DD")}
                    date={date}
                    availableTimes={availableTimes}
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

