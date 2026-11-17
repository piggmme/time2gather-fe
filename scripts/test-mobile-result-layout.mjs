import assert from 'node:assert/strict'
import fs from 'node:fs'
import { chromium, webkit, expect } from '@playwright/test'
import { createNavigationFixture } from './navigation-fixture.mjs'

const base = process.env.MOBILE_RESULT_BASE ?? 'http://127.0.0.1:14417'
assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname))
const output = process.env.MOBILE_RESULT_OUTPUT ?? '../verification'
const red = process.env.MOBILE_RESULT_RED === '1'
const smoke = red || process.env.MOBILE_RESULT_SMOKE === '1'
const fixturePort = Number(process.env.MOBILE_RESULT_FIXTURE_PORT ?? 18487)
fs.mkdirSync(output, { recursive: true })
const results = [], failures = [], errors = []
const people = ['Courtney Barry', 'Yukie in U.S. Pacific Time Zone', 'Melisa Sagarnaga', 'Anastasia', 'Natasha Lazareski', 'Valeria Feldman', 'Camille Summers', 'Mary Katherine Lance LMFT'].map((username, i) => ({ userId: i + 1, username, profileImageUrl: '' }))
const dates = ['2026-11-21', '2026-11-23', '2026-11-24', '2026-11-25', '2026-11-26', '2026-11-27']
const times = Array.from({ length: 10 }, (_, i) => `${i + 10}:00`)
const fixture = createNavigationFixture({
  transformMeeting (data, code) {
    const allDay = code.includes('day')
    const slots = allDay ? ['ALL_DAY'] : times
    data.meeting.title = '친구들과 주말 약속'
    data.meeting.description = ''
    data.meeting.availableDates = Object.fromEntries(dates.map(date => [date, slots]))
    data.participants = people
    data.schedule = Object.fromEntries(dates.map((date, i) => [date, Object.fromEntries(slots.map((time, j) => {
      const participants = people.slice(0, (i + j) % 6 + 1)
      return [time, { count: participants.length, participants }]
    }))]))
    data.summary.totalParticipants = people.length
    data.summary.bestSlots = []
    return data
  },
})
await new Promise(resolve => fixture.server.listen(fixturePort, '127.0.0.1', resolve))
const locales = fs.readdirSync('src/i18n/locales').filter(name => name.endsWith('.json')).map(name => name.slice(0, -5))

function check (label, action) {
  try {
    action()
  } catch (error) {
    failures.push({ label, message: error.message })
  }
}

