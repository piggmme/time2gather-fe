import { useDraggable, useDroppable } from "@dnd-kit/core";
import styles from "./MonthlyCell.module.scss";
import dayjs from "dayjs";

type MonthlyCellProps = {
  date: dayjs.Dayjs;
  isSelected: boolean;
  isDragged: boolean;
  isCurrentMonth: boolean;
  mode?: 'edit' | 'view';
  disabled?: boolean;
  onClick?: () => void;
};

export default function MonthlyCell({ date, isSelected, isDragged, isCurrentMonth, mode = 'edit', disabled = false, onClick }: MonthlyCellProps) {
  const isEditMode = mode === 'edit';
  
  const { setNodeRef: setDragRef, attributes, listeners } = useDraggable({
    id: `drag-${date.format("YYYY-MM-DD")}`,
    data: { date },
    disabled: !isEditMode || disabled,
  });

  const { setNodeRef: setDropRef } = useDroppable({
    id: `drop-${date.format("YYYY-MM-DD")}`,
    data: { date },
    disabled: !isEditMode || disabled,
  });

  const dayOfWeek = date.day(); // 0 = 일요일, 6 = 토요일
  const isSunday = dayOfWeek === 0;
  const isSaturday = dayOfWeek === 6;

  return (
    <div
      ref={(el) => {
        setDragRef(el);
        setDropRef(el);
      }}
      {...(isEditMode && !disabled ? attributes : {})}
      {...(isEditMode && !disabled ? listeners : {})}
      onClick={disabled ? undefined : onClick}
      className={`
        ${styles.cell}
        ${isCurrentMonth ? "" : styles.otherMonth}
        ${isSelected ? styles.selected : ""}
        ${isDragged ? styles.dragged : ""}
        ${date.isSame(dayjs(), "day") ? styles.today : ""}
        ${isSunday ? styles.sunday : ""}
        ${isSaturday ? styles.saturday : ""}
        ${!isEditMode ? styles.viewMode : ""}
        ${!isEditMode && !onClick ? styles.viewModeNoClick : ""}
        ${disabled ? styles.disabled : ""}
      `}
    >
      {date.date()}
    </div>
  );
}
