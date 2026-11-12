import { intlLocale, type Locale } from '../i18n/config'
import { getTimeZones } from './timezone'

export type TimeZoneOption = { zone: string, label: string, description: string, search: string }

// Common Korean city names complement the localized zone names supplied by Intl.
const cityAliases: Record<string, string> = {
  'Asia/Seoul': '서울 대한민국 한국 Korea',
  'Asia/Tokyo': '도쿄 일본 東京 Japan',
  'Asia/Shanghai': '상하이 중국 上海 China Beijing 베이징',
  'Asia/Taipei': '타이베이 대만 台北 Taiwan',
  'Asia/Hong_Kong': '홍콩 香港',
  'Asia/Singapore': '싱가포르 Singapore',
  'Asia/Bangkok': '방콕 태국 Thailand',
  'Asia/Ho_Chi_Minh': '호치민 베트남 Vietnam',
  'Asia/Kolkata': '콜카타 인도 India',
  'Asia/Dubai': '두바이',
  'America/New_York': '뉴욕 미국 USA',
  'America/Los_Angeles': '로스앤젤레스 미국 USA',
  'America/Chicago': '시카고 미국 USA',
  'America/Toronto': '토론토 캐나다 Canada',
  'America/Vancouver': '밴쿠버 캐나다 Canada',
  'America/Sao_Paulo': '상파울루 브라질 Brazil',
  'Europe/London': '런던 영국 UK',
  'Europe/Paris': '파리 프랑스 France',
  'Europe/Berlin': '베를린 독일 Germany',
  'Australia/Sydney': '시드니 호주 Australia',
}

function normalize (value: string): string {
  return value.normalize('NFKD').replace(/\p{M}/gu, '').replace(/[_/-]+/g, ' ').toLowerCase().replace(/\s+/g, ' ').trim()
}

function zoneName (zone: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { timeZone: zone, timeZoneName: 'longGeneric' }).formatToParts(new Date()).find(part => part.type === 'timeZoneName')?.value ?? zone
}

const names = new Map<string, { description: string, search: string }>()
export function getTimeZoneOptions (current: string, locale: Locale): TimeZoneOption[] {
  return getTimeZones(current).map((zone) => {
    const key = `${locale}/${zone}`
    let entry = names.get(key)
    if (!entry) {
      const description = zoneName(zone, intlLocale(locale))
      entry = { description, search: normalize(`${zone} ${description} ${zoneName(zone, 'en')} ${cityAliases[zone] ?? ''}`) }
      names.set(key, entry)
    }
    return { zone, label: zone.replaceAll('_', ' '), ...entry }
  })
}

export function searchTimeZones (options: TimeZoneOption[], query: string, current: string): TimeZoneOption[] {
  const terms = normalize(query).split(' ').filter(Boolean)
  const matches = options.filter(option => terms.every(term => option.search.includes(term)))
  if (!terms.length) return [...matches.filter(option => option.zone === current), ...matches.filter(option => option.zone !== current)]
  // A region/city identifier match is more useful than an incidental match in
  // a descriptive name (for example, Cairo also uses Eastern European Time).
  const directMatch = (option: TimeZoneOption) => terms.every(term => normalize(option.label).includes(term))
  return [...matches.filter(directMatch), ...matches.filter(option => !directMatch(option))]
}
