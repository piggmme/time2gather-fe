import { useState, useEffect, useRef } from 'react'
import styles from './DailyCell.module.scss'
import classNames from 'classnames'

// 햅틱 피드백 유틸리티
function triggerHaptic (duration = 10) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(duration)
  }
}

// 탭으로 인식할 최대 이동 거리 (픽셀)
const TAP_THRESHOLD = 10

type DailyCellProps = {
  time: string
  isSelected: boolean
  count?: number
  maxCount?: number
  mode?: 'edit' | 'view'
  onClick: () => void
}

export default function DailyCell ({
  time, isSelected, count = 0, maxCount = 0, mode = 'edit', onClick,
}: DailyCellProps) {
  const isEditMode = mode === 'edit'
  const [justSelected, setJustSelected] = useState(false)
  const prevSelectedRef = useRef(isSelected)
  
  // 터치 시작 위치 저장
  const touchStartRef = useRef<{ x: number, y: number } | null>(null)

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

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isEditMode) return
    const touch = e.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isEditMode || !touchStartRef.current) return
    
    const touch = e.changedTouches[0]
    const dx = Math.abs(touch.clientX - touchStartRef.current.x)
    const dy = Math.abs(touch.clientY - touchStartRef.current.y)
    
    // 이동 거리가 작으면 탭으로 인식
    if (dx < TAP_THRESHOLD && dy < TAP_THRESHOLD) {
      e.preventDefault() // 다른 이벤트 방지
      onClick()
    }
    
    touchStartRef.current = null
  }

  // 데스크톱에서는 기존 onClick 사용
  const handleClick = (e: React.MouseEvent) => {
    // 터치 디바이스에서는 touchEnd에서 처리하므로 무시
    if ('ontouchstart' in window) return
    if (!isEditMode) return
    onClick()
  }

  return (
    <div
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={classNames(
        styles.cell,
        {
          [styles.selected]: isSelected,
          [styles.justSelected]: justSelected,
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
