import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { transformSync } = createRequire(createRequire(require.resolve('astro')).resolve('vite'))('esbuild')
const source = transformSync(fs.readFileSync('src/components/Admin/googleIdentity.ts', 'utf8'), { loader: 'ts', format: 'cjs' }).code

function setup () {
  const timers = new Map()
  const scripts = []
  const window = {
    setTimeout: (callback, delay) => {
      timers.set(callback, delay)
      return callback
    },
    clearTimeout: callback => timers.delete(callback),
  }
  const document = {
    createElement: () => ({ remove () { this.removed = true } }),
    head: { appendChild: script => scripts.push(script) },
  }
  const mod = { exports: {} }
  new Function('module', 'exports', 'window', 'document', source)(mod, mod.exports, window, document)
  return { ...mod.exports, window, timers, scripts }
}

// Concurrent mounts share one request and clear their timeout on success.
{
  const env = setup()
  const first = env.loadGoogle()
  assert.equal(first, env.loadGoogle())
  assert.equal(env.scripts.length, 1)
  const identity = { initialize () {}, renderButton () {}, disableAutoSelect () {} }
  env.window.google = { accounts: { id: identity } }
  env.scripts[0].onload()
  assert.equal(await first, identity)
  assert.equal(env.timers.size, 0)
  assert.equal(await env.loadGoogle(), identity)
  assert.equal(env.scripts.length, 1)
}

// Network failure, a stalled request and a malformed SDK all allow a fresh retry.
for (const failure of ['network', 'timeout', 'missing-api']) {
  const env = setup()
  const first = env.loadGoogle()
  const rejected = assert.rejects(first, /Google login unavailable/)
  if (failure === 'network') env.scripts[0].onerror()
  if (failure === 'missing-api') env.scripts[0].onload()
  if (failure === 'timeout') {
    const [[callback, delay]] = env.timers
    assert.equal(delay, 15000)
    callback()
  }
  await rejected
  assert.equal(env.scripts[0].removed, true)
  assert.equal(env.timers.size, 0)
  const retry = env.loadGoogle()
  assert.equal(env.scripts.length, 2)
  const identity = { initialize () {} }
  env.window.google = { accounts: { id: identity } }
  env.scripts[1].onload()
  assert.equal(await retry, identity)
}

console.log('Admin login tests passed: shared loading, existing SDK, timeout, network failure, malformed SDK and retries')

const credentialSource = transformSync(fs.readFileSync('src/services/adminCredential.ts', 'utf8'), { loader: 'ts', format: 'cjs' }).code
function loadCredentials (storage, legacyStorage = { getItem: () => null, removeItem () {} }) {
  const mod = { exports: {} }
  new Function('module', 'exports', 'window', credentialSource)(mod, mod.exports, { localStorage: storage, sessionStorage: legacyStorage })
  return mod.exports
}

// Reload and later browser sessions get fresh module memory but keep local storage.
{
  const saved = new Map()
  const storage = {
    getItem: key => saved.get(key) ?? null,
    setItem: (key, value) => saved.set(key, value),
    removeItem: key => saved.delete(key),
  }
  const first = loadCredentials(storage)
  assert.equal(first.getAdminCredential(), null)
  first.setAdminCredential('google-token')
  const reloaded = loadCredentials(storage)
  assert.equal(reloaded.getAdminCredential(), 'google-token')
  reloaded.setAdminCredential(null)
  assert.equal(saved.size, 0)
  assert.equal(loadCredentials(storage).getAdminCredential(), null)
}

// Storage denied: login and logout still work in memory without throwing.
{
  const denied = () => {
    throw new Error('Storage blocked')
  }
  const credentials = loadCredentials({ getItem: denied, setItem: denied, removeItem: denied })
  assert.equal(credentials.getAdminCredential(), null)
  credentials.setAdminCredential('google-token')
  assert.equal(credentials.getAdminCredential(), 'google-token')
  credentials.setAdminCredential(null)
  assert.equal(credentials.getAdminCredential(), null)
}
// Upgrade the previous tab-only storage without touching meeting cookies.
{
  const saved = new Map()
  const old = new Map([['time2gather.admin.credential', 'old-google-token']])
  const storage = map => ({
    getItem: key => map.get(key) ?? null,
    setItem: (key, value) => map.set(key, value),
    removeItem: key => map.delete(key),
  })
  assert.equal(loadCredentials(storage(saved), storage(old)).getAdminCredential(), 'old-google-token')
  assert.equal(old.size, 0)
  assert.equal(loadCredentials(storage(saved)).getAdminCredential(), 'old-google-token')
}
console.log('Admin credential tests passed: persistent restoration, logout cleanup, legacy migration and blocked storage fallback')

