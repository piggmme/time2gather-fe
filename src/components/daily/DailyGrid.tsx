import { useState, useRef, useEffect } from "react";
import { DndContext } from "@dnd-kit/core";
import DailyCell from "./DailyCell";
import dayjs from "dayjs";
import styles from "./DailyGrid.module.scss";
import { useDragSensors } from "../../hooks/useDragSensors";
import { useDragScrollPrevention } from "../../hooks/useDragScrollPrevention";
import { getTimeRangeSlots } from "../../utils/time";

// 시간 슬롯 범위 배열 생성 함수
function getTimeSlotRange(startSlot: string | null, endSlot: string | null) {
  if (startSlot === null || endSlot === null) return [];
  return getTimeRangeSlots(startSlot, endSlot);
}

export default function DailyGrid({
  date,
  availableTimes,
  onSelectionsChange,
}: {
  date: dayjs.Dayjs;
  availableTimes: string[];
  onSelectionsChange?: (selectedTimeSlots: string[]) => void;
}) {
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);
  const [startTimeSlot, setStartTimeSlot] = useState<string | null>(null);
  const [endTimeSlot, setEndTimeSlot] = useState<string | null>(null);
  const gridWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onSelectionsChange?.(selectedTimeSlots);
  }, [selectedTimeSlots])

  const addTimeSlots = (newTimeSlots: string[]) => {
    const allTimeSlots = [...selectedTimeSlots, ...newTimeSlots];
    const uniqueTimeSlots = allTimeSlots.filter((slot, index, self) =>
      index === self.indexOf(slot)
    );
    setSelectedTimeSlots(uniqueTimeSlots);
  };

  const handleDraggedTimeSlots = (newTimeSlots: string[]) => {
    // availableHours 범위 내의 시간 슬롯만 필터링
    const validTimeSlots = newTimeSlots.filter((slot) => availableTimes.includes(slot));
    if (validTimeSlots.length === 0) return;

    const isAllIncluded = validTimeSlots.every((slot) => selectedTimeSlots.includes(slot));
    if (isAllIncluded) {
      removeTimeSlots(validTimeSlots);
      return;
    }
    addTimeSlots(validTimeSlots);
  };

  const removeTimeSlots = (newTimeSlots: string[]) => {
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
        if (timeSlot !== undefined && availableTimes.includes(timeSlot)) {
          setStartTimeSlot(timeSlot);
          setEndTimeSlot(timeSlot);
        }
      }}
      onDragMove={(event) => {
        const timeSlot = event.over?.data?.current?.timeSlot;
        if (timeSlot !== undefined && availableTimes.includes(timeSlot)) {
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
          {availableTimes.map((time) => (
            <DailyCell
              key={time}
              time={time}
              date={date}
              isSelected={selectedTimeSlots.includes(time)}
              isDragged={draggedTimeSlots.includes(time)}
              onClick={() => {
                handleDraggedTimeSlots([time]);
              }}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}

