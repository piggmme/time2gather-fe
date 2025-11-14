import DailyGrid from "./DailyGrid";
import dayjs from "dayjs";
import styles from "./Daily.module.scss";
import { useState } from "react";

export default function Daily() {
  const [selectedDate, setSelectedDate] = useState(dayjs());

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>{selectedDate.format("YYYY년 MM월 DD일")}</h2>
      </div>
      <DailyGrid date={selectedDate} />
    </div>
  );
}

