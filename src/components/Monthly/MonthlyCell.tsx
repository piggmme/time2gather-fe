import { useDraggable, useDroppable } from "@dnd-kit/core";
import styles from "./MonthlyCell.module.scss";
import dayjs from "dayjs";

type MonthlyCellProps = {
  date: dayjs.Dayjs;
  isSelected: boolean;
  isDragged: boolean;
  onClick: () => void;
};

export default function MonthlyCell({ date, isSelected, isDragged, onClick }: MonthlyCellProps) {
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
