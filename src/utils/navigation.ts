import { navigate as astroNavigate } from 'astro:transitions/client'
import { getLocaleFromContext } from '../i18n'
import { withLocale } from '../i18n/config'
import { previousPage, stepHistoryKey } from './navigationHistory'
export function navigate (href: string, options?: Parameters<typeof astroNavigate>[1]) {
  const destination = new URL(href, window.location.href).href
  return astroNavigate(withLocale(destination, getLocaleFromContext(), window.location.origin), options)
}

/** Return to a known app entry; a direct/shared link falls back to its parent. */
export function navigateBack (fallback: string) {
  const previous = previousPage()
  const target = new URL(fallback, window.location.origin)
  const step = (url: URL) => url.searchParams.get('step') ?? (url.pathname === '/meetings/create' ? 'meetingType' : null)
  const matches = previous?.pathname === target.pathname
    && step(previous) === step(target)
  const depth = window.history.state?.[stepHistoryKey]?.depth ?? 0
  if (matches) {
    return new Promise<void>((resolve) => {
      document.addEventListener('astro:page-load', () => resolve(), { once: true })
      window.history.go(-1 - depth)
    })
  }
  if (depth > 0) {
    // A directly opened multi-step vote has no app parent. Replace its first
    // step so browser Back after saving cannot reopen an unfinished ballot.
    return new Promise<void>((resolve) => {
      window.addEventListener('popstate', () => {
        void navigate(fallback, { history: 'replace' }).then(resolve)
      }, { once: true })
      window.history.go(-depth)
    })
  }
  return navigate(fallback, { history: 'replace' })
}
