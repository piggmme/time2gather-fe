import assert from 'node:assert/strict'
import fs from 'node:fs'
import { runInNewContext } from 'node:vm'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { transformSync } = createRequire(createRequire(require.resolve('astro')).resolve('vite'))('esbuild')
const cache = new Map()
function load (file) {
  file = path.resolve(file)
  if (cache.has(file)) return cache.get(file)
  if (file.endsWith('.svg?raw')) return fs.readFileSync(file.slice(0, -4), 'utf8')
  if (file.endsWith('.json')) return JSON.parse(fs.readFileSync(file, 'utf8'))
  let source = fs.readFileSync(file, 'utf8').replaceAll('import.meta.env.SSR', 'true')
  source = source.replace(/import\.meta\.glob\('\.\/locales\/\*\.json', \{ eager: true, import: 'default' \}\)/g,
    () => `({${fs.readdirSync(path.join(path.dirname(file), 'locales')).filter(name => name.endsWith('.json')).map(name => `${JSON.stringify(`./locales/${name}`)}:require(${JSON.stringify(`./locales/${name}`)})`).join(',')}})`)
  const mod = { exports: {} }
  const localRequire = name => name.startsWith('.') ? load(path.resolve(path.dirname(file), /\.(ts|json|svg\?raw)$/.test(name) ? name : `${name}.ts`)) : require(name)
  new Function('require', 'module', 'exports', transformSync(source, { loader: 'ts', format: 'cjs' }).code)(localRequire, mod, mod.exports)
  cache.set(file, mod.exports)
  return mod.exports
}
const { supportedLocales, openGraphLocales } = load('src/i18n/config.ts')
const { getTranslations } = load('src/i18n/index.ts')
const {
  getCreatorShareLabels, getMeetingShareContent, getShareCopyText, meetingShareUrl, shareOrCopy,
} = load('src/utils/share.ts')
const meeting = {
  code: 'share-test', title: '팀 점심 / Team lunch / غداء الفريق',
  timezone: 'Asia/Seoul', confirmedDate: null, confirmedTime: null,
}
const data = { meeting, locationVote: null }
assert.equal(meetingShareUrl('code/with#chars', 'https://time2gather.org').href, 'https://time2gather.org/meetings/code%2Fwith%23chars')
for (const locale of supportedLocales) {
  const t = getTranslations(locale)
  assert.match(openGraphLocales[locale], /^[a-z]{2,3}_[A-Z]{2}$/)
  for (const confirmed of [false, true]) {
    meeting.confirmedDate = confirmed ? '2026-11-01' : null
    for (const time of [null, '12:30']) {
      meeting.confirmedTime = time
      const content = getMeetingShareContent(data, getCreatorShareLabels(locale, t, meeting.title), 'https://time2gather.org')
      assert.equal(content.url, 'https://time2gather.org/meetings/share-test')
      assert.ok(!content.text.includes('meeting.result.'))
      if (confirmed) {
        assert.ok(content.text.includes(meeting.title), `${locale}: confirmed title must survive targets that ignore title`)
        assert.equal(content.text.includes('Asia/Seoul'), !!time)
        if (!time) assert.ok(!content.text.includes(t('meeting.confirmDialog.allDay')))
      } else {
        assert.equal(content.text, '', `${locale}: unconfirmed meetings share only the URL`)
        assert.equal(content.title, meeting.title)
        assert.equal(content.description, t('meeting.result.kakaoShare.description'))
        assert.equal(getShareCopyText(content), content.url)
      }
    }
  }
  data.locationVote = { enabled: true, confirmedLocation: null }
  const pending = getMeetingShareContent(data, getCreatorShareLabels(locale, t, meeting.title), 'https://time2gather.org')
  assert.ok(pending.text.includes(t('meeting.result.kakaoShare.locationPending')))
  data.locationVote.confirmedLocation = { name: '서울 / Seoul / سيول' }
  assert.ok(getMeetingShareContent(data, getCreatorShareLabels(locale, t, meeting.title), 'https://time2gather.org').text.includes(data.locationVote.confirmedLocation.name))
  data.locationVote = null
  const description = t('meeting.result.share.manualCopyDescription')
  assert.ok(description && !description.startsWith('meeting.'))
}
const content = getMeetingShareContent(data, getCreatorShareLabels('ko', getTranslations('ko'), meeting.title), 'https://time2gather.org')
// Date voting can acquire a specific meeting time after the date is confirmed.
// The original voting mode must not hide that time from any sharing channel.
for (const locale of [...supportedLocales, null]) {
  const labels = locale ? getCreatorShareLabels(locale, getTranslations(locale), meeting.title) : null
  for (const selectionType of ['ALL_DAY', 'TIME']) {
    for (const confirmedTime of [null, 'ALL_DAY', '18:00', '00:00', '18:30:00']) {
      const plan = { ...data, meeting: { ...meeting, selectionType, confirmedDate: '2026-11-15', confirmedTime } }
      const shared = getMeetingShareContent(plan, labels, 'https://time2gather.org')
      const hasTime = !!confirmedTime && confirmedTime !== 'ALL_DAY'
      assert.equal(shared.text.includes('🕐'), hasTime, `${locale}/${selectionType}/${confirmedTime}: confirmed time in message`)
      assert.equal(shared.description.includes('Asia/Seoul'), hasTime, 'Link preview must match the shared schedule')
      assert.equal(getShareCopyText(shared).includes('🕐'), hasTime, 'Copied messages must include the confirmed time')
    }
  }
}
assert.equal(getMeetingShareContent(data, null, 'https://time2gather.org').title, meeting.title)
assert.ok(content.text.includes(getTranslations('ko')('meeting.result.share.confirmedTitle', { title: meeting.title })))
// A recipient's saved choice survives Hosting filtering out the locale cookie.
// Use the legacy URL as a control so an explicit language still wins.
const restoreScript = fs.readFileSync('src/components/LocaleBootstrap.astro', 'utf8')
  .match(/<script is:inline define:vars=\{\{ resolvedLocale: locale, localePaths, meetingInvitation, supportedLocales \}\}>([\s\S]*?)<\/script>/)[1]
