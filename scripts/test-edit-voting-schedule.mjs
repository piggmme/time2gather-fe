import assert from 'node:assert/strict'
import fs from 'node:fs'
import { chromium, webkit, expect } from '@playwright/test'

// Requires navigation-fixture.mjs on 18481 and Astro on 14321 with
// API_URL=http://127.0.0.1:18481/api and PUBLIC_API_URL=/api. All writes stay local.
const base = process.env.EDIT_SCHEDULE_BASE_URL ?? 'https://127.0.0.1:14321'
assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname))
const engine = process.env.EDIT_SCHEDULE_BROWSER ?? 'chromium'
const browser = await (engine === 'webkit' ? webkit : chromium).launch()
const output = `artifacts/edit-voting-schedule-20261111/${engine}`
fs.mkdirSync(output, { recursive: true })
const locales = process.env.EDIT_SCHEDULE_LOCALES?.split(',') ?? fs.readdirSync('src/i18n/locales').map(file => file.replace('.json', ''))
const report = []
async function setup (locale, width, code = 'nav-time') {
  const context = await browser.newContext({ ignoreHTTPSErrors: true, locale, viewport: { width, height: 900 } })
  const mutations = []
  await context.route(/googletagmanager|google-analytics|firestore.googleapis|firebaseinstallations.googleapis/, route => route.abort())
  await context.route(`${base}/api/**`, async (route) => {
    if (route.request().method() === 'PUT' && route.request().url().endsWith('/available-dates')) mutations.push(route.request().postDataJSON())
    const response = await route.fetch({ url: route.request().url().replace(base, 'http://127.0.0.1:18481') })
    await route.fulfill({ response })
  })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  const t = JSON.parse(fs.readFileSync(`src/i18n/locales/${locale}.json`, 'utf8'))
  await page.goto(`${base}/meetings/${code}/edit-dates?lang=${locale}`)
  const copy = t.meeting.editDates
  await expect(page.getByRole('heading', { name: code.includes('time') ? copy.timeTitle : copy.title, exact: true })).toBeVisible()
  await page.addStyleTag({ content: 'astro-dev-toolbar { display: none !important; }' })
  return {
    context, page, mutations, errors, t, copy,
  }
}
async function screen (page, name) {
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: `${output}/${name}.png`, fullPage: true, animations: 'disabled' })
}
try {
  for (const locale of locales) {
    for (const width of ['ko', 'de', 'ar'].includes(locale) ? [320, 390, 1280] : [390]) {
      const {
        context, page, mutations, errors, t, copy,
      } = await setup(locale, width)
      const start = page.getByLabel(t.createMeeting.timeRangeStep.startTime, { exact: true })
      const end = page.getByLabel(t.createMeeting.timeRangeStep.endTime, { exact: true })
      await expect(start).toHaveValue('09:00')
      await expect(end).toHaveValue('10:00')
      await expect(page.getByText(copy.timeDescription, { exact: true })).toBeVisible()
      await expect(page.getByText(copy.timeRangeHint, { exact: true })).toBeVisible()
      assert.equal(await page.locator('html').getAttribute('dir'), ['ar', 'ar-EG', 'ur'].includes(locale) ? 'rtl' : 'ltr')
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
      if (['ko', 'de', 'ar'].includes(locale)) await screen(page, `${locale}-${width}`)
      await end.fill('12:00')
      const save = page.getByRole('button', { name: copy.timeSave, exact: true })
      await save.click()
      await expect(page).toHaveURL(/\/meetings\/nav-time(?:[?#].*)?$/)
      assert.deepEqual(mutations, [{ dates: ['2026-11-15', '2026-11-16'], times: ['09:00', '10:00', '11:00', '12:00'] }])
      await expect(page.locator('a[href*="edit-dates"]').first()).toHaveText(copy.timeOpenButton)
      assert.deepEqual(errors, [])
      await context.close()
      report.push(`${locale}/${width}: initial values, localized copy, layout, save payload, result link passed`)
    }
  }
  const {
    context, page, mutations, t, copy, errors,
  } = await setup('ko', 390)
  const start = page.locator('input[type=time]').first()
  const end = page.locator('input[type=time]').last()
  const save = page.getByRole('button', { name: copy.timeSave, exact: true })
  await start.fill('11:00')
  await expect(save).toBeDisabled()
  await end.fill('')
  await expect(save).toBeDisabled()
  await start.fill('09:30')
  await end.fill('12:00')
  await expect(save).toBeDisabled()
  await start.fill('10:00')
  await end.fill('10:00')
  await expect(save).toBeEnabled()
  await expect(page.getByRole('status').filter({ hasText: copy.timeRemovedWarning.replace('{count}', '2') })).toBeVisible()
  await screen(page, 'ko-390-removal-warning')
  await page.route('**/available-dates', route => route.fulfill({ status: 503, json: { success: false } }))
  await save.click()
  await expect(save).toBeEnabled()
  await expect(start).toHaveValue('10:00')
  await expect(page).toHaveURL(/edit-dates/)
  await page.unroute('**/available-dates')
  await save.click()
  assert.deepEqual(mutations.at(-1).times, ['10:00'])
  await expect(page).toHaveURL(/\/meetings\/nav-time(?:[?#].*)?$/)
  await page.goto(`${base}/meetings/nav-time/edit-dates?lang=ko`)
  await page.getByRole('button', { name: copy.timeSave, exact: true }).click()
  await expect(page).toHaveURL(/\/meetings\/nav-time(?:[?#].*)?$/)
  assert.equal('times' in mutations.at(-1), false, 'Omitting untouched times preserves sparse and date-specific candidates')
  await page.goto(`${base}/meetings/nav-time/edit-dates?lang=ko`)
  await start.fill('08:00')
  const count = mutations.length
  await page.getByRole('button', { name: t.common.cancel, exact: true }).click()
  await expect(page).toHaveURL(/\/meetings\/nav-time(?:[?#].*)?$/)
  assert.equal(mutations.length, count)
  assert.deepEqual(errors, [])
  await context.close()
  report.push('TIME: invalid/empty/misaligned range, single slot, removal warning, retry, untouched range and cancel passed')
  const day = await setup('ko', 320, 'nav-day')
  assert.equal(await day.page.locator('input[type=time]').count(), 0)
  await day.page.getByRole('button', { name: day.copy.save, exact: true }).click()
  await expect(day.page).toHaveURL(/\/meetings\/nav-day(?:[?#].*)?$/)
  assert.deepEqual(day.mutations, [{ dates: ['2026-11-15', '2026-11-16'] }])
  await day.context.close()
  report.push('ALL_DAY: date-only editor and backward-compatible payload passed')
  fs.writeFileSync(`${output}/report.json`, JSON.stringify(report, null, 2))
  console.log(`${engine}: ${report.length} checks passed across ${locales.length} locales`)
} finally {
  await browser.close()
}
