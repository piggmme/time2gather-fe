import fs from 'node:fs'
import assert from 'node:assert/strict'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { chromium, expect } from '@playwright/test'
import { createNavigationFixture } from './navigation-fixture.mjs'

const fe = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const out = path.resolve(process.env.BUTTON_OUTPUT || 'artifacts/button-roles')
fs.mkdirSync(out, { recursive: true })
const localBase = 'http://127.0.0.1:14498'
const base = process.env.BUTTON_BASE || localBase
const fixture = createNavigationFixture({
  transformMeeting (data, code) {
    data.meeting.title = '주말 친구 모임'
    data.meeting.description = ''
    data.meeting.host.username = '지우'
    data.participants[0].username = '지우'
    if (code.includes('confirmed')) {
      data.meeting.confirmedDate = '2026-11-15'
      data.meeting.confirmedTime = '09:00'
      data.meeting.confirmedSlotIndex = 9
    }
    return data
  },
})
await new Promise(resolve => fixture.server.listen(0, '127.0.0.1', resolve))
const apiOrigin = `http://127.0.0.1:${fixture.server.address().port}`
// Redirect only the disposable QA server's API reads. The production build and
// its compiled API URL remain unchanged, including during remote asset checks.
const loader = path.join(out, 'ssr-fixture-loader.mjs')
fs.writeFileSync(loader, `
import http from 'node:http'
import https from 'node:https'
import { syncBuiltinESMExports } from 'node:module'
const original = https.request
const fixture = new URL(process.env.BUTTON_FIXTURE_API)
https.request = function (options, ...rest) {
  if (options?.hostname === 'time2gather.org' && options.path?.startsWith('/api/')) {
    if (options.method && options.method !== 'GET') throw new Error('QA SSR writes are forbidden')
    return http.request({ ...options, protocol: 'http:', hostname: fixture.hostname, port: fixture.port, agent: undefined }, ...rest)
  }
  return original.call(this, options, ...rest)
}
syncBuiltinESMExports()
`)
const log = fs.openSync(`${out}/server.log`, 'w')
const app = spawn(process.execPath, ['--import', loader, 'dist/server/entry.mjs'], {
  cwd: fe, env: {
    ...process.env, BUTTON_FIXTURE_API: apiOrigin, API_URL: `${apiOrigin}/api`, PUBLIC_API_URL: '/api', HOST: '127.0.0.1', PORT: '14498',
  }, stdio: ['ignore', log, log],
})
const browser = await chromium.launch()
const errors = [], blockedWrites = [], inventory = [], results = []
const people = [{ id: '1', name: '지우', avatar: null, host: true }, { id: '2', name: '민수', avatar: null, host: false }]
const comment = {
  id: 'sample', author: people[0], rootId: null, replyToId: null, replyTo: null,
  body: '토요일 오전 좋아요. 카페에서 만나요!', mentions: [], createdAt: 1794200000000,
  edited: false, status: 'ACTIVE', replyCount: 1, canEdit: true, canDelete: true, canHide: false,
  reactions: [{ emoji: '👍', count: 2, reacted: false, people }, { emoji: '❤️', count: 1, reacted: true, people: [people[0]] }],
}
const meetings = Array.from({ length: 21 }, (_, i) => ({
  id: i + 1, meetingCode: `review-time-location-${i}`, title: `친구 모임 ${i + 1}`, hostUserId: 1, hostUsername: '지우', selectionType: 'TIME', active: true, confirmed: false, createdAt: '2026-11-10T00:00:00Z',
}))
async function newContext (locale, width) {
  const context = await browser.newContext({
    ignoreHTTPSErrors: true, locale, timezoneId: 'Asia/Seoul', viewport: { width, height: 900 }, reducedMotion: 'reduce',
  })
  await context.addInitScript(() => localStorage.setItem('time2gather.admin.credential', 't2ga.example-fixture'))
  await context.route(/googletagmanager|google-analytics|firestore.googleapis|firebaseinstallations.googleapis|accounts.google.com/, r => r.abort())
  const state = { scenario: '' }
  context.buttonState = state
  if (base !== localBase) await context.route('**/meetings/review-**', async (route) => {
    if (route.request().resourceType() !== 'document') return route.continue()
    const url = new URL(route.request().url())
    return route.fulfill({ response: await route.fetch({ url: localBase + url.pathname + url.search }) })
  })
  await context.route('**/api/**', async (route) => {
    const scenario = state.scenario
    const req = route.request(), url = new URL(req.url()), p = url.pathname
    if (req.method() !== 'GET') {
      blockedWrites.push({
        path: p, scenario,
      })
      return route.abort()
    }
    if (scenario === 'admin-error' && p.endsWith('/admin/auth/session')) return route.fulfill({ status: 503, json: { success: false } })
    if (scenario === 'vote-error' && p.endsWith('/location-selections')) return route.fulfill({ status: 503, json: { success: false } })
    let data
    if (p.endsWith('/auth/me')) data = scenario === 'guest-vote'
      ? null
      : {
          userId: scenario === 'result-fresh' ? 2 : 1, username: '지우', provider: 'ANONYMOUS', role: 'USER',
          createdMeetings: scenario === 'my-list' ? meetings.slice(0, 2).map(m => ({ id: m.id, code: m.meetingCode, title: m.title })) : [], participatedMeetings: [],
        }
    else if (p.endsWith('/comments/summary')) data = { count: 2, version: 1, viewerId: '1', writable: true }
    else if (p.endsWith('/comments/people')) data = people
    else if (p.endsWith('/comments/activity')) data = []
    else if (p.endsWith('/comments')) data = {
      items: url.searchParams.has('rootId')
        ? [{
            ...comment, id: 'reply', rootId: 'sample', replyToId: 'sample', replyTo: people[0], replyCount: 0, body: '좋아요!',
          }]
        : [comment], nextCursor: null,
    }
    else if (p.endsWith('/admin/auth/session')) data = { subject: 'example', email: 'sample@example.com', expiresAt: '2099-01-01T00:00:00Z' }
    else if (p.endsWith('/admin/summary')) data = { users: { total: 21, registered: 10, anonymous: 11, admins: 1 }, meetings: { total: 21, active: 21, confirmed: 0 } }
    else if (p.endsWith('/admin/users')) data = {
      content: [], page: 0, size: 20, totalElements: 0, totalPages: 0,
    }
    else if (p.endsWith('/admin/meetings')) data = {
      content: meetings.slice(0, 20), page: 0, size: 20, totalElements: 21, totalPages: 2,
    }
    else return route.fulfill({ response: await route.fetch({ url: `${apiOrigin}${p}${url.search}` }) })
    return route.fulfill({ json: { success: true, data } })
  })
  return context
}

