# 프로덕션 스테이지 (빌드는 GitHub Actions에서 수행)
FROM node:20-alpine

WORKDIR /app

# pnpm 설치
RUN corepack enable && corepack prepare pnpm@latest --activate

# package.json 복사 (프로덕션 의존성만 설치하기 위해)
COPY package.json pnpm-lock.yaml ./

# 프로덕션 의존성만 설치
RUN pnpm install --prod --frozen-lockfile

# GitHub Actions에서 빌드된 파일 복사
COPY dist ./dist
COPY public ./public

# 포트 노출 (기본값 3000, 환경변수로 변경 가능)
EXPOSE 3000

# 환경변수 설정
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Astro SSR 서버 실행
CMD ["node", "dist/server/entry.mjs"]
