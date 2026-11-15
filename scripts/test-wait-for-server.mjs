import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { test } from 'node:test'
import { waitForServer } from './wait-for-server.mjs'

test('accepts a healthy HTTP server without parsing colored CLI output', async () => {
  const server = createServer((request, response) => response.end('ready'))
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  try {
    await waitForServer(`http://127.0.0.1:${server.address().port}`, { exitCode: null }, {
      logs: () => '\u001b[2m┃\u001b[22m Local    \u001b[36mhttp://127.0.0.1/\u001b[39m', timeoutMs: 100,
    })
  } finally {
    await new Promise(resolve => server.close(resolve))
  }
})

test('does not treat a ready-looking log as a healthy server', async () => {
  const server = createServer((request, response) => {
    response.statusCode = 503
    response.end('starting')
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  try {
    await assert.rejects(waitForServer(`http://127.0.0.1:${server.address().port}`, { exitCode: null }, {
      logs: () => 'Local http://127.0.0.1/', timeoutMs: 80, intervalMs: 10,
    }), /timed out/)
  } finally {
    await new Promise(resolve => server.close(resolve))
  }
})

test('reports child process failure immediately', async () => {
  await assert.rejects(waitForServer('http://127.0.0.1:1', { exitCode: 7 }, {
    logs: () => 'fixture crashed', timeoutMs: 100,
  }), /exited.*7.*fixture crashed/s)
})
