import { chromium, webkit, expect } from '@playwright/test'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { createNavigationFixture } from './navigation-fixture.mjs'

const output = path.resolve(process.env.CALENDAR_SIZE_OUTPUT ?? '../verification')
fs.mkdirSync(output, { recursive: true })
const fixture = createNavigationFixture({
  transformMeeting: (data, code) => {
    const [, count,
      interval,
      length] = code.split('-')
    const dates = Array.from({ length: Number(count) }, (_, i) => `2026-11-${String(18 + i).padStart(2, '0')}`)
    const times = Array.from({ length: length === 'short' ? 2 : 13 * 60 / Number(interval) }, (_, i) => {
      const minutes = 9 * 60 + i * Number(interval)
      return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
    })
    data.meeting.title = 'Calendar preview'
    data.meeting.description = ''
    data.meeting.intervalMinutes = Number(interval)
    data.meeting.availableDates = Object.fromEntries(dates.map(date => [date, times]))
    data.schedule = Object.fromEntries(dates.map(date => [date, Object.fromEntries(times.map(time => [time, { count: 1, participants: data.participants }]))]))
    data.summary.bestSlots = []
    return data
  },
})
await new Promise(resolve => fixture.server.listen(0, '127.0.0.1', resolve))
const api = `http://127.0.0.1:${fixture.server.address().port}/api`
const port = Number(process.env.CALENDAR_SIZE_PORT ?? 4377)
const base = `http://127.0.0.1:${port}`
// Keep development-only dependency access out of the product Astro config.
const config = path.join(output, 'astro.qa.config.mjs')
fs.writeFileSync(config, `import config from ${JSON.stringify(pathToFileURL(path.resolve('astro.config.mjs')).href)};\nexport default { ...config, vite: { ...config.vite, server: { fs: { allow: ${JSON.stringify([process.cwd(), path.dirname(fs.realpathSync('node_modules'))])} } } } };\n`)
const app = spawn('node', ['node_modules/astro/astro.js', 'dev', '--config', path.relative(process.cwd(), config), '--host', '127.0.0.1', '--port', String(port)], {
  env: { ...process.env, API_URL: api, PUBLIC_API_URL: api }, stdio: ['ignore', 'pipe', 'pipe'],
})
let logs = ''
app.stdout.on('data', (chunk) => {
  logs += chunk
})
app.stderr.on('data', (chunk) => {
  logs += chunk
})
app.on('exit', (code) => {
  if (code && !app.killed) console.error(logs)
})
const engine = process.env.CALENDAR_SIZE_BROWSER ?? 'chromium'
const browser = await (engine === 'webkit' ? webkit : chromium).launch()
const locales = process.env.QA_LOCALES?.split(',') ?? fs.readdirSync('src/i18n/locales').map(f => f.slice(0, -5))
const smoke = process.env.CALENDAR_SIZE_SMOKE === '1'
const results = []
const errors = []
const failures = []
try {
  const ready = await browser.newContext()
  await expect.poll(async () => {
    try {
      return (await ready.request.get(base)).status()
    } catch {
      return 0
    }
  }, { timeout: 60000 }).toBe(200)
  await ready.close()
  for (const locale of locales) {
    const messages = JSON.parse(fs.readFileSync(`src/i18n/locales/${locale}.json`, 'utf8'))
    const sizes = smoke ? [[390, 640]] : [[390, 640], [1280, 900], ...(['ko', 'de', 'ar', 'ur'].includes(locale) ? [[320, 568], [390, 844]] : [])]
    for (const [width, height] of sizes) {
      const context = await browser.newContext({
        viewport: { width, height }, hasTouch: width < 700, isMobile: width < 700,
        locale, timezoneId: 'Asia/Seoul', reducedMotion: 'reduce',
      })
      await context.route(/googletagmanager|google-analytics|firestore.googleapis|firebaseinstallations.googleapis/, route => route.abort())
      const page = await context.newPage()
      page.on('pageerror', error => errors.push(error.message))
      const variants = smoke ? [[1, 60, 'long']] : [[1, 60, 'long'], [2, 30, 'long'], [8, 60, 'long'], [1, 60, 'short']]
      for (const [count,
        interval,
        length] of variants) {
        const code = `time-${count}-${interval}-${length}`
        await page.goto(`${base}/meetings/${code}/select/time?lang=${locale}`)
        await page.addStyleTag({ content: 'astro-dev-toolbar { display:none !important; }' })
        const first = page.locator('button[data-date-key="2026-11-18"][data-time-index="0"]')
        await expect(first).toBeVisible()
        await page.evaluate(() => document.fonts.ready)
        const calendar = page.locator('[class*="timeSelectionCalendar"]')
        await expect(calendar).toHaveCount(1)
        await calendar.scrollIntoViewIfNeeded()
        const geometry = await calendar.evaluate((el) => {
          const rect = (node) => {
            const { x, y, width, height } = node.getBoundingClientRect()
            return { x, y, width, height }
          }
          const body = el.querySelector('[class*="scrollWrapper"]')
          const grid = el.querySelector('[class*="gridScrollContainer"]')
          const headers = el.querySelector('[class*="dateHeaderScroll"]')
          const hint = el.querySelector('[role="status"]')
          return {
            card: rect(el), parent: rect(el.parentElement), body: rect(body), cell: rect(el.querySelector('button[data-time-index]')), column: rect(el.querySelector('[class*="dateWrapper"]')), header: rect(headers.firstElementChild), gridWidth: grid.scrollWidth, viewportWidth: grid.clientWidth, hintHeight: hint.getBoundingClientRect().height, overflow: document.documentElement.scrollWidth > innerWidth + 1,
          }
        })
        const label = `${engine}/${locale}/${width}x${height}/${count}dates/${interval}min/${length}`
        const checks = []
        const check = (condition, message) => {
          if (!condition) checks.push(`${label}: ${message}`)
        }
        const expectedWidth = width < 700 ? geometry.parent.width : Math.min(geometry.parent.width, 90 + count * 100)
        check(Math.abs(geometry.card.width - expectedWidth) < 2, `calendar width must match ${width < 700 ? 'available mobile width' : 'existing desktop columns'} (${geometry.card.width} vs ${expectedWidth})`)
        check(!geometry.overflow, 'page must not overflow horizontally')
        check(Math.abs(geometry.header.width - geometry.column.width) < 1, 'header and column widths must match')
        check(geometry.cell.height >= (interval === 30 ? 32 : 44), 'preserve existing time-cell height')
        if (width < 700 && length === 'long') {
          check(geometry.body.height >= (interval === 30 ? 384 : 264), `at least six hours must fit in the scroll viewport (actual ${geometry.body.height})`)
          if (count < 3) check(geometry.gridWidth <= geometry.viewportWidth + 2, 'one/two dates must fit without horizontal scrolling')
          else check(geometry.gridWidth > geometry.viewportWidth, 'many dates must retain horizontal scrolling')
        }
        if (length === 'short') check(geometry.card.height < 260, 'short schedules must retain their natural height')
        const saveScreen = ['ko', 'de', 'ar', 'ur'].includes(locale) && ((width === 390 && height === 640) || width === 1280)
        if (saveScreen) await page.screenshot({ path: `${output}/${engine}-${locale}-${width}-${count}-${interval}-${length}.png`, fullPage: true })
        if (checks.length) {
          failures.push(...checks)
          if (smoke) throw new Error(checks.join('\n'))
        }
        // Widening a cell must preserve selection, date selection and scroll behavior.
        const wasSelected = await first.getAttribute('aria-pressed')
        if (width < 700) await first.tap()
        else await first.click()
        await expect(first).toHaveAttribute('aria-pressed', wasSelected === 'true' ? 'false' : 'true')
        await first.focus()
        await page.keyboard.press('Space')
        await expect(first).toHaveAttribute('aria-pressed', wasSelected)
        if (process.env.CALENDAR_SIZE_GESTURES === '1' && engine === 'chromium' && width < 700 && length === 'long') {
          const second = page.locator('button[data-date-key="2026-11-18"][data-time-index="1"]')
          await second.scrollIntoViewIfNeeded()
          const a = await first.boundingBox()
          const b = await second.boundingBox()
          const cdp = await context.newCDPSession(page)
          const touch = box => ({ x: box.x + box.width / 2, y: box.y + box.height / 2 })
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [touch(a)] })
          // Cross the product's 200ms long-press threshold before moving.
          await page.waitForTimeout(250)
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [touch(b)] })
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
          await expect(first).toHaveAttribute('aria-pressed', 'false')
          await expect(second).toHaveAttribute('aria-pressed', 'false')
          await expect(page.locator('button[data-date-key="2026-11-18"][data-time-index="2"]')).toHaveAttribute('aria-pressed', 'true')
          await calendar.locator('button[class*="dateHeader"]').first().click()
          await expect(first).toHaveAttribute('aria-pressed', 'true')
          await cdp.detach()
        }
        if (length === 'long') {
          await calendar.locator('[class*="scrollWrapper"]').evaluate((el) => {
            el.scrollTop = el.scrollHeight
          })
          const last = page.locator('button[data-date-key="2026-11-18"][data-time-index]').last()
          await last.scrollIntoViewIfNeeded()
          await expect(last).toBeInViewport()
          if (count === 8) {
            const rtl = ['ar', 'ar-EG', 'ur'].includes(locale)
            const grid = calendar.locator('[class*="gridScrollContainer"]')
            await grid.evaluate((el, rtl) => {
              el.scrollLeft = rtl ? -el.scrollWidth : el.scrollWidth
            }, rtl)
            await expect.poll(() => calendar.evaluate(el => Math.abs(el.querySelector('[class*="gridScrollContainer"]').scrollLeft - el.querySelector('[class*="dateHeaderScroll"]').scrollLeft))).toBeLessThan(2)
          }
        }
        // Date header still selects every candidate, including independently selectable halves.
        const dateHeader = calendar.locator('button[class*="dateHeader"]').first()
        await dateHeader.click()
        await expect(dateHeader).toHaveAttribute('aria-pressed', 'false')
        await dateHeader.click()
        await expect(dateHeader).toHaveAttribute('aria-pressed', 'true')
        if (locale === 'ko' && width === 390 && height === 640 && count <= 2) {
          const before = fixture.mutations.length
          await page.getByRole('button', { name: messages.common.submit, exact: true }).click()
          await expect(page).toHaveURL(new RegExp(`/meetings/${code}(?:[?#].*)?$`))
          const saved = fixture.mutations.slice(before).find(write => write.path.endsWith('/selections'))?.body.selections
          expect(saved).toEqual(expect.arrayContaining([expect.objectContaining({ date: '2026-11-18', type: 'TIME' })]))
        }
        results.push({ label, geometry })
      }
      if (!smoke) {
        await page.goto(`${base}/meetings/time-1-60-long?lang=${locale}`)
        await page.getByRole('tab', { name: messages.meeting.result.tabs.calendar, exact: true }).click()
        const result = page.locator('[class*="resultCalendar"]').first()
        await expect(result).toBeVisible()
        const geometry = await result.evaluate(el => ({ width: el.getBoundingClientRect().width, parentWidth: el.parentElement.getBoundingClientRect().width }))
        if (width < 700 && Math.abs(geometry.width - geometry.parentWidth) >= 2) failures.push(`${locale}/${width}: result calendar must fill mobile width`)
      }
      await context.close()
    }
    console.log(`PASS ${engine} ${locale}: ${results.length} cumulative cases`)
  }
  expect(errors).toEqual([])
  expect(failures).toEqual([])
} finally {
  fs.writeFileSync(`${output}/${engine}-report.json`, JSON.stringify({
    results, errors, failures, writes: fixture.mutations, fixture: 'Local in-memory API; no production requests or writes',
  }, null, 2))
  fs.writeFileSync(`${output}/${engine}-server.log`, logs)
  await browser.close()
  app.kill('SIGTERM')
  await new Promise(resolve => fixture.server.close(resolve))
}
