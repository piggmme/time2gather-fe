import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

// Runs inside the prebuilt image before any image or cache tag is pushed.
const root = path.resolve(process.argv[2] || process.cwd())
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'release-manifest.json'), 'utf8'))
assert.equal(manifest.version, 1)
const files = {}
function walk (relative) {
  const absolute = path.join(root, relative)
  assert.equal(fs.lstatSync(absolute).isSymbolicLink(), false, `Unexpected symlink: ${relative}`)
  if (fs.statSync(absolute).isDirectory()) {
    for (const name of fs.readdirSync(absolute).sort()) walk(`${relative}/${name}`)
  } else {
    files[relative] = crypto.createHash('sha256').update(fs.readFileSync(absolute)).digest('hex')
  }
}
walk('dist')
walk('public')
assert.deepEqual(files, manifest.files, 'Image files must match the verified Hosting/server artifact')
assert(Object.hasOwn(files, 'dist/server/entry.mjs'))
console.log(`Verified ${Object.keys(files).length} image release files`)
