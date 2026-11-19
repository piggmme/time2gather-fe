import { chromium, expect, webkit } from '@playwright/test'
import { spawn } from 'node:child_process'
import { mkdirSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createNavigationFixture } from './navigation-fixture.mjs'
import { waitForServer } from './wait-for-server.mjs'

const names = ['Alex', 'Sofia', '민수', 'نور', 'Maximilian Alexander Weber']
const fixture = createNavigationFixture({
  transformMeeting: (data, code) => {
    const roster = code.endsWith('empty') ? [] : code.endsWith('many') ? [...names, 'Hana', 'Sam'] : names
    data.participants = roster.map((username, index) => ({
      userId: index + 1,
      username,
      profileImageUrl: '',
      availabilityResponse: code.endsWith('none') || (code.endsWith('mixed') && index === 4) ? 'NONE' : null,
    }))
    data.meeting.timezone = 'Europe/London'
    data.meeting.description = ''
    const confirmed = code.endsWith('confirmed')
    const available = data.participants.filter(person => !person.availabilityResponse).slice(0, confirmed ? 2 : roster.length)
    data.summary.totalParticipants = roster.length
    data.summary.bestSlots = available.length
      ? data.summary.bestSlots.map(slot => ({
          ...slot, count: available.length, percentage: `${Math.round(available.length / roster.length * 100)}%`, participants: available,
        }))
      : []
    for (const slots of Object.values(data.schedule)) {
      for (const slot of Object.values(slots)) Object.assign(slot, { count: available.length, participants: available })
    }
    if (confirmed) Object.assign(data.meeting, { confirmedDate: '2026-11-15', confirmedTime: '09:00', confirmedSlotIndex: 9 })
    return data
  },
})

const output = process.env.PARTICIPANTS_OUTPUT
if (output) mkdirSync(output, { recursive: true })
const localeFilter = process.env.CI === 'true' ? undefined : process.env.QA_LOCALES
const locales = localeFilter?.split(',') ?? readdirSync('src/i18n/locales').filter(file => file.endsWith('.json')).map(file => file.slice(0, -5))
const browserType = process.env.PARTICIPANTS_ENGINE === 'webkit' ? webkit : chromium
await new Promise(resolve => fixture.server.listen(0, '127.0.0.1', resolve))
const apiOrigin = `http://127.0.0.1:${fixture.server.address().port}`
const port = process.env.PARTICIPANTS_PORT ?? '14329'
const base = `http://127.0.0.1:${port}`
const app = spawn(process.execPath, ['--import', './scripts/fixture-ssr-loader.mjs', 'dist/server/entry.mjs'], {
  env: { ...process.env, HOST: '127.0.0.1', PORT: port, PREFLIGHT_FIXTURE_API: apiOrigin },
  stdio: ['ignore', 'pipe', 'pipe'],
})
let logs = ''
app.stdout.on('data', chunk => logs += chunk)
app.stderr.on('data', chunk => logs += chunk)

