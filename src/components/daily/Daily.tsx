import DailyGrid from './DailyGrid'
import dayjs from 'dayjs'
import 'dayjs/locale/ko'
import 'dayjs/locale/en'
import styles from './Daily.module.scss'
import { useRef, useEffect, useCallback, useState, useMemo } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { useStore } from '@nanostores/react'
import { $locale } from '../../stores/locale'
import { formatDate } from '../../utils/time'
import type { get_meetings_$meetingCode_response } from '../../services/meetings'

// Long Press 인식 시간 (ms)
const LONG_PRESS_DURATION = 300
// 움직임 허용 범위 (Long Press 중 이 이상 움직이면 취소)
const MOVE_THRESHOLD = 10
// 자동 스크롤 가장자리 영역 (px)
const AUTO_SCROLL_EDGE = 50
// 자동 스크롤 속도 (px per frame)
const AUTO_SCROLL_SPEED = 8

type CellPosition = {
  dateKey: string
  timeIndex: number
}

type DailyProps = {
  dates: dayjs.Dayjs[]
  availableTimes: string[]
  height?: string
  selections?: { [date: string]: string[] }
  setSelections?: Dispatch<SetStateAction<{ [date: string]: string[] }>>
  schedule?: get_meetings_$meetingCode_response['data']['schedule']
  participantsCount: number
  mode?: 'edit' | 'view'
  onCellClick?: (date: string, time: string) => void
}

