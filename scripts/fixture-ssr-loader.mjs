import http from 'node:http'
import https from 'node:https'
import { syncBuiltinESMExports } from 'node:module'

// Built SSR has the production API URL compiled in. Redirect only its reads to
// the disposable fixture, as well as intercepting browser requests in the test.
const fixture = new URL(process.env.PREFLIGHT_FIXTURE_API)
if (fixture.hostname !== '127.0.0.1') throw new Error('SSR fixture must be local')
const original = https.request
https.request = function (options, ...rest) {
  if (options?.hostname === 'time2gather.org' && options.path?.startsWith('/api/')) {
    if (options.method && options.method !== 'GET') throw new Error('QA SSR writes are forbidden')
    return http.request({
      ...options, protocol: 'http:', hostname: fixture.hostname, port: fixture.port, agent: undefined,
    }, ...rest)
  }
  return original.call(this, options, ...rest)
}
syncBuiltinESMExports()
