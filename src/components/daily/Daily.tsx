import DailyGrid from "./DailyGrid";
import dayjs from "dayjs";
import styles from "./Daily.module.scss";
import { useState } from "react";

export default function Daily() {
  const [selectedDate, setSelectedDate] = useState(dayjs());

  // 시간 범위 설정 예시: 10시부터 17시까지 (오전 10시 ~ 오후 5시)
  // 기본값은 undefined로 설정하면 0-23시 전체 사용
  //   const availableHours = Array.from({ length: 8 }, (_, i) => i + 10); // [10, 11, 12, 13, 14, 15, 16, 17]
  const availableHours = undefined;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>{selectedDate.format("YYYY년 MM월 DD일")}</h2>
      </div>
      <DailyGrid date={selectedDate} availableHours={availableHours} />
    </div>
  );
}

