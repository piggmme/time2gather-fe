import { getLocaleMessages, getTranslations, intlLocale, type Locale } from '../i18n'
import { localizedAppPath } from './config'
import images from './availabilityImages.json'

// Three friends have replied; the visitor edits the fourth person's availability.
// Slots are row-major, one hour apart, with three example dates per row.
const participants = [
  { id: 'jiwoo' as const, slots: [0, 1, 3, 4, 5, 7, 8] },
  { id: 'minseo' as const, slots: [2, 3, 4, 5, 6, 7, 8] },
  { id: 'doyun' as const, slots: [1, 3, 4, 5, 6, 7, 8, 11] },
]

// The static example has one cell per weekday for the 18:00, 19:00 and 20:00 rows.
const exampleAttendance = [[1, 2, 1], [3, 4, 2], [1, 2, 1]]

// Resolve copy and date formats on the server for stable, localized hydration.
export function getAvailabilityDemo (locale: Locale) {
  const copy = getLocaleMessages(locale).availabilityDemo
  const t = getTranslations(locale)
  const language = intlLocale(locale)
  const number = new Intl.NumberFormat(language)
  const dates = [13, 14, 15].map(day => new Date(Date.UTC(2026, 10, day, 19)))
  const weekday = new Intl.DateTimeFormat(language, { weekday: 'short', timeZone: 'UTC' })
  const dateLabel = new Intl.DateTimeFormat(language, { month: 'short', day: 'numeric', weekday: 'short', timeZone: 'UTC' })
  const fullDate = new Intl.DateTimeFormat(language, { dateStyle: 'full', timeZone: 'UTC' })
  const shortDate = new Intl.DateTimeFormat(language, { month: 'numeric', day: 'numeric', timeZone: 'UTC' })
  const time = new Intl.DateTimeFormat(language, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'UTC' })
  const hour = new Intl.DateTimeFormat(language, { hour: 'numeric', hourCycle: 'h23', timeZone: 'UTC' })
  return {
    exampleRows: exampleAttendance.map((counts, index) => ({
      hour: hour.format(Date.UTC(2026, 10, 14, 18 + index)),
      counts,
    })),
    copy,
    images: images[locale],
    imageAlt: `${copy.compactTime} ${copy.compactResult}.`,
    people: participants.map(({ id, slots }) => ({ id, slots, name: copy.people[id] })),
    days: dates.map(date => ({
      key: date.toISOString().slice(0, 10), short: weekday.format(date), date: shortDate.format(date), label: dateLabel.format(date), full: fullDate.format(date),
    })),
    times: [18, 19, 20, 21].map(hour => ({ key: `${hour}:00`, label: time.format(new Date(Date.UTC(2026, 10, 13, hour))) })),
    initialSelection: [4],
    numbers: Array.from({ length: 5 }, (_, count) => number.format(count)),
    resultTitles: Array.from({ length: 5 }, (_, count) => t(`meeting.result.decision.${count === 4 ? 'allTimes' : 'partial'}`, { count })),
    counts: Array.from({ length: 5 }, (_, count) => t('meeting.result.someAvailable', { count, total: 4 })),
    moreLabels: Array.from({ length: 13 }, (_, count) => t('meeting.result.showMoreOptions', { count })),
    fewer: t('meeting.result.showFewerOptions'),
    basis: t('meeting.result.decision.basis'),
    notAll: t('meeting.result.decision.notAll'),
    notSelected: t('meeting.result.decision.notSelected'),
    peopleHint: t('meeting.result.decision.people'),
    mySelection: t('meeting.dateCalendar.mySelection'),
    createHref: localizedAppPath(locale, '/meetings/create'),
  }
}

export type AvailabilityDemoData = ReturnType<typeof getAvailabilityDemo>
