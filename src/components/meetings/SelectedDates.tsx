import { useState } from "react";
import dayjs from "dayjs";
import styles from "./CreateMeeting.module.scss";
import Badge from "../Badge/Badge";

export default function SelectedDates ({ dates, locale, visibleCount }: { dates: (string | dayjs.Dayjs)[], locale: 'ko' | 'en', visibleCount?: number }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formattedDates = dates.map((d) => d instanceof dayjs ? d : dayjs(d));
  const INITIAL_COUNT = visibleCount ?? 2;
  const visibleDates = isExpanded ? formattedDates : formattedDates.slice(0, INITIAL_COUNT);
  const remainingCount = formattedDates.length - INITIAL_COUNT;

  return (
    <div className={styles.dateBadges}>
      {visibleDates.map((d) => (
        <Badge key={d.format("YYYY-MM-DD")} text={formatDate(d, locale)} type="primary" />
      ))}
      {!isExpanded && remainingCount > 0 && (
        <button
          className={styles.moreButton}
          onClick={() => setIsExpanded(true)}
        >
          +{remainingCount}
        </button>
      )}
    </div>
  )
}

function formatDate(date: dayjs.Dayjs, locale: 'ko' | 'en'): string {
  const now = dayjs();
  const isSameYear = date.year() === now.year();
  const weekday = date.format("ddd");

  if (locale === 'ko') {
    if (isSameYear) {
      return `${date.format('M월 D일')} (${weekday})`;
    } else {
      return `${date.format('YYYY년 M월 D일')} (${weekday})`;
    }
  } else {
    if (isSameYear) {
      return `${date.format('MMM D')} (${weekday})`;
    } else {
      return `${date.format('MMM D, YYYY')} (${weekday})`;
    }
  }
}