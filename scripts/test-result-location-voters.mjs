import { chromium, devices, expect, webkit } from '@playwright/test'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import { createNavigationFixture } from './navigation-fixture.mjs'
import { waitForServer } from './wait-for-server.mjs'

const output = process.env.RESULT_VOTERS_OUTPUT
const locales = process.env.QA_LOCALES?.split(',') ?? fs.readdirSync('src/i18n/locales').filter(file => file.endsWith('.json')).map(file => file.slice(0, -5))
const widths = [320, 390, 1280]
const fixture = createNavigationFixture({
  transformMeeting: (data, code) => {
    if (code === 'result-day-status') {
      const participants = Array.from({ length: 5 }, (_, index) => ({ userId: index + 1, username: `Participant ${index + 1}`, profileImageUrl: '' }))
      data.participants = participants
      data.summary.totalParticipants = participants.length
      for (const slot of data.summary.bestSlots) {
        Object.assign(slot, { participants, count: participants.length })
        data.schedule[slot.date].ALL_DAY = { participants, count: participants.length }
      }
      return data
    }
    if (!data.locationVote) return data
    const people = [
      { ...data.participants[0], username: 'Alex Kim' },
      { userId: 2, username: 'Sam Lee', profileImageUrl: '' },
    ]
    const date = '2026-12-08'
    const times = ['18:00', '19:00', '20:00']
    Object.assign(data.meeting, {
      host: { ...data.meeting.host, id: 3 }, timezone: 'America/New_York', availableDates: { [date]: times },
    })
    data.participants = people
    data.schedule = { [date]: Object.fromEntries(times.map(time => [time, { count: 2, participants: people }])) }
    data.summary = {
      totalParticipants: 2,
      bestSlots: [{
        date, time: '18:00 ~ 21:00', count: 2, percentage: '100%', participants: people, startSlotIndex: 18, endSlotIndex: 20,
      }],
    }
    if (code.includes('confirmed')) {
      Object.assign(data.meeting, { confirmedDate: date, confirmedTime: times[0], confirmedSlotIndex: 18 })
    }
    if (code.endsWith('-partial')) {
      data.participants = [...people, { userId: 4, username: 'Taylor Lee', profileImageUrl: '' }]
      data.summary.totalParticipants = 3
    }
    if (code.endsWith('-grouped')) {
      data.meeting.availableDates[date].push('22:00', '23:00')
      data.schedule[date]['22:00'] = { count: 2, participants: people }
      data.schedule[date]['23:00'] = { count: 2, participants: people }
      data.summary.bestSlots.push({
        date, time: '22:00 ~ 23:00', count: 2, percentage: '100%', participants: people, startSlotIndex: 22, endSlotIndex: 22,
      })
    }
    data.locationVote.locations = [
      { name: 'Manhattan (Midtown or Lower)', voters: people },
      { name: 'North Brooklyn', voters: people.slice(1) },
      { name: 'Queens', voters: [] },
    ].map(({ name, voters }, index) => ({
      id: String(index), name, voters, displayOrder: index, voteCount: voters.length, percentage: `${voters.length * 50}%`,
    }))
    return data
  },
})
await new Promise(resolve => fixture.server.listen(0, '127.0.0.1', resolve))
const api = `http://127.0.0.1:${fixture.server.address().port}`
const port = Number(process.env.RESULT_VOTERS_PORT || 4374)
const origin = `http://127.0.0.1:${port}`
const resultUrl = `${origin}/meetings/result-time-location`
const app = spawn(process.execPath, ['--import', './scripts/fixture-ssr-loader.mjs', 'dist/server/entry.mjs'], {
  env: { ...process.env, HOST: '127.0.0.1', PORT: String(port), PREFLIGHT_FIXTURE_API: api }, stdio: ['ignore', 'pipe', 'pipe'],
})
let logs = ''
for (const stream of [app.stdout, app.stderr]) {
  stream.on('data', (chunk) => {
    logs += chunk
  })
}

