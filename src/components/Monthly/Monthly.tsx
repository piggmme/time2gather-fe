import MonthlyGrid from './MonthlyGrid'
import dayjs from 'dayjs'
import 'dayjs/locale/ko'
import 'dayjs/locale/en'
import styles from './Monthly.module.scss'
import { useState, useEffect } from 'react'
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi'
import { useStore } from '@nanostores/react'
import { $locale } from '../../stores/locale'

function getMonthDays (year: number, month: number) {
  const start = dayjs().year(year).month(month).date(1)
  const end = start.endOf('month')

  const days: dayjs.Dayjs[] = []

  // 해당 월의 첫 날의 요일 (0 = 일요일, 6 = 토요일)
  const firstDayOfWeek = start.day()

  // 이전 달의 마지막 날들 추가 (첫 날이 일요일이 아니면)
  if (firstDayOfWeek > 0) {
    const prevMonthEnd = start.subtract(1, 'day')
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push(prevMonthEnd.subtract(i, 'day'))
    }
  }

  // 해당 월의 모든 날짜 추가
  let cur = start
  while (cur.isBefore(end) || cur.isSame(end, 'day')) {
    days.push(cur)
    cur = cur.add(1, 'day')
  }

  // 해당 월의 마지막 날의 요일 (0 = 일요일, 6 = 토요일)
  const lastDayOfWeek = end.day()

  // 마지막 날이 토요일이 아니면 다음 달의 날짜를 추가해서 마지막 주를 채움
  if (lastDayOfWeek < 6) {
    const nextMonthStart = end.add(1, 'day')
    const remainingDays = 6 - lastDayOfWeek // 토요일까지 남은 일수
    for (let i = 0; i < remainingDays; i++) {
      days.push(nextMonthStart.add(i, 'day'))
    }
  }

  return days
}

type MonthlyProps
  = | {
    dates: dayjs.Dayjs[]
    setDates: (dates: dayjs.Dayjs[]) => void
    mode?: 'edit'
    onDateClick?: (date: dayjs.Dayjs) => void
    availableDates?: dayjs.Dayjs[]
  }
  | {
    dates?: dayjs.Dayjs[]
    setDates?: never
    mode: 'view'
    onDateClick?: (date: dayjs.Dayjs) => void
    availableDates?: dayjs.Dayjs[]
  }

export default function Monthly ({
  dates,
  setDates,
  mode = 'edit',
  onDateClick,
  availableDates,
}: MonthlyProps) {
  const isEditMode = mode === 'edit'
  const locale = useStore($locale)
  const [currentDate, setCurrentDate] = useState(dayjs())
  const monthDays = getMonthDays(currentDate.year(), currentDate.month())

  // Update dayjs locale when locale changes
  useEffect(() => {
    dayjs.locale(locale === 'ko' ? 'ko' : 'en')
  }, [locale])

  const today = dayjs()
  const isCurrentMonthBeforeToday = isEditMode
    && (currentDate.year() < today.year()
      || (currentDate.year() === today.year() && currentDate.month() <= today.month()))

  const handlePreviousMonth = () => {
    if (!isCurrentMonthBeforeToday) {
      setCurrentDate(currentDate.subtract(1, 'month'))
    }
  }
  const handleNextMonth = () => {
    setCurrentDate(currentDate.add(1, 'month'))
  }

  // Format date based on locale
  const formatMonthYear = (date: dayjs.Dayjs) => {
    if (locale === 'ko') {
      return date.format('YYYY년 MM월')
    } else {
      return date.format('MMMM YYYY')
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button
          onClick={handlePreviousMonth}
          disabled={isCurrentMonthBeforeToday}
          className={isCurrentMonthBeforeToday ? styles.disabled : ''}
        >
          <HiChevronLeft />
        </button>
        <h2 className={styles.title}>{formatMonthYear(currentDate)}</h2>
        <button onClick={handleNextMonth}>
          <HiChevronRight />
        </button>
      </div>
      <MonthlyGrid
        dates={dates ?? []}
        setDates={isEditMode ? setDates : undefined}
        monthDays={monthDays}
        currentYear={currentDate.year()}
        currentMonth={currentDate.month()}
        mode={mode}
        onDateClick={onDateClick}
        availableDates={availableDates}
      />
    </div>
  )
}
