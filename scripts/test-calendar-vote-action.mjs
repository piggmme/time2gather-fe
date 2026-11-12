import { chromium, expect } from '@playwright/test'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import { createNavigationFixture } from './navigation-fixture.mjs'

const output = process.env.CALENDAR_VOTE_OUTPUT || 'artifacts/calendar-vote-action-20261113'
fs.mkdirSync(output, { recursive: true })
const fixture = createNavigationFixture({
  transformMeeting: (data, code) => {
    data = structuredClone(data)
    if (code.includes('unavailable')) {
      data.participants[0].availabilityResponse = 'NONE'
      data.schedule = {}
    }
    if (code.includes('confirmed')) data.meeting.confirmedDate = '2026-11-15'
    return data
  },
})
await new Promise(resolve => fixture.server.listen(0, '127.0.0.1', resolve))
const api = `http://127.0.0.1:${fixture.server.address().port}/api`
const port = Number(process.env.CALENDAR_VOTE_PORT || 4363)
const base = `${process.env.CALENDAR_VOTE_SCHEME || 'https'}://127.0.0.1:${port}`
const app = spawn('node', ['node_modules/astro/astro.js', 'dev', '--host', '127.0.0.1', '--port', String(port)], {
  env: { ...process.env, API_URL: api, PUBLIC_API_URL: api }, stdio: ['ignore', 'pipe', 'pipe'],
})
let logs = ''
app.stdout.on('data', (chunk) => {
  logs += chunk
})
app.stderr.on('data', (chunk) => {
  logs += chunk
})
const browser = await chromium.launch({ headless: true })
const locales = process.env.QA_LOCALES?.split(',') || fs.readdirSync('src/i18n/locales').filter(f => f.endsWith('.json')).map(f => f.slice(0, -5))
const results = []
try {
  const ready = await browser.newContext({ ignoreHTTPSErrors: true })
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
    for (const width of [320, 390, 1280]) {
      const context = await browser.newContext({
        ignoreHTTPSErrors: true, viewport: { width, height: 900 }, isMobile: width < 900, hasTouch: width < 900, reducedMotion: 'reduce',
      })
      await context.route(/googletagmanager|google-analytics|firestore.googleapis|firebaseinstallations.googleapis/, route => route.abort())
      const page = await context.newPage()
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      for (const mode of ['time', 'day']) {
        for (const state of ['new', 'edit', 'unavailable', 'confirmed']) {
          await context.route('**/v1/auth/me', route => route.fulfill({
            json: {
              success: true, data: { userId: state === 'new' ? 2 : 1, username: 'Alex', provider: 'ANONYMOUS', role: 'USER' },
            },
          }))
          const code = `calendar-${mode}-${state}`
          await page.goto(`${base}/meetings/${code}?lang=${locale}`)
          await page.addStyleTag({ content: 'astro-dev-toolbar { display:none !important; }' })
          await page.getByRole('tab', { name: messages.meeting.result.tabs.calendar, exact: true }).click()
          const panel = page.getByRole('tabpanel')
          const action = panel.getByRole('link', { name: messages.meeting.result.buttons[state === 'new' ? 'enterAvailability' : 'editAvailability'], exact: true })
          if (state === 'confirmed') {
            await expect(panel.locator('a[href*="/select/"]')).toHaveCount(0)
          } else if (width < 900) {
            await expect(action).toBeVisible()
            await expect(action).toHaveAttribute('href', new RegExp(`^/meetings/${code}/select/${mode === 'time' ? 'time' : 'all_day'}(?:\\?lang=${locale})?$`))
            const box = await action.boundingBox()
            expect(box.height).toBeGreaterThanOrEqual(44)
            const cells = panel.locator(mode === 'time' ? 'button[data-time-index]' : 'button[aria-label="2026-11-15"]')
            expect(box.y + box.height).toBeLessThanOrEqual((await cells.first().boundingBox()).y)
            if (['ko', 'de', 'ar'].includes(locale) && state === 'new') {
              await page.evaluate(() => document.fonts.ready)
              await page.screenshot({ path: `${output}/${locale}-${mode}-${width}.png` })
            }
            // Display filters must not change whose saved response determines the label.
            await panel.locator('fieldset input[type="checkbox"]').first().uncheck()
            await expect(action).toBeVisible()
            if (locale === 'ko' && width === 390 && ['new', 'edit'].includes(state)) {
              await action.tap()
              await expect(page).toHaveURL(new RegExp(`/select/${mode === 'time' ? 'time' : 'all_day'}(?:[?#].*)?$`))
              if (state === 'new') {
                const cell = page.locator(mode === 'time' ? 'button[data-date-key="2026-11-15"][data-time-index="0"]' : 'button[aria-label="2026-11-15"]')
                await expect(cell).toHaveAttribute('aria-pressed', 'false')
                await cell.tap()
                await expect(cell).toHaveAttribute('aria-pressed', 'true')
              }
              await expect(page.getByRole('button', { name: messages.common.submit, exact: true })).toBeEnabled()
              const before = fixture.mutations.length
              await page.getByRole('button', { name: messages.common.submit, exact: true }).click()
              await expect(page).toHaveURL(new RegExp(`/meetings/${code}(?:[?#].*)?$`))
              const saved = fixture.mutations.slice(before).find(write => write.path.endsWith('/selections'))
              expect(saved.body.selections.length).toBeGreaterThan(0)
              if (state === 'new') expect(saved.body.selections).toEqual([{ date: '2026-11-15', type: mode === 'time' ? 'TIME' : 'ALL_DAY', times: mode === 'time' ? ['09:00'] : [] }])
              await expect(page.getByRole('tab', { name: messages.meeting.result.tabs.calendar, exact: true })).toHaveAttribute('aria-selected', 'true')
            }
          } else {
            await expect(action).toBeHidden()
            await expect(page.locator('a[href*="/select/"]:visible')).toHaveCount(1)
            if (['ko', 'de', 'ar'].includes(locale) && state === 'new') {
              await page.evaluate(() => document.fonts.ready)
              await page.screenshot({ path: `${output}/${locale}-${mode}-${width}.png` })
            }
          }
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
          results.push({ locale, width, mode, state })
          await context.unroute('**/v1/auth/me')
        }
      }
      expect(errors).toEqual([])
      await context.close()
    }
    console.log(`PASS ${locale}: 320/390/1280, time/dates, new/edit/unavailable/confirmed`)
  }
  fs.writeFileSync(`${output}/verification.json`, JSON.stringify({ results, writes: fixture.mutations }, null, 2))
} catch (error) {
  fs.writeFileSync(`${output}/server.log`, logs)
  throw error
} finally {
  await browser.close()
  app.kill('SIGTERM')
  await new Promise(resolve => fixture.server.close(resolve))
}