async function verifyRoles (page, scenario) {
  const white = 'rgb(255, 255, 255)', blue = 'rgb(29, 101, 216)', neutral = 'rgb(135, 148, 165)'
  const quiet = async (el) => {
    await expect(el).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
    await expect(el).toHaveCSS('border-top-color', 'rgba(0, 0, 0, 0)')
  }
  const outline = async (el, color = neutral) => {
    await expect(el).toHaveCSS('background-color', white)
    await expect(el).toHaveCSS('border-top-color', color)
    await expect(el).toHaveCSS('border-top-style', 'solid')
  }
  const add = async (el) => {
    await expect(el).toHaveCSS('border-top-style', 'dashed')
    await expect(el).toHaveCSS('border-top-color', blue)
  }
  const danger = async (el) => {
    await expect(el).toHaveCSS('color', 'rgb(180, 35, 24)')
    await expect(el).toHaveCSS('border-top-color', 'rgb(180, 35, 24)')
  }
  const main = page.locator('main')
  await page.mouse.move(1, 1)
  if (scenario === 'home') await outline(page.locator('.hero .actions a.secondary'), blue)
  if (scenario === 'my-empty') await outline(main.locator('a[class*="_utility_"]'), blue)
  if (scenario === 'my-list') await outline(main.locator('li a').first())
  if (scenario === 'create') {
    await quiet(page.locator('[data-create-flow-actions] button').first())
    await add(page.locator('button[class*="_locationAddButton_"]'))
    await danger(page.locator('button[class*="_locationRemoveButton_"]').first())
    await expect(page.locator('[class*="_locationToggleContainer_"]')).toHaveCSS('border-top-color', blue)
  }
  if (scenario === 'time') {
    await outline(main.locator('button[class*="_trigger_"]'))
    await quiet(page.locator('[data-create-flow-actions] button').first())
  }
  if (['result', 'calendar', 'comments'].includes(scenario)) {
    await outline(page.locator('a[class*="_PrimaryButton_"]').first())
    await outline(page.locator('button[class*="_IconButton_"]').first(), blue)
  }
  if (scenario === 'result') {
    await outline(page.locator('#meeting-confirm-action button'), blue)
    await expect(page.locator('[data-summary-confirm]')).toHaveCSS('background-color', blue)
    if (page.viewportSize().width < 900) await outline(page.locator('a[class*="_SummaryVoteAction_"]:visible').first())
    const edit = page.locator('a[class*="_PrimaryButton_"]').first()
    await edit.focus()
    await expect(edit).toHaveCSS('outline-style', 'solid')
    await expect(edit).toHaveCSS('outline-width', '2px')
  }
  if (scenario === 'result-fresh' && page.viewportSize().width < 900) await expect(page.locator('a[class*="_SummaryVoteAction_"]:visible').first()).toHaveCSS('background-color', blue)
  if (scenario === 'comment-delete') {
    await quiet(page.getByRole('alertdialog').locator('button[class*="_Cancel_"]'))
    await expect(page.getByRole('alertdialog').locator('button[class*="_dangerPrimary_"]')).toHaveCSS('background-color', 'rgb(180, 35, 24)')
    await expect(page.getByRole('alertdialog').locator('button[class*="_dangerPrimary_"]')).toHaveCSS('font-weight', '600')
  }
  if (scenario === 'confirm' || scenario === 'export') {
    const dialog = page.getByRole('alertdialog')
    await quiet(dialog.locator('button[class*="_Cancel_"]'))
    await expect(dialog.locator('button[class*="_Action_"]').last()).toHaveCSS('background-color', blue)
    const options = dialog.locator('label:has(input[type="radio"])')
    if (await options.count() > 1) {
      await options.nth(1).locator('input').check()
      await page.mouse.move(1, 1)
      await expect(options.nth(1)).toHaveCSS('background-color', 'rgb(239, 246, 255)')
      await outline(options.first())
    }
  }
  if (scenario === 'comments') {
    await quietBackground(page.locator('[data-reply-trigger]').first())
    await outline(page.locator('[data-comment-reactions] button[aria-pressed="false"]').first())
    const chosen = page.locator('[data-comment-reactions] button[aria-pressed="true"]').first()
    await expect(chosen).toHaveCSS('background-color', 'rgb(239, 246, 255)')
    await expect(chosen.locator('svg')).toBeVisible()
  }
  if (scenario === 'reply') await quiet(page.locator('#comment-sample [class*="_composerFooter_"] button').first())
  if (scenario === 'vote-day' || scenario === 'vote-time') {
    const choice = page.locator('label[class*="_unavailableLabel_"]')
    await outline(choice)
    await choice.locator('input').check()
    await page.mouse.move(1, 1)
    await expect(choice).toHaveCSS('background-color', 'rgb(239, 246, 255)')
    await quiet(main.locator('button[class*="_ghost_"]').last())
  }
  if (scenario === 'vote-location') {
    const choice = page.locator('[class*="_locationItem_"]').first()
    await outline(choice)
    await choice.locator('input').check()
    await page.mouse.move(1, 1)
    await expect(choice).toHaveCSS('background-color', 'rgb(239, 246, 255)')
  }
  if (scenario === 'guest-vote') await expect(main.locator('button')).toHaveCSS('background-color', 'rgb(244, 244, 245)')
  if (scenario === 'edit') {
    const addButton = page.locator('[class*="_placeFields_"] > button')
    await add(addButton)
    await addButton.click()
    await page.mouse.move(1, 1)
    await danger(page.locator('[class*="_placeRow_"] > button').first())
    await quiet(page.locator('[class*="_buttons_"] > button').first())
  }
  if (scenario === 'confirmed') await danger(page.locator('button[class*="_CancelConfirmationButton_"]'))
  if (scenario === 'danger') {
    await quiet(page.getByRole('alertdialog').locator('button[class*="_Cancel_"]'))
    await expect(page.getByRole('alertdialog').locator('button[class*="_Action_"]')).toHaveCSS('background-color', 'rgb(180, 35, 24)')
  }
  if (scenario === 'admin') {
    await outline(page.locator('[class*="_quickNav_"] a').first())
    await quietBackground(page.locator('button[class*="_iconButton_"]').first())
    const next = page.locator('section[aria-labelledby="admin-meetings-title"] nav button').last()
    await outline(next)
  }
  async function quietBackground (el) {
    await expect(el).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
  }
}

