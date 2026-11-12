import assert from 'node:assert/strict'
import { runInNewContext } from 'node:vm'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { transformSync } = createRequire(createRequire(require.resolve('astro')).resolve('vite'))('esbuild')
const cache = new Map()
function load (file) {
  file = path.resolve(file)
  if (cache.has(file)) return cache.get(file)
  if (file.endsWith('.json')) return JSON.parse(fs.readFileSync(file, 'utf8'))
  let source = fs.readFileSync(file, 'utf8').replaceAll('import.meta.env.SSR', 'true')
  source = source.replace(/import\.meta\.glob\('\.\/locales\/\*\.json', \{ eager: true, import: 'default' \}\)/g,
    () => `({${fs.readdirSync(path.join(path.dirname(file), 'locales')).filter(name => name.endsWith('.json')).map(name => `${JSON.stringify(`./locales/${name}`)}:require(${JSON.stringify(`./locales/${name}`)})`).join(',')}})`)
  const mod = { exports: {} }
  const localRequire = name => name.startsWith('.') ? load(path.resolve(path.dirname(file), /\.(ts|json)$/.test(name) ? name : `${name}.ts`)) : require(name)
  new Function('require', 'module', 'exports', transformSync(source, { loader: 'ts', format: 'cjs' }).code)(localRequire, mod, mod.exports)
  cache.set(file, mod.exports)
  return mod.exports
}
const config = load('src/i18n/config.ts')
const i18n = load('src/i18n/index.ts')
const time = load('src/utils/time.ts')
const zone = load('src/utils/timezone.ts')
// The browser receives only its selected catalog, and reads a fresh bootstrap
// element after Astro navigation instead of retaining another language's text.
const clientModule = { exports: {} }
let bootstrap = {
  textContent: fs.readFileSync('src/i18n/locales/ja.json', 'utf8'),
  getAttribute: () => 'ja',
}
const clientSource = fs.readFileSync('src/i18n/index.ts', 'utf8').replaceAll('import.meta.env.SSR', 'false')
new Function('require', 'module', 'exports', 'document', transformSync(clientSource, { loader: 'ts', format: 'cjs', logLevel: 'silent' }).code)(
  name => load(`src/i18n/${name.endsWith('.json') ? name : `${name}.ts`}`),
  clientModule, clientModule.exports, { getElementById: () => bootstrap },
)
assert.equal(clientModule.exports.getTranslations('ja')('common.close'), '閉じる')
bootstrap = { textContent: fs.readFileSync('src/i18n/locales/ko.json', 'utf8'), getAttribute: () => 'ko' }
assert.equal(clientModule.exports.getTranslations('ko')('common.close'), '닫기')
assert.equal(config.supportedLocales.length, 22)
assert.equal(config.negotiateLocale('ko;q=0,en;q=1'), 'en')
assert.equal(config.negotiateLocale('ko;q=0.1,ja;q=0.9'), 'ja')
assert.equal(config.negotiateLocale('xx,fr-CA;q=0.8'), 'fr')
assert.equal(config.negotiateLocale('xx'), 'en')
assert.equal(config.normalizeLocale('zh-Hans-SG'), 'zh-CN')
assert.equal(config.normalizeLocale('AR-eg'), 'ar-EG')
assert.equal(config.normalizeLocale('ur-PK'), 'ur')
assert.equal(i18n.getLocaleFromAstroRequest({ get: () => ({ value: 'ja' }) }, new Headers({ 'accept-language': 'en' })), 'ja')
assert.equal(i18n.getLocaleFromAstroRequest({ get: () => ({ value: 'en' }) }, undefined, 'ko'), 'ko')
assert.equal(i18n.getTranslations('en')('meeting.dateParticipants.count', { count: 1 }), '1 person')
assert.equal(i18n.getTranslations('en')('meeting.dateParticipants.count', { count: 2 }), '2 people')
assert.equal(i18n.getTranslations('en')('meeting.participantsCount', { count: 0 }), 'Participants: 0')
for (const locale of config.supportedLocales) {
  assert.ok(i18n.getTranslations(locale)('common.createMeeting').trim())
  assert.ok(!i18n.getTranslations(locale)('meeting.dateParticipants.count', { count: 1 }).includes('{'))
  assert.ok(time.formatDate('2026-01-01', locale).trim())
  assert.ok(time.formatWeekday(0, locale).trim())
}
assert.equal(time.getWeekStart('en'), 0)
assert.equal(time.getWeekStart('de'), 1)
assert.equal(time.getWeekStart('ar-EG'), 6)
assert.equal(time.convertTo24Hour('12:00', 'AM'), '00:00')
assert.equal(time.convertTo24Hour('12:00', 'PM'), '12:00')
assert.equal(time.convertTo24Hour('01:30', 'PM'), '13:30')
assert.equal(time.timeSlots12[0], '12:00')
for (const hour of time.timeSlots24) {
  const result = time.convertTo12Hour(hour)
  assert.equal(time.convertTo24Hour(result.time, result.amPm), hour)
}
assert.equal(new Date(zone.inspectWallTime('2026-01-01', '00:15', 'Asia/Kathmandu').instant).toISOString(), '2025-12-31T18:30:00.000Z')
assert.equal(new Date(zone.inspectWallTime('2026-01-15', '12:00', 'America/New_York').instant).toISOString(), '2026-01-15T17:00:00.000Z')
assert.equal(new Date(zone.inspectWallTime('2026-07-15', '12:00', 'America/New_York').instant).toISOString(), '2026-07-15T16:00:00.000Z')
assert.equal(zone.inspectWallTime('2026-03-08', '02:30', 'America/New_York').status, 'gap')
assert.equal(zone.inspectWallTime('2026-11-01', '01:30', 'America/New_York').status, 'overlap')
assert.equal(zone.inspectWallTime('2026-10-04', '02:15', 'Australia/Lord_Howe').status, 'gap')
assert.equal(zone.inspectWallTime('2026-04-05', '01:45', 'Australia/Lord_Howe').status, 'overlap')
assert.equal(zone.inspectWallTime('2026-01-01', '24:00', 'UTC').status, 'invalid')
assert.equal(zone.inspectWallTime('2026-02-30', '12:00', 'UTC').status, 'invalid')
assert.equal(zone.inspectWallTime('2026-01-01', '12:00', 'Invalid/Zone').status, 'invalid')
assert.match(zone.formatZonedDateTime('2026-01-01', '00:15', 'Asia/Kathmandu', 'America/Los_Angeles', 'en'), /Dec 31, 2025/)
assert.equal(config.withLocale('/meetings/create?step=title&title=a%26b', 'ja'), '/meetings/create?step=title&title=a%26b&lang=ja')
assert.equal(config.withLocale('/my?lang=en', 'ar'), '/my?lang=ar')
assert.equal(config.withLocale('/api/v1/meetings/code/export', 'ja'), '/api/v1/meetings/code/export')
assert.equal(config.withLocale('https://example.org/path', 'ja'), 'https://example.org/path')
assert.equal(config.withLocale('/ja/', 'ja'), '/ja/')
const selection = load('src/utils/meetingSelection.ts')
assert.equal(selection.getConfirmedAvailabilityTime({ selectionType: 'TIME', confirmedSlotIndex: 0, intervalMinutes: 60, confirmedTime: '00:15' }), '00:00')
assert.equal(selection.getConfirmedAvailabilityTime({ selectionType: 'TIME', confirmedSlotIndex: 18, intervalMinutes: 30, confirmedTime: '09:15' }), '09:00')
assert.equal(selection.getConfirmedAvailabilityTime({ selectionType: 'ALL_DAY', confirmedTime: '09:15' }), 'ALL_DAY')
console.log('Globalization tests passed: negotiation, saved/URL preferences, 22 locales, plural forms, 24-hour round trips, date boundaries, fractional offsets and DST gaps/overlaps')

