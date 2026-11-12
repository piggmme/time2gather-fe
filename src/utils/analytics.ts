import { supportedLocales } from '../i18n/config'

export const analyticsMeasurementId = 'G-RXQ2QH23CQ'
const productionHosts = new Set(['time2gather.org', 'www.time2gather.org'])
const storagePrefix = 'time2gather:analytics-'
const creationSteps = new Set(['meetingType', 'title', 'dates', 'timeRange', 'location'])

type AnalyticsEvent = 'meeting_create_started' | 'meeting_created' | 'meeting_share_action'
  | 'meeting_response_saved' | 'meeting_confirmed'
type Parameters = {
  selection_type?: 'ALL_DAY' | 'TIME'
  actor_role?: 'host' | 'participant'
  response_action?: 'first' | 'update'
  response_type?: 'available' | 'unavailable'
  share_method?: 'native' | 'clipboard'
  meeting_state?: 'voting' | 'confirmed'
  location_vote_enabled?: boolean
}
type Gtag = (...args: unknown[]) => void
type AnalyticsState = {
  configured: boolean
  listening: boolean
  lastPage?: string
  lastReferrer?: string
  creating: boolean
}

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: Gtag
    __time2gatherAnalytics?: AnalyticsState
  }
}

function preference (name: string) {
  try {
    return window.localStorage.getItem(storagePrefix + name) === '1'
  } catch {
    return false
  }
}

export function analyticsEnabled () {
  return typeof window !== 'undefined' && productionHosts.has(window.location.hostname)
    && !window.location.pathname.startsWith('/admin') && !preference('disabled')
    && (!window.navigator.webdriver || preference('debug'))
}

// Never use document.title or raw application paths, query strings or fragments.
// They contain meeting titles, invitation codes, nicknames and comment links.
export function analyticsPage (href: string) {
  const url = new URL(href)
  const parts = url.pathname.split('/').filter(Boolean)
  let path = '/other'
  let title = 'Time2Gather'
  if (parts.length === 0) path = '/'
  else if ((supportedLocales as readonly string[]).includes(parts[0]) && parts.length <= 2
    && (!parts[1] || ['about', 'contact', 'privacy', 'terms'].includes(parts[1]))) {
    path = `/${parts.join('/')}/`
  } else if (['about', 'contact', 'privacy', 'terms', 'my', '404'].includes(parts[0]) && parts.length === 1) {
    path = `/${parts[0]}`
  } else if (parts[0] === 'meetings') {
    if (parts[1] === 'create') {
      path = '/meetings/create'
      title = 'Create meeting | Time2Gather'
      const step = url.searchParams.get('step')
      if (step && creationSteps.has(step)) path += `?step=${step}`
    } else if (parts[1] === 'search') path = '/meetings/search'
    else if (parts.length >= 2) {
      path = '/meetings/_meeting'
      if (parts[2] === 'select' && ['time', 'all_day'].includes(parts[3])) path += `/select/${parts[3]}`
      else if (parts[2] === 'edit-dates') path += '/edit-dates'
      title = 'Meeting | Time2Gather'
    }
  }
  return { page_location: `https://time2gather.org${path}`, page_title: title }
}

export function analyticsReferrer (referrer: string) {
  try {
    const url = new URL(referrer)
    if (!['https:', 'http:'].includes(url.protocol)) return ''
    return productionHosts.has(url.hostname) ? analyticsPage(url.href).page_location : url.origin + '/'
  } catch { return '' }
}

// Only operator-authored, non-personal campaign labels are supported. The raw
// URL is never sent as page_location, including gclid and invitation parameters.
function campaignParameters () {
  const params = new URLSearchParams(window.location.search)
  const result: Record<string, string> = {}
  for (const [query, field] of Object.entries({
    utm_source: 'campaign_source', utm_medium: 'campaign_medium', utm_campaign: 'campaign_name',
    utm_id: 'campaign_id', utm_content: 'campaign_content', utm_term: 'campaign_term',
  })) {
    const value = params.get(query)
    if (value && /^[a-zA-Z0-9_-]{1,100}$/.test(value)) result[field] = value
  }
  return result
}

function context () {
  const page = analyticsPage(window.location.href)
  const state = window.__time2gatherAnalytics
  const locale = document.documentElement.lang
  return {
    ...page,
    page_referrer: state?.lastReferrer ?? analyticsReferrer(document.referrer),
    ui_language: (supportedLocales as readonly string[]).includes(locale) ? locale : 'en',
    ...(preference('debug') ? { debug_mode: true } : {}),
  }
}

function configure () {
  const enabled = analyticsEnabled()
  // Also disables an already loaded tag when ClientRouter enters /admin.
  Object.assign(window, { [`ga-disable-${analyticsMeasurementId}`]: !enabled })
  if (!enabled) return false
  const state = window.__time2gatherAnalytics ??= { configured: false, listening: false, creating: false }
  window.dataLayer ??= []
  window.gtag ??= function () {
    // Match the command queue format expected by the Google tag.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments)
  }
  if (!state.configured) {
    state.configured = true
    window.gtag('js', new Date())
    window.gtag('config', analyticsMeasurementId, {
      send_page_view: false,
      ...context(),
      ...campaignParameters(),
    })
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${analyticsMeasurementId}`
    document.head.appendChild(script)
  }
  return true
}

const parameterValues = {
  selection_type: ['ALL_DAY', 'TIME'], actor_role: ['host', 'participant'],
  response_action: ['first', 'update'], response_type: ['available', 'unavailable'],
  share_method: ['native', 'clipboard'], meeting_state: ['voting', 'confirmed'],
} as const

export function trackAnalyticsEvent (event: AnalyticsEvent, parameters: Parameters = {}) {
  try {
    if (!configure()) return
    // Runtime allowlist protects against accidental payload spreading from API data.
    const safe: Record<string, string | boolean> = {}
    for (const [key, values] of Object.entries(parameterValues)) {
      const value = parameters[key as keyof Parameters]
      if (typeof value === 'string' && (values as readonly string[]).includes(value)) safe[key] = value
    }
    if (typeof parameters.location_vote_enabled === 'boolean') safe.location_vote_enabled = parameters.location_vote_enabled
    window.gtag('event', event, { ...safe, ...context(), send_to: analyticsMeasurementId })
    if (event === 'meeting_created') window.__time2gatherAnalytics!.creating = false
  } catch {
    // Analytics must never affect creation, sharing, responses or confirmation.
  }
}

function pageView () {
  try {
    if (!configure()) return
    const state = window.__time2gatherAnalytics!
    const page = analyticsPage(window.location.href)
    if (state.lastPage === page.page_location) return
    if (state.lastPage) state.lastReferrer = state.lastPage
    window.gtag('set', context())
    window.gtag('event', 'page_view', { ...context(), send_to: analyticsMeasurementId })
    state.lastPage = page.page_location
    const url = new URL(window.location.href)
    if (url.pathname.replace(/\/$/, '') === '/meetings/create') {
      if (!state.creating && (!url.searchParams.has('step') || url.searchParams.get('step') === 'meetingType')) {
        state.creating = true
        trackAnalyticsEvent('meeting_create_started')
      }
    } else state.creating = false
  } catch {
    // Optional measurement can fail independently of the page.
  }
}

export function initializeAnalytics () {
  if (typeof window === 'undefined') return
  const state = window.__time2gatherAnalytics ??= { configured: false, listening: false, creating: false }
  if (!state.listening) {
    state.listening = true
    document.addEventListener('astro:page-load', pageView)
  }
  pageView()
}
