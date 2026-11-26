import { chromium, expect, webkit } from '@playwright/test'
import { spawn } from 'node:child_process'
import { mkdir, readdir, readFile } from 'node:fs/promises'
import { createNavigationFixture } from './navigation-fixture.mjs'
import { waitForServer } from './wait-for-server.mjs'

function gate () {
  let resolve
  const promise = new Promise((done) => {
    resolve = done
  })
  return { promise, resolve }
}

const output = process.env.COMMENT_LOADING_OUTPUT
const locales = process.env.QA_LOCALES?.split(',') ?? (await readdir('src/i18n/locales'))
  .filter(file => file.endsWith('.json')).map(file => file.slice(0, -5))
const fixture = createNavigationFixture()
await new Promise(resolve => fixture.server.listen(0, '127.0.0.1', resolve))
const api = `http://127.0.0.1:${fixture.server.address().port}`
const port = Number(process.env.COMMENT_LOADING_PORT || 4394)
const origin = `http://127.0.0.1:${port}`
const code = 'result-time-location'
const resultUrl = `${origin}/meetings/${code}`
const app = spawn(process.execPath, ['--import', './scripts/fixture-ssr-loader.mjs', 'dist/server/entry.mjs'], {
  env: { ...process.env, HOST: '127.0.0.1', PORT: String(port), PREFLIGHT_FIXTURE_API: api },
  stdio: 'ignore',
})
const comment = {
  id: 'first', author: { id: '2', name: 'June', avatar: null, host: false },
  rootId: null, replyToId: null, replyTo: null, body: 'See you Saturday!',
  mentions: [], createdAt: Date.UTC(2026, 10, 26), edited: false, status: 'ACTIVE', replyCount: 0,
  canEdit: false, canDelete: false, canHide: false,
}
const sampleLocales = ['ko', 'de', 'ar']
const engines = [['chromium', chromium], ['webkit', webkit]]

try {
  await waitForServer(resultUrl, app)
  if (output) await mkdir(output, { recursive: true })
  for (const [engine, launcher] of engines) {
    const browser = await launcher.launch()
    try {
      for (const locale of locales) {
        const messages = JSON.parse(await readFile(`src/i18n/locales/${locale}.json`, 'utf8'))
        for (const width of sampleLocales.includes(locale) ? [320, 390, 1280] : [390, 1280]) {
          const context = await browser.newContext({ locale, viewport: { width, height: 950 }, reducedMotion: 'reduce' })
          const session = gate()
          const summary = gate()
          const list = gate()
          const people = gate()
          const activity = gate()
          let activityRequests = 0
          let sessionRequests = 0
          let listRequests = 0
          const returning = width !== 1280
          try {
            if (returning) {
              await context.addInitScript(({ code }) => localStorage.setItem(`comments-seen:${code}:1`, '1'), { code })
            }
            await context.route(`${origin}/api/**`, async (route) => {
              const url = new URL(route.request().url())
              const success = data => route.fulfill({ json: { success: true, data } })
              if (url.pathname.endsWith('/auth/me')) {
                sessionRequests++
                await session.promise
                return success({ userId: 1, username: 'Alex', provider: 'ANONYMOUS', role: 'USER' })
              }
              if (url.pathname.endsWith('/comments/summary')) {
                await summary.promise
                return success({ version: 2, count: 1, viewerId: '1', writable: true })
              }
              if (url.pathname.endsWith('/comments')) {
                listRequests++
                await list.promise
                return success({ items: [comment], nextCursor: null })
              }
              if (url.pathname.endsWith('/comments/people')) {
                await people.promise
                return success([])
              }
              if (url.pathname.endsWith('/comments/activity')) {
                activityRequests++
                await activity.promise
                return success([{ id: comment.id, rootId: null, mentioned: true }])
              }
              return route.fulfill({ response: await route.fetch({ url: api + url.pathname + url.search }) })
            })
            const page = await context.newPage()
            await page.goto(`${resultUrl}?lang=${locale}`, { waitUntil: 'domcontentloaded' })
            const section = page.locator('#comments')
            const title = section.getByRole('heading', { level: 2 })
            const loading = section.getByText(messages.common.loading, { exact: true })
            await expect(section).toBeVisible({ timeout: 20000 })
            await expect(loading).toHaveCount(0)
            await expect(title).toHaveText(messages.comments.title)
            await expect(section.locator('[aria-busy=true]')).toHaveCount(1)
            await expect.poll(() => sessionRequests).toBeGreaterThan(0)
            summary.resolve()
            await expect.poll(() => listRequests).toBe(1)
            await expect(title).toHaveText(`${messages.comments.title} 1`)
            if (returning) await expect.poll(() => activityRequests).toBe(1)
            if (output && engine === 'webkit' && locale === 'ko' && width === 390) {
              await page.evaluate(() => document.fonts.ready)
              await section.screenshot({ path: `${output}/ko-390-loading.png`, scale: 'css' })
            }
            list.resolve()
            await expect(section.getByText(comment.body)).toBeVisible()
            await expect(section.locator('[aria-busy=true]')).toHaveCount(0)
            await expect(loading).toHaveCount(0)
            expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
            if (output && engine === 'webkit' && sampleLocales.includes(locale) && [390, 1280].includes(width)) {
              await page.evaluate(() => document.fonts.ready)
              await section.screenshot({ path: `${output}/${locale}-${width}.png`, scale: 'css' })
            }
            const submit = section.getByRole('button', { name: messages.comments.post, exact: true })
            await section.getByRole('textbox').fill('See you then!')
            await expect(submit).toBeDisabled()
            session.resolve()
            people.resolve()
            activity.resolve()
            await expect(submit).toBeEnabled()
            expect(listRequests).toBe(1)
            if (returning) {
              await expect(section.getByRole('button', { name: messages.comments.mentioned })).toBeVisible()
            } else {
              expect(activityRequests).toBe(0)
            }
          } finally {
            for (const response of [session, summary, list, people, activity]) response.resolve()
            await context.unrouteAll({ behavior: 'wait' })
            await context.close()
          }
        }
        console.log(`${engine}/${locale}: comment loading passed`)
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
