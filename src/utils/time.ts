import { intlLocale, type Locale } from '../i18n/config'
import dayjs from 'dayjs'
import 'dayjs/locale/ko'
import 'dayjs/locale/en'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import utc from 'dayjs/plugin/utc'

dayjs.extend(customParseFormat)
dayjs.extend(utc)

export const amPmOptions = ['AM', 'PM'] as const
export type AmPm = typeof amPmOptions[number]

// 12시간 형식 시간 슬롯 (00:00 ~ 11:00, 1시간 단위)
export const timeSlots12 = Array.from({ length: 12 }, (_, i) => {
  const hours = i === 0 ? 12 : i
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
  return `${String((hours % 12) + (amPm === 'PM' ? 12 : 0)).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
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

export function formatDate (date: dayjs.Dayjs | string, locale: Locale, fields: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', weekday: 'short' }): string {
  const dateKey = typeof date === 'string' ? date.slice(0, 10) : date.format('YYYY-MM-DD')
  const parsed = new Date(`${dateKey}T12:00:00Z`)
  return new Intl.DateTimeFormat(intlLocale(locale), {
    ...fields, timeZone: 'UTC',
    ...(fields.day && parsed.getUTCFullYear() !== new Date().getFullYear() ? { year: 'numeric' as const } : {}),
  }).format(parsed)
}

export function formatMonth (date: dayjs.Dayjs, locale: Locale, includeYear = false): string {
  return new Intl.DateTimeFormat(intlLocale(locale), { timeZone: 'UTC', month: includeYear ? 'long' : 'short', ...(includeYear ? { year: 'numeric' as const } : {}) }).format(new Date(`${date.format('YYYY-MM-DD')}T12:00:00Z`))
}

export function formatWeekday (day: number, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale(locale), { timeZone: 'UTC', weekday: 'short' }).format(new Date(Date.UTC(2026, 0, 4 + day)))
}

export function formatTime (time: string, locale: Locale, allDayLabel: string): string {
  if (time === 'ALL_DAY') return allDayLabel
  const [hours, minutes] = time.split(':').map(Number)
  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return time
  return new Intl.DateTimeFormat(intlLocale(locale), { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }).format(new Date(Date.UTC(2000, 0, 1, hours, minutes)))
}

export function formatTimeRange (time: string, locale: Locale, allDayLabel: string): string {
  return time.split(/\s*(?:~|–)\s*/).map(part => formatTime(part, locale, allDayLabel)).join(' – ')
}

export function getWeekStart (locale: Locale): number {
  const regional = new Intl.Locale(intlLocale(locale)) as Intl.Locale & { weekInfo?: { firstDay: number }, getWeekInfo?: () => { firstDay: number } }
  const firstDay = (regional.getWeekInfo?.() ?? regional.weekInfo)?.firstDay
  if (firstDay) return firstDay % 7
  if (locale === 'ar' || locale === 'ar-EG') return 6
  return ['en', 'hi', 'bn', 'pt', 'id', 'ur', 'ja', 'mr', 'te', 'ko', 'th'].includes(locale) ? 0 : 1
}
