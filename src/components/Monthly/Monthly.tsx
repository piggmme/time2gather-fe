import MonthlyGrid from './MonthlyGrid'
import dayjs from 'dayjs'
import 'dayjs/locale/ko'
import 'dayjs/locale/en'
import styles from './Monthly.module.scss'
import { useState, useEffect } from 'react'
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi'
import type { get_meetings_$meetingCode_response } from '../../services/meetings'
import { useTranslation } from '../../hooks/useTranslation'

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

type DateSchedule = {
  [date: string]: {
    count: number
    participants: get_meetings_$meetingCode_response['data']['participants']
  }
}

type MonthlyProps
  = | {
    dates: dayjs.Dayjs[]
    setDates: (dates: dayjs.Dayjs[]) => void
    mode?: 'edit'
    onDateClick?: (date: dayjs.Dayjs) => void
    availableDates?: dayjs.Dayjs[]
    dateSchedule?: DateSchedule
    participantsCount?: number
  }
  | {
    dates?: dayjs.Dayjs[]
    setDates?: never
    mode: 'view'
    onDateClick?: (date: dayjs.Dayjs) => void
    availableDates?: dayjs.Dayjs[]
    dateSchedule?: DateSchedule
    participantsCount?: number
  }

export default function Monthly ({
  dates,
  setDates,
  mode = 'edit',
  onDateClick,
  availableDates,
  dateSchedule,
  participantsCount,
}: MonthlyProps) {
  const isEditMode = mode === 'edit'
  const { t, locale } = useTranslation()
  const availableMonths = Array.from(
    (availableDates ?? []).reduce((months, date) => {
      const key = date.format('YYYY-MM')
      const month = months.get(key)
      months.set(key, {
        key,
        date: date.startOf('month'),
        count: (month?.count ?? 0) + 1,
      })
      return months
    }, new Map<string, { key: string, date: dayjs.Dayjs, count: number }>()).values(),
  ).sort((a, b) => a.date.diff(b.date))
  const [currentDate, setCurrentDate] = useState(() => availableMonths[0]?.date ?? dayjs())
  const monthDays = getMonthDays(currentDate.year(), currentDate.month())
  const currentMonthKey = currentDate.format('YYYY-MM')
  const currentAvailableMonthIndex = availableMonths.findIndex(month => month.key === currentMonthKey)

  // Update dayjs locale when locale changes
  useEffect(() => {
    dayjs.locale(locale === 'ko' ? 'ko' : 'en')
  }, [locale])

  const today = dayjs()
  const isCurrentMonthBeforeToday = isEditMode
    && (currentDate.year() < today.year()
      || (currentDate.year() === today.year() && currentDate.month() <= today.month()))
  const hasAvailabilityRange = availableMonths.length > 0
  const isPreviousDisabled = hasAvailabilityRange
    ? currentAvailableMonthIndex <= 0
    : isCurrentMonthBeforeToday
  const isNextDisabled = hasAvailabilityRange
    ? currentAvailableMonthIndex < 0 || currentAvailableMonthIndex >= availableMonths.length - 1
    : false

  const handlePreviousMonth = () => {
    if (isPreviousDisabled) return
    if (hasAvailabilityRange) {
      setCurrentDate(availableMonths[currentAvailableMonthIndex - 1].date)
      return
    }
    setCurrentDate(currentDate.subtract(1, 'month'))
  }
  const handleNextMonth = () => {
    if (isNextDisabled) return
    if (hasAvailabilityRange) {
      setCurrentDate(availableMonths[currentAvailableMonthIndex + 1].date)
      return
    }
    setCurrentDate(currentDate.add(1, 'month'))
  }

  // Format date based on locale
  const formatMonthYear = (date: dayjs.Dayjs) => {
    const localizedDate = date.locale(locale === 'ko' ? 'ko' : 'en')
    if (locale === 'ko') {
      return localizedDate.format('YYYY년 MM월')
    } else {
      return localizedDate.format('MMMM YYYY')
    }
  }

  const formatMonth = (date: dayjs.Dayjs) => {
    const localizedDate = date.locale(locale === 'ko' ? 'ko' : 'en')
    return locale === 'ko' ? localizedDate.format('M월') : localizedDate.format('MMM')
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button
          type='button'
          onClick={handlePreviousMonth}
          disabled={isPreviousDisabled}
          className={isPreviousDisabled ? styles.disabled : ''}
          aria-label={t('meeting.dateCalendar.previousMonth')}
        >
          <HiChevronLeft />
        </button>
        <h2 className={styles.title} aria-live='polite'>{formatMonthYear(currentDate)}</h2>
        <button
          type='button'
          onClick={handleNextMonth}
          disabled={isNextDisabled}
          className={isNextDisabled ? styles.disabled : ''}
          aria-label={t('meeting.dateCalendar.nextMonth')}
        >
          <HiChevronRight />
        </button>
      </div>
      {isEditMode && availableDates && (
        <div className={`${styles.availabilityMeta} ${availableMonths.length > 1 ? '' : styles.legendOnly}`}>
          {availableMonths.length > 1 && (
            <div className={styles.availableMonths} aria-label={t('meeting.dateCalendar.availableMonths')}>
              {availableMonths.map(month => (
                <button
                  type='button'
                  key={month.key}
                  data-available-month={month.key}
                  className={month.key === currentMonthKey ? styles.current : ''}
                  onClick={() => setCurrentDate(month.date)}
                  aria-pressed={month.key === currentMonthKey}
                  aria-label={t('meeting.dateCalendar.monthAvailability', {
                    month: formatMonth(month.date),
                    count: month.count,
                  })}
                >
                  <span>{formatMonth(month.date)}</span>
                  <span className={styles.monthCount}>{month.count}</span>
                </button>
              ))}
            </div>
          )}
          <div className={styles.availabilityLegend}>
            <span><i className={styles.availableSwatch} />{t('meeting.dateCalendar.available')}</span>
            <span><i className={styles.unavailableSwatch} />{t('meeting.dateCalendar.unavailable')}</span>
          </div>
        </div>
      )}
      <MonthlyGrid
        dates={dates ?? []}
        setDates={isEditMode ? setDates : undefined}
        monthDays={monthDays}
        currentYear={currentDate.year()}
        currentMonth={currentDate.month()}
        mode={mode}
        onDateClick={onDateClick}
        availableDates={availableDates}
        dateSchedule={dateSchedule}
        participantsCount={participantsCount}
      />
    </div>
  )
}
