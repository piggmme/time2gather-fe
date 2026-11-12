import fallbackTimeZones from '../data/timezones.json'
import { intlLocale, type Locale } from '../i18n/config'

export function getDeviceTimeZone (): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

export function isTimeZone (zone: string): boolean {
  try {
    new Intl.DateTimeFormat('en', { timeZone: zone }).format()
    return true
  } catch {
    return false
  }
}

export function getTimeZones (current?: string): string[] {
  const api = Intl as typeof Intl & { supportedValuesOf?: (key: string) => string[] }
  const zones = api.supportedValuesOf?.('timeZone') ?? fallbackTimeZones
  return [...new Set(['UTC', 'Asia/Kathmandu', 'Asia/Kolkata', 'Asia/Ho_Chi_Minh', 'Asia/Yangon', 'Europe/Kyiv', 'America/Nuuk', 'Pacific/Kanton', getDeviceTimeZone(), ...(current ? [current] : []), ...zones])].sort()
}

const wallFormatters = new Map<string, Intl.DateTimeFormat>()
function wallParts (instant: number, zone: string): string {
  let formatter = wallFormatters.get(zone)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    })
    wallFormatters.set(zone, formatter)
  }
  const parts = Object.fromEntries(formatter.formatToParts(instant).map(part => [part.type, part.value]))
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`
}

const offsetCache = new Map<string, number[]>()
// Machine-readable wall-clock parts for regrouping a result calendar.
export function convertWallTime (date: string, time: string, sourceZone: string, targetZone: string): { date: string, time: string } | undefined {
  if (sourceZone === targetZone) return { date, time }
  const result = inspectWallTime(date, time, sourceZone)
  if (result.instant === undefined) return undefined
  const [targetDate, targetTime] = wallParts(result.instant, targetZone).split('T')
  return { date: targetDate, time: targetTime }
}

export function inspectWallTime (date: string, time: string, zone: string): { status: 'valid' | 'gap' | 'overlap' | 'invalid', instant?: number } {
  if (!isTimeZone(zone) || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return { status: 'invalid' }
  const wall = Date.parse(`${date}T${time}:00Z`)
  if (!Number.isFinite(wall) || new Date(wall).toISOString().slice(0, 16) !== `${date}T${time}`) return { status: 'invalid' }
  const cacheKey = `${date}/${zone}`
  let offsets = offsetCache.get(cacheKey)
  if (!offsets) {
    // Sample both sides of a transition; do not guess an offset from today's date.
    const noon = Date.parse(`${date}T12:00:00Z`)
    offsets = [...new Set([-36, -24, -12, 0, 12, 24, 36].map((hours) => {
      const sample = noon + hours * 3600000
      return Date.parse(`${wallParts(sample, zone)}:00Z`) - sample
    }))]
    offsetCache.set(cacheKey, offsets)
  }
  const candidates = offsets.map(offset => wall - offset).filter(instant => wallParts(instant, zone) === `${date}T${time}`)
  if (!candidates.length) return { status: 'gap' }
  if (candidates.length > 1) return { status: 'overlap' }
  return { status: 'valid', instant: candidates[0] }
}

export function formatZonedDateTime (date: string, time: string, sourceZone: string, targetZone: string, locale: Locale, compact = false): string {
  const result = inspectWallTime(date, time.slice(0, 5), sourceZone)
  if (result.instant === undefined) return `${date} ${time} (${sourceZone})`
  return new Intl.DateTimeFormat(intlLocale(locale), { timeZone: targetZone, ...(compact ? { month: 'numeric' as const, day: 'numeric' as const } : { year: 'numeric' as const, month: 'short' as const, day: 'numeric' as const, timeZoneName: 'short' as const }), hour: 'numeric', minute: '2-digit' }).format(result.instant)
}

// Separate date/time units so narrow cards can wrap between meaningful parts
// without splitting a clock value, day period, or localized date.
export function formatZonedMoment (date: string, time: string, sourceZone: string, targetZone: string, locale: Locale): { date: string, time: string } {
  const result = inspectWallTime(date, time.slice(0, 5), sourceZone)
  if (result.instant === undefined) return { date, time }
  const language = intlLocale(locale)
  return {
    date: new Intl.DateTimeFormat(language, { timeZone: targetZone, year: 'numeric', month: 'short', day: 'numeric' }).format(result.instant),
    time: new Intl.DateTimeFormat(language, { timeZone: targetZone, hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(result.instant),
  }
}