// Autocomplete must match city/region names immediately and never keep an
// unrelated selected zone in a filtered result or fabricate a zone from input.
const zoneSearch = load('src/utils/timezoneSearch.ts')
const zoneOptions = zoneSearch.getTimeZoneOptions('Asia/Seoul', 'ko')
for (const query of ['seoul', '서울', '한국', 'korea', 'Asia/Seoul']) {
  assert.ok(zoneSearch.searchTimeZones(zoneOptions, query, 'Asia/Seoul').some(option => option.zone === 'Asia/Seoul'), query)
}
assert.ok(zoneSearch.searchTimeZones(zoneOptions, 'new_york', 'Asia/Seoul').some(option => option.zone === 'America/New_York'))
assert.ok(!zoneSearch.searchTimeZones(zoneOptions, 'new york', 'Asia/Seoul').some(option => option.zone === 'Asia/Seoul'))
assert.ok(zoneSearch.searchTimeZones(zoneOptions, 'sao paulo', 'Asia/Seoul').some(option => option.zone === 'America/Sao_Paulo'))
assert.deepEqual(zoneSearch.searchTimeZones(zoneOptions, 'not-a-real-city-123', 'Asia/Seoul'), [])
assert.equal(zoneSearch.searchTimeZones(zoneOptions, '', 'Asia/Seoul')[0].zone, 'Asia/Seoul')
assert.ok(zoneSearch.searchTimeZones(zoneOptions, 'Europe', 'Asia/Seoul')[0].zone.startsWith('Europe/'))
console.log('Time zone autocomplete search passed: native/English names, separators, accents, empty/no results')

