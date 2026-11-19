import { formatWeekday, getWeekStart } from '../../utils/time'
import { useState, useRef, type TouchEvent } from 'react'
import { DndContext } from '@dnd-kit/core'
import MonthlyCell from './MonthlyCell'
import dayjs from 'dayjs'
import 'dayjs/locale/ko'
import 'dayjs/locale/en'
import styles from './MonthlyGrid.module.scss'
import { useDragSensors } from '../../hooks/useDragSensors'
import { useDragScrollPrevention } from '../../hooks/useDragScrollPrevention'
import { useStore } from '@nanostores/react'
import { $locale } from '../../stores/locale'
import type { get_meetings_$meetingCode_response } from '../../services/meetings'

type DateSchedule = {
  [date: string]: {
    count: number
    participants: get_meetings_$meetingCode_response['data']['participants']
  }
}

// 날짜 범위 배열 생성 함수
function getDateRange (start: dayjs.Dayjs | null, end: dayjs.Dayjs | null) {
  if (!start || !end) return []

  const s = dayjs(start)
  const e = dayjs(end)

  const startDate = s.isBefore(e) ? s : e
  const endDate = s.isBefore(e) ? e : s

  const days: dayjs.Dayjs[] = []
  let cur = startDate

  while (cur.isBefore(endDate) || cur.isSame(endDate, 'day')) {
    days.push(cur)
    cur = cur.add(1, 'day')
  }

  return days
}

