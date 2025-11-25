// @ts-check
import { defineConfig } from 'astro/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import react from '@astrojs/react';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 개발 환경에서만 HTTPS 설정 적용
let viteConfig = {};
if (import.meta.env.DEV) {
  try {
    viteConfig = {
      server: {
        https: {
          key: fs.readFileSync(path.resolve(__dirname, 'certs/time2gather-key.pem')),
          cert: fs.readFileSync(path.resolve(__dirname, 'certs/time2gather-cert.pem')),
        },
      },
    };
  } catch (error) {
    console.warn('HTTPS 인증서를 찾을 수 없습니다. HTTP로 실행됩니다.');
  }
}

export default defineConfig({
  site: process.env.SITE_URL || 'https://time2gather.com',
  integrations: [
    react(),
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
    }),
  ],
  output: "server",
  adapter: node({ mode: "standalone" }),
  server: { 
    port: 3000,
    host: true, // 같은 네트워크의 다른 기기에서 접근 가능
  },
  vite: viteConfig,
});