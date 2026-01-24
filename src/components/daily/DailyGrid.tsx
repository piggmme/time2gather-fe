import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import DailyCell from './DailyCell'
import dayjs from 'dayjs'
import styles from './DailyGrid.module.scss'
import type { get_meetings_$meetingCode_response } from '../../services/meetings'

// Long Press 인식 시간 (ms)
const LONG_PRESS_DURATION = 300
// 움직임 허용 범위 (Long Press 중 이 이상 움직이면 취소)
const MOVE_THRESHOLD = 10

type DailyGridProps = {
  date: dayjs.Dayjs
  availableTimes: string[]
  schedule?: get_meetings_$meetingCode_response['data']['schedule'][string]
  participantsCount: number
  initialSelectedTimeSlots?: string[]
  onSelectionsChange?: (selectedTimeSlots: string[]) => void
  mode?: 'edit' | 'view'
  onCellClick?: (date: string, time: string) => void
}

export default function DailyGrid ({
  date,
  availableTimes,
  schedule,
  participantsCount,
  initialSelectedTimeSlots,
  onSelectionsChange,
  mode = 'edit',
  onCellClick,
}: DailyGridProps) {
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([])
  
  // 드래그 상태 관리
  const [isDragMode, setIsDragMode] = useState(false)
  const [dragStartIndex, setDragStartIndex] = useState<number | null>(null)
  const [dragCurrentIndex, setDragCurrentIndex] = useState<number | null>(null)
  const [dragAction, setDragAction] = useState<'select' | 'deselect'>('select')
  
  // Long Press 타이머
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (initialSelectedTimeSlots) {
      setSelectedTimeSlots(initialSelectedTimeSlots)
    }
  }, [initialSelectedTimeSlots])

  useEffect(() => {
    onSelectionsChange?.(selectedTimeSlots)
  }, [selectedTimeSlots])

  // 드래그 범위 내 인덱스 계산
  const draggedIndices = useMemo(() => {
    if (dragStartIndex === null || dragCurrentIndex === null) return []
    const start = Math.min(dragStartIndex, dragCurrentIndex)
    const end = Math.max(dragStartIndex, dragCurrentIndex)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }, [dragStartIndex, dragCurrentIndex])

  // 터치 위치에서 셀 인덱스 찾기
  const getCellIndexFromTouch = useCallback((touch: Touch): number | null => {
    const elements = document.elementsFromPoint(touch.clientX, touch.clientY)
    for (const el of elements) {
      const indexAttr = el.getAttribute('data-cell-index')
      if (indexAttr !== null) {
        return parseInt(indexAttr, 10)
      }
    }
    return null
  }, [])

  // Long Press 타이머 정리
  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }, [])

  // 햅틱 피드백
  const triggerHaptic = useCallback((duration = 10) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(duration)
    }
  }, [])

  // 단일 셀 토글
  const toggleTimeSlot = useCallback((time: string) => {
    if (!availableTimes.includes(time)) return
    setSelectedTimeSlots(prev => {
      if (prev.includes(time)) {
        return prev.filter(slot => slot !== time)
      } else {
        return [...prev, time]
      }
    })
  }, [availableTimes])

  // 전체 시간 선택/해제 (날짜 헤더 클릭용)
  const toggleAllTimeSlots = useCallback(() => {
    const allSelected = availableTimes.every(time => selectedTimeSlots.includes(time))
    if (allSelected) {
      // 전체 해제
      setSelectedTimeSlots([])
    } else {
      // 전체 선택
      setSelectedTimeSlots([...availableTimes])
    }
  }, [availableTimes, selectedTimeSlots])

  // 범위 내 셀들 일괄 선택/해제
  const applyDragSelection = useCallback((indices: number[], action: 'select' | 'deselect') => {
    const timesToChange = indices
      .map(i => availableTimes[i])
      .filter(Boolean)
    
    setSelectedTimeSlots(prev => {
      if (action === 'select') {
        const newSet = new Set(prev)
        timesToChange.forEach(t => newSet.add(t))
        return Array.from(newSet)
      } else {
        return prev.filter(t => !timesToChange.includes(t))
      }
    })
  }, [availableTimes])

  const isEditMode = mode === 'edit'

  // 터치 시작 - Long Press 타이머 시작
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isEditMode) return
    
    const touch = e.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
    
    const cellIndex = getCellIndexFromTouch(touch)
    if (cellIndex === null) return
    
    // Long Press 타이머 시작
    longPressTimerRef.current = setTimeout(() => {
      // Long Press 성공 → 드래그 모드 진입
      setIsDragMode(true)
      setDragStartIndex(cellIndex)
      setDragCurrentIndex(cellIndex)
      
      // 시작 셀 상태에 따라 선택/해제 모드 결정
      const time = availableTimes[cellIndex]
      setDragAction(selectedTimeSlots.includes(time) ? 'deselect' : 'select')
      
      // 햅틱 피드백으로 드래그 모드 진입 알림
      triggerHaptic(20)
    }, LONG_PRESS_DURATION)
  }, [isEditMode, getCellIndexFromTouch, availableTimes, selectedTimeSlots, triggerHaptic])

  // 터치 이동
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isEditMode) return
    
    const touch = e.touches[0]
    const startPos = touchStartRef.current
    
    // Long Press 대기 중에 움직이면 타이머 취소
    if (!isDragMode && startPos) {
      const dx = Math.abs(touch.clientX - startPos.x)
      const dy = Math.abs(touch.clientY - startPos.y)
      if (dx > MOVE_THRESHOLD || dy > MOVE_THRESHOLD) {
        clearLongPressTimer()
        // 스크롤은 브라우저가 처리하도록 그대로 둠
      }
      return
    }
    
    // 드래그 모드에서는 스크롤 방지 + 셀 선택
    if (isDragMode) {
      e.preventDefault()
      const cellIndex = getCellIndexFromTouch(touch)
      if (cellIndex !== null && cellIndex !== dragCurrentIndex) {
        setDragCurrentIndex(cellIndex)
        triggerHaptic(5)
      }
    }
  }, [isEditMode, isDragMode, dragCurrentIndex, getCellIndexFromTouch, clearLongPressTimer, triggerHaptic])

  // 터치 끝
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isEditMode) return
    
    clearLongPressTimer()
    
    const touch = e.changedTouches[0]
    const startPos = touchStartRef.current
    
    if (isDragMode) {
      // 드래그 완료 → 범위 선택/해제
      if (draggedIndices.length > 0) {
        applyDragSelection(draggedIndices, dragAction)
      }
    } else if (startPos) {
      // 드래그 모드 아님 → 탭인지 확인
      const dx = Math.abs(touch.clientX - startPos.x)
      const dy = Math.abs(touch.clientY - startPos.y)
      if (dx < MOVE_THRESHOLD && dy < MOVE_THRESHOLD) {
        // 짧은 탭 → 단일 셀 토글
        const cellIndex = getCellIndexFromTouch(touch)
        if (cellIndex !== null) {
          const time = availableTimes[cellIndex]
          if (time) toggleTimeSlot(time)
        }
      }
    }
    
    // 상태 초기화
    setIsDragMode(false)
    setDragStartIndex(null)
    setDragCurrentIndex(null)
    touchStartRef.current = null
  }, [isEditMode, isDragMode, draggedIndices, dragAction, availableTimes, getCellIndexFromTouch, toggleTimeSlot, applyDragSelection, clearLongPressTimer])

  // 터치 취소
  const handleTouchCancel = useCallback(() => {
    clearLongPressTimer()
    setIsDragMode(false)
    setDragStartIndex(null)
    setDragCurrentIndex(null)
    touchStartRef.current = null
  }, [clearLongPressTimer])

  // 마우스 클릭 (데스크톱)
  const handleCellClick = (time: string) => {
    if ('ontouchstart' in window) return
    if (isEditMode) {
      toggleTimeSlot(time)
    } else if (onCellClick) {
      onCellClick(date.format('YYYY-MM-DD'), time)
    }
  }

  return (
    <div 
      ref={gridRef}
      className={`${styles.gridWrapper} ${!isEditMode ? styles.viewMode : ''} ${isDragMode ? styles.dragging : ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      <div className={styles.grid}>
        {availableTimes.map((time, index) => {
          const count = schedule?.[time]?.count || 0
          const isDragHighlighted = isDragMode && draggedIndices.includes(index)
          return (
            <DailyCell
              key={time}
              time={time}
              index={index}
              isSelected={selectedTimeSlots.includes(time)}
              isDragHighlighted={isDragHighlighted}
              dragMode={isDragHighlighted ? dragAction : undefined}
              count={count}
              maxCount={participantsCount}
              mode={mode}
              onClick={() => handleCellClick(time)}
            />
          )
        })}
      </div>
    </div>
  )
}

// 전체 선택/해제 함수를 외부에서 호출할 수 있도록 export
export type DailyGridHandle = {
  toggleAllTimeSlots: () => void
}
