import MonthlyGrid from "./MonthlyGrid";
import dayjs from "dayjs";
import styles from "./Monthly.module.scss";

function getMonthDays(year: number, month: number) {
  const start = dayjs().year(year).month(month).date(1);
  const end = start.endOf("month");

  const days: dayjs.Dayjs[] = [];
  let cur = start;

  while (cur.isBefore(end) || cur.isSame(end, "day")) {
    days.push(cur);
    cur = cur.add(1, "day");
  }

  return days;
}

export default function Monthly() {
  const monthDays = getMonthDays(2025, 11); // 2025년 2월

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>2025년 11월</h2>
      <MonthlyGrid monthDays={monthDays} />
    </div>
  );
}
