import { useState } from "react";
import { DndContext, useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import DailyCell from "./DailyCell";
import dayjs from "dayjs";
import styles from "./DailyGrid.module.scss";

// 시간 범위 배열 생성 함수
function getTimeRange(startHour: number | null, endHour: number | null) {
  if (startHour === null || endHour === null) return [];

  const start = Math.min(startHour, endHour);
  const end = Math.max(startHour, endHour);

  const hours: number[] = [];
  for (let i = start; i <= end; i++) {
    hours.push(i);
  }

  return hours;
}

// 0시부터 23시까지 시간 배열 생성
function generateHours(): number[] {
  return Array.from({ length: 24 }, (_, i) => i);
}

export default function DailyGrid({ date }: { date: dayjs.Dayjs }) {
  const [selectedHours, setSelectedHours] = useState<number[]>([]);
  const [startHour, setStartHour] = useState<number | null>(null);
  const [endHour, setEndHour] = useState<number | null>(null);

  const hours = generateHours();

  const addHours = (newHours: number[]) => {
    const allHours = [...selectedHours, ...newHours];
    const uniqueHours = allHours.filter((hour, index, self) => 
      index === self.indexOf(hour)
    );
    setSelectedHours(uniqueHours);
  };

  const handleDraggedHours = (newHours: number[]) => {
    const isAllIncluded = newHours.every((hour) => selectedHours.includes(hour));
    if (isAllIncluded) {
      removeHours(newHours);
      return;
    }
    addHours(newHours);
  };

  const removeHours = (newHours: number[]) => {
    const filteredHours = selectedHours.filter((hour) => !newHours.includes(hour));
    setSelectedHours(filteredHours);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const draggedHours = getTimeRange(startHour, endHour);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(event) => {
        const hour = event.active?.data?.current?.hour;
        if (hour !== undefined) {
          setStartHour(hour);
          setEndHour(hour);
        }
      }}
      onDragMove={(event) => {
        const hour = event.over?.data?.current?.hour;
        if (hour !== undefined) {
          setEndHour(hour);
        }
      }}
      onDragEnd={() => {
        handleDraggedHours(getTimeRange(startHour, endHour));
        setStartHour(null);
        setEndHour(null);
      }}
      onDragCancel={() => {
        setStartHour(null);
        setEndHour(null);
      }}
    >
      <div className={styles.grid}>
        {hours.map((hour) => (
          <DailyCell
            key={hour}
            hour={hour}
            date={date}
            isSelected={selectedHours.includes(hour)}
            isDragged={draggedHours.includes(hour)}
            onClick={() => {
              handleDraggedHours([hour]);
            }}
          />
        ))}
      </div>
    </DndContext>
  );
}

