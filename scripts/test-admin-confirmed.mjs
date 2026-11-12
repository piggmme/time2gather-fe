import { chromium, expect } from '@playwright/test'
import fs from 'node:fs'

const base = process.env.UI_PREVIEW_URL || 'https://127.0.0.1:4357'
const output = process.env.UI_PREVIEW_OUTPUT || 'artifacts/admin-confirmed'
fs.mkdirSync(output, { recursive: true })
const locales = process.env.UI_PREVIEW_LOCALES?.split(',') || fs.readdirSync('src/i18n/locales').filter(name => name.endsWith('.json')).map(name => name.slice(0, -5))
const browser = await chromium.launch({ headless: true })
const results = []
const envelope = data => ({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data }) })
const samples = Array.from({ length: 45 }, (_, index) => ({
  id: index + 1, meetingCode: `example_${index + 1}`, title: `Team dinner ${index + 1}`,
  hostUserId: 1, hostUsername: 'Sample host', selectionType: 'TIME',
  active: index % 3 !== 0, confirmed: index % 2 === 0, createdAt: '2026-11-10T00:00:00Z',
}))

async function noOverflow (page, label, width) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)
  if (overflow) throw new Error(`${label}/${width}: page overflow`)
}

try {
  for (const locale of locales) {
    const messages = JSON.parse(fs.readFileSync(`src/i18n/locales/${locale}.json`, 'utf8'))
    for (const width of [1280, 320]) {
      const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width, height: 960 } })
      await context.addInitScript(() => localStorage.setItem('time2gather.admin.credential', 't2ga.example-fixture'))
      await context.route('**/v1/admin/**', async (route) => {
        const url = new URL(route.request().url())
        if (url.pathname.endsWith('/auth/session')) return route.fulfill(envelope({ subject: 'sample', email: 'sample@example.com', expiresAt: '2099-01-01T00:00:00Z' }))
        if (url.pathname.endsWith('/summary')) return route.fulfill(envelope({ users: { total: 0, registered: 0, anonymous: 0, admins: 0 }, meetings: { total: 45, active: 30, confirmed: 23 } }))
        if (url.pathname.endsWith('/users')) return route.fulfill(envelope({
          content: [], page: 0, size: 20, totalElements: 0, totalPages: 0,
        }))
        if (url.pathname.endsWith('/meetings')) {
          const confirmed = url.searchParams.get('confirmedOnly') === 'true'
          if (confirmed && url.searchParams.has('cursor')) throw new Error('Unfiltered cursor leaked into confirmed filter')
          const query = url.searchParams.get('query') || ''
          const page = Number(url.searchParams.get('page'))
          const matches = samples.filter(item => (!confirmed || item.confirmed) && item.title.includes(query))
          return route.fulfill(envelope({
            content: matches.slice(page * 20, page * 20 + 20), page, size: 20,
            totalElements: matches.length, totalPages: Math.ceil(matches.length / 20),
            nextCursor: !confirmed && !query && page === 0 ? 'example-next-page' : null,
          }))
        }
        throw new Error(`Unexpected admin request ${url.pathname}`)
      })
      await context.route('**/v1/auth/me', route => route.fulfill(envelope({ userId: 1, username: 'Sample host', provider: 'ANONYMOUS', role: 'USER' })))
      const page = await context.newPage()
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      await page.goto(`${base}/admin?lang=${locale}`, { waitUntil: 'domcontentloaded' })
      await page.addStyleTag({ content: 'astro-dev-toolbar { display: none !important; }' })
      const section = page.locator('section[aria-labelledby="admin-meetings-title"]')
      const filter = section.getByRole('checkbox', { name: messages.admin.meetings.confirmedOnly })
      await expect(section.locator('article')).toHaveCount(20)
      await section.getByRole('button', { name: messages.common.next, exact: true }).click()
      await expect(section.getByText('Team dinner 21', { exact: true })).toBeVisible()
      // Changing the filter from page 2 resets both page and cursor.
      await filter.check()
      await expect(section.getByText('Team dinner 1', { exact: true })).toBeVisible()
      await expect(section.getByText('Team dinner 2', { exact: true })).toHaveCount(0)
      await expect(section.getByText(messages.admin.meetings.description.replace('{count}', '23'), { exact: true })).toBeVisible()
      await section.getByRole('button', { name: messages.common.next, exact: true }).click()
      await expect(section.locator('article')).toHaveCount(3)
      await section.getByRole('button', { name: messages.common.previous, exact: true }).click()
      await expect(section.locator('article')).toHaveCount(20)
      await noOverflow(page, `${locale}/admin`, width)
      if (['ko', 'de', 'ar'].includes(locale)) {
        await section.evaluate(element => element.scrollIntoView({ block: 'start' }))
        await page.screenshot({ path: `${output}/admin-${locale}-${width}.png`, animations: 'disabled' })
      }
      const search = section.getByRole('searchbox')
      await search.fill('Team dinner 45')
      await section.getByRole('button', { name: messages.admin.search, exact: true }).click()
      await expect(section.locator('article')).toHaveCount(1)
      await expect(section.getByText('Team dinner 45', { exact: true })).toBeVisible()
      await search.fill('no result')
      await section.getByRole('button', { name: messages.admin.search, exact: true }).click()
      await expect(section.getByText(messages.admin.meetings.empty, { exact: true })).toBeVisible()
      await filter.uncheck()
      await search.fill('')
      await section.getByRole('button', { name: messages.admin.search, exact: true }).click()
      await expect(section.getByText('Team dinner 2', { exact: true })).toBeVisible()
      await page.goto(`${base}/dev/attendance-preview?lang=${locale}`, { waitUntil: 'domcontentloaded' })
      await page.addStyleTag({ content: 'astro-dev-toolbar { display: none !important; }' })
      const action = page.locator('[data-summary-confirm]')
      await expect(action).toHaveText(messages.meeting.confirmButton)
      await noOverflow(page, `${locale}/result`, width)
      if (['ko', 'de', 'ar'].includes(locale)) await page.locator('[data-decision-state]').screenshot({ path: `${output}/result-${locale}-${width}.png`, animations: 'disabled' })
      await action.click()
      await expect(page.getByRole('alertdialog')).toBeVisible()
      await expect(page.getByRole('alertdialog').getByRole('heading', { name: messages.meeting.confirmDialog.title, exact: true })).toBeVisible()
      if (['ar', 'ar-EG', 'ur'].includes(locale)) await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
      if (errors.length) throw new Error(errors.join('\n'))
      results.push(`${locale}/${width}: confirmed-only, count, search, empty, pagination, reset, action label, dialog and overflow passed`)
      await context.close()
    }
    console.log(`${locale}: mobile + desktop passed`)
  }
  fs.writeFileSync(`${output}/verification.txt`, results.join('\n') + '\n')
} finally {
  await browser.close()
}
