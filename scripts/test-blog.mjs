import assert from 'node:assert/strict'
import { chromium, expect } from '@playwright/test'

const [baseUrl, mode = 'preview'] = process.argv.slice(2)
assert(baseUrl && ['preview', 'draft-build', 'published-build'].includes(mode),
  'Usage: node scripts/test-blog.mjs BASE_URL [preview|draft-build|published-build]')

const blogPath = '/ko/blog/'
const articlePath = `${blogPath}year-end-gathering-date-poll/`
const articleTitle = '연말 모임 날짜 정하기, 단톡방에 바로 쓰는 투표 문구'
const expectedCanonical = new URL(articlePath, 'https://time2gather.org').href

const browser = await chromium.launch()
try {
  const context = await browser.newContext({ baseURL: baseUrl })
  const page = await context.newPage()
  const blocked = mode === 'draft-build'
  assert.equal((await page.goto(blogPath)).status(), blocked ? 404 : 200)
  assert.equal((await page.goto(articlePath)).status(), blocked ? 404 : 200)
  assert.equal((await context.request.get(`${blogPath}missing-article/`)).status(), 404)

  if (mode !== 'preview') {
    const response = await context.request.get('/sitemap-index.xml')
    assert.equal(response.status(), 200)
    const index = await response.text()
    const urls = Array.from(index.matchAll(/<loc>([^<]+)<\/loc>/g), match => new URL(match[1]).pathname)
    assert(urls.length > 0)
    const sitemaps = await Promise.all(urls.map(async (url) => {
      const sitemap = await context.request.get(url)
      assert.equal(sitemap.status(), 200)
      return sitemap.text()
    }))
    assert.equal(sitemaps.some(sitemap => sitemap.includes(`<loc>${expectedCanonical}</loc>`)), !blocked)
    const indexCanonical = new URL(blogPath, expectedCanonical).href
    assert.equal(sitemaps.some(sitemap => sitemap.includes(`<loc>${indexCanonical}</loc>`)), !blocked)
  }

  await page.goto('/ko/')
  const blogLink = page.getByRole('link', { name: '블로그', exact: true })
  await expect(blogLink).toHaveCount(blocked ? 0 : 1)

  if (!blocked) {
    await blogLink.click()
    await expect(page).toHaveURL(new URL(blogPath, baseUrl).href)
    await expect(page.getByRole('heading', { name: '블로그', exact: true })).toBeVisible()
    await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', new URL(blogPath, expectedCanonical).href)
    await page.getByRole('link', { name: articleTitle }).click()
    await expect(page).toHaveURL(new URL(articlePath, baseUrl).href)
    await expect(page.getByRole('heading', { name: articleTitle })).toBeVisible()
    await expect(page.locator('blockquote')).toContainText('가능한 날짜를 전부 골라 주세요')
    await expect(page.locator('html')).toHaveAttribute('lang', 'ko')
    await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', expectedCanonical)
    await expect(page.locator('link[rel=alternate][hreflang]')).toHaveCount(0)
    await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', mode === 'preview' ? /noindex/ : /^index/)
    await expect(page.getByRole('link', { name: '일정 투표 만들기' })).toHaveAttribute('href', '/meetings/create?lang=ko')
    await page.setViewportSize({ width: 320, height: 720 })
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Article fits a 320px screen')
    const graph = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent())['@graph']
    const article = graph.find(item => item['@type'] === 'BlogPosting')
    if (mode === 'preview') {
      assert.equal(article, undefined)
    } else {
      assert.equal(article.headline, articleTitle)
      assert.equal(article.mainEntityOfPage, expectedCanonical)
      assert.match(article.datePublished, /^\d{4}-\d{2}-\d{2}$/)
    }
    await page.getByRole('link', { name: '글 목록으로', exact: true }).click()
    await expect(page).toHaveURL(new URL(blogPath, baseUrl).href)
  }
} finally {
  await browser.close()
}
console.log(`Blog checks passed (${mode}).`)
