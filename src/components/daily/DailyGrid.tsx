import { useState, useRef } from "react";
import { DndContext } from "@dnd-kit/core";
import DailyCell from "./DailyCell";
import dayjs from "dayjs";
import styles from "./DailyGrid.module.scss";
import { useDragSensors } from "../../hooks/useDragSensors";
import { useDragScrollPrevention } from "../../hooks/useDragScrollPrevention";

// 시간 슬롯 범위 배열 생성 함수
function getTimeSlotRange(startSlot: number | null, endSlot: number | null) {
  if (startSlot === null || endSlot === null) return [];

  const start = Math.min(startSlot, endSlot);
  const end = Math.max(startSlot, endSlot);

  const slots: number[] = [];
  for (let i = start; i <= end; i++) {
    slots.push(i);
  }

  return slots;
}

// 0:00부터 23:30까지 30분 단위 시간 슬롯 배열 생성 (기본값)
// 0 = 00:00, 1 = 00:30, 2 = 01:00, ..., 47 = 23:30
function generateDefaultTimeSlots(): number[] {
  return Array.from({ length: 48 }, (_, i) => i);
}

export default function DailyGrid({ 
  date, 
  availableHours 
}: { 
  date: dayjs.Dayjs;
  availableHours?: number[];
}) {
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<number[]>([]);
  const [startTimeSlot, setStartTimeSlot] = useState<number | null>(null);
  const [endTimeSlot, setEndTimeSlot] = useState<number | null>(null);
  const gridWrapperRef = useRef<HTMLDivElement>(null);

  const timeSlots = availableHours || generateDefaultTimeSlots();

  const addTimeSlots = (newTimeSlots: number[]) => {
    const allTimeSlots = [...selectedTimeSlots, ...newTimeSlots];
    const uniqueTimeSlots = allTimeSlots.filter((slot, index, self) =>
      index === self.indexOf(slot)
    );
    setSelectedTimeSlots(uniqueTimeSlots);
  };

  const handleDraggedTimeSlots = (newTimeSlots: number[]) => {
    // availableHours 범위 내의 시간 슬롯만 필터링
    const validTimeSlots = newTimeSlots.filter((slot) => timeSlots.includes(slot));
    if (validTimeSlots.length === 0) return;

    const isAllIncluded = validTimeSlots.every((slot) => selectedTimeSlots.includes(slot));
    if (isAllIncluded) {
      removeTimeSlots(validTimeSlots);
      return;
    }
    addTimeSlots(validTimeSlots);
  };

  const removeTimeSlots = (newTimeSlots: number[]) => {
    const filteredTimeSlots = selectedTimeSlots.filter((slot) => !newTimeSlots.includes(slot));
    setSelectedTimeSlots(filteredTimeSlots);
  };

  const sensors = useDragSensors();
  
  // 드래그 중일 때 스크롤 방지
  useDragScrollPrevention(startTimeSlot !== null, gridWrapperRef);

  const draggedTimeSlots = getTimeSlotRange(startTimeSlot, endTimeSlot);

  return (
    <div className={styles.gridWrapper} ref={gridWrapperRef}>
      <DndContext
      sensors={sensors}
      onDragStart={(event) => {
        const timeSlot = event.active?.data?.current?.timeSlot;
        if (timeSlot !== undefined && timeSlots.includes(timeSlot)) {
          setStartTimeSlot(timeSlot);
          setEndTimeSlot(timeSlot);
        }
      }}
      onDragMove={(event) => {
        const timeSlot = event.over?.data?.current?.timeSlot;
        if (timeSlot !== undefined && timeSlots.includes(timeSlot)) {
          setEndTimeSlot(timeSlot);
        }
      }}
      onDragEnd={() => {
        handleDraggedTimeSlots(getTimeSlotRange(startTimeSlot, endTimeSlot));
        setStartTimeSlot(null);
        setEndTimeSlot(null);
      }}
      onDragCancel={() => {
        setStartTimeSlot(null);
        setEndTimeSlot(null);
      }}
    >
        <div className={styles.grid}>
          {timeSlots.map((timeSlot) => (
            <DailyCell
              key={timeSlot}
              hour={timeSlot}
              date={date}
              isSelected={selectedTimeSlots.includes(timeSlot)}
              isDragged={draggedTimeSlots.includes(timeSlot)}
              onClick={() => {
                handleDraggedTimeSlots([timeSlot]);
              }}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}