const crossDateMoment = zone.formatZonedMoment('2026-11-02', '11:00', 'America/New_York', 'Asia/Seoul', 'en')
assert.match(crossDateMoment.date, /Nov 3, 2026/)
assert.match(crossDateMoment.time, /1:00 AM/)
assert.ok(zone.formatZonedMoment('2026-11-02', '09:00', 'America/New_York', 'Asia/Seoul', 'ko').date.includes('11월 2일'))
// A missing browser locale must fall back explicitly, rather than render in
// whatever language happens to be set on the user's device.
const originalSupportedLocales = Intl.DateTimeFormat.supportedLocalesOf
Intl.DateTimeFormat.supportedLocalesOf = locales => locales === 'ha' ? [] : originalSupportedLocales(locales)
assert.equal(config.intlLocale('ha'), 'en')
Intl.DateTimeFormat.supportedLocalesOf = originalSupportedLocales
console.log('Semantic date/time wrapping units and explicit Intl fallback passed')

const { projectResultTimeZone } = load('src/utils/resultTimeZone.ts')
const slot = { count: 1, participants: [{ userId: 7, username: 'Test', profileImageUrl: '' }] }
const resultFixture = {
  meeting: { timezone: 'Africa/Abidjan', availableDates: { '2026-11-03': ['08:00', '14:00', '17:00'] } },
  schedule: { '2026-11-03': { '08:00': slot, '14:00': slot, '17:00': slot } },
  summary: { bestSlots: [{ date: '2026-11-03', time: '08:00 ~ 17:00', count: 1 }] },
}
const originalFixture = JSON.stringify(resultFixture)
const seoulResult = projectResultTimeZone(resultFixture, 'Asia/Seoul')
assert.deepEqual(seoulResult.availableDates, { '2026-11-03': ['17:00', '23:00'], '2026-11-04': ['02:00'] })
assert.equal(seoulResult.schedule['2026-11-04']['02:00'], slot)
assert.equal(seoulResult.bestSlots[0].time, '17:00 ~ 02:00')
assert.equal(seoulResult.bestSlots[0].endDate, '2026-11-04')
const parisResult = projectResultTimeZone(resultFixture, 'Europe/Paris')
assert.deepEqual(parisResult.availableDates['2026-11-03'], ['09:00', '15:00', '18:00'])
assert.equal(parisResult.bestSlots[0].endDate, '2026-11-03')
const fractionalResult = projectResultTimeZone(resultFixture, 'Asia/Kathmandu')
assert.deepEqual(fractionalResult.availableDates['2026-11-03'], ['13:45', '19:45', '22:45'])
assert.deepEqual(projectResultTimeZone(resultFixture, 'Asia/Kolkata').availableDates['2026-11-03'], ['13:30', '19:30', '22:30'])
assert.equal(JSON.stringify(resultFixture), originalFixture)
const dstFixture = {
  meeting: { timezone: 'UTC', availableDates: { '2026-11-01': ['05:00', '06:00'] } },
  schedule: { '2026-11-01': { '05:00': slot, '06:00': slot } },
  summary: { bestSlots: [] },
}
assert.equal(projectResultTimeZone(dstFixture, 'America/New_York'), undefined)
const dayShiftFixture = {
  meeting: { timezone: 'Asia/Seoul', availableDates: { '2026-11-03': ['02:00'] } },
  schedule: { '2026-11-03': { '02:00': slot } },
  summary: { bestSlots: [{ date: '2026-11-03', time: '02:00', count: 1 }] },
}
const previousDay = projectResultTimeZone(dayShiftFixture, 'America/Los_Angeles')
assert.deepEqual(previousDay.availableDates, { '2026-11-02': ['09:00'] })
assert.equal(previousDay.bestSlots[0].date, '2026-11-02')
console.log('Result projection passed: calendar axes, date rollover, range boundaries, fractional offsets, DST collisions, unchanged source data and participant identity')

