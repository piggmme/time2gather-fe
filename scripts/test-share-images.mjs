import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import sharp from 'sharp'

const chunks = path.resolve('dist/server/chunks')
const name = (await fs.readdir(chunks)).find(name => name.startsWith('meetingShareImage_'))
assert.ok(name, 'Built image renderer must exist')
const exports = Object.values(await import(pathToFileURL(path.join(chunks, name)).href))
const render = exports.find(value => typeof value === 'function' && value.name === 'renderMeetingShareImage')
const imagePath = exports.find(value => typeof value === 'function' && value.name === 'meetingShareImagePath')
assert.ok(render && imagePath)
const base = {
  creatorLocale: 'ko', timezone: 'Asia/Seoul', selectionType: 'TIME', confirmedDate: null, confirmedTime: null,
}
const confirmed = { ...base, confirmedDate: '2026-11-07', confirmedTime: '15:00:00' }
assert.notEqual(imagePath('meeting', base), imagePath('meeting', confirmed))
assert.notEqual(imagePath('meeting', confirmed), imagePath('meeting', { ...confirmed, confirmedTime: '16:00' }))
assert.notEqual(imagePath('meeting', confirmed), imagePath('meeting', { ...confirmed, timezone: 'America/New_York' }))
assert.notEqual(imagePath('meeting', confirmed), imagePath('meeting', { ...confirmed, creatorLocale: 'en' }))
assert.equal(imagePath('meeting', base), imagePath('meeting', { ...base, title: 'Long ignored title'.repeat(30) }))
assert.equal(imagePath('code/one', base).split('?')[0], '/share/meetings/code%2Fone')
const locales = ['en', 'zh-CN', 'hi', 'es', 'ar', 'fr', 'bn', 'pt', 'ru', 'id', 'ur', 'de', 'ja', 'pcm', 'ar-EG', 'mr', 'vi', 'te', 'ha', 'tr', 'ko', 'th']
const out = process.env.SHARE_IMAGE_OUTPUT || '/tmp/share-images'
await fs.mkdir(out, { recursive: true })
for (const locale of [...locales, null]) {
  for (const state of ['pending', 'confirmed', 'all-day', 'date-with-time']) {
    const meeting = { ...(state === 'pending' ? base : confirmed), creatorLocale: locale }
    if (state === 'all-day') {
      meeting.selectionType = 'ALL_DAY'
      meeting.confirmedTime = null
    }
    if (state === 'date-with-time') meeting.selectionType = 'ALL_DAY'
    const png = await render(meeting)
    const meta = await sharp(png).metadata()
    assert.equal(meta.width, 1200)
    assert.equal(meta.height, 630)
    assert.equal(meta.format, 'png')
    const filename = `${locale || 'legacy'}-${state}.png`
    if (process.env.SHARE_IMAGE_BASELINE) {
      const baseline = await fs.readFile(path.join(process.env.SHARE_IMAGE_BASELINE, filename))
      assert.deepEqual(await sharp(png).raw().toBuffer(), await sharp(baseline).raw().toBuffer(), `${filename}: rendered pixels changed`)
    }
    await fs.writeFile(path.join(out, filename), png)
  }
}
assert.equal(await render(base), await render(base), 'Repeated cards reuse the rendered image')
assert.equal(await render(confirmed), await render({ ...confirmed, confirmedTime: '15:00' }))
assert.equal(await render({ ...confirmed, selectionType: 'ALL_DAY' }), await render(confirmed))
const dateOnly = { ...confirmed, selectionType: 'ALL_DAY', confirmedTime: null }
assert.equal(await render(dateOnly), await render({ ...dateOnly, confirmedTime: 'ALL_DAY', timezone: 'Pacific/Honolulu' }))
assert.notEqual(imagePath('meeting', dateOnly), imagePath('meeting', { ...dateOnly, confirmedTime: '18:00' }), 'Adding a time to date voting invalidates the image URL')
console.log('92 cards passed: 22 languages + legacy × pending, confirmed, date-only and date-with-time. State, time, timezone, language cache invalidation verified.')
