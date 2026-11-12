import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { transformSync } = createRequire(createRequire(require.resolve('astro')).resolve('vite'))('esbuild')
const module = { exports: {} }
new Function('module', 'exports', transformSync(fs.readFileSync('src/components/Comments/mentions.ts', 'utf8'), { loader: 'ts', format: 'cjs' }).code)(module, module.exports)
const { moveMentions, mentionQuery } = module.exports
const selected = [{ userId: '9007199254740993', start: 0, end: 3 }]
assert.deepEqual(moveMentions('@민수 확인', '@민수 확인해요', selected), selected)
assert.deepEqual(moveMentions('@민수 확인', '🙂 @민수 확인', selected), [{ ...selected[0], start: 3, end: 6 }])
assert.deepEqual(moveMentions('@민수 확인', '@민지 확인', selected), [])
assert.deepEqual(moveMentions('@민수 확인', '확인', selected), [])
assert.deepEqual(moveMentions('@민수 확인', '@민수님 확인', selected), selected)
assert.deepEqual(moveMentions('@민수 확인', '@민🙂수 확인', selected), [])
assert.deepEqual(mentionQuery('안녕 @민', 5), { start: 3, end: 5, query: '민' })
assert.equal(mentionQuery('email@example.com', 17), null)
assert.equal(mentionQuery('@민수\n다음 줄', 8), null)
assert.deepEqual(mentionQuery('@Same Name', 10), { start: 0, end: 10, query: 'Same Name' })
console.log('Comment mention identity, Unicode offsets, editing and query tests passed.')