// Every production admin alias must use the same storage origin, preserving links.
{
  const layout = fs.readFileSync('src/layouts/AdminLayout.astro', 'utf8')
  const inline = layout.match(/<script is:inline>([\s\S]*?)<\/script>/)[1]
  const runRedirect = (href) => {
    let redirected = null
    const location = {
      hostname: new URL(href).hostname, href, replace: (value) => {
        redirected = value
      },
    }
    new Function('window', 'URL', inline)({ location }, URL)
    return redirected
  }
  for (const host of ['www.time2gather.org', 'time2gather-prod-2026.web.app', 'time2gather-prod-2026.firebaseapp.com']) {
    for (const path of ['/admin?lang=ar#admin-users-title', '/admin/login?lang=de']) {
      assert.equal(runRedirect(`https://${host}${path}`), `https://time2gather.org${path}`)
    }
  }
  for (const host of ['time2gather.org', 'localhost:3000', 'candidate---time2gather-web.example.run.app', 'www.time2gather.org.attacker.example']) {
    assert.equal(runRedirect(`https://${host}/admin?lang=ko`), null)
  }
  assert.ok(layout.indexOf('<script is:inline>') < layout.indexOf('<LocaleFonts'))
}
console.log('Admin origin tests passed: production aliases, query/fragment preservation, canonical/local/candidate hosts and lookalikes')

// Use Axios' real interceptor pipeline with a controlled adapter: no external requests.
const axiosLibrary = require('axios')
const adminSource = transformSync(fs.readFileSync('src/services/admin.ts', 'utf8'), {
  loader: 'ts', format: 'cjs', define: { 'import.meta.env.PUBLIC_API_URL': '"/api"' },
}).code
function setupAdminApi (adapter) {
  const saved = new Map()
  const credentials = loadCredentials({
    getItem: key => saved.get(key) ?? null,
    setItem: (key, value) => saved.set(key, value),
    removeItem: key => saved.delete(key),
  })
  const events = []
  const dependencies = {
    'axios': { __esModule: true, default: { create: options => axiosLibrary.create({ ...options, adapter }) } },
    '../i18n': { getLocaleFromContext: () => 'ko' },
    './adminCredential': credentials,
  }
  const mod = { exports: {} }
  new Function('require', 'module', 'exports', 'window', adminSource)(
    name => dependencies[name], mod, mod.exports, { dispatchEvent: event => events.push(event.type) },
  )
  return { ...mod.exports, credentials, events }
}
{
  const requests = []
  const env = setupAdminApi(async (config) => {
    requests.push(config)
    const identity = { subject: 'test', email: 'admin@example.test', expiresAt: new Date(Date.now() + 30 * 86400000).toISOString() }
    const data = config.method === 'post' ? { credential: 't2ga.new-session', identity } : identity
    return { status: 200, data: { success: true, data }, headers: {}, config }
  })
  env.credentials.setAdminCredential('t2ga.existing-session')
  await env.getAdminSession()
  await env.getAdminConfig()
  await env.createAdminSession('fresh-google-token')
  assert.equal(requests[0].headers.get('Authorization'), 'Bearer t2ga.existing-session')
  assert.equal(requests[2].headers.get('Authorization'), 'Bearer fresh-google-token')
  assert.equal(env.credentials.getAdminCredential(), 't2ga.new-session')
  for (const request of requests) assert.equal(request.timeout, 60000)
  await env.admin.summary.get()
  assert.equal(requests.at(-1).timeout, 15000)
  assert.deepEqual(env.events, [])
}
for (const failure of ['timeout', 'network', 'server', 'unauthorized']) {
  const env = setupAdminApi(async (config) => {
    const response = ['server', 'unauthorized'].includes(failure)
      ? { status: failure === 'server' ? 503 : 401, data: {}, headers: {}, config }
      : undefined
    throw new axiosLibrary.AxiosError(failure, failure === 'timeout' ? 'ECONNABORTED' : 'ERR_NETWORK', config, null, response)
  })
  env.credentials.setAdminCredential('t2ga.saved-session')
  await assert.rejects(env.getAdminSession(), new RegExp(failure))
  if (failure === 'unauthorized') {
    assert.equal(env.credentials.getAdminCredential(), null)
    assert.deepEqual(env.events, ['admin-session-expired'])
  } else {
    assert.equal(env.credentials.getAdminCredential(), 't2ga.saved-session')
    assert.deepEqual(env.events, [])
  }
}
console.log('Admin restore request tests passed: 60s auth bootstrap, 15s dashboard calls, explicit Google identity, transient failure preservation and real 401 cleanup')
