import { useDraggable, useDroppable } from "@dnd-kit/core";
import styles from "./MonthlyCell.module.scss";
import dayjs from "dayjs";

type MonthlyCellProps = {
  date: dayjs.Dayjs;
  isSelected: boolean;
  isDragged: boolean;
  isCurrentMonth: boolean;
  onClick: () => void;
};

export default function MonthlyCell({ date, isSelected, isDragged, isCurrentMonth, onClick }: MonthlyCellProps) {
  const { setNodeRef: setDragRef, attributes, listeners } = useDraggable({
    id: `drag-${date.format("YYYY-MM-DD")}`,
    data: { date },
  });

  const { setNodeRef: setDropRef } = useDroppable({
    id: `drop-${date.format("YYYY-MM-DD")}`,
    data: { date },
  });

  return (
    <div
      ref={(el) => {
        setDragRef(el);
        setDropRef(el);
      }}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`
        ${styles.cell}
        ${isCurrentMonth ? "" : styles.otherMonth}
        ${isSelected ? styles.selected : ""}
        ${isDragged ? styles.dragged : ""}
        ${date.isSame(dayjs(), "day") ? styles.today : ""}
      `}
    >
      {date.date()}
    </div>
  );
}