const routeFor = {
  'home': '/ko', 'search': '/meetings/search', 'my-empty': '/my', 'my-list': '/my',
  'create': '/meetings/create?step=location&meetingType=TIME&title=Weekend&dates=2026-11-15,2026-11-16',
  'time': '/meetings/create?step=timeRange&meetingType=TIME&title=Weekend&dates=2026-11-15,2026-11-16',
  'result': '/meetings/review-time-location', 'calendar': '/meetings/review-time-location',
  'confirm': '/meetings/review-time-location', 'export': '/meetings/review-time-location',
  'comments': '/meetings/review-time-location', 'reply': '/meetings/review-time-location',
  'comment-menu': '/meetings/review-time-location', 'reactions': '/meetings/review-time-location',
  'vote-day': '/meetings/review-day-location/select/all_day', 'vote-time': '/meetings/review-time-location/select/time',
  'guest-vote': '/meetings/review-time-location/select/time', 'edit': '/meetings/review-time-location/edit-dates',
  'vote-location': '/meetings/review-day-location/select/all_day',
  'vote-error': '/meetings/review-day-location/select/all_day',
  'timezone': '/meetings/create?step=timeRange&meetingType=TIME&title=Weekend&dates=2026-11-15,2026-11-16',
  'confirmed': '/meetings/review-time-confirmed', 'danger': '/meetings/review-time-confirmed', 'admin': '/admin', 'admin-error': '/admin', 'menu': '/my',
  'result-fresh': '/meetings/review-time-location', 'comment-delete': '/meetings/review-time-location',
}
async function prepare (page, locale, scenario) {
  const t = JSON.parse(fs.readFileSync(`${fe}/src/i18n/locales/${locale}.json`, 'utf8'))
  const route = scenario === 'home' ? `/${locale}` : routeFor[scenario]
  await page.goto(`${base}${route}${route.includes('?') ? '&' : '?'}lang=${locale}`)
  await page.addStyleTag({ content: 'astro-dev-toolbar { display:none !important; } * { transition:none !important; animation:none !important; }' })
  await expect(page.locator('main').first()).toBeVisible()
  if (scenario === 'search') {
    await expect(page.locator('main input')).toBeVisible()
    await expect(page.locator('main button')).toBeVisible()
  }
  if (['result', 'calendar', 'confirm', 'export', 'comments', 'reply', 'comment-menu', 'reactions', 'confirmed', 'danger', 'result-fresh', 'comment-delete'].includes(scenario)) {
    await expect(page.getByRole('tab').first()).toBeVisible()
    await expect(page.locator('#comment-sample')).toBeVisible()
  }
  if (scenario === 'my-empty') await expect(page.locator('main a[href*="/meetings/search"]').last()).toBeVisible()
  if (scenario === 'my-list') await expect(page.locator('main li a').first()).toBeVisible()
  if (scenario === 'admin') await expect(page.locator('section[aria-labelledby="admin-meetings-title"] article').first()).toBeVisible()
  if (scenario === 'admin-error') await expect(page.locator('main button').first()).toBeVisible()
  if (scenario === 'menu' && page.viewportSize().width < 700) {
    await page.getByRole('button', {
      name: t.common.openMenu, exact: true,
    }).click()
  }
  if (scenario === 'create') {
    await page.locator('main input[type=checkbox]').check()
    await page.locator('main input:not([type=checkbox])').nth(1).fill('강남역 카페')
    await page.locator('main input:not([type=checkbox])').nth(2).fill('성수동 식당')
    await page.locator('button[class*="_locationAddButton_"]').click()
    await page.locator('main input:not([type=checkbox])').nth(3).fill('서울숲 카페')
    await page.locator('main input:not([type=checkbox])').last().blur()
  }
  if (scenario === 'calendar') await page.getByRole('tab', { name: t.meeting.result.tabs.calendar, exact: true }).click()
  if (scenario === 'confirm') {
    await page.locator('#meeting-confirm-action button').click()
    await expect(page.getByRole('alertdialog')).toBeVisible()
  }
  if (scenario === 'export') {
    await page.getByRole('button', { name: t.meeting.result.buttons.calendar, exact: true }).click()
    await expect(page.getByRole('alertdialog')).toBeVisible()
  }
  if (scenario === 'danger') {
    await page.locator('button[class*="_CancelConfirmationButton_"]').click()
    await expect(page.getByRole('alertdialog')).toBeVisible()
  }
  if (scenario === 'reply') {
    await page.locator('[data-reply-trigger]').first().click()
    await expect(page.locator('#comment-sample textarea')).toBeVisible()
    await page.locator('#comment-sample textarea').blur()
  }
  if (scenario === 'comment-menu') {
    await page.locator('#comment-sample details[class*="_menu_"] summary').click()
    await expect(page.locator('#comment-sample details[open] > div')).toBeVisible()
  }
  if (scenario === 'comment-delete') {
    await page.locator('#comment-sample details[class*="_menu_"] summary').click()
    await page.locator('#comment-sample details[open]').getByRole('button', { name: t.comments.delete, exact: true }).click()
    await expect(page.getByRole('alertdialog')).toBeVisible()
  }
  if (scenario === 'reactions') {
    await page.getByRole('button', {
      name: t.comments.reactions.view, exact: true,
    }).first().click()
    await expect(page.getByRole('dialog')).toBeVisible()
  }
  if (['vote-day', 'vote-time', 'vote-location', 'vote-error'].includes(scenario)) await expect(page.locator('label[class*="_unavailableLabel_"] input')).toBeVisible()
  if (scenario === 'guest-vote') {
    await expect(page.locator('main input')).toBeVisible()
    await expect(page.locator('main button')).toBeVisible()
  }
  if (scenario === 'vote-location' || scenario === 'vote-error') {
    await page.locator('main button[class*="_primary_"]').last().click()
    if (scenario === 'vote-error') await expect(page.locator('[class*="_errorState_"] button')).toBeVisible()
    else await expect(page.locator('[class*="_locationItem_"]').first()).toBeVisible()
  }
  if (scenario === 'timezone') {
    await page.locator('main button[class*="_trigger_"]').click()
    await expect(page.getByRole('dialog')).toBeVisible()
  }
  if (scenario === 'time') await expect(page.getByRole('combobox').first()).toBeVisible()
  if (scenario === 'edit') await expect(page.locator('main h1')).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  await page.mouse.move(1, 1)
  if (['comments', 'reply', 'comment-menu'].includes(scenario)) await page.locator('#comments').scrollIntoViewIfNeeded()
  if (['vote-day', 'vote-time'].includes(scenario)) await page.locator('label[class*="_unavailableLabel_"]').scrollIntoViewIfNeeded()
  if (scenario === 'result') await page.locator('[class*="_ResultButtons_"]').scrollIntoViewIfNeeded()
}

