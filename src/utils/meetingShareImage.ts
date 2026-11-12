import { createHash } from 'node:crypto'
import sharp from 'sharp'
import backgroundSvg from '../assets/meeting-share-background.svg?raw'
import { intlLocale, normalizeLocale, localeMeta } from '../i18n/config'
import { marketingCopy } from '../marketing/copy'
import type { get_meetings_$meetingCode_response } from '../services/meetings'

type Meeting = Pick<get_meetings_$meetingCode_response['data']['meeting'], 'creatorLocale' | 'confirmedDate' | 'confirmedTime' | 'timezone' | 'selectionType'>
type Card = { heading: string, detail: string, timezone: string, rtl: boolean }
const imageCache = new Map<string, Promise<Buffer>>()
const background = sharp(Buffer.from(backgroundSvg)).png().toBuffer()
const escapeMarkup = (text: string) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')

export function meetingShareCard (meeting: Meeting): Card {
  const locale = normalizeLocale(meeting.creatorLocale)
  const rtl = locale ? localeMeta[locale].dir === 'rtl' : false
  if (!meeting.confirmedDate) {
    return { heading: locale ? marketingCopy[locale].hero.title : '', detail: '', timezone: '', rtl }
  }
  // Stored calendar dates and wall times belong to the meeting's timezone.
  // UTC is only a formatting anchor; never convert these values to the server/viewer's timezone.
  const date = new Date(`${meeting.confirmedDate.slice(0, 10)}T12:00:00Z`)
  const heading = locale
    ? new Intl.DateTimeFormat(intlLocale(locale), {
        timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric', weekday: 'short',
      }).format(date)
    : meeting.confirmedDate.slice(0, 10)
  const time = meeting.confirmedTime
  const allDay = !time || time === 'ALL_DAY'
  const detail = allDay
    ? ''
    : locale
      ? new Intl.DateTimeFormat(intlLocale(locale), {
          timeZone: 'UTC', hour: 'numeric', minute: '2-digit',
        }).format(new Date(`2000-01-01T${time.length === 5 ? time + ':00' : time}Z`))
      : time
  return { heading, detail, timezone: allDay ? '' : meeting.timezone, rtl }
}

function cardKey (card: Card) {
  return createHash('sha256').update(JSON.stringify(card)).digest('hex').slice(0, 16)
}

export function meetingShareImagePath (code: string, meeting: Meeting): string {
  return `/share/meetings/${encodeURIComponent(code)}?v=3-${cardKey(meetingShareCard(meeting))}`
}

async function textLayer (text: string, sizes: number[], maxHeight: number, color: string, rtl = false) {
  // Pin the existing Hangul fallback: trimming the font catalog can otherwise
  // change fontconfig's tie-break between the proportional and mono CJK faces.
  const family = /[\uac00-\ud7a3]/u.test(text) ? 'Noto Sans, Noto Sans Mono CJK KR' : 'Noto Sans'
  for (const size of sizes) {
    const result = await sharp({
      text: {
        text: `<span foreground="${color}">${escapeMarkup(text)}</span>`,
        font: `${family} Bold ${size}`, width: 600, wrap: 'word-char',
        align: rtl ? 'right' : 'left', rgba: true,
      },
    }).png().toBuffer({ resolveWithObject: true })
    if (result.info.height <= maxHeight) return result
  }
  throw new Error('Share image text exceeds its layout bounds')
}

async function renderImage (card: Card): Promise<Buffer> {
  const brand = await textLayer('Time2Gather', [36], 60, '#5145c6')
  const layers = [brand]
  if (card.heading) layers.push(await textLayer(card.heading, [60, 54, 48, 42, 36, 30], 170, '#191f28', card.rtl))
  if (card.detail) layers.push(await textLayer(card.detail, [44, 38, 32, 28], 100, '#191f28', card.rtl))
  if (card.timezone) layers.push(await textLayer(card.timezone, [26, 24, 22], 65, '#596579'))
  let top = Math.round(315 - (layers.reduce((sum, layer) => sum + layer.info.height, 0) + 24 * (layers.length - 1)) / 2)
  return sharp(await background).composite(layers.map((layer) => {
    const item = { input: layer.data, left: 520, top }
    top += layer.info.height + 24
    return item
  })).png().toBuffer()
}

export function renderMeetingShareImage (meeting: Meeting): Promise<Buffer> {
  const card = meetingShareCard(meeting)
  const key = cardKey(card)
  const cached = imageCache.get(key)
  if (cached) return cached
  const result = renderImage(card).catch((error) => {
    imageCache.delete(key)
    throw error
  })
  if (imageCache.size >= 32) imageCache.delete(imageCache.keys().next().value!)
  imageCache.set(key, result)
  return result
}
