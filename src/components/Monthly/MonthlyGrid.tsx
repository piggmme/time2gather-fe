import { useState, useRef, useEffect } from 'react'
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
}: {
  monthDays: dayjs.Dayjs[]
  dates: dayjs.Dayjs[]
  setDates?: (dates: dayjs.Dayjs[]) => void
  currentYear: number
  currentMonth: number
  mode?: 'edit' | 'view'
  onDateClick?: (date: dayjs.Dayjs) => void
  availableDates?: dayjs.Dayjs[]
}) {
  const locale = useStore($locale)
  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(null)
  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Update dayjs locale when locale changes
  useEffect(() => {
    dayjs.locale(locale === 'ko' ? 'ko' : 'en')
  }, [locale])

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

  const sensors = useDragSensors()
  const isEditMode = mode === 'edit'

  // 드래그 중일 때 스크롤 방지 (편집 모드에서만)
  useDragScrollPrevention(isEditMode && startDate !== null, containerRef)

  const selectedDays = getDateRange(startDate, endDate)

  // 요일 헤더 생성 (0=일요일부터 6=토요일까지)
  const weekdays = Array.from({ length: 7 }, (_, i) => {
    const day = dayjs().day(i)
    return {
      number: i,
      name: day.format('ddd'), // 한국어 축약형 요일 (일, 월, 화, 수, 목, 금, 토)
    }
  })

  const gridContent = (
    <div className={styles.container} ref={containerRef}>
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
          const today = dayjs()

          // availableDates가 제공되면 해당 날짜 목록에 포함된 날짜만 활성화
          // availableDates가 없으면 기존 로직 (과거 날짜만 disabled)
          let isDisabled = false
          if (isEditMode) {
            if (availableDates) {
              // availableDates에 포함되지 않은 날짜는 disabled
              isDisabled = !availableDates.some(availableDate => availableDate.isSame(day, 'day'))
            } else {
              // 기존 로직: 과거 날짜만 disabled
              isDisabled = day.isBefore(today, 'day')
            }
          }

          return (
            <MonthlyCell
              key={day.format('YYYY-MM-DD')}
              date={day}
              isSelected={dates.some(d => d.isSame(day, 'day'))}
              isDragged={selectedDays.some(d => d.isSame(day, 'day'))}
              isCurrentMonth={isCurrentMonth}
              mode={mode}
              disabled={isDisabled}
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
          : !date.isBefore(today, 'day')

        if (isDateAvailable) {
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
          : !date.isBefore(today, 'day')

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
