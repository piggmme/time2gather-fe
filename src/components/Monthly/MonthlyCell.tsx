import { useDraggable, useDroppable } from '@dnd-kit/core'
import styles from './MonthlyCell.module.scss'
import dayjs from 'dayjs'

type MonthlyCellProps = {
  date: dayjs.Dayjs
  isSelected: boolean
  isDragged: boolean
  isCurrentMonth: boolean
  isAvailable?: boolean
  mode?: 'edit' | 'view'
  disabled?: boolean
  onClick?: () => void
  count?: number
  maxCount?: number
}

export default function MonthlyCell ({
  date, isSelected, isDragged, isCurrentMonth, isAvailable = false, mode = 'edit', disabled = false, onClick, count = 0, maxCount = 0,
}: MonthlyCellProps) {
  const isEditMode = mode === 'edit'
  const isInteractive = !disabled && (isEditMode || Boolean(onClick))

  // count에 따른 색상 강도 계산 (0~1 사이의 값)
  const totalCount = count + (isSelected ? 1 : 0)
  const intensity = maxCount > 0 ? totalCount / maxCount : 0

  // 다른 사람 선택: 민트/청록색 (52, 211, 153 = $c-green)
  // 내 선택 + 다른 사람 선택: 보라색 그라데이션은 CSS에서 처리
  const backgroundColor = (mode === 'view' && count > 0 && !isSelected)
    ? `rgba(52, 211, 153, ${0.15 + intensity * 0.35})`
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
  const isToday = date.isSame(dayjs(), 'day')

  return (
    <button
      type='button'
      ref={(el) => {
        setDragRef(el)
        setDropRef(el)
      }}
      {...(isEditMode && !disabled ? attributes : {})}
      {...(isEditMode && !disabled ? listeners : {})}
      onClick={disabled ? undefined : onClick}
      disabled={!isInteractive}
      aria-label={date.format('YYYY-MM-DD')}
      aria-pressed={isInteractive ? isSelected : undefined}
      aria-current={isToday ? 'date' : undefined}
      className={`
        ${styles.cell}
        ${isCurrentMonth ? '' : styles.otherMonth}
        ${isEditMode && isAvailable ? styles.available : ''}
        ${isSelected ? styles.selected : ''}
        ${isDragged ? styles.dragged : ''}
        ${isToday ? styles.today : ''}
        ${isSunday ? styles.sunday : ''}
        ${isSaturday ? styles.saturday : ''}
        ${!isEditMode ? styles.viewMode : ''}
        ${!isEditMode && !onClick ? styles.viewModeNoClick : ''}
        ${disabled ? styles.disabled : ''}
        ${count > 0 ? styles.hasCount : ''}
      `}
      style={backgroundColor ? { backgroundColor } as React.CSSProperties : undefined}
    >
      <span className={styles.dayNumber}>{date.date()}</span>
      {maxCount > 0 && totalCount > 0 && (
        <span className={`${styles.countBadge} ${isSelected ? styles.selected : ''}`}>{totalCount}/{maxCount}</span>
      )}
    </button>
  )
}
