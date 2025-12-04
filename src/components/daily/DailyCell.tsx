import { useDraggable, useDroppable } from "@dnd-kit/core";
import styles from "./DailyCell.module.scss";
import dayjs from "dayjs";
import classNames from "classnames";

type DailyCellProps = {
  time: string;
  date: dayjs.Dayjs;
  isSelected: boolean;
  isDragged: boolean;
  count?: number;
  maxCount?: number;
  onClick: () => void;
};

export default function DailyCell({ time, date, isSelected, isDragged, count = 0, maxCount = 0, onClick }: DailyCellProps) {
  const { setNodeRef: setDragRef, attributes, listeners } = useDraggable({
    id: `drag-${date.format("YYYY-MM-DD")}-${time}`,
    data: { timeSlot: time },
  });

  const { setNodeRef: setDropRef } = useDroppable({
    id: `drop-${date.format("YYYY-MM-DD")}-${time}`,
    data: { timeSlot: time },
  });

  // 정각인지 30분인지 판단 (timeSlot % 2 === 0이면 정각)
  const isFullHour = time.endsWith(":00");

  // count에 따른 색상 강도 계산 (0~1 사이의 값)
  const intensity = maxCount > 0 ? count / maxCount : 0;

  return (
    <div
      ref={(el) => {
        setDragRef(el);
        setDropRef(el);
      }}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={classNames(
        styles.cell,
        {
          [styles.selected]: isSelected,
          [styles.dragged]: isDragged,
          [styles.fullHour]: isFullHour,
          [styles.halfHour]: !isFullHour,
          [styles.hasCount]: count > 0,
        }
      )}
      style={count > 0 ? { '--intensity': intensity } as React.CSSProperties : undefined}
    >
    </div>
  );
}

