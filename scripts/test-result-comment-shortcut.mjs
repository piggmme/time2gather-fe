import { chromium, devices, expect, webkit } from '@playwright/test'
import { spawn } from 'node:child_process'
import { mkdir, readdir, readFile } from 'node:fs/promises'
import { createNavigationFixture } from './navigation-fixture.mjs'
import { waitForServer } from './wait-for-server.mjs'

const output = process.env.RESULT_SHORTCUT_OUTPUT
const locales = process.env.QA_LOCALES?.split(',') ?? (await readdir('src/i18n/locales'))
  .filter(file => file.endsWith('.json')).map(file => file.slice(0, -5))
const sample = ['ko', 'de', 'ar']
const fixture = createNavigationFixture({
  transformMeeting (data) {
    data.meeting.title = 'December Meetup'
    data.meeting.description = ''
    data.meeting.host.username = 'Erin'
    data.meeting.timezone = 'America/New_York'
    const date = '2026-12-08'
    const people = ['Erin', 'June', 'Sam', 'Alex'].map((username, i) => ({ userId: i + 1, username, profileImageUrl: '' }))
    data.meeting.availableDates = { [date]: ['18:00'] }
    data.participants = people
    data.schedule = { [date]: { '18:00': { count: 4, participants: people } } }
    data.summary = {
      totalParticipants: 4,
      bestSlots: [{
        date, time: '18:00', startSlotIndex: 18, endSlotIndex: 18, count: 4, percentage: '100%', participants: people,
      }],
    }
    data.locationVote.locations = ['Manhattan (Midtown or Lower)', 'North Brooklyn'].map((name, i) => ({
      id: String(i), name, voters: i ? people.slice(0, 1) : people,
      voteCount: i ? 1 : 4, percentage: i ? '25%' : '100%', displayOrder: i,
    }))
    return data
  },
})
await new Promise(resolve => fixture.server.listen(0, '127.0.0.1', resolve))
const api = `http://127.0.0.1:${fixture.server.address().port}`
const port = Number(process.env.RESULT_SHORTCUT_PORT || 4393)
const origin = `http://127.0.0.1:${port}`
const resultUrl = origin + '/meetings/result-time-location'
const app = spawn(process.execPath, ['--import', './scripts/fixture-ssr-loader.mjs', 'dist/server/entry.mjs'], {
  env: { ...process.env, HOST: '127.0.0.1', PORT: String(port), PREFLIGHT_FIXTURE_API: api },
  stdio: 'ignore',
})

try {
  await waitForServer(resultUrl, app)
  if (output) await mkdir(output, { recursive: true })
  for (const [engine, launcher] of [['chromium', chromium], ['webkit', webkit]]) {
    const browser = await launcher.launch()
    try {
      for (const locale of locales) {
        const messages = JSON.parse(await readFile(`src/i18n/locales/${locale}.json`, 'utf8'))
        const widths = sample.includes(locale) ? [320, 393, 699, 700, 1280] : [320, 393, 1280]
        for (const width of widths) {
          const { deviceScaleFactor, hasTouch, isMobile, userAgent } = devices['iPhone 14']
          const mobile = width < 700 ? { deviceScaleFactor, hasTouch, isMobile, userAgent } : {}
          const context = await browser.newContext({
            ...mobile, locale, viewport: { width, height: 1000 }, timezoneId: 'America/New_York', reducedMotion: 'reduce',
          })
          let showComments
          const ready = new Promise((resolve) => {
            showComments = resolve
          })
          try {
            await context.route(`${origin}/api/**`, async (route) => {
              const url = new URL(route.request().url())
              if (url.pathname.endsWith('/auth/me')) return route.fulfill({ json: { success: true, data: null } })
              if (url.pathname.endsWith('/comments/summary')) {
                await ready
                return route.fulfill({ json: { success: true, data: { version: 1, count: 1, viewerId: null, writable: false } } })
              }
              return route.fulfill({ response: await route.fetch({ url: api + url.pathname + url.search }) })
            })
            const page = await context.newPage()
            await page.goto(`${resultUrl}?lang=${locale}`, { waitUntil: 'domcontentloaded' })
            const tabs = page.getByRole('tablist')
            const panel = page.getByRole('tabpanel')
            const title = panel.getByRole('heading', { level: 2 }).first()
            const shortcut = page.getByRole('link', { name: messages.comments.title, exact: true })
            await expect(title, `${engine}/${locale}/${width}: result did not hydrate`).toBeVisible({ timeout: 20000 })
            await expect(shortcut).toHaveCount(0)
            await page.evaluate(() => document.fonts.ready)
            const titleBefore = await title.boundingBox()
            showComments()
            await expect(shortcut).toBeVisible()
            const titleAfter = await title.boundingBox()
            expect(Math.abs(titleAfter.y - titleBefore.y), `${engine}/${locale}/${width}: result heading moved`).toBeLessThanOrEqual(1)
            await expect(shortcut).toHaveText('')
            const icon = await shortcut.boundingBox()
            const rail = await tabs.boundingBox()
            expect(icon.width).toBeGreaterThanOrEqual(44)
            expect(icon.height).toBeGreaterThanOrEqual(44)
            expect(icon.y).toBeLessThan(rail.y + rail.height)
            expect(icon.y + icon.height).toBeGreaterThan(rail.y)
            expect(Math.min(icon.x + icon.width, rail.x + rail.width) - Math.max(icon.x, rail.x)).toBeLessThanOrEqual(1)
            expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
            if (output && engine === 'webkit' && sample.includes(locale) && [393, 1280].includes(width)) {
              const box = await panel.boundingBox()
              await page.screenshot({
                path: `${output}/${locale}-${width}.png`, fullPage: true, scale: 'css',
                clip: { x: Math.max(0, box.x - 16), y: rail.y - 8, width: Math.min(width, box.width + 32), height: box.y + box.height - rail.y + 24 },
              })
            }
            const nextTabs = tabs.locator('..').getByRole('button', { name: messages.common.next, exact: true })
            if (await nextTabs.isVisible()) {
              const offset = await tabs.evaluate(element => element.scrollLeft)
              await nextTabs.click()
              await expect.poll(() => tabs.evaluate(element => element.scrollLeft)).not.toBe(offset)
            }
            await shortcut.focus()
            await shortcut.press('Enter')
            await expect(page).toHaveURL(/#comments$/)
            const lastTab = tabs.getByRole('tab').last()
            await lastTab.focus()
            await lastTab.press('Enter')
            await expect(lastTab).toHaveAttribute('aria-selected', 'true')
            await expect(shortcut).toHaveCount(0)
          } finally {
            showComments()
            await context.unrouteAll({ behavior: 'wait' })
            await context.close()
          }
        }
        console.log(`${engine}/${locale}: ${widths.join(', ')} passed`)
      }
    } finally {
      await browser.close()
    }
  }
  expect(fixture.mutations).toEqual([])
} finally {
  app.kill('SIGTERM')
  await new Promise(resolve => fixture.server.close(resolve))
}
