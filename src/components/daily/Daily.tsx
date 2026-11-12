import TimeZoneSelect from '../Timezone/TimeZoneSelect'
import { useDisplayTimeZone } from '../../hooks/useDisplayTimeZone'
import { projectVotingTimeZone } from '../../utils/votingTimeZone'
import DailyGrid from './DailyGrid'
import dayjs from 'dayjs'
import 'dayjs/locale/ko'
import 'dayjs/locale/en'
import styles from './Daily.module.scss'
import {
  useRef, useEffect, useLayoutEffect, useCallback, useState, useMemo, useId,
} from 'react'
import type { CSSProperties, Dispatch, SetStateAction, RefObject } from 'react'
import { intlLocale, localeMeta } from '../../i18n/config'
import type { get_meetings_$meetingCode_response } from '../../services/meetings'
import { useTranslation } from '../../hooks/useTranslation'
import { HiOutlineHand, HiChevronLeft, HiChevronRight } from 'react-icons/hi'
import { Tooltip } from 'radix-ui'

// Long Press 인식 시간 (ms)
const LONG_PRESS_DURATION = 200
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
  className?: string
  dates: dayjs.Dayjs[]
  heading?: string
  timezone?: string
  availableDates?: Record<string, string[]>
  allowedSlots?: Record<string, Record<string, unknown>>
  availableTimes: string[]
  height?: string
  selections?: { [date: string]: string[] }
  setSelections?: Dispatch<SetStateAction<{ [date: string]: string[] }>>
  schedule?: get_meetings_$meetingCode_response['data']['schedule']
  participantsCount: number
  mode?: 'edit' | 'view'
  onCellClick?: (date: string, time: string) => void
}

export default function Daily (props: DailyProps) {
  const viewportRef = useRef({ left: 0, top: 0 })
  const sourceZone = props.timezone ?? 'UTC'
  const [displayZone, setDisplayZone] = useDisplayTimeZone(sourceZone)
  const { t } = useTranslation()
  const isEditMode = props.mode !== 'view'
  const availableDates = useMemo(() => props.availableDates ?? Object.fromEntries(
    props.dates.map(date => [date.format('YYYY-MM-DD'), props.availableTimes]),
  ), [props.availableDates, props.dates, props.availableTimes])
  const projection = useMemo(() => isEditMode
    ? projectVotingTimeZone(availableDates, sourceZone, displayZone)
    : undefined, [availableDates, sourceZone, displayZone, isEditMode])
  const shownZone = projection ? displayZone : sourceZone
  const displayedSchedule = useMemo(() => {
    if (!projection || !props.schedule) return props.schedule
    const result: NonNullable<DailyProps['schedule']> = {}
    for (const [date, slots] of Object.entries(props.schedule)) {
      for (const [time, slot] of Object.entries(slots)) {
        const local = projection.displayBySource[date]?.[time]
        if (local) (result[local.date] ??= {})[local.time] = slot
      }
    }
    return result
  }, [projection, props.schedule])
  const setSelections: DailyProps['setSelections'] = (update) => {
    props.setSelections?.((previous) => {
      if (!projection) return typeof update === 'function' ? update(previous) : update
      const displayed = projection.toDisplay(previous)
      return projection.toSource(typeof update === 'function' ? update(displayed) : update)
    })
  }
  return (
    <Tooltip.Provider delayDuration={200} skipDelayDuration={100}>
      {isEditMode && <TimeZoneSelect value={shownZone} onChange={setDisplayZone} label={t('timezone.display')} />}
      {isEditMode && !projection && displayZone !== sourceZone && <p role='status'>{t('timezone.overlap')}</p>}
      <DailyContent
        {...props}
        key={shownZone}
        viewportRef={viewportRef}
        timezone={shownZone}
        dates={projection ? projection.dates.map(date => dayjs(date)) : props.dates}
        availableTimes={projection?.availableTimes ?? props.availableTimes}
        allowedSlots={projection?.sourceByDisplay}
        selections={projection ? projection.toDisplay(props.selections ?? {}) : props.selections}
        setSelections={setSelections}
        schedule={displayedSchedule}
      />
    </Tooltip.Provider>
  )
}

