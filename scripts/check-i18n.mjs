import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const localeNames = [...fs.readFileSync('src/i18n/config.ts', 'utf8').matchAll(/'([^']+)': \{ label:/g)].map(match => match[1])
const errors = []
const flatten = (value, prefix = '', result = {}) => {
  if (value && typeof value === 'object' && 'other' in value && typeof value.other === 'string') {
    result[prefix] = Object.values(value)
  } else if (typeof value === 'string') result[prefix] = [value]
  else for (const [key, child] of Object.entries(value)) flatten(child, prefix ? `${prefix}.${key}` : key, result)
  return result
}
const catalogs = Object.fromEntries(localeNames.map((locale) => {
  const file = `src/i18n/locales/${locale}.json`
  if (!fs.existsSync(file)) {
    errors.push(`Missing catalog ${locale}`)
    return [locale, {}]
  }
  return [locale, flatten(JSON.parse(fs.readFileSync(file, 'utf8')))]
}))
const allKeys = new Set(Object.values(catalogs).flatMap(messages => Object.keys(messages)))
const placeholders = text => [...text.matchAll(/\{([^}]+)\}/g)].map(match => match[1]).sort().join(',')
for (const key of allKeys) {
  const expected = placeholders(catalogs.en[key]?.[0] ?? '')
  for (const [locale, messages] of Object.entries(catalogs)) {
    if (!(key in messages)) {
      errors.push(`[${locale}] missing key: ${key}`)
      continue
    }
    for (const message of messages[key]) {
      if (!message.trim()) errors.push(`[${locale}] empty: ${key}`)
      if (placeholders(message) !== expected) errors.push(`[${locale}] placeholder mismatch: ${key}`)
      if (/ZXQPH|98375\d{4}/.test(message)) errors.push(`[${locale}] untranslated token: ${key}`)
    }
  }
}
const sourceFiles = []
function collect (directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name)
    if (entry.isDirectory()) collect(file)
    else if (/\.(?:ts|tsx|astro)$/.test(entry.name)) sourceFiles.push(file)
  }
}
collect(path.join(root, 'src'))
for (const file of sourceFiles) {
  for (const match of fs.readFileSync(file, 'utf8').matchAll(/\bt\(\s*['"]([^'"]+)['"]/g)) {
    if (!allKeys.has(match[1])) errors.push(`${path.relative(root, file)} uses missing key: ${match[1]}`)
  }
}
// Marketing pages use the same locale set. Existing translations live in copy.ts.
const marketingSource = fs.readFileSync('src/marketing/copy.ts', 'utf8')
const marketingBase = flatten(JSON.parse(fs.readFileSync('src/marketing/locales/pcm.json', 'utf8')))
for (const locale of localeNames) {
  const file = `src/marketing/locales/${locale}.json`
  if (!fs.existsSync(file)) {
    if (!marketingSource.includes(`'${locale}': {`)) errors.push(`Missing marketing locale: ${locale}`)
    continue
  }
  const messages = flatten(JSON.parse(fs.readFileSync(file, 'utf8')))
  for (const key of Object.keys(marketingBase)) if (!messages[key]?.[0]?.trim()) errors.push(`[${locale}] missing marketing key: ${key}`)
}
if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}
console.log(`i18n check passed: ${allKeys.size} messages across ${localeNames.length} locales; placeholders and marketing coverage verified`)