export default function Daily ({
  dates,
  availableTimes,
  height = 'auto',
  selections = {},
  setSelections = () => {},
  schedule,
  participantsCount,
  mode = 'edit',
  onCellClick,
}: DailyProps) {
  const locale = useStore($locale)
  const dateHeaderScrollRef = useRef<HTMLDivElement>(null)
  const gridScrollContainerRef = useRef<HTMLDivElement>(null)
  const scrollWrapperRef = useRef<HTMLDivElement>(null)

  // 스크롤 동기화 중 무한 루프 방지용 플래그
  const isSyncingRef = useRef(false)

  const isEditMode = mode === 'edit'

  // 드래그 상태 관리
  const [isDragMode, setIsDragMode] = useState(false)
  const [dragStart, setDragStart] = useState<CellPosition | null>(null)
  const [dragCurrent, setDragCurrent] = useState<CellPosition | null>(null)
  const [dragAction, setDragAction] = useState<'select' | 'deselect'>('select')
  
  // Long Press 타이머
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const touchStartCellRef = useRef<CellPosition | null>(null)
  
  // 자동 스크롤용 refs
  const autoScrollRef = useRef<number | null>(null)
  const lastPointerPosRef = useRef<{ x: number; y: number } | null>(null)

  // 날짜 키 배열 (인덱스로 접근용)
  const dateKeys = useMemo(() => dates.map(d => d.format('YYYY-MM-DD')), [dates])

  // Update dayjs locale when locale changes
  useEffect(() => {
    dayjs.locale(locale === 'ko' ? 'ko' : 'en')
  }, [locale])

  // 날짜 헤더 → 그리드 스크롤 동기화
  const syncHeaderToGrid = useCallback(() => {
    if (isSyncingRef.current) return
    if (dateHeaderScrollRef.current && gridScrollContainerRef.current) {
      isSyncingRef.current = true
      gridScrollContainerRef.current.scrollLeft = dateHeaderScrollRef.current.scrollLeft
      requestAnimationFrame(() => {
        isSyncingRef.current = false
      })
    }
  }, [])

  // 그리드 → 날짜 헤더 스크롤 동기화
  const syncGridToHeader = useCallback(() => {
    if (isSyncingRef.current) return
    if (dateHeaderScrollRef.current && gridScrollContainerRef.current) {
      isSyncingRef.current = true
      dateHeaderScrollRef.current.scrollLeft = gridScrollContainerRef.current.scrollLeft
      requestAnimationFrame(() => {
        isSyncingRef.current = false
      })
    }
  }, [])

  // 가로 스크롤 동기화 설정
  useEffect(() => {
    const dateHeaderScroll = dateHeaderScrollRef.current
    const gridScrollContainer = gridScrollContainerRef.current

    if (dateHeaderScroll && gridScrollContainer) {
      dateHeaderScroll.addEventListener('scroll', syncHeaderToGrid)
      gridScrollContainer.addEventListener('scroll', syncGridToHeader)

      return () => {
        dateHeaderScroll.removeEventListener('scroll', syncHeaderToGrid)
        gridScrollContainer.removeEventListener('scroll', syncGridToHeader)
      }
    }
  }, [syncHeaderToGrid, syncGridToHeader])

  // 날짜 헤더 클릭 시 해당 날짜 전체 시간 선택/해제
  const handleDateHeaderClick = useCallback((dateKey: string) => {
    if (!isEditMode) return
    
    const currentSelections = selections[dateKey] || []
    const allSelected = availableTimes.every(time => currentSelections.includes(time))
    
    setSelections(prev => ({
      ...prev,
      [dateKey]: allSelected ? [] : [...availableTimes],
    }))
  }, [isEditMode, availableTimes, selections, setSelections])

  // 2D 드래그 범위 계산 (날짜 x 시간)
  const draggedCells = useMemo(() => {
    if (!dragStart || !dragCurrent) return []
    
    const startDateIdx = dateKeys.indexOf(dragStart.dateKey)
    const endDateIdx = dateKeys.indexOf(dragCurrent.dateKey)
    const startTimeIdx = dragStart.timeIndex
    const endTimeIdx = dragCurrent.timeIndex
    
    const minDateIdx = Math.min(startDateIdx, endDateIdx)
    const maxDateIdx = Math.max(startDateIdx, endDateIdx)
    const minTimeIdx = Math.min(startTimeIdx, endTimeIdx)
    const maxTimeIdx = Math.max(startTimeIdx, endTimeIdx)
    
    const cells: CellPosition[] = []
    for (let dIdx = minDateIdx; dIdx <= maxDateIdx; dIdx++) {
      for (let tIdx = minTimeIdx; tIdx <= maxTimeIdx; tIdx++) {
        cells.push({ dateKey: dateKeys[dIdx], timeIndex: tIdx })
      }
    }
    return cells
  }, [dragStart, dragCurrent, dateKeys])

  // 터치 위치에서 셀 정보 찾기
  const getCellFromTouch = useCallback((touch: React.Touch): CellPosition | null => {
    const elements = document.elementsFromPoint(touch.clientX, touch.clientY)
    for (const el of elements) {
      const dateKey = el.getAttribute('data-date-key')
      const timeIndex = el.getAttribute('data-time-index')
      if (dateKey && timeIndex !== null) {
        return { dateKey, timeIndex: parseInt(timeIndex, 10) }
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
  const toggleCell = useCallback((dateKey: string, time: string) => {
    setSelections(prev => {
      const current = prev[dateKey] || []
      if (current.includes(time)) {
        return { ...prev, [dateKey]: current.filter(t => t !== time) }
      } else {
        return { ...prev, [dateKey]: [...current, time] }
      }
    })
  }, [setSelections])

  // 범위 내 셀들 일괄 선택/해제
  const applyDragSelection = useCallback((cells: CellPosition[], action: 'select' | 'deselect') => {
    setSelections(prev => {
      const newSelections = { ...prev }
      for (const cell of cells) {
        const time = availableTimes[cell.timeIndex]
        if (!time) continue
        
        const current = newSelections[cell.dateKey] || []
        if (action === 'select') {
          if (!current.includes(time)) {
            newSelections[cell.dateKey] = [...current, time]
          }
        } else {
          newSelections[cell.dateKey] = current.filter(t => t !== time)
        }
      }
      return newSelections
    })
  }, [availableTimes, setSelections])

  // 자동 스크롤 중지
  const stopAutoScroll = useCallback(() => {
    if (autoScrollRef.current !== null) {
      cancelAnimationFrame(autoScrollRef.current)
      autoScrollRef.current = null
    }
  }, [])

  // 현재 포인터 위치에서 셀 찾아서 dragCurrent 업데이트
  const updateCellAtPointer = useCallback(() => {
    const pos = lastPointerPosRef.current
    if (!pos) return
    
    const elements = document.elementsFromPoint(pos.x, pos.y)
    for (const el of elements) {
      const dateKey = el.getAttribute('data-date-key')
      const timeIndex = el.getAttribute('data-time-index')
      if (dateKey && timeIndex !== null) {
        const cellPos = { dateKey, timeIndex: parseInt(timeIndex, 10) }
        setDragCurrent(prev => {
          if (prev?.dateKey === cellPos.dateKey && prev?.timeIndex === cellPos.timeIndex) {
            return prev
          }
          return cellPos
        })
        break
      }
    }
  }, [])

  // 자동 스크롤 실행 (requestAnimationFrame 루프)
  const performAutoScroll = useCallback(() => {
    const pos = lastPointerPosRef.current
    if (!pos || !isDragMode) {
      autoScrollRef.current = null
      return
    }
    
    const scrollWrapper = scrollWrapperRef.current
    const gridContainer = gridScrollContainerRef.current
    if (!scrollWrapper || !gridContainer) {
      autoScrollRef.current = null
      return
    }
    
    // 뷰포트 높이 대신 scrollWrapper의 bounding rect 사용 (컨테이너 기준)
    const rect = scrollWrapper.getBoundingClientRect()
    const topEdge = rect.top + AUTO_SCROLL_EDGE
    const bottomEdge = rect.bottom - AUTO_SCROLL_EDGE
    
    // 가로 스크롤은 gridContainer 기준 (혹은 뷰포트 너비 사용 - 모바일은 꽉 차므로 뷰포트도 OK지만 통일성 위해 rect 사용 고려)
    // 가로는 gridContainer가 화면 너비와 다를 수 있으므로 뷰포트나 gridContainer rect 사용
    // 여기서는 뷰포트 너비 유지 (가로 스크롤은 보통 전체 화면 사용)
    const viewportWidth = window.innerWidth
    
    let didScroll = false
    
    // 세로 스크롤: 컨테이너 상단/하단 가장자리 기준
    if (pos.y < topEdge) {
      // 손가락이 컨테이너 상단 가장자리 → 위로 스크롤
      const distance = topEdge - pos.y
      // 거리가 멀수록 빠르게 (최대 속도 제한)
      const intensity = Math.min(1, distance / AUTO_SCROLL_EDGE)
      scrollWrapper.scrollTop -= AUTO_SCROLL_SPEED * intensity
      didScroll = true
    } else if (pos.y > bottomEdge) {
      // 손가락이 컨테이너 하단 가장자리 → 아래로 스크롤
      const distance = pos.y - bottomEdge
      const intensity = Math.min(1, distance / AUTO_SCROLL_EDGE)
      scrollWrapper.scrollTop += AUTO_SCROLL_SPEED * intensity
      didScroll = true
    }
    
    // 가로 스크롤: 뷰포트 좌우 가장자리 기준
    if (pos.x < AUTO_SCROLL_EDGE) {
      // 손가락이 화면 왼쪽 가장자리 → 왼쪽으로 스크롤
      const distance = AUTO_SCROLL_EDGE - pos.x
      const speed = (distance / AUTO_SCROLL_EDGE) * AUTO_SCROLL_SPEED
      gridContainer.scrollLeft -= speed
      didScroll = true
    } else if (pos.x > viewportWidth - AUTO_SCROLL_EDGE) {
      // 손가락이 화면 오른쪽 가장자리 → 오른쪽으로 스크롤
      const distance = pos.x - (viewportWidth - AUTO_SCROLL_EDGE)
      const speed = (distance / AUTO_SCROLL_EDGE) * AUTO_SCROLL_SPEED
      gridContainer.scrollLeft += speed
      didScroll = true
    }
    
    // 스크롤 후 현재 위치의 셀 업데이트
    if (didScroll) {
      updateCellAtPointer()
    }
    
    // 다음 프레임 예약
    autoScrollRef.current = requestAnimationFrame(performAutoScroll)
  }, [isDragMode, updateCellAtPointer])

  // 자동 스크롤 시작
  const startAutoScroll = useCallback(() => {
    if (autoScrollRef.current === null) {
      autoScrollRef.current = requestAnimationFrame(performAutoScroll)
    }
  }, [performAutoScroll])

  // 터치 시작 - Long Press 타이머 시작
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isEditMode) return
    
    const touch = e.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
    
    const cellPos = getCellFromTouch(touch)
    if (!cellPos) return
    
    touchStartCellRef.current = cellPos
    
    // Long Press 타이머 시작
    longPressTimerRef.current = setTimeout(() => {
      // Long Press 성공 → 드래그 모드 진입
      setIsDragMode(true)
      setDragStart(cellPos)
      setDragCurrent(cellPos)
      
      // 시작 셀 상태에 따라 선택/해제 모드 결정
      const time = availableTimes[cellPos.timeIndex]
      const isSelected = selections[cellPos.dateKey]?.includes(time)
      setDragAction(isSelected ? 'deselect' : 'select')
      
      // 햅틱 피드백으로 드래그 모드 진입 알림
      triggerHaptic(20)
    }, LONG_PRESS_DURATION)
  }, [isEditMode, getCellFromTouch, availableTimes, selections, triggerHaptic])

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
    
    // 드래그 모드에서는 스크롤 방지 + 셀 선택 + 자동 스크롤
    if (isDragMode) {
      e.preventDefault()
      
      // 현재 터치 위치 저장 (자동 스크롤에서 사용)
      lastPointerPosRef.current = { x: touch.clientX, y: touch.clientY }
      
      const cellPos = getCellFromTouch(touch)
      if (cellPos && (cellPos.dateKey !== dragCurrent?.dateKey || cellPos.timeIndex !== dragCurrent?.timeIndex)) {
        setDragCurrent(cellPos)
        triggerHaptic(5)
      }
      
      // 자동 스크롤 시작 (이미 실행 중이면 무시됨)
      startAutoScroll()
    }
  }, [isEditMode, isDragMode, dragCurrent, getCellFromTouch, clearLongPressTimer, triggerHaptic, startAutoScroll])

  // 터치 끝
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isEditMode) return
    
    clearLongPressTimer()
    stopAutoScroll()
    
    const touch = e.changedTouches[0]
    const startPos = touchStartRef.current
    const startCell = touchStartCellRef.current
    
    if (isDragMode) {
      // 드래그 완료 → 범위 선택/해제
      if (draggedCells.length > 0) {
        applyDragSelection(draggedCells, dragAction)
      }
    } else if (startPos && startCell) {
      // 드래그 모드 아님 → 탭인지 확인
      const dx = Math.abs(touch.clientX - startPos.x)
      const dy = Math.abs(touch.clientY - startPos.y)
      if (dx < MOVE_THRESHOLD && dy < MOVE_THRESHOLD) {
        // 짧은 탭 → 단일 셀 토글
        const time = availableTimes[startCell.timeIndex]
        if (time) toggleCell(startCell.dateKey, time)
      }
    }
    
    // 상태 초기화
    setIsDragMode(false)
    setDragStart(null)
    setDragCurrent(null)
    touchStartRef.current = null
    touchStartCellRef.current = null
    lastPointerPosRef.current = null
  }, [isEditMode, isDragMode, draggedCells, dragAction, availableTimes, toggleCell, applyDragSelection, clearLongPressTimer, stopAutoScroll])

  // 터치 취소
  const handleTouchCancel = useCallback(() => {
    clearLongPressTimer()
    stopAutoScroll()
    setIsDragMode(false)
    setDragStart(null)
    setDragCurrent(null)
    touchStartRef.current = null
    touchStartCellRef.current = null
    lastPointerPosRef.current = null
  }, [clearLongPressTimer, stopAutoScroll])

  // 컨텍스트 메뉴 방지
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (isEditMode) {
      e.preventDefault()
    }
  }, [isEditMode])

  // ===== PC 마우스 이벤트 (Long Press 없이 바로 드래그) =====
  
  // 마우스 위치에서 셀 정보 찾기
  const getCellFromMouse = useCallback((e: React.MouseEvent | MouseEvent): CellPosition | null => {
    const elements = document.elementsFromPoint(e.clientX, e.clientY)
    for (const el of elements) {
      const dateKey = el.getAttribute('data-date-key')
      const timeIndex = el.getAttribute('data-time-index')
      if (dateKey && timeIndex !== null) {
        return { dateKey, timeIndex: parseInt(timeIndex, 10) }
      }
    }
    return null
  }, [])

  // 마우스 다운 - 바로 드래그 모드 시작
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isEditMode) return
    // 터치 디바이스에서는 무시
    if ('ontouchstart' in window) return
    // 왼쪽 클릭만
    if (e.button !== 0) return
    
    const cellPos = getCellFromMouse(e)
    if (!cellPos) return
    
    e.preventDefault()
    
    // 바로 드래그 모드 진입
    setIsDragMode(true)
    setDragStart(cellPos)
    setDragCurrent(cellPos)
    
    // 시작 셀 상태에 따라 선택/해제 모드 결정
    const time = availableTimes[cellPos.timeIndex]
    const isSelected = selections[cellPos.dateKey]?.includes(time)
    setDragAction(isSelected ? 'deselect' : 'select')
  }, [isEditMode, getCellFromMouse, availableTimes, selections])

  // 마우스 이동 - 드래그 중 셀 업데이트 + 자동 스크롤
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragMode) return
    
    // 현재 마우스 위치 저장 (자동 스크롤에서 사용)
    lastPointerPosRef.current = { x: e.clientX, y: e.clientY }
    
    const cellPos = getCellFromMouse(e)
    if (cellPos && (cellPos.dateKey !== dragCurrent?.dateKey || cellPos.timeIndex !== dragCurrent?.timeIndex)) {
      setDragCurrent(cellPos)
    }
    
    // 자동 스크롤 시작 (이미 실행 중이면 무시됨)
    startAutoScroll()
  }, [isDragMode, dragCurrent, getCellFromMouse, startAutoScroll])

  // 마우스 업 - 드래그 완료
  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!isDragMode) return
    
    stopAutoScroll()
    
    // 드래그 완료 → 범위 선택/해제
    if (draggedCells.length > 0) {
      applyDragSelection(draggedCells, dragAction)
    }
    
    // 상태 초기화
    setIsDragMode(false)
    setDragStart(null)
    setDragCurrent(null)
    lastPointerPosRef.current = null
  }, [isDragMode, draggedCells, dragAction, applyDragSelection, stopAutoScroll])

  // 마우스가 그리드 밖으로 나갔을 때 드래그 완료 처리
  const handleMouseLeave = useCallback((e: React.MouseEvent) => {
    if (!isDragMode) return
    
    stopAutoScroll()
    
    // 드래그 완료
    if (draggedCells.length > 0) {
      applyDragSelection(draggedCells, dragAction)
    }
    
    setIsDragMode(false)
    setDragStart(null)
    setDragCurrent(null)
    lastPointerPosRef.current = null
  }, [isDragMode, draggedCells, dragAction, applyDragSelection, stopAutoScroll])

  return (
    <div className={styles.container} style={{ maxHeight: height, height: 'auto' }}>
      <div className={styles.wrapper}>
        {/* 날짜 헤더 - sticky 고정 */}
        <div className={styles.dateHeaderRow}>
          <div className={styles.timeColumnHeader} />
          <div className={styles.dateHeaderScroll} ref={dateHeaderScrollRef}>
            {dates.map(date => {
              const dateKey = date.format('YYYY-MM-DD')
              const currentSelections = selections[dateKey] || []
              const allSelected = availableTimes.length > 0 && 
                availableTimes.every(time => currentSelections.includes(time))
              
              return (
                <div 
                  key={dateKey} 
                  className={`${styles.dateHeader} ${isEditMode ? styles.clickable : ''} ${allSelected ? styles.allSelected : ''}`}
                  onClick={() => handleDateHeaderClick(dateKey)}
                >
                  <span className={styles.dateTitle}>{formatDate(date, locale)}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* 시간 그리드 */}
        <div className={styles.scrollWrapper} ref={scrollWrapperRef}>
          <div className={styles.timeColumn}>
            {availableTimes.map((time) => {
              const isFullHour = time.endsWith(':00')
              return (
                <div
                  key={time}
                  className={`${styles.timeCell} ${isFullHour ? styles.fullHour : styles.halfHour}`}
                >
                  {time}
                </div>
              )
            })}
          </div>
          <div 
            className={`${styles.gridScrollContainer} ${isDragMode ? styles.dragging : ''}`}
            ref={gridScrollContainerRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchCancel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onContextMenu={handleContextMenu}
          >
            {
              dates.map(date => {
                const dateKey = date.format('YYYY-MM-DD')
                return (
                  <div key={dateKey} className={styles.dateWrapper}>
                    <DailyGrid
                      date={date}
                      dateKey={dateKey}
                      availableTimes={availableTimes}
                      schedule={schedule?.[dateKey]}
                      participantsCount={participantsCount}
                      selectedTimeSlots={selections[dateKey] || []}
                      isDragMode={isDragMode}
                      dragAction={dragAction}
                      draggedCells={draggedCells}
                      mode={mode}
                      onCellClick={onCellClick}
                    />
                  </div>
                )
              })
            }
          </div>
        </div>
      </div>
    </div>
  )
}
