const DEFAULT_AUTH_REDIRECT = '/meetings/create'

export function getSafeAuthRedirect (value: string | null | undefined): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return null
  }

  try {
    const url = new URL(value, 'https://time2gather.org')
    if (url.origin !== 'https://time2gather.org') return null

    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return null
  }
}

export function getAuthRedirectOrDefault (value: string | null | undefined): string {
  return getSafeAuthRedirect(value) ?? DEFAULT_AUTH_REDIRECT
}

export function getCurrentAuthRedirect (): string {
  if (typeof window === 'undefined') return DEFAULT_AUTH_REDIRECT

  return getAuthRedirectOrDefault(
    `${window.location.pathname}${window.location.search}${window.location.hash}`,
  )
}
