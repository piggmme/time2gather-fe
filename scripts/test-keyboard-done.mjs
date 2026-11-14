import assert from 'node:assert/strict'
import fs from 'node:fs'
import { chromium, webkit, devices, expect } from '@playwright/test'

const base = process.env.DONE_BASE ?? 'http://127.0.0.1:14335'
const output = process.env.DONE_OUTPUT ?? '../keyboard-local'
const locales = process.env.QA_LOCALES?.split(',') ?? fs.readdirSync('src/i18n/locales').map(file => file.slice(0, -5))
const engines = process.env.DONE_ENGINES?.split(',') ?? ['chromium', 'webkit']
const results = []
fs.mkdirSync(output, { recursive: true })
for (const engine of engines) {
  const browser = await (engine === 'webkit' ? webkit.launch() : chromium.launch())
  try {
    for (const locale of locales) {
      const t = JSON.parse(fs.readFileSync(`src/i18n/locales/${locale}.json`))
      const context = await browser.newContext({ ...devices[engine === 'webkit' ? 'iPhone 13' : 'Pixel 7'], locale })
      await context.route(/googletagmanager|google-analytics|firestore.googleapis|firebaseinstallations.googleapis/, route => route.abort())
      const writes = []
      await context.route('**/api/**', async (route) => {
        if (route.request().method() !== 'GET') writes.push(route.request().url())
        await route.fulfill({ status: 200, json: {} })
      })
      const page = await context.newPage()
      await page.goto(`${base}/meetings/create?step=title&meetingType=TIME&lang=${locale}`)
      const title = page.getByRole('textbox').first()
      await title.fill('Weekend')
      await title.press('Enter')
      await expect(title).not.toBeFocused()
      await expect(title).toHaveValue('Weekend')
      await expect(page).toHaveURL(/step=title/)
      await expect(title).toHaveAttribute('enterkeyhint', 'done')
      await title.focus()
      await title.evaluate(input => input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true, cancelable: true })))
      await expect(title).toBeFocused()
      await title.evaluate(input => input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 229, bubbles: true, cancelable: true })))
      await expect(title).toBeFocused()

      await page.goto(`${base}/meetings/create?step=timeRange&meetingType=TIME&dates=2026-11-15&title=Weekend&lang=${locale}`)
      const start = page.getByRole('combobox', { name: t.createMeeting.timeRangeStep.startTime, exact: true })
      const end = page.getByRole('combobox', { name: t.createMeeting.timeRangeStep.endTime, exact: true })
      await start.fill('9')
      await start.press('Enter')
      await expect(start).toHaveValue('09:00')
      await expect(start).not.toBeFocused()
      await expect(start).toHaveAttribute('enterkeyhint', 'done')
      await expect(page).toHaveURL(/step=timeRange/)
      for (const bad of ['09:20', 'noon']) {
        await start.fill(bad)
        await start.press('Enter')
        await expect(start).toBeFocused()
        await expect(start).toHaveAttribute('aria-invalid', 'true')
        await expect(page.getByRole('button', { name: t.common.next, exact: true })).toBeDisabled()
      }
      await start.fill('9')
      await start.evaluate(input => input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true, cancelable: true })))
      await expect(start).toBeFocused()
      await expect(start).toHaveValue('9')
      await start.press('Enter')
      await end.fill('08:00')
      await end.press('Enter')
      await expect(end).toBeFocused()
      await expect(end).toHaveAttribute('aria-invalid', 'true')
      await page.locator('select[name=intervalMinutes]').selectOption('30')
      await start.fill('930')
      await start.press('Enter')
      await expect(start).not.toBeFocused()
      await expect(start).toHaveValue('09:30')
      await end.fill('12')
      await end.press('Enter')
      await expect(end).toHaveValue('12:00')
      await expect(end).not.toBeFocused()
      await start.focus()
      await start.press('ArrowDown')
      const list = page.getByRole('listbox', { name: t.createMeeting.timeRangeStep.startTime, exact: true })
      await expect(list).toBeVisible()
      await start.press('ArrowDown')
      const selectedTime = await list.locator('[data-combobox-selected]').getAttribute('data-time')
      await start.press('Enter')
      await expect(start).toHaveValue(selectedTime)
      await expect(list).toBeHidden()
      await expect(start).not.toBeFocused()
      // Android IMEs can send Enter with an empty KeyboardEvent.code.
      await start.fill('09:30')
      await start.press('ArrowDown')
      await start.press('ArrowDown')
      const nativeSelectedTime = await list.locator('[data-combobox-selected]').getAttribute('data-time')
      await start.evaluate(input => input.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter', code: '', keyCode: 13, bubbles: true, cancelable: true,
      })))
      await expect(start).toHaveValue(nativeSelectedTime)
      await expect(list).toBeHidden()
      await expect(start).not.toBeFocused()
      await start.fill('09:30')
      await start.press('ArrowDown')
      await list.locator('[data-time="11:00"]').tap()
      await expect(start).toHaveValue('11:00')
      await expect(start).not.toBeFocused()
      assert.deepEqual(writes, [], 'Done must not create a meeting or save a vote')
      if (['ko', 'de', 'ar'].includes(locale)) await page.screenshot({ path: `${output}/${engine}-${locale}-done.png`, fullPage: true })
      results.push({
        engine, locale, titleDone: true, timeDone: true, invalidStaysFocused: true, compositionPreserved: true, selectedOptionDone: true, noWrites: true,
      })
      await context.close()
    }
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
    const page = await context.newPage()
    await page.goto(`${base}/meetings/create?step=title&lang=en`)
    const title = page.getByRole('textbox').first()
    await title.fill('Desktop')
    await title.press('Enter')
    await expect(title).toBeFocused()
    await title.press('Tab')
    await expect(title).not.toBeFocused()
    await context.close()
  } finally { await browser.close() }
}
fs.writeFileSync(`${output}/verification.json`, JSON.stringify({
  passed: true, locales: locales.length, results, desktopEnterAndTabPreserved: true, scope: 'Browser engine mobile emulation; does not verify a native software keyboard',
}, null, 2))
console.log(`PASS ${results.length} mobile browser cases and desktop keyboard regression`)
