import assert from 'node:assert/strict'
import fs from 'node:fs'
import { chromium, webkit, expect } from '@playwright/test'

const base = process.env.UI_BASE ?? 'http://127.0.0.1:14335'
const output = process.env.UI_OUTPUT ?? 'artifacts/ui-refinement'
const locales = process.env.QA_LOCALES?.split(',') ?? fs.readdirSync('src/i18n/locales').filter(name => name.endsWith('.json')).map(name => name.slice(0, -5))
const widths = process.env.UI_WIDTHS?.split(',').map(Number)
const engines = process.env.UI_ENGINES?.split(',') ?? ['chromium']
fs.mkdirSync(output, { recursive: true })
const results = [], errors = [], writes = []
const title = '금요일 저녁 & Friends? 오후 / 7시'
for (const engine of engines) {
  const browser = await ({ chromium, webkit }[engine]).launch()
  try {
    for (const locale of locales) for (const width of widths ?? (['ko', 'de', 'ar'].includes(locale) ? [320, 390, 1280] : [390, 1280])) {
      const context = await browser.newContext({
        locale, timezoneId: 'Asia/Seoul', viewport: { width, height: 844 }, reducedMotion: 'reduce', ignoreHTTPSErrors: true,
      })
      await context.route(/googletagmanager|google-analytics|firestore.googleapis|firebaseinstallations.googleapis/, route => route.abort())
      await context.route(url => url.pathname.includes('/v1/') && !url.hostname.endsWith('googleapis.com'), (route) => {
        if (route.request().method() !== 'GET') {
          writes.push(route.request().url())
          return route.abort()
        }
        return route.fulfill({
          json: {
            success: true, data: {
              userId: 1, username: '지우', provider: 'ANONYMOUS', role: 'USER', createdMeetings: [], participatedMeetings: [],
            },
          },
        })
      })
      const page = await context.newPage()
      page.on('pageerror', error => errors.push(`${engine}/${locale}/${width}: ${error.message}`))
      let geometry = {}
      if (process.env.UI_SCENARIO !== 'home') {
        await page.goto(`${base}/meetings/create?lang=${locale}`)
        // This assertion fails on the previous, type-only first screen.
        const input = page.locator('main input#meeting-title')
        await expect(input).toBeVisible()
        await expect(page.locator('header[data-site-header] .t2g-site-header__brand')).toBeVisible()
        await expect(page.locator('[data-create-progress] li')).toHaveCount(3)
        await expect(page.locator('[data-create-progress] [aria-current="step"]')).toHaveAttribute('data-step-group', 'basic')
        await expect(page.locator('header[data-site-header] .t2g-site-header__nav a[href*="/about/"]')).toBeVisible({ visible: width >= 900 })
        if (width < 900) {
          const menu = page.locator('header .t2g-site-header__menu')
          await menu.locator('summary').click()
          await expect(menu.locator('a[href*="/meetings/search"]')).toBeVisible()
          await page.keyboard.press('Escape')
          assert.equal(await menu.evaluate(el => el.open), false)
        }
        const next = page.locator('[data-create-flow-actions] button').last()
        await expect(next).toBeDisabled()
        await input.fill('   ')
        await expect(next).toBeDisabled()
        await input.fill(title)
        await page.locator('[data-meeting-type="TIME"]').click()
        await expect(page.locator('[data-meeting-type="TIME"]')).toHaveAttribute('aria-pressed', 'true')
        await next.click()
        await expect(page).toHaveURL(/step=dates/)
        assert.equal(new URL(page.url()).searchParams.get('title'), title)
        assert.equal(new URL(page.url()).searchParams.get('meetingType'), 'TIME')
        await expect(page.locator('[data-create-progress] [aria-current="step"]')).toHaveAttribute('data-step-group', 'schedule')
        await page.locator('[data-create-flow-actions] button').first().click()
        await expect(input).toHaveValue(title)
        await expect(page.locator('[data-meeting-type="TIME"]')).toHaveAttribute('aria-pressed', 'true')
        if (locale === 'ko' && width === 390) {
          const language = page.locator('header [role="combobox"]')
          await language.click()
          await page.getByRole('option', { name: 'العربية', exact: true }).click()
          await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
          await expect(input).toHaveValue(title)
          const arabic = JSON.parse(fs.readFileSync('src/i18n/locales/ar.json', 'utf8'))
          await expect(page.locator('[data-create-progress]')).toHaveAttribute('aria-label', arabic.createMeeting.flow.label)
          await language.click()
          await page.getByRole('option', { name: '한국어', exact: true }).click()
          await expect(page.locator('html')).toHaveAttribute('lang', 'ko')
          await expect(input).toHaveValue(title)
        }
        geometry = await page.locator('[data-create-flow-actions]').evaluate((el) => {
          const r = el.getBoundingClientRect(), main = document.querySelector('main').getBoundingClientRect()
          return {
            position: getComputedStyle(el).position, bottom: r.bottom, top: r.top, left: r.left, right: r.right, mainLeft: main.left, mainRight: main.right, overflow: document.documentElement.scrollWidth > innerWidth + 1,
          }
        })
        assert.equal(geometry.overflow, false, `${locale}/${width}: page overflow`)
        if (width < 700) assert.ok(Math.abs(844 - geometry.bottom) < 2, `${locale}/${width}: mobile actions stay at bottom`)
        else {
          assert.notEqual(geometry.position, 'fixed', 'Desktop actions belong beside the form')
          const choices = await page.locator('[data-basic-type-options]').boundingBox()
          assert.ok(geometry.top - choices.y - choices.height >= 24)
          assert.ok(geometry.top - choices.y - choices.height < 90)
        }
        if (['ko', 'de', 'ar'].includes(locale)) {
          await input.blur()
          await page.evaluate(() => document.fonts.ready)
          await page.screenshot({ path: `${output}/${engine}-${locale}-${width}-create.png`, fullPage: true, animations: 'disabled' })
        }
        // Legacy title links and the back path still open the combined screen.
        await page.goto(`${base}/meetings/create?step=title&meetingType=ALL_DAY&title=Legacy&lang=${locale}`)
        await expect(input).toHaveValue('Legacy')
        await expect(page.locator('[data-meeting-type="ALL_DAY"]')).toHaveAttribute('aria-pressed', 'true')
        await next.click()
        await expect(page).toHaveURL(/step=dates/)
        assert.equal(new URL(page.url()).searchParams.get('meetingType'), 'ALL_DAY')
      }
      await page.goto(`${base}/${locale}/`)
      const faq = page.locator('#faq details')
      await expect(faq).toHaveCount(8)
      assert.equal(await faq.evaluateAll(elements => elements.some(el => el.open)), false)
      const firstAnswer = faq.first().locator('p')
      await expect(firstAnswer).toBeHidden()
      await faq.first().locator('summary').click()
      await expect(firstAnswer).toBeVisible()
      await faq.first().locator('summary').click()
      await expect(firstAnswer).toBeHidden()
      const secondary = page.locator('.hero .secondary')
      const primaryBox = await page.locator('.hero .primary').boundingBox()
      const secondaryBox = await secondary.boundingBox()
      assert.ok(secondaryBox.y >= primaryBox.y + primaryBox.height, `${locale}/${width}: invitation code belongs below Create meeting`)
      assert.ok(Math.abs(secondaryBox.x + secondaryBox.width / 2 - primaryBox.x - primaryBox.width / 2) < 2, `${locale}/${width}: home actions are centered`)
      assert.equal(await secondary.evaluate(el => getComputedStyle(el).borderTopWidth), '0px')
      assert.equal(await secondary.evaluate(el => getComputedStyle(el).textDecorationLine.includes('underline')), true)
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false)
      if (['ko', 'de', 'ar'].includes(locale)) {
        await page.evaluate(() => document.fonts.ready)
        await page.screenshot({ path: `${output}/${engine}-${locale}-${width}-home.png`, fullPage: true, animations: 'disabled' })
      }
      results.push({ engine, locale, width, ...geometry })
      console.log(`${engine}/${locale}/${width} passed`)
      await context.close()
    }
  } catch (error) {
    fs.writeFileSync(`${output}/failure.txt`, error.stack)
    throw error
  } finally { await browser.close() }
}
assert.deepEqual(errors, [])
assert.deepEqual(writes, [])
fs.writeFileSync(`${output}/verification.json`, JSON.stringify({
  passed: true, locales: locales.length, engines, cases: results.length, results, errors, writes,
}, null, 2))
