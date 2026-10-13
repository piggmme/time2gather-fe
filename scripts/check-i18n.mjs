import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const locales = Object.fromEntries(
  ['ko', 'en'].map(locale => [
    locale,
    JSON.parse(fs.readFileSync(path.join(root, `src/i18n/locales/${locale}.json`), 'utf8')),
  ]),
)

const flatten = (value, prefix = '', result = {}) => {
  for (const [key, child] of Object.entries(value)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (child && typeof child === 'object' && !Array.isArray(child)) {
      flatten(child, fullKey, result)
    } else {
      result[fullKey] = child
    }
  }
  return result
}

const flattened = Object.fromEntries(
  Object.entries(locales).map(([locale, messages]) => [locale, flatten(messages)]),
)
const errors = []
const allKeys = new Set(Object.values(flattened).flatMap(messages => Object.keys(messages)))

for (const key of allKeys) {
  for (const locale of Object.keys(flattened)) {
    if (!(key in flattened[locale])) errors.push(`[${locale}] missing key: ${key}`)
  }

  const placeholders = Object.fromEntries(
    Object.entries(flattened).map(([locale, messages]) => [
      locale,
      [...String(messages[key] ?? '').matchAll(/\{([^}]+)\}/g)].map(match => match[1]).sort().join(','),
    ]),
  )
  if (new Set(Object.values(placeholders)).size > 1) {
    errors.push(`placeholder mismatch: ${key} (${JSON.stringify(placeholders)})`)
  }
}

const sourceFiles = []
const collectSourceFiles = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) collectSourceFiles(entryPath)
    else if (/\.(?:ts|tsx|astro)$/.test(entry.name)) sourceFiles.push(entryPath)
  }
}
collectSourceFiles(path.join(root, 'src'))

for (const file of sourceFiles) {
  const source = fs.readFileSync(file, 'utf8')
  for (const match of source.matchAll(/\bt\(\s*['"]([^'"]+)['"]/g)) {
    if (!allKeys.has(match[1])) {
      errors.push(`${path.relative(root, file)} uses missing key: ${match[1]}`)
    }
  }
}

if (errors.length > 0) {
  console.error(errors.join('\n'))
  process.exit(1)
}

console.log(`i18n check passed: ${allKeys.size} keys across ${Object.keys(locales).join(', ')}`)
