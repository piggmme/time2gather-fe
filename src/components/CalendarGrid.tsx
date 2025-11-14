import { useEffect, useState } from "react";
import { DndContext, useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import CalendarCell from "./CalendarCell";
import dayjs from "dayjs";
import styles from "./CalendarGrid.module.scss";

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

export default function CalendarGrid({ monthDays }: { monthDays: dayjs.Dayjs[] }) {
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
      <div className={styles.grid}>
        {monthDays.map((day: dayjs.Dayjs) => (
          <CalendarCell
            key={day.format("YYYY-MM-DD")}
            date={day}
            isSelected={dates.some((d) => d.isSame(day, "day"))}
            isDragged={selectedDays.some((d) => d.isSame(day, "day"))}
            onClick={() =>  {
              handleDragedDates([day]);
            }}
          />
        ))}
      </div>
    </DndContext>
  );
}
