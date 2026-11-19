import assert from 'node:assert/strict'
import fs from 'node:fs'
import { chromium, webkit, expect } from '@playwright/test'
import { createNavigationFixture } from './navigation-fixture.mjs'

// Start the application with API_URL=http://127.0.0.1:18481/api and
// PUBLIC_API_URL=/api. This script owns the disposable API on that port.
const base = process.env.UI_CONSISTENCY_BASE ?? 'http://127.0.0.1:14401'
assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname))
const output = process.env.UI_CONSISTENCY_OUTPUT ?? '../verification'
const red = process.env.UI_CONSISTENCY_RED === '1'
const locales = process.env.QA_LOCALES?.split(',') ?? ['ko', 'de', 'ar']
const results = [], failures = [], pageErrors = []
fs.mkdirSync(output, { recursive: true })
const fixture = createNavigationFixture({
  transformMeeting (data, code) {
    data.candidateVersion = 'ui-consistency-v1'
    if (code.includes('half')) {
      data.meeting.intervalMinutes = 30
      data.meeting.availableDates = Object.fromEntries(Object.keys(data.meeting.availableDates).map(date => [date, ['09:00', '09:30', '10:00']]))
    }
    return data
  },
})
await new Promise(resolve => fixture.server.listen(18481, '127.0.0.1', resolve))

async function setup (browser, locale, width) {
  const context = await browser.newContext({ locale, viewport: { width, height: 844 }, timezoneId: 'Asia/Seoul', reducedMotion: 'reduce' })
  const writes = []
  await context.route(/googletagmanager|google-analytics|firestore.googleapis|firebaseinstallations.googleapis/, route => route.abort())
  await context.route('**/api/**', async (route) => {
    const request = route.request(), url = new URL(request.url())
    if (request.method() !== 'GET') writes.push({ method: request.method(), path: url.pathname, body: request.postDataJSON() })
    const response = await route.fetch({ url: `http://127.0.0.1:18481${url.pathname}${url.search}` })
    await route.fulfill({ response })
  })
  const page = await context.newPage()
  page.on('pageerror', error => pageErrors.push(error.message))
  const t = JSON.parse(fs.readFileSync(`src/i18n/locales/${locale}.json`, 'utf8'))
  return { context, page, writes, t }
}
async function run (label, action) {
  try {
    await action()
    results.push(label)
    console.log(`PASS ${label}`)
  } catch (error) {
    failures.push({ label, message: error.message })
    console.log(`FAIL ${label}: ${error.message.split('\n')[0]}`)
  }
}

async function closeContext (context) {
  // A successful navigation can still have API routes finishing in the background.
  // Complete those handlers before closing the context and disposing their responses.
  for (const page of context.pages()) await page.unrouteAll({ behavior: 'wait' })
  await context.unrouteAll({ behavior: 'wait' })
  await context.close()
}