try {
  for (const [engine, launcher] of smoke ? [['chromium', chromium]] : [['chromium', chromium], ['webkit', webkit]]) {
    const browser = await launcher.launch()
    try {
      for (const locale of smoke ? ['ko'] : engine === 'webkit' ? ['ko', 'de', 'ar'] : locales) {
        for (const width of smoke ? [390] : ['ko', 'de', 'ar'].includes(locale) ? [320, 390, 1280] : [390, 1280]) {
          const label = `${engine}/${locale}/${width}`
          const context = await browser.newContext({ locale, viewport: { width, height: 844 }, timezoneId: 'Asia/Seoul', reducedMotion: 'reduce' })
          try {
            await context.route(/googletagmanager|google-analytics|firestore.googleapis|firebaseinstallations.googleapis/, route => route.abort())
            await context.route('**/api/**', async (route) => {
              assert.equal(route.request().method(), 'GET', 'Layout checks must not write data')
              const url = new URL(route.request().url())
              const response = await route.fetch({ url: `http://127.0.0.1:${fixturePort}${url.pathname}${url.search}` })
              await route.fulfill({ response })
            })
            const page = await context.newPage()
            page.on('pageerror', error => errors.push(`${label}: ${error.message}`))
            const t = JSON.parse(fs.readFileSync(`src/i18n/locales/${locale}.json`, 'utf8'))
            await page.goto(`${base}/meetings/nav-time?lang=${locale}`)
            await page.getByRole('tab', { name: t.meeting.result.tabs.calendar, exact: true }).click()
            const calendar = page.locator('[data-interval-minutes]')
            await expect(calendar).toBeVisible()
            const header = calendar.locator('[class*="stickyHeader"]')
            await page.evaluate(() => document.fonts.ready)
            await page.evaluate(() => window.scrollTo(0, document.querySelector('[data-interval-minutes]').getBoundingClientRect().top + window.scrollY + 160))
            await expect.poll(async () => Math.round((await header.boundingBox()).y)).toBeLessThan(80)
            const headerBox = await header.boundingBox()
            if (width < 700) check(`${label}: dates attach to viewport top`, () => assert.ok(Math.abs(headerBox.y) <= 1, `Expected 0px, received ${headerBox.y}px`))
            if (['ko', 'de', 'ar'].includes(locale)) await page.screenshot({ path: `${output}/${engine}-${locale}-${width}-sticky.png` })
            const grid = calendar.locator('[class*="gridScrollContainer"]')
            const overflows = await grid.evaluate(el => el.scrollWidth > el.clientWidth + 1)
            if (overflows) {
              await grid.evaluate((el) => {
                el.scrollLeft = document.documentElement.dir === 'rtl' ? -110 : 110
              })
              await expect.poll(async () => Math.abs(await header.locator('[class*="dateHeaderScroll"]').evaluate(el => el.scrollLeft))).toBeGreaterThan(40)
            }
            const offsets = await calendar.evaluate(el => [...el.querySelectorAll('[class*="dateHeaderScroll"], [class*="gridScrollContainer"]')].map(el => el.scrollLeft))
            check(`${label}: horizontal alignment`, () => assert.ok(Math.abs(offsets[0] - offsets[1]) < 1))
            const filter = page.locator('fieldset').filter({ has: page.locator('legend', { hasText: t.meeting.result.tabs.participants }) })
            await expect(filter.locator('li')).toHaveCount(8)
            await filter.scrollIntoViewIfNeeded()
            const boxes = await filter.locator('li').evaluateAll(items => items.map(el => ({ x: el.getBoundingClientRect().x, width: el.getBoundingClientRect().width })))
            if (width < 700) {
              check(`${label}: single-column participants`, () => assert.ok(boxes.every(box => Math.abs(box.x - boxes[0].x) < 1)))
            }
            const listGeometry = await filter.locator('ul').evaluate(el => ({ height: el.clientHeight, content: el.scrollHeight }))
            if (width < 700) check(`${label}: no nested participant scrolling`, () => assert.ok(listGeometry.content <= listGeometry.height + 1))
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false)
            const rowHeights = await filter.locator('li label').evaluateAll(items => items.map(el => el.getBoundingClientRect().height))
            check(`${label}: touch targets`, () => assert.ok(rowHeights.every(height => height >= 44)))
            const checkboxes = filter.getByRole('checkbox')
            await expect(checkboxes).toHaveCount(9)
            await checkboxes.nth(2).uncheck()
            await expect(checkboxes.first()).not.toBeChecked()
            await expect(checkboxes.nth(2)).not.toBeChecked()
            await checkboxes.first().check()
            await expect(checkboxes.nth(2)).toBeChecked()
            if (['ko', 'de', 'ar'].includes(locale)) {
              await checkboxes.first().blur()
              await page.mouse.move(0, 0)
              await filter.evaluate(el => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 24))
              await page.screenshot({ path: `${output}/${engine}-${locale}-${width}-participants.png` })
            }
            results.push({
              engine, locale, width, headerTop: headerBox.y, listGeometry,
            })
            console.log(`${label} checked`)
          } finally {
            await context.unrouteAll({ behavior: 'wait' })
            await context.close()
          }
        }
      }
    } finally { await browser.close() }
  }
} finally {
  fixture.server.closeAllConnections()
  await new Promise(resolve => fixture.server.close(resolve))
  fs.writeFileSync(`${output}/${red ? 'red' : 'green'}.json`, JSON.stringify({
    passed: failures.length === 0 && errors.length === 0 && fixture.mutations.length === 0,
    results, failures, errors, mutations: fixture.mutations,
  }, null, 2))
  if (!red) fs.copyFileSync(`${output}/green.json`, `${output}/verification.json`)
}
assert.deepEqual(failures, [])
assert.deepEqual(errors, [])
assert.deepEqual(fixture.mutations, [])
