import { useDraggable, useDroppable } from "@dnd-kit/core";
import styles from "./DailyCell.module.scss";
import dayjs from "dayjs";

type DailyCellProps = {
  hour: number;
  date: dayjs.Dayjs;
  isSelected: boolean;
  isDragged: boolean;
  onClick: () => void;
};

export default function DailyCell({ hour, date, isSelected, isDragged, onClick }: DailyCellProps) {
  const { setNodeRef: setDragRef, attributes, listeners } = useDraggable({
    id: `drag-${date.format("YYYY-MM-DD")}-${hour}`,
    data: { hour },
  });

  const { setNodeRef: setDropRef } = useDroppable({
    id: `drop-${date.format("YYYY-MM-DD")}-${hour}`,
    data: { hour },
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
        ${isSelected ? styles.selected : ""}
        ${isDragged ? styles.dragged : ""}
      `}
    >
    </div>
  );
}