async function captureResult (page, panel, pathname) {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await page.mouse.move(0, 0)
  await page.evaluate(() => document.fonts.ready)
  const content = await panel.boundingBox()
  const tabs = await page.getByRole('tablist').boundingBox()
  const x = Math.max(0, Math.floor(content.x - 16))
  const y = Math.max(0, Math.floor(tabs.y - 8))
  const right = Math.min(page.viewportSize().width, Math.ceil(content.x + content.width + 16))
  const actions = await page.locator('[class*="ResultActions"]').boundingBox()
  const bottom = Math.ceil((page.viewportSize().width < 900 ? actions.y + actions.height : content.y + content.height) + 16)
  await page.screenshot({ path: pathname, clip: { x, y, width: right - x, height: bottom - y } })
}

let browser
let activeCase = 'server startup'
try {
  await waitForServer(resultUrl, app, { logs: () => logs })
  browser = await chromium.launch()

  for (const locale of locales) {
    const messages = JSON.parse(fs.readFileSync(`src/i18n/locales/${locale}.json`, 'utf8'))
    for (const width of widths) {
      const context = await browser.newContext({ viewport: { width, height: 1000 } })
      const page = await context.newPage()
      await context.route(`${origin}/api/**`, async (route) => {
        const url = new URL(route.request().url())
        if (url.pathname.endsWith('/v1/auth/me')) return route.fulfill({ json: { success: true, data: null } })
        const response = await route.fetch({ url: api + url.pathname + url.search })
        return route.fulfill({ response })
      })
      const response = await page.goto(`${resultUrl}?lang=${locale}`, { waitUntil: 'domcontentloaded' })
      expect(response.status()).toBe(200)

      for (const tab of ['summary', 'location']) {
        activeCase = `${locale}/${width}/${tab}`
        if (tab === 'location') await page.getByRole('tab', { name: messages.meeting.result.tabs.location, exact: true }).click()
        const panel = page.getByRole('tabpanel')
        await expect(panel).toBeVisible()
        const first = panel.locator('li').filter({ hasText: 'Manhattan (Midtown or Lower)' })
        const second = panel.locator('li').filter({ hasText: 'North Brooklyn' })
        const zero = panel.locator('li').filter({ hasText: 'Queens' })
        const forms = messages.meeting.result.voteCount
        const plural = new Intl.PluralRules(locale === 'pcm' ? 'en-NG' : locale)
        for (const [row, count] of [[first, 2], [second, 1], [zero, 0]]) {
          const format = typeof forms === 'string' ? forms : forms[plural.select(count)] ?? forms.other
          await expect(row).toContainText(format.replace('{count}', String(count)).replace('{percentage}', `${count * 50}%`))
        }
        await expect(first.getByText('Alex Kim', { exact: true })).toBeHidden()
        await expect(second.getByText('Sam Lee', { exact: true })).toBeHidden()
        await expect(zero.locator('summary')).toHaveCount(0)

        const trigger = first.locator('summary')
        const scheduleToggle = panel.locator('[data-decision-option] summary')
        const toggleStyle = locator => locator.evaluate((element) => {
          const { backgroundColor, borderRadius, paddingInline, minHeight } = getComputedStyle(element)
          return { backgroundColor, borderRadius, paddingInline, minHeight }
        })
        const closedPlaceStyle = await toggleStyle(trigger)
        expect(closedPlaceStyle.backgroundColor).toBe('rgba(0, 0, 0, 0)')
        const capture = output && ['ko', 'de', 'ar'].includes(locale) && tab === 'summary' && width !== 320
        if (tab === 'summary') {
          await expect(panel.getByText(messages.meeting.result.actions.inProgress, { exact: true })).toBeVisible()
          await expect(panel.getByText(messages.meeting.result.decision.basis, { exact: true })).toHaveCount(0)
          await expect(panel.getByRole('list', { name: messages.meeting.result.bestTimesTitle, exact: true })).toHaveCSS('border-block-start-width', '1px')
          const actions = page.locator('[class*="ResultActions"]')
          const vote = actions.getByRole('link', { name: messages.meeting.result.buttons.enterAvailability, exact: true })
          await expect(vote).toBeVisible()
          const voteBox = await vote.boundingBox()
          const panelBox = await panel.boundingBox()
          if (width < 900) expect(voteBox.y).toBeGreaterThanOrEqual(panelBox.y + panelBox.height)
          else expect(voteBox.y).toBeLessThan(panelBox.y + panelBox.height)
          const dateLabel = panel.locator('h3 > time').first()
          await expect(dateLabel).toHaveAttribute('datetime', /^2026-12-0[89]$/)
          await expect(dateLabel).toHaveCSS('border-top-width', '0px')
          const scheduleHeight = (await scheduleToggle.boundingBox()).height
          expect(scheduleHeight).toBeGreaterThanOrEqual(44)
          expect(scheduleHeight).toBeLessThanOrEqual(56)
          expect(await toggleStyle(scheduleToggle)).toEqual(closedPlaceStyle)
          await scheduleToggle.click()
          const heading = panel.getByRole('heading', { name: messages.meeting.result.summarySections.location, exact: true })
          const gaps = await heading.evaluate((element) => {
            const section = element.parentElement
            const divider = section.getBoundingClientRect().top
            const contentEnd = section.previousElementSibling.getBoundingClientRect().bottom
            return [Math.round(divider - contentEnd), Math.round(element.getBoundingClientRect().top - divider - parseFloat(getComputedStyle(section).borderBlockStartWidth))]
          })
          expect(gaps).toEqual([24, 24])
          const names = panel.locator('[data-decision-option]').getByRole('listitem')
          const betweenNames = await names.evaluateAll(([firstName, secondName]) => {
            const first = firstName.getBoundingClientRect(), second = secondName.getBoundingClientRect()
            return Math.round(Math.max(second.left - first.right, first.left - second.right))
          })
          expect(betweenNames).toBe(8)
          if (capture) {
            fs.mkdirSync(output, { recursive: true })
            await captureResult(page, panel, `${output}/${locale}-${width}-collapsed.png`)
          }
        }

        await expect(trigger).toContainText('100%')
        const box = await trigger.boundingBox()
        expect(box.height).toBeGreaterThanOrEqual(44)
        await trigger.click()
        await expect(first.getByRole('list', { name: messages.locationVote.voters })).toBeVisible()
        await expect(first.getByText('Alex Kim', { exact: true })).toBeVisible()
        await expect(first.getByText('Sam Lee', { exact: true })).toBeVisible()
        await expect(second.getByText('Sam Lee', { exact: true })).toBeHidden()
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)

        if (tab === 'summary') {
          expect(await toggleStyle(scheduleToggle)).toEqual(await toggleStyle(trigger))
          expect((await toggleStyle(trigger)).backgroundColor).not.toBe(closedPlaceStyle.backgroundColor)
          const schedule = panel.locator('[data-decision-option] details')
          const location = first.locator('details')
          const scheduleList = await schedule.locator('ul').elementHandle()
          const [locationNames, scheduleNames] = await location.locator('ul').evaluate(async (list, other) => {
            await document.fonts.ready
            const positions = (root) => {
              const bounds = root.getBoundingClientRect()
              const rtl = getComputedStyle(root).direction === 'rtl'
              return Array.from(root.querySelectorAll('bdi'), (name) => {
                const nameBounds = name.getBoundingClientRect()
                return Math.round(rtl ? bounds.right - nameBounds.right : nameBounds.left - bounds.left)
              })
            }
            return [positions(list), positions(other)]
          }, scheduleList)
          await scheduleList.dispose()
          expect(locationNames).toEqual(scheduleNames)

          const afterSchedule = panel.getByRole('heading', { name: messages.meeting.result.summarySections.location, exact: true }).locator('..')
          for (const [details, next] of [[schedule, afterSchedule], [location, second.locator('summary')]]) {
            const toggle = await details.locator('summary').boundingBox()
            const names = await details.locator('ul').boundingBox()
            const following = await next.boundingBox()
            const gaps = [Math.round(names.y - toggle.y - toggle.height), Math.round(following.y - names.y - names.height)]
            const expectedGap = width >= 900 ? 24 : 16
            expect(gaps).toEqual([expectedGap, next === afterSchedule ? 24 : expectedGap + 1])
          }
        }

        if (capture) await captureResult(page, panel, `${output}/${locale}-${width}-expanded.png`)

        await trigger.focus()
        await page.keyboard.press('Shift+Tab')
        await page.keyboard.press('Tab')
        await expect(trigger).toBeFocused()
        await expect(trigger).toHaveCSS('outline-width', '2px')
        await trigger.press('Enter')
        await expect(first.getByText('Alex Kim', { exact: true })).toBeHidden()
        await second.locator('summary').click()
        await expect(second.getByText('Sam Lee', { exact: true })).toBeVisible()
        await expect(second.getByText('Alex Kim', { exact: true })).toHaveCount(0)
      }
      await context.unrouteAll({ behavior: 'wait' })
      await context.close()
    }
    console.log(`${locale}: 320/390/1280 passed`)
  }
  for (const locale of locales.filter(value => ['ko', 'de', 'ar'].includes(value))) {
    const messages = JSON.parse(fs.readFileSync(`src/i18n/locales/${locale}.json`, 'utf8')).meeting
    for (const [role, userId] of [['responded', 2], ['host', 3]]) {
      activeCase = `${locale}/320/${role}`
      const context = await browser.newContext({ viewport: { width: 320, height: 900 } })
      await context.route(`${origin}/api/**`, async (route) => {
        const url = new URL(route.request().url())
        if (url.pathname.endsWith('/v1/auth/me')) {
          return route.fulfill({ json: { success: true, data: { userId, username: 'Casey', provider: 'ANONYMOUS', role: 'USER' } } })
        }
        return route.fulfill({ response: await route.fetch({ url: api + url.pathname + url.search }) })
      })
      const page = await context.newPage()
      await page.goto(`${resultUrl}?lang=${locale}`, { waitUntil: 'domcontentloaded' })
      const toolbar = page.locator('[data-summary-toolbar]')
      const vote = page.locator('[class*="ResultActions"]').getByRole('link', { name: messages.result.buttons[role === 'responded' ? 'editAvailability' : 'enterAvailability'], exact: true })
      await expect(vote).toHaveClass(/_secondary_/)
      await expect(vote).toBeVisible()
      if (role === 'host') {
        await expect(toolbar).toHaveAttribute('data-confirm-primary', 'true')
        await expect(page.locator('#meeting-confirm-action button')).toBeHidden()
        await toolbar.getByRole('button', { name: messages.result.decision.setMeeting, exact: true }).click()
        const dialog = page.getByRole('alertdialog')
        await expect(dialog).toBeVisible()
        await dialog.getByRole('button', { name: messages.confirmDialog.cancel, exact: true }).click()
        await expect(dialog).toBeHidden()
        await page.getByRole('tab', { name: messages.result.tabs.calendar, exact: true }).click()
        await expect(page.locator('#meeting-confirm-action button')).toBeVisible()
      }
      await page.goto(`${resultUrl}-confirmed?lang=${locale}`, { waitUntil: 'domcontentloaded' })
      await expect(page.locator('[data-confirmed="true"]').first()).toBeVisible()
      await expect(page.locator('[data-summary-toolbar]')).toHaveCount(0)
      await context.unrouteAll({ behavior: 'wait' })
      await context.close()
    }
  }
  activeCase = 'time options grouped by date'
  const groupedContext = await browser.newContext()
  await groupedContext.route(`${origin}/api/**`, async (route) => {
    const url = new URL(route.request().url())
    if (url.pathname.endsWith('/v1/auth/me')) return route.fulfill({ json: { success: true, data: null } })
    return route.fulfill({ response: await route.fetch({ url: api + url.pathname + url.search }) })
  })
  const grouped = await groupedContext.newPage()
  await grouped.goto(`${resultUrl}-grouped?lang=ko`, { waitUntil: 'domcontentloaded' })
  const dateHeading = grouped.getByRole('tabpanel').locator('h3 > time')
  await expect(dateHeading).toHaveCount(1)
  const dateGroup = dateHeading.locator('../..')
  const timeOptions = dateGroup.locator('[data-decision-option]')
  await expect(timeOptions).toHaveCount(2)
  await expect(timeOptions.last()).toHaveCSS('border-block-start-width', '0px')
  const timeSummary = timeOptions.first().locator('summary')
  const dateLabelBox = await dateHeading.boundingBox()
  const timeLabelBox = await timeSummary.locator('bdi').boundingBox()
  expect(Math.abs(timeLabelBox.x - dateLabelBox.x)).toBeLessThan(1)
  await expect(dateHeading.locator('..')).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
  await timeSummary.press('Enter')
  await expect(timeOptions.first().getByText('Alex Kim', { exact: true })).toBeVisible()
  await expect(timeOptions.last().getByText('Alex Kim', { exact: true })).toBeHidden()
  activeCase = 'partial availability keeps its explanation'
  const korean = JSON.parse(fs.readFileSync('src/i18n/locales/ko.json', 'utf8'))
  await grouped.goto(`${resultUrl}-partial?lang=ko`, { waitUntil: 'domcontentloaded' })
  const partial = grouped.locator('[data-decision-state="partial"]')
  await expect(partial.getByText(korean.meeting.result.decision.notAll, { exact: true })).toBeVisible()
  await groupedContext.unrouteAll({ behavior: 'wait' })
  await groupedContext.close()

  activeCase = 'mobile WebKit date result status stays on one line'
  const safari = await webkit.launch()
  try {
    const { deviceScaleFactor, hasTouch, isMobile, userAgent } = devices['iPhone 14']
    const page = await safari.newPage({
      deviceScaleFactor, hasTouch, isMobile, userAgent, viewport: { width: 393, height: 852 }, locale: 'ko',
    })
    await page.route(`${origin}/api/**`, async (route) => {
      const url = new URL(route.request().url())
      if (url.pathname.endsWith('/v1/auth/me')) return route.fulfill({ json: { success: true, data: null } })
      return route.fulfill({ response: await route.fetch({ url: api + url.pathname + url.search }) })
    })
    await page.goto(`${origin}/meetings/result-day-status?lang=ko`)
    const status = page.getByRole('tabpanel').getByText(korean.meeting.result.actions.inProgress, { exact: true })
    await expect(status).toBeVisible()
    await page.evaluate(() => document.fonts.ready)
    const lines = await status.evaluate((element) => {
      const text = document.createRange()
      text.selectNodeContents(element)
      return new Set(Array.from(text.getClientRects(), rect => Math.round(rect.top))).size
    })
    expect(lines).toBe(1)
    await page.unrouteAll({ behavior: 'wait' })
  } finally {
    await safari.close()
  }

  expect(fixture.mutations).toEqual([])
  if (output) {
    fs.mkdirSync(output, { recursive: true })
    fs.writeFileSync(`${output}/verification.json`, JSON.stringify({ passed: true, locales, widths, tabs: ['summary', 'location'] }, null, 2))
  }
} catch (error) {
  console.error(`Result location voters failed in ${activeCase}`)
  if (output) {
    fs.mkdirSync(output, { recursive: true })
    fs.writeFileSync(`${output}/server.log`, logs)
  }
  throw error
} finally {
  await browser?.close()
  app.kill('SIGTERM')
  await new Promise(resolve => fixture.server.close(resolve))
}
