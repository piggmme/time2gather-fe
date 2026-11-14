import fs from 'node:fs'
import assert from 'node:assert/strict'
import { chromium, expect } from '@playwright/test'
const base = process.env.BRAND_BASE || 'http://127.0.0.1:14335', out = process.env.BRAND_OUTPUT || '../brand-local'
fs.mkdirSync(out, { recursive: true })
const browser = await chromium.launch(), results = []
try {
  for (const locale of fs.readdirSync('src/i18n/locales').map(n => n.slice(0, -5))) {
    for (const width of ['ko', 'de', 'ar'].includes(locale) ? [390, 1280] : [390]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, locale })
      await context.route(/googletagmanager|google-analytics|firestore.googleapis|firebaseinstallations.googleapis/, r => r.abort())
      const page = await context.newPage()
      await page.goto(base + '/' + locale + '/')
      await expect(page.locator('link[rel=icon]')).toHaveAttribute('href', '/brand/icon-192.png')
      await expect(page.locator('link[rel=apple-touch-icon]')).toHaveAttribute('href', '/brand/apple-touch-icon.png')
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://time2gather.org/share/brand-v2.png')
      await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute('content', 'https://time2gather.org/share/brand-v2.png')
      assert((await page.locator('script[type="application/ld+json"]').allTextContents()).join('').includes('/brand/logo.svg'))
      await expect(page.locator('img[src="/brand/logo.svg"]:visible').first()).toBeVisible()
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
      if (['ko', 'de', 'ar'].includes(locale)) {
        await page.evaluate(() => document.fonts.ready)
        await page.screenshot({ path: `${out}/${locale}-${width}-home.png`, fullPage: true })
      }
      await page.goto(base + '/meetings/create?step=title&lang=' + locale)
      await expect(page.locator('link[rel=icon]')).toHaveAttribute('href', '/brand/icon-192.png')
      await expect(page.locator('img[src="/brand/logo.svg"]:visible').first()).toBeVisible()
      if (['ko', 'de', 'ar'].includes(locale)) await page.screenshot({ path: `${out}/${locale}-${width}-create.png`, fullPage: true })
      results.push({
        locale, width, brand: true, favicon: true, apple: true, openGraph: true, schema: true, noOverflow: true,
      })
      await context.close()
    }
  }
  for (const file of ['/brand/logo.svg', '/brand/icon-192.png', '/brand/apple-touch-icon.png', '/favicon.svg', '/favicon.png', '/share/brand-v2.png', '/time2gather-share.png']) {
    const response = await fetch(base + file)
    assert.equal(response.status, 200, file)
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), fs.readFileSync('public' + file), file)
  }
  fs.writeFileSync(`${out}/verification.json`, JSON.stringify({ passed: true, locales: 22, results, staticAssetsMatch: true }, null, 2))
  console.log('PASS brand, favicon, sharing, schema and 22 locale rendering')
} finally { await browser.close() }
