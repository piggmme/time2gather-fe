import Daily from "../daily/Daily";
import dayjs from "dayjs";
import { useTranslation } from "../../hooks/useTranslation";
import styles from './SelectPage.module.scss';
import { useEffect, useRef, useState } from "react";

export default function SelectPage({ dates, availableTimes }: { dates: string[], availableTimes: string[] }) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<string>('100svh');

  useEffect(() => {
    if (containerRef.current) {
      // containerRef 의 왼쪽 상단 모서리 위치 계산
      const leftTop = containerRef.current.getBoundingClientRect();
      setHeight(`calc(100svh - ${leftTop.top}px - 30px)`);
    }
  }, []);

  return (
    <>
      <h2>{t('meeting.selectedDates', { count: dates.length })}</h2>
      <div
        className={styles.container}
        ref={containerRef}
      >
        <Daily
          dates={dates.map((date) => dayjs(date))}
          availableTimes={availableTimes}
          height={height}
        />
      </div>
    </>
  )
}