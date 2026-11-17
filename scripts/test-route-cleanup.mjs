import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { test } from 'node:test'

async function scenario (activeFailure = false) {
  const source = `
    import { chromium } from '@playwright/test';
    import { closeRoutedContext } from './scripts/close-routed-context.mjs';
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    let started, release;
    const requestStarted = new Promise(resolve => started = resolve);
    const gate = new Promise(resolve => release = resolve);
    await context.route('**/delayed', async route => {
      started(route);
      await gate;
      if (${activeFailure}) throw new Error('active request failed');
      await route.fulfill({ body: 'ready' });
    });
    await page.evaluate(() => { void fetch('http://127.0.0.1/delayed').catch(() => {}); });
    const route = await requestStarted;
    if (${activeFailure}) {
      release();
      await new Promise(resolve => setTimeout(resolve, 1000));
    } else {
      // Inject the lifecycle state observed in CI: the browser has already
      // handled an aborted request when its delayed proxy callback resumes.
      await route.abort();
      const closing = closeRoutedContext(context);
      release();
      await closing;
    }
    await browser.close();
  `
  const child = spawn(process.execPath, ['--unhandled-rejections=strict', '--input-type=module', '-e', source], { stdio: ['ignore', 'pipe', 'pipe'] })
  let output = ''
  child.stdout.on('data', (chunk) => {
    output += chunk
  })
  child.stderr.on('data', (chunk) => {
    output += chunk
  })
  const code = await new Promise((resolve, reject) => {
    child.once('error', reject)
    child.once('close', resolve)
  })
  return { code, output }
}

test('teardown tolerates a proxy completing an already aborted request', async () => {
  const result = await scenario()
  assert.equal(result.code, 0, result.output)
})

test('route errors during the functional scenario still fail the test', async () => {
  const result = await scenario(true)
  assert.notEqual(result.code, 0)
  assert.match(result.output, /active request failed/)
})
