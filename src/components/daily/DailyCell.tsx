import { useDraggable, useDroppable } from '@dnd-kit/core'
import { useState, useEffect, useRef } from 'react'
import styles from './DailyCell.module.scss'
import dayjs from 'dayjs'
import classNames from 'classnames'

// 햅틱 피드백 유틸리티
function triggerHaptic (duration = 10) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(duration)
  }
}

type DailyCellProps = {
  time: string
  date: dayjs.Dayjs
  isSelected: boolean
  isDragged: boolean
  count?: number
  maxCount?: number
  mode?: 'edit' | 'view'
  onClick: () => void
}

export default function DailyCell ({
  time, date, isSelected, isDragged, count = 0, maxCount = 0, mode = 'edit', onClick,
}: DailyCellProps) {
  const isEditMode = mode === 'edit'
  const [justSelected, setJustSelected] = useState(false)
  const prevSelectedRef = useRef(isSelected)

  // 선택 상태 변경 시 애니메이션 트리거
  useEffect(() => {
    if (isSelected && !prevSelectedRef.current) {
      // 선택됨: pulse 애니메이션 + 햅틱
      setJustSelected(true)
      triggerHaptic(10)
      const timer = setTimeout(() => setJustSelected(false), 200)
      return () => clearTimeout(timer)
    }
    prevSelectedRef.current = isSelected
  }, [isSelected])

  const { setNodeRef: setDragRef, attributes, listeners, isDragging } = useDraggable({
    id: `drag-${date.format('YYYY-MM-DD')}-${time}`,
    data: { timeSlot: time },
    disabled: !isEditMode,
  })

  const { setNodeRef: setDropRef } = useDroppable({
    id: `drop-${date.format('YYYY-MM-DD')}-${time}`,
    data: { timeSlot: time },
    disabled: !isEditMode,
  })

  // 정각인지 30분인지 판단 (timeSlot % 2 === 0이면 정각)
  const isFullHour = time.endsWith(':00')

  // count에 따른 색상 강도 계산 (0~1 사이의 값)
  const intensity = maxCount > 0 ? count / maxCount : 0

  const totalCount = count + (isSelected ? 1 : 0)
  const text = totalCount > 0 ? `${totalCount}/${maxCount}` : ''

  return (
    <div
      ref={(el) => {
        setDragRef(el)
        setDropRef(el)
      }}
      {...(isEditMode ? { ...attributes, ...listeners } : {})}
      onClick={onClick}
      className={classNames(
        styles.cell,
        {
          [styles.selected]: isSelected,
          [styles.dragged]: isDragged,
          [styles.dragging]: isDragging, // 드래그 시작점 (long-press 활성화 상태)
          [styles.justSelected]: justSelected, // 방금 선택됨 애니메이션
          [styles.fullHour]: isFullHour,
          [styles.halfHour]: !isFullHour,
          [styles.hasCount]: count > 0,
          [styles.viewMode]: !isEditMode,
        },
      )}
      style={count > 0 ? { '--intensity': intensity } as React.CSSProperties : undefined}
    >
      {text}
    </div>
  )
}
