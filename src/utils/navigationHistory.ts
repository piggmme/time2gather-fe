import { defaultLocale, normalizeLocale, withLocale } from '../i18n/config'

const navigationKey = 'time2gatherNavigation'
export const stepHistoryKey = 'time2gatherStep'

type Entry = { previous?: string }
let creationDraft: Record<string, unknown> | undefined

export function readPageState<T> (key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  return window.history.state?.time2gatherPage?.[key] ?? fallback
}

export function writePageState (key: string, value: unknown) {
  const state = window.history.state ?? {}
  const page = { ...state.time2gatherPage, [key]: value }
  window.history.replaceState({ ...state, time2gatherPage: page }, '')
  if (window.location.pathname === '/meetings/create') creationDraft = page
}

export function previousPage () {
  const previous = (window.history.state?.[navigationKey] as Entry | undefined)?.previous
  if (!previous) return null
  try {
    const url = new URL(previous, window.location.origin)
    return url.origin === window.location.origin ? url : null
  } catch { return null }
}

// Record successful app transitions, not referrers or the browser's history length.
// The metadata stays with its history entry across refreshes and back/forward.
export function installNavigationHistory () {
  creationDraft = window.location.pathname === '/meetings/create' ? window.history.state?.time2gatherPage : undefined
  let pending: { type: string, from: string, entry?: Entry, draft?: Record<string, unknown> } | undefined
  document.addEventListener('astro:before-preparation', (event) => {
    if (event.navigationType !== 'traverse') {
      // Invitation URLs hide lang while viewed. Keep it in the history entry
      // before leaving so Back cannot trigger a language redirect and lose state.
      const locale = normalizeLocale(document.documentElement.lang) ?? defaultLocale
      const from = withLocale(window.location.href, locale, window.location.origin)
      window.history.replaceState(window.history.state, '', from)
      writePageState('scroll', { left: window.scrollX, top: window.scrollY })
    }
    pending = {
      type: event.navigationType,
      from: event.navigationType === 'traverse' ? event.from.href : window.location.href,
      entry: window.history.state?.[navigationKey],
      draft: event.from.pathname === '/meetings/create' && event.to.pathname === '/meetings/create' ? creationDraft : undefined,
    }
  })
  document.addEventListener('astro:after-swap', () => {
    if (!pending) return
    const state = window.history.state ?? {}
    if (pending.type === 'push') {
      window.history.replaceState({ ...state, [navigationKey]: { previous: pending.from } }, '')
    } else if (pending.type === 'replace') {
      window.history.replaceState({ ...state, [navigationKey]: pending.entry }, '')
    }
    if (pending.draft) {
      const draft = { ...pending.draft }
      delete draft.scroll
      window.history.replaceState({ ...window.history.state, time2gatherPage: { ...window.history.state?.time2gatherPage, ...draft } }, '')
    }
    creationDraft = window.location.pathname === '/meetings/create' ? window.history.state?.time2gatherPage : undefined
    pending = undefined
  })
}
