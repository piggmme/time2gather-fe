import { useDraggable, useDroppable } from '@dnd-kit/core'
import styles from './MonthlyCell.module.scss'
import dayjs from 'dayjs'
import { useTranslation } from '../../hooks/useTranslation'

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
  const { t } = useTranslation()
  const isEditMode = mode === 'edit'
  const isInteractive = !disabled && (isEditMode || Boolean(onClick))

  const totalCount = count + (isSelected ? 1 : 0)
  const voteRatio = maxCount > 0 ? Math.min(totalCount / maxCount, 1) : 0
  // 낮은 득표 구간도 구분되면서, 유력 후보로 갈수록 대비가 빠르게 커지도록 보정한다.
  const heatStrength = Math.pow(voteRatio, 0.75)
  const heatStyle = totalCount > 0
    ? { '--heat-strength': heatStrength } as React.CSSProperties
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
      style={heatStyle}
    >
      <span className={styles.dayNumber}>{date.date()}</span>
      {isEditMode && isToday && (
        <span className={styles.todayLabel}>{t('meeting.dateCalendar.today')}</span>
      )}
      {maxCount > 0 && totalCount > 0 && (
        <span className={`${styles.countBadge} ${isSelected ? styles.selected : ''}`}>{totalCount}/{maxCount}</span>
      )}
    </button>
  )
}