for (const [saved,
  explicit,
  expected] of [
    ['ja', false, 'ja'],
    ['ar', false, 'ar'],
    ['en', false, null],
    [null, false, null],
    ['invalid', false, null],
    ['ja', true, null],
  ]) {
  const url = new URL(content.url)
  if (explicit) url.searchParams.set('lang', 'ko')
  url.hash = 'comment-7'
  let replaced
  let cleaned
  runInNewContext(restoreScript, {
    URL, supportedLocales, localePaths: null, navigator: { languages: ['en'] }, meetingInvitation: true, resolvedLocale: explicit ? 'ko' : 'en',
    location: { href: url.href, protocol: url.protocol, replace: (href) => { replaced = new URL(href) } },
    history: { replaceState: (_state, _title, href) => { cleaned = new URL(href) } },
    localStorage: { getItem: () => saved, setItem: () => {} }, document: {},
  })
  assert.equal(replaced?.searchParams.get('lang') ?? null, expected)
  if (replaced) assert.equal(replaced.hash, '#comment-7')
  if (explicit) assert.equal(cleaned.href, content.url + '#comment-7')
}
let copied = ''
const clipboard = {
  writeText: async (text) => {
    copied = text
  },
}
const invitation = getMeetingShareContent({
  ...data, meeting: { ...meeting, confirmedDate: null, confirmedTime: null },
}, getCreatorShareLabels('ko', getTranslations('ko'), meeting.title), 'https://time2gather.org')
assert.equal(await shareOrCopy(invitation, {
  share: async (payload) => { assert.deepEqual(payload, { url: invitation.url }) }, clipboard,
}), 'shared')
assert.equal(copied, '')
assert.equal(await shareOrCopy(invitation, { clipboard }), 'copied')
assert.equal(copied, invitation.url)
assert.equal(await shareOrCopy(invitation, {
  share: async () => { throw new Error('unsupported') }, clipboard,
}), 'copied')
assert.equal(copied, invitation.url)
assert.equal(await shareOrCopy(invitation, {}), 'manual')
assert.equal(getShareCopyText(invitation), invitation.url)
assert.equal(getShareCopyText(content), `${content.text}\n${content.url}`)
copied = ''
const native = {
  share: async function (payload) {
    assert.equal(this, native)
    assert.deepEqual(payload, { title: content.title, text: content.text, url: content.url })
  }, clipboard,
}
assert.equal(await shareOrCopy(content, native), 'shared')
assert.equal(copied, '')
assert.equal(await shareOrCopy(content, {
  share: async () => {
    throw { name: 'AbortError' }
  }, clipboard,
}), 'cancelled')
assert.equal(copied, '')
assert.equal(await shareOrCopy(content, { clipboard }), 'copied')
assert.equal(copied, `${content.text}\n${content.url}`)
copied = ''
assert.equal(await shareOrCopy(content, {
  share: async () => {
    throw new Error('unsupported')
  }, clipboard,
}), 'copied')
assert.equal(copied, `${content.text}\n${content.url}`)
assert.equal(await shareOrCopy(content, {}), 'manual')
assert.equal(await shareOrCopy(content, {
  clipboard: {
    writeText: async () => {
      throw new Error('denied')
    },
  },
}), 'manual')
assert.equal(await shareOrCopy(content, {
  share: async () => {
    throw new Error('blocked')
  },
}), 'manual')
console.log('Share regressions passed: 22 locales, URL-only invitations with preview metadata, confirmed messages, language-neutral URLs, all-day/timed plans, locations, native success/cancel, copy fallback and denied/missing APIs')

