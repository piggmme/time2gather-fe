import { chromium, expect } from '@playwright/test'
import { spawn } from 'node:child_process'
import { mkdir, readdir, readFile } from 'node:fs/promises'
import { createNavigationFixture } from './navigation-fixture.mjs'
import { waitForServer } from './wait-for-server.mjs'

const dates = ['2026-11-18', '2026-11-19', '2027-01-12', '2027-01-13', '2027-01-14']
const fixture = createNavigationFixture({
  transformMeeting: (data, code) => {
    data.meeting.title = 'Weekend picnic'
    const candidates = code.includes('single') ? dates.slice(0, 2) : dates
    data.meeting.availableDates = Object.fromEntries(candidates.map(date => [date, ['ALL_DAY']]))
    data.schedule = { [dates[0]]: data.schedule['2026-11-15'] }
    return data
  },
})

async function dragTouch (page, session, target, dx, dy, hold = 0) {
  await target.scrollIntoViewIfNeeded()
  const { x, y, width, height } = await target.boundingBox()
  const start = { x: x + width / 2, y: y + height / 2 }
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] })
  if (hold) await page.waitForTimeout(hold)
  for (let step = 1; step <= 8; step++) {
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: start.x + dx * step / 8, y: start.y + dy * step / 8 }],
    })
  }
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}

await new Promise(resolve => fixture.server.listen(0, '127.0.0.1', resolve))
const api = `http://127.0.0.1:${fixture.server.address().port}/api`
const port = process.env.DATE_VOTE_TEST_PORT || '4373'
const base = `http://127.0.0.1:${port}`
const app = spawn(process.execPath, ['--import', './scripts/fixture-ssr-loader.mjs', 'dist/server/entry.mjs'], {
  env: { ...process.env, HOST: '127.0.0.1', PORT: port, PREFLIGHT_FIXTURE_API: api },
  stdio: ['ignore', 'pipe', 'pipe'],
})
let logs = ''
app.stdout.on('data', chunk => logs += chunk)
app.stderr.on('data', chunk => logs += chunk)

