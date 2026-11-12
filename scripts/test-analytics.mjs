import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import vm from 'node:vm'

const require = createRequire(import.meta.url)
const { buildSync } = createRequire(createRequire(require.resolve('astro')).resolve('vite'))('esbuild')
const bundle = buildSync({
  entryPoints: ['src/utils/analytics.ts'], bundle: true, write: false, format: 'iife', globalName: 'analytics',
}).outputFiles[0].text
const meetingBundle = buildSync({
  entryPoints: ['src/utils/meetingAnalytics.ts'], bundle: true, write: false, format: 'iife', globalName: 'meetingAnalytics',
}).outputFiles[0].text

function browser (href = 'https://time2gather.org/ko/', preferences = {}) {
  const storage = new Map(Object.entries(preferences))
  const listeners = new Map()
  const scripts = []
  const window = {
    location: new URL(href), navigator: { webdriver: false },
    localStorage: { getItem: key => storage.get(key) ?? null },
  }
  const document = {
    title: 'Private meeting title and name', referrer: 'https://example.com/private-email@example.com?token=private',
    documentElement: { lang: 'ko' },
    head: { appendChild: script => scripts.push(script) }, createElement: () => ({}),
    addEventListener: (event, callback) => listeners.set(event, [...(listeners.get(event) ?? []), callback]),
  }
  const context = vm.createContext({ window, document, URL, URLSearchParams, console })
  vm.runInContext(bundle + '\n' + meetingBundle, context)
  return {
    ...context, scripts, storage,
    commands: () => Array.from(window.dataLayer ?? [], command => Array.from(command)),
    events: name => Array.from(window.dataLayer ?? [], command => Array.from(command))
      .filter(command => command[0] === 'event' && (!name || command[1] === name)),
    visit: href => {
      window.location = new URL(href)
      for (const listener of listeners.get('astro:page-load') ?? []) listener()
    },
  }
}

const env = browser()
env.analytics.initializeAnalytics()
env.analytics.initializeAnalytics()
assert.equal(env.scripts.length, 1)
assert.equal(env.events('page_view').length, 1, 'initialization and Astro page-load cannot double count')
assert.equal(env.events('page_view')[0][2].page_referrer, 'https://example.com/')
assert.equal(env.commands().find(command => command[0] === 'config')[2].send_page_view, false)

env.visit('https://time2gather.org/meetings/create?title=secret&hostName=private#private')
env.visit('https://time2gather.org/meetings/create?step=title&title=secret')
env.visit('https://time2gather.org/meetings/create?step=dates&title=secret')
assert.equal(env.events('meeting_create_started').length, 1, 'wizard steps are one creation attempt')
env.analytics.trackAnalyticsEvent('meeting_created', {
  selection_type: 'ALL_DAY', actor_role: 'host', location_vote_enabled: true,
  title: 'secret', username: 'private', meeting_code: 'private-code',
})
env.visit('https://time2gather.org/meetings/private-code?lang=ar&title=secret#comment-private')
assert.equal(env.events('page_view').at(-1)[2].page_location, 'https://time2gather.org/meetings/_meeting')
env.document.documentElement.lang = 'ar'
env.analytics.trackAnalyticsEvent('meeting_share_action', { share_method: 'clipboard', actor_role: 'participant' })
assert.equal(env.events('meeting_share_action').at(-1)[2].ui_language, 'ar')
assert.ok(!JSON.stringify(env.commands()).match(/secret|private|comment-private/), 'no input text, meeting code, hash or raw referrer')

const fixture = {
  meeting: { host: { id: 1 }, selectionType: 'TIME' },
  schedule: {}, participants: [], locationVote: null,
}
env.meetingAnalytics.trackMeetingResponseSaved(fixture, 2, true, false)
assert.equal(env.events('meeting_response_saved').at(-1)[2].response_action, 'first')
assert.equal(env.events('meeting_response_saved').at(-1)[2].response_type, 'unavailable')
env.meetingAnalytics.trackMeetingResponseSaved(fixture, 2, false, true)
assert.equal(env.events('meeting_response_saved').at(-1)[2].response_action, 'update')
fixture.participants = [{ userId: 2, availabilityResponse: 'NEEDS_RESPONSE' }]
env.meetingAnalytics.trackMeetingResponseSaved(fixture, 2, true, false)
assert.equal(env.events('meeting_response_saved').at(-1)[2].response_action, 'update')
fixture.participants = []
fixture.schedule = { date: { time: { participants: [{ userId: 2 }] } } }
env.meetingAnalytics.trackMeetingResponseSaved(fixture, 2, false, false)
assert.equal(env.events('meeting_response_saved').at(-1)[2].response_action, 'update')
env.meetingAnalytics.trackMeetingResponseSaved(fixture, 1, false, false)
assert.equal(env.events('meeting_response_saved').at(-1)[2].actor_role, 'host')

const before = env.events().length
env.visit('https://time2gather.org/admin')
env.analytics.trackAnalyticsEvent('meeting_created')
assert.equal(env.events().length, before)
assert.equal(env.window['ga-disable-G-RXQ2QH23CQ'], true)
env.visit('https://time2gather.org/en/')
assert.equal(env.window['ga-disable-G-RXQ2QH23CQ'], false)
env.storage.set('time2gather:analytics-disabled', '1')
const disabledCount = env.events().length
env.analytics.trackAnalyticsEvent('meeting_created')
assert.equal(env.events().length, disabledCount)

for (const href of ['http://localhost:3000/ko/', 'https://preview.run.app/ko/', 'https://time2gather.org/admin']) {
  const preview = browser(href)
  preview.analytics.initializeAnalytics()
  preview.analytics.trackAnalyticsEvent('meeting_created')
  assert.equal(preview.scripts.length, 0, href)
  assert.equal(preview.events().length, 0, href)
}
const automated = browser()
automated.window.navigator.webdriver = true
automated.analytics.initializeAnalytics()
assert.equal(automated.events().length, 0)
automated.storage.set('time2gather:analytics-debug', '1')
automated.analytics.initializeAnalytics()
assert.equal(automated.events('page_view')[0][2].debug_mode, true)

const campaign = browser('https://time2gather.org/en/?utm_source=community&utm_medium=referral&utm_campaign=study_2026&title=secret')
campaign.analytics.initializeAnalytics()
const config = campaign.commands().find(command => command[0] === 'config')[2]
assert.equal(config.campaign_source, 'community')
assert.equal(config.campaign_name, 'study_2026')
assert.equal(config.page_location, 'https://time2gather.org/en/')

// Missing storage, blocked gtag and SSR must never throw into a product action.
const blocked = browser()
blocked.window.localStorage.getItem = () => { throw new Error('storage blocked') }
blocked.window.gtag = () => { throw new Error('tag blocked') }
assert.doesNotThrow(() => blocked.analytics.trackAnalyticsEvent('meeting_confirmed'))
const ssr = vm.createContext({ URL, URLSearchParams })
vm.runInContext(bundle, ssr)
assert.doesNotThrow(() => ssr.analytics.initializeAnalytics())
assert.doesNotThrow(() => ssr.analytics.trackAnalyticsEvent('meeting_created'))
console.log('Analytics passed: sanitized payloads, SPA deduplication, wizard attempts, response edits, unavailable responses, role/language, campaign attribution, admin/preview/automation exclusion, opt-out, blocked storage/tag and SSR.')
