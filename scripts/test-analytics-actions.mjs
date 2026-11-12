import assert from 'node:assert/strict'
import fs from 'node:fs'
import { spawn } from 'node:child_process'
import { chromium, expect } from '@playwright/test'
import { createNavigationFixture } from './navigation-fixture.mjs'

// Real Astro/React screens, local in-memory API, intercepted analytics requests.
// The production-looking browser origin only exercises the hostname guard;
// every request to it is fulfilled from the local dev server or API fixture.
const origin = 'https://time2gather.org'
const local = `${fs.existsSync('certs/time2gather-key.pem') ? 'https' : 'http'}://127.0.0.1:19482`
const responses = new Set()
const fixture = createNavigationFixture({ transformMeeting: (data, code) => {
  if (responses.has(code)) data.participants.push({ userId: 2, username: 'Private participant', availabilityResponse: 'NONE' })
  return data
} })
await new Promise(resolve => fixture.server.listen(0, '127.0.0.1', resolve))
const api = `http://127.0.0.1:${fixture.server.address().port}`
const dev = spawn(process.execPath, ['node_modules/astro/astro.js', 'dev', '--host', '127.0.0.1', '--port', '19482'], {
  env: { ...process.env, API_URL: `${api}/api`, PUBLIC_API_URL: '/api' }, stdio: ['ignore', 'pipe', 'pipe'],
})
let logs = ''
dev.stdout.on('data', chunk => { logs += chunk })
dev.stderr.on('data', chunk => { logs += chunk })
let browser
try {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => { clearInterval(poll); reject(new Error(logs)) }, 30000)
    const poll = setInterval(() => {
      if (/Local\s+https?:/.test(logs)) { clearInterval(poll); clearTimeout(timer); resolve() }
      else if (dev.exitCode !== null) { clearInterval(poll); clearTimeout(timer); reject(new Error(logs)) }
    }, 100)
  })
  browser = await chromium.launch({ channel: 'chrome', headless: true })
  const t = JSON.parse(fs.readFileSync('src/i18n/locales/ko.json', 'utf8'))
  for (const width of [390, 1280]) {
    const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width, height: 900 }, locale: 'ko-KR' })
    await context.routeWebSocket('**/*', socket => socket.close())
    await context.route('**/*', route => route.abort())
    let fail = false
    let share = 'cancelled'
    let viewer = 2
    const writes = []
    await context.route(`${origin}/**`, async route => {
      const request = route.request()
      const url = new URL(request.url())
      if (url.pathname.startsWith('/api/')) {
        if (request.method() !== 'GET') {
          writes.push(url.pathname)
          if (fail && !url.pathname.endsWith('/profile')) return route.fulfill({ status: 500, json: { success: false, messageKey: 'error.internal' } })
          if (url.pathname.endsWith('/unavailable') || url.pathname.endsWith('/selections')) responses.add(url.pathname.split('/')[4])
        }
        if (url.pathname.endsWith('/auth/me')) return route.fulfill({ json: { success: true, data: { userId: viewer, username: 'Private participant', provider: 'ANONYMOUS', role: 'USER' } } })
        if (/\/meetings\/nav-(day|time)$/.test(url.pathname)) {
          const response = await route.fetch({ url: api + url.pathname + url.search })
          const json = await response.json()
          return route.fulfill({ json })
        }
        const response = await route.fetch({ url: api + url.pathname + url.search })
        return route.fulfill({ response })
      }
      const response = await route.fetch({ url: local + url.pathname + url.search, ignoreHTTPSErrors: true })
      return route.fulfill({ response })
    })
    await context.route('https://www.googletagmanager.com/**', route => route.fulfill({ contentType: 'text/javascript', body: '' }))
    await context.addInitScript(() => {
      localStorage.setItem('time2gather:analytics-debug', '1')
      Object.defineProperty(navigator, 'share', { configurable: true, value: async () => {
        if (window.testShare === 'cancelled') throw new DOMException('Cancelled', 'AbortError')
        if (window.testShare === 'copied') throw new Error('Not available')
      } })
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => {} } })
      window.testShare = 'cancelled'
    })
    const page = await context.newPage()
    const errors = []
    let expectedCreationErrors = 0
    page.on('pageerror', error => {
      // The existing creation form lets its injected API rejection propagate.
      if (error.name === 'AxiosError' && expectedCreationErrors > 0) {
        expectedCreationErrors--
        return
      }
      errors.push(error.message)
    })
    const events = async name => page.evaluate(name => Array.from(window.dataLayer ?? [], command => Array.from(command))
      .filter(command => command[0] === 'event' && command[1] === name), name)
    const count = name => expect.poll(async () => (await events(name)).length)
    const button = name => page.getByRole('button', { name, exact: true })

    // Creation events fire after success, before ClientRouter leaves the form.
    await page.goto(`${origin}/meetings/create?lang=ko`)
    try {
      await count('meeting_create_started').toBe(1)
    } catch (error) {
      console.error(await page.evaluate(() => ({ href: location.href, scripts: [...document.scripts].map(script => script.src || script.textContent.slice(0, 150)), gtag: String(window.gtag), state: window.__time2gatherAnalytics, commands: Array.from(window.dataLayer ?? [], command => Array.from(command)) })), errors)
      throw error
    }
    await button(t.createMeeting.meetingTypeStep.allDay).click()
    await button(t.common.next).click()
    await page.locator('main input').fill('Private event title')
    await button(t.common.next).click()
    await button('2026-11-15').click()
    await button(t.common.next).click()
    await page.locator('#meeting-host-name').fill('Private host')
    fail = true
    expectedCreationErrors++
    await Promise.all([
      page.waitForResponse(response => response.status() === 500 && new URL(response.url()).pathname.endsWith('/meetings')),
      button(t.createMeeting.locationStep.createButton).click(),
    ])
    await expect(button(t.createMeeting.locationStep.createButton)).toBeEnabled()
    assert.equal((await events('meeting_created')).length, 0)
    fail = false
    await button(t.createMeeting.locationStep.createButton).click()
    await expect(page).toHaveURL(/\/meetings\/nav-created/)
    await count('meeting_created').toBe(1)

    // Native cancellation produces no successful share event; copy fallback does.
    await button(t.meeting.result.buttons.share).click()
    assert.equal((await events('meeting_share_action')).length, 0)
    share = 'copied'
    await page.evaluate(value => { window.testShare = value }, share)
    await button(t.meeting.result.buttons.share).click()
    await count('meeting_share_action').toBe(1)
    assert.equal((await events('meeting_share_action'))[0][2].share_method, 'clipboard')

    for (const type of ['day', 'time']) {
      responses.delete(`nav-${type}`)
      await page.goto(`${origin}/meetings/nav-${type}/select/${type === 'day' ? 'all_day' : 'time'}?lang=ko`)
      const none = page.getByRole('checkbox').last()
      await none.check()
      await expect(button(t.common.submit)).toBeEnabled()
      fail = true
      await Promise.all([
        page.waitForResponse(response => response.status() === 500 && new URL(response.url()).pathname.endsWith('/unavailable')),
        button(t.common.submit).click(),
      ])
      await expect(button(t.common.submit)).toBeEnabled()
      assert.equal((await events('meeting_response_saved')).length, 0)
      fail = false
      await button(t.common.submit).click()
      await expect(page).toHaveURL(new RegExp(`/meetings/nav-${type}(?:\\?|$)`))
      await count('meeting_response_saved').toBe(1)
      const first = (await events('meeting_response_saved'))[0][2]
      assert.equal(first.response_type, 'unavailable')
      assert.equal(first.response_action, 'first')
      assert.equal(first.actor_role, 'participant')
      await page.locator('a[href*="/select/"]:visible').first().click()
      await expect(button(t.common.submit)).toBeEnabled()
      await button(t.common.submit).click()
      await count('meeting_response_saved').toBe(2)
      assert.equal((await events('meeting_response_saved'))[1][2].response_action, 'update')
    }
    viewer = 1
    await page.goto(`${origin}/meetings/nav-time?lang=ko`)
    await page.locator('[data-summary-confirm]').click()
    const dialog = page.getByRole('alertdialog')
    const confirm = dialog.getByRole('button', { name: t.meeting.confirmDialog.confirm, exact: true })
    fail = true
    await Promise.all([
      page.waitForResponse(response => response.status() === 500 && new URL(response.url()).pathname.endsWith('/confirm')),
      confirm.click(),
    ])
    await expect(confirm).toBeEnabled()
    assert.equal((await events('meeting_confirmed')).length, 0)
    fail = false
    await confirm.click()
    await count('meeting_confirmed').toBe(1)
    await expect(dialog).not.toBeVisible()
    const payloads = await page.evaluate(() => JSON.stringify(Array.from(window.dataLayer ?? [], command => Array.from(command))))
    assert.ok(!/Private|nav-day|nav-time|nav-created/.test(payloads), 'analytics payloads exclude inputs and codes')
    assert.deepEqual(errors, [])
    console.log(`PASS ${width}px: real creation failure/success, cancelled sharing/copy, date/time unavailable response failure/success/edit, confirmation failure/success, and private payloads; all requests intercepted.`)
    await context.close()
  }
} finally {
  await browser?.close()
  dev.kill('SIGTERM')
  await new Promise(resolve => fixture.server.close(resolve))
}