try {
  const ready = await browser.newContext({ ignoreHTTPSErrors: true })
  await expect.poll(async () => {
    try {
      return (await ready.request.get(localBase + '/meetings/create')).status()
    } catch {
      return 0
    }
  }, {
    timeout: 60000,
  }).toBe(200)
  await ready.close()
  const locales = process.env.QA_LOCALES?.split(',') || fs.readdirSync(`${fe}/src/i18n/locales`).filter(name => name.endsWith('.json')).map(name => name.slice(0, -5))
  const scenarios = process.env.BUTTON_SCENARIOS?.split(',') || Object.keys(routeFor)
  for (const locale of locales) {
    for (const width of (process.env.BUTTON_WIDTHS?.split(',').map(Number) || (['ko', 'de', 'ar'].includes(locale) ? [320, 390, 1280] : [390, 1280]))) {
      const context = await newContext(locale, width)
      for (const scenario of scenarios) {
        context.buttonState.scenario = scenario
        const page = await context.newPage()
        page.on('pageerror', e => errors.push({ locale, width, scenario, message: e.message }))
        try {
          await prepare(page, locale, scenario)
          await verifyRoles(page, scenario)
          await page.evaluate(() => {
            if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
          })
          inventory.push({ locale, width, scenario })
          const section = ({
            'result': '[class*="_ResultButtons_"]', 'comments': '#comment-sample', 'confirm': '[role="alertdialog"]', 'my-empty': '[class*="_emptyState_"]', 'my-list': 'main ul', 'vote-time': '[class*="_timeSelectionActions_"]', 'admin': 'section[aria-labelledby="admin-meetings-title"] [class*="_pagination_"]',
          })[scenario]

          const layout = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth + 1, controls: [...document.querySelectorAll('main button, main a[class*="_button_"], [role="alertdialog"] button')].filter(el => el.getBoundingClientRect().width).map(el => ({ text: el.textContent.trim().slice(0, 80), clipped: el.scrollWidth > el.clientWidth + 2, height: el.getBoundingClientRect().height })) }))
          assert.equal(layout.overflow, false, `${locale}/${width}/${scenario}: horizontal overflow`)
          assert.equal(layout.controls.some(c => c.clipped), false, `${locale}/${width}/${scenario}: clipped button`)
          results.push({ locale, width, scenario, ...layout })
          if (['ko', 'de', 'ar'].includes(locale)) await page.screenshot({ path: `${out}/after-${locale}-${scenario}-${width}.png` })
          if (section && locale === 'ko' && width === 390 && await page.locator(section).count()) await page.locator(section).first().screenshot({ path: `${out}/after-section-${scenario}.png` })
          console.log(`${locale}/${width}/${scenario}: passed`)
        } catch (e) {
          await page.screenshot({ path: `${out}/failure-${locale}-${scenario}-${width}.png` })
          throw new Error(`${locale}/${width}/${scenario}: ${e.message}`)
        } finally { await page.close() }
      }
      await context.close()
    }
  }
  assert.equal(errors.length, 0, JSON.stringify(errors))
  assert.equal(blockedWrites.length, 0)
  assert.equal(fixture.mutations.length, 0)
  fs.writeFileSync(`${out}/inventory.json`, JSON.stringify(inventory, null, 2))
  fs.writeFileSync(`${out}/verification.json`, JSON.stringify({
    passed: true, checkedAt: new Date().toISOString(), source: fe, base, simulatedMeetingDocuments: base !== localBase, locales: locales.length, cases: results.length, errors, blockedWrites, fixtureWrites: fixture.mutations, results,
  }, null, 2))
} finally {
  fs.writeFileSync(`${out}/inventory-partial.json`, JSON.stringify(inventory, null, 2))
  fs.writeFileSync(`${out}/verification-partial.json`, JSON.stringify({ errors, blockedWrites, results }, null, 2))
  await browser.close()
  app.kill('SIGTERM')
  await new Promise(resolve => fixture.server.close(resolve))
}