const fonts = load('src/i18n/fonts.ts')
assert.deepEqual(Object.keys(fonts.localeTypography).sort(), [...config.supportedLocales].sort())
for (const locale of config.supportedLocales) {
  const stylesheet = new URL(fonts.getFontStylesheetURL(locale))
  const families = stylesheet.searchParams.getAll('family')
  assert.equal(stylesheet.origin, 'https://fonts.googleapis.com')
  assert.equal(stylesheet.searchParams.get('display'), 'swap')
  assert.ok(families.some(family => family.startsWith(`${fonts.localeTypography[locale].family}:`)), locale)
  assert.equal(new Set(families).size, families.length)
}
assert.equal(fonts.localeTypography.ur.family, 'Noto Sans Arabic')
assert.ok(fonts.localeTypography.ur.lineHeight >= 1.6)
assert.notEqual(fonts.localeTypography.ja.family, fonts.localeTypography['zh-CN'].family)
assert.ok(fonts.getTypographyCSS().includes('html[lang="ar-EG"]'))
assert.ok(!fonts.getFontStylesheetURL('en').includes('Noto'))
assert.ok(!fonts.getFontStylesheetURL('ja').includes('Noto+Sans+KR'))
console.log('Typography passed: all 22 locales covered, locale-only stylesheets, explicit CJK families and consistent Urdu typography')

// Language redirects must not discard campaign attribution before analytics loads.
const marketing = load('src/marketing/config.ts')
for (const page of marketing.marketingPages) {
  assert.equal(marketing.marketingRedirectPath('ko', page, new URLSearchParams('lang=ko'), false), page === 'home' ? '/ko/' : `/ko/${page}/`)
  const params = new URLSearchParams('utm_source=chatgpt.com&utm_medium=referral&utm_campaign=group%26friends&gclid=a%2Bb&lang=fr&autoLocale=old')
  const redirect = new URL(marketing.marketingRedirectPath('fr', page, params, true), 'https://time2gather.org')
  assert.equal(redirect.pathname, marketing.localizedPath('fr', page))
  assert.equal(redirect.searchParams.get('utm_source'), 'chatgpt.com')
  assert.equal(redirect.searchParams.get('utm_medium'), 'referral')
  assert.equal(redirect.searchParams.get('utm_campaign'), 'group&friends')
  assert.equal(redirect.searchParams.get('gclid'), 'a+b')
  assert.equal(redirect.searchParams.get('autoLocale'), '1')
  assert.equal(redirect.searchParams.has('lang'), false)
  assert.equal(params.get('lang'), 'fr')
}
assert.equal(marketing.marketingRedirectPath('en', 'home', new URLSearchParams('lang=en'), false), '/en/')
assert.equal(marketing.marketingRedirectPath('en', 'home', new URLSearchParams(), true), '/en/?autoLocale=1')
const localeScript = fs.readFileSync('src/components/LocaleBootstrap.astro', 'utf8')
  .match(/<script is:inline define:vars=\{\{ resolvedLocale: locale, localePaths, meetingInvitation, supportedLocales \}\}>([\s\S]*?)<\/script>/)[1]
