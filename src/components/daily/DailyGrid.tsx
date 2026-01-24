import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import DailyCell from './DailyCell'
import dayjs from 'dayjs'
import styles from './DailyGrid.module.scss'
import type { get_meetings_$meetingCode_response } from '../../services/meetings'

// 드래그로 인식할 최소 이동 거리 (픽셀)
const DRAG_THRESHOLD = 10
// 스크롤로 인식할 가로 이동 비율 (가로 > 세로 * 이 값이면 스크롤)
const SCROLL_RATIO = 1.5

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
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartIndex, setDragStartIndex] = useState<number | null>(null)
  const [dragCurrentIndex, setDragCurrentIndex] = useState<number | null>(null)
  const [dragMode, setDragMode] = useState<'select' | 'deselect'>('select')
  
  // 터치 시작 위치 (스크롤 vs 드래그 판단용)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const isScrollingRef = useRef(false)
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

  // 단일 셀 토글 (탭-투-토글)
  const toggleTimeSlot = (time: string) => {
    if (!availableTimes.includes(time)) return

    setSelectedTimeSlots(prev => {
      if (prev.includes(time)) {
        return prev.filter(slot => slot !== time)
      } else {
        return [...prev, time]
      }
    })
  }

  // 범위 내 셀들 일괄 선택/해제
  const applyDragSelection = useCallback((indices: number[], mode: 'select' | 'deselect') => {
    const timesToChange = indices
      .map(i => availableTimes[i])
      .filter(Boolean)
    
    setSelectedTimeSlots(prev => {
      if (mode === 'select') {
        const newSet = new Set(prev)
        timesToChange.forEach(t => newSet.add(t))
        return Array.from(newSet)
      } else {
        return prev.filter(t => !timesToChange.includes(t))
      }
    })
  }, [availableTimes])

  const isEditMode = mode === 'edit'

  // 터치 시작
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isEditMode) return
    
    const touch = e.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
    isScrollingRef.current = false
    
    const cellIndex = getCellIndexFromTouch(touch)
    if (cellIndex !== null) {
      setDragStartIndex(cellIndex)
      setDragCurrentIndex(cellIndex)
      // 시작 셀이 선택되어 있으면 해제 모드, 아니면 선택 모드
      const time = availableTimes[cellIndex]
      setDragMode(selectedTimeSlots.includes(time) ? 'deselect' : 'select')
    }
  }, [isEditMode, getCellIndexFromTouch, availableTimes, selectedTimeSlots])

  // 터치 이동
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isEditMode || !touchStartRef.current || dragStartIndex === null) return
    
    const touch = e.touches[0]
    const dx = Math.abs(touch.clientX - touchStartRef.current.x)
    const dy = Math.abs(touch.clientY - touchStartRef.current.y)
    
    // 아직 방향 결정 안됨
    if (!isDragging && !isScrollingRef.current) {
      const totalMove = Math.sqrt(dx * dx + dy * dy)
      if (totalMove > DRAG_THRESHOLD) {
        // 가로 이동이 세로보다 크면 스크롤로 판단
        if (dx > dy * SCROLL_RATIO) {
          isScrollingRef.current = true
          setDragStartIndex(null)
          setDragCurrentIndex(null)
          return
        } else {
          // 세로 드래그 → 셀 선택 모드 + 스크롤 방지
          setIsDragging(true)
          e.preventDefault()
        }
      }
    }
    
    if (isScrollingRef.current) return
    
    // 드래그 중이면 스크롤 방지 + 현재 셀 업데이트
    if (isDragging) {
      e.preventDefault()
      const cellIndex = getCellIndexFromTouch(touch)
      if (cellIndex !== null && cellIndex !== dragCurrentIndex) {
        setDragCurrentIndex(cellIndex)
        // 햅틱 피드백
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate(5)
        }
      }
    }
  }, [isEditMode, isDragging, dragStartIndex, dragCurrentIndex, getCellIndexFromTouch])

  // 터치 끝
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isEditMode) return
    
    const touch = e.changedTouches[0]
    const startPos = touchStartRef.current
    
    if (startPos) {
      const dx = Math.abs(touch.clientX - startPos.x)
      const dy = Math.abs(touch.clientY - startPos.y)
      const totalMove = Math.sqrt(dx * dx + dy * dy)
      
      // 드래그 없이 짧은 탭 → 단일 셀 토글
      if (!isDragging && totalMove < DRAG_THRESHOLD && dragStartIndex !== null) {
        const time = availableTimes[dragStartIndex]
        if (time) {
          toggleTimeSlot(time)
        }
      }
      // 드래그 완료 → 범위 선택/해제
      else if (isDragging && draggedIndices.length > 0) {
        applyDragSelection(draggedIndices, dragMode)
      }
    }
    
    // 상태 초기화
    setIsDragging(false)
    setDragStartIndex(null)
    setDragCurrentIndex(null)
    touchStartRef.current = null
    isScrollingRef.current = false
  }, [isEditMode, isDragging, dragStartIndex, draggedIndices, dragMode, availableTimes, applyDragSelection])

  const handleCellClick = (time: string) => {
    // 터치 디바이스에서는 터치 이벤트에서 처리
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
      className={`${styles.gridWrapper} ${!isEditMode ? styles.viewMode : ''} ${isDragging ? styles.dragging : ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className={styles.grid}>
        {availableTimes.map((time, index) => {
          const count = schedule?.[time]?.count || 0
          const isDragHighlighted = isDragging && draggedIndices.includes(index)
          return (
            <DailyCell
              key={time}
              time={time}
              index={index}
              isSelected={selectedTimeSlots.includes(time)}
              isDragHighlighted={isDragHighlighted}
              dragMode={isDragHighlighted ? dragMode : undefined}
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
