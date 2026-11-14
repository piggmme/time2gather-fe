import fs from 'node:fs/promises'
import sharp from 'sharp'

// favicon.svg is the editable master. All brand and share surfaces derive from it.
const logo = await fs.readFile('public/favicon.svg', 'utf8')
await fs.mkdir('public/brand', { recursive: true })
await fs.writeFile('public/brand/logo.svg', logo)
for (const [file, size] of [['public/favicon.png', 192], ['public/brand/icon-192.png', 192], ['public/brand/apple-touch-icon.png', 180]]) {
  await sharp(Buffer.from(logo)).resize(size, size).png().toFile(file)
}
const backdrop = `<defs><linearGradient id="background" x1="80" y1="40" x2="1120" y2="590" gradientUnits="userSpaceOnUse"><stop stop-color="#fbfcff"/><stop offset="1" stop-color="#eef2ff"/></linearGradient></defs><rect width="1200" height="630" fill="url(#background)"/><circle cx="1127" cy="45" r="220" fill="#ddd6fe" opacity=".38"/><circle cx="46" cy="606" r="180" fill="#dbeafe" opacity=".56"/>`
const mark = logo.replace('width="192" height="192"', 'x="100" y="86" width="460" height="460"')
const frame = content => `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">${backdrop}${content}</svg>\n`
await fs.writeFile('src/assets/meeting-share-background.svg', frame(`<g transform="translate(36 62.2) scale(.8)">${mark}</g>`))
const generic = frame(`${mark}<g font-family="'Noto Sans KR','Apple SD Gothic Neo','Segoe UI',sans-serif"><text x="625" y="246" fill="#4f46e5" font-size="34" font-weight="750">time2gather.org</text><text x="625" y="352" fill="#111827" font-size="76" font-weight="850">Time2Gather</text></g>`)
await fs.writeFile('public/time2gather-share.svg', generic)
const png = await sharp(Buffer.from(generic)).png().toBuffer()
await fs.writeFile('public/time2gather-share.png', png)
await fs.writeFile('public/share/brand-v2.png', png)

// Preserve the existing copy, typography and layout of published legacy cards.
// Only their clock region is replaced, using the same master as the live cards.
const clockRegion = await sharp(Buffer.from(frame(mark))).extract({ left: 0, top: 0, width: 560, height: 630 }).png().toBuffer()
for (const name of await fs.readdir('public/share/v1')) {
  if (!name.endsWith('.png')) continue
  const file = `public/share/v1/${name}`
  const updated = await sharp(await fs.readFile(file)).composite([{ input: clockRegion, left: 0, top: 0 }]).png().toBuffer()
  await fs.writeFile(file, updated)
}
console.log('Generated logo, favicon, Apple touch icon and share images in all 22 locales')