for (const saved of ['ja', 'ko', null]) {
  let destination
  let cleaned
  runInNewContext(localeScript, {
    URL,
    resolvedLocale: 'en',
    supportedLocales: config.supportedLocales, meetingInvitation: false, navigator: { languages: ['ar-EG'] },
    localePaths: Object.fromEntries(marketing.marketingLocales.map(locale => [locale, marketing.localizedPath(locale)])),
    location: { href: 'https://time2gather.org/en/?utm_source=chatgpt.com&utm_campaign=a%26b&autoLocale=1#faq', protocol: 'https:', replace: (url) => { destination = new URL(url) } },
    localStorage: { getItem: () => saved, setItem: () => {} },
    document: {},
    history: { state: null, replaceState: (_state, _title, url) => { cleaned = new URL(url) } },
  })
  const result = destination || cleaned
  assert.equal(result.pathname, saved ? `/${saved}/` : '/ar-EG/')
  assert.equal(result.searchParams.get('utm_source'), 'chatgpt.com')
  assert.equal(result.searchParams.get('utm_campaign'), 'a&b')
  assert.equal(result.searchParams.has('autoLocale'), false)
  assert.equal(result.hash, '#faq')
}
const { marketingCopy } = load('src/marketing/copy.ts')
for (const locale of config.supportedLocales) {
  assert.equal(marketingCopy[locale].faqs.length, 8, locale)
  for (const answer of marketingCopy[locale].faqs) {
    assert.ok(answer.title.trim() && answer.body.trim(), locale)
  }
  assert.ok(marketingCopy[locale].faqs[7].body.includes('ICS'), locale)
}
console.log('Marketing regressions passed: attribution survives server/browser language redirects; eight FAQs across all 22 locales')

// Voting projections must round-trip source keys after a date rollover, sparse
// dates, fractional offsets, and range selection across empty display cells.
const votingZone = load('src/utils/votingTimeZone.ts')
const votingSource = { '2026-10-27': ['00:00', '00:30'], '2026-10-28': ['09:00'] }
const votingSnapshot = JSON.stringify(votingSource)
const votingProjection = votingZone.projectVotingTimeZone(votingSource, 'Asia/Seoul', 'America/Los_Angeles')
assert.ok(votingProjection)
assert.deepEqual(votingProjection.dates, ['2026-10-26', '2026-10-27'])
assert.deepEqual(votingProjection.toSource(votingProjection.toDisplay(votingSource)), votingSource)
assert.deepEqual(votingProjection.toSource({ '2026-10-26': ['08:00', '08:30', '17:00'], '2026-10-27': ['17:00'] }), votingSource)
assert.equal(JSON.stringify(votingSource), votingSnapshot)
const fractionalVoting = votingZone.projectVotingTimeZone({ '2026-10-27': ['00:00', '00:30'] }, 'Asia/Seoul', 'Asia/Kathmandu')
assert.deepEqual(fractionalVoting.availableTimes, ['20:45', '21:15'])
assert.deepEqual(fractionalVoting.toSource({ '2026-10-26': ['21:15'] }), { '2026-10-27': ['00:30'] })
assert.equal(votingZone.projectVotingTimeZone({ '2026-11-01': ['05:30', '06:30'] }, 'UTC', 'America/New_York'), undefined)
assert.deepEqual(votingZone.projectVotingTimeZone(votingSource, 'Asia/Seoul', 'Asia/Seoul').toDisplay(votingSource), votingSource)
console.log('Voting projection passed: midnight rollover, sparse cells, fractional offsets, DST collisions and original save keys')

