import { useDraggable, useDroppable } from '@dnd-kit/core'
import styles from './MonthlyCell.module.scss'
import dayjs from 'dayjs'

type MonthlyCellProps = {
  date: dayjs.Dayjs
  isSelected: boolean
  isDragged: boolean
  isCurrentMonth: boolean
  mode?: 'edit' | 'view'
  disabled?: boolean
  onClick?: () => void
  count?: number
  maxCount?: number
}

export default function MonthlyCell ({
  date, isSelected, isDragged, isCurrentMonth, mode = 'edit', disabled = false, onClick, count = 0, maxCount = 0,
}: MonthlyCellProps) {
  const isEditMode = mode === 'edit'

  // count에 따른 색상 강도 계산 (0~1 사이의 값)
  const totalCount = count + (isSelected ? 1 : 0)
  const intensity = maxCount > 0 ? totalCount / maxCount : 0

  const backgroundColor = count > 0
    ? `rgba(59, 131, 246, ${intensity / 2})`
    : undefined

  const { setNodeRef: setDragRef, attributes, listeners } = useDraggable({
    id: `drag-${date.format('YYYY-MM-DD')}`,
    data: { date },
    disabled: !isEditMode || disabled,
  })

  const { setNodeRef: setDropRef } = useDroppable({
    id: `drop-${date.format('YYYY-MM-DD')}`,
    data: { date },
    disabled: !isEditMode || disabled,
  })

  const dayOfWeek = date.day() // 0 = 일요일, 6 = 토요일
  const isSunday = dayOfWeek === 0
  const isSaturday = dayOfWeek === 6

  return (
    <div
      ref={(el) => {
        setDragRef(el)
        setDropRef(el)
      }}
      {...(isEditMode && !disabled ? attributes : {})}
      {...(isEditMode && !disabled ? listeners : {})}
      onClick={disabled ? undefined : onClick}
      className={`
        ${styles.cell}
        ${isCurrentMonth ? '' : styles.otherMonth}
        ${isSelected ? styles.selected : ''}
        ${isDragged ? styles.dragged : ''}
        ${date.isSame(dayjs(), 'day') ? styles.today : ''}
        ${isSunday ? styles.sunday : ''}
        ${isSaturday ? styles.saturday : ''}
        ${!isEditMode ? styles.viewMode : ''}
        ${!isEditMode && !onClick ? styles.viewModeNoClick : ''}
        ${disabled ? styles.disabled : ''}
        ${count > 0 ? styles.hasCount : ''}
      `}
      style={backgroundColor ? { backgroundColor } as React.CSSProperties : undefined}
    >
      {date.date()}
      {!isEditMode && maxCount > 0 && totalCount > 0 && (
        <span className={`${styles.countBadge} ${isSelected ? styles.selected : ''}`}>{totalCount}/{maxCount}</span>
      )}
    </div>
  )
}
