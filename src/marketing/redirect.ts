import type { APIContext } from 'astro'
import { getLocaleFromAstroRequest, normalizeLocale } from '../i18n'
import { marketingRedirectPath, type MarketingPage } from './config'

export function redirectMarketingPage ({ url, cookies, request }: Pick<APIContext, 'url' | 'cookies' | 'request'>, page: MarketingPage): Response {
  const requested = normalizeLocale(url.searchParams.get('lang'))
  const locale = getLocaleFromAstroRequest(cookies, request.headers, requested)
  return new Response(null, {
    status: 302,
    headers: {
      'Location': marketingRedirectPath(locale, page, url.searchParams, !requested),
      'Vary': 'Accept-Language, Cookie',
      'Cache-Control': 'private, no-store',
    },
  })
}