let browser
let activeCase = 'server startup'
try {
  await waitForServer(`${base}/meetings/roster-time`, app, { logs: () => logs, timeoutMs: 45000 })
  browser = await browserType.launch()

  for (const locale of locales) {
    const { meeting } = JSON.parse(readFileSync(`src/i18n/locales/${locale}.json`, 'utf8'))
    const previewLocale = ['ko', 'de', 'ar'].includes(locale)
    for (const width of previewLocale ? [390, 1280, 320] : [390, 1280]) {
      activeCase = `${locale}/${width}`
      const context = await browser.newContext({ timezoneId: 'Europe/London', viewport: { width, height: 900 } })
      await context.route(`${base}/api/**`, async (route) => {
        const url = new URL(route.request().url())
        const response = await route.fetch({ url: `${apiOrigin}${url.pathname}${url.search}` })
        await route.fulfill({ response })
      })
      const page = await context.newPage()
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      const open = async (variant = '', count = 5) => {
        const response = await page.goto(`${base}/meetings/roster-time${variant}?lang=${locale}`, { waitUntil: 'domcontentloaded' })
        expect(response?.status()).toBe(200)
        await expect(page.locator('html')).toHaveAttribute('lang', locale)
        await page.getByRole('tab', { name: `${meeting.result.tabs.participants}${count ? ` (${count})` : ''}`, exact: true }).click()
        return page.getByRole('tabpanel')
      }
      const group = (panel, status) => panel.locator(`[data-response-group="${status}"]`)
      const panel = await open()
      const heading = panel.getByText(meeting.unavailable.respondents, { exact: true })
      const list = group(panel, 'selected').getByRole('list')
      await expect(heading).toBeVisible()
      await expect(list.getByRole('listitem')).toHaveText(names)
      await page.evaluate(() => document.fonts.ready)
      const headingBlock = await heading.locator('..').elementHandle()
      const gapAfterHeading = await list.evaluate((people, header) =>
        Math.round(people.getBoundingClientRect().top - header.getBoundingClientRect().bottom), headingBlock)
      expect({
        subgroupHeadings: await group(panel, 'selected').getByRole('heading').count(),
        totalLabels: await panel.getByText(meeting.result.participantsCount.replace('{count}', '5'), { exact: true }).count(),
        gapAfterHeading,
      }).toEqual({ subgroupHeadings: 0, totalLabels: 1, gapAfterHeading: 16 })
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
      if (['ar', 'ar-EG', 'ur'].includes(locale)) await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')

      if (output && previewLocale) {
        await page.evaluate(() => window.scrollTo(0, 0))
        await page.screenshot({ path: join(output, `${locale}-${width}.png`), animations: 'disabled' })
      }
      if (width === 320) {
        const mixed = await open('-mixed')
        await expect(group(mixed, 'selected').getByRole('heading')).toContainText(meeting.unavailable.selected)
        await expect(group(mixed, 'selected').getByRole('listitem')).toHaveText(names.slice(0, 4))
        await expect(group(mixed, 'none').getByRole('heading')).toContainText(meeting.unavailable.noneStatus)
        await expect(group(mixed, 'none').getByRole('listitem')).toHaveText(names[4])
        if (output) await mixed.screenshot({ path: join(output, `${locale}-mixed-${width}.png`), animations: 'disabled' })

        const none = await open('-none')
        await expect(group(none, 'selected')).toHaveCount(0)
        await expect(group(none, 'none').getByRole('listitem')).toHaveText(names)
        const empty = await open('-empty', 0)
        await expect(empty.getByText(meeting.participantsEmpty, { exact: true })).toBeVisible()
        await expect(empty.getByRole('list')).toHaveCount(0)
        const confirmed = await open('-confirmed')
        await expect(confirmed.getByText(meeting.unavailable.basis, { exact: true })).toBeVisible()
        await expect(group(confirmed, 'available').getByRole('listitem')).toHaveText(names.slice(0, 2))
        await expect(group(confirmed, 'unavailable').getByRole('listitem')).toHaveText(names.slice(2))
        const many = await open('-many', 7)
        await expect(many.getByRole('listitem')).toHaveCount(6)
        await many.getByRole('button', { name: meeting.unavailable.morePeople.replace('{count}', '1'), exact: true }).click()
        await expect(many.getByRole('listitem')).toHaveCount(7)
        await many.getByRole('button', { name: meeting.unavailable.lessPeople, exact: true }).click()
        await expect(many.getByRole('listitem')).toHaveCount(6)
      }
      expect(errors).toEqual([])
      await context.unrouteAll({ behavior: 'wait' })
      await context.close()
    }
    console.log(`PASS ${locale} (${browserType.name()})`)
  }
  expect(fixture.mutations).toEqual([])
} catch (error) {
  console.error(`Participant tab browser case failed (${activeCase})`, logs.slice(-2000))
  throw error
} finally {
  await browser?.close()
  app.kill('SIGTERM')
  fixture.server.closeAllConnections()
  await new Promise(resolve => fixture.server.close(resolve))
}