let browser
let activeCase = 'server startup'
try {
  await waitForServer(`${base}/meetings/month-vote/select/all_day`, app, { logs: () => logs, timeoutMs: 45000 })
  browser = await chromium.launch()

  const locales = (await readdir('src/i18n/locales')).filter(file => file.endsWith('.json')).map(file => file.slice(0, -5))
  const widths = [320, 390, 1280]
  const output = process.env.DATE_VOTE_PREVIEW_DIR
  if (output) await mkdir(output, { recursive: true })
  for (const locale of locales) {
    const { meeting, common } = JSON.parse(await readFile(`src/i18n/locales/${locale}.json`, 'utf8'))
    const rtl = ['ar', 'ar-EG', 'ur'].includes(locale)
    for (const width of widths) {
      activeCase = `${locale}/${width}`
      const mobile = width < 700
      const context = await browser.newContext({
        viewport: { width, height: 820 },
        isMobile: mobile,
        hasTouch: mobile,
      })
      await context.route(/googletagmanager|google-analytics|googleapis\.com|gstatic\.com/, route => route.abort())
      await context.route('**/api/v1/**', async (route) => {
        const request = route.request()
        const path = new URL(request.url()).pathname.slice('/api'.length)
        const response = await fetch(api + path, {
          method: request.method(),
          body: request.postData() ?? undefined,
        })
        await route.fulfill({ status: response.status, json: await response.json() })
      })
      const page = await context.newPage()
      await page.goto(`${base}/meetings/month-vote/select/all_day?lang=${locale}`, { waitUntil: 'domcontentloaded' })
      const calendar = page.locator('[data-calendar-month]')
      const day = date => calendar.getByRole('button', { name: date, exact: true })
      const directMonth = month => calendar.locator(`[data-available-month="${month}"]`)
      const previous = calendar.getByRole('button', { name: meeting.dateCalendar.previousMonth, exact: true })
      const next = calendar.getByRole('button', { name: meeting.dateCalendar.nextMonth, exact: true })
      const november = day(dates[0])
      const january = day(dates[3])
      const nextDirection = rtl ? 1 : -1

      await expect(calendar).toHaveAttribute('data-calendar-month', '2026-11')
      await expect(november).toHaveAttribute('aria-pressed', 'true')
      if (mobile) {
        const cdp = await context.newCDPSession(page)
        await dragTouch(page, cdp, november, nextDirection * 92, 0)
        await expect(calendar, 'A horizontal touch gesture on a selectable date advances to the next candidate month').toHaveAttribute('data-calendar-month', '2027-01')
        await expect(january).toHaveAttribute('aria-pressed', 'false')
        await january.tap()
        await expect(january).toHaveAttribute('aria-pressed', 'true')
        await dragTouch(page, cdp, january, nextDirection * 90, 0)
        await expect(calendar).toHaveAttribute('data-calendar-month', '2027-01')
        await expect(january).toHaveAttribute('aria-pressed', 'true')
        await dragTouch(page, cdp, january, -nextDirection * 90, 0)
        await expect(calendar).toHaveAttribute('data-calendar-month', '2026-11')
        await expect(november).toHaveAttribute('aria-pressed', 'true')

        if (locale === 'ko' && width === 390) {
          await dragTouch(page, cdp, november, -nextDirection * 90, 0)
          await expect(calendar).toHaveAttribute('data-calendar-month', '2026-11')
          await expect(november).toHaveAttribute('aria-pressed', 'true')
          await dragTouch(page, cdp, november, nextDirection * 26, 0)
          await expect(calendar).toHaveAttribute('data-calendar-month', '2026-11')
          await expect(november).toHaveAttribute('aria-pressed', 'true')
          await page.setViewportSize({ width, height: 620 })
          await november.scrollIntoViewIfNeeded()
          const scrollY = await page.evaluate(() => window.scrollY)
          await dragTouch(page, cdp, november, nextDirection * 27, -90)
          await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(scrollY)
          await expect(calendar).toHaveAttribute('data-calendar-month', '2026-11')

          await page.setViewportSize({ width, height: 820 })

          // A disabled day is still part of the calendar gesture surface.
          const unavailableDay = day('2026-11-20')
          await expect(unavailableDay).toBeDisabled()
          await dragTouch(page, cdp, unavailableDay, nextDirection * 100, 0)
          await expect(calendar).toHaveAttribute('data-calendar-month', '2027-01')
          const oneCell = (await january.boundingBox()).width + 4
          await dragTouch(page, cdp, january, oneCell, 0, 320)
          await expect(calendar).toHaveAttribute('data-calendar-month', '2027-01')
          await expect(day(dates[4])).toHaveAttribute('aria-pressed', 'true')
          await directMonth('2026-11').tap()
          await expect(november).toHaveAttribute('aria-pressed', 'true')
        }
      }
      await expect(previous).toBeDisabled()
      await expect(next).toBeEnabled()
      if (mobile) await next.tap()
      else {
        await next.focus()
        await next.press('Enter')
      }
      await expect(calendar).toHaveAttribute('data-calendar-month', '2027-01')
      await expect(directMonth('2027-01')).toHaveAttribute('aria-pressed', 'true')
      const monthLabel = await directMonth('2027-01').getAttribute('aria-label')
      await expect(calendar.getByRole('heading', { name: monthLabel, exact: true })).toBeVisible()
      const previousBox = await previous.boundingBox()
      const nextBox = await next.boundingBox()
      expect(previousBox.width).toBeGreaterThanOrEqual(44)
      expect(nextBox.width).toBeGreaterThanOrEqual(44)
      expect(previousBox.x > nextBox.x).toBe(rtl)
      await expect(next).toBeDisabled()
      if (!mobile && locale === 'ko') {
        const start = await january.boundingBox()
        const end = await day(dates[4]).boundingBox()
        await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2)
        await page.mouse.down()
        await page.mouse.move(end.x + end.width / 2, end.y + end.height / 2, { steps: 12 })
        await page.mouse.up()
        await page.waitForTimeout(60) // dnd-kit suppresses the post-drag click for 50ms.
        await expect(january).toHaveAttribute('aria-pressed', 'true')
        await expect(day(dates[4])).toHaveAttribute('aria-pressed', 'true')
        await expect(calendar).toHaveAttribute('data-calendar-month', '2027-01')
      }
      if (output && ['ko', 'de', 'ar'].includes(locale)) {
        await page.setViewportSize({ width, height: 1100 })
        await page.evaluate(async () => {
          await document.fonts.ready
          window.scrollTo({ top: 0, behavior: 'instant' })
        })
        if (mobile) await page.waitForTimeout(350) // Let the browser's native tap highlight fade.
        const box = await calendar.boundingBox()
        await page.screenshot({
          path: `${output}/${locale}-${width}.png`, animations: 'disabled',
          clip: mobile ? { x: 0, y: box.y, width, height: box.height } : box,
        })
        await page.setViewportSize({ width, height: 820 })
      }
      await directMonth('2026-11').click()
      await expect(november).toHaveAttribute('aria-pressed', 'true')
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
      if (locale === 'ko' && width === 390) {
        const beforeSave = fixture.mutations.length
        await page.getByRole('button', { name: common.submit, exact: true }).click()
        await expect.poll(() => fixture.mutations.slice(beforeSave).find(write => write.path.endsWith('/selections'))?.body.selections).toEqual(
          [dates[0], dates[3], dates[4]].map(date => ({ date, type: 'ALL_DAY', times: [] })),
        )
        await expect(page).toHaveURL(/\/meetings\/month-vote(?:[?#].*)?$/)
        await page.goto(`${base}/meetings/single-month-vote/select/all_day?lang=${locale}`)
        await expect(calendar).toHaveAttribute('data-calendar-month', '2026-11')
        await expect(calendar.locator('[data-available-month]')).toHaveCount(0)
        await expect(next).toBeDisabled()
      }
      await context.unrouteAll({ behavior: 'wait' })
      await context.close()
    }
    console.log(`PASS ${locale} (${widths.join(', ')}px)`)
  }
} catch (error) {
  console.error(logs.slice(-8000))
  console.error(error)
  console.error(`Date vote month navigation failed in ${activeCase}: ${error.message.trim().split('\n')[0]}`)
  process.exitCode = 1
} finally {
  if (browser) await browser.close()
  app.kill('SIGTERM')
  await new Promise(resolve => fixture.server.close(resolve))
}
