import { get } from 'node:http'

export async function waitForServer (url, child, { logs = () => '', timeoutMs = 30000, intervalMs = 100 } = {}) {
  if (!['127.0.0.1', 'localhost'].includes(new URL(url).hostname) || new URL(url).protocol !== 'http:') {
    throw new Error('Readiness checks require a local HTTP server')
  }
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    if (child.exitCode !== null || child.signalCode) {
      throw new Error(`Server exited (${child.exitCode ?? child.signalCode}): ${logs()}`)
    }
    const healthy = await new Promise((resolve) => {
      const request = get(url, (response) => {
        response.resume()
        resolve(response.statusCode >= 200 && response.statusCode < 400)
      })
      request.setTimeout(Math.min(1000, timeoutMs), () => request.destroy())
      request.on('error', () => resolve(false))
    })
    if (healthy) return
    await new Promise(resolve => setTimeout(resolve, intervalMs))
  }
  throw new Error(`Server readiness timed out: ${url}\n${logs()}`)
}
