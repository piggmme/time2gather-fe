import dayjs from 'dayjs'
import 'dayjs/locale/ko'
import 'dayjs/locale/en'

export const amPmOptions = ['AM', 'PM'] as const
export type AmPm = typeof amPmOptions[number]

// 12시간 형식 시간 슬롯 (00:00 ~ 11:00, 1시간 단위)
export const timeSlots12 = Array.from({ length: 12 }, (_, i) => {
  const hours = i
  return `${String(hours).padStart(2, '0')}:00`
})

export const timeSlots24 = Array.from({ length: 24 }, (_, i) => {
  const hours = i
  return `${String(hours).padStart(2, '0')}:00`
})

export function isTime24After (time1: string, time2: string): boolean {
  const t1 = dayjs(`2000-01-01 ${time1}`, 'YYYY-MM-DD HH:mm')
  const t2 = dayjs(`2000-01-01 ${time2}`, 'YYYY-MM-DD HH:mm')
  return t1.isAfter(t2) || t1.isSame(t2)
}

export function isTime12After (time1: { time12: string, amPm: AmPm }, time2: { time12: string, amPm: AmPm }): boolean {
  const t1 = convertTo24Hour(time1.time12, time1.amPm)
  const t2 = convertTo24Hour(time2.time12, time2.amPm)
  return isTime24After(t1, t2)
}

export function convertTo24Hour (time12: string, amPm: AmPm): string {
  const [hours, minutes] = time12.split(':').map(Number)
  return `${String(amPm == 'AM' ? hours : hours + 12).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export function convertTo12Hour (time24: string): { time: string, amPm: AmPm } {
  const [hours, minutes] = time24.split(':').map(Number)
  let hour12 = hours
  let amPm: AmPm = 'AM'

  if (hours === 0) {
    hour12 = 12
    amPm = 'AM'
  } else if (hours === 12) {
    hour12 = 12
    amPm = 'PM'
  } else if (hours > 12) {
    hour12 = hours - 12
    amPm = 'PM'
  } else {
    hour12 = hours
    amPm = 'AM'
  }

  return {
    time: `${String(hour12).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
    amPm,
  }
}

export function getTimeRangeSlots (startTime24: string, endTime24: string): string[] {
  const startIndex = timeSlots24.findIndex(t => t === startTime24)
  const endIndex = timeSlots24.findIndex(t => t === endTime24)

  if (startIndex === -1 || endIndex === -1 || startIndex > endIndex) {
    return []
  }
  return timeSlots24.slice(startIndex, endIndex + 1)
}

export function formatDate (date: dayjs.Dayjs, locale: 'ko' | 'en'): string {
  const now = dayjs()
  const isSameYear = date.year() === now.year()
  // locale을 적용한 date 인스턴스 생성
  const localizedDate = date.locale(locale === 'ko' ? 'ko' : 'en')
  const weekday = localizedDate.format('ddd')

  if (locale === 'ko') {
    if (isSameYear) {
      return `${localizedDate.format('M월 D일')} (${weekday})`
    } else {
      return `${localizedDate.format('YYYY년 M월 D일')} (${weekday})`
    }
  } else {
    if (isSameYear) {
      return `${localizedDate.format('MMM D')} (${weekday})`
    } else {
      return `${localizedDate.format('MMM D, YYYY')} (${weekday})`
    }
  }
}
