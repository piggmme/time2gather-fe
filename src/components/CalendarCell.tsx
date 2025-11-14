import { useDraggable, useDroppable } from "@dnd-kit/core";
import styles from "./CalendarCell.module.scss";
import dayjs from "dayjs";

type CalendarCellProps = {
  date: dayjs.Dayjs;
  isSelected: boolean;
  isDragged: boolean;
  onClick: () => void;
};

export default function CalendarCell({ date, isSelected, isDragged, onClick }: CalendarCellProps) {
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
      className={`${styles.cell} ${isSelected ? styles.selected : ""} ${isDragged ? styles.dragged : ""}`}
    >
      {date.date()}
    </div>
  );
}