const { buildConfirmationSlots } = load('src/utils/confirmationSlots.ts')
const registeredDates = Object.fromEntries(Array.from({ length: 8 }, (_, i) => [`2026-11-${String(i + 5).padStart(2, '0')}`, ['10:00', '11:00', '11:00', '12:00']]))
const allChoices = buildConfirmationSlots(registeredDates, { '2026-11-05': { '10:00': { count: 4 }, '11:00': { count: 1 } } }, 4, 'TIME')
assert.equal(allChoices.length, 24, 'every registered option is included, without duplicate times or a five-option limit')
assert.deepEqual(allChoices.slice(0, 2).map(s => [s.time, s.count, s.percentage]), [['10:00', 4, '100%'], ['11:00', 1, '25%']])
assert.equal(allChoices.at(-1).date, '2026-11-12', 'zero-vote dates remain selectable')
assert.equal(allChoices.at(-1).percentage, '0%')
assert.equal(buildConfirmationSlots({ '2026-11-15': ['21:00', '21:30', '23:30'] }, {}, 0, 'TIME', 30).map(s => s.startSlotIndex).join(','), '42,43,47')
assert.equal(buildConfirmationSlots({ '2026-11-15': ['21:30', '24:00', '12:99', 'bad'] }, {}, 0, 'TIME', 60).length, 0)
const allDays = buildConfirmationSlots(Object.fromEntries(Object.keys(registeredDates).map(date => [date, []])), { '2026-11-05': { ALL_DAY: { count: 2 } } }, 4, 'ALL_DAY')
assert.equal(allDays.length, 8)
assert.equal(allDays[0].percentage, '50%')
assert(allDays.every(s => s.time === 'ALL_DAY' && s.startSlotIndex === -1))
assert.equal(buildConfirmationSlots({}, {}, 0, 'TIME').length, 0)
console.log('All registered confirmation options: >5 dates, non-winning/zero-vote choices, duplicates, 30/60-minute indices and all-day passed')

const { groupConfirmationSlots } = load('src/utils/confirmationSlots.ts')
const manyDates = Object.fromEntries(Array.from({ length: 31 }, (_, day) => [new Date(Date.UTC(2026, 10, day + 1)).toISOString().slice(0, 10), Array.from({ length: 48 }, (_, slot) => `${String(Math.floor(slot / 2)).padStart(2, '0')}:${slot % 2 ? '30' : '00'}`)]))
const groupedMany = groupConfirmationSlots(buildConfirmationSlots(manyDates, {}, 0, 'TIME', 30), 'Asia/Seoul', 'Asia/Seoul')
assert.equal(groupedMany.groups.length, 31)
assert(groupedMany.groups.every(group => group.slots.length === 48))
assert.equal(groupedMany.groups.flatMap(group => group.slots).length, 1488)
const crossingChoices = buildConfirmationSlots({ '2026-11-07': ['00:00', '09:00'] }, {}, 0, 'TIME', 30)
const crossingGroups = groupConfirmationSlots(crossingChoices, 'Asia/Seoul', 'UTC')
assert.deepEqual(crossingGroups.groups.map(group => group.date), ['2026-11-06', '2026-11-07'])
assert.equal(crossingGroups.groups[0].slots[0].displayTime, '15:00')
assert.equal(crossingGroups.groups[0].slots[0].date, '2026-11-07')
assert.equal(crossingGroups.groups[0].slots[0].startSlotIndex, 0)
const repeatedHour = groupConfirmationSlots(buildConfirmationSlots({ '2026-11-01': ['05:30', '06:30'] }, {}, 0, 'TIME', 30), 'UTC', 'America/New_York')
assert.equal(repeatedHour.timezone, 'UTC')
assert.equal(repeatedHour.groups[0].slots.length, 2)
const groupedAllDays = groupConfirmationSlots(allDays, 'Asia/Seoul', 'America/Los_Angeles')
assert.deepEqual(groupedAllDays.groups.map(group => group.date), Object.keys(registeredDates))
console.log('Grouped confirmation: 1488 options retained, 31 dates, displayed-zone midnight, source write identity, DST fallback and all-day passed')

