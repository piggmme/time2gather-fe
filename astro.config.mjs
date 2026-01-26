// @ts-check
import { defineConfig } from 'astro/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import react from '@astrojs/react';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';
import partytown from '@astrojs/partytown';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 개발 환경에서만 HTTPS 설정 적용
let viteServerConfig = {};
try {
  viteServerConfig = {
    https: {
      key: fs.readFileSync(path.resolve(__dirname, 'certs/time2gather-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, 'certs/time2gather-cert.pem')),
    },
  };
} catch (error) {
  // 인증서 없으면 HTTP로 실행
}

// Vite 설정 - 환경 변수 명시적 주입
const viteConfig = {
  server: viteServerConfig,
  define: {
    'import.meta.env.PUBLIC_KAKAO_REST_API_KEY': JSON.stringify(process.env.PUBLIC_KAKAO_REST_API_KEY || ''),
    'import.meta.env.PUBLIC_KAKAO_REDIRECT_URI': JSON.stringify(process.env.PUBLIC_KAKAO_REDIRECT_URI || ''),
    'import.meta.env.PUBLIC_GOOGLE_CLIENT_ID': JSON.stringify(process.env.PUBLIC_GOOGLE_CLIENT_ID || ''),
    'import.meta.env.PUBLIC_GOOGLE_REDIRECT_URI': JSON.stringify(process.env.PUBLIC_GOOGLE_REDIRECT_URI || ''),
  },
};

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
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      // Multi-language sitemap with hreflang
      i18n: {
        defaultLocale: 'ko',
        locales: {
          ko: 'ko-KR',
          en: 'en-US',
        },
      },
      // Custom priority for different page types
      serialize(item) {
        // Homepage gets highest priority
        if (item.url === 'https://time2gather.org/' || item.url === 'https://time2gather.org') {
          item.priority = 1.0;
          item.changefreq = 'daily';
        }
        // Meeting creation page
        else if (item.url.includes('/meetings/create')) {
          item.priority = 0.9;
          item.changefreq = 'weekly';
        }
        // Login page
        else if (item.url.includes('/login')) {
          item.priority = 0.6;
          item.changefreq = 'monthly';
        }
        // My page
        else if (item.url.includes('/my')) {
          item.priority = 0.5;
          item.changefreq = 'weekly';
        }
        // 404 page - exclude from sitemap
        else if (item.url.includes('/404')) {
          return undefined;
        }
        return item;
      },
      // Filter out pages that shouldn't be indexed
      filter: (page) => {
        // Exclude OAuth callback pages
        if (page.includes('/login/oauth2/')) {
          return false;
        }
        // Exclude 404 page
        if (page.includes('/404')) {
          return false;
        }
        return true;
      },
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