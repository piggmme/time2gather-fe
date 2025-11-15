import { useEffect, useState } from "react";
import { DndContext, useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import MonthlyCell from "./MonthlyCell";
import dayjs from "dayjs";
import "dayjs/locale/ko";
import styles from "./MonthlyGrid.module.scss";

dayjs.locale("ko");

// 날짜 범위 배열 생성 함수
function getDateRange(start: dayjs.Dayjs | null, end: dayjs.Dayjs | null) {
  if (!start || !end) return [];

  const s = dayjs(start);
  const e = dayjs(end);

  const startDate = s.isBefore(e) ? s : e;
  const endDate = s.isBefore(e) ? e : s;

  const days: dayjs.Dayjs[] = [];
  let cur = startDate;

  while (cur.isBefore(endDate) || cur.isSame(endDate, "day")) {
    days.push(cur);
    cur = cur.add(1, "day");
  }

  return days;
}

export default function MonthlyGrid({ 
  monthDays, 
  currentYear, 
  currentMonth 
}: { 
  monthDays: dayjs.Dayjs[];
  currentYear: number;
  currentMonth: number;
}) {
  const [dates, setDates] = useState<dayjs.Dayjs[]>([]);
  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(null);
  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(null);

  const addDates = (newDates: dayjs.Dayjs[]) => {
    const allDates = [...dates, ...newDates];
    const uniqueDates = allDates.filter((date, index, self) =>
      index === self.findIndex((d) => d.isSame(date, "day"))
    );
    setDates(uniqueDates);
  };

  const handleDragedDates = (newDates: dayjs.Dayjs[]) => {
    const isAllIncluded = newDates.every((date) => dates.some((d) => d.isSame(date, "day")));
    if (isAllIncluded) {
      removeDates(newDates);
      return;
    }
    addDates(newDates);
  };

  const removeDates = (newDates: dayjs.Dayjs[]) => {
    const allDates = dates.filter((date) => !newDates.some((d) => d.isSame(date, "day")));
    setDates(allDates);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const selectedDays = getDateRange(startDate, endDate);

  // 요일 헤더 생성 (0=일요일부터 6=토요일까지)
  const weekdays = Array.from({ length: 7 }, (_, i) => {
    const day = dayjs().day(i);
    return {
      number: i,
      name: day.format("ddd"), // 한국어 축약형 요일 (일, 월, 화, 수, 목, 금, 토)
    };
  });

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(event) => {
        const date = event.active?.data?.current?.date;
        if (date) {
          setStartDate(date);
          setEndDate(date);
        }
      }}
      onDragMove={(event) => {
        const date = event.over?.data?.current?.date;
        if (date) {
          setEndDate(date);
        }
      }}
      onDragEnd={() => {
        handleDragedDates(getDateRange(startDate, endDate));
        setStartDate(null);
        setEndDate(null);
      }}
      onDragCancel={() => {
        setStartDate(null);
        setEndDate(null);
      }}
    >
      <div className={styles.container}>
        <div className={styles.weekdays}>
          {weekdays.map((weekday) => (
            <div
              key={weekday.number}
              className={`
                ${styles.weekday}
                ${weekday.number === 0 ? styles.sunday : ""}
                ${weekday.number === 6 ? styles.saturday : ""}
              `}
            >
              {weekday.name}
            </div>
          ))}
        </div>
        <div className={styles.grid}>
          {monthDays.map((day: dayjs.Dayjs) => {
            const isCurrentMonth = day.year() === currentYear && day.month() === currentMonth;
            return (
              <MonthlyCell
                key={day.format("YYYY-MM-DD")}
                date={day}
                isSelected={dates.some((d) => d.isSame(day, "day"))}
                isDragged={selectedDays.some((d) => d.isSame(day, "day"))}
                isCurrentMonth={isCurrentMonth}
                onClick={() =>  {
                  handleDragedDates([day]);
                }}
              />
            );
          })}
        </div>
      </div>
    </DndContext>
  );
}