const { meetingShareCard } = load('src/utils/meetingShareImage.ts')
const imageMeeting = {
  creatorLocale: 'en', timezone: 'America/New_York', selectionType: 'TIME', confirmedDate: '2026-11-01', confirmedTime: '01:30:00',
}
const card = meetingShareCard(imageMeeting)
assert.ok(card.heading.includes('2026') && card.heading.includes('Nov') && card.heading.includes('1'))
assert.ok(card.detail.includes('1:30'), 'DST dates preserve the recorded local wall time')
assert.equal(card.timezone, 'America/New_York')
assert.deepEqual(meetingShareCard({ ...imageMeeting, selectionType: 'ALL_DAY' }), card, 'Time added after date voting appears in the share image')
const allDayCard = meetingShareCard({ ...imageMeeting, selectionType: 'ALL_DAY', confirmedTime: null })
assert.equal(allDayCard.heading, card.heading)
assert.equal(allDayCard.timezone, '', 'Date-only plans must not suggest a timezone conversion')
assert.equal(allDayCard.detail, '', 'A date-only plan does not imply an all-day event')
assert.equal(meetingShareCard({ ...imageMeeting, creatorLocale: 'ko', confirmedDate: null }).heading, '우리 모두 되는 시간')
assert.equal(meetingShareCard({ ...imageMeeting, creatorLocale: null, confirmedDate: null }).heading, '')
assert.equal(meetingShareCard({ ...imageMeeting, creatorLocale: null }).heading, '2026-11-01')
assert.equal(meetingShareCard({ ...imageMeeting, creatorLocale: 'ar' }).rtl, true)
assert.equal(meetingShareCard({ ...imageMeeting, confirmedDate: '2026-12-31' }).timezone, imageMeeting.timezone)
console.log('Share card content passed: creator locale, legacy, date-only, RTL, stored timezone and DST wall time.')
