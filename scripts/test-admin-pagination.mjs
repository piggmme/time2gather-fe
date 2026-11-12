import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { chromium, expect } from '@playwright/test'

const root = new URL('..', import.meta.url).pathname
const base = process.argv[2] || 'http://127.0.0.1:4329'
const output = process.argv[3] || path.join(root, 'artifacts/admin-pagination')
const locales = fs.readdirSync(path.join(root, 'src/i18n/locales')).filter(name => name.endsWith('.json')).map(name => name.slice(0, -5))
fs.mkdirSync(output, { recursive: true })
for (let attempt = 0; ; attempt++) {
  try {
    const response = await fetch(`${base}/ko/`, { signal: AbortSignal.timeout(1000) })
    if (response.ok) break
  } catch { /* Wait for the local server started by CI. */ }
  if (attempt >= 30) throw new Error('Local test server did not become ready')
  await new Promise(resolve => setTimeout(resolve, 200))
}
const browser = await chromium.launch()
const errors = [], results = []
try {
  for (const locale of locales) {
    const widths = ['ko', 'de', 'ar'].includes(locale) ? [320, 390, 1280] : [390]
    const translation = JSON.parse(fs.readFileSync(path.join(root, `src/i18n/locales/${locale}.json`), 'utf8'))
    for (const width of widths) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, locale, reducedMotion: 'reduce' })
      await context.addInitScript(() => localStorage.setItem('time2gather.admin.credential', 't2ga.fixture'))
      await context.route(/google-analytics|googletagmanager|firestore.googleapis.com|accounts.google.com/, route => route.abort())
      const requests = []
      await context.route('**/v1/**', async (route) => {
        const url = new URL(route.request().url()), endpoint = url.pathname
        assert.equal(route.request().method(), 'GET', 'Pagination must not write user data')
        let data
        if (endpoint.endsWith('/admin/auth/session')) data = { subject: 'fixture', email: 'admin@example.test', expiresAt: '2027-01-01T00:00:00Z' }
        else if (endpoint.endsWith('/admin/summary')) data = { users: { total: 45, registered: 20, anonymous: 25, admins: 1 }, meetings: { total: 45, active: 30, confirmed: 10 } }
        else if (/\/admin\/(users|meetings)$/.test(endpoint)) {
          const kind = endpoint.endsWith('/users') ? 'users' : 'meetings'
          const number = Number(url.searchParams.get('page') || 0)
          const query = url.searchParams.get('query') || ''
          const cursor = url.searchParams.get('cursor')
          requests.push({ kind, page: number, query, cursor })
          assert.equal(cursor, !query && number > 0 ? `${kind}:${number}` : null, 'Use the saved boundary, reset it on search')
          const id = number * 20 + 1
          const name = `${query || kind} ${id}`
          const common = { id, createdAt: '2026-11-01T00:00:00Z' }
          data = {
            content: kind === 'users'
              ? [{
                  ...common, username: name, email: 'fixture@example.test', provider: 'GOOGLE', role: 'USER', participatedMeetings: [],
                }]
              : [{
                  ...common, meetingCode: 'mtg_fixture000', title: name, hostUserId: 1, hostUsername: 'Fixture host', selectionType: 'ALL_DAY', active: true, confirmed: false,
                }],
            page: number, size: 20, totalElements: query ? 1 : 45, totalPages: query ? 1 : 3,
            nextCursor: !query && number < 2 ? `${kind}:${number + 1}` : null,
          }
        } else {
          errors.push(`Unexpected API ${endpoint}`)
          return route.abort()
        }
        await route.fulfill({ json: { success: true, data } })
      })
      const page = await context.newPage()
      page.on('pageerror', error => errors.push(`${locale}/${width}: ${error.message}`))
      await page.goto(`${base}/admin?lang=${locale}`, { waitUntil: 'domcontentloaded' })
      for (const kind of ['users', 'meetings']) {
        const panel = page.locator(`section[aria-labelledby="admin-${kind}-title"]`)
        await expect(panel.getByText(`${kind} 1`, { exact: true })).toBeVisible()
        const next = panel.getByRole('button', { name: translation.common.next, exact: true })
        const previous = panel.getByRole('button', { name: translation.common.previous, exact: true })
        await next.click()
        await expect(panel.getByText(`${kind} 21`, { exact: true })).toBeVisible()
        await next.click()
        await expect(panel.getByText(`${kind} 41`, { exact: true })).toBeVisible()
        await expect(next).toBeDisabled()
        await previous.click()
        await expect(panel.getByText(`${kind} 21`, { exact: true })).toBeVisible()
        const refresh = panel.getByRole('button', { name: translation.admin.refresh, exact: true })
        const refreshed = page.waitForResponse(response => response.url().includes(`/admin/${kind}?`))
        await refresh.click()
        await refreshed
        await expect(panel.getByText(`${kind} 21`, { exact: true })).toBeVisible()
        if (kind === 'users' && ['ko', 'de', 'ar'].includes(locale) && width !== 390) {
          await page.evaluate(() => document.fonts.ready)
          await panel.screenshot({ path: path.join(output, `${locale}-${width}.png`) })
        }
        const input = panel.getByRole('searchbox')
        await input.fill('code:mtg_fixture000')
        await panel.getByRole('button', { name: translation.admin.search, exact: true }).click()
        await expect(panel.getByText('code:mtg_fixture000 1', { exact: true })).toBeVisible()
        await input.fill('')
        await input.press('Enter')
        await expect(panel.getByText(`${kind} 1`, { exact: true })).toBeVisible()
        await next.click()
        await expect(panel.getByText(`${kind} 21`, { exact: true })).toBeVisible()
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'No horizontal overflow')
      assert(requests.some(request => request.cursor === 'users:2'))
      results.push({
        locale, width, next: true, previous: true, refresh: true, searchReset: true,
      })
      await context.close()
    }
  }
  assert.deepEqual(errors, [])
  fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ cases: results.length, locales: locales.length, results }, null, 2))
  console.log(`Admin pagination passed: ${results.length} cases, ${locales.length} locales; fixture data only`)
} finally {
  await browser.close()
}
