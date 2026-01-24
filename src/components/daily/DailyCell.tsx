import { useState, useEffect, useRef } from 'react'
import styles from './DailyCell.module.scss'
import classNames from 'classnames'

// 햅틱 피드백 유틸리티
function triggerHaptic (duration = 10) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(duration)
  }
}

type DailyCellProps = {
  time: string
  dateKey: string
  timeIndex: number
  isSelected: boolean
  isDragHighlighted?: boolean
  dragMode?: 'select' | 'deselect'
  count?: number
  maxCount?: number
  mode?: 'edit' | 'view'
  onClick: () => void
}

export default function DailyCell ({
  time,
  dateKey,
  timeIndex,
  isSelected,
  isDragHighlighted = false,
  dragMode,
  count = 0,
  maxCount = 0,
  mode = 'edit',
  onClick,
}: DailyCellProps) {
  const isEditMode = mode === 'edit'
  const [justSelected, setJustSelected] = useState(false)
  const prevSelectedRef = useRef(isSelected)

  // 선택 상태 변경 시 애니메이션 트리거
  useEffect(() => {
    if (isSelected && !prevSelectedRef.current) {
      setJustSelected(true)
      triggerHaptic(10)
      const timer = setTimeout(() => setJustSelected(false), 200)
      return () => clearTimeout(timer)
    }
    prevSelectedRef.current = isSelected
  }, [isSelected])

  // 정각인지 30분인지 판단
  const isFullHour = time.endsWith(':00')

  // count에 따른 색상 강도 계산 (0~1 사이의 값)
  const intensity = maxCount > 0 ? count / maxCount : 0

  const totalCount = count + (isSelected ? 1 : 0)
  const text = totalCount > 0 ? `${totalCount}/${maxCount}` : ''

  // 데스크톱에서는 기존 onClick 사용 (터치는 Daily.tsx에서 처리)
  const handleClick = (e: React.MouseEvent) => {
    // 터치 디바이스에서는 Daily.tsx에서 처리하므로 무시
    if ('ontouchstart' in window) return
    if (!isEditMode) return
    onClick()
  }

  return (
    <div
      data-date-key={dateKey}
      data-time-index={timeIndex}
      onClick={handleClick}
      className={classNames(
        styles.cell,
        {
          [styles.selected]: isSelected,
          [styles.justSelected]: justSelected,
          [styles.fullHour]: isFullHour,
          [styles.halfHour]: !isFullHour,
          [styles.hasCount]: count > 0,
          [styles.viewMode]: !isEditMode,
          [styles.dragHighlighted]: isDragHighlighted,
          [styles.dragSelect]: isDragHighlighted && dragMode === 'select',
          [styles.dragDeselect]: isDragHighlighted && dragMode === 'deselect',
        },
      )}
      style={count > 0 ? { '--intensity': intensity } as React.CSSProperties : undefined}
    >
      {text}
    </div>
  )
}
