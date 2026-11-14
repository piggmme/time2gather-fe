import assert from 'node:assert/strict'
import fs from 'node:fs'
import { chromium, expect } from '@playwright/test'

const base = process.env.CREATE_BASE ?? 'http://127.0.0.1:4384'
const output = process.env.CREATE_OUTPUT ?? 'artifacts/create-flow-layout'
const locales = process.env.QA_LOCALES?.split(',') ?? fs.readdirSync('src/i18n/locales').filter(file => file.endsWith('.json')).map(file => file.slice(0, -5))
const red = process.env.CREATE_RED === '1'
fs.mkdirSync(output, { recursive: true })
const browser = await chromium.launch()
const results = [], errors = [], writes = []
const scenarios = locales.flatMap(locale => (['ko', 'de', 'ar'].includes(locale) ? [320, 390, 1280] : [390, 1280]).map(width => ({ locale, width })))
try {
  for (const { locale, width } of scenarios) {
    const context = await browser.newContext({
      ignoreHTTPSErrors: true, locale, timezoneId: 'Asia/Seoul', viewport: { width, height: 844 }, reducedMotion: 'reduce',
    })
    await context.route(/googletagmanager|google-analytics|firestore.googleapis|firebaseinstallations.googleapis/, route => route.abort())
    await context.route(/\/v1\//, (route) => {
      if (route.request().method() !== 'GET') {
        writes.push(route.request().url())
        return route.abort()
      }
      return route.fulfill({
        json: {
          success: true, data: {
            userId: 1, username: '지우', provider: 'ANONYMOUS', role: 'USER', createdMeetings: [], participatedMeetings: [],
          },
        },
      })
    })
    const page = await context.newPage()
    page.on('pageerror', error => errors.push(error.message))
    for (const step of red ? ['title'] : ['meetingType', 'title', 'dates', 'timeRange', 'location']) {
      await page.goto(`${base}/meetings/create?step=${step}&meetingType=TIME&title=Weekend&dates=2026-11-21,2026-11-22&lang=${locale}`)
      await expect(page.locator('main h1')).toBeVisible()
      const buttons = page.locator(red ? 'main [class*="buttonContainer"]' : '[data-create-flow-actions]')
      await expect(buttons).toBeVisible()
      await expect.poll(async () => buttons.evaluate(el => Math.abs(innerHeight - el.getBoundingClientRect().bottom)), { message: `${locale}/${width}/${step}: actions must stay at viewport bottom` }).toBeLessThan(2)
      if (red) continue
      const check = async () => {
        const geometry = await page.evaluate(() => {
          const bar = document.querySelector('[data-create-flow-actions]').getBoundingClientRect()
          const inner = document.querySelector('[data-create-flow-actions] > div').getBoundingClientRect()
          const main = document.querySelector('main').getBoundingClientRect()
          return {
            overflow: document.documentElement.scrollWidth > innerWidth + 1, aligned: Math.abs(inner.left - main.left) < 2 && Math.abs(inner.width - main.width) < 2, bottom: bar.bottom, top: bar.top, buttons: [...document.querySelectorAll('[data-create-flow-actions] button')].map(el => ({ height: el.getBoundingClientRect().height, width: el.getBoundingClientRect().width, scroll: el.scrollWidth, client: el.clientWidth })),
          }
        })
        assert.equal(geometry.overflow, false, `${locale}/${width}/${step}: horizontal overflow`)
        assert.ok(geometry.aligned, `${locale}/${width}/${step}: actions align with content`)
        for (const button of geometry.buttons) {
          assert.ok(button.height >= 44)
          assert.ok(button.scroll <= button.client + 1)
        }
        return geometry
      }
      await check()
      if (step === 'timeRange') {
        await expect(page.locator('select[name="intervalMinutes"]')).toHaveValue('60')
        await page.locator('select[name="intervalMinutes"]').selectOption('30')
        await page.locator('main input[type="time"]').first().fill('09:30')
        await expect(page.locator('[data-create-flow-actions] button').last()).toBeEnabled()
        await page.getByRole('button', { name: /Seoul/ }).click()
        await expect(page.locator('[role="dialog"]')).toBeVisible()
        await page.keyboard.press('Escape')
        await expect(page.locator('[role="dialog"]')).toHaveCount(0)
        await page.locator('[data-create-flow-actions] button').last().click()
        await expect(page).toHaveURL(/step=location/)
        assert.equal(new URL(page.url()).searchParams.get('intervalMinutes'), '30')
        await page.locator('[data-create-flow-actions] button').first().click()
        await expect(page).toHaveURL(/step=timeRange/)
        await expect(page.locator('select[name="intervalMinutes"]')).toHaveValue('30')
        await expect(page.locator('main input[type="time"]').first()).toHaveValue('09:30')
        await expect(page.locator('button[aria-busy="true"]')).toHaveCount(0)
      }
      if (step === 'location') {
        const checkbox = page.locator('main input[type="checkbox"]')
        await checkbox.check()
        for (let i = 0; i < 3; i++) await page.locator('main button[class*="locationAddButton"]').click()
        const inputs = page.locator('main input:not([type="checkbox"])')
        await inputs.first().fill('지우')
        for (let i = 1; i < await inputs.count(); i++) await inputs.nth(i).fill(`Place ${i}`)
        await inputs.last().focus()
        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
        const geometry = await check()
        const lastBottom = await inputs.last().evaluate(el => el.getBoundingClientRect().bottom)
        assert.ok(lastBottom <= geometry.top - 8, `${locale}/${width}: last input hidden by actions`)
        await expect(page.locator('[data-create-flow-actions] button').last()).toBeEnabled()
        await page.evaluate(() => window.scrollTo(0, 0))
      }
      if (step === 'title' && ['ko', 'de', 'ar'].includes(locale) && width < 700) {
        await page.setViewportSize({ width, height: 430 })
        await page.locator('main input').focus()
        await expect.poll(() => buttons.evaluate(el => Math.abs(innerHeight - el.getBoundingClientRect().bottom))).toBeLessThan(2)
        await page.setViewportSize({ width, height: 844 })
        await page.evaluate(() => {
          Object.defineProperty(window.visualViewport, 'height', { configurable: true, get: () => 430 })
          window.visualViewport.dispatchEvent(new Event('resize'))
        })
        await expect.poll(() => buttons.evaluate(el => Math.abs(430 - el.getBoundingClientRect().bottom))).toBeLessThan(2)
        await expect.poll(async () => (await page.locator('main input').evaluate(el => el.getBoundingClientRect().bottom)) - (await buttons.boundingBox()).y).toBeLessThan(0)
        await page.evaluate(() => {
          delete window.visualViewport.height
          window.visualViewport.dispatchEvent(new Event('resize'))
        })
        await expect.poll(() => buttons.evaluate(el => Math.abs(innerHeight - el.getBoundingClientRect().bottom))).toBeLessThan(2)
      }
      if (['ko', 'de', 'ar'].includes(locale)) {
        await page.locator('main input').first().evaluateAll(elements => elements.forEach(el => el.blur()))
        await page.evaluate(() => document.fonts.ready)
        await page.screenshot({ path: `${output}/${locale}-${width}-${step}.png`, animations: 'disabled' })
      }
      results.push({ locale, width, step, ...(await check()) })
    }
    await context.close()
    console.log(`${locale}/${width} passed`)
  }
  assert.equal(errors.length, 0, errors.join('\n'))
  assert.equal(writes.length, 0)
  fs.writeFileSync(`${output}/verification.json`, JSON.stringify({
    passed: true, locales: locales.length, cases: results.length, errors, writes, results,
  }, null, 2))
} catch (error) {
  fs.writeFileSync(`${output}/failure.txt`, error.stack)
  throw error
} finally { await browser.close() }
