import assert from 'node:assert/strict'
import fs from 'node:fs'
import { chromium, webkit, expect } from '@playwright/test'

const base = process.env.PICKER_BASE ?? 'http://127.0.0.1:14325'
const output = process.env.PICKER_OUTPUT ?? '../browser-local'
const locales = process.env.QA_LOCALES?.split(',') ?? fs.readdirSync('src/i18n/locales').map(file => file.slice(0, -5))
const engine = process.env.PICKER_ENGINE ?? 'chromium'
const browser = await (engine === 'webkit' ? webkit.launch() : chromium.launch({ channel: process.env.PICKER_CHANNEL ?? 'chrome' }))
fs.mkdirSync(output, { recursive: true })
const results = [], errors = []
try {
  for (const locale of locales) {
    const t = JSON.parse(fs.readFileSync(`src/i18n/locales/${locale}.json`))
    for (const width of ['ko', 'de', 'ar'].includes(locale) ? [320, 390, 1280] : [390]) {
      const context = await browser.newContext({ ignoreHTTPSErrors: true, locale, viewport: { width, height: 900 }, reducedMotion: 'reduce' })
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
      await page.goto(`${base}/meetings/create?step=timeRange&meetingType=TIME&dates=2026-11-15,2026-11-16&title=Weekend&lang=${locale}`)
      await expect(page.getByRole('heading', { name: t.createMeeting.timeRangeStep.heading, exact: true })).toBeVisible()
      const start = page.getByRole('combobox', { name: t.createMeeting.timeRangeStep.startTime, exact: true })
      const end = page.getByRole('combobox', { name: t.createMeeting.timeRangeStep.endTime, exact: true })
      await expect(start).toBeEditable({ timeout: 5000 })
      await expect(start).toHaveValue('09:00')
      const interval = page.locator('select[name=intervalMinutes]')
      await expect(interval).toHaveValue('60')
      await interval.selectOption('30')
      const next = page.getByRole('button', { name: t.common.next, exact: true })
      await start.fill('09:30')
      await start.press('Tab')
      await end.fill('12:00')
      await end.press('Tab')
      await expect(next).toBeEnabled()
      // The chevron opens the full scrollable presets without activating a phone keyboard.
      const toggle = page.getByRole('button', { name: t.createMeeting.timeRangeStep.startTime, exact: true })
      await toggle.click()
      await expect(start).not.toBeFocused()
      const list = page.getByRole('listbox', { name: t.createMeeting.timeRangeStep.startTime, exact: true })
      await expect(list).toBeVisible()
      await expect(list.getByRole('option')).toHaveCount(48)
      assert.ok(await list.evaluate(el => el.scrollHeight > el.clientHeight))
      const option = list.locator('[data-time="10:30"]')
      await expect(option).toHaveAttribute('aria-selected', 'false')
      assert.ok(await option.evaluate(el => el.getBoundingClientRect().height >= 44))
      await option.click()
      await expect(start).toHaveValue('10:30')
      await expect(list).toBeHidden()
      // Typing validates without silently rounding an invalid minute.
      await start.fill('09:15')
      await start.press('Tab')
      await expect(start).toHaveAttribute('aria-invalid', 'true')
      await expect(next).toBeDisabled()
      await start.fill('930')
      await start.press('Tab')
      await expect(start).toHaveValue('09:30')
      await start.fill('٩:٣٠')
      await start.press('Tab')
      await expect(start).toHaveValue('09:30')
      await expect(next).toBeEnabled()
      await interval.selectOption('60')
      await expect(next).toBeDisabled()
      await toggle.click()
      await expect(list.getByRole('option')).toHaveCount(24)
      await page.keyboard.press('Escape')
      await interval.selectOption('30')
      // Full-string keyboard editing, arrow navigation, Enter selection and Escape dismissal.
      await start.fill('09:30')
      await start.press('ArrowDown')
      await expect(list).toBeVisible()
      await expect(start).toHaveAttribute('aria-activedescendant', /.+/)
      await toggle.click()
      await expect(list).toBeHidden()
      await start.press('ArrowDown')
      await start.press('Enter')
      await expect(list).toBeHidden()
      await start.fill('09:30')
      await start.press('Tab')
      await toggle.click()
      await expect(start).toHaveAttribute('aria-expanded', 'true')
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
      await expect.poll(async () => {
        const bounds = await list.boundingBox()
        return bounds.x >= 0 && bounds.x + bounds.width <= width + 1 && bounds.y + bounds.height <= 901
      }).toBe(true)
      if (['ko', 'de', 'ar'].includes(locale)) {
        await page.addStyleTag({ content: 'astro-dev-toolbar { display: none !important; }' })
        await page.evaluate(() => document.fonts.ready)
        await page.screenshot({ path: `${output}/${locale}-${width}-dropdown.png`, fullPage: true })
      }
      await page.keyboard.press('Escape')
      await end.fill('09:00')
      await end.press('Tab')
      await expect(next).toBeDisabled()
      await end.fill('11:00')
      await end.press('Tab')
      await next.click()
      await expect(page).toHaveURL(/startTime12=09%3A30/)
      await expect(page).toHaveURL(/intervalMinutes=30/)
      await page.getByRole('button', { name: t.common.previous, exact: true }).click()
      await expect(start).toHaveValue('09:30')
      await expect(end).toHaveValue('11:00')
      await expect(interval).toHaveValue('30')
      await next.click()
      await page.locator('#meeting-host-name').fill('Alex')
      await page.getByRole('button', { name: t.createMeeting.locationStep.createButton, exact: true }).click()
      await expect.poll(() => writes.find(w => w.path === '/api/v1/meetings')?.body).toMatchObject({ intervalMinutes: 30, availableDates: { '2026-11-15': ['09:30', '10:00', '10:30'] } })
      results.push({
        locale, width, typing: true, scrollPresets: 48, invalidRejected: true, keyboard: true, backRestored: true, requestHalfHours: true,
      })
      await context.close()
    }
    console.log(`PASS ${engine}/${locale}`)
  }
  assert.deepEqual(errors, [])
  fs.writeFileSync(`${output}/verification.json`, JSON.stringify({
    passed: true, base, engine, locales: locales.length, results, errors, scope: 'Real application, intercepted example API, no production writes',
  }, null, 2))
} finally { await browser.close() }
