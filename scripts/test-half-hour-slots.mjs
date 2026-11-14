import assert from 'node:assert/strict'
import fs from 'node:fs'
import { chromium, expect } from '@playwright/test'

const base = process.env.HALF_HOUR_BASE ?? 'http://127.0.0.1:14325'
const output = process.env.HALF_HOUR_OUTPUT ?? '../local-browser'
const locales = process.env.QA_LOCALES?.split(',') ?? fs.readdirSync('src/i18n/locales').map(f => f.slice(0, -5))
fs.mkdirSync(output, { recursive: true })
const browser = await chromium.launch()
const results = [], errors = []
try {
  for (const locale of locales) {
    const t = JSON.parse(fs.readFileSync(`src/i18n/locales/${locale}.json`))
    for (const width of ['ko', 'de', 'ar'].includes(locale) ? [320, 390, 1280] : [390]) {
      const context = await browser.newContext({
        ignoreHTTPSErrors: true, locale, timezoneId: 'Asia/Seoul', viewport: { width, height: 900 }, reducedMotion: 'reduce',
      })
      const writes = []
      await context.route(/googletagmanager|google-analytics|firestore.googleapis|firebaseinstallations.googleapis/, r => r.abort())
      await context.route('**/api/**', async (route) => {
        const req = route.request()
        if (req.method() !== 'GET') writes.push({ path: new URL(req.url()).pathname, body: req.postDataJSON() })
        try {
          const response = await route.fetch({ url: req.url().replace(new URL(req.url()).origin, 'http://127.0.0.1:18485') })
          await route.fulfill({ response })
        } catch (error) {
          if (!/disposed|closed/i.test(String(error))) throw error
        }
      })
      const page = await context.newPage()
      page.on('pageerror', error => errors.push(error.message))
      const query = `step=timeRange&meetingType=TIME&dates=2026-11-15,2026-11-16&title=Weekend&startTime12=09:00&startAmPm=AM&endTime12=12:00&endAmPm=PM&lang=${locale}`
      await page.goto(`${base}/meetings/create?${query}`)
      await expect(page.getByRole('combobox', { name: t.createMeeting.timeRangeStep.startTime, exact: true })).toHaveValue('09:00')
      const select = page.locator('select[name=intervalMinutes]')
      await expect(select).toBeVisible()
      await expect(select).toHaveValue('60')
      await select.selectOption('30')
      await expect(select).toHaveAccessibleName(t.createMeeting.timeRangeStep.intervalLabel)
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
      if (['ko', 'de', 'ar'].includes(locale)) {
        await page.evaluate(() => document.fonts.ready)
        await page.screenshot({ path: `${output}/${locale}-${width}-creation.png`, fullPage: true })
      }
      await page.getByRole('button', { name: t.common.next, exact: true }).click()
      await expect(page).toHaveURL(/intervalMinutes=30/)
      await page.getByRole('button', { name: t.common.previous, exact: true }).click()
      await expect(select).toHaveValue('30')
      await page.getByRole('button', { name: t.common.next, exact: true }).click()
      await page.locator('#meeting-host-name').fill('Alex')
      await page.getByRole('button', { name: t.createMeeting.locationStep.createButton, exact: true }).click()
      await expect.poll(() => writes.find(w => w.path === '/api/v1/meetings')?.body).toMatchObject({ intervalMinutes: 30, availableDates: { '2026-11-15': ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'] } })
      await page.goto(`${base}/meetings/half-time/select/time?lang=${locale}`)
      const cells = page.locator('button[data-date-key="2026-11-15"][data-time-index]')
      await expect(cells).toHaveCount(6)
      await expect(cells.first()).toHaveCSS('height', '32px')
      await expect(cells.nth(1)).toHaveAttribute('aria-label', /09:30.*10:00/)
      await expect(cells.first()).toHaveAttribute('aria-pressed', 'false')
      await cells.nth(1).click()
      await expect(cells.nth(1)).toHaveAttribute('aria-pressed', 'true')
      await expect(cells.first()).toHaveAttribute('aria-pressed', 'false')
      const timeColumn = page.locator('[data-time-label]')
      await expect(timeColumn).toHaveCount(3)
      assert.deepEqual(await timeColumn.evaluateAll(es => es.map(e => e.getAttribute('data-time-label'))), ['09:00', '10:00', '11:00'])
      if (['ko', 'de', 'ar'].includes(locale)) {
        await page.evaluate(() => document.fonts.ready)
        await page.screenshot({ path: `${output}/${locale}-${width}-voting.png`, fullPage: true })
      }
      await page.getByRole('button', { name: t.common.submit, exact: true }).click()
      await expect.poll(() => writes.find(w => w.path === '/api/v1/meetings/half-time/selections')?.body).toMatchObject({ selections: [{ date: '2026-11-15', type: 'TIME', times: ['09:30'] }] })
      await page.goto(`${base}/meetings/hour-time/select/time?lang=${locale}`)
      await expect(page.locator('button[data-time-index]').first()).toHaveCSS('height', '44px')
      await context.close()
      results.push({
        locale, width, creation: true, independentHalf: true, hourlyLabels: true, legacyHour: true,
      })
    }
    console.log(`PASS ${locale}`)
  }
  assert.deepEqual(errors, [])
  fs.writeFileSync(`${output}/verification.json`, JSON.stringify({
    passed: true, base, results, locales: locales.length, errors, fixture: 'Local in-memory API; no production writes',
  }, null, 2))
} finally { await browser.close() }
