import { formatMonth, formatWeekday, getWeekStart } from '../../utils/time'
import { useState, useRef } from 'react'
import { DndContext } from '@dnd-kit/core'
import MonthlyCell from './MonthlyCell'
import dayjs from 'dayjs'
import 'dayjs/locale/ko'
import 'dayjs/locale/en'
import styles from './MonthlyGrid.module.scss'
import { useDragSensors } from '../../hooks/useDragSensors'
import { useMonthSwipe, type SwipeMonths } from './useMonthSwipe'
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
  swipeMonths,
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
  swipeMonths?: SwipeMonths
}) {
  const locale = useStore($locale)
  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(null)
  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const swipe = useMonthSwipe(containerRef, swipeMonths)

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

  const sensors = useDragSensors(Boolean(swipeMonths))
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

  const renderDates = (days: dayjs.Dayjs[], year: number, month: number, isPreview = false) => (
    <div className={styles.grid}>
      {days.map((day: dayjs.Dayjs) => {
        const isCurrentMonth = day.year() === year && day.month() === month
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
            isPreview={isPreview}
            isDragged={!isPreview && selectedDays.some(d => d.isSame(day, 'day'))}
            isCurrentMonth={isCurrentMonth}
            isAvailable={Boolean(availableDates) && !isDisabled}
            mode={mode}
            disabled={isDisabled}
            count={otherCount}
            maxCount={participantsCount}
            isVoting={Boolean(availableDates || dateSchedule) || !isEditMode}
            {...(!isPreview && isEditMode && !isDisabled && {
              onClick: () => {
                handleDragedDates([day])
                onDateClick?.(day)
              },
            })}
            {...(!isPreview && !isEditMode && onDateClick && {
              onClick: () => {
                onDateClick(day)
              },
            })}
          />
        )
      })}
    </div>
  )

  const gridContent = (
    <div
      className={swipeMonths ? `${styles.container} ${styles.swipeable}` : styles.container}
      ref={containerRef}
      {...swipe.handlers}
    >
      <div className={styles.weekdays} data-calendar-weekdays=''>
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
      {swipeMonths
        ? (
            <div className={styles.viewport}>
              <div className={styles.track} ref={swipe.track} data-calendar-track=''>
                {renderDates(monthDays, currentYear, currentMonth)}
                {swipe.preview && (
                  <div
                    className={styles.preview}
                    data-swipe-side={swipe.direction}
                    data-calendar-month-preview={swipe.preview.date.format('YYYY-MM')}
                    aria-hidden='true'
                    inert
                  >
                    <span className={styles.previewLabel} data-swipe-month-label=''>
                      {formatMonth(swipe.preview.date, locale)}
                    </span>
                    {renderDates(swipe.preview.days, swipe.preview.date.year(), swipe.preview.date.month(), true)}
                  </div>
                )}
              </div>
            </div>
          )
        : renderDates(monthDays, currentYear, currentMonth)}
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
          swipe.cancelGesture()
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