// A long day with many votes must not outrank a date with more people available
// simultaneously. Keep the hours chronological inside each ranked date.
const rankedChoices = buildConfirmationSlots({
  '2026-11-05': ['10:00', '11:00', '12:00'],
  '2026-11-06': ['10:00', '11:00'],
  '2026-11-07': ['10:00', '11:00'],
  '2026-11-08': ['10:00'],
}, {
  '2026-11-05': { '10:00': { count: 6 }, '11:00': { count: 6 }, '12:00': { count: 6 } },
  '2026-11-06': { '10:00': { count: 1 }, '11:00': { count: 8 } },
  '2026-11-07': { '10:00': { count: 2 }, '11:00': { count: 8 } },
}, 10, 'TIME')
const rankedGroups = groupConfirmationSlots(rankedChoices, 'Asia/Seoul', 'Asia/Seoul').groups
assert.deepEqual(rankedGroups.map(g => [g.date, g.maxCount]), [['2026-11-06', 8], ['2026-11-07', 8], ['2026-11-05', 6], ['2026-11-08', 0]])
assert.deepEqual(rankedGroups[0].slots.map(s => s.time), ['10:00', '11:00'])
const rankedAllDay = groupConfirmationSlots(buildConfirmationSlots({ '2026-11-05': [], '2026-11-06': [] }, { '2026-11-06': { ALL_DAY: { count: 3 } } }, 4, 'ALL_DAY'), 'UTC', 'Asia/Seoul')
assert.deepEqual(rankedAllDay.groups.map(g => g.date), ['2026-11-06', '2026-11-05'])
const movedRank = groupConfirmationSlots(rankedChoices.map(slot => slot.date === '2026-11-08' ? { ...slot, count: 10 } : slot), 'Asia/Seoul', 'Asia/Seoul')
assert.equal(movedRank.groups[0].date, '2026-11-08')
assert.equal(movedRank.groups.flatMap(g => g.slots).find(s => `${s.date}/${s.time}` === '2026-11-06/11:00').startSlotIndex, 11)
console.log('Confirmation date rank: peak concurrent attendance, date tie-break, chronological times, zero-vote dates, all-day and stable source keys passed')

const { recommendConfirmationSlots } = load('src/utils/confirmationSlots.ts')
assert.deepEqual(recommendConfirmationSlots(rankedGroups).map(s => [s.date, s.time]), [['2026-11-06', '11:00'], ['2026-11-07', '11:00'], ['2026-11-05', '10:00']])
assert.equal(recommendConfirmationSlots(groupedMany.groups).length, 0, 'zero votes use all dates directly')
assert.equal(recommendConfirmationSlots([]).length, 0)
assert.equal(recommendConfirmationSlots(rankedAllDay.groups)[0].time, 'ALL_DAY')
assert.equal(recommendConfirmationSlots(movedRank.groups).length, 3, 'recommendations are bounded; complete choices are unchanged')
assert.equal(movedRank.groups.flatMap(g => g.slots).length, 8)
const zonedRecommendation = recommendConfirmationSlots(groupConfirmationSlots(crossingChoices.map(s => ({ ...s, count: 1 })), 'Asia/Seoul', 'UTC').groups)
assert.deepEqual(zonedRecommendation.map(s => [s.displayDate, s.date, s.startSlotIndex]), [['2026-11-06', '2026-11-07', 0], ['2026-11-07', '2026-11-07', 18]])
console.log('Recommendations passed: distinct displayed dates, exact best times, tie order, zero votes, all-day, limit and source identity')
