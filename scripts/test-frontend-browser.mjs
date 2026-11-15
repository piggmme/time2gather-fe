import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { waitForServer } from './wait-for-server.mjs'

const output = path.resolve('.preflight/evidence')
fs.mkdirSync(output, { recursive: true })
const children = []
const serverLogs = []
// Caller shell variables must not silently narrow the required language suite.
for (const name of ['QA_LOCALES', 'UI_WIDTHS', 'UI_SCENARIO', 'UI_ENGINES', 'BUTTON_WIDTHS', 'BUTTON_BASE', 'CREATE_RED', 'PICKER_ENGINE', 'SHARE_IMAGE_BASELINE']) {
  delete process.env[name]
}

function start (args, env = {}) {
  const child = spawn(process.execPath, args, { env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] })
  let logs = ''
  child.stdout.on('data', (chunk) => {
    logs += chunk
  })
  child.stderr.on('data', (chunk) => {
    logs += chunk
  })
  children.push(child)
  serverLogs.push({ args, child, logs: () => logs })
  return { child, logs: () => logs }
}

async function run (args, env = {}) {
  const child = spawn(process.execPath, args, { env: { ...process.env, ...env }, stdio: 'inherit' })
  children.push(child)
  await new Promise((resolve, reject) => {
    child.on('error', reject)
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(`${args.join(' ')} failed (${code})`)))
  })
}

try {
  await run(['node_modules/@playwright/test/cli.js', 'install', 'chromium', 'webkit'])
  await run(['node_modules/astro/astro.js', 'preferences', 'disable', 'devToolbar'])
  const fixture = start(['scripts/test-time-picker-fixture.mjs'])
  await waitForServer('http://127.0.0.1:18485/api/v1/auth/me', fixture.child, { logs: fixture.logs })
  const server = start(['dist/server/entry.mjs'], { HOST: '127.0.0.1', PORT: '14326', API_URL: 'http://127.0.0.1:18485/api' })
  await waitForServer('http://127.0.0.1:14326/meetings/create', server.child, { logs: server.logs })
  const dev = start(['node_modules/astro/astro.js', 'dev', '--host', '127.0.0.1', '--port', '14325'], {
    API_URL: 'http://127.0.0.1:18485/api', PUBLIC_API_URL: '/api',
  })
  await waitForServer('http://127.0.0.1:14325/meetings/create', dev.child, { logs: dev.logs })
  const suites = [
    ['test-landing-first-screen.mjs', { LANDING_BASE: 'http://127.0.0.1:14326', LANDING_OUTPUT: `${output}/landing` }],
    ['test-keyboard-done.mjs', { DONE_ENGINES: 'chromium', DONE_BASE: 'http://127.0.0.1:14326', DONE_OUTPUT: `${output}/keyboard` }],
    ['test-ui-refinement.mjs', { UI_BASE: 'http://127.0.0.1:14326', UI_OUTPUT: `${output}/ui` }],
    ['test-brand-assets.mjs', { BRAND_BASE: 'http://127.0.0.1:14326', BRAND_OUTPUT: `${output}/brand` }],
    ['verify-meeting-name-copy.mjs', { NAME_COPY_BASE: 'http://127.0.0.1:14326', NAME_COPY_OUTPUT: `${output}/name-copy` }],
    ['test-share-images.mjs', { SHARE_IMAGE_OUTPUT: `${output}/share-images` }],
    ['test-time-picker.mjs', { PICKER_CHANNEL: 'chromium', PICKER_BASE: 'http://127.0.0.1:14326', PICKER_OUTPUT: `${output}/picker` }],
    ['test-create-flow-layout.mjs', { QA_LOCALES: 'ko,de,ar', CREATE_BASE: 'http://127.0.0.1:14326', CREATE_OUTPUT: `${output}/layout` }],
    ['test-half-hour-slots.mjs', { HALF_HOUR_BASE: 'http://127.0.0.1:14325', HALF_HOUR_OUTPUT: `${output}/half-hour` }],
    ['test-button-roles.mjs', {
      BUTTON_SCENARIOS: 'home,search,create,time,guest-vote,comments,reply,reactions,edit', BUTTON_OUTPUT: `${output}/buttons`,
    }],
  ]
  for (const [script, env] of suites) {
    console.log(`Browser regression: ${script}`)
    await run([`scripts/${script}`], env)
  }
  const consistency = start(['--import', './scripts/fixture-ssr-loader.mjs', 'dist/server/entry.mjs'], {
    HOST: '127.0.0.1', PORT: '14401', PREFLIGHT_FIXTURE_API: 'http://127.0.0.1:18481',
  })
  await waitForServer('http://127.0.0.1:14401/meetings/create', consistency.child, { logs: consistency.logs })
  await run(['scripts/test-ui-consistency.mjs'], {
    UI_CONSISTENCY_BASE: 'http://127.0.0.1:14401', UI_CONSISTENCY_OUTPUT: `${output}/consistency`,
  })
  fs.copyFileSync(`${output}/consistency/green.json`, `${output}/consistency/verification.json`)
} catch (error) {
  for (const server of serverLogs) console.error(JSON.stringify({ server: server.args, exitCode: server.child.exitCode, signalCode: server.child.signalCode, logs: server.logs().slice(-4000) }))
  throw error
} finally {
  await Promise.all(children.filter(child => child.exitCode === null && !child.signalCode).map(child => new Promise((resolve) => {
    child.once('exit', resolve)
    child.kill('SIGTERM')
    const timer = setTimeout(() => child.kill('SIGKILL'), 3000)
    timer.unref()
  })))
}