export default function MonthlyGrid ({
  monthDays,
  dates,
  setDates,
  currentYear,
  currentMonth,
  mode = 'edit',
  onDateClick,
  availableDates,
  dateSchedule,
  participantsCount,
  allowPastSelected = false,
  onMonthSwipe,
  swipeDirection,
}: {
  monthDays: dayjs.Dayjs[]
  dates: dayjs.Dayjs[]
  setDates?: (dates: dayjs.Dayjs[]) => void
  currentYear: number
  currentMonth: number
  mode?: 'edit' | 'view'
  onDateClick?: (date: dayjs.Dayjs) => void
  availableDates?: dayjs.Dayjs[]
  dateSchedule?: DateSchedule
  participantsCount?: number
  allowPastSelected?: boolean
  onMonthSwipe?: (direction: 'left' | 'right') => void
  swipeDirection?: 'left' | 'right'
}) {
  const locale = useStore($locale)
  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(null)
  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const touchStart = useRef<{ x: number, y: number, axis?: 'horizontal' | 'vertical' } | null>(null)
  const suppressTouchClick = useRef(false)

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0]
    touchStart.current = event.touches.length === 1 ? { x: touch.clientX, y: touch.clientY } : null
  }

  const handleTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 1) {
      touchStart.current = null
      return
    }
    const start = touchStart.current
    if (!start || start.axis) return

    const touch = event.touches[0]
    const dx = Math.abs(touch.clientX - start.x)
    const dy = Math.abs(touch.clientY - start.y)
    if (Math.max(dx, dy) >= 12) start.axis = dx > dy * 1.25 ? 'horizontal' : 'vertical'
  }

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const start = touchStart.current
    touchStart.current = null
    if (!start || event.touches.length > 0) return

    const touch = event.changedTouches[0]
    const dx = touch.clientX - start.x
    const dy = touch.clientY - start.y
    suppressTouchClick.current = Boolean(start.axis)
    if (start.axis === 'horizontal' && Math.abs(dx) >= 44 && Math.abs(dx) > Math.abs(dy) * 1.25) {
      onMonthSwipe?.(dx < 0 ? 'left' : 'right')
    }
  }

  const addDates = (newDates: dayjs.Dayjs[]) => {
    if (!setDates) return
    const allDates = [...dates, ...newDates]
    const uniqueDates = allDates.filter((date, index, self) =>
      index === self.findIndex(d => d.isSame(date, 'day')),
    )
    setDates(uniqueDates)
  }

  const handleDragedDates = (newDates: dayjs.Dayjs[]) => {
    if (!setDates) return
    const isAllIncluded = newDates.every(date => dates.some(d => d.isSame(date, 'day')))
    if (isAllIncluded) {
      removeDates(newDates)
      return
    }
    addDates(newDates)
  }

  const removeDates = (newDates: dayjs.Dayjs[]) => {
    if (!setDates) return
    const allDates = dates.filter(date => !newDates.some(d => d.isSame(date, 'day')))
    setDates(allDates)
  }

  const sensors = useDragSensors(Boolean(onMonthSwipe))
  const isEditMode = mode === 'edit'

  // 드래그 중일 때 스크롤 방지 (편집 모드에서만)
  useDragScrollPrevention(isEditMode && startDate !== null, containerRef)

  const selectedDays = getDateRange(startDate, endDate)

  // 요일 헤더 생성 (0=일요일부터 6=토요일까지)
  const weekdays = Array.from({ length: 7 }, (_, i) => {
    const day = (i + getWeekStart(locale)) % 7
    return {
      number: day,
      name: formatWeekday(day, locale), // 한국어 축약형 요일 (일, 월, 화, 수, 목, 금, 토)
    }
  })

  const gridContent = (
    <div
      className={onMonthSwipe ? `${styles.container} ${styles.swipeable}` : styles.container}
      ref={containerRef}
      data-swipe-direction={swipeDirection}
      {...(onMonthSwipe && {
        onTouchStartCapture: handleTouchStart,
        onTouchMoveCapture: handleTouchMove,
        onTouchEndCapture: handleTouchEnd,
        onTouchCancelCapture: () => { touchStart.current = null },
        onPointerDownCapture: () => { suppressTouchClick.current = false },
        onClickCapture: (event) => {
          if (!suppressTouchClick.current || event.detail === 0) return
          suppressTouchClick.current = false
          event.stopPropagation()
        },
      })}
    >
      <div className={styles.weekdays}>
        {weekdays.map(weekday => (
          <div
            key={weekday.number}
            className={`
              ${styles.weekday}
              ${weekday.number === 0 ? styles.sunday : ''}
              ${weekday.number === 6 ? styles.saturday : ''}
            `}
          >
            {weekday.name}
          </div>
        ))}
      </div>
      <div className={styles.grid}>
        {monthDays.map((day: dayjs.Dayjs) => {
          const isCurrentMonth = day.year() === currentYear && day.month() === currentMonth
          // Keep weekday positions without displaying or making adjacent months interactive.
          if (!isCurrentMonth) return <div key={day.format('YYYY-MM-DD')} aria-hidden='true' />
          const today = dayjs()
          const dateKey = day.format('YYYY-MM-DD')
          const isSelected = dates.some(d => d.isSame(day, 'day'))

          // dateSchedule에서 해당 날짜의 참여자 수 가져오기
          // 자신이 선택한 경우는 제외하고 계산 (Daily와 동일한 로직)
          const scheduleData = dateSchedule?.[dateKey]
          const otherCount = scheduleData?.count || 0

          // availableDates가 제공되면 해당 날짜 목록에 포함된 날짜만 활성화
          // availableDates가 없으면 기존 로직 (과거 날짜만 disabled)
          let isDisabled = false
          if (availableDates) {
            // availableDates에 포함되지 않은 날짜는 disabled
            isDisabled = !availableDates.some(availableDate => availableDate.isSame(day, 'day'))
          } else {
            // 기존 로직: 과거 날짜만 disabled
            isDisabled = day.isBefore(today, 'day') && !(allowPastSelected && isSelected)
          }

          return (
            <MonthlyCell
              key={dateKey}
              date={day}
              isSelected={isSelected}
              isDragged={selectedDays.some(d => d.isSame(day, 'day'))}
              isCurrentMonth={isCurrentMonth}
              isAvailable={Boolean(availableDates) && !isDisabled}
              mode={mode}
              disabled={isDisabled}
              count={otherCount}
              maxCount={participantsCount}
              isVoting={Boolean(availableDates || dateSchedule) || !isEditMode}
              {...(isEditMode && !isDisabled && {
                onClick: () => {
                  handleDragedDates([day])
                  onDateClick?.(day)
                },
              })}
              {...(!isEditMode && onDateClick && {
                onClick: () => {
                  onDateClick(day)
                },
              })}
            />
          )
        })}
      </div>
    </div>
  )

  // 뷰어 모드에서는 DndContext 없이 렌더링
  if (!isEditMode) {
    return gridContent
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(event) => {
        const date = event.active?.data?.current?.date
        if (!date) return

        const today = dayjs()
        const isDateAvailable = availableDates
          ? availableDates.some(availableDate => availableDate.isSame(date, 'day'))
          : !date.isBefore(today, 'day') || (allowPastSelected && dates.some(selected => selected.isSame(date, 'day')))

        if (isDateAvailable) {
          // Once a long press starts range selection, that touch belongs to the drag sensor.
          touchStart.current = null
          setStartDate(date)
          setEndDate(date)
        }
      }}
      onDragMove={(event) => {
        const date = event.over?.data?.current?.date
        if (!date) return

        const today = dayjs()
        const isDateAvailable = availableDates
          ? availableDates.some(availableDate => availableDate.isSame(date, 'day'))
          : !date.isBefore(today, 'day') || (allowPastSelected && dates.some(selected => selected.isSame(date, 'day')))

        if (isDateAvailable) {
          setEndDate(date)
        }
      }}
      onDragEnd={() => {
        const today = dayjs()
        const dateRange = getDateRange(startDate, endDate)
        const validDates = availableDates
          ? dateRange.filter(d => availableDates.some(availableDate => availableDate.isSame(d, 'day')))
          : dateRange.filter(d => !d.isBefore(today, 'day'))

        if (validDates.length > 0) {
          handleDragedDates(validDates)
        }
        setStartDate(null)
        setEndDate(null)
      }}
      onDragCancel={() => {
        setStartDate(null)
        setEndDate(null)
      }}
    >
      {gridContent}
    </DndContext>
  )
}
