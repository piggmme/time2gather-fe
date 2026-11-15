import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { chromium, expect } from '@playwright/test'

const base = process.env.LANDING_BASE ?? 'http://127.0.0.1:14329'
const output = process.env.LANDING_OUTPUT ?? '.preflight/evidence/landing'
const locales = process.env.QA_LOCALES?.split(',') ?? (await fs.readdir('src/i18n/locales')).filter(file => file.endsWith('.json')).map(file => file.slice(0, -5))
const browser = await chromium.launch()
const results = []
await fs.mkdir(output, { recursive: true })

try {
  for (const locale of locales) {
    const sizes = [{ width: 390, height: 844 }, { width: 1280, height: 900 }]
    if (['ko', 'de', 'ar'].includes(locale)) sizes.push({ width: 320, height: 568 }, { width: 375, height: 667 }, { width: 800, height: 900 })
    for (const viewport of sizes) {
      const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport, reducedMotion: 'reduce' })
      await context.route(/googletagmanager|google-analytics/, route => route.abort())
      const page = await context.newPage()
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      await page.goto(`${base}/${locale}/`)
      await page.evaluate(() => document.fonts.ready)
      await page.addStyleTag({ content: 'astro-dev-toolbar { display: none !important; }' })
      const messages = JSON.parse(await fs.readFile(`src/i18n/locales/${locale}.json`, 'utf8'))
      const demo = page.locator('[data-availability-demo]')
      await expect(demo.getByRole('heading')).toHaveText(messages.availabilityDemo.sample)
      await expect(page.locator('.hero .actions a')).toHaveCount(1)
      await expect(page.locator('.hero a[href*="/meetings/search"]')).toHaveCount(0)
      const geometry = await page.evaluate(() => {
        const demo = document.querySelector('[data-availability-demo]').getBoundingClientRect()
        const hero = document.querySelector('.hero').getBoundingClientRect()
        return {
          demoTop: demo.top, demoBottom: demo.bottom, heroBottom: hero.bottom, overflow: document.documentElement.scrollWidth > innerWidth + 1, buttons: [...document.querySelectorAll('.hero .actions a')].map(el => ({ height: el.getBoundingClientRect().height, width: el.getBoundingClientRect().width, clipped: el.scrollWidth > el.clientWidth + 1 })),
        }
      })
      const id = `${locale}-${viewport.width}x${viewport.height}`
      assert.equal(geometry.overflow, false, `${id}: horizontal overflow`)
      assert.ok(geometry.heroBottom <= geometry.demoTop + 1, `${id}: introduction overlaps example`)
      for (const button of geometry.buttons) {
        assert.ok(button.height >= 44 && button.width >= 44 && !button.clipped, `${id}: inaccessible or clipped action`)
      }
      if ((viewport.width === 390 && viewport.height === 844) || (locale === 'ko' && viewport.width < 390)) {
        assert.ok(geometry.demoBottom <= viewport.height + 1, `${id}: complete example must fit the opening screen (bottom ${geometry.demoBottom})`)
      }
      const table = demo.getByRole('table', { name: messages.availabilityDemo.tableLabel })
      await expect(table).toBeVisible()
      await expect(table.locator('tbody tr')).toHaveCount(3)
      await expect(table.locator('[data-count="4"] [aria-hidden="true"]')).toHaveText('✓')
      await expect(demo.locator('strong')).toHaveText(messages.availabilityDemo.compactResult)
      await expect(page.locator('.hero .primary')).toHaveAttribute('href', `/meetings/create?lang=${locale}`)
      const codeLink = page.locator(viewport.width <= 800 ? '.t2g-site-header__menu-panel a[href*="/meetings/search"]' : '.t2g-site-header__nav a[href*="/meetings/search"]')
      await expect(codeLink).toHaveAttribute('href', `/meetings/search?lang=${locale}`)
      if (viewport.width <= 800) {
        const menu = page.locator('.t2g-site-header__menu')
        await menu.locator('summary').click()
        await expect(codeLink).toBeVisible()
        await menu.locator('summary').click()
      }
      const faq = page.locator('.faq details').first()
      await expect(faq).not.toHaveAttribute('open')
      await faq.locator('summary').click()
      await expect(faq.locator('p')).toBeVisible()
      await faq.locator('summary').click()
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
      await page.mouse.move(0, 0)
      assert.deepEqual(errors, [], `${id}: browser errors`)
      if (['ko', 'de', 'ar'].includes(locale)) await page.screenshot({ path: `${output}/after-${id}.png` })
      results.push({ locale, ...viewport, ...geometry })
      await context.close()
    }
  }
  await fs.writeFile(`${output}/results.json`, JSON.stringify(results, null, 2))
  await fs.writeFile(`${output}/verification.json`, JSON.stringify({ passed: true, locales: locales.length, cases: results.length, engines: ['chromium'], results }, null, 2))
  console.log(`Landing checks passed: ${results.length} screens across ${locales.length} locales`)
} finally {
  await browser.close()
}
