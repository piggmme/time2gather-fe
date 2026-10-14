// @ts-check
import { defineConfig } from 'astro/config'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import react from '@astrojs/react'
import node from '@astrojs/node'
import sitemap from '@astrojs/sitemap'
import partytown from '@astrojs/partytown'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 개발 환경에서만 HTTPS 설정 적용
let viteServerConfig = {}
try {
  viteServerConfig = {
    https: {
      key: fs.readFileSync(path.resolve(__dirname, 'certs/time2gather-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, 'certs/time2gather-cert.pem')),
    },
  }
} catch {
  // 인증서 없으면 HTTP로 실행
}

// Vite 설정 - 환경 변수 명시적 주입
const viteConfig = {
  server: viteServerConfig,
}

export default defineConfig({
  site: process.env.SITE_URL || 'https://time2gather.org',
  integrations: [
    react(),
    partytown({
      config: {
        forward: ['dataLayer.push'],
      },
    }),
    sitemap({
      filter: (page) => {
        const pathname = new URL(page).pathname.replace(/\/$/, '') || '/'
        return !pathname.startsWith('/meetings/')
          && pathname !== '/meetings'
          && pathname !== '/my'
          && pathname !== '/404'
      },
    }),
  ],
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  server: {
    port: 3000,
    host: true, // 같은 네트워크의 다른 기기에서 접근 가능
  },
  vite: viteConfig,
})