function dateKeysForViewport (dates: dayjs.Dayjs[]) {
  return dates.map(date => date.format('YYYY-MM-DD')).join(',')
}

function DailyContent ({
  className = '',
  dates,
  heading,
  timezone = 'UTC',
  availableTimes,
  allowedSlots,
  height = 'auto',
  selections = {},
  setSelections = () => {},
  schedule,
  participantsCount,
  mode = 'edit',
  onCellClick,
  viewportRef,
}: DailyProps & { viewportRef: RefObject<{ left: number, top: number }> }) {
  const { t, locale } = useTranslation()
  const direction = localeMeta[locale].dir
  const rtl = direction === 'rtl'
  const formatters = useMemo(() => ({
    date: new Intl.DateTimeFormat(intlLocale(locale), { calendar: 'gregory', month: 'numeric', day: 'numeric', timeZone: 'UTC' }),
    weekday: new Intl.DateTimeFormat(intlLocale(locale), { weekday: 'short', timeZone: 'UTC' }),
    full: new Intl.DateTimeFormat(intlLocale(locale), { calendar: 'gregory', dateStyle: 'full', timeZone: 'UTC' }),
    time: new Intl.DateTimeFormat(intlLocale(locale), { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'UTC' }),
  }), [locale])
  const dateHeaderScrollRef = useRef<HTMLDivElement>(null)
  const gridScrollContainerRef = useRef<HTMLDivElement>(null)
  const scrollWrapperRef = useRef<HTMLDivElement>(null)
  const scrollIndicatorRef = useRef<HTMLDivElement>(null)
  const pageAnimationRef = useRef<number | null>(null)
  const pageTargetRef = useRef<number | null>(null)
  const cancelPageScroll = useCallback(() => {
    if (pageAnimationRef.current !== null) cancelAnimationFrame(pageAnimationRef.current)
    pageAnimationRef.current = null
    pageTargetRef.current = null
  }, [])
  const gridId = useId()
  const [scrollEdges, setScrollEdges] = useState({ before: false, after: false })
  const updateScrollEdges = useCallback(() => {
    const grid = gridScrollContainerRef.current
    if (!grid || grid.clientWidth === 0) return
    const offset = Math.abs(grid.scrollLeft)
    const before = offset > 1
    const after = grid.scrollWidth - grid.clientWidth - offset > 1
    setScrollEdges(previous => previous.before === before && previous.after === after ? previous : { before, after })
    viewportRef.current.left = offset
    const indicator = scrollIndicatorRef.current
    if (indicator) {
      indicator.style.width = `${Math.min(100, grid.clientWidth / grid.scrollWidth * 100)}%`
      indicator.style.insetInlineStart = `${Math.min(offset, grid.scrollWidth - grid.clientWidth) / grid.scrollWidth * 100}%`
    }
  }, [viewportRef])

  useLayoutEffect(() => {
    const grid = gridScrollContainerRef.current
    const wrapper = scrollWrapperRef.current
    if (!grid || !wrapper) return
    grid.scrollLeft = (rtl ? -1 : 1) * viewportRef.current.left
    wrapper.scrollTop = viewportRef.current.top
    if (dateHeaderScrollRef.current) dateHeaderScrollRef.current.scrollLeft = grid.scrollLeft
    updateScrollEdges()
    const observer = new ResizeObserver(updateScrollEdges)
    observer.observe(grid)
    if (grid.firstElementChild) observer.observe(grid.firstElementChild)
    return () => observer.disconnect()
  }, [dateKeysForViewport(dates), updateScrollEdges, viewportRef, rtl])

  const moveDates = (direction: -1 | 1) => {
    const grid = gridScrollContainerRef.current
    if (!grid) return
    const columnWidth = grid.firstElementChild?.getBoundingClientRect().width || 100
    const page = Math.max(1, Math.floor(grid.clientWidth / columnWidth)) * columnWidth
    const limit = grid.scrollWidth - grid.clientWidth
    const start = grid.scrollLeft
    const target = Math.max(rtl ? -limit : 0, Math.min(rtl ? 0 : limit, (pageTargetRef.current ?? start) + direction * page))
    cancelPageScroll()
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || target === start) {
      grid.scrollLeft = target
      return
    }
    pageTargetRef.current = target
    const started = performance.now()
    const animate = (now: number) => {
      const progress = Math.min(1, (now - started) / 130)
      grid.scrollLeft = start + (target - start) * (1 - (1 - progress) ** 3)
      if (progress < 1) pageAnimationRef.current = requestAnimationFrame(animate)
      else {
        pageAnimationRef.current = null
        pageTargetRef.current = null
      }
    }
    pageAnimationRef.current = requestAnimationFrame(animate)
  }

  const isEditMode = mode === 'edit'

  // 드래그 상태 관리
  const [isDragMode, setIsDragMode] = useState(false)
  const [dragStart, setDragStart] = useState<CellPosition | null>(null)
  const [dragCurrent, setDragCurrent] = useState<CellPosition | null>(null)
  const [dragAction, setDragAction] = useState<'select' | 'deselect'>('select')

  // Long Press 타이머
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const touchStartRef = useRef<{ x: number, y: number } | null>(null)
  const touchStartCellRef = useRef<CellPosition | null>(null)

  // 자동 스크롤용 refs
  const autoScrollRef = useRef<number | null>(null)
  const lastPointerPosRef = useRef<{ x: number, y: number } | null>(null)

  // 날짜 키 배열 (인덱스로 접근용)
  const dateKeys = useMemo(() => dates.map(d => d.format('YYYY-MM-DD')), [dates])

  // Write only when positions differ. Mirrored scroll events must not write back
  // into the surface receiving a native momentum gesture.
  useEffect(() => {
    const header = dateHeaderScrollRef.current
    const grid = gridScrollContainerRef.current
    if (!header || !grid) return
    let mirroredHeader = header.scrollLeft
    let mirroredGrid = grid.scrollLeft
    const fromHeader = () => {
      if (header.scrollLeft === mirroredHeader) return
      grid.scrollLeft = header.scrollLeft
      mirroredGrid = grid.scrollLeft
      updateScrollEdges()
    }
    const fromGrid = () => {
      updateScrollEdges()
      if (grid.scrollLeft === mirroredGrid) return
      header.scrollLeft = grid.scrollLeft
      mirroredHeader = header.scrollLeft
    }
    // A direct gesture always takes over from button paging immediately.
    for (const surface of [header, grid]) {
      surface.addEventListener('pointerdown', cancelPageScroll, { passive: true })
      surface.addEventListener('touchstart', cancelPageScroll, { passive: true })
      surface.addEventListener('wheel', cancelPageScroll, { passive: true })
    }
    header.addEventListener('scroll', fromHeader, { passive: true })
    grid.addEventListener('scroll', fromGrid, { passive: true })
    return () => {
      cancelPageScroll()
      for (const surface of [header, grid]) {
        surface.removeEventListener('pointerdown', cancelPageScroll)
        surface.removeEventListener('touchstart', cancelPageScroll)
        surface.removeEventListener('wheel', cancelPageScroll)
      }
      header.removeEventListener('scroll', fromHeader)
      grid.removeEventListener('scroll', fromGrid)
    }
  }, [updateScrollEdges, cancelPageScroll])

  // 날짜 헤더 클릭 시 해당 날짜 전체 시간 선택/해제
  const handleDateHeaderClick = useCallback((dateKey: string) => {
    if (!isEditMode) return

    const currentSelections = selections[dateKey] || []
    const times = availableTimes.filter(time => !allowedSlots || allowedSlots[dateKey]?.[time])
    const allSelected = times.every(time => currentSelections.includes(time))

    setSelections(prev => ({
      ...prev,
      [dateKey]: allSelected ? [] : times,
    }))
  }, [isEditMode, availableTimes, allowedSlots, selections, setSelections])

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
      if (dateKey && timeIndex !== null && !el.hasAttribute('disabled')) {
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
    setSelections((prev) => {
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
    setSelections((prev) => {
      const newSelections = { ...prev }
      for (const cell of cells) {
        const time = availableTimes[cell.timeIndex]
        if (!time || (allowedSlots && !allowedSlots[cell.dateKey]?.[time])) continue

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
  }, [availableTimes, allowedSlots, setSelections])

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
      if (dateKey && timeIndex !== null && !el.hasAttribute('disabled')) {
        const cellPos = { dateKey, timeIndex: parseInt(timeIndex, 10) }
        setDragCurrent((prev) => {
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
  // non-passive 터치 이벤트로 네이티브 스크롤을 막았으므로, 모바일에서도 JS 스크롤 적용
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

    const rect = scrollWrapper.getBoundingClientRect()

    if (rect.height >= 100) {
      const edgeSize = Math.min(AUTO_SCROLL_EDGE, rect.height * 0.15)
      const viewportWidth = window.innerWidth

      const distanceFromTop = pos.y - rect.top
      const distanceFromBottom = rect.bottom - pos.y

      // 세로 스크롤
      if (distanceFromTop < edgeSize && distanceFromTop >= 0) {
        const intensity = 1 - (distanceFromTop / edgeSize)
        scrollWrapper.scrollTop -= AUTO_SCROLL_SPEED * Math.max(0.3, intensity)
      } else if (distanceFromBottom < edgeSize && distanceFromBottom >= 0) {
        const intensity = 1 - (distanceFromBottom / edgeSize)
        scrollWrapper.scrollTop += AUTO_SCROLL_SPEED * Math.max(0.3, intensity)
      }

      // 가로 스크롤
      if (pos.x < AUTO_SCROLL_EDGE) {
        const distance = AUTO_SCROLL_EDGE - pos.x
        const speed = (distance / AUTO_SCROLL_EDGE) * AUTO_SCROLL_SPEED
        gridContainer.scrollLeft -= speed
      } else if (pos.x > viewportWidth - AUTO_SCROLL_EDGE) {
        const distance = pos.x - (viewportWidth - AUTO_SCROLL_EDGE)
        const speed = (distance / AUTO_SCROLL_EDGE) * AUTO_SCROLL_SPEED
        gridContainer.scrollLeft += speed
      }
    }

    // 현재 위치의 셀 업데이트
    updateCellAtPointer()

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
    const touch = e.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }

    const cellPos = getCellFromTouch(touch)
    if (!cellPos) return

    touchStartCellRef.current = cellPos

    if (!isEditMode) return

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

    // 드래그 모드: 셀 선택 업데이트
    // preventDefault()는 non-passive 리스너에서 처리됨
    if (isDragMode) {
      // 현재 터치 위치 저장 (rAF 루프에서 사용)
      lastPointerPosRef.current = { x: touch.clientX, y: touch.clientY }

      const cellPos = getCellFromTouch(touch)
      if (cellPos && (cellPos.dateKey !== dragCurrent?.dateKey || cellPos.timeIndex !== dragCurrent?.timeIndex)) {
        setDragCurrent(cellPos)
        triggerHaptic(5)
      }

      // rAF 루프 시작
      startAutoScroll()
    }
  }, [isEditMode, isDragMode, dragCurrent, getCellFromTouch, clearLongPressTimer, triggerHaptic, startAutoScroll])

  // 터치 끝
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    clearLongPressTimer()
    stopAutoScroll()

    const touch = e.changedTouches[0]
    const startPos = touchStartRef.current
    const startCell = touchStartCellRef.current

    if (!isEditMode) {
      if (startPos && startCell) {
        const dx = Math.abs(touch.clientX - startPos.x)
        const dy = Math.abs(touch.clientY - startPos.y)
        const time = availableTimes[startCell.timeIndex]
        if (dx < MOVE_THRESHOLD && dy < MOVE_THRESHOLD && time) {
          onCellClick?.(startCell.dateKey, time)
        }
      }

      touchStartRef.current = null
      touchStartCellRef.current = null
      return
    }

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
  }, [isEditMode, isDragMode, draggedCells, dragAction, availableTimes, onCellClick, toggleCell, applyDragSelection, clearLongPressTimer, stopAutoScroll])

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

  // ===== Non-passive 터치 이벤트 리스너 등록 =====
  // React의 onTouchMove는 passive로 등록되어 preventDefault()가 무시됨
  // 드래그 모드에서 네이티브 스크롤을 막으려면 non-passive 리스너가 필요
  useEffect(() => {
    const scrollWrapper = scrollWrapperRef.current
    const gridContainer = gridScrollContainerRef.current

    if (!isEditMode || !isDragMode || !scrollWrapper || !gridContainer) return

    const handleTouchMoveNative = (e: TouchEvent) => {
      // 드래그 모드일 때만 스크롤 방지
      if (isDragMode) {
        e.preventDefault()
      }
    }

    // { passive: false }로 등록해야 preventDefault() 작동
    scrollWrapper.addEventListener('touchmove', handleTouchMoveNative, { passive: false })

    return () => {
      scrollWrapper.removeEventListener('touchmove', handleTouchMoveNative)
    }
  }, [isEditMode, isDragMode])

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
      if (dateKey && timeIndex !== null && !el.hasAttribute('disabled')) {
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
  const handleMouseUp = useCallback(() => {
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
  const handleMouseLeave = useCallback(() => {
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
    <>
      <div className={styles.calendarToolbar} dir={direction}>
        <h3 className={styles.calendarTitle}>{heading ?? t('meeting.result.calendarTitle')}</h3>
        {(scrollEdges.before || scrollEdges.after) && (
          <div className={styles.dateNavigation} dir='ltr'>
            <button type='button' onClick={() => moveDates(-1)} disabled={rtl ? !scrollEdges.after : !scrollEdges.before} aria-label={t(rtl ? 'meeting.timeGrid.nextDates' : 'meeting.timeGrid.previousDates')} aria-controls={gridId}>
              <HiChevronLeft aria-hidden='true' />
            </button>
            <button type='button' onClick={() => moveDates(1)} disabled={rtl ? !scrollEdges.before : !scrollEdges.after} aria-label={t(rtl ? 'meeting.timeGrid.previousDates' : 'meeting.timeGrid.nextDates')} aria-controls={gridId}>
              <HiChevronRight aria-hidden='true' />
            </button>
          </div>
        )}
      </div>
      <div className={`${styles.container} ${className} ${!isEditMode ? styles.resultCalendar : ''} ${height !== 'auto' ? styles.bounded : ''}`} dir={direction} style={{ '--date-count': dates.length, 'maxHeight': height, 'height': 'auto' } as CSSProperties}>
        {isEditMode && (
          <div
            className={`${styles.gestureHint} ${isDragMode ? styles.gestureHintActive : ''}`}
            role='status'
            aria-live='polite'
          >
            <span className={styles.gestureHintIcon} aria-hidden='true'>
              <HiOutlineHand />
            </span>
            {isDragMode && <span>{t('meeting.timeGrid.draggingHint')}</span>}
            {!isDragMode && (
              <>
                <span className={styles.touchHint}>{t('meeting.timeGrid.touchHint')}</span>
                <span className={styles.pointerHint}>{t('meeting.timeGrid.pointerHint')}</span>
              </>
            )}
          </div>
        )}
        <div className={styles.wrapper} dir={direction}>
          <div className={styles.stickyHeader}>
            <div className={styles.dateHeaderRow}>
              <div className={styles.timeColumnHeader}>
                <span className={styles.timeColumnLabel}>{t('meeting.timeGrid.timeLabel')}</span>

              </div>
              <div className={styles.dateHeaderScroll} ref={dateHeaderScrollRef}>
                {dates.map((date) => {
                  const dateKey = date.format('YYYY-MM-DD')
                  const instant = new Date(`${dateKey}T12:00:00Z`)
                  const dateLabel = formatters.full.format(instant)
                  const compactDateLabel = formatters.date.format(instant)
                  const weekdayLabel = formatters.weekday.format(instant)
                  const currentSelections = selections[dateKey] || []
                  const times = availableTimes.filter(time => !allowedSlots || allowedSlots[dateKey]?.[time])
                  const allSelected = times.length > 0
                    && times.every(time => currentSelections.includes(time))

                  if (!isEditMode) {
                    return (
                      <div
                        key={dateKey}
                        className={styles.dateHeader}
                        aria-label={dateLabel}
                      >
                        <span className={styles.dateTitle}><bdi>{compactDateLabel}</bdi><span className={styles.weekday}>{weekdayLabel}</span></span>
                      </div>
                    )
                  }

                  return (
                    <button
                      type='button'
                      key={dateKey}
                      className={`${styles.dateHeader} ${styles.clickable} ${allSelected ? styles.allSelected : ''}`}
                      onClick={() => handleDateHeaderClick(dateKey)}
                      aria-pressed={allSelected}
                      aria-label={t('meeting.timeGrid.selectDate', { date: dateLabel })}
                    >
                      <span className={styles.dateTitle}><bdi>{compactDateLabel}</bdi><span className={styles.weekday}>{weekdayLabel}</span></span>
                    </button>
                  )
                })}
              </div>
            </div>
            <div className={styles.scrollTrack} aria-hidden='true' data-overflow={scrollEdges.before || scrollEdges.after}>
              <div className={styles.scrollIndicator} ref={scrollIndicatorRef} />
            </div>
          </div>
          {/* 시간 그리드 */}
          <div className={styles.scrollWrapper} ref={scrollWrapperRef} onScroll={(event) => { viewportRef.current.top = event.currentTarget.scrollTop }}>
            <div className={styles.timeColumn}>
              {availableTimes.map((time) => {
                const isFullHour = time.endsWith(':00')
                return (
                  <div
                    key={time}
                    className={`${styles.timeCell} ${isFullHour ? styles.fullHour : styles.halfHour}`}
                  >
                    <bdi>{formatters.time.format(new Date(`2000-01-01T${time}:00Z`))}</bdi>
                  </div>
                )
              })}
            </div>
            <div
              className={`${styles.gridScrollContainer} ${isDragMode ? styles.dragging : ''}`}
              ref={gridScrollContainerRef}
              id={gridId}
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
                dates.map((date) => {
                  const dateKey = date.format('YYYY-MM-DD')
                  return (
                    <div key={dateKey} className={styles.dateWrapper}>
                      <DailyGrid
                        date={date}
                        timezone={timezone}
                        dateKey={dateKey}
                        availableTimes={availableTimes}
                        allowedTimes={allowedSlots ? Object.keys(allowedSlots[dateKey] ?? {}) : undefined}
                        schedule={schedule?.[dateKey]}
                        participantsCount={participantsCount}
                        selectedTimeSlots={selections[dateKey] || []}
                        isDragMode={isDragMode}
                        dragAction={dragAction}
                        draggedCells={draggedCells}
                        mode={mode}
                        onCellClick={isEditMode ? toggleCell : onCellClick}
                      />
                    </div>
                  )
                })
              }
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