try {
  for (const [engine, launcher] of [['chromium', chromium], ['webkit', webkit]]) {
    const browser = await launcher.launch()
    try {
      for (const locale of red ? ['ko'] : locales) {
        for (const width of red ? [390] : [320, 390, 1280]) {
          await run(`${engine}/${locale}/${width}: pointer-opened time list closes with Escape`, async () => {
            const { context, page, t } = await setup(browser, locale, width)
            try {
              await page.goto(`${base}/meetings/create?step=timeRange&meetingType=TIME&title=Weekend&dates=2026-11-17,2026-11-18&lang=${locale}`)
              const toggle = page.getByRole('button', { name: t.createMeeting.timeRangeStep.startTime, exact: true })
              const list = page.getByRole('listbox', { name: t.createMeeting.timeRangeStep.startTime, exact: true })
              await toggle.click()
              await expect(list).toBeVisible()
              await expect(page.getByRole('combobox', { name: t.createMeeting.timeRangeStep.startTime, exact: true })).not.toBeFocused()
              await page.keyboard.press('Escape')
              await expect(list).toBeHidden()
            } finally { await closeContext(context) }
          })
          await run(`${engine}/${locale}/${width}: editor preserves inclusive half-hour ranges and save state`, async () => {
            const { context, page, writes, t } = await setup(browser, locale, width)
            let finishSave
            try {
              await page.goto(`${base}/meetings/nav-time-half/edit-dates?lang=${locale}`)
              await expect(page.locator('main [role=combobox]')).toHaveCount(2)
              const start = page.getByRole('combobox', { name: t.createMeeting.timeRangeStep.startTime, exact: true })
              const end = page.getByRole('combobox', { name: t.createMeeting.timeRangeStep.endTime, exact: true })
              const save = page.getByRole('button', { name: t.meeting.editDates.timeSave, exact: true })
              await expect(start).toHaveValue('09:00')
              await expect(end).toHaveValue('10:00')
              const endToggle = page.getByRole('button', { name: t.createMeeting.timeRangeStep.endTime, exact: true })
              await endToggle.click()
              const list = page.getByRole('listbox', { name: t.createMeeting.timeRangeStep.endTime, exact: true })
              await expect(list.locator('[data-time="08:30"]')).toHaveAttribute('data-combobox-disabled')
              await expect(list.locator('[data-time="09:00"]')).not.toHaveAttribute('data-combobox-disabled')
              await page.keyboard.press('Escape')
              await start.fill('09:15')
              await start.press('Tab')
              await expect(save).toBeDisabled()
              await start.fill('09:30')
              await start.press('Tab')
              await end.fill('09:30')
              await end.press('Tab')
              await expect(end).not.toHaveAttribute('aria-invalid', 'true')
              await expect(save).toBeEnabled()
              await page.getByRole('button', { name: t.createMeeting.timeRangeStep.startTime, exact: true }).click()
              const startList = page.getByRole('listbox', { name: t.createMeeting.timeRangeStep.startTime, exact: true })
              await expect(startList.locator('[data-time="10:00"]')).toHaveAttribute('data-combobox-disabled')
              await page.keyboard.press('Escape')
              await page.evaluate(() => document.fonts.ready)
              await page.addStyleTag({ content: 'astro-dev-toolbar { display:none!important }' })
              if (!red) await page.screenshot({ path: `${output}/${engine}-${locale}-${width}-edit.png`, fullPage: true })
              const waiting = new Promise((resolve) => {
                finishSave = resolve
              })
              let savingCandidates = false
              await page.route('**/meetings/nav-time-half/candidates', async (route) => {
                writes.push({ method: route.request().method(), path: new URL(route.request().url()).pathname, body: route.request().postDataJSON() })
                savingCandidates = true
                await waiting
                await route.fulfill({ json: { success: true, data: {} } })
              })
              await save.click()
              await expect.poll(() => savingCandidates).toBe(true)
              await expect(save).toBeDisabled()
              await expect(start).toBeDisabled()
              await expect(endToggle).toBeDisabled()
              const navigation = page.waitForURL(/\/meetings\/nav-time-half(?:[?#].*)?$/, { waitUntil: 'commit', timeout: 5000 })
              finishSave()
              await navigation
              assert.deepEqual(writes.at(-1).body, { dates: ['2026-11-15', '2026-11-16'], times: ['09:30'], expectedVersion: 'ui-consistency-v1' })
            } finally {
              finishSave?.()
              await closeContext(context)
            }
          })
        }
      }
    } finally { await browser.close() }
  }
} finally {
  fixture.server.closeAllConnections()
  await new Promise(resolve => fixture.server.close(resolve))
  fs.writeFileSync(`${output}/${red ? 'red' : 'green'}.json`, JSON.stringify({
    passed: failures.length === 0 && pageErrors.length === 0, results, failures, pageErrors, scope: 'Real local application with example API; no production writes',
  }, null, 2))
}
assert.deepEqual(failures, [])
assert.deepEqual(pageErrors, [])
