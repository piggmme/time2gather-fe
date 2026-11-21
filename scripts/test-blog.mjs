import assert from 'node:assert/strict'
import { readdir } from 'node:fs/promises'
import { chromium, expect, webkit } from '@playwright/test'

const [baseUrl, mode = 'preview'] = process.argv.slice(2)
assert(baseUrl && ['preview', 'draft-build', 'published-build'].includes(mode),
  'Usage: node scripts/test-blog.mjs BASE_URL [preview|draft-build|published-build]')

const locales = (await readdir(new URL('../src/i18n/locales/', import.meta.url)))
  .filter(file => file.endsWith('.json'))
  .map(file => file.slice(0, -5))
const rtlLocales = ['ar', 'ar-EG', 'ur']
const slug = 'year-end-gathering-date-poll'
const indexPath = locale => `/${locale}/blog/`
const articlePath = locale => `${indexPath(locale)}${slug}/`
const canonical = path => new URL(path, 'https://time2gather.org').href

const engine = process.env.BLOG_ENGINE === 'webkit' ? webkit : chromium
const browser = await engine.launch()
try {
  const context = await browser.newContext({ baseURL: baseUrl })
  await context.route(/googletagmanager|google-analytics/, route => route.abort())
  const page = await context.newPage()
  const blocked = mode === 'draft-build'
  let sitemaps = []
  if (mode !== 'preview') {
    const response = await context.request.get('/sitemap-index.xml')
    assert.equal(response.status(), 200)
    const index = await response.text()
    const urls = Array.from(index.matchAll(/<loc>([^<]+)<\/loc>/g), match => new URL(match[1]).pathname)
    assert(urls.length > 0)
    sitemaps = await Promise.all(urls.map(async (url) => {
      const sitemap = await context.request.get(url)
      assert.equal(sitemap.status(), 200)
      return sitemap.text()
    }))
  }

  const headlines = new Set()
  for (const locale of locales) {
    const blogUrl = indexPath(locale)
    const postUrl = articlePath(locale)

    for (const path of [blogUrl, postUrl]) {
      assert.equal((await context.request.get(path)).status(), blocked ? 404 : 200, path)
      if (mode !== 'preview') {
        assert.equal(sitemaps.some(sitemap => sitemap.includes(`<loc>${canonical(path)}</loc>`)), !blocked, path)
      }
    }

    await page.goto(`/${locale}/`)
    await expect(page.locator(`header a[href="${blogUrl}"]`)).toHaveCount(0)
    const footerLink = page.locator(`footer a[href="${blogUrl}"]`)
    await expect(footerLink).toHaveCount(blocked ? 0 : 1)
    if (blocked) continue
    const blogLabel = (await footerLink.textContent()).trim()
    assert((await footerLink.boundingBox()).height >= 44, `${locale} blog link has a 44px tap target`)
    await footerLink.click()
    await expect(page).toHaveURL(new URL(blogUrl, baseUrl).href)
    await expect(page.locator('main h1')).toHaveText(blogLabel)
    await verifyMetadata(locale, blogUrl, indexPath)
    await page.locator(`main a[href="${postUrl}"]`).click()
    await expect(page).toHaveURL(new URL(postUrl, baseUrl).href)
    await verifyMetadata(locale, postUrl, articlePath)
    await expect(page.locator('html')).toHaveAttribute('lang', locale)
    await expect(page.locator('html')).toHaveAttribute('dir', rtlLocales.includes(locale) ? 'rtl' : 'ltr')
    await expect(page.locator('main article h1')).toBeVisible()
    await expect(page.locator('main article h2')).toHaveCount(2)
    await expect(page.locator('main article blockquote')).toBeVisible()
    await expect(page.locator(`main a[href="/meetings/create?lang=${locale}"]`)).toBeVisible()
    const title = await page.locator('main article h1').textContent()
    headlines.add(title)
    await expect(page).toHaveTitle(`${title} | Time2Gather`)
    await expect(page.locator('meta[name=description]')).toHaveAttribute('content', /\S/)
    const graph = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent())['@graph']
    const article = graph.find(item => item['@type'] === 'BlogPosting')
    if (mode === 'preview') {
      assert.equal(article, undefined)
    } else {
      assert.equal(article.headline, title)
      assert.equal(article.inLanguage, locale)
      assert.equal(article.mainEntityOfPage, canonical(postUrl))
      assert.match(article.datePublished, /^\d{4}-\d{2}-\d{2}$/)
    }
    if (['ko', 'de', 'ar-EG'].includes(locale)) {
      for (const width of [320, 390, 1440]) {
        await page.setViewportSize({ width, height: 844 })
        await page.evaluate(() => document.fonts.ready)
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${locale} article fits ${width}px`)
      }
    }
    if (locale === 'ko') {
      await page.locator('header .language-menu summary').click()
      await page.locator(`header .language-list a[href="${articlePath('de')}"]`).click()
      await expect(page).toHaveURL(new URL(articlePath('de'), baseUrl).href)
      await page.goto(postUrl)
    }
    await page.locator(`main a[href="${blogUrl}"]`).click()
    await expect(page).toHaveURL(new URL(blogUrl, baseUrl).href)
  }

  async function verifyMetadata (locale, path, equivalentPath) {
    await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', canonical(path))
    await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', mode === 'preview' ? /noindex/ : /^index/)
    if (locale === 'pcm') {
      await expect(page.locator('link[rel=alternate][hreflang]')).toHaveCount(0)
    } else {
      await expect(page.locator('link[rel=alternate][hreflang="x-default"]')).toHaveAttribute('href', canonical(equivalentPath('en')))
      await expect(page.locator('link[rel=alternate][hreflang="pcm"]')).toHaveCount(0)
      for (const language of locales.filter(language => language !== 'pcm')) {
        await expect(page.locator(`link[rel=alternate][hreflang="${language}"]`)).toHaveAttribute('href', canonical(equivalentPath(language)))
      }
    }
    for (const language of locales) {
      await expect(page.locator(`header .language-list a[href="${equivalentPath(language)}"]`)).toHaveCount(1)
    }
  }

  if (!blocked) assert.equal(headlines.size, locales.length, 'Each article has a localized headline')
  assert.equal((await context.request.get('/ko/blog/missing-article/')).status(), 404)
  assert.equal((await context.request.get(`/xx/blog/${slug}/`)).status(), 404)
} finally {
  await browser.close()
}
console.log(`Blog checks passed (${mode}, ${engine.name()}, ${locales.length} locales).`)
