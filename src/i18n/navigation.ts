import { withLocale, normalizeLocale, defaultLocale } from './config'
import { installNavigationHistory } from '../utils/navigationHistory'

installNavigationHistory()

function decorate (root: ParentNode) {
  const locale = normalizeLocale(document.documentElement.lang) ?? defaultLocale
  root.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((anchor) => {
    if (anchor.hasAttribute('download') || anchor.getAttribute('href')?.startsWith('#')) return
    const href = withLocale(anchor.href, locale, window.location.origin)
    if (href !== anchor.href) anchor.setAttribute('href', href)
  })
}
function refresh () {
  decorate(document)
}
refresh()
document.addEventListener('astro:page-load', refresh)
document.addEventListener('time2gather:locale-changed', refresh)
// Capture runs before Astro's link handler and also covers newly rendered islands.
document.addEventListener('click', (event) => {
  const anchor = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href]')
  if (!anchor || anchor.hasAttribute('download') || anchor.getAttribute('href')?.startsWith('#')) return
  const locale = normalizeLocale(document.documentElement.lang) ?? defaultLocale
  anchor.href = withLocale(anchor.href, locale, window.location.origin)
}, true)
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.addedNodes.length) {
      refresh()
      break
    }
  }
})
observer.observe(document.documentElement, { childList: true, subtree: true })
