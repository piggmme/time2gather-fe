import assert from 'node:assert/strict'
import fs from 'node:fs'
import { chromium, expect } from '@playwright/test'
const output = process.env.NAME_COPY_OUTPUT ?? '../local-browser'
const base = process.env.NAME_COPY_BASE ?? 'http://127.0.0.1:14337'
fs.mkdirSync(output, { recursive: true })
const locales = fs.readdirSync('src/i18n/locales').filter(file => file.endsWith('.json')).map(file => file.slice(0, -5))
const browser = await chromium.launch()
const results = [], errors = [], writes = []
try {
  for (const locale of locales) {
    for (const width of [390, 1280, ...(['ko', 'de', 'ar'].includes(locale) ? [320] : [])]) {
      const context = await browser.newContext({ ignoreHTTPSErrors: true, locale, viewport: { width, height: 844 }, reducedMotion: 'reduce' })
      await context.route(/googletagmanager|google-analytics|firestore.googleapis|firebaseinstallations.googleapis/, route => route.abort())
      await context.route(/\/api\//, route => {
        if (route.request().method() !== 'GET') { writes.push(route.request().url()); return route.abort() }
        return route.fulfill({ json: { success: true, data: { userId: 1, username: '지우', provider: 'ANONYMOUS', role: 'USER' } } })
      })
      const page = await context.newPage()
      page.on('pageerror', error => errors.push(error.message))
      await page.goto(`${base}/meetings/create?step=location&meetingType=ALL_DAY&title=Weekend&dates=2026-11-21&lang=${locale}`)
      const copy = JSON.parse(fs.readFileSync(`src/i18n/locales/${locale}.json`, 'utf8')).createMeeting.locationStep
      await expect(page.locator('main h1')).toHaveText(copy.heading)
      await expect(page.locator('#creator-section-title h3, h3#creator-section-title')).toHaveText(copy.creatorHeading)
      const input = page.locator('#meeting-host-name')
      await expect(input).toHaveValue('지우')
      await expect(input).toHaveAccessibleName(copy.usernameLabel)
      await expect(page.locator('#meeting-host-name-help')).toHaveCount(0)
      assert.equal(await input.getAttribute('aria-describedby'), null)
      await input.fill('민수')
      const toggle = page.locator('main input[type=checkbox]')
      await toggle.check()
      await expect(page.locator('main input').nth(2)).toBeVisible()
      await toggle.uncheck()
      await expect(page.locator('[data-create-flow-actions] button').last()).toBeEnabled()
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${locale}/${width} overflow`)
      if (['ko', 'de', 'ar'].includes(locale)) {
        await input.blur()
        await page.evaluate(() => document.fonts.ready)
        await page.screenshot({ path: `${output}/${locale}-${width}.png`, animations: 'disabled', fullPage: true })
      }
      results.push({ locale, width, passed: true, heading: copy.creatorHeading })
      await context.close()
    }
    console.log(`${locale} passed`)
  }
  assert.deepEqual(errors, [])
  assert.deepEqual(writes, [])
  fs.writeFileSync(`${output}/verification.json`, JSON.stringify({ passed: true, locales: locales.length, cases: results.length, errors, writes, results }, null, 2))
} finally { await browser.close() }
